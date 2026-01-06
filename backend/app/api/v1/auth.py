import re
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.api.deps import DbSession, CurrentUser, OptionalCurrentUser
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, verify_telegram_auth
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.auth import Token, UserCreate, UserLogin, TelegramAuthData
from app.schemas.user import UserResponse, UserUpdate
from app.services.google_calendar import (
    get_google_auth_url,
    exchange_code_for_tokens,
    get_google_user_info,
    get_calendar_list,
)

router = APIRouter(prefix="/auth")


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from company name"""
    try:
        import transliterate
        slug = transliterate.translit(name, 'uk', reversed=True)
    except:
        slug = name
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'company'


async def get_unique_slug(db: DbSession, base_slug: str) -> str:
    """Generate unique slug by appending number if needed"""
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Company).where(Company.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: DbSession):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create company with unique slug
    base_slug = generate_slug(user_data.company_name)
    slug = await get_unique_slug(db, base_slug)

    company = Company(
        name=user_data.company_name,
        slug=slug,
        type=user_data.company_type,
    )
    db.add(company)
    await db.flush()

    # Create user
    user = User(
        company_id=company.id,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        telegram_id=user_data.telegram_id,
        role=UserRole.SPECIALIST,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(db: DbSession, form_data: OAuth2PasswordRequestForm = Depends()):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    # Check user exists, has password (not Telegram-only), and password is correct
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.post("/telegram", response_model=Token)
async def telegram_auth(auth_data: TelegramAuthData, db: DbSession):
    """
    Authenticate user via Telegram Login Widget.

    The widget sends user data with HMAC-SHA-256 signature.
    We verify the signature and return JWT token if user exists.
    """
    if not settings.DOCTOR_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram authentication not configured",
        )

    # Verify Telegram hash
    auth_dict = auth_data.model_dump()
    if not verify_telegram_auth(auth_dict, settings.DOCTOR_BOT_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data",
        )

    # Find user by telegram_id
    result = await db.execute(
        select(User).where(User.telegram_id == auth_data.id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register via Telegram bot first.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    # Update telegram_username if changed
    if auth_data.username and user.telegram_username != auth_data.username:
        user.telegram_username = auth_data.username
        await db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user


# ===== Google OAuth =====

# In-memory state storage (use Redis in production)
_google_oauth_states: dict[str, dict] = {}


class GoogleAuthUrl(BaseModel):
    url: str
    state: str


class GoogleCalendarInfo(BaseModel):
    connected: bool
    email: Optional[str] = None
    calendar_enabled: bool
    calendar_id: Optional[str] = None
    calendars: list[dict] = []


@router.get("/google/url", response_model=GoogleAuthUrl)
async def get_google_oauth_url(
    current_user: OptionalCurrentUser,
    action: str = Query("login", description="Action: 'login' or 'link'"),
    redirect_uri: Optional[str] = None,
):
    """
    Get Google OAuth authorization URL.

    action='login' - for logging in with Google
    action='link' - for linking Google account to existing user (requires auth)
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured",
        )

    state = secrets.token_urlsafe(32)
    _google_oauth_states[state] = {
        "action": action,
        "user_id": current_user.id if current_user else None,
        "redirect_uri": redirect_uri,
        "created_at": datetime.utcnow(),
    }

    # Clean old states (older than 10 minutes)
    cutoff = datetime.utcnow() - timedelta(minutes=10)
    _google_oauth_states.clear()
    _google_oauth_states[state] = {
        "action": action,
        "user_id": current_user.id if current_user else None,
        "redirect_uri": redirect_uri,
        "created_at": datetime.utcnow(),
    }

    url = get_google_auth_url(state, redirect_uri)
    return GoogleAuthUrl(url=url, state=state)


@router.get("/google/callback")
async def google_oauth_callback(
    code: str,
    state: str,
    db: DbSession,
):
    """
    Handle Google OAuth callback.

    This is called by Google after user authorizes.
    Redirects to frontend with token or error.
    """
    # Verify state
    state_data = _google_oauth_states.pop(state, None)
    if not state_data:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=invalid_state"
        )

    try:
        # Exchange code for tokens
        tokens = await exchange_code_for_tokens(code, state_data.get("redirect_uri"))
        access_token = tokens["access_token"]
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)

        # Get user info from Google
        google_user = await get_google_user_info(access_token)
        google_id = google_user["id"]
        google_email = google_user.get("email")

        action = state_data.get("action", "login")

        if action == "link" and state_data.get("user_id"):
            # Linking to existing user
            user = await db.get(User, state_data["user_id"])
            if not user:
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/profile?error=user_not_found"
                )

            # Check if Google account already linked to another user
            result = await db.execute(
                select(User).where(User.google_id == google_id, User.id != user.id)
            )
            if result.scalar_one_or_none():
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/profile?error=google_already_linked"
                )

            # Link Google account
            user.google_id = google_id
            user.google_email = google_email
            user.google_access_token = access_token
            user.google_refresh_token = refresh_token
            user.google_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            await db.commit()

            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/profile?google_linked=true"
            )

        else:
            # Login or register with Google
            # First, try to find user by google_id
            result = await db.execute(
                select(User).where(User.google_id == google_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                # Try to find by email
                if google_email:
                    result = await db.execute(
                        select(User).where(User.email == google_email)
                    )
                    user = result.scalar_one_or_none()
                    if user:
                        # Link Google to existing email user
                        user.google_id = google_id
                        user.google_email = google_email

            if not user:
                # Create new user
                first_name = google_user.get("given_name", google_email.split("@")[0] if google_email else "User")
                last_name = google_user.get("family_name", "")

                # Create company for new user
                base_slug = generate_slug(f"{first_name} {last_name}")
                slug = await get_unique_slug(db, base_slug)

                company = Company(
                    name=f"{first_name} {last_name}",
                    slug=slug,
                )
                db.add(company)
                await db.flush()

                user = User(
                    company_id=company.id,
                    email=google_email,
                    google_id=google_id,
                    google_email=google_email,
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.SPECIALIST,
                )
                db.add(user)

            # Update tokens
            user.google_access_token = access_token
            if refresh_token:
                user.google_refresh_token = refresh_token
            user.google_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

            await db.commit()
            await db.refresh(user)

            # Create JWT token
            jwt_token = create_access_token(data={"sub": str(user.id)})

            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?token={jwt_token}"
            )

    except Exception as e:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed&message={str(e)}"
        )


@router.get("/google/status", response_model=GoogleCalendarInfo)
async def get_google_status(current_user: CurrentUser, db: DbSession):
    """Get current user's Google connection status."""
    calendars = []

    if current_user.google_id and current_user.google_access_token:
        try:
            # Refresh token if needed
            from app.services.google_calendar import ensure_valid_token
            token = await ensure_valid_token(current_user, db)
            if token:
                calendars = await get_calendar_list(token)
        except Exception:
            pass

    return GoogleCalendarInfo(
        connected=bool(current_user.google_id),
        email=current_user.google_email,
        calendar_enabled=current_user.google_calendar_enabled,
        calendar_id=current_user.google_calendar_id,
        calendars=calendars,
    )


@router.post("/google/calendar/enable")
async def enable_google_calendar(
    current_user: CurrentUser,
    db: DbSession,
    calendar_id: str = Query("primary", description="Calendar ID to use"),
):
    """Enable Google Calendar sync for current user."""
    if not current_user.google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account not connected",
        )

    current_user.google_calendar_enabled = True
    current_user.google_calendar_id = calendar_id
    await db.commit()

    return {"message": "Google Calendar enabled", "calendar_id": calendar_id}


@router.post("/google/calendar/disable")
async def disable_google_calendar(current_user: CurrentUser, db: DbSession):
    """Disable Google Calendar sync for current user."""
    current_user.google_calendar_enabled = False
    await db.commit()
    return {"message": "Google Calendar disabled"}


@router.delete("/google/disconnect")
async def disconnect_google(current_user: CurrentUser, db: DbSession):
    """Disconnect Google account from current user."""
    current_user.google_id = None
    current_user.google_email = None
    current_user.google_access_token = None
    current_user.google_refresh_token = None
    current_user.google_token_expires_at = None
    current_user.google_calendar_enabled = False
    current_user.google_calendar_id = None
    await db.commit()
    return {"message": "Google account disconnected"}

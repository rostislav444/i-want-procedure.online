import re
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, verify_telegram_auth
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.auth import Token, UserCreate, UserLogin, TelegramAuthData
from app.schemas.user import UserResponse, UserUpdate

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
        role=UserRole.ADMIN,
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

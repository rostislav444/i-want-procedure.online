from typing import Annotated, Callable, Optional

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
    x_company_id: Annotated[Optional[str], Header(alias="X-Company-Id")] = None,
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .where(User.id == int(user_id))
        .options(selectinload(User.company_memberships))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    # Set selected company ID from header (overrides default company_id property)
    if x_company_id:
        selected_id = int(x_company_id)
        # Verify user has access to this company
        if any(m.company_id == selected_id and m.is_active for m in user.company_memberships):
            user._selected_company_id = selected_id
        else:
            user._selected_company_id = None
    else:
        user._selected_company_id = None

    return user


async def get_current_user_optional(
    token: Annotated[Optional[str], Depends(oauth2_scheme_optional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """Get current user or None if not authenticated."""
    if not token:
        return None

    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    result = await db.execute(
        select(User)
        .where(User.id == int(user_id))
        .options(selectinload(User.company_memberships))
    )
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[Optional[User], Depends(get_current_user_optional)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


# Access control helpers

def require_superadmin(current_user: CurrentUser) -> User:
    """Require user to be a superadmin."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
    return current_user


# Annotated versions for common checks
SuperadminUser = Annotated[User, Depends(require_superadmin)]

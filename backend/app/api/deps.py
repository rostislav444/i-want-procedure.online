from typing import Annotated, Callable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
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
        .options(selectinload(User.role_assignments))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

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
        .options(selectinload(User.role_assignments))
    )
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[Optional[User], Depends(get_current_user_optional)]
DbSession = Annotated[AsyncSession, Depends(get_db)]


# RBAC Helpers

def require_superadmin(current_user: CurrentUser) -> User:
    """Require user to be a superadmin."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
    return current_user


def require_role(required_role: UserRole) -> Callable:
    """Require user to have a specific role.

    Usage:
        @router.get("/endpoint")
        async def endpoint(user: User = Depends(require_role(UserRole.SPECIALIST))):
            ...
    """
    def checker(current_user: CurrentUser) -> User:
        if not current_user.has_role(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role.value}' required",
            )
        return current_user
    return checker


def require_any_role(*roles: UserRole) -> Callable:
    """Require user to have any of the specified roles.

    Usage:
        @router.get("/endpoint")
        async def endpoint(user: User = Depends(require_any_role(UserRole.SPECIALIST, UserRole.MANAGER))):
            ...
    """
    def checker(current_user: CurrentUser) -> User:
        if not any(current_user.has_role(role) for role in roles):
            role_names = ", ".join(r.value for r in roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of roles [{role_names}] required",
            )
        return current_user
    return checker


# Annotated versions for common role checks
SuperadminUser = Annotated[User, Depends(require_superadmin)]

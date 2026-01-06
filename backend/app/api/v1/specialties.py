"""
Specialties API - manage specialties/positions for company staff.
"""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.specialty import Specialty
from app.models.user import User
from app.schemas.specialty import (
    SpecialtyCreate,
    SpecialtyUpdate,
    SpecialtyResponse,
    SpecialtyWithUsers,
)

router = APIRouter(prefix="/specialties")


@router.get("", response_model=list[SpecialtyResponse])
async def list_specialties(
    db: DbSession,
    current_user: CurrentUser,
):
    """Get all specialties for current user's company."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a company",
        )

    result = await db.execute(
        select(Specialty)
        .where(Specialty.company_id == current_user.company_id)
        .order_by(Specialty.name)
    )
    specialties = result.scalars().all()
    return specialties


@router.get("/with-users", response_model=list[SpecialtyWithUsers])
async def list_specialties_with_users(
    db: DbSession,
    current_user: CurrentUser,
):
    """Get all specialties with associated users for current user's company."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a company",
        )

    result = await db.execute(
        select(Specialty)
        .where(Specialty.company_id == current_user.company_id)
        .options(selectinload(Specialty.users))
        .order_by(Specialty.name)
    )
    specialties = result.scalars().all()
    return specialties


@router.get("/{specialty_id}", response_model=SpecialtyWithUsers)
async def get_specialty(
    specialty_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Get a specific specialty by ID."""
    result = await db.execute(
        select(Specialty)
        .where(
            Specialty.id == specialty_id,
            Specialty.company_id == current_user.company_id,
        )
        .options(selectinload(Specialty.users))
    )
    specialty = result.scalar_one_or_none()

    if not specialty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialty not found",
        )

    return specialty


@router.post("", response_model=SpecialtyResponse, status_code=status.HTTP_201_CREATED)
async def create_specialty(
    data: SpecialtyCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """Create a new specialty for current user's company."""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a company",
        )

    specialty = Specialty(
        company_id=current_user.company_id,
        name=data.name,
        description=data.description,
        color=data.color,
    )
    db.add(specialty)
    await db.commit()
    await db.refresh(specialty)
    return specialty


@router.patch("/{specialty_id}", response_model=SpecialtyResponse)
async def update_specialty(
    specialty_id: int,
    data: SpecialtyUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    """Update a specialty."""
    result = await db.execute(
        select(Specialty).where(
            Specialty.id == specialty_id,
            Specialty.company_id == current_user.company_id,
        )
    )
    specialty = result.scalar_one_or_none()

    if not specialty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialty not found",
        )

    if data.name is not None:
        specialty.name = data.name
    if data.description is not None:
        specialty.description = data.description
    if data.color is not None:
        specialty.color = data.color

    await db.commit()
    await db.refresh(specialty)
    return specialty


@router.delete("/{specialty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specialty(
    specialty_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Delete a specialty."""
    result = await db.execute(
        select(Specialty).where(
            Specialty.id == specialty_id,
            Specialty.company_id == current_user.company_id,
        )
    )
    specialty = result.scalar_one_or_none()

    if not specialty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialty not found",
        )

    await db.delete(specialty)
    await db.commit()


@router.post("/{specialty_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def assign_user_to_specialty(
    specialty_id: int,
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Assign a user to a specialty (add specialty to user)."""
    # Get specialty
    spec_result = await db.execute(
        select(Specialty)
        .where(
            Specialty.id == specialty_id,
            Specialty.company_id == current_user.company_id,
        )
        .options(selectinload(Specialty.users))
    )
    specialty = spec_result.scalar_one_or_none()

    if not specialty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialty not found",
        )

    # Get user
    user = await db.get(User, user_id)
    if not user or user.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Add user to specialty if not already assigned
    if user not in specialty.users:
        specialty.users.append(user)
        await db.commit()


@router.delete("/{specialty_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_specialty(
    specialty_id: int,
    user_id: int,
    db: DbSession,
    current_user: CurrentUser,
):
    """Remove a user from a specialty."""
    # Get specialty
    spec_result = await db.execute(
        select(Specialty)
        .where(
            Specialty.id == specialty_id,
            Specialty.company_id == current_user.company_id,
        )
        .options(selectinload(Specialty.users))
    )
    specialty = spec_result.scalar_one_or_none()

    if not specialty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialty not found",
        )

    # Get user
    user = await db.get(User, user_id)
    if not user or user.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Remove user from specialty
    if user in specialty.users:
        specialty.users.remove(user)
        await db.commit()

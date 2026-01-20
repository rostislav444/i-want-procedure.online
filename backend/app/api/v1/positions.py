"""Positions API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.position import Position
from app.models.service import Service
from app.models.company import Company, CompanyType
from app.models.company_member import CompanyMember
from app.schemas.position import PositionCreate, PositionUpdate, PositionResponse


# Additional schemas for position details
class PositionServiceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    price: float
    is_active: bool

    class Config:
        from_attributes = True


class PositionSpecialistResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    bio: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class PositionDetailResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: Optional[str]
    color: Optional[str]
    order: int
    services: List[PositionServiceResponse]
    specialists: List[PositionSpecialistResponse]
    services_count: int
    specialists_count: int

    class Config:
        from_attributes = True

router = APIRouter(prefix="/positions", tags=["positions"])


async def get_user_membership(db: AsyncSession, user: User, company_id: int) -> CompanyMember | None:
    """Get user's membership in a company."""
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.user_id == user.id)
        .where(CompanyMember.company_id == company_id)
        .where(CompanyMember.is_active == True)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=List[PositionResponse])
async def get_positions(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all positions for a company."""
    # Verify user has access to company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Not authorized to access this company")

    # Get positions with services count
    result = await db.execute(
        select(
            Position,
            func.count(Service.id).label('services_count')
        )
        .outerjoin(Service, Service.position_id == Position.id)
        .where(Position.company_id == company_id)
        .group_by(Position.id)
        .order_by(Position.order, Position.name)
    )
    rows = result.all()

    positions = []
    for row in rows:
        position = row[0]
        services_count = row[1]
        response = PositionResponse(
            id=position.id,
            company_id=position.company_id,
            name=position.name,
            description=position.description,
            color=position.color,
            order=position.order,
            created_at=position.created_at,
            services_count=services_count
        )
        positions.append(response)

    return positions


@router.get("/{position_id}", response_model=PositionDetailResponse)
async def get_position(
    position_id: int,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get position details with services and specialists."""
    # Verify user has access to company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Not authorized to access this company")

    result = await db.execute(
        select(Position)
        .where(
            Position.id == position_id,
            Position.company_id == company_id
        )
    )
    position = result.scalar_one_or_none()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # Get services for this position
    services_result = await db.execute(
        select(Service).where(Service.position_id == position_id)
    )
    services = services_result.scalars().all()

    # Get specialists (members) for this position
    specialists_result = await db.execute(
        select(CompanyMember)
        .options(selectinload(CompanyMember.user))
        .where(
            CompanyMember.position_id == position_id,
            CompanyMember.company_id == company_id,
            CompanyMember.is_specialist == True
        )
    )
    members = specialists_result.scalars().all()

    specialists = []
    for m in members:
        specialists.append(PositionSpecialistResponse(
            id=m.id,
            first_name=m.user.first_name,
            last_name=m.user.last_name,
            email=m.user.email,
            phone=m.user.phone,
            bio=m.bio,
            is_active=m.is_active
        ))

    return PositionDetailResponse(
        id=position.id,
        company_id=position.company_id,
        name=position.name,
        description=position.description,
        color=position.color,
        order=position.order,
        services=[PositionServiceResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            duration_minutes=s.duration_minutes,
            price=float(s.price),
            is_active=s.is_active
        ) for s in services],
        specialists=specialists,
        services_count=len(services),
        specialists_count=len(specialists)
    )


@router.post("", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    position_data: PositionCreate,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new position. Only for clinics."""
    # Verify user has access to company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Not authorized to access this company")

    # Check company type
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()

    if not company or company.type != CompanyType.CLINIC:
        raise HTTPException(status_code=400, detail="Positions are only available for clinics")

    # Check if user has permission (owner or manager)
    if not current_user.is_superadmin:
        if not membership or not (membership.is_owner or membership.is_manager):
            raise HTTPException(status_code=403, detail="Not authorized to create positions")

    position = Position(
        company_id=company_id,
        name=position_data.name,
        description=position_data.description,
        color=position_data.color,
        order=position_data.order,
    )
    db.add(position)
    await db.commit()
    await db.refresh(position)

    return PositionResponse(
        id=position.id,
        company_id=position.company_id,
        name=position.name,
        description=position.description,
        color=position.color,
        order=position.order,
        created_at=position.created_at,
        services_count=0
    )


@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    position_data: PositionUpdate,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a position."""
    # Verify user has access to company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Not authorized to access this company")

    result = await db.execute(
        select(Position).where(
            Position.id == position_id,
            Position.company_id == company_id
        )
    )
    position = result.scalar_one_or_none()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # Check if user has permission (owner or manager)
    if not current_user.is_superadmin:
        if not membership or not (membership.is_owner or membership.is_manager):
            raise HTTPException(status_code=403, detail="Not authorized to update positions")

    # Update fields
    update_data = position_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(position, field, value)

    await db.commit()
    await db.refresh(position)

    # Get services count
    result = await db.execute(
        select(func.count(Service.id)).where(Service.position_id == position_id)
    )
    services_count = result.scalar() or 0

    return PositionResponse(
        id=position.id,
        company_id=position.company_id,
        name=position.name,
        description=position.description,
        color=position.color,
        order=position.order,
        created_at=position.created_at,
        services_count=services_count
    )


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: int,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a position."""
    # Verify user has access to company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Not authorized to access this company")

    result = await db.execute(
        select(Position).where(
            Position.id == position_id,
            Position.company_id == company_id
        )
    )
    position = result.scalar_one_or_none()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # Check if user has permission (owner or manager)
    if not current_user.is_superadmin:
        if not membership or not (membership.is_owner or membership.is_manager):
            raise HTTPException(status_code=403, detail="Not authorized to delete positions")

    await db.delete(position)
    await db.commit()

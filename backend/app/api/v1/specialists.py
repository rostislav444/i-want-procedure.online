"""
API endpoints for managing specialists in a company (clinic).

For clinics: managers can manage all specialists.
Specialists can only view/edit their own profile and services.
"""
from datetime import date
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.user import User
from app.models.company_member import CompanyMember, MemberService
from app.models.service import Service
from app.models.appointment import Appointment
from app.models.client import Client
from app.schemas.specialist import (
    SpecialistProfileResponse,
    SpecialistProfileUpdate,
    SpecialistListItem,
    SpecialistServiceResponse,
    AssignServicesRequest,
)

router = APIRouter(prefix="/specialists")


# ===== Helper Functions =====

async def get_specialist_stats(db: DbSession, member_id: int) -> dict:
    """Get stats for a company member (specialist)."""
    # Services count
    services_result = await db.execute(
        select(func.count(MemberService.id))
        .where(MemberService.member_id == member_id)
        .where(MemberService.is_active == True)
    )
    services_count = services_result.scalar() or 0

    # Unique clients count
    clients_result = await db.execute(
        select(func.count(func.distinct(Appointment.client_id)))
        .where(Appointment.member_id == member_id)
    )
    clients_count = clients_result.scalar() or 0

    # Today's appointments
    today = date.today()
    today_result = await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.member_id == member_id)
        .where(Appointment.date == today)
    )
    appointments_today = today_result.scalar() or 0

    return {
        "services_count": services_count,
        "clients_count": clients_count,
        "appointments_today": appointments_today,
    }


async def get_user_membership(db: DbSession, user: User, company_id: int) -> CompanyMember | None:
    """Get user's membership in a company."""
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.user_id == user.id)
        .where(CompanyMember.company_id == company_id)
        .where(CompanyMember.is_active == True)
    )
    return result.scalar_one_or_none()


def check_manager_access(current_membership: CompanyMember, target_member: CompanyMember, is_superadmin: bool = False) -> bool:
    """Check if current user can manage the target specialist."""
    # Same company check
    if current_membership.company_id != target_member.company_id:
        return False
    # Owner or manager can manage
    if current_membership.is_owner or current_membership.is_manager or is_superadmin:
        return True
    # User can manage themselves
    if target_member.user_id == current_membership.user_id:
        return True
    return False


# ===== List Specialists =====

@router.get("", response_model=list[SpecialistListItem])
async def get_specialists(
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
    include_inactive: bool = False,
):
    """
    Get all specialists in a company.
    Available to all authenticated users who are members of the company.
    """
    # Verify user is member of this company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    query = (
        select(CompanyMember)
        .options(
            selectinload(CompanyMember.user),
            selectinload(CompanyMember.position),
        )
        .where(CompanyMember.company_id == company_id)
        .where(CompanyMember.is_specialist == True)
    )

    if not include_inactive:
        query = query.where(CompanyMember.is_active == True)

    result = await db.execute(query.order_by(CompanyMember.created_at.desc()))
    members = result.scalars().all()

    # Build response with stats
    specialists = []
    for member in members:
        stats = await get_specialist_stats(db, member.id)
        specialists.append(SpecialistListItem(
            id=member.id,
            user_id=member.user_id,
            first_name=member.user.first_name,
            last_name=member.user.last_name,
            position=member.position.name if member.position else None,
            position_id=member.position_id,
            is_active=member.is_active,
            services_count=stats["services_count"],
            google_connected=member.user.google_refresh_token is not None,
        ))

    return specialists


# ===== Get Specialist Details =====

@router.get("/me", response_model=SpecialistProfileResponse)
async def get_my_specialist_profile(
    current_user: CurrentUser,
    db: DbSession,
    company_id: int | None = None,
):
    """Get current user's specialist profile in a company."""
    # Use user's primary company if not specified
    effective_company_id = company_id or current_user.company_id
    if not effective_company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No company found",
        )

    result = await db.execute(
        select(CompanyMember)
        .options(
            selectinload(CompanyMember.user),
            selectinload(CompanyMember.position),
        )
        .where(CompanyMember.user_id == current_user.id)
        .where(CompanyMember.company_id == effective_company_id)
        .where(CompanyMember.is_specialist == True)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist profile not found",
        )

    stats = await get_specialist_stats(db, member.id)

    return SpecialistProfileResponse(
        id=member.id,
        user_id=member.user_id,
        company_id=member.company_id,
        position=member.position.name if member.position else None,
        position_id=member.position_id,
        bio=member.bio,
        photo_url=member.photo_url,
        is_active=member.is_active,
        created_at=member.created_at,
        first_name=member.user.first_name,
        last_name=member.user.last_name,
        email=member.user.email,
        phone=member.user.phone,
        google_connected=member.user.google_refresh_token is not None,
        **stats,
    )


@router.get("/{specialist_id}", response_model=SpecialistProfileResponse)
async def get_specialist(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
):
    """Get a specific specialist's profile."""
    # Verify user has access to this company
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    result = await db.execute(
        select(CompanyMember)
        .options(
            selectinload(CompanyMember.user),
            selectinload(CompanyMember.position),
        )
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
        .where(CompanyMember.is_specialist == True)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    stats = await get_specialist_stats(db, member.id)

    return SpecialistProfileResponse(
        id=member.id,
        user_id=member.user_id,
        company_id=member.company_id,
        position=member.position.name if member.position else None,
        position_id=member.position_id,
        bio=member.bio,
        photo_url=member.photo_url,
        is_active=member.is_active,
        created_at=member.created_at,
        first_name=member.user.first_name,
        last_name=member.user.last_name,
        email=member.user.email,
        phone=member.user.phone,
        google_connected=member.user.google_refresh_token is not None,
        **stats,
    )


# ===== Update Specialist =====

@router.patch("/{specialist_id}", response_model=SpecialistProfileResponse)
async def update_specialist(
    specialist_id: int,
    update_data: SpecialistProfileUpdate,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
):
    """
    Update a specialist's profile.
    Managers can update any specialist. Specialists can only update themselves.
    """
    # Get current user's membership
    current_membership = await get_user_membership(db, current_user, company_id)
    if not current_membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    result = await db.execute(
        select(CompanyMember)
        .options(
            selectinload(CompanyMember.user),
            selectinload(CompanyMember.position),
        )
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Check access (handle superadmin case)
    if current_membership:
        if not check_manager_access(current_membership, member, current_user.is_superadmin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile",
            )
    elif not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(member, key, value)

    await db.commit()
    await db.refresh(member)

    stats = await get_specialist_stats(db, member.id)

    return SpecialistProfileResponse(
        id=member.id,
        user_id=member.user_id,
        company_id=member.company_id,
        position=member.position.name if member.position else None,
        position_id=member.position_id,
        bio=member.bio,
        photo_url=member.photo_url,
        is_active=member.is_active,
        created_at=member.created_at,
        first_name=member.user.first_name,
        last_name=member.user.last_name,
        email=member.user.email,
        phone=member.user.phone,
        google_connected=member.user.google_refresh_token is not None,
        **stats,
    )


# ===== Specialist Services =====

@router.get("/{specialist_id}/services", response_model=list[SpecialistServiceResponse])
async def get_specialist_services(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
):
    """Get all services assigned to a specialist."""
    # Verify user has access
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    # Verify specialist exists
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Get member services with service details
    result = await db.execute(
        select(MemberService)
        .options(selectinload(MemberService.service))
        .where(MemberService.member_id == specialist_id)
        .order_by(MemberService.created_at.desc())
    )
    member_services = result.scalars().all()

    return [
        SpecialistServiceResponse(
            id=ms.id,
            member_id=ms.member_id,
            service_id=ms.service_id,
            service_name=ms.service.name,
            service_price=ms.service.price,
            service_duration_minutes=ms.service.duration_minutes,
            custom_price=ms.custom_price,
            custom_duration_minutes=ms.custom_duration_minutes,
            is_active=ms.is_active,
            created_at=ms.created_at,
        )
        for ms in member_services
    ]


@router.post("/{specialist_id}/services", response_model=list[SpecialistServiceResponse])
async def assign_services_to_specialist(
    specialist_id: int,
    request: AssignServicesRequest,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
):
    """
    Assign services to a specialist. Replaces all existing assignments.
    Only managers can do this.
    """
    # Get current user's membership
    current_membership = await get_user_membership(db, current_user, company_id)
    if not current_membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    # Verify specialist exists
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Check manager access
    if current_membership and not (current_membership.is_owner or current_membership.is_manager):
        if not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only managers can assign services",
            )

    # Verify all services belong to the company
    result = await db.execute(
        select(Service)
        .where(Service.id.in_(request.service_ids))
        .where(Service.company_id == company_id)
    )
    valid_services = result.scalars().all()
    valid_service_ids = {s.id for s in valid_services}

    invalid_ids = set(request.service_ids) - valid_service_ids
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Services not found: {invalid_ids}",
        )

    # Remove existing assignments
    await db.execute(
        delete(MemberService)
        .where(MemberService.member_id == specialist_id)
    )

    # Create new assignments
    for service_id in request.service_ids:
        ms = MemberService(
            member_id=specialist_id,
            service_id=service_id,
        )
        db.add(ms)

    await db.commit()

    # Reload with service details
    result = await db.execute(
        select(MemberService)
        .options(selectinload(MemberService.service))
        .where(MemberService.member_id == specialist_id)
    )
    member_services = result.scalars().all()

    return [
        SpecialistServiceResponse(
            id=ms.id,
            member_id=ms.member_id,
            service_id=ms.service_id,
            service_name=ms.service.name,
            service_price=ms.service.price,
            service_duration_minutes=ms.service.duration_minutes,
            custom_price=ms.custom_price,
            custom_duration_minutes=ms.custom_duration_minutes,
            is_active=ms.is_active,
            created_at=ms.created_at,
        )
        for ms in member_services
    ]


@router.delete("/{specialist_id}/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_service_from_specialist(
    specialist_id: int,
    service_id: int,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
):
    """Remove a specific service from a specialist."""
    # Get current user's membership
    current_membership = await get_user_membership(db, current_user, company_id)
    if not current_membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    # Verify specialist exists
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Check access
    if current_membership and not check_manager_access(current_membership, member, current_user.is_superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can remove services",
        )

    # Find and delete the assignment
    result = await db.execute(
        select(MemberService)
        .where(MemberService.member_id == specialist_id)
        .where(MemberService.service_id == service_id)
    )
    member_service = result.scalar_one_or_none()

    if not member_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not assigned to this specialist",
        )

    await db.delete(member_service)
    await db.commit()


# ===== Specialist Appointments =====

@router.get("/{specialist_id}/appointments")
async def get_specialist_appointments(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
    date_from: date | None = None,
    date_to: date | None = None,
):
    """Get appointments for a specific specialist."""
    # Verify user has access
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    # Verify specialist exists
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Build query
    query = (
        select(Appointment)
        .options(
            selectinload(Appointment.service),
            selectinload(Appointment.client),
        )
        .where(Appointment.member_id == specialist_id)
    )

    if date_from:
        query = query.where(Appointment.date >= date_from)
    if date_to:
        query = query.where(Appointment.date <= date_to)

    query = query.order_by(Appointment.date.desc(), Appointment.start_time.desc())

    result = await db.execute(query)
    appointments = result.scalars().all()

    return appointments


# ===== Specialist Clients =====

@router.get("/{specialist_id}/clients")
async def get_specialist_clients(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
    company_id: int,
):
    """Get unique clients who have had appointments with this specialist."""
    # Verify user has access
    membership = await get_user_membership(db, current_user, company_id)
    if not membership and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this company",
        )

    # Verify specialist exists
    result = await db.execute(
        select(CompanyMember)
        .where(CompanyMember.id == specialist_id)
        .where(CompanyMember.company_id == company_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Get unique clients from appointments
    result = await db.execute(
        select(Client)
        .join(Appointment, Appointment.client_id == Client.id)
        .where(Appointment.member_id == specialist_id)
        .distinct()
        .order_by(Client.last_name, Client.first_name)
    )
    clients = result.scalars().all()

    return clients

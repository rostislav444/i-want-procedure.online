"""
API endpoints for managing specialists in a company (clinic).

For clinics: managers can manage all specialists.
Specialists can only view/edit their own profile and services.
"""
from datetime import date
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser, require_any_role
from app.models.user import User, UserRole
from app.models.profiles import SpecialistProfile, SpecialistService
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

async def get_specialist_stats(db: DbSession, specialist_profile_id: int) -> dict:
    """Get stats for a specialist profile."""
    # Services count
    services_result = await db.execute(
        select(func.count(SpecialistService.id))
        .where(SpecialistService.specialist_profile_id == specialist_profile_id)
        .where(SpecialistService.is_active == True)
    )
    services_count = services_result.scalar() or 0

    # Unique clients count
    clients_result = await db.execute(
        select(func.count(func.distinct(Appointment.client_id)))
        .where(Appointment.specialist_profile_id == specialist_profile_id)
    )
    clients_count = clients_result.scalar() or 0

    # Today's appointments
    today = date.today()
    today_result = await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.specialist_profile_id == specialist_profile_id)
        .where(Appointment.date == today)
    )
    appointments_today = today_result.scalar() or 0

    return {
        "services_count": services_count,
        "clients_count": clients_count,
        "appointments_today": appointments_today,
    }


def check_manager_access(current_user: User, target_specialist_profile: SpecialistProfile) -> bool:
    """Check if current user can manage the target specialist."""
    # Same company check
    if current_user.company_id != target_specialist_profile.company_id:
        return False
    # Manager or owner can manage
    if current_user.has_role(UserRole.MANAGER) or current_user.is_superadmin:
        return True
    # Specialist can manage themselves
    if target_specialist_profile.user_id == current_user.id:
        return True
    return False


# ===== List Specialists =====

@router.get("", response_model=list[SpecialistListItem])
async def get_specialists(
    current_user: CurrentUser,
    db: DbSession,
    include_inactive: bool = False,
):
    """
    Get all specialists in the current user's company.
    Available to all authenticated users in the company.
    """
    query = (
        select(SpecialistProfile)
        .options(selectinload(SpecialistProfile.user))
        .where(SpecialistProfile.company_id == current_user.company_id)
    )

    if not include_inactive:
        query = query.where(SpecialistProfile.is_active == True)

    result = await db.execute(query.order_by(SpecialistProfile.created_at.desc()))
    profiles = result.scalars().all()

    # Build response with stats
    specialists = []
    for profile in profiles:
        stats = await get_specialist_stats(db, profile.id)
        specialists.append(SpecialistListItem(
            id=profile.id,
            user_id=profile.user_id,
            first_name=profile.user.first_name,
            last_name=profile.user.last_name,
            position=profile.position,
            is_active=profile.is_active,
            services_count=stats["services_count"],
            google_connected=profile.user.google_refresh_token is not None,
        ))

    return specialists


# ===== Get Specialist Details =====

@router.get("/me", response_model=SpecialistProfileResponse)
async def get_my_specialist_profile(
    current_user: CurrentUser,
    db: DbSession,
):
    """Get current user's specialist profile in their company."""
    result = await db.execute(
        select(SpecialistProfile)
        .options(selectinload(SpecialistProfile.user))
        .where(SpecialistProfile.user_id == current_user.id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist profile not found",
        )

    stats = await get_specialist_stats(db, profile.id)

    return SpecialistProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        company_id=profile.company_id,
        position=profile.position,
        bio=profile.bio,
        is_active=profile.is_active,
        created_at=profile.created_at,
        first_name=profile.user.first_name,
        last_name=profile.user.last_name,
        email=profile.user.email,
        phone=profile.user.phone,
        google_connected=profile.user.google_refresh_token is not None,
        **stats,
    )


@router.get("/{specialist_id}", response_model=SpecialistProfileResponse)
async def get_specialist(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get a specific specialist's profile."""
    result = await db.execute(
        select(SpecialistProfile)
        .options(selectinload(SpecialistProfile.user))
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    stats = await get_specialist_stats(db, profile.id)

    return SpecialistProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        company_id=profile.company_id,
        position=profile.position,
        bio=profile.bio,
        is_active=profile.is_active,
        created_at=profile.created_at,
        first_name=profile.user.first_name,
        last_name=profile.user.last_name,
        email=profile.user.email,
        phone=profile.user.phone,
        google_connected=profile.user.google_refresh_token is not None,
        **stats,
    )


# ===== Update Specialist =====

@router.patch("/{specialist_id}", response_model=SpecialistProfileResponse)
async def update_specialist(
    specialist_id: int,
    update_data: SpecialistProfileUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Update a specialist's profile.
    Managers can update any specialist. Specialists can only update themselves.
    """
    result = await db.execute(
        select(SpecialistProfile)
        .options(selectinload(SpecialistProfile.user))
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    if not check_manager_access(current_user, profile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile",
        )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)

    stats = await get_specialist_stats(db, profile.id)

    return SpecialistProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        company_id=profile.company_id,
        position=profile.position,
        bio=profile.bio,
        is_active=profile.is_active,
        created_at=profile.created_at,
        first_name=profile.user.first_name,
        last_name=profile.user.last_name,
        email=profile.user.email,
        phone=profile.user.phone,
        google_connected=profile.user.google_refresh_token is not None,
        **stats,
    )


# ===== Specialist Services =====

@router.get("/{specialist_id}/services", response_model=list[SpecialistServiceResponse])
async def get_specialist_services(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get all services assigned to a specialist."""
    # Verify specialist exists and is in same company
    result = await db.execute(
        select(SpecialistProfile)
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Get specialist services with service details
    result = await db.execute(
        select(SpecialistService)
        .options(selectinload(SpecialistService.service))
        .where(SpecialistService.specialist_profile_id == specialist_id)
        .order_by(SpecialistService.created_at.desc())
    )
    specialist_services = result.scalars().all()

    return [
        SpecialistServiceResponse(
            id=ss.id,
            specialist_profile_id=ss.specialist_profile_id,
            service_id=ss.service_id,
            service_name=ss.service.name,
            service_price=ss.service.price,
            service_duration_minutes=ss.service.duration_minutes,
            custom_price=ss.custom_price,
            custom_duration_minutes=ss.custom_duration_minutes,
            is_active=ss.is_active,
            created_at=ss.created_at,
        )
        for ss in specialist_services
    ]


@router.post("/{specialist_id}/services", response_model=list[SpecialistServiceResponse])
async def assign_services_to_specialist(
    specialist_id: int,
    request: AssignServicesRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Assign services to a specialist. Replaces all existing assignments.
    Only managers can do this.
    """
    # Verify specialist exists and is in same company
    result = await db.execute(
        select(SpecialistProfile)
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Check manager access (specialists can't assign services to themselves)
    if not current_user.has_role(UserRole.MANAGER) and not current_user.is_superadmin:
        # Check if specialist is trying to assign to themselves
        if profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only managers can assign services",
            )

    # Verify all services belong to the company
    result = await db.execute(
        select(Service)
        .where(Service.id.in_(request.service_ids))
        .where(Service.company_id == current_user.company_id)
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
        select(SpecialistService)
        .where(SpecialistService.specialist_profile_id == specialist_id)
    )
    # Actually delete them
    from sqlalchemy import delete
    await db.execute(
        delete(SpecialistService)
        .where(SpecialistService.specialist_profile_id == specialist_id)
    )

    # Create new assignments
    new_assignments = []
    for service_id in request.service_ids:
        ss = SpecialistService(
            specialist_profile_id=specialist_id,
            service_id=service_id,
        )
        db.add(ss)
        new_assignments.append(ss)

    await db.commit()

    # Reload with service details
    result = await db.execute(
        select(SpecialistService)
        .options(selectinload(SpecialistService.service))
        .where(SpecialistService.specialist_profile_id == specialist_id)
    )
    specialist_services = result.scalars().all()

    return [
        SpecialistServiceResponse(
            id=ss.id,
            specialist_profile_id=ss.specialist_profile_id,
            service_id=ss.service_id,
            service_name=ss.service.name,
            service_price=ss.service.price,
            service_duration_minutes=ss.service.duration_minutes,
            custom_price=ss.custom_price,
            custom_duration_minutes=ss.custom_duration_minutes,
            is_active=ss.is_active,
            created_at=ss.created_at,
        )
        for ss in specialist_services
    ]


@router.delete("/{specialist_id}/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_service_from_specialist(
    specialist_id: int,
    service_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Remove a specific service from a specialist."""
    # Verify specialist exists and is in same company
    result = await db.execute(
        select(SpecialistProfile)
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Check access
    if not check_manager_access(current_user, profile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can remove services",
        )

    # Find and delete the assignment
    result = await db.execute(
        select(SpecialistService)
        .where(SpecialistService.specialist_profile_id == specialist_id)
        .where(SpecialistService.service_id == service_id)
    )
    specialist_service = result.scalar_one_or_none()

    if not specialist_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not assigned to this specialist",
        )

    await db.delete(specialist_service)
    await db.commit()


# ===== Specialist Appointments =====

@router.get("/{specialist_id}/appointments")
async def get_specialist_appointments(
    specialist_id: int,
    current_user: CurrentUser,
    db: DbSession,
    date_from: date | None = None,
    date_to: date | None = None,
):
    """Get appointments for a specific specialist."""
    # Verify specialist exists and is in same company
    result = await db.execute(
        select(SpecialistProfile)
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
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
        .where(Appointment.specialist_profile_id == specialist_id)
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
):
    """Get unique clients who have had appointments with this specialist."""
    # Verify specialist exists and is in same company
    result = await db.execute(
        select(SpecialistProfile)
        .where(SpecialistProfile.id == specialist_id)
        .where(SpecialistProfile.company_id == current_user.company_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialist not found",
        )

    # Get unique clients from appointments
    result = await db.execute(
        select(Client)
        .join(Appointment, Appointment.client_id == Client.id)
        .where(Appointment.specialist_profile_id == specialist_id)
        .distinct()
        .order_by(Client.last_name, Client.first_name)
    )
    clients = result.scalars().all()

    return clients

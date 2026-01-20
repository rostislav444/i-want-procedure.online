from datetime import time

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.company import Company, generate_slug
from app.models.user import User
from app.models.company_member import CompanyMember
from app.models.schedule import Schedule
from app.schemas.company import CompanyResponse, CompanyUpdate, CompanyCreate, CompanyMembershipResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/companies")


def get_user_company_id(user: User) -> int | None:
    """Get user's first company ID (for backwards compatibility)."""
    if user.company_memberships:
        return user.company_memberships[0].company_id
    return None


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


@router.get("/my-memberships", response_model=list[CompanyMembershipResponse])
async def get_my_company_memberships(current_user: CurrentUser, db: DbSession):
    """Get all companies the user is a member of, with role info."""
    result = await db.execute(
        select(CompanyMember)
        .options(selectinload(CompanyMember.company))
        .where(CompanyMember.user_id == current_user.id)
        .where(CompanyMember.is_active == True)
    )
    memberships = result.scalars().all()

    return [
        CompanyMembershipResponse(
            id=m.company.id,
            name=m.company.name,
            slug=m.company.slug,
            type=m.company.type,
            logo_url=m.company.logo_url,
            is_owner=m.is_owner,
            is_manager=m.is_manager,
            is_specialist=m.is_specialist,
        )
        for m in memberships
    ]


@router.post("/me", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_my_company(company_data: CompanyCreate, current_user: CurrentUser, db: DbSession):
    """Create a company for the current user (if they don't have one)"""
    company_id = get_user_company_id(current_user)
    if company_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a company",
        )

    # Generate unique slug
    base_slug = generate_slug(company_data.name)
    slug = await get_unique_slug(db, base_slug)

    # Create company
    company = Company(
        name=company_data.name,
        slug=slug,
        type=company_data.type,
    )
    db.add(company)
    await db.flush()

    # Create company membership (owner + manager + specialist for FOP)
    member = CompanyMember(
        user_id=current_user.id,
        company_id=company.id,
        is_owner=True,
        is_manager=True,
        is_specialist=True,
        is_active=True,
    )
    db.add(member)

    # Create default schedule for the user (Mon-Fri 9:00-18:00)
    default_schedules = []
    for day in range(7):
        is_working = day < 5  # Mon-Fri working, Sat-Sun off
        schedule = Schedule(
            doctor_id=current_user.id,
            day_of_week=day,
            start_time=time(9, 0) if is_working else time(0, 0),
            end_time=time(18, 0) if is_working else time(0, 0),
            is_working_day=is_working,
        )
        default_schedules.append(schedule)
    db.add_all(default_schedules)

    await db.commit()
    await db.refresh(company)

    return company


@router.get("/me", response_model=CompanyResponse)
async def get_my_company(current_user: CurrentUser, db: DbSession):
    company_id = get_user_company_id(current_user)
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a company yet",
        )
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    return result.scalar_one()


@router.patch("/me", response_model=CompanyResponse)
async def update_my_company(
    company_data: CompanyUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    company_id = get_user_company_id(current_user)
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a company yet",
        )
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one()

    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    return company


@router.get("/me/doctors", response_model=list[UserResponse])
async def get_company_doctors(current_user: CurrentUser, db: DbSession):
    company_id = get_user_company_id(current_user)
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a company yet",
        )
    # Get users who are members of the company
    result = await db.execute(
        select(User)
        .join(CompanyMember, CompanyMember.user_id == User.id)
        .where(CompanyMember.company_id == company_id)
        .where(CompanyMember.is_active == True)
    )
    return result.scalars().all()

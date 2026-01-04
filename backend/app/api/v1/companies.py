from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.company import Company, generate_slug
from app.models.user import User
from app.schemas.company import CompanyResponse, CompanyUpdate, CompanyCreate
from app.schemas.user import UserResponse

router = APIRouter(prefix="/companies")


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


@router.post("/me", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_my_company(company_data: CompanyCreate, current_user: CurrentUser, db: DbSession):
    """Create a company for the current user (if they don't have one)"""
    if current_user.company_id is not None:
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

    # Assign company to user
    current_user.company_id = company.id
    await db.commit()
    await db.refresh(company)

    return company


@router.get("/me", response_model=CompanyResponse)
async def get_my_company(current_user: CurrentUser, db: DbSession):
    if current_user.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a company yet",
        )
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    return result.scalar_one()


@router.patch("/me", response_model=CompanyResponse)
async def update_my_company(
    company_data: CompanyUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
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
    result = await db.execute(
        select(User).where(User.company_id == current_user.company_id)
    )
    return result.scalars().all()

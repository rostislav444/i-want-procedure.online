from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/companies")


@router.get("/me", response_model=CompanyResponse)
async def get_my_company(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    return result.scalar_one()


@router.get("/me/doctors", response_model=list[UserResponse])
async def get_company_doctors(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(User).where(User.company_id == current_user.company_id)
    )
    return result.scalars().all()

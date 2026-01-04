"""Public API endpoints for the showcase site (no authentication required)"""
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models.company import Company
from app.models.service import Service, ServiceCategory
from app.schemas.company import CompanyPublicResponse
from app.schemas.service import ServiceResponse, ServiceCategoryTreeResponse

router = APIRouter(prefix="/public")


@router.get("/companies/{slug}", response_model=CompanyPublicResponse)
async def get_company_by_slug(slug: str, db: DbSession):
    """Get company by slug for public display"""
    result = await db.execute(
        select(Company).where(Company.slug == slug)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/companies/{slug}/services", response_model=list[ServiceResponse])
async def get_company_services(slug: str, db: DbSession):
    """Get all active services for a company"""
    # First get the company
    result = await db.execute(
        select(Company).where(Company.slug == slug)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get active services
    result = await db.execute(
        select(Service)
        .where(Service.company_id == company.id, Service.is_active == True)
        .options(selectinload(Service.category))
        .order_by(Service.category_id, Service.name)
    )
    return result.scalars().all()


@router.get("/companies/{slug}/categories", response_model=list[ServiceCategoryTreeResponse])
async def get_company_categories(slug: str, db: DbSession):
    """Get service categories for a company in tree structure"""
    # First get the company
    result = await db.execute(
        select(Company).where(Company.slug == slug)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get all categories
    result = await db.execute(
        select(ServiceCategory)
        .where(ServiceCategory.company_id == company.id)
        .order_by(ServiceCategory.order)
    )
    all_categories = result.scalars().all()

    # Build tree structure
    def build_tree(parent_id: int | None) -> list:
        children = []
        for cat in all_categories:
            if cat.parent_id == parent_id:
                cat_dict = {
                    "id": cat.id,
                    "company_id": cat.company_id,
                    "parent_id": cat.parent_id,
                    "name": cat.name,
                    "description": cat.description,
                    "order": cat.order,
                    "created_at": cat.created_at,
                    "children": build_tree(cat.id)
                }
                children.append(cat_dict)
        return children

    return build_tree(None)

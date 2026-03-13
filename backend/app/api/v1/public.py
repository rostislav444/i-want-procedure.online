"""Public API endpoints for the showcase site (no authentication required)"""
import math

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.service import Service
from app.models.global_catalog import GlobalServiceCategory
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import User
from app.models.position import Position
from app.models.website_section import WebsiteSection
from app.schemas.company import CompanyPublicResponse, MarketplaceCompanyResponse, MarketplaceResponse
from app.schemas.city import CityShort
from app.schemas.service import ServiceResponse
from app.schemas.global_catalog import GlobalCategoryTreeResponse
from app.schemas.website_section import WebsiteSectionResponse

router = APIRouter(prefix="/public")


# ── Marketplace endpoints ──────────────────────────────────────────


def _marketplace_base_query():
    """Base query for marketplace: website_enabled + active/trial subscription (or no subscription yet). Excludes educator companies."""
    return (
        select(Company)
        .outerjoin(Subscription, Subscription.company_id == Company.id)
        .where(
            Company.website_enabled == True,
            Company.type != 'educator',
            or_(
                Subscription.status.in_([SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE]),
                Subscription.id == None,
            ),
        )
    )


@router.get("/marketplace", response_model=MarketplaceResponse)
async def get_marketplace(
    db: DbSession,
    q: str | None = Query(None, description="Search by name"),
    city_id: int | None = Query(None),
    industry_theme: str | None = Query(None),
    type: str | None = Query(None, description="solo or clinic"),
    category_id: int | None = Query(None, description="Global category ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """List companies for the marketplace with filtering and pagination."""
    query = _marketplace_base_query()

    if q:
        query = query.where(Company.name.ilike(f"%{q}%"))
    if city_id:
        query = query.where(Company.city_id == city_id)
    if industry_theme:
        query = query.where(Company.industry_theme == industry_theme)
    if type:
        query = query.where(Company.type == type)
    if category_id:
        subq = (
            select(Service.company_id)
            .where(Service.global_category_id == category_id, Service.is_active == True)
            .distinct()
            .scalar_subquery()
        )
        query = query.where(Company.id.in_(subq))

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = math.ceil(total / page_size) if total else 0

    # Fetch paginated companies
    query = query.order_by(Company.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    companies = result.scalars().all()

    if not companies:
        return MarketplaceResponse(items=[], total=total, page=page, page_size=page_size, total_pages=total_pages)

    company_ids = [c.id for c in companies]

    # Aggregates: services_count, min_price, max_price per company
    agg_result = await db.execute(
        select(
            Service.company_id,
            func.count(Service.id).label("cnt"),
            func.min(Service.price).label("min_p"),
            func.max(Service.price).label("max_p"),
        )
        .where(Service.company_id.in_(company_ids), Service.is_active == True)
        .group_by(Service.company_id)
    )
    agg_map = {r.company_id: r for r in agg_result}

    # Categories per company
    cat_result = await db.execute(
        select(Service.company_id, GlobalServiceCategory.name)
        .join(GlobalServiceCategory, GlobalServiceCategory.id == Service.global_category_id)
        .where(Service.company_id.in_(company_ids), Service.is_active == True)
        .distinct()
    )
    cat_map: dict[int, list[str]] = {}
    for row in cat_result:
        cat_map.setdefault(row[0], []).append(row[1])

    items = []
    for c in companies:
        agg = agg_map.get(c.id)
        city_info = None
        if c.city_ref:
            city_info = CityShort.model_validate(c.city_ref)
        items.append(MarketplaceCompanyResponse(
            id=c.id,
            name=c.name,
            slug=c.slug,
            type=c.type,
            description=c.description,
            logo_url=c.logo_url,
            cover_image_url=c.cover_image_url,
            specialization=c.specialization,
            industry_theme=c.industry_theme,
            city_info=city_info,
            social_links=c.social_links,
            services_count=agg.cnt if agg else 0,
            min_price=agg.min_p if agg else None,
            max_price=agg.max_p if agg else None,
            categories=cat_map.get(c.id, []),
        ))

    return MarketplaceResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/marketplace/cities", response_model=list[CityShort])
async def get_marketplace_cities(db: DbSession):
    """Get cities that have companies on the marketplace."""
    from app.models.city import City

    subq = (
        _marketplace_base_query()
        .with_only_columns(Company.city_id)
        .where(Company.city_id.is_not(None))
        .distinct()
        .scalar_subquery()
    )
    result = await db.execute(
        select(City)
        .where(City.id.in_(subq))
        .order_by(City.name)
    )
    cities = result.scalars().all()
    return [CityShort.model_validate(c) for c in cities]


@router.get("/marketplace/categories")
async def get_marketplace_categories(db: DbSession):
    """Get global categories used by marketplace companies."""
    company_ids_subq = (
        _marketplace_base_query()
        .with_only_columns(Company.id)
        .scalar_subquery()
    )
    result = await db.execute(
        select(GlobalServiceCategory.id, GlobalServiceCategory.name, GlobalServiceCategory.icon)
        .where(
            GlobalServiceCategory.is_active == True,
            GlobalServiceCategory.id.in_(
                select(Service.global_category_id)
                .where(
                    Service.company_id.in_(company_ids_subq),
                    Service.is_active == True,
                    Service.global_category_id.is_not(None),
                )
                .distinct()
                .scalar_subquery()
            ),
        )
        .order_by(GlobalServiceCategory.order)
    )
    return [{"id": r.id, "name": r.name, "icon": r.icon} for r in result]


# ── Company showcase endpoints ─────────────────────────────────────


async def _resolve_company(slug: str, db: DbSession) -> Company:
    """Resolve company by '{id}-{slug}' or plain slug."""
    company = None
    # Try {id}-{slug} format first
    if "-" in slug:
        parts = slug.split("-", 1)
        if parts[0].isdigit():
            company_id = int(parts[0])
            result = await db.execute(select(Company).where(Company.id == company_id))
            company = result.scalar_one_or_none()
    # Fallback to plain slug lookup
    if not company:
        result = await db.execute(select(Company).where(Company.slug == slug))
        company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/companies/{slug}", response_model=CompanyPublicResponse)
async def get_company_by_slug(slug: str, db: DbSession):
    """Get company by slug for public display"""
    company = await _resolve_company(slug, db)
    return CompanyPublicResponse.from_company(company)


@router.get("/companies/{slug}/services", response_model=list[ServiceResponse])
async def get_company_services(slug: str, db: DbSession):
    """Get all active services for a company"""
    company = await _resolve_company(slug, db)

    # Get active services
    result = await db.execute(
        select(Service)
        .where(Service.company_id == company.id, Service.is_active == True)
        .options(
            selectinload(Service.global_category),
            selectinload(Service.specialty),
            selectinload(Service.price_options),
        )
        .order_by(Service.global_category_id, Service.name)
    )
    return result.scalars().all()


@router.get("/companies/{slug}/categories", response_model=list[GlobalCategoryTreeResponse])
async def get_company_categories(slug: str, db: DbSession):
    """Get global service categories used by this company"""
    company = await _resolve_company(slug, db)

    # Get category IDs used by this company's services
    services_result = await db.execute(
        select(Service.global_category_id)
        .where(Service.company_id == company.id, Service.is_active == True)
        .distinct()
    )
    used_cat_ids = {r[0] for r in services_result if r[0] is not None}

    if not used_cat_ids:
        return []

    # Get all global categories and filter to those used
    result = await db.execute(
        select(GlobalServiceCategory)
        .where(GlobalServiceCategory.is_active == True)
        .order_by(GlobalServiceCategory.order)
    )
    all_categories = result.scalars().all()

    # Collect parent IDs needed
    cat_by_id = {c.id: c for c in all_categories}
    needed_ids = set(used_cat_ids)
    for cat_id in used_cat_ids:
        cat = cat_by_id.get(cat_id)
        while cat and cat.parent_id:
            needed_ids.add(cat.parent_id)
            cat = cat_by_id.get(cat.parent_id)

    # Build tree from needed categories
    def build_tree(parent_id: int | None) -> list:
        children = []
        for cat in all_categories:
            if cat.parent_id == parent_id and cat.id in needed_ids:
                children.append({
                    "id": cat.id,
                    "parent_id": cat.parent_id,
                    "name": cat.name,
                    "name_en": cat.name_en,
                    "description": cat.description,
                    "icon": cat.icon,
                    "order": cat.order,
                    "is_active": cat.is_active,
                    "is_ai_created": cat.is_ai_created,
                    "children": build_tree(cat.id),
                    "templates": [],
                })
        return sorted(children, key=lambda x: x["order"])

    return build_tree(None)


@router.get("/companies/{slug}/team")
async def get_company_team(slug: str, db: DbSession):
    """Get public team members for a company."""
    company = await _resolve_company(slug, db)

    result = await db.execute(
        select(CompanyMember)
        .where(
            CompanyMember.company_id == company.id,
            CompanyMember.is_active == True,
        )
        .options(
            selectinload(CompanyMember.user),
            selectinload(CompanyMember.position),
        )
        .order_by(CompanyMember.is_owner.desc(), CompanyMember.created_at)
    )
    members = result.scalars().all()

    return [
        {
            "id": m.id,
            "name": f"{m.user.first_name or ''} {m.user.last_name or ''}".strip() or "Спеціаліст",
            "position": m.position.name if m.position else (
                "Власник" if m.is_owner else ("Менеджер" if m.is_manager else "Спеціаліст")
            ),
            "bio": m.bio,
            "photo_url": m.photo_url,
            "is_owner": m.is_owner,
        }
        for m in members
    ]


@router.get("/companies/{slug}/website-sections", response_model=list[WebsiteSectionResponse])
async def get_company_website_sections(slug: str, db: DbSession):
    """Get visible website sections for a company"""
    company = await _resolve_company(slug, db)

    # Check if website is enabled
    if not company.website_enabled:
        raise HTTPException(status_code=404, detail="Website not enabled")

    # Get visible sections ordered
    result = await db.execute(
        select(WebsiteSection)
        .where(
            WebsiteSection.company_id == company.id,
            WebsiteSection.is_visible == True
        )
        .order_by(WebsiteSection.order)
    )
    return result.scalars().all()

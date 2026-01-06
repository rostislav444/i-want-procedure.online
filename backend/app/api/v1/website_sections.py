"""API endpoints for website sections"""
from fastapi import APIRouter, HTTPException

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models.website_section import (
    WebsiteSection,
    BASIC_SECTIONS,
    PREMIUM_SECTIONS,
    MAX_BASIC_SECTIONS,
    DEFAULT_SECTIONS_BY_THEME,
)
from app.schemas.website_section import (
    WebsiteSectionCreate,
    WebsiteSectionUpdate,
    WebsiteSectionResponse,
    SectionOrderItem,
    SectionTypeInfo,
    IndustryThemeInfo,
    SECTION_TYPES_INFO,
    SECTION_TYPES_MAP,
    INDUSTRY_THEMES_INFO,
)

router = APIRouter(prefix="/website")


async def is_premium_company(user, db) -> bool:
    """Check if user's company has premium subscription"""
    # For now, check if subscription exists and is active
    # This will be enhanced when subscription logic is fully implemented
    if not user.company_id:
        return False

    from app.models.company import Company
    result = await db.execute(
        select(Company)
        .where(Company.id == user.company_id)
        .options(selectinload(Company.subscription))
    )
    company = result.scalar_one_or_none()
    if company and company.subscription:
        return company.subscription.status == "active"
    return False


@router.get("/sections", response_model=list[WebsiteSectionResponse])
async def get_sections(current_user: CurrentUser, db: DbSession):
    """Get all website sections for current user's company"""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company")

    result = await db.execute(
        select(WebsiteSection)
        .where(WebsiteSection.company_id == current_user.company_id)
        .order_by(WebsiteSection.order)
    )
    return result.scalars().all()


@router.post("/sections", response_model=WebsiteSectionResponse)
async def create_section(
    data: WebsiteSectionCreate,
    current_user: CurrentUser,
    db: DbSession
):
    """Create a new website section"""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company")

    # Validate section type
    if data.section_type not in SECTION_TYPES_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid section type: {data.section_type}")

    # Check premium restriction
    is_premium = await is_premium_company(current_user, db)
    if data.section_type in PREMIUM_SECTIONS and not is_premium:
        raise HTTPException(
            status_code=403,
            detail=f"Section type '{data.section_type}' requires Premium subscription"
        )

    # Check section limit for basic
    if not is_premium:
        result = await db.execute(
            select(func.count(WebsiteSection.id))
            .where(WebsiteSection.company_id == current_user.company_id)
        )
        current_count = result.scalar()
        if current_count >= MAX_BASIC_SECTIONS:
            raise HTTPException(
                status_code=403,
                detail=f"Maximum {MAX_BASIC_SECTIONS} sections allowed on Basic plan"
            )

    # Get the next order value
    result = await db.execute(
        select(func.max(WebsiteSection.order))
        .where(WebsiteSection.company_id == current_user.company_id)
    )
    max_order = result.scalar() or 0

    # Merge default content with provided content
    type_info = SECTION_TYPES_MAP[data.section_type]
    content = {**type_info.default_content, **data.content}

    section = WebsiteSection(
        company_id=current_user.company_id,
        section_type=data.section_type,
        order=max_order + 1,
        content=content,
        style=data.style,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.patch("/sections/{section_id}", response_model=WebsiteSectionResponse)
async def update_section(
    section_id: int,
    data: WebsiteSectionUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    """Update a website section"""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company")

    result = await db.execute(
        select(WebsiteSection)
        .where(
            WebsiteSection.id == section_id,
            WebsiteSection.company_id == current_user.company_id
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    if data.content is not None:
        # Merge with existing content
        section.content = {**section.content, **data.content}
    if data.style is not None:
        section.style = data.style
    if data.is_visible is not None:
        section.is_visible = data.is_visible

    await db.commit()
    await db.refresh(section)
    return section


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: int,
    current_user: CurrentUser,
    db: DbSession
):
    """Delete a website section"""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company")

    result = await db.execute(
        select(WebsiteSection)
        .where(
            WebsiteSection.id == section_id,
            WebsiteSection.company_id == current_user.company_id
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    await db.delete(section)
    await db.commit()
    return {"success": True}


@router.post("/sections/reorder")
async def reorder_sections(
    data: list[SectionOrderItem],
    current_user: CurrentUser,
    db: DbSession
):
    """Update section order"""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company")

    # Get all sections for this company
    result = await db.execute(
        select(WebsiteSection)
        .where(WebsiteSection.company_id == current_user.company_id)
    )
    sections = {s.id: s for s in result.scalars().all()}

    # Update orders
    for item in data:
        if item.id in sections:
            sections[item.id].order = item.order

    await db.commit()
    return {"success": True}


@router.post("/sections/reset")
async def reset_to_defaults(current_user: CurrentUser, db: DbSession):
    """Reset website sections to defaults based on industry theme"""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User has no company")

    # Load company with subscription
    from app.models.company import Company
    result = await db.execute(
        select(Company)
        .where(Company.id == current_user.company_id)
        .options(selectinload(Company.subscription))
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Delete existing sections
    result = await db.execute(
        select(WebsiteSection)
        .where(WebsiteSection.company_id == current_user.company_id)
    )
    for section in result.scalars().all():
        await db.delete(section)

    # Get default sections for industry theme
    theme = company.industry_theme or "cosmetology"
    default_sections = DEFAULT_SECTIONS_BY_THEME.get(theme, DEFAULT_SECTIONS_BY_THEME["cosmetology"])

    # Check if premium
    is_premium = company.subscription and company.subscription.status == "active"

    # Create new default sections
    for i, section_data in enumerate(default_sections):
        section_type = section_data["type"]

        # Skip premium sections for basic plan
        if section_type in PREMIUM_SECTIONS and not is_premium:
            continue

        # Skip if exceeding basic limit
        if not is_premium and i >= MAX_BASIC_SECTIONS:
            break

        # Merge default content
        type_info = SECTION_TYPES_MAP.get(section_type)
        content = {**(type_info.default_content if type_info else {}), **section_data.get("content", {})}

        section = WebsiteSection(
            company_id=current_user.company_id,
            section_type=section_type,
            order=i,
            content=content,
        )
        db.add(section)

    await db.commit()
    return {"success": True}


@router.get("/section-types", response_model=list[SectionTypeInfo])
async def get_section_types(current_user: CurrentUser, db: DbSession):
    """Get list of available section types with their metadata"""
    is_premium = await is_premium_company(current_user, db)

    # Return all types, but mark which ones are available
    types = []
    for info in SECTION_TYPES_INFO:
        type_dict = info.model_dump()
        # For non-premium users, premium sections are still shown but marked
        types.append(SectionTypeInfo(**type_dict))

    return types


@router.get("/themes", response_model=list[IndustryThemeInfo])
async def get_industry_themes():
    """Get list of available industry themes"""
    return INDUSTRY_THEMES_INFO

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser, SuperadminUser
from app.models.global_catalog import GlobalServiceCategory, GlobalServiceTemplate
from app.models.service import Service, ServiceCategory
from app.schemas.global_catalog import (
    GlobalCategoryResponse, GlobalCategoryTreeResponse,
    GlobalCategoryCreate, GlobalCategoryUpdate,
    GlobalTemplateResponse, GlobalTemplateWithCategoryResponse,
    GlobalTemplateCreate, GlobalTemplateUpdate,
    AdoptFromCatalogRequest,
)

router = APIRouter(prefix="/global-catalog")


# ===== Public endpoints (read-only, no auth required for catalog browsing) =====

def _build_category_tree(categories: list[GlobalServiceCategory], parent_id: int | None = None) -> list[dict]:
    tree = []
    for cat in categories:
        if cat.parent_id == parent_id:
            children = _build_category_tree(categories, cat.id)
            tree.append({
                "id": cat.id,
                "parent_id": cat.parent_id,
                "name": cat.name,
                "name_en": cat.name_en,
                "description": cat.description,
                "icon": cat.icon,
                "order": cat.order,
                "is_active": cat.is_active,
                "children": children,
                "templates": [
                    {
                        "id": t.id,
                        "category_id": t.category_id,
                        "name": t.name,
                        "name_en": t.name_en,
                        "description": t.description,
                        "default_duration_minutes": t.default_duration_minutes,
                        "is_active": t.is_active,
                        "order": t.order,
                    }
                    for t in sorted(cat.templates, key=lambda x: x.order)
                    if t.is_active
                ],
            })
    return sorted(tree, key=lambda x: x["order"])


@router.get("/categories", response_model=list[GlobalCategoryResponse])
async def get_global_categories(db: DbSession):
    """Отримати всі глобальні категорії (плоский список)."""
    result = await db.execute(
        select(GlobalServiceCategory)
        .where(GlobalServiceCategory.is_active == True)
        .order_by(GlobalServiceCategory.order, GlobalServiceCategory.name)
    )
    return result.scalars().all()


@router.get("/categories/tree", response_model=list[GlobalCategoryTreeResponse])
async def get_global_categories_tree(db: DbSession):
    """Отримати глобальні категорії як дерево з шаблонами послуг."""
    result = await db.execute(
        select(GlobalServiceCategory)
        .options(selectinload(GlobalServiceCategory.templates))
        .where(GlobalServiceCategory.is_active == True)
    )
    categories = result.scalars().all()
    return _build_category_tree(list(categories))


@router.get("/templates", response_model=list[GlobalTemplateWithCategoryResponse])
async def get_global_templates(
    db: DbSession,
    category_id: int | None = None,
    search: str | None = None,
):
    """Отримати глобальні шаблони послуг з фільтрацією."""
    query = (
        select(GlobalServiceTemplate)
        .options(selectinload(GlobalServiceTemplate.category))
        .where(GlobalServiceTemplate.is_active == True)
    )
    if category_id:
        query = query.where(GlobalServiceTemplate.category_id == category_id)
    if search:
        query = query.where(GlobalServiceTemplate.name.ilike(f"%{search}%"))
    query = query.order_by(GlobalServiceTemplate.order, GlobalServiceTemplate.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/templates/{template_id}", response_model=GlobalTemplateWithCategoryResponse)
async def get_global_template(template_id: int, db: DbSession):
    result = await db.execute(
        select(GlobalServiceTemplate)
        .options(selectinload(GlobalServiceTemplate.category))
        .where(GlobalServiceTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


# ===== Adopt templates (auth required) =====

@router.post("/adopt", status_code=status.HTTP_201_CREATED)
async def adopt_from_catalog(
    request: AdoptFromCatalogRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Майстер обирає послуги з глобального каталогу та додає їх до своєї компанії.
    Автоматично створює відповідні категорії, якщо їх ще немає.
    """
    # Load requested templates with categories
    result = await db.execute(
        select(GlobalServiceTemplate)
        .options(selectinload(GlobalServiceTemplate.category))
        .where(GlobalServiceTemplate.id.in_(request.template_ids))
    )
    templates = result.scalars().all()

    if not templates:
        raise HTTPException(status_code=400, detail="No valid templates found")

    # Group by global category
    category_map: dict[int, GlobalServiceCategory] = {}
    for t in templates:
        category_map[t.category_id] = t.category

    # Find or create company categories linked to global categories
    company_category_map: dict[int, int] = {}  # global_cat_id -> company_cat_id

    for global_cat_id, global_cat in category_map.items():
        # Check if company already has a category linked to this global one
        existing = await db.execute(
            select(ServiceCategory).where(
                ServiceCategory.company_id == current_user.company_id,
                ServiceCategory.global_category_id == global_cat_id,
            )
        )
        company_cat = existing.scalar_one_or_none()

        if not company_cat:
            # Also check parent category
            parent_company_cat_id = None
            if global_cat.parent_id and global_cat.parent_id in category_map:
                parent_company_cat_id = company_category_map.get(global_cat.parent_id)

            company_cat = ServiceCategory(
                company_id=current_user.company_id,
                global_category_id=global_cat_id,
                parent_id=parent_company_cat_id,
                name=global_cat.name,
                description=global_cat.description,
                order=global_cat.order,
            )
            db.add(company_cat)
            await db.flush()

        company_category_map[global_cat_id] = company_cat.id

    # Create services from templates
    created = []
    for t in templates:
        # Check if service already exists from this template
        existing = await db.execute(
            select(Service).where(
                Service.company_id == current_user.company_id,
                Service.global_template_id == t.id,
            )
        )
        if existing.scalar_one_or_none():
            continue

        service = Service(
            company_id=current_user.company_id,
            category_id=company_category_map[t.category_id],
            global_template_id=t.id,
            name=t.name,
            description=t.description,
            duration_minutes=t.default_duration_minutes,
            price=0,  # Master sets their own price
            is_active=True,
            is_custom=False,
        )
        db.add(service)
        created.append(t.name)

    await db.commit()
    return {"adopted": len(created), "services": created}


# ===== Superadmin CRUD for managing global catalog =====

@router.post("/admin/categories", response_model=GlobalCategoryResponse, status_code=201)
async def create_global_category(
    data: GlobalCategoryCreate,
    current_user: SuperadminUser,
    db: DbSession,
):
    cat = GlobalServiceCategory(**data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.patch("/admin/categories/{category_id}", response_model=GlobalCategoryResponse)
async def update_global_category(
    category_id: int,
    data: GlobalCategoryUpdate,
    current_user: SuperadminUser,
    db: DbSession,
):
    result = await db.execute(
        select(GlobalServiceCategory).where(GlobalServiceCategory.id == category_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/admin/categories/{category_id}", status_code=204)
async def delete_global_category(
    category_id: int,
    current_user: SuperadminUser,
    db: DbSession,
):
    result = await db.execute(
        select(GlobalServiceCategory).where(GlobalServiceCategory.id == category_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()


@router.post("/admin/templates", response_model=GlobalTemplateResponse, status_code=201)
async def create_global_template(
    data: GlobalTemplateCreate,
    current_user: SuperadminUser,
    db: DbSession,
):
    tmpl = GlobalServiceTemplate(**data.model_dump())
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return tmpl


@router.patch("/admin/templates/{template_id}", response_model=GlobalTemplateResponse)
async def update_global_template(
    template_id: int,
    data: GlobalTemplateUpdate,
    current_user: SuperadminUser,
    db: DbSession,
):
    result = await db.execute(
        select(GlobalServiceTemplate).where(GlobalServiceTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tmpl, field, value)
    await db.commit()
    await db.refresh(tmpl)
    return tmpl


@router.delete("/admin/templates/{template_id}", status_code=204)
async def delete_global_template(
    template_id: int,
    current_user: SuperadminUser,
    db: DbSession,
):
    result = await db.execute(
        select(GlobalServiceTemplate).where(GlobalServiceTemplate.id == template_id)
    )
    tmpl = result.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(tmpl)
    await db.commit()

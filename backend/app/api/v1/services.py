from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.service import Service, ServiceStep, ServiceProduct, ServiceCategory
from app.schemas.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceDetailResponse,
    ServiceStepCreate, ServiceStepUpdate, ServiceStepResponse,
    ServiceProductCreate, ServiceProductUpdate, ServiceProductResponse,
    ServiceCategoryCreate, ServiceCategoryUpdate, ServiceCategoryResponse, ServiceCategoryTreeResponse,
)

router = APIRouter(prefix="/services")


# ===== Service CRUD =====

@router.get("", response_model=list[ServiceResponse])
async def get_services(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.category))
        .where(Service.company_id == current_user.company_id)
        .order_by(Service.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ServiceDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    service = Service(
        company_id=current_user.company_id,
        category_id=service_data.category_id,
        doctor_id=service_data.doctor_id or current_user.id,
        name=service_data.name,
        description=service_data.description,
        duration_minutes=service_data.duration_minutes,
        price=service_data.price,
    )
    db.add(service)
    await db.flush()

    # Add steps if provided
    if service_data.steps:
        for step_data in service_data.steps:
            step = ServiceStep(
                service_id=service.id,
                order=step_data.order,
                title=step_data.title,
                description=step_data.description,
                duration_minutes=step_data.duration_minutes,
            )
            db.add(step)

    # Add products if provided
    if service_data.products:
        for product_data in service_data.products:
            product = ServiceProduct(
                service_id=service.id,
                name=product_data.name,
                description=product_data.description,
                manufacturer=product_data.manufacturer,
            )
            db.add(product)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.steps), selectinload(Service.products), selectinload(Service.category))
        .where(Service.id == service.id)
    )
    return result.scalar_one()


@router.get("/{service_id}", response_model=ServiceDetailResponse)
async def get_service(service_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.steps), selectinload(Service.products), selectinload(Service.category))
        .where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    return service


@router.patch("/{service_id}", response_model=ServiceDetailResponse)
async def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.steps), selectinload(Service.products), selectinload(Service.category))
        .where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    update_data = service_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    await db.commit()
    await db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Service).where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    await db.delete(service)
    await db.commit()


# ===== Service Steps CRUD =====

@router.post("/{service_id}/steps", response_model=ServiceStepResponse, status_code=status.HTTP_201_CREATED)
async def create_step(
    service_id: int,
    step_data: ServiceStepCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    # Verify service belongs to user's company
    result = await db.execute(
        select(Service).where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    step = ServiceStep(
        service_id=service_id,
        order=step_data.order,
        title=step_data.title,
        description=step_data.description,
        duration_minutes=step_data.duration_minutes,
    )
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return step


@router.patch("/{service_id}/steps/{step_id}", response_model=ServiceStepResponse)
async def update_step(
    service_id: int,
    step_id: int,
    step_data: ServiceStepUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    # Verify service belongs to user's company
    result = await db.execute(
        select(ServiceStep)
        .join(Service)
        .where(
            ServiceStep.id == step_id,
            ServiceStep.service_id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    update_data = step_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(step, field, value)

    await db.commit()
    await db.refresh(step)
    return step


@router.delete("/{service_id}/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(
    service_id: int,
    step_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(ServiceStep)
        .join(Service)
        .where(
            ServiceStep.id == step_id,
            ServiceStep.service_id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    await db.delete(step)
    await db.commit()


# ===== Service Products CRUD =====

@router.post("/{service_id}/products", response_model=ServiceProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    service_id: int,
    product_data: ServiceProductCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    # Verify service belongs to user's company
    result = await db.execute(
        select(Service).where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    product = ServiceProduct(
        service_id=service_id,
        name=product_data.name,
        description=product_data.description,
        manufacturer=product_data.manufacturer,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{service_id}/products/{product_id}", response_model=ServiceProductResponse)
async def update_product(
    service_id: int,
    product_id: int,
    product_data: ServiceProductUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(ServiceProduct)
        .join(Service)
        .where(
            ServiceProduct.id == product_id,
            ServiceProduct.service_id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{service_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    service_id: int,
    product_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(ServiceProduct)
        .join(Service)
        .where(
            ServiceProduct.id == product_id,
            ServiceProduct.service_id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    await db.delete(product)
    await db.commit()


# ===== Service Categories CRUD =====

def build_category_tree(categories: list[ServiceCategory], parent_id: int | None = None) -> list[dict]:
    """Build a tree structure from flat list of categories"""
    tree = []
    for cat in categories:
        if cat.parent_id == parent_id:
            children = build_category_tree(categories, cat.id)
            cat_dict = {
                "id": cat.id,
                "company_id": cat.company_id,
                "parent_id": cat.parent_id,
                "name": cat.name,
                "description": cat.description,
                "order": cat.order,
                "created_at": cat.created_at,
                "children": children,
            }
            tree.append(cat_dict)
    return sorted(tree, key=lambda x: x["order"])


@router.get("/categories", response_model=list[ServiceCategoryResponse])
async def get_categories(current_user: CurrentUser, db: DbSession):
    """Get all categories for the company (flat list)"""
    result = await db.execute(
        select(ServiceCategory)
        .where(ServiceCategory.company_id == current_user.company_id)
        .order_by(ServiceCategory.order, ServiceCategory.name)
    )
    return result.scalars().all()


@router.get("/categories/tree", response_model=list[ServiceCategoryTreeResponse])
async def get_categories_tree(current_user: CurrentUser, db: DbSession):
    """Get categories as a tree structure"""
    result = await db.execute(
        select(ServiceCategory)
        .where(ServiceCategory.company_id == current_user.company_id)
    )
    categories = result.scalars().all()
    return build_category_tree(list(categories))


@router.post("/categories", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: ServiceCategoryCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    # Validate parent belongs to same company if provided
    if category_data.parent_id:
        result = await db.execute(
            select(ServiceCategory).where(
                ServiceCategory.id == category_data.parent_id,
                ServiceCategory.company_id == current_user.company_id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found",
            )

    category = ServiceCategory(
        company_id=current_user.company_id,
        parent_id=category_data.parent_id,
        name=category_data.name,
        description=category_data.description,
        order=category_data.order,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("/categories/{category_id}", response_model=ServiceCategoryResponse)
async def get_category(category_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(ServiceCategory).where(
            ServiceCategory.id == category_id,
            ServiceCategory.company_id == current_user.company_id,
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.patch("/categories/{category_id}", response_model=ServiceCategoryResponse)
async def update_category(
    category_id: int,
    category_data: ServiceCategoryUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(ServiceCategory).where(
            ServiceCategory.id == category_id,
            ServiceCategory.company_id == current_user.company_id,
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Validate parent if being changed
    if category_data.parent_id is not None and category_data.parent_id != category.parent_id:
        if category_data.parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category cannot be its own parent",
            )
        if category_data.parent_id:
            result = await db.execute(
                select(ServiceCategory).where(
                    ServiceCategory.id == category_data.parent_id,
                    ServiceCategory.company_id == current_user.company_id,
                )
            )
            if not result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent category not found",
                )

    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(ServiceCategory).where(
            ServiceCategory.id == category_id,
            ServiceCategory.company_id == current_user.company_id,
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    await db.delete(category)
    await db.commit()

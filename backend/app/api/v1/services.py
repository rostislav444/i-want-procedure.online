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
        .options(selectinload(Service.category), selectinload(Service.specialty))
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
        specialty_id=service_data.specialty_id,
        position_id=service_data.position_id,
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
        .options(
            selectinload(Service.steps),
            selectinload(Service.products),
            selectinload(Service.category),
            selectinload(Service.specialty),
        )
        .where(Service.id == service.id)
    )
    return result.scalar_one()


@router.get("/{service_id}", response_model=ServiceDetailResponse)
async def get_service(service_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Service)
        .options(
            selectinload(Service.steps),
            selectinload(Service.products),
            selectinload(Service.category),
            selectinload(Service.specialty),
        )
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
        .options(
            selectinload(Service.steps),
            selectinload(Service.products),
            selectinload(Service.category),
            selectinload(Service.specialty),
        )
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


# ===== AI Service Generation =====

from pydantic import BaseModel
from typing import Optional
from app.core.config import settings


class GeneratedService(BaseModel):
    """A single generated service."""
    name: str
    description: str
    duration_minutes: int
    price: int
    category_name: str


class GenerateServicesRequest(BaseModel):
    """Request to generate services using AI."""
    position_name: str
    source_type: str  # "text", "url", "pdf"
    content: str  # Text content, URL, or base64 PDF
    city: str = "Київ"
    additional_instructions: Optional[str] = None


class GenerateServicesResponse(BaseModel):
    """Response with generated services."""
    services: list[GeneratedService]
    categories: list[str]
    estimated_tokens: int


SERVICES_GENERATION_PROMPT = """Ти експерт з бьюті-індустрії та косметології в Україні. Твоє завдання - створити список послуг для спеціаліста.

ПРАВИЛА:
1. Аналізуй вхідні дані (текст, опис з сайту, PDF) та створи релевантні послуги
2. Групуй послуги по категоріях (наприклад: "Чистки", "Пілінги", "Ін'єкції", "Догляд")
3. Вказуй реалістичну тривалість процедури в хвилинах (30, 45, 60, 90, 120)
4. Вказуй орієнтовну ціну для українського ринку (місто: {city})
5. Опис має бути коротким (1-2 речення) та інформативним
6. Якщо інформації недостатньо - використовуй типові послуги для цієї спеціальності

ФОРМАТ ВІДПОВІДІ (тільки JSON, без пояснень):
{{
  "categories": ["Категорія 1", "Категорія 2"],
  "services": [
    {{
      "name": "Назва послуги",
      "description": "Короткий опис",
      "duration_minutes": 60,
      "price": 1500,
      "category_name": "Категорія 1"
    }}
  ]
}}

Створи 10-20 найбільш популярних послуг."""


@router.post("/generate-from-ai", response_model=GenerateServicesResponse)
async def generate_services_from_ai(
    request: GenerateServicesRequest,
    current_user: CurrentUser,
):
    """Generate services using AI based on text, URL, or PDF."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI generation not configured. Please set ANTHROPIC_API_KEY."
        )

    # Build the prompt based on source type
    source_description = ""
    if request.source_type == "text":
        source_description = f"Текстовий опис послуг:\n{request.content}"
    elif request.source_type == "url":
        source_description = f"URL сайту з послугами: {request.content}\n\nПроаналізуй цей URL та створи список послуг на основі інформації з сайту."
    elif request.source_type == "pdf":
        source_description = f"PDF документ (base64):\n{request.content[:1000]}...\n\nПроаналізуй цей документ та створи список послуг."

    user_prompt = f"""Спеціальність/посада: {request.position_name}
Місто: {request.city}

{source_description}

{f'Додаткові вимоги: {request.additional_instructions}' if request.additional_instructions else ''}

Створи список послуг у форматі JSON."""

    try:
        import anthropic
        import json

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        system_prompt = SERVICES_GENERATION_PROMPT.format(city=request.city)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt,
                }
            ],
        )

        # Parse the JSON response
        response_text = message.content[0].text

        # Try to extract JSON from the response
        try:
            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            data = json.loads(response_text.strip())
        except json.JSONDecodeError:
            # Try to find JSON object in the text
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to parse AI response as JSON"
                )

        services = [GeneratedService(**s) for s in data.get("services", [])]
        categories = data.get("categories", [])
        estimated_tokens = message.usage.input_tokens + message.usage.output_tokens

        return GenerateServicesResponse(
            services=services,
            categories=categories,
            estimated_tokens=estimated_tokens,
        )

    except anthropic.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI API error: {str(e)}"
        )

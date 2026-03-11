from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.service import Service, ServiceStep, ServiceProduct, ServiceCategory, ServicePriceOption
from app.schemas.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceDetailResponse,
    ServiceStepCreate, ServiceStepUpdate, ServiceStepResponse,
    ServiceProductCreate, ServiceProductUpdate, ServiceProductResponse,
    ServicePriceOptionCreate, ServicePriceOptionUpdate, ServicePriceOptionResponse,
    ServiceCategoryCreate, ServiceCategoryUpdate, ServiceCategoryResponse, ServiceCategoryTreeResponse,
)

router = APIRouter(prefix="/services")


# ===== Service CRUD =====

@router.get("", response_model=list[ServiceResponse])
async def get_services(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.category), selectinload(Service.specialty), selectinload(Service.price_options))
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
        global_template_id=service_data.global_template_id,
        is_custom=service_data.is_custom,
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

    # Add price options if provided
    if service_data.price_options:
        for option_data in service_data.price_options:
            option = ServicePriceOption(
                service_id=service.id,
                name=option_data.name,
                price=option_data.price,
                duration_minutes=option_data.duration_minutes,
                order=option_data.order,
            )
            db.add(option)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Service)
        .options(
            selectinload(Service.steps),
            selectinload(Service.products),
            selectinload(Service.price_options),
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
            selectinload(Service.price_options),
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
            selectinload(Service.price_options),
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


# ===== Service Price Options CRUD =====

@router.post("/{service_id}/price-options", response_model=ServicePriceOptionResponse, status_code=status.HTTP_201_CREATED)
async def create_price_option(
    service_id: int,
    option_data: ServicePriceOptionCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Service).where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    option = ServicePriceOption(
        service_id=service_id,
        name=option_data.name,
        price=option_data.price,
        duration_minutes=option_data.duration_minutes,
        order=option_data.order,
    )
    db.add(option)
    await db.commit()
    await db.refresh(option)
    return option


@router.patch("/{service_id}/price-options/{option_id}", response_model=ServicePriceOptionResponse)
async def update_price_option(
    service_id: int,
    option_id: int,
    option_data: ServicePriceOptionUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(ServicePriceOption)
        .join(Service)
        .where(
            ServicePriceOption.id == option_id,
            ServicePriceOption.service_id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price option not found")

    update_data = option_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(option, field, value)

    await db.commit()
    await db.refresh(option)
    return option


@router.delete("/{service_id}/price-options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_price_option(
    service_id: int,
    option_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(ServicePriceOption)
        .join(Service)
        .where(
            ServicePriceOption.id == option_id,
            ServicePriceOption.service_id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price option not found")

    await db.delete(option)
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
                "global_category_id": cat.global_category_id,
                "is_custom": cat.is_custom,
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


class GeneratedPriceOption(BaseModel):
    """A price variant for a generated service."""
    name: str
    price: int
    duration_minutes: Optional[int] = None


class GeneratedService(BaseModel):
    """A single generated service."""
    name: str
    description: str
    duration_minutes: int
    price: int
    category_name: str
    price_options: list[GeneratedPriceOption] = []


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


SERVICES_GENERATION_PROMPT = """Ти експерт з бьюті-індустрії та косметології в Україні. Твоє завдання — точно перенести прайс-лист спеціаліста у структурований формат.

ГОЛОВНЕ ПРАВИЛО: Скопіюй ВСІ послуги з вхідних даних. НЕ пропускай жодної! Це критично важливо. Якщо на сайті/в тексті є 50 послуг — поверни всі 50.

ПРАВИЛА:
1. Копіюй КОЖНУ послугу з вхідних даних — назву та ціну бери точно як у джерелі
2. Групуй послуги по категоріях з джерела. Якщо категорії вже є — використовуй їх. Якщо ні — створи логічні категорії
3. Тривалість: якщо вказана у джерелі — бери звідти. Якщо ні — вказуй реалістичну (30, 45, 60, 90, 120 хв)
4. Ціни: бери ТОЧНО з джерела. Якщо ціни відсутні — ставь орієнтовну для {city}
5. Опис: коротко (1-2 речення). Якщо є у джерелі — використовуй, якщо ні — додай стислий опис
6. Якщо послуга має варіанти (різні зони, об'єми, кількість) з різними цінами — об'єднай їх в ОДНУ послугу з "price_options". Основна ціна (price) = мінімальна серед варіантів
7. НЕ створюй окремі послуги для кожної зони — використовуй price_options
8. Якщо інформації мало — додай типові послуги для цієї спеціальності. Але якщо вхідні дані детальні — копіюй тільки те що є, нічого не вигадуй

ФОРМАТ ВІДПОВІДІ (тільки JSON, без пояснень):
{{
  "categories": ["Категорія 1", "Категорія 2"],
  "services": [
    {{
      "name": "Назва послуги",
      "description": "Короткий опис",
      "duration_minutes": 60,
      "price": 1500,
      "category_name": "Категорія 1",
      "price_options": [
        {{"name": "Обличчя", "price": 1500}},
        {{"name": "Обличчя + шия", "price": 2000}},
        {{"name": "Обличчя + шия + декольте", "price": 2500}}
      ]
    }}
  ]
}}

Примітка: price_options додавай ТІЛЬКИ для послуг де дійсно є варіанти. Для послуг з фіксованою ціною залишай price_options порожнім масивом []."""


import asyncio
import uuid
import logging
from pathlib import Path
from datetime import datetime

_ai_jobs: dict[str, dict] = {}  # job_id -> {status, result, error}
_ai_logger = logging.getLogger("ai_generation")


async def _run_ai_generation(job_id: str, request: GenerateServicesRequest):
    """Background task that runs AI generation."""
    try:
        import anthropic
        import json

        debug_dir = Path("/app/debug_ai_responses")
        debug_dir.mkdir(exist_ok=True)

        # Build source description
        source_description = ""
        if request.source_type == "text":
            source_description = f"Текстовий опис послуг:\n{request.content}"
        elif request.source_type == "url":
            import httpx
            from bs4 import BeautifulSoup
            async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as http_client:
                resp = await http_client.get(request.content, headers={
                    "User-Agent": "Mozilla/5.0 (compatible; ProcedureBot/1.0)"
                })
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
                    tag.decompose()
                page_text = soup.get_text(separator="\n", strip=True)
                if len(page_text) > 30000:
                    page_text = page_text[:30000] + "\n... (текст обрізано)"
                source_description = f"Контент зі сторінки {request.content}:\n\n{page_text}"
        elif request.source_type == "pdf":
            source_description = f"PDF документ (base64):\n{request.content[:1000]}..."

        user_prompt = f"""Спеціальність/посада: {request.position_name}
Місто: {request.city}

{source_description}

{f'Додаткові вимоги: {request.additional_instructions}' if request.additional_instructions else ''}

Створи список послуг у форматі JSON."""

        _ai_jobs[job_id]["status"] = "streaming"
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        system_prompt = SERVICES_GENERATION_PROMPT.format(city=request.city)

        response_text = ""
        async with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=32768,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        ) as stream:
            async for text in stream.text_stream:
                response_text += text

        final_message = await stream.get_final_message()
        stop_reason = final_message.stop_reason
        input_tokens = final_message.usage.input_tokens
        output_tokens = final_message.usage.output_tokens

        # Save debug
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        debug_file = debug_dir / f"{timestamp}.txt"
        debug_file.write_text(
            f"stop_reason: {stop_reason}\ninput_tokens: {input_tokens}\n"
            f"output_tokens: {output_tokens}\nsource_type: {request.source_type}\n"
            f"content: {request.content[:200]}\n---RAW RESPONSE---\n{response_text}",
            encoding="utf-8",
        )
        _ai_logger.info(f"AI response saved: {debug_file} (stop={stop_reason}, tokens={output_tokens})")

        _ai_jobs[job_id]["status"] = "parsing"

        # Parse JSON
        clean_text = response_text
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0]
        elif "```" in clean_text:
            parts = clean_text.split("```")
            if len(parts) >= 2:
                clean_text = parts[1]
        clean_text = clean_text.strip()

        data = None
        try:
            data = json.loads(clean_text)
        except json.JSONDecodeError as e:
            _ai_logger.warning(f"JSON parse failed: {e}. Attempting repair...")
            for search in ['},\n', '},', '}']:
                last_good = clean_text.rfind(search)
                if last_good <= 0:
                    continue
                candidate = clean_text[:last_good + 1]
                for closing in [']}', ']\n}']:
                    try:
                        data = json.loads(candidate + closing)
                        break
                    except json.JSONDecodeError:
                        pass
                if data:
                    break

        if data is None:
            _ai_jobs[job_id] = {"status": "error", "error": "Не вдалося розпарсити відповідь AI"}
            return

        services = []
        for s in data.get("services", []):
            try:
                services.append(GeneratedService(**s).model_dump())
            except Exception:
                pass

        _ai_jobs[job_id] = {
            "status": "done",
            "result": {
                "services": services,
                "categories": data.get("categories", []),
                "estimated_tokens": input_tokens + output_tokens,
            },
        }
        _ai_logger.info(f"Job {job_id}: {len(services)} services parsed")

    except Exception as e:
        _ai_logger.exception(f"Job {job_id} failed")
        _ai_jobs[job_id] = {"status": "error", "error": str(e)}


@router.post("/generate-from-ai")
async def generate_services_from_ai(
    request: GenerateServicesRequest,
    current_user: CurrentUser,
):
    """Start AI generation job, returns job_id for polling."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI generation not configured.")

    job_id = str(uuid.uuid4())
    _ai_jobs[job_id] = {"status": "started"}
    asyncio.create_task(_run_ai_generation(job_id, request))
    return {"job_id": job_id, "status": "started"}


@router.get("/generate-from-ai/{job_id}")
async def get_generation_status(
    job_id: str,
    current_user: CurrentUser,
):
    """Poll for AI generation result."""
    job = _ai_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] == "done":
        result = job["result"]
        del _ai_jobs[job_id]  # Cleanup
        return {"status": "done", **result}
    elif job["status"] == "error":
        error = job.get("error", "Unknown error")
        del _ai_jobs[job_id]
        raise HTTPException(status_code=500, detail=error)
    else:
        return {"status": job["status"]}

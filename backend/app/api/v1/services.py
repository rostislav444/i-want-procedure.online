from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.service import Service, ServiceStep, ServiceProduct, ServicePriceOption
from app.schemas.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceDetailResponse,
    ServiceStepCreate, ServiceStepUpdate, ServiceStepResponse,
    ServiceProductCreate, ServiceProductUpdate, ServiceProductResponse,
    ServicePriceOptionCreate, ServicePriceOptionUpdate, ServicePriceOptionResponse,
)

router = APIRouter(prefix="/services")


# ===== Service CRUD =====

@router.get("", response_model=list[ServiceResponse])
async def get_services(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.global_category), selectinload(Service.specialty), selectinload(Service.price_options))
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
        global_category_id=service_data.global_category_id,
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
            selectinload(Service.global_category),
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
            selectinload(Service.global_category),
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
            selectinload(Service.global_category),
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


# ===== AI Service Generation =====

from pydantic import BaseModel
from typing import Optional
from app.core.config import settings


class GeneratedPriceOption(BaseModel):
    """A price variant for a generated service."""
    name: str
    price: int
    duration_minutes: Optional[int] = None


class GeneratedNewCategory(BaseModel):
    """A new category proposed by AI."""
    temp_id: str  # e.g. "new_1", "new_2"
    parent_id: Optional[int | str] = None  # existing ID or another temp_id
    name: str
    name_en: Optional[str] = None
    icon: Optional[str] = None


class GeneratedService(BaseModel):
    """A single generated service."""
    name: str
    description: str
    duration_minutes: int
    price: int
    category_name: str
    global_category_id: Optional[int] = None
    global_template_id: Optional[int] = None
    price_options: list[GeneratedPriceOption] = []


class GenerateServicesRequest(BaseModel):
    """Request to generate services using AI."""
    position_name: str
    source_type: str  # "text", "url", "pdf"
    content: str  # Text content, URL, or base64 PDF
    city: str = "Київ"
    additional_instructions: Optional[str] = None


class GeneratedCategoryResult(BaseModel):
    """A category that was created by AI."""
    id: int
    parent_id: Optional[int] = None
    name: str
    name_en: Optional[str] = None
    icon: Optional[str] = None
    is_new: bool = False  # True if created by AI


class GenerateServicesResponse(BaseModel):
    """Response with generated services."""
    services: list[GeneratedService]
    categories: list[str]
    new_categories: list[GeneratedCategoryResult] = []
    estimated_tokens: int


SERVICES_GENERATION_PROMPT = """Ти експерт з бьюті-індустрії та косметології в Україні. Твоє завдання — точно перенести прайс-лист спеціаліста у структурований формат.

ГОЛОВНЕ ПРАВИЛО: Скопіюй ВСІ послуги з вхідних даних. НЕ пропускай жодної! Це критично важливо. Якщо на сайті/в тексті є 50 послуг — поверни всі 50.

## КРОК 1: Аналіз вхідних даних
Уважно переглянь усі послуги з вхідних даних:
- Які категорії/розділи є на сторінці
- Яка структура (напрямки → підкатегорії → послуги)
- Скільки всього послуг

## КРОК 2: Аналіз існуючого каталогу
Це ГЛОБАЛЬНИЙ КАТАЛОГ MARKETPLACE — єдина база категорій для ВСІХ компаній на платформі.
Кожна нова категорія стає видимою для всіх користувачів, тому додавати їх потрібно ДУЖЕ обережно.

ГЛОБАЛЬНИЙ КАТАЛОГ:
{global_catalog}

## КРОК 3: Розподіл по існуючих категоріях (ПРІОРИТЕТ!)
КРИТИЧНО ВАЖЛИВО — дотримуйся такого порядку:

1. СПОЧАТКУ спробуй розмістити КОЖНУ послугу в існуючу категорію з каталогу
2. Використовуй НАЙГЛИБШУ підходящу категорію (підкатегорію, а не батьківську)
3. Якщо точного збігу немає — використовуй НАЙБЛИЖЧУ існуючу категорію. Наприклад:
   - "Лазерна епіляція рук" → шукай категорію "Лазерна епіляція" або "Епіляція/Депіляція"
   - "Масаж обличчя" → шукай "Масажі" або батьківську "Косметологія"
   - Краще помістити послугу в ширшу існуючу категорію, ніж створювати нову вузьку

## КРОК 4: Створення нових категорій (ТІЛЬКИ ЯКЩО НЕОБХІДНО)
Нову категорію створюй ТІЛЬКИ якщо:
- Послуга НЕ вписується навіть у батьківську категорію найближчого напрямку
- Є щонайменше 2-3 послуги для цієї нової категорії (не створюй категорію для однієї послуги!)
- Категорія має загальний сенс для MARKETPLACE (підходить для багатьох компаній, а не тільки для цієї)

НЕ СТВОРЮЙ нову категорію якщо:
- Є існуюча категорія, куди послуга логічно вписується (навіть якщо назва трохи відрізняється)
- Це занадто вузька/специфічна категорія (краще використай батьківську)
- Для неї буде лише 1 послуга

Якщо все ж потрібна нова категорія:
- Давай ЗАГАЛЬНУ назву (підходящу для marketplace, а не специфічну для одного салону)
- parent_id — ОБОВ'ЯЗКОВО вкажи ID існуючої батьківської категорії
- Категорії можуть бути вкладеними на будь-яку глибину
- Додай іконку (emoji) та англійську назву

## КРОК 5: Фінальний розподіл послуг

ПРАВИЛА:
1. Копіюй КОЖНУ послугу — назву та ціну бери точно як у джерелі
2. global_category_id — ID існуючої категорії АБО temp_id нової (наприклад "new_1")
3. Якщо послуга збігається з шаблоном з каталогу — вкажи global_template_id. Інакше — null
4. category_name — назва категорії (для відображення)
5. Тривалість: якщо вказана у джерелі — бери звідти. Інакше — реалістичну (30, 45, 60, 90, 120 хв)
6. Ціни: бери ТОЧНО з джерела. Якщо відсутні — орієнтовну для {city}
7. Опис: коротко (1-2 речення)
8. Варіанти (зони, об'єми) з різними цінами — об'єднай в ОДНУ послугу з "price_options". price = мінімальна ціна
9. НЕ створюй окремі послуги для кожної зони — використовуй price_options
10. Якщо інформації мало — додай типові послуги для цієї спеціальності

ФОРМАТ ВІДПОВІДІ (тільки JSON, без пояснень):
{{
  "new_categories": [
    {{
      "temp_id": "new_1",
      "parent_id": 5,
      "name": "Загальна назва категорії",
      "name_en": "General category name",
      "icon": "💆"
    }}
  ],
  "categories": ["Категорія 1", "Категорія 2"],
  "services": [
    {{
      "name": "Назва послуги",
      "description": "Короткий опис",
      "duration_minutes": 60,
      "price": 1500,
      "category_name": "Категорія 1",
      "global_category_id": 5,
      "global_template_id": 42,
      "price_options": [
        {{"name": "Обличчя", "price": 1500}},
        {{"name": "Обличчя + шия", "price": 2000}},
        {{"name": "Обличчя + шия + декольте", "price": 2500}}
      ]
    }},
    {{
      "name": "Послуга у новій категорії",
      "description": "Опис",
      "duration_minutes": 45,
      "price": 800,
      "category_name": "Загальна назва категорії",
      "global_category_id": "new_1",
      "global_template_id": null,
      "price_options": []
    }}
  ]
}}

ВАЖЛИВО:
- new_categories ПОВИНЕН бути порожнім [] в більшості випадків! Створюй нові категорії ДУЖЕ рідко
- Це глобальний каталог MARKETPLACE — кожна категорія видима для ВСІХ компаній
- parent_id у new_categories — ID існуючої батьківської категорії або temp_id іншої нової
- global_category_id у services — ID існуючої категорії або temp_id нової
- price_options — ТІЛЬКИ для послуг з варіантами. Для фіксованої ціни — порожній []"""


import asyncio
import uuid
import logging
from pathlib import Path
from datetime import datetime

_ai_jobs: dict[str, dict] = {}  # job_id -> {status, result, error}
_ai_logger = logging.getLogger("ai_generation")


async def _load_global_catalog_for_prompt() -> str:
    """Load global catalog and format as text for AI prompt."""
    from app.core.database import async_session_maker
    from app.models.global_catalog import GlobalServiceCategory, GlobalServiceTemplate

    async with async_session_maker() as db:
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(GlobalServiceCategory)
            .options(selectinload(GlobalServiceCategory.templates))
            .where(GlobalServiceCategory.is_active == True)
        )
        categories = result.scalars().all()

    # Build text representation
    lines = []
    cat_by_parent: dict[int | None, list] = {}
    for cat in categories:
        cat_by_parent.setdefault(cat.parent_id, []).append(cat)

    def render_cat(cat, indent=0):
        prefix = "  " * indent
        lines.append(f"{prefix}[Категорія id={cat.id}] {cat.name}")
        for tmpl in sorted(cat.templates, key=lambda t: t.order):
            lines.append(f"{prefix}  - [Шаблон id={tmpl.id}] {tmpl.name} ({tmpl.default_duration_minutes} хв)")
        for child in cat_by_parent.get(cat.id, []):
            render_cat(child, indent + 1)

    for root in cat_by_parent.get(None, []):
        render_cat(root)

    return "\n".join(lines)


async def _run_ai_generation(job_id: str, request: GenerateServicesRequest):
    """Background task that runs AI generation."""
    try:
        import anthropic
        import json

        debug_dir = Path("/app/debug_ai_responses")
        debug_dir.mkdir(exist_ok=True)

        # Load global catalog
        global_catalog_text = await _load_global_catalog_for_prompt()

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
        system_prompt = SERVICES_GENERATION_PROMPT.format(
            city=request.city,
            global_catalog=global_catalog_text,
        )

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

        # --- Create new categories in DB ---
        new_categories_raw = data.get("new_categories", [])
        temp_id_to_real_id: dict[str, int] = {}
        created_categories: list[dict] = []

        if new_categories_raw:
            from app.core.database import async_session_maker
            from app.models.global_catalog import GlobalServiceCategory

            async with async_session_maker() as db:
                # Sort: categories whose parent_id is an existing int come first,
                # then those referencing other new categories (topological order)
                def sort_key(c):
                    pid = c.get("parent_id")
                    if pid is None or isinstance(pid, int) or (isinstance(pid, str) and pid.isdigit()):
                        return 0
                    return 1  # depends on another new category

                sorted_cats = sorted(new_categories_raw, key=sort_key)

                # Process in multiple passes to resolve dependencies
                remaining = list(sorted_cats)
                max_passes = 10
                for _ in range(max_passes):
                    if not remaining:
                        break
                    still_remaining = []
                    for cat_data in remaining:
                        temp_id = cat_data.get("temp_id", "")
                        raw_parent = cat_data.get("parent_id")

                        # Resolve parent_id
                        real_parent_id = None
                        if raw_parent is not None:
                            if isinstance(raw_parent, int):
                                real_parent_id = raw_parent
                            elif isinstance(raw_parent, str):
                                if raw_parent.isdigit():
                                    real_parent_id = int(raw_parent)
                                elif raw_parent in temp_id_to_real_id:
                                    real_parent_id = temp_id_to_real_id[raw_parent]
                                else:
                                    # Dependency not resolved yet
                                    still_remaining.append(cat_data)
                                    continue

                        # Get max order among siblings
                        from sqlalchemy import select as sa_select, func as sa_func
                        max_order_result = await db.execute(
                            sa_select(sa_func.coalesce(sa_func.max(GlobalServiceCategory.order), 0))
                            .where(GlobalServiceCategory.parent_id == real_parent_id)
                        )
                        max_order = max_order_result.scalar() or 0

                        new_cat = GlobalServiceCategory(
                            parent_id=real_parent_id,
                            name=cat_data.get("name", "Без назви"),
                            name_en=cat_data.get("name_en"),
                            icon=cat_data.get("icon"),
                            order=max_order + 1,
                            is_active=True,
                            is_ai_created=True,
                        )
                        db.add(new_cat)
                        await db.flush()  # Get the ID

                        temp_id_to_real_id[temp_id] = new_cat.id
                        created_categories.append({
                            "id": new_cat.id,
                            "parent_id": real_parent_id,
                            "name": new_cat.name,
                            "name_en": new_cat.name_en,
                            "icon": new_cat.icon,
                            "is_new": True,
                        })
                        _ai_logger.info(f"Created AI category: {new_cat.name} (id={new_cat.id}, parent={real_parent_id})")

                    remaining = still_remaining

                await db.commit()

        # --- Resolve service category IDs ---
        services = []
        for s in data.get("services", []):
            try:
                raw_cat_id = s.get("global_category_id")
                # Resolve temp_id references
                if isinstance(raw_cat_id, str) and not raw_cat_id.isdigit():
                    s["global_category_id"] = temp_id_to_real_id.get(raw_cat_id)
                elif isinstance(raw_cat_id, str) and raw_cat_id.isdigit():
                    s["global_category_id"] = int(raw_cat_id)

                services.append(GeneratedService(**s).model_dump())
            except Exception as parse_err:
                _ai_logger.warning(f"Failed to parse service: {parse_err}")

        _ai_jobs[job_id] = {
            "status": "done",
            "result": {
                "services": services,
                "categories": data.get("categories", []),
                "new_categories": created_categories,
                "estimated_tokens": input_tokens + output_tokens,
            },
        }
        _ai_logger.info(f"Job {job_id}: {len(services)} services, {len(created_categories)} new categories")

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

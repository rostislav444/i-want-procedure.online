"""API endpoints for protocol templates."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.core.config import settings
from app.models.protocol_template import ProtocolTemplate
from app.models.service import Service, ServiceCategory
from app.schemas.protocol_template import (
    ProtocolTemplateCreate,
    ProtocolTemplateUpdate,
    ProtocolTemplateResponse,
    CopyTemplateRequest,
    GenerateTemplateRequest,
    GenerateTemplateResponse,
)

router = APIRouter(prefix="/protocol-templates")


@router.get("", response_model=list[ProtocolTemplateResponse])
async def get_templates(
    current_user: CurrentUser,
    db: DbSession,
    service_id: int | None = None,
    category_id: int | None = None,
):
    """Get protocol templates for company.

    Returns templates that are:
    - System templates (available to all)
    - Company-specific templates

    Can filter by service_id or category_id.
    """
    query = select(ProtocolTemplate).where(
        or_(
            ProtocolTemplate.company_id == current_user.company_id,
            ProtocolTemplate.is_system == True,
        )
    )

    if service_id:
        query = query.where(ProtocolTemplate.service_id == service_id)
    if category_id:
        query = query.where(ProtocolTemplate.category_id == category_id)

    query = query.order_by(ProtocolTemplate.is_default.desc(), ProtocolTemplate.name)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/for-service/{service_id}", response_model=ProtocolTemplateResponse | None)
async def get_template_for_service(
    service_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get the best matching template for a service.

    Priority:
    1. Template linked directly to this service
    2. Default template for service's category
    3. Any template for service's category
    4. None
    """
    # Get service with category
    service_result = await db.execute(
        select(Service)
        .options(selectinload(Service.category))
        .where(
            Service.id == service_id,
            Service.company_id == current_user.company_id,
        )
    )
    service = service_result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # 1. Check for service-specific template
    result = await db.execute(
        select(ProtocolTemplate).where(
            ProtocolTemplate.service_id == service_id,
            or_(
                ProtocolTemplate.company_id == current_user.company_id,
                ProtocolTemplate.is_system == True,
            ),
        )
    )
    template = result.scalar_one_or_none()
    if template:
        return template

    # 2. Check for category default template
    if service.category_id:
        result = await db.execute(
            select(ProtocolTemplate).where(
                ProtocolTemplate.category_id == service.category_id,
                ProtocolTemplate.is_default == True,
                or_(
                    ProtocolTemplate.company_id == current_user.company_id,
                    ProtocolTemplate.is_system == True,
                ),
            )
        )
        template = result.scalar_one_or_none()
        if template:
            return template

        # 3. Any category template
        result = await db.execute(
            select(ProtocolTemplate).where(
                ProtocolTemplate.category_id == service.category_id,
                or_(
                    ProtocolTemplate.company_id == current_user.company_id,
                    ProtocolTemplate.is_system == True,
                ),
            ).order_by(ProtocolTemplate.created_at.desc())
        )
        template = result.scalars().first()
        if template:
            return template

    return None


@router.get("/{template_id}", response_model=ProtocolTemplateResponse)
async def get_template(
    template_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Get a specific template by ID."""
    result = await db.execute(
        select(ProtocolTemplate).where(
            ProtocolTemplate.id == template_id,
            or_(
                ProtocolTemplate.company_id == current_user.company_id,
                ProtocolTemplate.is_system == True,
            ),
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    return template


@router.post("", response_model=ProtocolTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: ProtocolTemplateCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new protocol template."""
    # Verify service if provided
    if template_data.service_id:
        service_result = await db.execute(
            select(Service).where(
                Service.id == template_data.service_id,
                Service.company_id == current_user.company_id,
            )
        )
        if not service_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found",
            )

    # Verify category if provided
    if template_data.category_id:
        category_result = await db.execute(
            select(ServiceCategory).where(
                ServiceCategory.id == template_data.category_id,
                ServiceCategory.company_id == current_user.company_id,
            )
        )
        if not category_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    # Convert sections to dict for JSON storage
    sections_data = [s.model_dump() for s in template_data.sections]

    template = ProtocolTemplate(
        company_id=current_user.company_id,
        service_id=template_data.service_id,
        category_id=template_data.category_id,
        name=template_data.name,
        description=template_data.description,
        sections=sections_data,
        is_default=template_data.is_default,
        tags=template_data.tags,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.patch("/{template_id}", response_model=ProtocolTemplateResponse)
async def update_template(
    template_id: int,
    template_data: ProtocolTemplateUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Update a protocol template."""
    result = await db.execute(
        select(ProtocolTemplate).where(
            ProtocolTemplate.id == template_id,
            ProtocolTemplate.company_id == current_user.company_id,
            ProtocolTemplate.is_system == False,  # Can't edit system templates
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or cannot be edited",
        )

    update_data = template_data.model_dump(exclude_unset=True)

    # Convert sections if provided
    if "sections" in update_data and update_data["sections"] is not None:
        update_data["sections"] = [s.model_dump() if hasattr(s, 'model_dump') else s for s in update_data["sections"]]

    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete a protocol template."""
    result = await db.execute(
        select(ProtocolTemplate).where(
            ProtocolTemplate.id == template_id,
            ProtocolTemplate.company_id == current_user.company_id,
            ProtocolTemplate.is_system == False,  # Can't delete system templates
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or cannot be deleted",
        )

    await db.delete(template)
    await db.commit()


@router.post("/copy", response_model=ProtocolTemplateResponse, status_code=status.HTTP_201_CREATED)
async def copy_template(
    copy_data: CopyTemplateRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Copy an existing template."""
    # Get source template
    result = await db.execute(
        select(ProtocolTemplate).where(
            ProtocolTemplate.id == copy_data.source_template_id,
            or_(
                ProtocolTemplate.company_id == current_user.company_id,
                ProtocolTemplate.is_system == True,
            ),
        )
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source template not found",
        )

    # Create copy
    new_template = ProtocolTemplate(
        company_id=current_user.company_id,
        service_id=copy_data.target_service_id,
        category_id=copy_data.target_category_id,
        name=copy_data.new_name or f"{source.name} (копія)",
        description=source.description,
        sections=source.sections,
        is_default=False,
        tags=source.tags,
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


# AI Generation prompt
PROTOCOL_TEMPLATE_GENERATION_PROMPT = """Ти експерт з косметологічних та медичних процедур. Твоя задача - створити шаблон протоколу процедури для документування візиту клієнта.

Створи структурований шаблон протоколу з секціями та полями для заповнення.

ВАЖЛИВО: Відповідь повинна бути ТІЛЬКИ валідним JSON без коментарів та пояснень.

Доступні типи полів:
- "text": однорядкове текстове поле
- "textarea": багаторядкове текстове поле
- "chips": вибір одного варіанту з чіпсів
- "chips_multi": вибір кількох варіантів
- "rating": рейтинг (вказати max)
- "number": числове поле (min, max, step)
- "select": випадаючий список
- "checkbox": галочка так/ні
- "photos": завантаження фото

Структура відповіді:
{{
  "name": "Назва шаблону",
  "description": "Опис шаблону",
  "sections": [
    {{
      "id": "унікальний_id_латиницею",
      "title": "Назва секції",
      "icon": "назва іконки lucide (scan, syringe, clipboard, heart, star, etc)",
      "color": "колір (blue, violet, green, orange, pink, gray)",
      "fields": [
        {{
          "id": "field_id",
          "type": "тип поля",
          "label": "Підпис поля",
          "options": ["варіант1", "варіант2"],  // для chips/chips_multi/select
          "max": 10,  // для rating
          "min": 0, "max": 100, "step": 1,  // для number
          "placeholder": "Підказка...",
          "required": false
        }}
      ]
    }}
  ],
  "suggested_tags": ["тег1", "тег2"]
}}

Створи 4-6 секцій з 2-5 полями кожна. Секції мають відповідати типу процедури.

Для ІНʼЄКЦІЙНИХ процедур додай секції:
- Оцінка стану (тип шкіри, проблеми)
- Зони введення та об'єми
- Використані препарати
- Больові відчуття та реакції
- Рекомендації по догляду
- Планування наступного візиту

Для ЧИСТОК/ПІЛІНГІВ:
- Оцінка стану шкіри
- Скарги клієнта
- Проведені етапи процедури
- Реакція шкіри
- Домашній догляд
- Планування курсу

Для МАСАЖІВ/СПА:
- Скарги та побажання
- Проблемні зони
- Техніки та засоби
- Результат та відчуття
- Рекомендації"""


@router.post("/generate", response_model=GenerateTemplateResponse)
async def generate_template(
    request: GenerateTemplateRequest,
    current_user: CurrentUser,
):
    """Generate a protocol template using AI based on service name."""
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    user_prompt = f"""Створи шаблон протоколу для процедури:

Назва послуги: {request.service_name}
{f'Опис: {request.service_description}' if request.service_description else ''}
{f'Категорія: {request.category_name}' if request.category_name else ''}
{f'Додаткові побажання: {request.hints}' if request.hints else ''}

Відповідь ТІЛЬКИ у форматі JSON."""

    try:
        import anthropic
        import json

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=PROTOCOL_TEMPLATE_GENERATION_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt,
                }
            ],
        )

        response_text = message.content[0].text

        # Parse JSON response
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            data = json.loads(response_text.strip())
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to parse AI response as JSON",
                )

        return GenerateTemplateResponse(
            name=data.get("name", f"Протокол: {request.service_name}"),
            description=data.get("description", ""),
            sections=data.get("sections", []),
            suggested_tags=data.get("suggested_tags", []),
        )

    except anthropic.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI API error: {str(e)}",
        )

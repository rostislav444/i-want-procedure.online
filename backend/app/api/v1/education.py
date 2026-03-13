"""Education admin endpoints for educator companies."""
import json
import re

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.company import CompanyType, Company
from app.models.education import (
    EducationTopicCategory,
    EducatorOffering,
    EducatorEvent,
    EventRegistration,
    EventTicketType,
)
from app.models.offering_question import OfferingQuestion
from app.schemas.education import (
    TopicCategoryResponse,
    TopicCategoryTreeResponse,
    OfferingCreate,
    OfferingUpdate,
    OfferingResponse,
    EventCreate,
    EventUpdate,
    EventResponse,
    RegistrationResponse,
    RegistrationUpdateStatus,
    MyRegistrationResponse,
    MyEventInfo,
    TicketTypeCreate,
    TicketTypeUpdate,
    TicketTypeResponse,
    QuestionAnswer,
    QuestionAdminResponse,
)
from app.schemas.city import CityShort

router = APIRouter(prefix="/education")


async def _require_educator(current_user, db: DbSession):
    """Ensure the current company is of type educator."""
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for educator accounts",
        )
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company or company.type != CompanyType.EDUCATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is only available for educator accounts",
        )
    return company


def _serialize_json_field(value) -> str | None:
    """Serialize list/dict to JSON string for storage."""
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


def _deserialize_offering(offering: EducatorOffering) -> OfferingResponse:
    """Convert offering model to response, deserializing JSON fields."""
    def _parse(value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value

    data = {c.key: getattr(offering, c.key) for c in offering.__mapper__.column_attrs}
    data['learning_outcomes'] = _parse(data.get('learning_outcomes'))
    data['what_includes'] = _parse(data.get('what_includes'))
    data['curriculum'] = _parse(data.get('curriculum'))
    return OfferingResponse.model_validate(data)


def _generate_slug(title: str) -> str:
    """Generate slug from title."""
    try:
        import transliterate
        slug = transliterate.translit(title, 'uk', reversed=True)
    except Exception:
        slug = title
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'offering'


# ===== Topic categories (read-only for educators) =====

@router.get("/categories", response_model=list[TopicCategoryResponse])
async def get_topic_categories(current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducationTopicCategory)
        .where(EducationTopicCategory.is_active == True)
        .order_by(EducationTopicCategory.order)
    )
    return result.scalars().all()


@router.get("/categories/tree", response_model=list[TopicCategoryTreeResponse])
async def get_topic_categories_tree(current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducationTopicCategory)
        .where(EducationTopicCategory.is_active == True)
        .options(selectinload(EducationTopicCategory.children))
        .order_by(EducationTopicCategory.order)
    )
    categories = result.scalars().all()
    return [c for c in categories if c.parent_id is None]


# ===== Offerings CRUD =====

@router.get("/offerings", response_model=list[OfferingResponse])
async def get_offerings(current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorOffering)
        .options(selectinload(EducatorOffering.topic_category))
        .where(EducatorOffering.company_id == current_user.company_id)
        .order_by(EducatorOffering.order, EducatorOffering.created_at.desc())
    )
    offerings = result.scalars().all()

    # Add upcoming events count
    responses = []
    for o in offerings:
        resp = _deserialize_offering(o)
        count_result = await db.execute(
            select(func.count(EducatorEvent.id))
            .where(
                EducatorEvent.offering_id == o.id,
                EducatorEvent.is_published == True,
                EducatorEvent.is_cancelled == False,
                EducatorEvent.start_at > func.now(),
            )
        )
        resp.upcoming_events_count = count_result.scalar() or 0
        responses.append(resp)
    return responses


@router.post("/offerings", response_model=OfferingResponse, status_code=status.HTTP_201_CREATED)
async def create_offering(
    data: OfferingCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    await _require_educator(current_user, db)
    slug = _generate_slug(data.title)

    # Ensure unique slug per company
    existing = await db.execute(
        select(EducatorOffering)
        .where(
            EducatorOffering.company_id == current_user.company_id,
            EducatorOffering.slug == slug,
        )
    )
    if existing.scalar_one_or_none():
        slug = f"{slug}-{int(func.now().compile())}"[:200]

    offering = EducatorOffering(
        company_id=current_user.company_id,
        topic_category_id=data.topic_category_id,
        type=data.type,
        title=data.title,
        slug=slug,
        description=data.description,
        short_description=data.short_description,
        cover_image_url=data.cover_image_url,
        price=data.price,
        is_digital=data.is_digital,
        digital_file_url=data.digital_file_url,
        promo_video_url=data.promo_video_url,
        content_url=data.content_url,
        prerequisites=data.prerequisites,
        duration_hours=data.duration_hours,
        order=data.order,
        target_audience=data.target_audience,
        level=data.level,
        language=data.language,
        certificate_included=data.certificate_included,
        learning_outcomes=_serialize_json_field(data.learning_outcomes),
        what_includes=_serialize_json_field(data.what_includes),
        curriculum=_serialize_json_field(data.curriculum),
    )
    db.add(offering)
    await db.flush()
    await db.refresh(offering, attribute_names=["topic_category"])
    return _deserialize_offering(offering)


@router.get("/offerings/{offering_id}", response_model=OfferingResponse)
async def get_offering(offering_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorOffering)
        .options(selectinload(EducatorOffering.topic_category))
        .where(
            EducatorOffering.id == offering_id,
            EducatorOffering.company_id == current_user.company_id,
        )
    )
    offering = result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    return _deserialize_offering(offering)


@router.patch("/offerings/{offering_id}", response_model=OfferingResponse)
async def update_offering(
    offering_id: int,
    data: OfferingUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorOffering)
        .options(selectinload(EducatorOffering.topic_category))
        .where(
            EducatorOffering.id == offering_id,
            EducatorOffering.company_id == current_user.company_id,
        )
    )
    offering = result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")

    update_data = data.model_dump(exclude_unset=True)
    json_fields = {"learning_outcomes", "what_includes", "curriculum"}
    for field, value in update_data.items():
        if field in json_fields:
            setattr(offering, field, _serialize_json_field(value))
        else:
            setattr(offering, field, value)

    await db.flush()
    await db.refresh(offering, attribute_names=["topic_category"])
    return _deserialize_offering(offering)


@router.delete("/offerings/{offering_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offering(offering_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorOffering).where(
            EducatorOffering.id == offering_id,
            EducatorOffering.company_id == current_user.company_id,
        )
    )
    offering = result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    await db.delete(offering)


# ===== Events CRUD =====

def _event_to_response(event, registrations_count: int = 0) -> EventResponse:
    resp = EventResponse.model_validate(event)
    if event.city_ref:
        resp.city_info = CityShort.model_validate(event.city_ref)
    resp.registrations_count = registrations_count
    if event.max_participants:
        resp.spots_left = max(0, event.max_participants - registrations_count)
    # Include ticket types with spots_left
    resp.ticket_types = []
    for tt in (event.ticket_types if hasattr(event, 'ticket_types') and event.ticket_types else []):
        tt_resp = TicketTypeResponse.model_validate(tt)
        if tt.quantity is not None:
            tt_resp.spots_left = max(0, tt.quantity - tt.sold_count)
        resp.ticket_types.append(tt_resp)
    return resp


@router.get("/events", response_model=list[EventResponse])
async def get_events(current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorEvent)
        .options(selectinload(EducatorEvent.ticket_types))
        .where(EducatorEvent.company_id == current_user.company_id)
        .order_by(EducatorEvent.start_at.desc())
    )
    events = result.scalars().all()

    responses = []
    for e in events:
        count_result = await db.execute(
            select(func.count(EventRegistration.id))
            .where(EventRegistration.event_id == e.id)
        )
        count = count_result.scalar() or 0
        responses.append(_event_to_response(e, count))
    return responses


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    await _require_educator(current_user, db)
    event = EducatorEvent(
        company_id=current_user.company_id,
        offering_id=data.offering_id,
        title=data.title,
        description=data.description,
        cover_image_url=data.cover_image_url,
        start_at=data.start_at,
        end_at=data.end_at,
        is_multi_day=data.is_multi_day,
        schedule_details=data.schedule_details,
        city_id=data.city_id,
        venue_name=data.venue_name,
        venue_address=data.venue_address,
        is_online=data.is_online,
        online_link=data.online_link,
        price=data.price,
        early_bird_price=data.early_bird_price,
        early_bird_until=data.early_bird_until,
        max_participants=data.max_participants,
        is_published=data.is_published,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event, attribute_names=["city_ref", "ticket_types"])
    return _event_to_response(event, 0)


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorEvent)
        .options(selectinload(EducatorEvent.ticket_types))
        .where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == current_user.company_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    count_result = await db.execute(
        select(func.count(EventRegistration.id))
        .where(EventRegistration.event_id == event.id)
    )
    count = count_result.scalar() or 0
    return _event_to_response(event, count)


@router.patch("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorEvent).where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == current_user.company_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await db.flush()
    await db.refresh(event, attribute_names=["city_ref", "ticket_types"])

    count_result = await db.execute(
        select(func.count(EventRegistration.id))
        .where(EventRegistration.event_id == event.id)
    )
    count = count_result.scalar() or 0
    return _event_to_response(event, count)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    result = await db.execute(
        select(EducatorEvent).where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == current_user.company_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)


# ===== Event Registrations =====

@router.get("/events/{event_id}/registrations", response_model=list[RegistrationResponse])
async def get_event_registrations(event_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    # Verify event belongs to this company
    event_result = await db.execute(
        select(EducatorEvent).where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == current_user.company_id,
        )
    )
    if not event_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(
        select(EventRegistration)
        .where(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.created_at.desc())
    )
    return result.scalars().all()


@router.patch(
    "/events/{event_id}/registrations/{registration_id}",
    response_model=RegistrationResponse,
)
async def update_registration_status(
    event_id: int,
    registration_id: int,
    data: RegistrationUpdateStatus,
    current_user: CurrentUser,
    db: DbSession,
):
    await _require_educator(current_user, db)
    # Verify event belongs to this company
    event_result = await db.execute(
        select(EducatorEvent).where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == current_user.company_id,
        )
    )
    if not event_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.id == registration_id,
            EventRegistration.event_id == event_id,
        )
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    registration.status = data.status
    await db.flush()
    return registration


# ===== My Registrations (for any authenticated user / cosmetologist) =====

@router.get("/my-registrations", response_model=list[MyRegistrationResponse])
async def get_my_registrations(current_user: CurrentUser, db: DbSession):
    """Return all event registrations for the current user, enriched with event + educator info."""
    result = await db.execute(
        select(EventRegistration)
        .where(EventRegistration.user_id == current_user.id)
        .order_by(EventRegistration.created_at.desc())
    )
    registrations = result.scalars().all()

    responses = []
    for reg in registrations:
        # Load event
        event_result = await db.execute(
            select(EducatorEvent)
            .options(
                selectinload(EducatorEvent.city_ref),
                selectinload(EducatorEvent.offering),
            )
            .where(EducatorEvent.id == reg.event_id)
        )
        event = event_result.scalar_one_or_none()
        if not event:
            continue

        # Load educator company
        educator_result = await db.execute(
            select(Company).where(Company.id == event.company_id)
        )
        educator = educator_result.scalar_one_or_none()

        event_info = MyEventInfo(
            id=event.id,
            title=event.title,
            description=event.description,
            cover_image_url=event.cover_image_url,
            event_type=event.offering.type.value if event.offering else None,
            start_at=event.start_at,
            end_at=event.end_at,
            is_multi_day=event.is_multi_day,
            city_info=CityShort.model_validate(event.city_ref) if event.city_ref else None,
            is_online=event.is_online,
            online_link=event.online_link,
            venue_name=event.venue_name,
            venue_address=event.venue_address,
            price=event.price,
            educator_name=educator.name if educator else "",
            educator_slug=educator.slug if educator else "",
            educator_logo_url=educator.logo_url if educator else None,
        )

        responses.append(MyRegistrationResponse(
            id=reg.id,
            event_id=reg.event_id,
            status=reg.status,
            created_at=reg.created_at,
            event=event_info,
        ))

    return responses


# ===== Event Ticket Types CRUD =====

async def _get_event_for_educator(event_id: int, company_id: int, db: DbSession):
    result = await db.execute(
        select(EducatorEvent).where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == company_id,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/events/{event_id}/ticket-types", response_model=list[TicketTypeResponse])
async def get_ticket_types(event_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    await _get_event_for_educator(event_id, current_user.company_id, db)
    result = await db.execute(
        select(EventTicketType)
        .where(EventTicketType.event_id == event_id)
        .order_by(EventTicketType.order)
    )
    ticket_types = result.scalars().all()
    responses = []
    for tt in ticket_types:
        resp = TicketTypeResponse.model_validate(tt)
        if tt.quantity is not None:
            resp.spots_left = max(0, tt.quantity - tt.sold_count)
        responses.append(resp)
    return responses


@router.post("/events/{event_id}/ticket-types", response_model=TicketTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket_type(event_id: int, data: TicketTypeCreate, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    await _get_event_for_educator(event_id, current_user.company_id, db)
    ticket_type = EventTicketType(
        event_id=event_id,
        name=data.name,
        description=data.description,
        price=data.price,
        quantity=data.quantity,
        is_active=data.is_active,
        order=data.order,
    )
    db.add(ticket_type)
    await db.flush()
    resp = TicketTypeResponse.model_validate(ticket_type)
    if ticket_type.quantity is not None:
        resp.spots_left = max(0, ticket_type.quantity - ticket_type.sold_count)
    return resp


@router.patch("/events/{event_id}/ticket-types/{ticket_type_id}", response_model=TicketTypeResponse)
async def update_ticket_type(event_id: int, ticket_type_id: int, data: TicketTypeUpdate, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    await _get_event_for_educator(event_id, current_user.company_id, db)
    result = await db.execute(
        select(EventTicketType).where(
            EventTicketType.id == ticket_type_id,
            EventTicketType.event_id == event_id,
        )
    )
    ticket_type = result.scalar_one_or_none()
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ticket_type, field, value)
    await db.flush()
    resp = TicketTypeResponse.model_validate(ticket_type)
    if ticket_type.quantity is not None:
        resp.spots_left = max(0, ticket_type.quantity - ticket_type.sold_count)
    return resp


@router.delete("/events/{event_id}/ticket-types/{ticket_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket_type(event_id: int, ticket_type_id: int, current_user: CurrentUser, db: DbSession):
    await _require_educator(current_user, db)
    await _get_event_for_educator(event_id, current_user.company_id, db)
    result = await db.execute(
        select(EventTicketType).where(
            EventTicketType.id == ticket_type_id,
            EventTicketType.event_id == event_id,
        )
    )
    ticket_type = result.scalar_one_or_none()
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    await db.delete(ticket_type)

    return responses


# ── Questions admin ────────────────────────────────────────────────

@router.get("/questions", response_model=list[QuestionAdminResponse])
async def get_unanswered_questions(current_user: CurrentUser, db: DbSession):
    """Get all questions for the educator's company (unanswered first)."""
    company = await _require_educator(current_user, db)
    result = await db.execute(
        select(OfferingQuestion)
        .where(OfferingQuestion.company_id == company.id)
        .order_by(OfferingQuestion.is_answered.asc(), OfferingQuestion.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("/questions/{question_id}/answer", response_model=QuestionAdminResponse)
async def answer_question(
    question_id: int,
    data: QuestionAnswer,
    current_user: CurrentUser,
    db: DbSession,
):
    """Answer a question."""
    from datetime import datetime, timezone
    company = await _require_educator(current_user, db)
    result = await db.execute(
        select(OfferingQuestion).where(
            OfferingQuestion.id == question_id,
            OfferingQuestion.company_id == company.id,
        )
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.answer = data.answer
    q.is_answered = True
    q.answered_at = datetime.now(timezone.utc)
    await db.flush()
    return q


@router.delete("/questions/{question_id}", status_code=204)
async def hide_question(
    question_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Hide a question (soft delete)."""
    company = await _require_educator(current_user, db)
    result = await db.execute(
        select(OfferingQuestion).where(
            OfferingQuestion.id == question_id,
            OfferingQuestion.company_id == company.id,
        )
    )
    q = result.scalar_one_or_none()
    if q:
        q.is_visible = False
        await db.flush()

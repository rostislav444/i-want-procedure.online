"""Public education marketplace endpoints (no authentication required)."""
import json
import math
from datetime import date

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models.company import Company, CompanyType
from app.models.education import (
    EducationTopicCategory,
    EducatorOffering,
    EducatorEvent,
    EventRegistration,
    RegistrationStatus,
)
from app.models.city import City
from app.models.offering_question import OfferingQuestion
from app.schemas.education import (
    TopicCategoryResponse,
    TopicCategoryTreeResponse,
    OfferingResponse,
    EventResponse,
    EventCardResponse,
    EducatorCardResponse,
    EducatorDetailResponse,
    EducationMarketplaceResponse,
    EventsListResponse,
    RegistrationCreate,
    RegistrationResponse,
    QuestionCreate,
    QuestionResponse,
)
from app.schemas.city import CityShort

router = APIRouter(prefix="/public/education")


def _deserialize_offering_public(offering: EducatorOffering) -> OfferingResponse:
    """Convert offering ORM object to response, parsing JSON string fields."""
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
    resp = OfferingResponse.model_validate(data)
    if offering.topic_category:
        resp.topic_category = TopicCategoryResponse.model_validate(offering.topic_category)
    return resp


# ── Offerings Marketplace ─────────────────────────────────────────

@router.get("/offerings", response_model=list[OfferingResponse])
async def list_all_offerings(
    db: DbSession,
    q: str | None = Query(None),
    topic_category_id: int | None = Query(None),
    type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """List all active offerings across all educator companies."""
    query = (
        select(EducatorOffering)
        .join(Company, Company.id == EducatorOffering.company_id)
        .options(selectinload(EducatorOffering.topic_category))
        .where(
            EducatorOffering.is_active == True,
            Company.type == CompanyType.EDUCATOR,
            Company.website_enabled == True,
        )
    )
    if q:
        query = query.where(
            or_(
                EducatorOffering.title.ilike(f"%{q}%"),
                EducatorOffering.short_description.ilike(f"%{q}%"),
            )
        )
    if topic_category_id:
        query = query.where(EducatorOffering.topic_category_id == topic_category_id)
    if type:
        query = query.where(EducatorOffering.type == type)

    query = query.order_by(EducatorOffering.created_at.desc())
    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size))
    offerings = result.scalars().all()

    # Fetch company slugs and names in one query
    company_ids = list({o.company_id for o in offerings})
    slugs_result = await db.execute(
        select(Company.id, Company.slug, Company.name).where(Company.id.in_(company_ids))
    )
    company_map = {row[0]: (row[1], row[2]) for row in slugs_result.all()}

    responses = []
    for o in offerings:
        resp = _deserialize_offering_public(o)
        company_info = company_map.get(o.company_id)
        if company_info:
            resp.educator_slug = company_info[0]
            resp.educator_name = company_info[1]
        responses.append(resp)
    return responses


# ── Education Marketplace ──────────────────────────────────────────

@router.get("", response_model=EducationMarketplaceResponse)
async def list_educators(
    db: DbSession,
    q: str | None = Query(None, description="Search by name"),
    city_id: int | None = Query(None),
    topic_category_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """List educators for the education marketplace."""
    query = (
        select(Company)
        .where(
            Company.type == CompanyType.EDUCATOR,
            Company.website_enabled == True,
        )
    )

    if q:
        query = query.where(
            or_(
                Company.name.ilike(f"%{q}%"),
                Company.educator_tagline.ilike(f"%{q}%"),
            )
        )
    if city_id:
        query = query.where(Company.city_id == city_id)
    if topic_category_id:
        query = query.where(
            Company.id.in_(
                select(EducatorOffering.company_id)
                .where(EducatorOffering.topic_category_id == topic_category_id)
                .distinct()
            )
        )

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Fetch
    result = await db.execute(
        query
        .options(selectinload(Company.city_ref))
        .order_by(Company.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    companies = result.scalars().all()

    items = []
    for c in companies:
        # Count offerings
        off_count = (await db.execute(
            select(func.count(EducatorOffering.id))
            .where(EducatorOffering.company_id == c.id, EducatorOffering.is_active == True)
        )).scalar() or 0

        # Count upcoming events
        ev_count = (await db.execute(
            select(func.count(EducatorEvent.id))
            .where(
                EducatorEvent.company_id == c.id,
                EducatorEvent.is_published == True,
                EducatorEvent.is_cancelled == False,
                EducatorEvent.start_at > func.now(),
            )
        )).scalar() or 0

        # Get topic category names
        cats_result = await db.execute(
            select(EducationTopicCategory.name)
            .join(EducatorOffering, EducatorOffering.topic_category_id == EducationTopicCategory.id)
            .where(EducatorOffering.company_id == c.id)
            .distinct()
        )
        topic_cats = [r[0] for r in cats_result.all()]

        item = EducatorCardResponse(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            logo_url=c.logo_url,
            cover_image_url=c.cover_image_url,
            educator_tagline=c.educator_tagline,
            industry_theme=c.industry_theme,
            city_info=CityShort.model_validate(c.city_ref) if c.city_ref else None,
            social_links=c.social_links,
            offerings_count=off_count,
            upcoming_events_count=ev_count,
            topic_categories=topic_cats,
        )
        items.append(item)

    return EducationMarketplaceResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/cities")
async def get_education_cities(db: DbSession):
    """Cities that have educators."""
    result = await db.execute(
        select(City)
        .where(
            City.id.in_(
                select(Company.city_id)
                .where(
                    Company.type == CompanyType.EDUCATOR,
                    Company.website_enabled == True,
                    Company.city_id.isnot(None),
                )
                .distinct()
            )
        )
        .order_by(City.name)
    )
    return [CityShort.model_validate(c) for c in result.scalars().all()]


@router.get("/categories", response_model=list[TopicCategoryTreeResponse])
async def get_education_categories(db: DbSession):
    """Active topic categories with children."""
    result = await db.execute(
        select(EducationTopicCategory)
        .where(EducationTopicCategory.is_active == True)
        .options(selectinload(EducationTopicCategory.children))
        .order_by(EducationTopicCategory.order)
    )
    categories = result.scalars().all()
    return [c for c in categories if c.parent_id is None]


# ── Afisha (Events) ──────────────────────────────────────────

@router.get("/events", response_model=EventsListResponse)
async def list_upcoming_events(
    db: DbSession,
    q: str | None = Query(None),
    city_id: int | None = Query(None),
    topic_category_id: int | None = Query(None),
    event_type: str | None = Query(None, description="course, seminar, masterclass, guide, certification"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    price_min: int | None = Query(None, description="Min price in kopecks"),
    price_max: int | None = Query(None, description="Max price in kopecks"),
    is_online: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """Afisha — list upcoming events with filtering."""
    query = (
        select(EducatorEvent)
        .join(Company, Company.id == EducatorEvent.company_id)
        .where(
            EducatorEvent.is_published == True,
            EducatorEvent.is_cancelled == False,
            EducatorEvent.start_at > func.now(),
            Company.type == CompanyType.EDUCATOR,
            Company.website_enabled == True,
        )
    )

    if q:
        query = query.where(EducatorEvent.title.ilike(f"%{q}%"))
    if city_id:
        query = query.where(EducatorEvent.city_id == city_id)
    if topic_category_id:
        query = query.where(
            EducatorEvent.offering_id.in_(
                select(EducatorOffering.id)
                .where(EducatorOffering.topic_category_id == topic_category_id)
            )
        )
    if event_type:
        query = query.where(
            EducatorEvent.offering_id.in_(
                select(EducatorOffering.id)
                .where(EducatorOffering.type == event_type)
            )
        )
    if date_from:
        query = query.where(func.date(EducatorEvent.start_at) >= date_from)
    if date_to:
        query = query.where(func.date(EducatorEvent.start_at) <= date_to)
    if price_min is not None:
        query = query.where(EducatorEvent.price >= price_min)
    if price_max is not None:
        query = query.where(EducatorEvent.price <= price_max)
    if is_online is not None:
        query = query.where(EducatorEvent.is_online == is_online)

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Fetch with company info
    result = await db.execute(
        query
        .options(
            selectinload(EducatorEvent.city_ref),
            selectinload(EducatorEvent.company),
            selectinload(EducatorEvent.offering),
        )
        .order_by(EducatorEvent.start_at.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    events = result.scalars().all()

    items = []
    for e in events:
        # Count registrations
        reg_count = (await db.execute(
            select(func.count(EventRegistration.id))
            .where(
                EventRegistration.event_id == e.id,
                EventRegistration.status != RegistrationStatus.CANCELLED,
            )
        )).scalar() or 0

        spots_left = None
        if e.max_participants:
            spots_left = max(0, e.max_participants - reg_count)

        items.append(EventCardResponse(
            id=e.id,
            title=e.title,
            description=e.description,
            cover_image_url=e.cover_image_url,
            event_type=e.offering.type if e.offering else None,
            start_at=e.start_at,
            end_at=e.end_at,
            is_multi_day=e.is_multi_day,
            city_info=CityShort.model_validate(e.city_ref) if e.city_ref else None,
            is_online=e.is_online,
            price=e.price,
            early_bird_price=e.early_bird_price,
            early_bird_until=e.early_bird_until,
            max_participants=e.max_participants,
            spots_left=spots_left,
            educator_name=e.company.name if e.company else "",
            educator_slug=e.company.slug if e.company else "",
            educator_logo_url=e.company.logo_url if e.company else None,
        ))

    return EventsListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ── Educator Profile ──────────────────────────────────────────

@router.get("/{slug}", response_model=EducatorDetailResponse)
async def get_educator(slug: str, db: DbSession):
    """Get educator profile by slug."""
    result = await db.execute(
        select(Company)
        .options(selectinload(Company.city_ref))
        .where(
            Company.slug == slug,
            Company.type == CompanyType.EDUCATOR,
            Company.website_enabled == True,
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Educator not found")

    resp = EducatorDetailResponse.model_validate(company)
    if company.city_ref:
        resp.city_info = CityShort.model_validate(company.city_ref)
    return resp


@router.get("/{slug}/offerings", response_model=list[OfferingResponse])
async def get_educator_offerings(slug: str, db: DbSession):
    """Get educator's active offerings."""
    company = await _get_educator_company(slug, db)

    result = await db.execute(
        select(EducatorOffering)
        .options(selectinload(EducatorOffering.topic_category))
        .where(
            EducatorOffering.company_id == company.id,
            EducatorOffering.is_active == True,
        )
        .order_by(EducatorOffering.order, EducatorOffering.created_at.desc())
    )
    offerings = result.scalars().all()

    responses = []
    for o in offerings:
        resp = _deserialize_offering_public(o)
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


@router.get("/{slug}/offerings/{offering_slug}", response_model=OfferingResponse)
async def get_educator_offering(slug: str, offering_slug: str, db: DbSession):
    """Get a single educator offering by slug."""
    company = await _get_educator_company(slug, db)

    result = await db.execute(
        select(EducatorOffering)
        .options(selectinload(EducatorOffering.topic_category))
        .where(
            EducatorOffering.company_id == company.id,
            EducatorOffering.slug == offering_slug,
            EducatorOffering.is_active == True,
        )
    )
    offering = result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")

    resp = _deserialize_offering_public(offering)
    count_result = await db.execute(
        select(func.count(EducatorEvent.id))
        .where(
            EducatorEvent.offering_id == offering.id,
            EducatorEvent.is_published == True,
            EducatorEvent.is_cancelled == False,
            EducatorEvent.start_at > func.now(),
        )
    )
    resp.upcoming_events_count = count_result.scalar() or 0
    return resp


@router.get("/{slug}/events", response_model=list[EventResponse])
async def get_educator_events(slug: str, db: DbSession):
    """Get educator's upcoming published events."""
    company = await _get_educator_company(slug, db)

    result = await db.execute(
        select(EducatorEvent)
        .where(
            EducatorEvent.company_id == company.id,
            EducatorEvent.is_published == True,
            EducatorEvent.is_cancelled == False,
            EducatorEvent.start_at > func.now(),
        )
        .order_by(EducatorEvent.start_at.asc())
    )
    events = result.scalars().all()

    responses = []
    for e in events:
        reg_count = (await db.execute(
            select(func.count(EventRegistration.id))
            .where(
                EventRegistration.event_id == e.id,
                EventRegistration.status != RegistrationStatus.CANCELLED,
            )
        )).scalar() or 0
        resp = EventResponse.model_validate(e)
        if e.city_ref:
            resp.city_info = CityShort.model_validate(e.city_ref)
        resp.registrations_count = reg_count
        if e.max_participants:
            resp.spots_left = max(0, e.max_participants - reg_count)
        responses.append(resp)
    return responses


@router.get("/{slug}/events/{event_id}", response_model=EventResponse)
async def get_educator_event_detail(slug: str, event_id: int, db: DbSession):
    """Get single event detail."""
    company = await _get_educator_company(slug, db)

    result = await db.execute(
        select(EducatorEvent).where(
            EducatorEvent.id == event_id,
            EducatorEvent.company_id == company.id,
            EducatorEvent.is_published == True,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    reg_count = (await db.execute(
        select(func.count(EventRegistration.id))
        .where(
            EventRegistration.event_id == event.id,
            EventRegistration.status != RegistrationStatus.CANCELLED,
        )
    )).scalar() or 0

    resp = EventResponse.model_validate(event)
    if event.city_ref:
        resp.city_info = CityShort.model_validate(event.city_ref)
    resp.registrations_count = reg_count
    if event.max_participants:
        resp.spots_left = max(0, event.max_participants - reg_count)
    return resp


# ── Event Registration ──────────────────────────────────────────

@router.post("/events/{event_id}/register", response_model=RegistrationResponse, status_code=201)
async def register_for_event(
    event_id: int,
    data: RegistrationCreate,
    db: DbSession,
):
    """Register for an event (public, no auth required)."""
    result = await db.execute(
        select(EducatorEvent)
        .join(Company)
        .where(
            EducatorEvent.id == event_id,
            EducatorEvent.is_published == True,
            EducatorEvent.is_cancelled == False,
            Company.type == CompanyType.EDUCATOR,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check capacity
    if event.max_participants:
        reg_count = (await db.execute(
            select(func.count(EventRegistration.id))
            .where(
                EventRegistration.event_id == event.id,
                EventRegistration.status != RegistrationStatus.CANCELLED,
            )
        )).scalar() or 0

        if reg_count >= event.max_participants:
            # Add to waitlist
            registration = EventRegistration(
                event_id=event_id,
                full_name=data.full_name,
                email=data.email,
                phone=data.phone,
                telegram=data.telegram,
                notes=data.notes,
                status=RegistrationStatus.WAITLIST,
            )
            db.add(registration)
            await db.flush()
            return registration

    registration = EventRegistration(
        event_id=event_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        telegram=data.telegram,
        notes=data.notes,
        status=RegistrationStatus.PENDING,
    )
    db.add(registration)
    await db.flush()
    return registration


# ── Helpers ──────────────────────────────────────────

async def _get_educator_company(slug: str, db) -> Company:
    result = await db.execute(
        select(Company)
        .options(selectinload(Company.city_ref))
        .where(
            Company.slug == slug,
            Company.type == CompanyType.EDUCATOR,
            Company.website_enabled == True,
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Educator not found")
    return company


# ── Questions ─────────────────────────────────────────────────────

@router.get("/{slug}/offerings/{offering_slug}/questions", response_model=list[QuestionResponse])
async def get_offering_questions(slug: str, offering_slug: str, db: DbSession):
    """Get visible questions for an offering."""
    company = await _get_educator_company(slug, db)

    offering_result = await db.execute(
        select(EducatorOffering).where(
            EducatorOffering.company_id == company.id,
            EducatorOffering.slug == offering_slug,
            EducatorOffering.is_active == True,
        )
    )
    offering = offering_result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")

    result = await db.execute(
        select(OfferingQuestion)
        .where(
            OfferingQuestion.offering_id == offering.id,
            OfferingQuestion.is_visible == True,
        )
        .order_by(OfferingQuestion.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{slug}/offerings/{offering_slug}/questions", response_model=QuestionResponse, status_code=201)
async def post_offering_question(
    slug: str,
    offering_slug: str,
    data: QuestionCreate,
    db: DbSession,
):
    """Post a question about an offering."""
    company = await _get_educator_company(slug, db)

    offering_result = await db.execute(
        select(EducatorOffering).where(
            EducatorOffering.company_id == company.id,
            EducatorOffering.slug == offering_slug,
            EducatorOffering.is_active == True,
        )
    )
    offering = offering_result.scalar_one_or_none()
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")

    q = OfferingQuestion(
        offering_id=offering.id,
        company_id=company.id,
        visitor_name=data.visitor_name,
        visitor_email=data.visitor_email,
        question=data.question,
    )
    db.add(q)
    await db.flush()
    return q

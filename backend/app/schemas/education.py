from datetime import datetime
from typing import Any
from pydantic import BaseModel

from app.models.education import OfferingType, RegistrationStatus
from app.schemas.city import CityShort


# Topic Category schemas
class TopicCategoryResponse(BaseModel):
    id: int
    parent_id: int | None = None
    name: str
    name_en: str | None = None
    icon: str | None = None
    order: int = 0
    is_active: bool = True

    class Config:
        from_attributes = True


class TopicCategoryTreeResponse(TopicCategoryResponse):
    children: list["TopicCategoryTreeResponse"] = []


# Ticket type schemas
class TicketTypeCreate(BaseModel):
    name: str
    description: str | None = None
    price: int = 0
    quantity: int | None = None
    is_active: bool = True
    order: int = 0


class TicketTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: int | None = None
    quantity: int | None = None
    is_active: bool | None = None
    order: int | None = None


class TicketTypeResponse(BaseModel):
    id: int
    event_id: int
    name: str
    description: str | None = None
    price: int = 0
    quantity: int | None = None
    sold_count: int = 0
    is_active: bool = True
    order: int = 0
    spots_left: int | None = None  # computed

    class Config:
        from_attributes = True


# Offering schemas
class OfferingCreate(BaseModel):
    topic_category_id: int | None = None
    type: OfferingType
    title: str
    description: str | None = None
    short_description: str | None = None
    cover_image_url: str | None = None
    price: int = 0
    is_digital: bool = False
    digital_file_url: str | None = None
    promo_video_url: str | None = None
    content_url: str | None = None
    prerequisites: str | None = None
    duration_hours: int | None = None
    order: int = 0
    # Enrichment fields
    learning_outcomes: list[str] | None = None   # stored as JSON
    target_audience: str | None = None
    level: str | None = None
    curriculum: list[dict[str, Any]] | None = None  # stored as JSON
    language: str = "uk"
    certificate_included: bool = False
    what_includes: list[str] | None = None        # stored as JSON


class OfferingUpdate(BaseModel):
    topic_category_id: int | None = None
    type: OfferingType | None = None
    title: str | None = None
    description: str | None = None
    short_description: str | None = None
    cover_image_url: str | None = None
    price: int | None = None
    is_digital: bool | None = None
    digital_file_url: str | None = None
    promo_video_url: str | None = None
    content_url: str | None = None
    prerequisites: str | None = None
    duration_hours: int | None = None
    is_active: bool | None = None
    order: int | None = None
    # Enrichment fields
    learning_outcomes: list[str] | None = None
    target_audience: str | None = None
    level: str | None = None
    curriculum: list[dict[str, Any]] | None = None
    language: str | None = None
    certificate_included: bool | None = None
    what_includes: list[str] | None = None


class OfferingResponse(BaseModel):
    id: int
    company_id: int
    topic_category_id: int | None = None
    type: OfferingType
    title: str
    slug: str
    description: str | None = None
    short_description: str | None = None
    cover_image_url: str | None = None
    price: int = 0
    currency: str = "UAH"
    is_digital: bool = False
    digital_file_url: str | None = None
    promo_video_url: str | None = None
    content_url: str | None = None
    prerequisites: str | None = None
    duration_hours: int | None = None
    is_active: bool = True
    order: int = 0
    created_at: datetime
    topic_category: TopicCategoryResponse | None = None
    upcoming_events_count: int = 0
    # Enrichment fields
    learning_outcomes: list[str] | None = None
    target_audience: str | None = None
    level: str | None = None
    curriculum: list[dict[str, Any]] | None = None
    language: str = "uk"
    certificate_included: bool = False
    what_includes: list[str] | None = None
    educator_slug: str | None = None  # Set by marketplace endpoint
    educator_name: str | None = None  # Set by marketplace endpoint

    class Config:
        from_attributes = True


# Question schemas
class QuestionCreate(BaseModel):
    visitor_name: str
    visitor_email: str | None = None
    question: str


class QuestionAnswer(BaseModel):
    answer: str


class QuestionResponse(BaseModel):
    id: int
    visitor_name: str
    question: str
    answer: str | None = None
    is_answered: bool
    created_at: datetime
    answered_at: datetime | None = None

    class Config:
        from_attributes = True


class QuestionAdminResponse(QuestionResponse):
    visitor_email: str | None = None
    is_visible: bool
    offering_id: int


# Event schemas
class EventCreate(BaseModel):
    offering_id: int | None = None
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    is_multi_day: bool = False
    schedule_details: str | None = None
    city_id: int | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    is_online: bool = False
    online_link: str | None = None
    price: int = 0
    early_bird_price: int | None = None
    early_bird_until: datetime | None = None
    max_participants: int | None = None
    is_published: bool = False


class EventUpdate(BaseModel):
    offering_id: int | None = None
    title: str | None = None
    description: str | None = None
    cover_image_url: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_multi_day: bool | None = None
    schedule_details: str | None = None
    city_id: int | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    is_online: bool | None = None
    online_link: str | None = None
    price: int | None = None
    early_bird_price: int | None = None
    early_bird_until: datetime | None = None
    max_participants: int | None = None
    is_published: bool | None = None
    is_cancelled: bool | None = None


class EventResponse(BaseModel):
    id: int
    company_id: int
    offering_id: int | None = None
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    is_multi_day: bool = False
    schedule_details: str | None = None
    city_id: int | None = None
    city_info: CityShort | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    is_online: bool = False
    online_link: str | None = None
    price: int = 0
    early_bird_price: int | None = None
    early_bird_until: datetime | None = None
    max_participants: int | None = None
    is_published: bool = False
    is_cancelled: bool = False
    created_at: datetime
    updated_at: datetime
    registrations_count: int = 0
    spots_left: int | None = None
    ticket_types: list[TicketTypeResponse] = []

    class Config:
        from_attributes = True


# Registration schemas
class RegistrationCreate(BaseModel):
    full_name: str
    email: str | None = None
    phone: str | None = None
    telegram: str | None = None
    notes: str | None = None
    ticket_type_id: int | None = None
    ticket_count: int = 1


class RegistrationUpdateStatus(BaseModel):
    status: RegistrationStatus


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_id: int | None = None
    full_name: str
    email: str | None = None
    phone: str | None = None
    telegram: str | None = None
    status: RegistrationStatus
    amount_paid: int = 0
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# Public marketplace schemas
class EducatorCardResponse(BaseModel):
    """Educator card for the education marketplace listing."""
    id: int
    name: str
    slug: str
    description: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    educator_tagline: str | None = None
    industry_theme: str = "cosmetology"
    city_info: CityShort | None = None
    social_links: str | None = None
    offerings_count: int = 0
    upcoming_events_count: int = 0
    topic_categories: list[str] = []

    class Config:
        from_attributes = True


class EducatorDetailResponse(BaseModel):
    """Full educator profile for public page."""
    id: int
    name: str
    slug: str
    description: str | None = None
    bio: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    educator_tagline: str | None = None
    educator_credentials: str | None = None
    educator_video_url: str | None = None
    industry_theme: str = "cosmetology"
    city_info: CityShort | None = None
    phone: str | None = None
    telegram: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    website_url: str | None = None
    students_count: int = 0
    social_links: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    accent_font: str | None = None
    body_font: str | None = None

    class Config:
        from_attributes = True


class EventCardResponse(BaseModel):
    """Event card for the afisha/events listing."""
    id: int
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    event_type: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    is_multi_day: bool = False
    city_info: CityShort | None = None
    is_online: bool = False
    price: int = 0
    early_bird_price: int | None = None
    early_bird_until: datetime | None = None
    max_participants: int | None = None
    spots_left: int | None = None
    educator_name: str = ""
    educator_slug: str = ""
    educator_logo_url: str | None = None

    class Config:
        from_attributes = True


class EducationMarketplaceResponse(BaseModel):
    items: list[EducatorCardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EventsListResponse(BaseModel):
    items: list[EventCardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# My registrations (for cosmetologists)
class MyEventInfo(BaseModel):
    """Full event info embedded in my-registration response."""
    id: int
    title: str
    description: str | None = None
    cover_image_url: str | None = None
    event_type: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    is_multi_day: bool = False
    city_info: CityShort | None = None
    is_online: bool = False
    online_link: str | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    price: int = 0
    educator_name: str = ""
    educator_slug: str = ""
    educator_logo_url: str | None = None

    class Config:
        from_attributes = True


class MyRegistrationResponse(BaseModel):
    id: int
    event_id: int
    status: RegistrationStatus
    created_at: datetime
    event: MyEventInfo

    class Config:
        from_attributes = True

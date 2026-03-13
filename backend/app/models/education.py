from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User
    from app.models.city import City


class EducationTopicCategory(Base):
    """Категорії тем навчання (Мікроблейдинг, Масаж, Ін'єкції тощо)."""
    __tablename__ = "education_topic_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("education_topic_categories.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255))
    name_en: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    parent: Mapped[Optional["EducationTopicCategory"]] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["EducationTopicCategory"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    offerings: Mapped[list["EducatorOffering"]] = relationship(
        back_populates="topic_category"
    )


class OfferingType(str, Enum):
    COURSE = "course"
    GUIDE = "guide"
    CONSULTATION = "consultation"
    # Legacy (kept for backward compat)
    SEMINAR = "seminar"
    MASTERCLASS = "masterclass"
    CERTIFICATION = "certification"


class OfferingLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    ALL = "all"


class EducatorOffering(Base):
    """Продукти тренера: курси, матеріали, консультації."""
    __tablename__ = "educator_offerings"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    topic_category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("education_topic_categories.id", ondelete="SET NULL"), nullable=True
    )
    type: Mapped[OfferingType] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(500))
    slug: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    price: Mapped[int] = mapped_column(Integer, default=0)  # kopecks, 0 = free
    currency: Mapped[str] = mapped_column(String(3), default="UAH")
    is_digital: Mapped[bool] = mapped_column(Boolean, default=False)
    digital_file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Multimedia & content links
    promo_video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    prerequisites: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Course-specific enrichment fields
    learning_outcomes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # JSON array of strings
    target_audience: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)          # OfferingLevel
    curriculum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)           # JSON: [{section_title, lessons:[]}]
    language: Mapped[str] = mapped_column(String(10), default="uk")
    certificate_included: Mapped[bool] = mapped_column(Boolean, default=False)
    what_includes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)        # JSON array of strings

    # Unique slug per company
    __table_args__ = (
        UniqueConstraint("company_id", "slug", name="uq_offering_slug_per_company"),
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="offerings")
    topic_category: Mapped[Optional["EducationTopicCategory"]] = relationship(
        back_populates="offerings"
    )
    events: Mapped[list["EducatorEvent"]] = relationship(
        back_populates="offering", cascade="all, delete-orphan"
    )


class EducatorEvent(Base):
    """Заплановані події — конкретні дати курсів, семінарів, майстер-класів."""
    __tablename__ = "educator_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    offering_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("educator_offerings.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Schedule
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_multi_day: Mapped[bool] = mapped_column(Boolean, default=False)
    schedule_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON for multi-day

    # Location
    city_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("cities.id"), nullable=True
    )
    venue_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    venue_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    online_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Capacity & pricing (legacy single price — kept for events without ticket types)
    price: Mapped[int] = mapped_column(Integer, default=0)  # kopecks
    early_bird_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    early_bird_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Status
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="educator_events")
    offering: Mapped[Optional["EducatorOffering"]] = relationship(back_populates="events")
    city_ref: Mapped[Optional["City"]] = relationship(lazy="joined")
    registrations: Mapped[list["EventRegistration"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    ticket_types: Mapped[list["EventTicketType"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", order_by="EventTicketType.order"
    )


class EventTicketType(Base):
    """Типи квитків для події (Стандарт, VIP, Онлайн-трансляція тощо)."""
    __tablename__ = "event_ticket_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("educator_events.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[int] = mapped_column(Integer, default=0)  # kopecks
    quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # None = unlimited
    sold_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    event: Mapped["EducatorEvent"] = relationship(back_populates="ticket_types")
    registrations: Mapped[list["EventRegistration"]] = relationship(back_populates="ticket_type")


class RegistrationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    WAITLIST = "waitlist"


class EventRegistration(Base):
    """Реєстрації на події."""
    __tablename__ = "event_registrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("educator_events.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    ticket_type_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("event_ticket_types.id", ondelete="SET NULL"), nullable=True
    )
    ticket_count: Mapped[int] = mapped_column(Integer, default=1)
    full_name: Mapped[str] = mapped_column(String(300))
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    telegram: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    status: Mapped[RegistrationStatus] = mapped_column(
        String(20), default=RegistrationStatus.PENDING
    )
    amount_paid: Mapped[int] = mapped_column(Integer, default=0)  # kopecks
    payment_external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    event: Mapped["EducatorEvent"] = relationship(back_populates="registrations")
    user: Mapped[Optional["User"]] = relationship()
    ticket_type: Mapped[Optional["EventTicketType"]] = relationship(back_populates="registrations")

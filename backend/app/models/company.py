import secrets
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.service import Service, ServiceCategory
    from app.models.appointment import Appointment
    from app.models.client import Client, ClientCompany
    from app.models.subscription import Subscription, Payment
    from app.models.specialty import Specialty
    from app.models.company_member import CompanyMember, MemberService
    from app.models.website_section import WebsiteSection
    from app.models.position import Position


def generate_invite_code() -> str:
    return secrets.token_urlsafe(8)


class CompanyType(str, Enum):
    SOLO = "solo"
    CLINIC = "clinic"


class IndustryTheme(str, Enum):
    COSMETOLOGY = "cosmetology"
    MEDICAL = "medical"
    MASSAGE = "massage"
    SPORT = "sport"
    BEAUTY = "beauty"
    WELLNESS = "wellness"


def generate_slug(name: str) -> str:
    """Generate slug from company name"""
    import re
    import transliterate
    try:
        slug = transliterate.translit(name, 'uk', reversed=True)
    except:
        slug = name
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'company'


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    type: Mapped[CompanyType] = mapped_column(String(20), default=CompanyType.SOLO)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    telegram: Mapped[str | None] = mapped_column(String(100), nullable=True)
    invite_code: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, default=generate_invite_code
    )
    # Team invite code for inviting specialists to join the clinic
    team_invite_code: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, default=generate_invite_code
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Template settings
    template_type: Mapped[str] = mapped_column(String(20), default="solo")  # solo, clinic
    industry_theme: Mapped[str] = mapped_column(String(30), default="cosmetology")  # IndustryTheme enum
    # Colors (3-color system: primary, secondary, background)
    primary_color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # Main brand color (buttons, links)
    accent_color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # Alias for primary_color
    secondary_color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # Secondary accent (hover, borders)
    background_color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # Page background
    # Fonts
    accent_font: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "Playfair Display"
    body_font: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "Inter"
    # Images (kept for future use)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_enabled: Mapped[bool] = mapped_column(default=True)

    # Additional info for public page
    specialization: Mapped[str | None] = mapped_column(String(200), nullable=True)  # "Косметолог", "Стоматологія"
    working_hours: Mapped[str | None] = mapped_column(Text, nullable=True)  # e.g. "Пн-Пт: 9:00-18:00"
    social_links: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: {"instagram": "...", "facebook": "..."}

    # Payment requisites
    payment_iban: Mapped[str | None] = mapped_column(String(34), nullable=True)  # UA + 27 digits
    payment_bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_recipient_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    payment_card_number: Mapped[str | None] = mapped_column(String(19), nullable=True)  # 16-19 digits with spaces
    payment_monobank_jar: Mapped[str | None] = mapped_column(String(200), nullable=True)  # Monobank jar link

    # Relationships
    users: Mapped[list["User"]] = relationship(back_populates="company")
    services: Mapped[list["Service"]] = relationship(back_populates="company")
    service_categories: Mapped[list["ServiceCategory"]] = relationship(back_populates="company")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="company")
    clients: Mapped[list["Client"]] = relationship(back_populates="company")
    client_companies: Mapped[list["ClientCompany"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan"
    )
    subscription: Mapped["Subscription | None"] = relationship(
        back_populates="company",
        uselist=False,
        cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan"
    )
    specialties: Mapped[list["Specialty"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan"
    )

    # Company members (unified: owners, managers, specialists)
    members: Mapped[list["CompanyMember"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan"
    )

    # Website sections
    website_sections: Mapped[list["WebsiteSection"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        order_by="WebsiteSection.order"
    )

    # Positions (job roles)
    positions: Mapped[list["Position"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        order_by="Position.order"
    )

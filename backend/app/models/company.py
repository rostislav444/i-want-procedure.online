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
    from app.models.client import Client


def generate_invite_code() -> str:
    return secrets.token_urlsafe(8)


class CompanyType(str, Enum):
    SOLO = "solo"
    CLINIC = "clinic"


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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(back_populates="company")
    services: Mapped[list["Service"]] = relationship(back_populates="company")
    service_categories: Mapped[list["ServiceCategory"]] = relationship(back_populates="company")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="company")
    clients: Mapped[list["Client"]] = relationship(back_populates="company")

import secrets
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, func
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


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[CompanyType] = mapped_column(String(20), default=CompanyType.SOLO)
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

"""
Specialty model - represents job positions/specializations that users can have.
A user (doctor/specialist) can have multiple specialties (e.g., cosmetologist + massage therapist).
Services are linked to specialties within a company.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, Table, Column, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.company import Company
    from app.models.service import Service


# Association table for User-Specialty many-to-many relationship
user_specialties = Table(
    "user_specialties",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("specialty_id", Integer, ForeignKey("specialties.id", ondelete="CASCADE"), primary_key=True),
)


class Specialty(Base):
    """
    Specialty/Position model.
    Examples: Cosmetologist, Massage Therapist, Dermatologist, etc.
    Each company can have their own set of specialties.
    """
    __tablename__ = "specialties"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))  # e.g., "Косметолог", "Масажист"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # HEX color for UI
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="specialties")
    users: Mapped[list["User"]] = relationship(
        secondary=user_specialties,
        back_populates="specialties"
    )
    services: Mapped[list["Service"]] = relationship(back_populates="specialty")

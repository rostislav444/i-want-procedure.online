"""Position model for clinics.

Positions are job roles within a clinic (e.g., "Косметолог", "Масажист").
Services can be assigned to positions, and specialists with that position
can perform those services.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.service import Service
    from app.models.profiles import SpecialistProfile


class Position(Base):
    """Job position within a clinic."""
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # For UI display
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="positions")
    services: Mapped[list["Service"]] = relationship(back_populates="position")
    specialists: Mapped[list["SpecialistProfile"]] = relationship(back_populates="position_rel")

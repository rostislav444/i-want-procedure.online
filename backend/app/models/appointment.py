from datetime import datetime, date, time
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Text, DateTime, Date, Time, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User
    from app.models.client import Client
    from app.models.service import Service
    from app.models.profiles import SpecialistProfile, ClientProfile


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class CancelledBy(str, Enum):
    CLIENT = "client"
    DOCTOR = "doctor"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))

    # Profile references (for future use after migration)
    specialist_profile_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("specialist_profiles.id", ondelete="SET NULL"), nullable=True
    )
    client_profile_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("client_profiles.id", ondelete="SET NULL"), nullable=True
    )
    date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    status: Mapped[AppointmentStatus] = mapped_column(
        String(20), default=AppointmentStatus.PENDING
    )
    cancelled_by: Mapped[Optional[CancelledBy]] = mapped_column(
        String(20), nullable=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    google_event_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="appointments")
    doctor: Mapped["User"] = relationship(back_populates="appointments")
    client: Mapped["Client"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship(back_populates="appointments")

    # Profile relationships
    specialist_profile: Mapped[Optional["SpecialistProfile"]] = relationship(
        back_populates="appointments_as_specialist",
        foreign_keys=[specialist_profile_id]
    )
    client_profile: Mapped[Optional["ClientProfile"]] = relationship(
        back_populates="appointments_as_client",
        foreign_keys=[client_profile_id]
    )

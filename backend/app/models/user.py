from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, BigInteger, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.service import Service
    from app.models.schedule import Schedule, ScheduleException
    from app.models.appointment import Appointment


class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    telegram_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    role: Mapped[UserRole] = mapped_column(String(20), default=UserRole.DOCTOR)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="users")
    services: Mapped[list["Service"]] = relationship(back_populates="doctor")
    schedules: Mapped[list["Schedule"]] = relationship(back_populates="doctor")
    schedule_exceptions: Mapped[list["ScheduleException"]] = relationship(back_populates="doctor")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")

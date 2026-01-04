from datetime import time, date, datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, Time, Boolean, Date, String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    day_of_week: Mapped[int] = mapped_column(Integer)  # 0 = Monday, 6 = Sunday
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    is_working_day: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    doctor: Mapped["User"] = relationship(back_populates="schedules")


class ScheduleExceptionType(str, Enum):
    DAY_OFF = "day_off"  # Full day off
    MODIFIED = "modified"  # Modified working hours
    WORKING = "working"  # Working on a normally non-working day
    BREAK = "break"  # Short break/absence during the day (e.g., lunch, errand)


class ScheduleException(Base):
    __tablename__ = "schedule_exceptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    date: Mapped[date] = mapped_column(Date, index=True)
    type: Mapped[ScheduleExceptionType] = mapped_column(String(20))
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    doctor: Mapped["User"] = relationship(back_populates="schedule_exceptions")

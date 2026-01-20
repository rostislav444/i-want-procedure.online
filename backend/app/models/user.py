from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, BigInteger, Boolean, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.service import Service
    from app.models.schedule import Schedule, ScheduleException
    from app.models.appointment import Appointment
    from app.models.specialty import Specialty
    from app.models.company_member import CompanyMember


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    patronymic: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    telegram_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, unique=True, index=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superadmin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Google OAuth fields
    google_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True, index=True)
    google_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    google_refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    google_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    google_calendar_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    google_calendar_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    company_memberships: Mapped[list["CompanyMember"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )
    services: Mapped[list["Service"]] = relationship(back_populates="doctor")
    schedules: Mapped[list["Schedule"]] = relationship(back_populates="doctor")
    schedule_exceptions: Mapped[list["ScheduleException"]] = relationship(back_populates="doctor")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")
    specialties: Mapped[list["Specialty"]] = relationship(
        secondary="user_specialties",
        back_populates="users"
    )

    @property
    def company_id(self) -> Optional[int]:
        """Get the selected or primary company_id.

        If user has selected a specific company via X-Company-Id header,
        returns that company_id. Otherwise returns the first active
        company membership's company_id.
        """
        # Check if a specific company was selected via header
        selected = getattr(self, '_selected_company_id', None)
        if selected is not None:
            return selected

        # Fall back to first active membership
        for m in self.company_memberships:
            if m.is_active:
                return m.company_id
        return None

    @property
    def companies(self) -> list["Company"]:
        """Get all companies user is a member of."""
        return [m.company for m in self.company_memberships if m.is_active]

    def get_membership(self, company_id: int) -> Optional["CompanyMember"]:
        """Get user's membership in a specific company."""
        for m in self.company_memberships:
            if m.company_id == company_id and m.is_active:
                return m
        return None

    def is_owner_of(self, company_id: int) -> bool:
        """Check if user is owner of a company."""
        m = self.get_membership(company_id)
        return m is not None and m.is_owner

    def is_manager_of(self, company_id: int) -> bool:
        """Check if user is manager of a company."""
        m = self.get_membership(company_id)
        return m is not None and (m.is_manager or m.is_owner)

    def is_specialist_at(self, company_id: int) -> bool:
        """Check if user is specialist at a company."""
        m = self.get_membership(company_id)
        return m is not None and m.is_specialist

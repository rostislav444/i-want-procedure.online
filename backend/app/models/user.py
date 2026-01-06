from datetime import datetime
from enum import Enum
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
    from app.models.profiles import SpecialistProfile, ManagerProfile, ClientProfile


class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    SPECIALIST = "specialist"  # врач/косметолог
    MANAGER = "manager"  # менеджер клиники
    CLIENT = "client"  # клиент


class UserRoleAssignment(Base):
    """User roles (many-to-many).

    Allows a user to have multiple roles (e.g., specialist + manager).
    """
    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    user: Mapped["User"] = relationship(back_populates="role_assignments")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("companies.id"), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    patronymic: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    telegram_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, unique=True, index=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole] = mapped_column(String(20), default=UserRole.SPECIALIST)
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
    google_calendar_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # primary calendar ID

    # Relationships
    company: Mapped[Optional["Company"]] = relationship(back_populates="users")
    services: Mapped[list["Service"]] = relationship(back_populates="doctor")
    schedules: Mapped[list["Schedule"]] = relationship(back_populates="doctor")
    schedule_exceptions: Mapped[list["ScheduleException"]] = relationship(back_populates="doctor")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")
    specialties: Mapped[list["Specialty"]] = relationship(
        secondary="user_specialties",
        back_populates="users"
    )

    # Role assignments (many-to-many roles)
    role_assignments: Mapped[list["UserRoleAssignment"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Profile relationships
    specialist_profiles: Mapped[list["SpecialistProfile"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )
    manager_profiles: Mapped[list["ManagerProfile"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )
    client_profiles: Mapped[list["ClientProfile"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    @property
    def roles(self) -> list[str]:
        """Get list of user roles."""
        return [ra.role for ra in self.role_assignments]

    def has_role(self, role: UserRole) -> bool:
        """Check if user has a specific role."""
        return role.value in self.roles

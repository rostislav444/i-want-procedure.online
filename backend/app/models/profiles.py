from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Integer, Numeric, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.company import Company
    from app.models.appointment import Appointment
    from app.models.service import Service
    from app.models.position import Position


class SpecialistProfile(Base):
    """Specialist works at a company.

    One user can have multiple specialist profiles (work at different companies).
    """
    __tablename__ = "specialist_profiles"
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_specialist_user_company'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    position_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("positions.id", ondelete="SET NULL"), nullable=True
    )

    position: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Legacy text field
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="specialist_profiles")
    company: Mapped["Company"] = relationship(back_populates="specialist_profiles")
    position_rel: Mapped[Optional["Position"]] = relationship(back_populates="specialists")
    appointments_as_specialist: Mapped[list["Appointment"]] = relationship(
        back_populates="specialist_profile",
        foreign_keys="Appointment.specialist_profile_id"
    )
    specialist_services: Mapped[list["SpecialistService"]] = relationship(
        back_populates="specialist_profile",
        cascade="all, delete-orphan"
    )


class ManagerProfile(Base):
    """Manager manages a company.

    One user can be a manager at multiple companies.
    """
    __tablename__ = "manager_profiles"
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_manager_user_company'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    # Permissions (can be extended)
    can_edit_services: Mapped[bool] = mapped_column(Boolean, default=True)
    can_manage_specialists: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_finances: Mapped[bool] = mapped_column(Boolean, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="manager_profiles")
    company: Mapped["Company"] = relationship(back_populates="manager_profiles")


class ClientProfile(Base):
    """Client is registered at a company.

    One user can be a client at multiple companies.
    """
    __tablename__ = "client_profiles"
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_client_user_company'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # specialist notes about client
    tags: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # tags: "VIP", "allergy"
    source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "telegram", "website", "referral"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="client_profiles")
    company: Mapped["Company"] = relationship(back_populates="client_profiles")
    appointments_as_client: Mapped[list["Appointment"]] = relationship(
        back_populates="client_profile",
        foreign_keys="Appointment.client_profile_id"
    )


class SpecialistService(Base):
    """Links specialists to services they can perform.

    For clinics: each specialist can perform a subset of company services.
    Optionally with custom price/duration.
    """
    __tablename__ = "specialist_services"
    __table_args__ = (
        UniqueConstraint('specialist_profile_id', 'service_id', name='uq_specialist_service'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    specialist_profile_id: Mapped[int] = mapped_column(
        ForeignKey("specialist_profiles.id", ondelete="CASCADE"), index=True
    )
    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"), index=True
    )

    # Optional custom price/duration for this specialist
    custom_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    custom_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    specialist_profile: Mapped["SpecialistProfile"] = relationship(
        back_populates="specialist_services"
    )
    service: Mapped["Service"] = relationship(back_populates="specialist_services")

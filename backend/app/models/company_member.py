"""
Company Member model - unified profile for users in companies.

Replaces: specialist_profiles, manager_profiles, client_profiles
"""
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


class CompanyMember(Base):
    """User's membership in a company.

    One user can be a member of multiple companies with different roles.
    Replaces specialist_profiles and manager_profiles.
    """
    __tablename__ = "company_members"
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_company_member'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    position_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("positions.id", ondelete="SET NULL"), nullable=True
    )

    # Roles in company (can have multiple)
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)      # Owner/founder
    is_manager: Mapped[bool] = mapped_column(Boolean, default=False)    # Can manage company
    is_specialist: Mapped[bool] = mapped_column(Boolean, default=False) # Provides services

    # Specialist info
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Manager permissions
    can_edit_services: Mapped[bool] = mapped_column(Boolean, default=True)
    can_manage_team: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_finances: Mapped[bool] = mapped_column(Boolean, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="company_memberships")
    company: Mapped["Company"] = relationship(back_populates="members")
    position: Mapped[Optional["Position"]] = relationship(back_populates="members")

    # Services this member can perform (for specialists)
    member_services: Mapped[list["MemberService"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan"
    )

    # Appointments where this member is the specialist
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="member",
        foreign_keys="Appointment.member_id"
    )


class MemberService(Base):
    """Links company members (specialists) to services they can perform.

    For clinics: manager assigns specific services to each specialist.
    For solo (FOP): owner-specialist gets all services automatically.
    """
    __tablename__ = "member_services"
    __table_args__ = (
        UniqueConstraint('member_id', 'service_id', name='uq_member_service'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(
        ForeignKey("company_members.id", ondelete="CASCADE"), index=True
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
    member: Mapped["CompanyMember"] = relationship(back_populates="member_services")
    service: Mapped["Service"] = relationship(back_populates="member_services")

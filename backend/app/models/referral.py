from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User
    from app.models.subscription import Payment


class Referral(Base):
    """Зв'язок між тренером-рефералом та приведеним користувачем."""
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True)
    referrer_company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    referred_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    referred_company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    commission_pct: Mapped[int] = mapped_column(Integer, default=20)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("referred_user_id", name="uq_referral_per_user"),
    )

    # Relationships
    referrer_company: Mapped["Company"] = relationship(
        back_populates="referrals_given",
        foreign_keys=[referrer_company_id]
    )
    referred_user: Mapped["User"] = relationship()
    referred_company: Mapped[Optional["Company"]] = relationship(
        foreign_keys=[referred_company_id]
    )
    earnings: Mapped[list["ReferralEarning"]] = relationship(
        back_populates="referral", cascade="all, delete-orphan"
    )


class ReferralEarning(Base):
    """Окремі нарахування комісії від оплат реферованих користувачів."""
    __tablename__ = "referral_earnings"

    id: Mapped[int] = mapped_column(primary_key=True)
    referral_id: Mapped[int] = mapped_column(
        ForeignKey("referrals.id", ondelete="CASCADE"), index=True
    )
    payment_id: Mapped[int] = mapped_column(
        ForeignKey("payments.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[int] = mapped_column(Integer)  # kopecks
    commission_pct: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    referral: Mapped["Referral"] = relationship(back_populates="earnings")
    payment: Mapped["Payment"] = relationship()


class ReferralPayout(Base):
    """Виплати тренерам реферальних нарахувань."""
    __tablename__ = "referral_payouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[int] = mapped_column(Integer)  # kopecks
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, completed, failed
    payout_method: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    payout_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    company: Mapped["Company"] = relationship()

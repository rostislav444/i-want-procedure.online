from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company


class SubscriptionPlan(str, Enum):
    """Subscription plan types."""
    INDIVIDUAL = "individual"  # 1 doctor
    COMPANY_SMALL = "company_small"  # up to 3 doctors
    COMPANY_LARGE = "company_large"  # unlimited doctors


class SubscriptionStatus(str, Enum):
    """Subscription status."""
    TRIAL = "trial"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    """Payment status."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    """Payment method."""
    CARD = "card"
    IBAN = "iban"
    MONOBANK_JAR = "monobank_jar"
    MANUAL = "manual"  # manual payment confirmed by superadmin


class Subscription(Base):
    """Company subscription model."""
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)

    plan: Mapped[SubscriptionPlan] = mapped_column(String(30), default=SubscriptionPlan.INDIVIDUAL)
    status: Mapped[SubscriptionStatus] = mapped_column(String(20), default=SubscriptionStatus.TRIAL)

    # Pricing (in kopecks/cents for precision)
    price: Mapped[int] = mapped_column(Integer, default=0)  # monthly price in kopecks

    # Trial period
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Current billing period
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="subscription")
    payments: Mapped[list["Payment"]] = relationship(back_populates="subscription", cascade="all, delete-orphan")


class Payment(Base):
    """Payment record model."""
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    subscription_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Amount in kopecks/cents
    amount: Mapped[int] = mapped_column(Integer)

    status: Mapped[PaymentStatus] = mapped_column(String(20), default=PaymentStatus.PENDING)
    payment_method: Mapped[PaymentMethod] = mapped_column(String(30), default=PaymentMethod.MANUAL)

    # External payment reference (from payment provider)
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Notes (e.g., reason for manual confirmation)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="payments")
    subscription: Mapped[Optional["Subscription"]] = relationship(back_populates="payments")

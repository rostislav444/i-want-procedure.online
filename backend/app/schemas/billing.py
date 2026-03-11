"""Billing & subscription schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SubscriptionResponse(BaseModel):
    id: int
    company_id: int
    plan: str
    status: str
    price: int  # kopecks
    trial_ends_at: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Trial progress
    confirmed_clients_count: int = 0
    trial_client_limit: int = 10
    trial_active: bool = True  # True if still in trial (< limit)

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    company_id: int
    subscription_id: Optional[int] = None
    amount: int  # kopecks
    status: str
    payment_method: str
    external_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreatePaymentRequest(BaseModel):
    """Request to create a Monobank payment for subscription."""
    plan: Optional[str] = None  # Override plan if changing


class CreatePaymentResponse(BaseModel):
    """Response with Monobank payment URL."""
    payment_id: int
    invoice_id: str
    page_url: str  # Monobank payment page URL


class WebhookPayload(BaseModel):
    """Monobank webhook payload."""
    invoiceId: str
    status: str  # created, processing, hold, success, failure, reversed, expired
    amount: Optional[int] = None
    ccy: Optional[int] = None
    reference: Optional[str] = None
    modifiedDate: Optional[str] = None
    failureReason: Optional[str] = None


class BillingOverview(BaseModel):
    """Complete billing overview for the UI."""
    subscription: Optional[SubscriptionResponse] = None
    recent_payments: list[PaymentResponse] = []
    has_monobank: bool = False  # Whether Monobank is configured

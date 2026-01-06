"""
Superadmin API - endpoints for platform management.
Only accessible by users with is_superadmin=True.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, SuperadminUser
from app.models.company import Company
from app.models.user import User
from app.models.client import Client, ClientCompany
from app.models.appointment import Appointment
from app.models.subscription import (
    Subscription, Payment,
    SubscriptionPlan, SubscriptionStatus,
    PaymentStatus, PaymentMethod
)

router = APIRouter(prefix="/superadmin")


# --- Schemas ---

class PlatformStats(BaseModel):
    total_companies: int
    active_companies: int  # with activity in last 30 days
    total_users: int
    total_clients: int
    total_appointments: int
    appointments_this_month: int
    active_subscriptions: int
    trial_subscriptions: int
    total_revenue: int  # in kopecks


class CompanyListItem(BaseModel):
    id: int
    name: str
    slug: str
    type: str
    created_at: datetime
    users_count: int
    clients_count: int
    appointments_count: int
    subscription_status: Optional[str] = None
    subscription_plan: Optional[str] = None

    class Config:
        from_attributes = True


class SubscriptionDetail(BaseModel):
    id: int
    plan: str
    status: str
    price: int
    trial_ends_at: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyDetail(BaseModel):
    id: int
    name: str
    slug: str
    type: str
    description: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    telegram: Optional[str] = None
    template_type: str
    created_at: datetime
    users_count: int
    clients_count: int
    appointments_count: int
    subscription: Optional[SubscriptionDetail] = None

    class Config:
        from_attributes = True


class PaymentListItem(BaseModel):
    id: int
    company_id: int
    company_name: str
    amount: int
    status: str
    payment_method: str
    external_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UpdateSubscriptionRequest(BaseModel):
    plan: Optional[SubscriptionPlan] = None
    status: Optional[SubscriptionStatus] = None
    price: Optional[int] = None  # in kopecks
    trial_ends_at: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None


class CreatePaymentRequest(BaseModel):
    company_id: int
    amount: int  # in kopecks
    payment_method: PaymentMethod = PaymentMethod.MANUAL
    notes: Optional[str] = None
    auto_complete: bool = True  # automatically mark as completed


# --- Endpoints ---

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    db: DbSession,
    _: SuperadminUser,
):
    """Get platform-wide statistics."""
    # Total companies
    total_companies = await db.scalar(select(func.count(Company.id)))

    # Active companies (with appointments in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_companies = await db.scalar(
        select(func.count(func.distinct(Appointment.company_id)))
        .where(Appointment.created_at >= thirty_days_ago)
    )

    # Total users
    total_users = await db.scalar(select(func.count(User.id)))

    # Total clients
    total_clients = await db.scalar(select(func.count(Client.id)))

    # Total appointments
    total_appointments = await db.scalar(select(func.count(Appointment.id)))

    # Appointments this month
    first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    appointments_this_month = await db.scalar(
        select(func.count(Appointment.id))
        .where(Appointment.created_at >= first_of_month)
    )

    # Active subscriptions
    active_subscriptions = await db.scalar(
        select(func.count(Subscription.id))
        .where(Subscription.status == SubscriptionStatus.ACTIVE)
    )

    # Trial subscriptions
    trial_subscriptions = await db.scalar(
        select(func.count(Subscription.id))
        .where(Subscription.status == SubscriptionStatus.TRIAL)
    )

    # Total revenue (sum of completed payments)
    total_revenue = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == PaymentStatus.COMPLETED)
    )

    return PlatformStats(
        total_companies=total_companies or 0,
        active_companies=active_companies or 0,
        total_users=total_users or 0,
        total_clients=total_clients or 0,
        total_appointments=total_appointments or 0,
        appointments_this_month=appointments_this_month or 0,
        active_subscriptions=active_subscriptions or 0,
        trial_subscriptions=trial_subscriptions or 0,
        total_revenue=total_revenue or 0,
    )


@router.get("/companies", response_model=list[CompanyListItem])
async def list_companies(
    db: DbSession,
    _: SuperadminUser,
    search: Optional[str] = None,
    subscription_status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all companies with statistics."""
    query = select(Company).options(selectinload(Company.subscription))

    if search:
        query = query.where(
            Company.name.ilike(f"%{search}%") | Company.slug.ilike(f"%{search}%")
        )

    query = query.order_by(Company.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    companies = result.scalars().all()

    items = []
    for company in companies:
        # Get counts
        users_count = await db.scalar(
            select(func.count(User.id)).where(User.company_id == company.id)
        )
        clients_count = await db.scalar(
            select(func.count(ClientCompany.id)).where(ClientCompany.company_id == company.id)
        )
        appointments_count = await db.scalar(
            select(func.count(Appointment.id)).where(Appointment.company_id == company.id)
        )

        sub_status = company.subscription.status.value if company.subscription else None
        sub_plan = company.subscription.plan.value if company.subscription else None

        # Filter by subscription status if specified
        if subscription_status and sub_status != subscription_status:
            continue

        items.append(CompanyListItem(
            id=company.id,
            name=company.name,
            slug=company.slug,
            type=company.type.value,
            created_at=company.created_at,
            users_count=users_count or 0,
            clients_count=clients_count or 0,
            appointments_count=appointments_count or 0,
            subscription_status=sub_status,
            subscription_plan=sub_plan,
        ))

    return items


@router.get("/companies/{company_id}", response_model=CompanyDetail)
async def get_company_detail(
    company_id: int,
    db: DbSession,
    _: SuperadminUser,
):
    """Get detailed company information."""
    result = await db.execute(
        select(Company)
        .where(Company.id == company_id)
        .options(selectinload(Company.subscription))
    )
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Get counts
    users_count = await db.scalar(
        select(func.count(User.id)).where(User.company_id == company.id)
    )
    clients_count = await db.scalar(
        select(func.count(ClientCompany.id)).where(ClientCompany.company_id == company.id)
    )
    appointments_count = await db.scalar(
        select(func.count(Appointment.id)).where(Appointment.company_id == company.id)
    )

    subscription_detail = None
    if company.subscription:
        subscription_detail = SubscriptionDetail(
            id=company.subscription.id,
            plan=company.subscription.plan.value,
            status=company.subscription.status.value,
            price=company.subscription.price,
            trial_ends_at=company.subscription.trial_ends_at,
            current_period_start=company.subscription.current_period_start,
            current_period_end=company.subscription.current_period_end,
            created_at=company.subscription.created_at,
        )

    return CompanyDetail(
        id=company.id,
        name=company.name,
        slug=company.slug,
        type=company.type.value,
        description=company.description,
        phone=company.phone,
        address=company.address,
        telegram=company.telegram,
        template_type=company.template_type,
        created_at=company.created_at,
        users_count=users_count or 0,
        clients_count=clients_count or 0,
        appointments_count=appointments_count or 0,
        subscription=subscription_detail,
    )


@router.post("/companies/{company_id}/subscription", response_model=SubscriptionDetail)
async def create_or_update_subscription(
    company_id: int,
    data: UpdateSubscriptionRequest,
    db: DbSession,
    _: SuperadminUser,
):
    """Create or update company subscription."""
    result = await db.execute(
        select(Company)
        .where(Company.id == company_id)
        .options(selectinload(Company.subscription))
    )
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    if company.subscription:
        # Update existing subscription
        subscription = company.subscription
        if data.plan is not None:
            subscription.plan = data.plan
        if data.status is not None:
            subscription.status = data.status
        if data.price is not None:
            subscription.price = data.price
        if data.trial_ends_at is not None:
            subscription.trial_ends_at = data.trial_ends_at
        if data.current_period_start is not None:
            subscription.current_period_start = data.current_period_start
        if data.current_period_end is not None:
            subscription.current_period_end = data.current_period_end
    else:
        # Create new subscription
        subscription = Subscription(
            company_id=company.id,
            plan=data.plan or SubscriptionPlan.INDIVIDUAL,
            status=data.status or SubscriptionStatus.TRIAL,
            price=data.price or 0,
            trial_ends_at=data.trial_ends_at,
            current_period_start=data.current_period_start,
            current_period_end=data.current_period_end,
        )
        db.add(subscription)

    await db.commit()
    await db.refresh(subscription)

    return SubscriptionDetail(
        id=subscription.id,
        plan=subscription.plan.value,
        status=subscription.status.value,
        price=subscription.price,
        trial_ends_at=subscription.trial_ends_at,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        created_at=subscription.created_at,
    )


@router.get("/payments", response_model=list[PaymentListItem])
async def list_payments(
    db: DbSession,
    _: SuperadminUser,
    company_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all payments."""
    query = (
        select(Payment)
        .options(selectinload(Payment.company))
        .order_by(Payment.created_at.desc())
    )

    if company_id:
        query = query.where(Payment.company_id == company_id)

    if status_filter:
        query = query.where(Payment.status == status_filter)

    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    payments = result.scalars().all()

    return [
        PaymentListItem(
            id=payment.id,
            company_id=payment.company_id,
            company_name=payment.company.name if payment.company else "Unknown",
            amount=payment.amount,
            status=payment.status.value,
            payment_method=payment.payment_method.value,
            external_id=payment.external_id,
            notes=payment.notes,
            created_at=payment.created_at,
            completed_at=payment.completed_at,
        )
        for payment in payments
    ]


@router.post("/payments", response_model=PaymentListItem)
async def create_payment(
    data: CreatePaymentRequest,
    db: DbSession,
    _: SuperadminUser,
):
    """Create a new payment record (typically for manual payments)."""
    # Verify company exists
    company = await db.get(Company, data.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Get company's subscription if exists
    sub_result = await db.execute(
        select(Subscription).where(Subscription.company_id == company.id)
    )
    subscription = sub_result.scalar_one_or_none()

    payment = Payment(
        company_id=company.id,
        subscription_id=subscription.id if subscription else None,
        amount=data.amount,
        payment_method=data.payment_method,
        notes=data.notes,
        status=PaymentStatus.COMPLETED if data.auto_complete else PaymentStatus.PENDING,
        completed_at=datetime.utcnow() if data.auto_complete else None,
    )
    db.add(payment)

    # If auto-completing and subscription exists, update subscription
    if data.auto_complete and subscription:
        subscription.status = SubscriptionStatus.ACTIVE
        # Set period to 30 days from now
        subscription.current_period_start = datetime.utcnow()
        subscription.current_period_end = datetime.utcnow() + timedelta(days=30)

    await db.commit()
    await db.refresh(payment)

    return PaymentListItem(
        id=payment.id,
        company_id=payment.company_id,
        company_name=company.name,
        amount=payment.amount,
        status=payment.status.value,
        payment_method=payment.payment_method.value,
        external_id=payment.external_id,
        notes=payment.notes,
        created_at=payment.created_at,
        completed_at=payment.completed_at,
    )


@router.patch("/payments/{payment_id}/complete")
async def complete_payment(
    payment_id: int,
    db: DbSession,
    _: SuperadminUser,
):
    """Mark a pending payment as completed."""
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    if payment.status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is already completed",
        )

    payment.status = PaymentStatus.COMPLETED
    payment.completed_at = datetime.utcnow()

    # Update subscription if exists
    if payment.subscription_id:
        subscription = await db.get(Subscription, payment.subscription_id)
        if subscription:
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.current_period_start = datetime.utcnow()
            subscription.current_period_end = datetime.utcnow() + timedelta(days=30)

    await db.commit()

    return {"message": "Payment completed successfully"}

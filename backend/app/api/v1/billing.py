"""Billing & subscription API endpoints."""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.models.appointment import Appointment, AppointmentStatus
from app.models.company import Company
from app.models.subscription import (
    Payment,
    PaymentMethod,
    PaymentStatus,
    Subscription,
    SubscriptionPlan,
    SubscriptionStatus,
)
from app.schemas.billing import (
    BillingOverview,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentResponse,
    SubscriptionResponse,
    WebhookPayload,
)
from app.services.monobank import (
    MonobankError,
    charge_by_token,
    create_client_invoice,
    create_invoice,
    get_invoice_status,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


# --- Helpers ---

async def get_confirmed_clients_count(db, company_id: int) -> int:
    """Count unique clients with at least one CONFIRMED or COMPLETED appointment."""
    result = await db.execute(
        select(func.count(func.distinct(Appointment.client_id)))
        .where(
            Appointment.company_id == company_id,
            Appointment.status.in_([
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.COMPLETED,
            ]),
            Appointment.client_id.isnot(None),
        )
    )
    return result.scalar() or 0


async def get_or_create_subscription(db, company_id: int) -> Subscription:
    """Get existing subscription or create a trial one."""
    result = await db.execute(
        select(Subscription).where(Subscription.company_id == company_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        subscription = Subscription(
            company_id=company_id,
            plan=SubscriptionPlan.INDIVIDUAL,
            status=SubscriptionStatus.TRIAL,
            price=0,
        )
        db.add(subscription)
        await db.flush()

    return subscription


def get_plan_price(plan: SubscriptionPlan) -> int:
    """Get monthly price in kopecks for a plan."""
    prices = {
        SubscriptionPlan.INDIVIDUAL: settings.SUBSCRIPTION_PRICE_INDIVIDUAL,
        SubscriptionPlan.COMPANY_SMALL: settings.SUBSCRIPTION_PRICE_COMPANY_SMALL,
        SubscriptionPlan.COMPANY_LARGE: settings.SUBSCRIPTION_PRICE_COMPANY_LARGE,
    }
    return prices.get(plan, settings.SUBSCRIPTION_PRICE_INDIVIDUAL)


PLAN_NAMES = {
    SubscriptionPlan.INDIVIDUAL: "Індивідуальний",
    SubscriptionPlan.COMPANY_SMALL: "Клініка (до 3)",
    SubscriptionPlan.COMPANY_LARGE: "Клініка (без обмежень)",
}


async def build_subscription_response(
    subscription: Subscription,
    confirmed_count: int,
) -> SubscriptionResponse:
    """Build subscription response with trial info."""
    trial_limit = settings.TRIAL_CLIENT_LIMIT
    trial_active = (
        subscription.status == SubscriptionStatus.TRIAL
        and confirmed_count < trial_limit
    )

    return SubscriptionResponse(
        id=subscription.id,
        company_id=subscription.company_id,
        plan=subscription.plan,
        status=subscription.status,
        price=subscription.price,
        trial_ends_at=subscription.trial_ends_at,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at,
        confirmed_clients_count=confirmed_count,
        trial_client_limit=trial_limit,
        trial_active=trial_active,
    )


# ============================================================
# Platform subscription endpoints
# ============================================================

@router.get("/overview", response_model=BillingOverview)
async def get_billing_overview(
    current_user: CurrentUser,
    db: DbSession,
):
    """Get complete billing overview: subscription + recent payments + trial progress."""
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="No company selected")

    subscription = await get_or_create_subscription(db, company_id)
    confirmed_count = await get_confirmed_clients_count(db, company_id)

    # Check if trial should transition to requiring payment
    trial_limit = settings.TRIAL_CLIENT_LIMIT
    if (
        subscription.status == SubscriptionStatus.TRIAL
        and confirmed_count >= trial_limit
        and subscription.price == 0
    ):
        subscription.price = get_plan_price(subscription.plan)
        await db.flush()

    sub_response = await build_subscription_response(subscription, confirmed_count)

    # Recent payments
    payments_result = await db.execute(
        select(Payment)
        .where(Payment.company_id == company_id)
        .order_by(Payment.created_at.desc())
        .limit(20)
    )
    payments = payments_result.scalars().all()
    payments_response = [
        PaymentResponse.model_validate(p) for p in payments
    ]

    await db.commit()

    return BillingOverview(
        subscription=sub_response,
        recent_payments=payments_response,
        has_monobank=bool(settings.MONOBANK_TOKEN),
    )


@router.post("/pay", response_model=CreatePaymentResponse)
async def create_payment(
    data: CreatePaymentRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a Monobank payment for subscription with card tokenization."""
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="No company selected")

    if not settings.MONOBANK_TOKEN:
        raise HTTPException(status_code=400, detail="Monobank not configured")

    subscription = await get_or_create_subscription(db, company_id)

    # Determine plan and price
    if data.plan:
        try:
            plan = SubscriptionPlan(data.plan)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid plan")
        subscription.plan = plan
    else:
        plan = subscription.plan

    amount = get_plan_price(plan)
    subscription.price = amount

    # Create payment record
    payment = Payment(
        company_id=company_id,
        subscription_id=subscription.id,
        amount=amount,
        status=PaymentStatus.PENDING,
        payment_method=PaymentMethod.CARD,
    )
    db.add(payment)
    await db.flush()

    # Create Monobank invoice with card tokenization
    reference = f"sub_{company_id}_{payment.id}"
    redirect_url = f"{settings.FRONTEND_URL}/admin/billing?payment=success"
    webhook_url = f"{settings.API_URL}{settings.API_V1_PREFIX}/billing/webhook"
    destination = f"Procedure - підписка «{PLAN_NAMES.get(plan, plan)}»"

    # Enable card saving if no token yet (for recurring payments)
    save_card_data = None
    if not subscription.card_token:
        wallet_id = subscription.wallet_id or f"wallet_{company_id}_{secrets.token_hex(8)}"
        subscription.wallet_id = wallet_id
        save_card_data = {
            "saveCard": True,
            "walletId": wallet_id,
        }

    try:
        invoice = await create_invoice(
            amount=amount,
            reference=reference,
            destination=destination,
            redirect_url=redirect_url,
            webhook_url=webhook_url,
            save_card_data=save_card_data,
        )
    except MonobankError as e:
        payment.status = PaymentStatus.FAILED
        payment.notes = str(e)
        await db.commit()
        raise HTTPException(status_code=502, detail=f"Payment provider error: {e.message}")

    payment.external_id = invoice["invoiceId"]
    await db.commit()

    return CreatePaymentResponse(
        payment_id=payment.id,
        invoice_id=invoice["invoiceId"],
        page_url=invoice["pageUrl"],
    )


@router.post("/webhook")
async def monobank_webhook(
    request: Request,
    db: DbSession,
):
    """
    Monobank webhook callback.
    Called by Monobank when payment status changes.
    No authentication - verified via invoice status check.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    invoice_id = body.get("invoiceId")
    status_str = body.get("status")
    reference = body.get("reference")

    if not invoice_id:
        raise HTTPException(status_code=400, detail="Missing invoiceId")

    logger.info(f"Monobank webhook: invoiceId={invoice_id}, status={status_str}, ref={reference}")

    # Find payment by external_id
    result = await db.execute(
        select(Payment).where(Payment.external_id == invoice_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning(f"Payment not found for invoiceId={invoice_id}")
        return {"status": "ok"}

    # Verify status via API for security
    try:
        invoice_data = await get_invoice_status(invoice_id)
        verified_status = invoice_data.get("status", "")
    except MonobankError:
        verified_status = status_str

    if verified_status == "success":
        if payment.status != PaymentStatus.COMPLETED:
            payment.status = PaymentStatus.COMPLETED
            payment.completed_at = datetime.now(timezone.utc)

            # Activate subscription
            if payment.subscription_id:
                sub_result = await db.execute(
                    select(Subscription).where(Subscription.id == payment.subscription_id)
                )
                subscription = sub_result.scalar_one_or_none()
                if subscription:
                    now = datetime.now(timezone.utc)
                    subscription.status = SubscriptionStatus.ACTIVE
                    subscription.current_period_start = now
                    subscription.current_period_end = now + timedelta(days=30)

                    # Save card token if returned (for recurring payments)
                    wallet_data = invoice_data.get("walletData")
                    if wallet_data and wallet_data.get("status") == "created":
                        card_token = wallet_data.get("cardToken")
                        if card_token:
                            subscription.card_token = card_token
                            logger.info(f"Card token saved for subscription {subscription.id}")

                    logger.info(
                        f"Subscription {subscription.id} activated for company {subscription.company_id}"
                    )

    elif verified_status in ("failure", "reversed", "expired"):
        if payment.status == PaymentStatus.PENDING:
            payment.status = PaymentStatus.FAILED
            payment.notes = body.get("failureReason", verified_status)

    await db.commit()
    return {"status": "ok"}


@router.get("/payments", response_model=list[PaymentResponse])
async def get_payments(
    current_user: CurrentUser,
    db: DbSession,
):
    """Get payment history for the current company."""
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="No company selected")

    result = await db.execute(
        select(Payment)
        .where(Payment.company_id == company_id)
        .order_by(Payment.created_at.desc())
        .limit(50)
    )
    payments = result.scalars().all()
    return [PaymentResponse.model_validate(p) for p in payments]


@router.post("/check-trial")
async def check_trial_status(
    current_user: CurrentUser,
    db: DbSession,
):
    """
    Check and update trial status.
    Returns current confirmed clients count and whether trial is still active.
    """
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="No company selected")

    subscription = await get_or_create_subscription(db, company_id)
    confirmed_count = await get_confirmed_clients_count(db, company_id)
    trial_limit = settings.TRIAL_CLIENT_LIMIT

    trial_active = (
        subscription.status == SubscriptionStatus.TRIAL
        and confirmed_count < trial_limit
    )

    if subscription.status == SubscriptionStatus.TRIAL and confirmed_count >= trial_limit:
        subscription.price = get_plan_price(subscription.plan)

    await db.commit()

    return {
        "confirmed_clients_count": confirmed_count,
        "trial_client_limit": trial_limit,
        "trial_active": trial_active,
        "subscription_status": subscription.status,
    }


# ============================================================
# Client payment links (company generates links for clients)
# ============================================================

@router.post("/client-invoice")
async def create_client_payment_link(
    current_user: CurrentUser,
    db: DbSession,
    appointment_id: int = None,
    amount: int = None,
    description: str = None,
):
    """
    Generate a Monobank payment link for a client.
    Uses the company's own monobank_token.
    """
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="No company selected")

    # Get company with monobank_token
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    if not company or not company.monobank_token:
        raise HTTPException(
            status_code=400,
            detail="Monobank токен не налаштований. Додайте токен у налаштуваннях компанії.",
        )

    # If appointment_id provided, get details
    if appointment_id:
        apt_result = await db.execute(
            select(Appointment)
            .options(selectinload(Appointment.service))
            .where(
                Appointment.id == appointment_id,
                Appointment.company_id == company_id,
            )
        )
        appointment = apt_result.scalar_one_or_none()
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        if not amount:
            amount = int((appointment.service_price or 0) * 100)  # Convert to kopecks
        if not description:
            service_name = appointment.service.name if appointment.service else "Послуга"
            description = f"{company.name} - {service_name}"

    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Amount is required")

    if not description:
        description = f"Оплата послуг - {company.name}"

    reference = f"client_{company_id}_{appointment_id or 'manual'}_{secrets.token_hex(4)}"
    redirect_url = f"{settings.FRONTEND_URL}/payment/success"
    webhook_url = f"{settings.API_URL}{settings.API_V1_PREFIX}/billing/client-webhook"

    try:
        invoice = await create_client_invoice(
            merchant_token=company.monobank_token,
            amount=amount,
            reference=reference,
            destination=description,
            redirect_url=redirect_url,
            webhook_url=webhook_url,
        )
    except MonobankError as e:
        raise HTTPException(status_code=502, detail=f"Monobank error: {e.message}")

    return {
        "invoice_id": invoice["invoiceId"],
        "page_url": invoice["pageUrl"],
        "amount": amount,
        "description": description,
    }


@router.post("/client-webhook")
async def client_payment_webhook(
    request: Request,
    db: DbSession,
):
    """
    Webhook for client payments (using company's monobank_token).
    Updates appointment payment status if applicable.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    invoice_id = body.get("invoiceId")
    status_str = body.get("status")
    reference = body.get("reference", "")

    logger.info(f"Client payment webhook: invoiceId={invoice_id}, status={status_str}, ref={reference}")

    # For now, just log. Can be extended to update appointment payment status.
    return {"status": "ok"}

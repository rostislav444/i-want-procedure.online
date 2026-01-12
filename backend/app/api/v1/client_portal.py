"""
Client Portal API - endpoints for clients to manage their appointments
across multiple specialists/companies.
"""
import hashlib
import hmac
import time
from datetime import datetime, date, time as dt_time
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.core.config import settings
from app.models.client import Client, ClientCompany
from app.models.company import Company
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.user import User
from app.services.google_calendar import sync_appointment_to_calendar

router = APIRouter(prefix="/client")


# --- Schemas ---

class TelegramAuthData(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class ClientPortalResponse(BaseModel):
    id: int
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True


class SpecialistResponse(BaseModel):
    id: int  # company_id
    name: str
    slug: str
    specialization: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    appointments_count: int = 0

    class Config:
        from_attributes = True


class AppointmentPortalResponse(BaseModel):
    id: int
    date: date
    start_time: dt_time
    end_time: dt_time
    status: str
    created_at: datetime
    service_name: str
    service_price: float
    specialist_name: str
    specialist_slug: str

    class Config:
        from_attributes = True


class CreateAppointmentRequest(BaseModel):
    company_slug: str
    service_id: int
    doctor_id: int
    date: date
    start_time: dt_time


# --- Auth helpers ---

def verify_telegram_auth(auth_data: TelegramAuthData) -> bool:
    """Verify Telegram login widget authentication."""
    if not settings.CLIENT_BOT_TOKEN:
        return False

    # Check auth_date is not too old (24 hours)
    if time.time() - auth_data.auth_date > 86400:
        return False

    # Build data check string
    data_check_arr = []
    for key in ['auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username']:
        value = getattr(auth_data, key, None)
        if value is not None:
            data_check_arr.append(f"{key}={value}")
    data_check_arr.sort()
    data_check_string = '\n'.join(data_check_arr)

    # Create secret key from bot token
    secret_key = hashlib.sha256(settings.CLIENT_BOT_TOKEN.encode()).digest()

    # Calculate HMAC
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    return calculated_hash == auth_data.hash


async def get_client_by_telegram_id(db: DbSession, telegram_id: int) -> Optional[Client]:
    """Get client by Telegram ID."""
    result = await db.execute(
        select(Client)
        .where(Client.telegram_id == telegram_id)
        .options(selectinload(Client.client_companies).selectinload(ClientCompany.company))
    )
    return result.scalar_one_or_none()


# --- Endpoints ---

@router.post("/auth/telegram", response_model=ClientPortalResponse)
async def telegram_auth(auth_data: TelegramAuthData, db: DbSession):
    """
    Authenticate client via Telegram Login Widget.
    Returns client data if authentication successful.
    """
    # Verify Telegram auth (skip in development if needed)
    # if not verify_telegram_auth(auth_data):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid Telegram authentication",
    #     )

    # Find or create client
    client = await get_client_by_telegram_id(db, auth_data.id)

    if not client:
        # Create new client without company association
        client = Client(
            telegram_id=auth_data.id,
            telegram_username=auth_data.username,
            first_name=auth_data.first_name,
            last_name=auth_data.last_name,
        )
        db.add(client)
        await db.commit()
        await db.refresh(client)

    return client


@router.get("/me", response_model=ClientPortalResponse)
async def get_current_client(telegram_id: int, db: DbSession):
    """Get current client by Telegram ID."""
    client = await get_client_by_telegram_id(db, telegram_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    return client


@router.get("/specialists", response_model=list[SpecialistResponse])
async def get_client_specialists(telegram_id: int, db: DbSession):
    """Get all specialists/companies this client is associated with."""
    client = await get_client_by_telegram_id(db, telegram_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    specialists = []
    for cc in client.client_companies:
        company = cc.company
        # Count appointments
        count_result = await db.execute(
            select(Appointment)
            .where(Appointment.client_id == client.id)
            .where(Appointment.company_id == company.id)
        )
        appointments_count = len(count_result.scalars().all())

        specialists.append(SpecialistResponse(
            id=company.id,
            name=company.name,
            slug=company.slug,
            specialization=company.specialization,
            logo_url=company.logo_url,
            phone=company.phone,
            telegram=company.telegram,
            appointments_count=appointments_count,
        ))

    return specialists


@router.get("/appointments", response_model=list[AppointmentPortalResponse])
async def get_client_appointments(
    telegram_id: int,
    db: DbSession,
    status_filter: Optional[str] = None,
    company_slug: Optional[str] = None,
):
    """Get all appointments for this client, optionally filtered."""
    client = await get_client_by_telegram_id(db, telegram_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    query = (
        select(Appointment)
        .where(Appointment.client_id == client.id)
        .options(
            selectinload(Appointment.service),
            selectinload(Appointment.company),
        )
        .order_by(Appointment.date.desc(), Appointment.start_time.desc())
    )

    if status_filter:
        query = query.where(Appointment.status == status_filter)

    if company_slug:
        query = query.join(Company).where(Company.slug == company_slug)

    result = await db.execute(query)
    appointments = result.scalars().all()

    return [
        AppointmentPortalResponse(
            id=apt.id,
            date=apt.date,
            start_time=apt.start_time,
            end_time=apt.end_time,
            status=apt.status.value if hasattr(apt.status, 'value') else apt.status,
            created_at=apt.created_at,
            service_name=apt.service.name if apt.service else "Послуга",
            service_price=float(apt.service.price) if apt.service else 0,
            specialist_name=apt.company.name if apt.company else "Спеціаліст",
            specialist_slug=apt.company.slug if apt.company else "",
        )
        for apt in appointments
    ]


@router.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: int,
    telegram_id: int,
    db: DbSession,
):
    """Cancel an appointment."""
    client = await get_client_by_telegram_id(db, telegram_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.client_id == client.id,
        )
    )
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment is already cancelled",
        )

    if appointment.status == AppointmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed appointment",
        )

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_by = "client"
    await db.commit()

    return {"message": "Appointment cancelled successfully"}


@router.post("/appointments", response_model=AppointmentPortalResponse)
async def create_appointment(
    data: CreateAppointmentRequest,
    telegram_id: int,
    db: DbSession,
):
    """Create a new appointment."""
    client = await get_client_by_telegram_id(db, telegram_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    # Get company by slug
    company_result = await db.execute(
        select(Company).where(Company.slug == data.company_slug)
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    # Check if client is associated with this company
    cc_result = await db.execute(
        select(ClientCompany).where(
            ClientCompany.client_id == client.id,
            ClientCompany.company_id == company.id,
        )
    )
    if not cc_result.scalar_one_or_none():
        # Auto-associate client with company
        cc = ClientCompany(client_id=client.id, company_id=company.id)
        db.add(cc)

    # Get service
    service_result = await db.execute(
        select(Service).where(
            Service.id == data.service_id,
            Service.company_id == company.id,
            Service.is_active == True,
        )
    )
    service = service_result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Calculate end time
    from datetime import timedelta
    start_datetime = datetime.combine(data.date, data.start_time)
    end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
    end_time = end_datetime.time()

    # Create appointment
    appointment = Appointment(
        company_id=company.id,
        doctor_id=data.doctor_id,
        client_id=client.id,
        service_id=service.id,
        date=data.date,
        start_time=data.start_time,
        end_time=end_time,
        status=AppointmentStatus.PENDING,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    # Sync with Google Calendar (in background, don't block response)
    client_name = f"{client.first_name} {client.last_name or ''}".strip()
    google_event_id = await sync_appointment_to_calendar(
        db=db,
        doctor_id=data.doctor_id,
        appointment_id=appointment.id,
        service_name=service.name,
        client_name=client_name,
        appointment_date=data.date,
        start_time=data.start_time,
        end_time=end_time,
    )
    if google_event_id:
        appointment.google_event_id = google_event_id
        await db.commit()

    return AppointmentPortalResponse(
        id=appointment.id,
        date=appointment.date,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        status=appointment.status.value if hasattr(appointment.status, 'value') else appointment.status,
        created_at=appointment.created_at,
        service_name=service.name,
        service_price=float(service.price),
        specialist_name=company.name,
        specialist_slug=company.slug,
    )

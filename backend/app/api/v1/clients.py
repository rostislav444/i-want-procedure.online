from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.client import Client
from app.models.appointment import Appointment
from app.schemas.client import ClientResponse
from app.schemas.appointment import AppointmentResponse

router = APIRouter(prefix="/clients")


@router.get("", response_model=list[ClientResponse])
async def get_clients(current_user: CurrentUser, db: DbSession):
    """Get all clients who have appointments with this company"""
    result = await db.execute(
        select(Client)
        .join(Appointment, Appointment.client_id == Client.id)
        .where(Appointment.company_id == current_user.company_id)
        .distinct()
        .order_by(Client.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Client)
        .join(Appointment, Appointment.client_id == Client.id)
        .where(
            Client.id == client_id,
            Appointment.company_id == current_user.company_id,
        )
        .distinct()
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    return client


@router.get("/{client_id}/appointments", response_model=list[AppointmentResponse])
async def get_client_appointments(
    client_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.service),
            selectinload(Appointment.client),
        )
        .where(
            Appointment.client_id == client_id,
            Appointment.company_id == current_user.company_id,
        )
        .order_by(Appointment.date.desc(), Appointment.start_time.desc())
    )
    return result.scalars().all()

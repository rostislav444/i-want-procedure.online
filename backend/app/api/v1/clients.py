import random
from datetime import date
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func, case, and_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.client import Client, ClientCompany
from app.models.appointment import Appointment
from app.schemas.client import ClientResponse, ClientCreate, ClientListResponse
from app.schemas.appointment import AppointmentResponse

router = APIRouter(prefix="/clients")


# Test data for generating clients
UKRAINIAN_FIRST_NAMES = [
    "Олена", "Марія", "Анна", "Катерина", "Наталія", "Юлія", "Ірина", "Світлана",
    "Тетяна", "Оксана", "Дарія", "Софія", "Вікторія", "Аліна", "Діана",
    "Олександр", "Максим", "Артем", "Дмитро", "Андрій", "Богдан", "Віталій",
    "Євген", "Ігор", "Сергій", "Микола", "Володимир", "Олег", "Павло", "Роман"
]

UKRAINIAN_LAST_NAMES = [
    "Шевченко", "Бондаренко", "Коваленко", "Бойко", "Ткаченко", "Кравченко",
    "Олійник", "Шевчук", "Поліщук", "Ковальчук", "Бондар", "Мельник",
    "Кравчук", "Савченко", "Руденко", "Мороз", "Павленко", "Левченко",
    "Петренко", "Козак", "Лисенко", "Черненко", "Гончар", "Марченко"
]


class GenerateClientsRequest(BaseModel):
    count: int = 10


@router.get("", response_model=list[ClientListResponse])
async def get_clients(
    current_user: CurrentUser,
    db: DbSession,
    member_id: Optional[int] = Query(None, description="Filter by specialist member ID"),
    position_id: Optional[int] = Query(None, description="Filter by position ID"),
):
    """Get all clients associated with this company with appointment statistics."""
    from sqlalchemy import union_all
    from app.models.service import Service
    from app.models.company_member import CompanyMember

    today = date.today()
    has_filter = member_id or position_id

    # Build appointment query with optional filters
    if has_filter:
        # Filter by member and/or position
        query = (
            select(Client)
            .join(Appointment, Appointment.client_id == Client.id)
            .join(CompanyMember, CompanyMember.id == Appointment.member_id)
            .where(Appointment.company_id == current_user.company_id)
        )
        if member_id:
            query = query.where(Appointment.member_id == member_id)
        if position_id:
            query = query.where(CompanyMember.position_id == position_id)
        combined = query.subquery()
    else:
        # No filter - show all clients
        clients_with_appointments = (
            select(Client)
            .join(Appointment, Appointment.client_id == Client.id)
            .where(Appointment.company_id == current_user.company_id)
        )
        clients_via_association = (
            select(Client)
            .join(ClientCompany, ClientCompany.client_id == Client.id)
            .where(ClientCompany.company_id == current_user.company_id)
        )
        combined = union_all(clients_with_appointments, clients_via_association).subquery()

    # Get clients
    result = await db.execute(
        select(Client)
        .where(Client.id.in_(select(combined.c.id)))
        .order_by(Client.created_at.desc())
    )
    clients = result.scalars().all()

    # Get appointment stats for all clients in one query
    client_ids = [c.id for c in clients]

    if not client_ids:
        return []

    # Query for appointment statistics (counts only)
    stats_base = (
        select(
            Appointment.client_id,
            func.count(Appointment.id).label('total'),
            func.sum(case((Appointment.status == 'completed', 1), else_=0)).label('completed'),
            func.sum(case(
                (and_(
                    Appointment.status.in_(['pending', 'confirmed']),
                    Appointment.date >= today
                ), 1),
                else_=0
            )).label('upcoming'),
        )
        .where(
            Appointment.client_id.in_(client_ids),
            Appointment.company_id == current_user.company_id,
        )
    )
    if has_filter:
        stats_base = stats_base.join(CompanyMember, CompanyMember.id == Appointment.member_id)
        if member_id:
            stats_base = stats_base.where(Appointment.member_id == member_id)
        if position_id:
            stats_base = stats_base.where(CompanyMember.position_id == position_id)
    stats_query = await db.execute(stats_base.group_by(Appointment.client_id))
    stats_map = {
        row.client_id: {
            'total': row.total or 0,
            'completed': row.completed or 0,
            'upcoming': row.upcoming or 0,
        }
        for row in stats_query
    }

    # Get next upcoming appointment for each client (with service details)
    # PostgreSQL DISTINCT ON requires ORDER BY to start with the same columns
    next_base = (
        select(
            Appointment.client_id,
            Appointment.date,
            Appointment.start_time,
            Service.name.label('service_name'),
        )
        .join(Service, Service.id == Appointment.service_id)
        .where(
            Appointment.client_id.in_(client_ids),
            Appointment.company_id == current_user.company_id,
            Appointment.status.in_(['pending', 'confirmed']),
            Appointment.date >= today,
        )
    )
    if has_filter:
        next_base = next_base.join(CompanyMember, CompanyMember.id == Appointment.member_id)
        if member_id:
            next_base = next_base.where(Appointment.member_id == member_id)
        if position_id:
            next_base = next_base.where(CompanyMember.position_id == position_id)
    next_appts_query = await db.execute(
        next_base
        .order_by(Appointment.client_id, Appointment.date, Appointment.start_time)
        .distinct(Appointment.client_id)
    )
    next_appts_map = {
        row.client_id: {
            'date': row.date,
            'time': str(row.start_time)[:5] if row.start_time else None,
            'service': row.service_name,
        }
        for row in next_appts_query
    }

    # Get last completed appointment for each client (with service details)
    last_base = (
        select(
            Appointment.client_id,
            Appointment.date,
            Service.name.label('service_name'),
        )
        .join(Service, Service.id == Appointment.service_id)
        .where(
            Appointment.client_id.in_(client_ids),
            Appointment.company_id == current_user.company_id,
            Appointment.status == 'completed',
        )
    )
    if has_filter:
        last_base = last_base.join(CompanyMember, CompanyMember.id == Appointment.member_id)
        if member_id:
            last_base = last_base.where(Appointment.member_id == member_id)
        if position_id:
            last_base = last_base.where(CompanyMember.position_id == position_id)
    last_appts_query = await db.execute(
        last_base
        .order_by(Appointment.client_id, Appointment.date.desc())
        .distinct(Appointment.client_id)
    )
    last_appts_map = {
        row.client_id: {
            'date': row.date,
            'service': row.service_name,
        }
        for row in last_appts_query
    }

    # Build response with stats
    response = []
    for client in clients:
        stats = stats_map.get(client.id, {})
        next_appt = next_appts_map.get(client.id, {})
        last_appt = last_appts_map.get(client.id, {})

        response.append(ClientListResponse(
            id=client.id,
            telegram_id=client.telegram_id,
            telegram_username=client.telegram_username,
            first_name=client.first_name,
            last_name=client.last_name,
            phone=client.phone,
            language=client.language,
            created_at=client.created_at,
            total_appointments=stats.get('total', 0),
            completed_appointments=stats.get('completed', 0),
            upcoming_appointments=stats.get('upcoming', 0),
            next_visit_date=next_appt.get('date'),
            next_visit_time=next_appt.get('time'),
            next_visit_service=next_appt.get('service'),
            last_visit_date=last_appt.get('date'),
            last_visit_service=last_appt.get('service'),
        ))

    # Sort: clients with upcoming appointments first (by nearest date), then by last visit
    response.sort(key=lambda c: (
        0 if c.next_visit_date else 1,  # Upcoming first
        c.next_visit_date or date.max,   # By nearest upcoming date
        -(c.last_visit_date.toordinal() if c.last_visit_date else 0),  # Then by most recent visit
    ))

    return response


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, current_user: CurrentUser, db: DbSession):
    from sqlalchemy import or_, exists

    # Check if client has appointments with this company
    has_appointment = exists(
        select(Appointment.id).where(
            Appointment.client_id == client_id,
            Appointment.company_id == current_user.company_id,
        )
    )

    # Check if client is associated with this company
    has_association = exists(
        select(ClientCompany.id).where(
            ClientCompany.client_id == client_id,
            ClientCompany.company_id == current_user.company_id,
        )
    )

    result = await db.execute(
        select(Client).where(
            Client.id == client_id,
            or_(has_appointment, has_association),
        )
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


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new client and associate with current company"""
    # Check if client with this telegram_id already exists
    result = await db.execute(
        select(Client).where(Client.telegram_id == client_data.telegram_id)
    )
    existing_client = result.scalar_one_or_none()

    if existing_client:
        # Just associate with company if not already
        assoc_result = await db.execute(
            select(ClientCompany).where(
                ClientCompany.client_id == existing_client.id,
                ClientCompany.company_id == current_user.company_id,
            )
        )
        if not assoc_result.scalar_one_or_none():
            db.add(ClientCompany(
                client_id=existing_client.id,
                company_id=current_user.company_id,
            ))
            await db.commit()
        return existing_client

    # Create new client
    client = Client(
        company_id=current_user.company_id,
        telegram_id=client_data.telegram_id,
        telegram_username=client_data.telegram_username,
        first_name=client_data.first_name,
        last_name=client_data.last_name,
        phone=client_data.phone,
        language=client_data.language,
    )
    db.add(client)
    await db.flush()

    # Add company association
    db.add(ClientCompany(
        client_id=client.id,
        company_id=current_user.company_id,
    ))

    await db.commit()
    await db.refresh(client)
    return client


@router.post("/generate-test", response_model=list[ClientResponse])
async def generate_test_clients(
    request: GenerateClientsRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Generate test clients with Ukrainian names"""
    created_clients = []

    for i in range(request.count):
        first_name = random.choice(UKRAINIAN_FIRST_NAMES)
        last_name = random.choice(UKRAINIAN_LAST_NAMES)

        # Generate unique telegram_id (use large random number)
        telegram_id = random.randint(100000000, 999999999)

        # Check if this telegram_id already exists, regenerate if needed
        while True:
            result = await db.execute(
                select(Client).where(Client.telegram_id == telegram_id)
            )
            if not result.scalar_one_or_none():
                break
            telegram_id = random.randint(100000000, 999999999)

        # Generate phone number
        phone = f"+38067{random.randint(1000000, 9999999)}"

        # Generate username
        username = f"{first_name.lower()}_{last_name.lower()}_{random.randint(1, 999)}"

        client = Client(
            company_id=current_user.company_id,
            telegram_id=telegram_id,
            telegram_username=username,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
        )
        db.add(client)
        await db.flush()

        # Add company association
        db.add(ClientCompany(
            client_id=client.id,
            company_id=current_user.company_id,
        ))

        created_clients.append(client)

    await db.commit()

    # Refresh all clients
    for client in created_clients:
        await db.refresh(client)

    return created_clients

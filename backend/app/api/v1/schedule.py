from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, and_

from app.api.deps import DbSession, CurrentUser
from app.models.schedule import Schedule, ScheduleException, ScheduleExceptionType
from app.models.company_member import CompanyMember
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    ScheduleExceptionCreate,
    ScheduleExceptionUpdate,
    ScheduleExceptionResponse,
)

router = APIRouter(prefix="/schedule")


async def _resolve_doctor_id(current_user, db: DbSession, doctor_id: Optional[int] = None) -> int:
    """Resolve doctor_id: if provided (clinic mode), verify access and return user_id for that member."""
    if not doctor_id:
        return current_user.id

    # doctor_id here is member_id (company_members.id), resolve to user_id
    result = await db.execute(
        select(CompanyMember).where(CompanyMember.id == doctor_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specialist not found")
    return member.user_id


@router.get("", response_model=list[ScheduleResponse])
async def get_schedules(
    current_user: CurrentUser,
    db: DbSession,
    doctor_id: Optional[int] = None,
):
    target_user_id = await _resolve_doctor_id(current_user, db, doctor_id)
    result = await db.execute(
        select(Schedule)
        .where(Schedule.doctor_id == target_user_id)
        .order_by(Schedule.day_of_week)
    )
    return result.scalars().all()


@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    # Check if schedule for this day already exists
    result = await db.execute(
        select(Schedule).where(
            Schedule.doctor_id == current_user.id,
            Schedule.day_of_week == schedule_data.day_of_week,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Schedule for this day already exists",
        )

    schedule = Schedule(
        doctor_id=current_user.id,
        day_of_week=schedule_data.day_of_week,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        is_working_day=schedule_data.is_working_day,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule


@router.post("/bulk", response_model=list[ScheduleResponse])
async def create_or_update_schedules(
    schedules_data: list[ScheduleCreate],
    current_user: CurrentUser,
    db: DbSession,
    doctor_id: Optional[int] = None,
):
    """Create or update schedules for all days. doctor_id is member_id for clinic mode."""
    target_user_id = await _resolve_doctor_id(current_user, db, doctor_id)

    # Delete existing schedules
    result = await db.execute(
        select(Schedule).where(Schedule.doctor_id == target_user_id)
    )
    existing_schedules = result.scalars().all()
    for schedule in existing_schedules:
        await db.delete(schedule)

    # Create new schedules
    new_schedules = []
    for schedule_data in schedules_data:
        schedule = Schedule(
            doctor_id=target_user_id,
            day_of_week=schedule_data.day_of_week,
            start_time=schedule_data.start_time,
            end_time=schedule_data.end_time,
            is_working_day=schedule_data.is_working_day,
        )
        db.add(schedule)
        new_schedules.append(schedule)

    await db.commit()
    for schedule in new_schedules:
        await db.refresh(schedule)

    return new_schedules


@router.patch("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Schedule).where(
            Schedule.id == schedule_id,
            Schedule.doctor_id == current_user.id,
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    update_data = schedule_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    await db.commit()
    await db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(schedule_id: int, current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Schedule).where(
            Schedule.id == schedule_id,
            Schedule.doctor_id == current_user.id,
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    await db.delete(schedule)
    await db.commit()


# ============ Schedule Exceptions ============

@router.get("/exceptions", response_model=list[ScheduleExceptionResponse])
async def get_schedule_exceptions(
    current_user: CurrentUser,
    db: DbSession,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    doctor_id: Optional[int] = None,
):
    """Get schedule exceptions. doctor_id is member_id for clinic filtering."""
    target_user_id = await _resolve_doctor_id(current_user, db, doctor_id)
    query = select(ScheduleException).where(
        ScheduleException.doctor_id == target_user_id
    )

    if date_from:
        query = query.where(ScheduleException.date >= date_from)
    if date_to:
        query = query.where(ScheduleException.date <= date_to)

    query = query.order_by(ScheduleException.date)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/exceptions", response_model=ScheduleExceptionResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule_exception(
    exception_data: ScheduleExceptionCreate,
    current_user: CurrentUser,
    db: DbSession,
    doctor_id: Optional[int] = None,
):
    """Create a schedule exception (day off, modified hours, break, etc.)"""
    target_user_id = await _resolve_doctor_id(current_user, db, doctor_id)

    # For day_off, modified, working - only one per day allowed
    # For breaks - multiple allowed per day
    if exception_data.type != ScheduleExceptionType.BREAK:
        result = await db.execute(
            select(ScheduleException).where(
                ScheduleException.doctor_id == target_user_id,
                ScheduleException.date == exception_data.date,
                ScheduleException.type != ScheduleExceptionType.BREAK,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Day-level exception for this date already exists",
            )

    exception = ScheduleException(
        doctor_id=target_user_id,
        date=exception_data.date,
        type=exception_data.type,
        start_time=exception_data.start_time,
        end_time=exception_data.end_time,
        reason=exception_data.reason,
    )
    db.add(exception)
    await db.commit()
    await db.refresh(exception)
    return exception


async def _get_allowed_doctor_ids(current_user, db) -> set[int]:
    """Get all user_ids that current_user can manage (own + company members)."""
    allowed = {current_user.id}
    result = await db.execute(
        select(CompanyMember.user_id).where(CompanyMember.company_id.in_(
            select(CompanyMember.company_id).where(CompanyMember.user_id == current_user.id)
        ))
    )
    for row in result.scalars().all():
        allowed.add(row)
    return allowed


async def _find_exception(exception_id: int, current_user, db) -> ScheduleException:
    """Find exception by id, checking access for clinic mode."""
    allowed_ids = await _get_allowed_doctor_ids(current_user, db)
    result = await db.execute(
        select(ScheduleException).where(
            ScheduleException.id == exception_id,
            ScheduleException.doctor_id.in_(allowed_ids),
        )
    )
    exception = result.scalar_one_or_none()
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule exception not found",
        )
    return exception


@router.get("/exceptions/{exception_id}", response_model=ScheduleExceptionResponse)
async def get_schedule_exception(
    exception_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    return await _find_exception(exception_id, current_user, db)


@router.patch("/exceptions/{exception_id}", response_model=ScheduleExceptionResponse)
async def update_schedule_exception(
    exception_id: int,
    exception_data: ScheduleExceptionUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    exception = await _find_exception(exception_id, current_user, db)

    update_data = exception_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exception, field, value)

    await db.commit()
    await db.refresh(exception)
    return exception


@router.delete("/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule_exception(
    exception_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    exception = await _find_exception(exception_id, current_user, db)
    await db.delete(exception)
    await db.commit()

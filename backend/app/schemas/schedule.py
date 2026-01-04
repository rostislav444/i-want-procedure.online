from datetime import time, date, datetime
from typing import Optional
from pydantic import BaseModel

from app.models.schedule import ScheduleExceptionType


class ScheduleCreate(BaseModel):
    day_of_week: int  # 0-6, Monday-Sunday
    start_time: time
    end_time: time
    is_working_day: bool = True


class ScheduleUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_working_day: Optional[bool] = None


class ScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_working_day: bool

    class Config:
        from_attributes = True


# Schedule Exception schemas
class ScheduleExceptionCreate(BaseModel):
    date: date
    type: ScheduleExceptionType
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None


class ScheduleExceptionUpdate(BaseModel):
    type: Optional[ScheduleExceptionType] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None


class ScheduleExceptionResponse(BaseModel):
    id: int
    doctor_id: int
    date: date
    type: ScheduleExceptionType
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

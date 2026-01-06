"""
Google Calendar integration service.

Handles OAuth flow and calendar operations.
"""
from datetime import datetime, timedelta
from typing import Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User

# Google OAuth URLs
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

# Required scopes for Calendar access
GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
]


def get_google_auth_url(state: str, redirect_uri: Optional[str] = None) -> str:
    """Generate Google OAuth authorization URL."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",  # Get refresh token
        "prompt": "consent",  # Force consent to get refresh token
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_code_for_tokens(code: str, redirect_uri: Optional[str] = None) -> dict:
    """Exchange authorization code for access and refresh tokens."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
            },
        )
        response.raise_for_status()
        return response.json()


async def refresh_access_token(refresh_token: str) -> dict:
    """Refresh expired access token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        return response.json()


async def get_google_user_info(access_token: str) -> dict:
    """Get user info from Google."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()


async def ensure_valid_token(user: User, db: AsyncSession) -> Optional[str]:
    """
    Ensure user has a valid access token.
    Refreshes if expired.
    Returns access token or None if not connected.
    """
    if not user.google_refresh_token:
        return None

    # Check if token is expired (with 5 min buffer)
    if user.google_token_expires_at and user.google_token_expires_at > datetime.utcnow() + timedelta(minutes=5):
        return user.google_access_token

    # Token expired or expiring soon, refresh it
    try:
        tokens = await refresh_access_token(user.google_refresh_token)
        user.google_access_token = tokens["access_token"]
        user.google_token_expires_at = datetime.utcnow() + timedelta(seconds=tokens["expires_in"])
        await db.commit()
        return user.google_access_token
    except Exception:
        return None


async def get_calendar_list(access_token: str) -> list[dict]:
    """Get list of user's calendars."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/users/me/calendarList",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("items", [])


async def create_calendar_event(
    access_token: str,
    calendar_id: str,
    summary: str,
    description: str,
    start_time: datetime,
    end_time: datetime,
    attendee_email: Optional[str] = None,
    location: Optional[str] = None,
) -> dict:
    """
    Create a new event in Google Calendar.

    Args:
        access_token: Google OAuth access token
        calendar_id: Calendar ID (usually 'primary')
        summary: Event title
        description: Event description
        start_time: Event start (datetime with timezone)
        end_time: Event end (datetime with timezone)
        attendee_email: Optional email to invite
        location: Optional location

    Returns:
        Created event data
    """
    event = {
        "summary": summary,
        "description": description,
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "Europe/Kiev",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Europe/Kiev",
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 60},
                {"method": "popup", "minutes": 15},
            ],
        },
    }

    if attendee_email:
        event["attendees"] = [{"email": attendee_email}]

    if location:
        event["location"] = location

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=event,
        )
        response.raise_for_status()
        return response.json()


async def update_calendar_event(
    access_token: str,
    calendar_id: str,
    event_id: str,
    summary: Optional[str] = None,
    description: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    status: Optional[str] = None,  # 'confirmed', 'tentative', 'cancelled'
) -> dict:
    """Update an existing calendar event."""
    # First get the current event
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events/{event_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        event = response.json()

    # Update fields
    if summary:
        event["summary"] = summary
    if description:
        event["description"] = description
    if start_time:
        event["start"] = {"dateTime": start_time.isoformat(), "timeZone": "Europe/Kiev"}
    if end_time:
        event["end"] = {"dateTime": end_time.isoformat(), "timeZone": "Europe/Kiev"}
    if status:
        event["status"] = status

    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events/{event_id}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=event,
        )
        response.raise_for_status()
        return response.json()


async def delete_calendar_event(
    access_token: str,
    calendar_id: str,
    event_id: str,
) -> bool:
    """Delete a calendar event."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events/{event_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        return response.status_code == 204


async def sync_appointment_to_calendar(
    db: AsyncSession,
    doctor_id: int,
    appointment_id: int,
    service_name: str,
    client_name: str,
    appointment_date: datetime,
    start_time: datetime,
    end_time: datetime,
    status: str = "confirmed",
    notes: str = "",
) -> Optional[str]:
    """
    Sync an appointment to Google Calendar.
    Returns the Google event ID if successful, None otherwise.
    """
    from app.models.user import User

    # Get doctor user
    result = await db.execute(
        __import__('sqlalchemy').select(User).where(User.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()

    if not doctor or not doctor.google_calendar_enabled or not doctor.google_calendar_id:
        return None

    # Get valid token
    token = await ensure_valid_token(doctor, db)
    if not token:
        return None

    try:
        # Build event description
        description = f"Клієнт: {client_name}\nПослуга: {service_name}"
        if notes:
            description += f"\n\nНотатки: {notes}"

        # Combine date and time
        start_datetime = datetime.combine(appointment_date.date() if hasattr(appointment_date, 'date') else appointment_date, start_time)
        end_datetime = datetime.combine(appointment_date.date() if hasattr(appointment_date, 'date') else appointment_date, end_time)

        # Create event
        event = await create_calendar_event(
            access_token=token,
            calendar_id=doctor.google_calendar_id,
            summary=f"Запис: {client_name} - {service_name}",
            description=description,
            start_time=start_datetime,
            end_time=end_datetime,
        )

        return event.get("id")
    except Exception as e:
        print(f"Error syncing appointment to calendar: {e}")
        return None


async def update_appointment_in_calendar(
    db: AsyncSession,
    doctor_id: int,
    google_event_id: str,
    status: str = "confirmed",
    new_start: Optional[datetime] = None,
    new_end: Optional[datetime] = None,
) -> bool:
    """
    Update an appointment in Google Calendar.
    Used when appointment status changes.
    """
    from app.models.user import User

    # Get doctor user
    result = await db.execute(
        __import__('sqlalchemy').select(User).where(User.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()

    if not doctor or not doctor.google_calendar_enabled or not doctor.google_calendar_id:
        return False

    # Get valid token
    token = await ensure_valid_token(doctor, db)
    if not token:
        return False

    try:
        if status == "cancelled":
            # Delete the event
            await delete_calendar_event(token, doctor.google_calendar_id, google_event_id)
        else:
            # Update the event
            await update_calendar_event(
                access_token=token,
                calendar_id=doctor.google_calendar_id,
                event_id=google_event_id,
                status="confirmed" if status == "confirmed" else "tentative",
                start_time=new_start,
                end_time=new_end,
            )
        return True
    except Exception as e:
        print(f"Error updating appointment in calendar: {e}")
        return False

"""
Geocoding service using Nominatim (OpenStreetMap).
Free, no API key required.
"""
import httpx
from math import radians, cos, sin, asin, sqrt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.city import City

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
NOMINATIM_HEADERS = {
    "User-Agent": "ProcedureApp/1.0 (beauty booking service)",
    "Accept-Language": "uk,en",
}


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two points in km."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(a))


async def reverse_geocode(latitude: float, longitude: float) -> dict:
    """
    Reverse geocode coordinates using Nominatim.
    Returns: {address: str, city: str, oblast: str, country: str}
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{NOMINATIM_URL}/reverse",
            params={
                "lat": latitude,
                "lon": longitude,
                "format": "jsonv2",
                "addressdetails": 1,
                "accept-language": "uk",
            },
            headers=NOMINATIM_HEADERS,
        )
        resp.raise_for_status()
        data = resp.json()

    addr = data.get("address", {})
    # Build address string from components
    parts = []
    street = addr.get("road", "")
    house = addr.get("house_number", "")
    if street:
        parts.append(street)
    if house:
        parts.append(house)

    city_name = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("hamlet")
        or ""
    )
    oblast = addr.get("state", "")

    return {
        "address": ", ".join(parts) if parts else None,
        "city": city_name,
        "oblast": oblast,
        "country": addr.get("country_code", "").upper(),
        "display_name": data.get("display_name", ""),
    }


async def search_address(query: str, city_name: str | None = None) -> list[dict]:
    """
    Search for addresses using Nominatim.
    Returns list of {display_name, address, lat, lon}
    """
    search_query = query
    if city_name:
        search_query = f"{query}, {city_name}, Україна"
    else:
        search_query = f"{query}, Україна"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{NOMINATIM_URL}/search",
            params={
                "q": search_query,
                "format": "jsonv2",
                "addressdetails": 1,
                "limit": 5,
                "countrycodes": "ua",
                "accept-language": "uk",
            },
            headers=NOMINATIM_HEADERS,
        )
        resp.raise_for_status()
        results = resp.json()

    addresses = []
    for r in results:
        addr = r.get("address", {})
        street = addr.get("road", "")
        house = addr.get("house_number", "")
        parts = []
        if street:
            parts.append(street)
        if house:
            parts.append(house)

        addresses.append({
            "display_name": r.get("display_name", ""),
            "address": ", ".join(parts) if parts else None,
            "city": addr.get("city") or addr.get("town") or addr.get("village") or "",
            "latitude": float(r.get("lat", 0)),
            "longitude": float(r.get("lon", 0)),
        })

    return addresses


async def find_nearest_city(
    session: AsyncSession, latitude: float, longitude: float
) -> City | None:
    """Find the nearest city in our DB to the given coordinates."""
    result = await session.execute(
        select(City).where(City.country == "UA")
    )
    cities = result.scalars().all()

    if not cities:
        return None

    nearest = None
    min_dist = float("inf")
    for city in cities:
        if city.latitude and city.longitude:
            dist = _haversine(latitude, longitude, city.latitude, city.longitude)
            if dist < min_dist:
                min_dist = dist
                nearest = city

    # Only match if within 50km
    if min_dist > 50:
        return None

    return nearest


async def search_cities(
    session: AsyncSession, query: str, limit: int = 10
) -> list[City]:
    """Search cities by name prefix (case-insensitive)."""
    q = query.strip().lower()
    if not q:
        # Return regional centers sorted by population
        result = await session.execute(
            select(City)
            .where(City.is_regional_center == True)
            .order_by(City.population.desc().nulls_last())
            .limit(limit)
        )
        return list(result.scalars().all())

    result = await session.execute(
        select(City)
        .where(City.name.ilike(f"{q}%"))
        .order_by(City.population.desc().nulls_last())
        .limit(limit)
    )
    return list(result.scalars().all())

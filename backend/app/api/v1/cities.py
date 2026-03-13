from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.city import CityResponse, GeocodingResult
from app.services.geocoding import search_cities, reverse_geocode, find_nearest_city, search_address

router = APIRouter()


@router.get("/cities/search", response_model=list[CityResponse])
async def search_cities_endpoint(
    q: str = Query("", description="Search query (city name prefix)"),
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_db),
):
    """Search Ukrainian cities by name. Returns regional centers if query is empty."""
    cities = await search_cities(session, q, limit)
    result = []
    for c in cities:
        result.append(CityResponse(
            id=c.id,
            name=c.name,
            oblast=c.oblast,
            country=c.country,
            latitude=c.latitude,
            longitude=c.longitude,
            is_regional_center=c.is_regional_center,
            full_name=c.full_name,
        ))
    return result


@router.get("/cities/reverse-geocode", response_model=GeocodingResult)
async def reverse_geocode_endpoint(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    session: AsyncSession = Depends(get_db),
):
    """Reverse geocode coordinates to find city and address."""
    # Get address from Nominatim
    geo_data = await reverse_geocode(lat, lon)

    # Find nearest city in our DB
    city = await find_nearest_city(session, lat, lon)

    return GeocodingResult(
        city_id=city.id if city else None,
        city_name=city.name if city else geo_data.get("city"),
        oblast=city.oblast if city else geo_data.get("oblast"),
        address=geo_data.get("address"),
        latitude=lat,
        longitude=lon,
    )


@router.get("/cities/search-address")
async def search_address_endpoint(
    q: str = Query(..., description="Address search query"),
    city: str = Query(None, description="City name to narrow search"),
):
    """Search for addresses using Nominatim (for autocomplete)."""
    results = await search_address(q, city)
    return results

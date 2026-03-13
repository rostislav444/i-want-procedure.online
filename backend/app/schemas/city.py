from pydantic import BaseModel


class CityResponse(BaseModel):
    id: int
    name: str
    oblast: str
    country: str = "UA"
    latitude: float | None = None
    longitude: float | None = None
    is_regional_center: bool = False
    full_name: str = ""

    class Config:
        from_attributes = True


class CityShort(BaseModel):
    """Short city info for embedding in other responses."""
    id: int
    name: str
    oblast: str
    latitude: float | None = None
    longitude: float | None = None

    class Config:
        from_attributes = True


class GeocodingResult(BaseModel):
    """Result from reverse geocoding."""
    city_id: int | None = None
    city_name: str | None = None
    oblast: str | None = None
    address: str | None = None
    latitude: float
    longitude: float

from sqlalchemy import String, Float, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)  # "Київ"
    oblast: Mapped[str] = mapped_column(String(100), index=True)  # "Київська область"
    country: Mapped[str] = mapped_column(String(2), default="UA", index=True)  # ISO
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    population: Mapped[int | None] = mapped_column(Integer, nullable=True)  # for sorting
    is_regional_center: Mapped[bool] = mapped_column(Boolean, default=False)

    @property
    def full_name(self) -> str:
        return f"{self.name}, {self.oblast}"

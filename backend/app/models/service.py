from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, Integer, Numeric, Boolean, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.specialty import Specialty
    from app.models.company_member import MemberService
    from app.models.position import Position


class ServiceCategory(Base):
    """Категории услуг с рекурсивной структурой"""
    __tablename__ = "service_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="service_categories")
    parent: Mapped[Optional["ServiceCategory"]] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["ServiceCategory"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    services: Mapped[list["Service"]] = relationship(back_populates="category")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True
    )
    specialty_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("specialties.id", ondelete="SET NULL"), nullable=True
    )
    position_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("positions.id", ondelete="SET NULL"), nullable=True
    )
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="services")
    category: Mapped[Optional["ServiceCategory"]] = relationship(back_populates="services")
    specialty: Mapped[Optional["Specialty"]] = relationship(back_populates="services")
    position: Mapped[Optional["Position"]] = relationship(back_populates="services")
    doctor: Mapped[Optional["User"]] = relationship(back_populates="services")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service")
    steps: Mapped[list["ServiceStep"]] = relationship(
        back_populates="service", cascade="all, delete-orphan", order_by="ServiceStep.order"
    )
    products: Mapped[list["ServiceProduct"]] = relationship(
        back_populates="service", cascade="all, delete-orphan"
    )
    member_services: Mapped[list["MemberService"]] = relationship(
        back_populates="service", cascade="all, delete-orphan"
    )


class ServiceStep(Base):
    """Этапы процедуры"""
    __tablename__ = "service_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"))
    order: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    service: Mapped["Service"] = relationship(back_populates="steps")


class ServiceProduct(Base):
    """Препараты/продукты для процедуры"""
    __tablename__ = "service_products"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    service: Mapped["Service"] = relationship(back_populates="products")

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GlobalServiceCategory(Base):
    """Глобальні категорії послуг (не прив'язані до компанії).
    Використовуються як каталог для marketplace.
    """
    __tablename__ = "global_service_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("global_service_categories.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255))
    name_en: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    parent: Mapped[Optional["GlobalServiceCategory"]] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["GlobalServiceCategory"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    templates: Mapped[list["GlobalServiceTemplate"]] = relationship(
        back_populates="category"
    )


class GlobalServiceTemplate(Base):
    """Глобальні шаблони послуг — довідник процедур для marketplace.
    Майстри обирають з каталогу або створюють кастомні.
    """
    __tablename__ = "global_service_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("global_service_categories.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(255))
    name_en: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    category: Mapped["GlobalServiceCategory"] = relationship(back_populates="templates")

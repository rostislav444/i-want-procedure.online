"""Protocol template model for storing procedure protocol templates."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, Integer, Text, Boolean, JSON, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.service import Service, ServiceCategory


class ProtocolTemplate(Base):
    """Template for procedure protocols.

    Templates define the structure/fields for documenting procedures.
    Can be linked to specific services or categories.

    Example sections JSON:
    [
        {
            "id": "skin_assessment",
            "title": "Оцінка стану шкіри",
            "icon": "scan",
            "color": "blue",
            "fields": [
                {"id": "skin_type", "type": "chips", "label": "Тип шкіри", "options": ["Суха", "Жирна", "Комбінована", "Нормальна", "Чутлива"]},
                {"id": "skin_rating", "type": "rating", "label": "Стан шкіри", "max": 10},
                {"id": "problems", "type": "chips_multi", "label": "Проблеми", "options": ["Акне", "Пігментація", "Зморшки"]},
                {"id": "notes", "type": "textarea", "label": "Примітки", "placeholder": "Додаткові спостереження..."}
            ]
        },
        {
            "id": "injection_zones",
            "title": "Зони введення",
            "icon": "syringe",
            "color": "violet",
            "fields": [
                {"id": "zones", "type": "chips_multi", "label": "Зони", "options": ["Губи", "Носогубки", "Підборіддя", "Щоки"]},
                {"id": "volume", "type": "number", "label": "Об'єм (мл)", "min": 0, "max": 10, "step": 0.1},
                {"id": "pain_level", "type": "rating", "label": "Больові відчуття", "max": 5}
            ]
        }
    ]

    Field types:
    - text: Single line text input
    - textarea: Multi-line text input
    - chips: Single select chips/tags
    - chips_multi: Multi-select chips/tags
    - rating: Star/number rating (1-max)
    - number: Numeric input with min/max/step
    - select: Dropdown select
    - checkbox: Boolean checkbox
    - date: Date picker
    - photos: Photo upload array
    """
    __tablename__ = "protocol_templates"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Ownership - can be global (company_id=None) or company-specific
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Optional link to specific service or category
    service_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("services.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("service_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Template info
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # The sections/fields structure (JSON array)
    sections: Mapped[list] = mapped_column(JSON, default=list)

    # Settings
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)  # Default for category/service
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # Built-in templates

    # Metadata
    tags: Mapped[list] = mapped_column(JSON, default=list)  # ["injection", "facial", "cleanup"]

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped[Optional["Company"]] = relationship()
    service: Mapped[Optional["Service"]] = relationship()
    category: Mapped[Optional["ServiceCategory"]] = relationship()

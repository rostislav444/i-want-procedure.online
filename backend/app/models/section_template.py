"""Section template model for storing AI-generated sections."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, Integer, Text, Boolean, JSON, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class SectionTemplate(Base):
    """Store section templates (HTML with Tailwind CSS).

    Templates use simple placeholders like {{title}}, {{subtitle}}, etc.
    that get replaced with actual data when rendering.
    """
    __tablename__ = "section_templates"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Template info
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    section_type: Mapped[str] = mapped_column(String(50), default="hero")  # hero, services, about, etc.

    # The actual HTML template with Tailwind classes
    # Uses placeholders: {{title}}, {{subtitle}}, {{cta_text}}, {{cta_link}}, {{background_image}}, {{primary_color}}
    html_template: Mapped[str] = mapped_column(Text)

    # Schema defining what variables this template needs
    # Example: {"title": {"type": "text", "required": true}, "subtitle": {"type": "text"}}
    variables_schema: Mapped[dict] = mapped_column(JSON, default=dict)

    # Preview image (screenshot or generated thumbnail)
    preview_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Source image used to generate this template (Pinterest screenshot, etc.)
    source_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Ownership
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # Built-in templates
    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Metadata
    tags: Mapped[list] = mapped_column(JSON, default=list)  # ["modern", "minimal", "dark"]

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    created_by: Mapped[Optional["User"]] = relationship()

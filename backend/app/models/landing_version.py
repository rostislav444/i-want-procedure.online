"""
Landing Version model - stores history of AI-generated landing pages.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List, Any

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company


class LandingVersion(Base):
    """Stores versions of AI-generated landing pages for a company.

    Each generation creates a new version. Users can:
    - View history of all generations
    - Add notes/corrections to any version
    - Switch active version (which one is displayed on public site)
    """
    __tablename__ = "landing_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )

    # Generated content
    html: Mapped[str] = mapped_column(Text, nullable=False)

    # Generation context
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    had_reference_image: Mapped[bool] = mapped_column(Boolean, default=False)

    # Reference images used for generation (stored as base64 JSON array)
    # Format: [{"data": "base64...", "media_type": "image/jpeg", "name": "ref1.jpg"}, ...]
    reference_images: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)

    # User notes/corrections for future improvements
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Which version is currently active (displayed on public site)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="landing_versions")

    @property
    def has_reference_images(self) -> bool:
        """Check if this version has stored reference images."""
        return bool(self.reference_images and len(self.reference_images) > 0)

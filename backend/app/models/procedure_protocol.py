"""Procedure protocol model for documenting client visits."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, Text, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.user import User
    from app.models.protocol_template import ProtocolTemplate
    from app.models.protocol_file import ProtocolFile


class ProcedureProtocol(Base):
    """Protocol documenting what was done during a procedure/appointment."""
    __tablename__ = "procedure_protocols"

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"),
        unique=True,
        index=True
    )
    specialist_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Link to template (optional - for dynamic protocols)
    template_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("protocol_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Dynamic data storage (JSON matching template sections)
    # Example: {"skin_assessment": {"skin_type": "Комбінована", "rating": 7}, "injection_zones": {...}}
    template_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    # Legacy fields (kept for backward compatibility)
    # Client condition
    skin_condition: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    complaints: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Procedure details
    procedure_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technique_used: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Results & recommendations
    results: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_visit_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Photos (stored as JSON array of URLs)
    photos_before: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    photos_after: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    appointment: Mapped["Appointment"] = relationship(back_populates="protocol")
    specialist: Mapped[Optional["User"]] = relationship()
    template: Mapped[Optional["ProtocolTemplate"]] = relationship()
    products_used: Mapped[list["ProtocolProduct"]] = relationship(
        back_populates="protocol",
        cascade="all, delete-orphan"
    )
    files: Mapped[list["ProtocolFile"]] = relationship(
        back_populates="protocol",
        cascade="all, delete-orphan"
    )


class ProtocolProduct(Base):
    """Products used during a procedure."""
    __tablename__ = "protocol_products"

    id: Mapped[int] = mapped_column(primary_key=True)
    protocol_id: Mapped[int] = mapped_column(
        ForeignKey("procedure_protocols.id", ondelete="CASCADE"),
        index=True
    )

    name: Mapped[str] = mapped_column(String(255))
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "2ml", "1 ампула"
    batch_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    protocol: Mapped["ProcedureProtocol"] = relationship(back_populates="products_used")

"""Protocol file model for storing uploaded photos for procedures."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, Integer, ForeignKey, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User
    from app.models.procedure_protocol import ProcedureProtocol


class ProtocolFile(Base):
    """File uploads for procedure protocols (before/after photos).

    Files can be uploaded before the protocol is saved (protocol_id=NULL),
    then attached to the protocol when it's created.
    """
    __tablename__ = "protocol_files"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Link to protocol (nullable for temp uploads before protocol is saved)
    protocol_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("procedure_protocols.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Company scope
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        index=True
    )

    # File type: 'before' or 'after'
    file_type: Mapped[str] = mapped_column(String(20))  # 'before' | 'after'

    # Portfolio visibility
    show_in_portfolio: Mapped[bool] = mapped_column(Boolean, default=False)

    # File info
    filename: Mapped[str] = mapped_column(String(255))  # stored filename
    original_filename: Mapped[str] = mapped_column(String(255))  # user's filename
    file_path: Mapped[str] = mapped_column(String(500))  # URL path
    file_size: Mapped[int] = mapped_column(Integer)  # bytes
    mime_type: Mapped[str] = mapped_column(String(100))  # image/jpeg, etc.

    # Who uploaded
    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    protocol: Mapped[Optional["ProcedureProtocol"]] = relationship(
        back_populates="files"
    )
    company: Mapped["Company"] = relationship()
    uploader: Mapped[Optional["User"]] = relationship()

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, BigInteger, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.company import Company


class Language(str, Enum):
    UK = "uk"
    RU = "ru"
    EN = "en"


class ClientCompany(Base):
    """Many-to-many relationship between clients and companies.
    Allows one client to be associated with multiple specialists/companies.
    """
    __tablename__ = "client_companies"
    __table_args__ = (
        UniqueConstraint('client_id', 'company_id', name='uq_client_company'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="client_companies")
    company: Mapped["Company"] = relationship(back_populates="client_companies")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Keep company_id for backwards compatibility, but it's now optional
    # This represents the "primary" or first company the client registered with
    company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("companies.id"), nullable=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    language: Mapped[Language] = mapped_column(String(5), default=Language.UK)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped[Optional["Company"]] = relationship(back_populates="clients")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="client")
    client_companies: Mapped[list["ClientCompany"]] = relationship(
        back_populates="client",
        cascade="all, delete-orphan"
    )

    @property
    def companies(self) -> list["Company"]:
        """Get all companies this client is associated with."""
        return [cc.company for cc in self.client_companies]

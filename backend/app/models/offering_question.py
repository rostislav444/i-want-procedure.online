from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class OfferingQuestion(Base):
    __tablename__ = "offering_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    offering_id: Mapped[int] = mapped_column(Integer, ForeignKey("educator_offerings.id", ondelete="CASCADE"), nullable=False)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    visitor_name: Mapped[str] = mapped_column(String(200), nullable=False)
    visitor_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    answered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

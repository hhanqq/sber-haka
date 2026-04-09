from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    age_group: Mapped[str] = mapped_column(String(50), index=True)
    persona_hint: Mapped[str] = mapped_column(String(100))
    current_bank: Mapped[str] = mapped_column(String(120))
    trust_level: Mapped[int] = mapped_column(Integer)
    digital_confidence: Mapped[int] = mapped_column(Integer)
    assistance_needed: Mapped[str] = mapped_column(String(120))
    barriers: Mapped[list[str]] = mapped_column(JSON)
    motivators: Mapped[list[str]] = mapped_column(JSON)
    channel_preference: Mapped[str] = mapped_column(String(100))
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TransferRequest(Base):
    __tablename__ = "transfer_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30))
    preferred_channel: Mapped[str] = mapped_column(String(60))
    assistance_format: Mapped[str] = mapped_column(String(80))
    has_gosuslugi: Mapped[str] = mapped_column(String(20))
    mobility_level: Mapped[str] = mapped_column(String(80))
    appointment_slot: Mapped[str] = mapped_column(String(80))
    step_statuses: Mapped[list[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class BenchmarkResult(Base):
    __tablename__ = "benchmark_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_name: Mapped[str] = mapped_column(String(160), index=True)
    source_url: Mapped[str] = mapped_column(String(500))
    page_type: Mapped[str] = mapped_column(String(80), default="страница для пенсионеров")
    model_name: Mapped[str] = mapped_column(String(80), default="gpt-4o-mini")
    total_score: Mapped[int] = mapped_column(Integer)
    score_breakdown: Mapped[dict] = mapped_column(JSON)
    strengths: Mapped[list[str]] = mapped_column(JSON)
    gaps: Mapped[list[str]] = mapped_column(JSON)
    summary: Mapped[str] = mapped_column(Text)
    evidence_excerpt: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

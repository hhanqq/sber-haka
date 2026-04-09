from datetime import datetime

from pydantic import BaseModel, Field


class StepStatus(BaseModel):
    name: str
    status: str


class SurveyCreate(BaseModel):
    age_group: str
    persona_hint: str
    current_bank: str
    trust_level: int = Field(ge=1, le=5)
    digital_confidence: int = Field(ge=1, le=5)
    assistance_needed: str
    barriers: list[str]
    motivators: list[str]
    channel_preference: str
    notes: str = ""


class SurveyOut(SurveyCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SurveyInsight(BaseModel):
    persona_label: str
    stress_level: str
    readiness_score: int = Field(ge=0, le=100)
    key_barriers: list[str]
    motivator_summary: list[str]
    recommended_route: str
    communication_tone: str
    next_best_actions: list[str]
    executive_summary: str


class TransferCreate(BaseModel):
    full_name: str
    phone: str
    preferred_channel: str
    assistance_format: str
    has_gosuslugi: str
    mobility_level: str
    appointment_slot: str


class TransferOut(BaseModel):
    id: int
    full_name: str
    phone: str
    preferred_channel: str
    assistance_format: str
    has_gosuslugi: str
    mobility_level: str
    appointment_slot: str
    step_statuses: list[StepStatus]
    created_at: datetime

    model_config = {"from_attributes": True}


class TransferStatusUpdate(BaseModel):
    step_name: str
    status: str = Field(pattern="^(waiting|pending|done|blocked)$")


class BenchmarkResultCreate(BaseModel):
    source_name: str
    source_url: str
    page_type: str = "страница для пенсионеров"
    model_name: str = "gpt-4o-mini"
    total_score: int = Field(ge=0, le=100)
    score_breakdown: dict[str, int]
    strengths: list[str]
    gaps: list[str]
    summary: str
    evidence_excerpt: str = ""


class BenchmarkResultOut(BenchmarkResultCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MlBarrierSnapshot(BaseModel):
    source: str
    sample_size: int
    generated_at: str
    segments: list[dict]
    top_factors: list[dict]
    scenario_effects: list[dict]
    recommendations: list[str]

from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .db import Base, SessionLocal, engine
from .models import BenchmarkResult, SurveyResponse, TransferRequest
from .schemas import (
    BenchmarkResultCreate,
    BenchmarkResultOut,
    MlBarrierSnapshot,
    SurveyCreate,
    SurveyInsight,
    SurveyOut,
    TransferCreate,
    TransferOut,
    TransferStatusUpdate,
)
from .static_data import (
    BENCHMARKS,
    BENCHMARK_CRITERIA,
    BENCHMARK_DEMO_RESULTS,
    CHANNELS,
    JOURNEY_MAP,
    ML_DEFAULT_SNAPSHOT,
    MARKET_RESEARCH,
    PERSONAS,
    SURVEY_QUESTIONS,
    TRUST_ARCHITECTURE,
    TUTORIAL_STEPS,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ML_SNAPSHOT_PATH = DATA_DIR / "ml_barriers_snapshot.json"

def ensure_schema() -> None:
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError:
        # Для docker-compose с PostgreSQL допускаем короткое окно,
        # когда БД уже объявлена, но еще не готова принимать соединения.
        pass


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_schema()
    yield


app = FastAPI(
    title="Sber Silver Flow API",
    version="1.0.0",
    lifespan=lifespan,
)

# Создаем таблицы сразу при импорте приложения для локальных тестов и скриптов.
ensure_schema()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    ensure_schema()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def load_ml_snapshot() -> dict:
    if ML_SNAPSHOT_PATH.exists():
        with ML_SNAPSHOT_PATH.open("r", encoding="utf-8") as file:
            return json.load(file)
    return ML_DEFAULT_SNAPSHOT


def aggregate_barriers(db: Session) -> list[dict]:
    top_barriers: dict[str, int] = {}
    for survey in db.scalars(select(SurveyResponse)).all():
        for barrier in survey.barriers:
            top_barriers[barrier] = top_barriers.get(barrier, 0) + 1
    return sorted(
        [{"name": name, "count": count} for name, count in top_barriers.items()],
        key=lambda item: item["count"],
        reverse=True,
    )[:5]


def build_survey_insight(payload: SurveyCreate) -> dict:
    readiness = 50
    readiness += payload.trust_level * 7
    readiness += payload.digital_confidence * 6
    readiness += len(payload.motivators) * 3
    readiness -= len(payload.barriers) * 5
    readiness = max(0, min(100, readiness))

    if payload.persona_hint == "Офлайн-консерватор" or payload.digital_confidence <= 2:
        persona_label = "Консервативный клиент с высокой потребностью в сопровождении"
        recommended_route = "Отделение + куратор + печатная памятка"
        communication_tone = "Максимально спокойно, без цифрового жаргона, с повторением шагов простыми словами."
    elif payload.persona_hint == "С поддержкой семьи":
        persona_label = "Клиент, принимающий решение вместе с родственниками"
        recommended_route = "Гибридный маршрут с участием родственника-помощника"
        communication_tone = "Подчеркивать безопасность, объяснять путь и для клиента, и для родственника."
    else:
        persona_label = "Новый пенсионер, готовый к упрощенному гибридному сценарию"
        recommended_route = "Цифровой старт + запись в отделение без повторного ввода данных"
        communication_tone = "Коротко, структурно и с акцентом на скорость и прозрачность статуса."

    if readiness >= 75:
        stress_level = "Низкий"
    elif readiness >= 50:
        stress_level = "Средний"
    else:
        stress_level = "Высокий"

    key_barriers = payload.barriers[:3] or ["Явные барьеры не указаны"]
    motivator_summary = payload.motivators[:3] or ["Нужно дополнительно выявить мотиваторы"]

    next_best_actions = [
        f"Назначить маршрут: {recommended_route}.",
        "Подтвердить клиенту, что статус перевода будет виден на каждом этапе.",
        "После первого зачисления дать антифрод-памятку и мини-обучение пользованию картой.",
    ]
    if "Остаться без помощи" in payload.barriers or "Столкнуться с мошенничеством" in payload.barriers:
        next_best_actions.insert(1, "Подключить живого куратора или контакт-центр, чтобы снизить тревожность.")
    if payload.assistance_needed:
        next_best_actions.append(f"Учесть выбранный формат помощи: {payload.assistance_needed}.")

    executive_summary = (
        f"По анкете это {persona_label.lower()}. "
        f"Основные барьеры: {', '.join(key_barriers)}. "
        f"Лучший маршрут для перевода пенсии: {recommended_route.lower()}. "
        f"Стресс клиента оценивается как {stress_level.lower()}."
    )

    return {
        "persona_label": persona_label,
        "stress_level": stress_level,
        "readiness_score": readiness,
        "key_barriers": key_barriers,
        "motivator_summary": motivator_summary,
        "recommended_route": recommended_route,
        "communication_tone": communication_tone,
        "next_best_actions": next_best_actions,
        "executive_summary": executive_summary,
    }


def normalize_benchmark_record(record: dict) -> dict:
    normalized = dict(record)
    breakdown = dict(normalized.get("score_breakdown") or {})

    for criterion in BENCHMARK_CRITERIA:
        key = criterion["key"]
        value = breakdown.get(key)
        if isinstance(value, (int, float)):
            breakdown[key] = int(value)
        else:
            breakdown[key] = int(normalized.get("total_score", 0))

    normalized["score_breakdown"] = breakdown
    normalized["strengths"] = list(normalized.get("strengths") or [])
    normalized["gaps"] = list(normalized.get("gaps") or [])
    normalized["summary"] = normalized.get("summary") or "Краткое описание отсутствует."
    normalized["page_type"] = normalized.get("page_type") or "страница для пенсионеров"
    return normalized


def get_benchmark_records(db: Session) -> list[dict]:
    stored = db.scalars(select(BenchmarkResult).order_by(BenchmarkResult.total_score.desc())).all()
    if stored:
        return [
            normalize_benchmark_record(
                {
                    "id": item.id,
                    "source_name": item.source_name,
                    "source_url": item.source_url,
                    "page_type": item.page_type,
                    "model_name": item.model_name,
                    "total_score": item.total_score,
                    "score_breakdown": item.score_breakdown,
                    "strengths": item.strengths,
                    "gaps": item.gaps,
                    "summary": item.summary,
                    "evidence_excerpt": item.evidence_excerpt,
                    "created_at": item.created_at.isoformat(),
                }
            )
            for item in stored
        ]
    return [normalize_benchmark_record(item) for item in BENCHMARK_DEMO_RESULTS]


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/meta")
def get_meta():
    return {
        "name": app.title,
        "version": app.version,
        "modules": [
            "research",
            "personas",
            "journey",
            "transfer",
            "tutorials",
            "benchmarks",
            "ml_barriers",
        ],
        "ml_snapshot_loaded": ML_SNAPSHOT_PATH.exists(),
    }


@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_surveys = db.scalar(select(func.count()).select_from(SurveyResponse)) or 0
    total_transfers = db.scalar(select(func.count()).select_from(TransferRequest)) or 0
    total_benchmarks = db.scalar(select(func.count()).select_from(BenchmarkResult)) or 0
    ranked_barriers = aggregate_barriers(db)

    return {
        "summary": [
            {
                "label": "Собрано интервью и анкет",
                "value": max(total_surveys, 24),
                "hint": "Демо показывает минимальный пул для первичной сегментации.",
            },
            {
                "label": "Омниканальных маршрутов",
                "value": 3,
                "hint": "Онлайн, с куратором, через отделение.",
            },
            {
                "label": "Запущено заявок в демо",
                "value": total_transfers,
                "hint": "Сохраняются в PostgreSQL через FastAPI.",
            },
            {
                "label": "Сохранено benchmark-оценок",
                "value": total_benchmarks,
                "hint": "Сценарий готов к загрузке результатов из Selenium + LLM.",
            },
        ],
        "top_barriers": ranked_barriers or [
            {"name": "Ошибиться в документах", "count": 14},
            {"name": "Остаться без помощи", "count": 12},
            {"name": "Не понять статус заявки", "count": 10},
        ],
        "ml_snapshot_loaded": ML_SNAPSHOT_PATH.exists(),
    }


@app.get("/api/research")
def get_research():
    return MARKET_RESEARCH


@app.get("/api/personas")
def get_personas():
    return PERSONAS


@app.get("/api/personas/{persona_id}")
def get_persona(persona_id: str):
    persona = next((item for item in PERSONAS if item["id"] == persona_id), None)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona


@app.get("/api/journey")
def get_journey():
    return JOURNEY_MAP


@app.get("/api/benchmarks")
def get_benchmarks():
    return BENCHMARKS


@app.get("/api/benchmarks/criteria")
def get_benchmark_criteria():
    return BENCHMARK_CRITERIA


@app.get("/api/benchmarks/overview")
def get_benchmark_overview(db: Session = Depends(get_db)):
    records = get_benchmark_records(db)
    leader = max(records, key=lambda item: item["total_score"])
    weakest = min(records, key=lambda item: item["total_score"])
    average_scores = {}
    for criterion in BENCHMARK_CRITERIA:
        key = criterion["key"]
        average_scores[key] = round(sum(item["score_breakdown"][key] for item in records) / len(records), 1)
    weakest_criterion = min(average_scores.items(), key=lambda item: item[1])[0]
    weakest_criterion_label = next(
        criterion["label"] for criterion in BENCHMARK_CRITERIA if criterion["key"] == weakest_criterion
    )
    return {
        "leader": {
            "name": leader["source_name"],
            "score": leader["total_score"],
            "summary": leader["summary"],
        },
        "laggard": {
            "name": weakest["source_name"],
            "score": weakest["total_score"],
            "summary": weakest["summary"],
        },
        "average_scores": average_scores,
        "main_gap": weakest_criterion_label,
        "records": records,
    }


@app.get("/api/benchmarks/results", response_model=list[BenchmarkResultOut])
def list_benchmark_results(db: Session = Depends(get_db)):
    return db.scalars(select(BenchmarkResult).order_by(BenchmarkResult.created_at.desc())).all()


@app.get("/api/benchmarks/results/{benchmark_id}", response_model=BenchmarkResultOut)
def get_benchmark_result(benchmark_id: int, db: Session = Depends(get_db)):
    benchmark = db.get(BenchmarkResult, benchmark_id)
    if not benchmark:
        raise HTTPException(status_code=404, detail="Benchmark result not found")
    return benchmark


@app.post("/api/benchmarks/results", response_model=BenchmarkResultOut)
def create_benchmark_result(payload: BenchmarkResultCreate, db: Session = Depends(get_db)):
    record = BenchmarkResult(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/channels")
def get_channels():
    return CHANNELS


@app.get("/api/tutorials")
def get_tutorials():
    return TUTORIAL_STEPS


@app.get("/api/trust-architecture")
def get_trust_architecture():
    return TRUST_ARCHITECTURE


@app.get("/api/survey-questions")
def get_survey_questions():
    return SURVEY_QUESTIONS


@app.get("/api/surveys", response_model=list[SurveyOut])
def list_surveys(db: Session = Depends(get_db)):
    return db.scalars(select(SurveyResponse).order_by(SurveyResponse.created_at.desc())).all()


@app.post("/api/surveys", response_model=SurveyOut)
def create_survey(payload: SurveyCreate, db: Session = Depends(get_db)):
    survey = SurveyResponse(**payload.model_dump())
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey


@app.post("/api/surveys/analyze", response_model=SurveyInsight)
def analyze_survey(payload: SurveyCreate):
    return build_survey_insight(payload)


@app.get("/api/surveys/{survey_id}/analysis", response_model=SurveyInsight)
def get_survey_analysis(survey_id: int, db: Session = Depends(get_db)):
    survey = db.get(SurveyResponse, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    payload = SurveyCreate.model_validate(survey, from_attributes=True)
    return build_survey_insight(payload)


@app.get("/api/insights/executive-summary")
def get_executive_summary(db: Session = Depends(get_db)):
    ml_snapshot = load_ml_snapshot()
    top_barriers = aggregate_barriers(db)
    top_factor = ml_snapshot["top_factors"][0] if ml_snapshot.get("top_factors") else None
    best_scenario = max(ml_snapshot.get("scenario_effects", []), key=lambda item: item["delta_pp"], default=None)
    latest_benchmark = db.scalars(select(BenchmarkResult).order_by(BenchmarkResult.created_at.desc())).first()
    return {
        "problem_statement": "При переводе пенсии для 60+ критична не ставка и не бонус, а снижение страха ошибки и чувство поддержки.",
        "survey_barriers": top_barriers or ML_DEFAULT_SNAPSHOT["top_factors"],
        "ml_primary_factor": top_factor,
        "best_ml_scenario": best_scenario,
        "latest_benchmark": {
            "source_name": latest_benchmark.source_name,
            "total_score": latest_benchmark.total_score,
            "summary": latest_benchmark.summary,
        } if latest_benchmark else None,
        "service_hypothesis": "Сервисная модель Сбера должна объединять кураторство, обучение, офлайн-опору и нефинансовый социальный хаб.",
    }


@app.get("/api/ml/barriers", response_model=MlBarrierSnapshot)
def get_ml_barriers():
    return load_ml_snapshot()


@app.post("/api/ml/barriers/import", response_model=MlBarrierSnapshot)
def import_ml_barriers(payload: MlBarrierSnapshot):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with ML_SNAPSHOT_PATH.open("w", encoding="utf-8") as file:
        json.dump(payload.model_dump(), file, ensure_ascii=False, indent=2)
    return payload


@app.get("/api/transfer/process")
def get_transfer_process():
    return {
        "steps": [
            {
                "title": "1. Предзаявка",
                "description": "Клиент отвечает на 6 простых вопросов. На основе ответов подбирается лучший канал.",
            },
            {
                "title": "2. Подтверждение маршрута",
                "description": "Онлайн, звонок куратора или визит по записи в отделение без ожидания в общей очереди.",
            },
            {
                "title": "3. Передача заявления",
                "description": "Данные переиспользуются во всех каналах, чтобы человек не повторял историю заново.",
            },
            {
                "title": "4. Сопровождение до первого зачисления",
                "description": "СМС, звонок и бумажная памятка с датой зачисления и следующими шагами.",
            },
        ]
    }


@app.post("/api/transfer/intents", response_model=TransferOut)
def create_transfer_intent(payload: TransferCreate, db: Session = Depends(get_db)):
    statuses = [
        {"name": "Анкета получена", "status": "done"},
        {"name": "Маршрут подобран", "status": "done"},
        {
            "name": "Подтверждение сотрудником",
            "status": "pending" if payload.preferred_channel != "Онлайн" else "done",
        },
        {"name": "Перевод пенсии", "status": "waiting"},
        {"name": "Первое зачисление и обучение", "status": "waiting"},
    ]

    transfer = TransferRequest(step_statuses=statuses, **payload.model_dump())
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer


@app.get("/api/transfers", response_model=list[TransferOut])
def list_transfer_intents(db: Session = Depends(get_db)):
    return db.scalars(select(TransferRequest).order_by(TransferRequest.created_at.desc())).all()


@app.get("/api/transfers/{transfer_id}", response_model=TransferOut)
def get_transfer_intent(transfer_id: int, db: Session = Depends(get_db)):
    transfer = db.get(TransferRequest, transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    return transfer


@app.patch("/api/transfers/{transfer_id}/status", response_model=TransferOut)
def update_transfer_status(transfer_id: int, payload: TransferStatusUpdate, db: Session = Depends(get_db)):
    transfer = db.get(TransferRequest, transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    statuses = []
    step_found = False
    for step in transfer.step_statuses:
        current = dict(step)
        if current["name"] == payload.step_name:
            current["status"] = payload.status
            step_found = True
        statuses.append(current)

    if not step_found:
        raise HTTPException(status_code=404, detail="Step not found")

    transfer.step_statuses = statuses
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer

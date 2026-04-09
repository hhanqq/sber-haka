# Backend Documentation

## Назначение

Backend реализован на `FastAPI` и закрывает четыре слоя:

1. сбор и хранение опросов будущих пенсионеров;
2. омниканальный процесс перевода пенсии;
3. хранение и выдача benchmark-результатов;
4. выдача ML-инсайтов по барьерам и сценариям вовлечения.

Основной файл API: `/Users/hanq/PycharmProjects/sber1/backend/app/main.py`

## Архитектура

- `backend/app/db.py`: конфигурация PostgreSQL и SQLAlchemy
- `backend/app/models.py`: таблицы `survey_responses`, `transfer_requests`, `benchmark_results`
- `backend/app/schemas.py`: Pydantic-схемы для запросов и ответов
- `backend/app/static_data.py`: исследовательские данные, персоны, CJM, критерии benchmark, дефолтный ML snapshot
- `backend/app/main.py`: роуты API и агрегации

Хранилище по умолчанию:

- Основная БД в Docker: PostgreSQL `sber_case`
- ML snapshot: `backend/data/ml_barriers_snapshot.json`

## Что уже сделано

- Реализовано создание и чтение анкет будущих пенсионеров.
- Реализован читаемый анализ анкеты с маршрутом обслуживания и действиями банка.
- Реализовано создание заявок на перевод пенсии с дорожной картой шагов.
- Добавлены ручки чтения персон, CJM, каналов, туториалов, архитектуры доверия.
- Добавлены ручки для хранения benchmark-оценок.
- Добавлена summary-ручка benchmark для фронтенда.
- Добавлены ручки для выдачи ML-барьеров и импорта snapshot-файла.
- Добавлена агрегирующая ручка для executive summary.

## Что пока не сделано

- Нет авторизации и ролей.
- Нет миграций Alembic.
- Нет фоновых задач и очередей для долгих benchmark-запусков.
- Нет валидации на дубликаты benchmark-страниц.
- Нет продакшн-логирования, rate-limit и аудита изменений.
- Нет полноценной CMS для редактирования персон, CJM и контента.

## Таблицы

### `survey_responses`

Хранит результаты опросов.

Поля:

- `id`
- `age_group`
- `persona_hint`
- `current_bank`
- `trust_level`
- `digital_confidence`
- `assistance_needed`
- `barriers` JSON
- `motivators` JSON
- `channel_preference`
- `notes`
- `created_at`

### `transfer_requests`

Хранит намерения/заявки на перевод пенсии.

Поля:

- `id`
- `full_name`
- `phone`
- `preferred_channel`
- `assistance_format`
- `has_gosuslugi`
- `mobility_level`
- `appointment_slot`
- `step_statuses` JSON
- `created_at`

### `benchmark_results`

Хранит результаты Selenium + LLM benchmark.

Поля:

- `id`
- `source_name`
- `source_url`
- `page_type`
- `model_name`
- `total_score`
- `score_breakdown` JSON
- `strengths` JSON
- `gaps` JSON
- `summary`
- `evidence_excerpt`
- `created_at`

## Ручки API

### Системные

- `GET /api/health`
  Назначение: healthcheck.

- `GET /api/meta`
  Назначение: краткая мета-информация по API и статус загрузки ML snapshot.

### Дашборд и исследование

- `GET /api/dashboard`
  Назначение: summary-метрики и топ барьеров по реальным анкетам.

- `GET /api/research`
  Назначение: целевая постановка исследования и гипотезы.

- `GET /api/personas`
  Назначение: список персон 60+.

- `GET /api/personas/{persona_id}`
  Назначение: одна персона по id.

- `GET /api/journey`
  Назначение: карта клиентского пути.

- `GET /api/channels`
  Назначение: цифровой, голосовой и офлайн-канал.

- `GET /api/tutorials`
  Назначение: обучающие подсказки после первого зачисления.

- `GET /api/trust-architecture`
  Назначение: pillars доверия и прогноз эффекта.

- `GET /api/survey-questions`
  Назначение: список вопросов для клиентского опроса.

- `GET /api/insights/executive-summary`
  Назначение: одна агрегированная сводка для презентации или аналитической панели.

### Опросы

- `GET /api/surveys`
  Назначение: список анкет.

- `POST /api/surveys`
  Назначение: сохранить анкету.

- `POST /api/surveys/analyze`
  Назначение: по ответам анкеты вернуть понятную интерпретацию: профиль клиента, стресс, маршрут и действия банка.

- `GET /api/surveys/{survey_id}/analysis`
  Назначение: получить интерпретацию уже сохраненной анкеты.

Пример:

```json
{
  "age_group": "55-64",
  "persona_hint": "Молодой пенсионер",
  "current_bank": "Сбер",
  "trust_level": 4,
  "digital_confidence": 3,
  "assistance_needed": "Куратор",
  "barriers": ["Ошибиться в документах"],
  "motivators": ["Личное сопровождение"],
  "channel_preference": "Гибридный маршрут",
  "notes": "Интервью в офисе"
}
```

### Перевод пенсии

- `GET /api/transfer/process`
  Назначение: эталонный омниканальный путь.

- `POST /api/transfer/intents`
  Назначение: создать демо-заявку.

- `GET /api/transfers`
  Назначение: список заявок.

- `GET /api/transfers/{transfer_id}`
  Назначение: одна заявка.

- `PATCH /api/transfers/{transfer_id}/status`
  Назначение: обновить статус отдельного шага.

Пример:

```json
{
  "step_name": "Перевод пенсии",
  "status": "done"
}
```

### Benchmark

- `GET /api/benchmarks`
  Назначение: статичный baseline из кейса.

- `GET /api/benchmarks/criteria`
  Назначение: критерии, по которым оцениваются сайты.

- `GET /api/benchmarks/results`
  Назначение: список сохраненных benchmark-результатов.

- `GET /api/benchmarks/overview`
  Назначение: агрегированный benchmark-блок для сайта с лидером, average score и карточками банков.

- `GET /api/benchmarks/results/{benchmark_id}`
  Назначение: один benchmark-result.

- `POST /api/benchmarks/results`
  Назначение: сохранить один результат из внешнего скрипта.

Пример:

```json
{
  "source_name": "Сбер",
  "source_url": "https://example.com",
  "page_type": "страница для пенсионеров",
  "model_name": "gpt-4o-mini",
  "total_score": 78,
  "score_breakdown": {
    "clarity": 80,
    "trust": 82,
    "omnichannel": 75,
    "family_support": 54,
    "education": 70,
    "non_financial_value": 60
  },
  "strengths": ["Понятная структура", "Есть офлайн-опора", "Хорошо видны пенсионные условия"],
  "gaps": ["Слабая поддержка родственника", "Мало нефинансовых сервисов", "Нет блока обучения"],
  "summary": "Страница хорошо объясняет базовый продукт, но слабо раскрывает адаптацию 60+.",
  "evidence_excerpt": "..."
}
```

### ML барьеры

- `GET /api/ml/barriers`
  Назначение: вернуть актуальный snapshot по ML-барьерам.

- `POST /api/ml/barriers/import`
  Назначение: импортировать snapshot JSON во внутреннее хранилище.

## Рекомендуемые следующие ручки

Если захотим довести backend до более сильного конкурсного состояния, я бы добавил:

- `POST /api/benchmarks/run`
  Только ставит задачу в очередь, не запускает benchmark в HTTP-потоке.

- `GET /api/benchmarks/run/{job_id}`
  Возвращает статус долгой задачи.

- `GET /api/recommendations`
  Возвращает рекомендации по сегменту клиента и его барьерам.

- `POST /api/client-route/recommend`
  Принимает анкету и рекомендует маршрут: онлайн, гибрид, офлайн.

- `GET /api/analytics/funnel`
  Воронка по шагам перевода пенсии.

- `GET /api/analytics/cohorts`
  Аналитика по поколениям `new` / `old` и по типам барьеров.

## Почему ML лучше не запускать на каждый запрос

Сам notebook для inference не нужен в онлайне. Дешевле и стабильнее схема:

1. офлайн-скрипт считает snapshot;
2. backend просто читает готовый JSON;
3. фронт показывает snapshot мгновенно.

Это почти не нагружает систему и не требует держать `pandas/sklearn` внутри каждого запроса.

# Sber Silver Flow

Демо-решение под кейс "Привлечение пенсионных начислений: анализ поколенческих барьеров".

Стек:

- `backend`: FastAPI + SQLAlchemy + PostgreSQL
- `frontend`: React SPA
- `deploy`: Docker Compose

Что внутри:

- исследовательский слой: барьеры, мотиваторы, 3 персоны, CJM, архитектура доверия, бенчмаркинг;
- API для сбора опросов будущих пенсионеров;
- API для омниканального процесса перевода пенсии;
- API для benchmark-результатов, анализа анкет и ML snapshot;
- UI в стилистике Сбера с крупными шагами, обучающими подсказками и моделью социального хаба;
- запуск в Docker одной командой.

## Запуск

```bash
docker compose up --build
```

После запуска:

- фронтенд: [http://localhost:3000](http://localhost:3000)
- backend API: [http://localhost:8000/docs](http://localhost:8000/docs)
- PostgreSQL: `localhost:5432`

## Основные API

- `GET /api/dashboard`
- `GET /api/research`
- `GET /api/personas`
- `GET /api/journey`
- `GET /api/benchmarks`
- `GET /api/benchmarks/criteria`
- `GET /api/benchmarks/results`
- `POST /api/benchmarks/results`
- `GET /api/channels`
- `GET /api/tutorials`
- `GET /api/trust-architecture`
- `GET /api/survey-questions`
- `GET /api/insights/executive-summary`
- `GET /api/ml/barriers`
- `POST /api/ml/barriers/import`
- `POST /api/surveys/analyze`
- `POST /api/surveys`
- `GET /api/surveys/{id}/analysis`
- `GET /api/transfer/process`
- `POST /api/transfer/intents`
- `GET /api/transfers`
- `GET /api/transfers/{id}`
- `PATCH /api/transfers/{id}/status`

## Документация

- backend: `/Users/hanq/PycharmProjects/sber1/docs/BACKEND.md`
- frontend: `/Users/hanq/PycharmProjects/sber1/docs/FRONTEND.md`
- benchmark + ml: `/Users/hanq/PycharmProjects/sber1/docs/BENCHMARK_AND_ML.md`

## Скрипты

- Selenium + LLM benchmark: `/Users/hanq/PycharmProjects/sber1/scripts/benchmark_banks.py`
- Экспорт ML snapshot из логики ноутбука: `/Users/hanq/PycharmProjects/sber1/scripts/export_ml_snapshot.py`
- Переменные окружения: `/Users/hanq/PycharmProjects/sber1/.env.example`

## Что решает демо

1. Показывает, почему для 60+ важнее доверие и сопровождение, чем денежная выгода.
2. Демонстрирует гибридный маршрут: цифровой старт, контакт-центр, отделение.
3. Встраивает нефинансовую модель вовлечения: здоровье, досуг, обучение, помощь по госуслугам.
4. Сохраняет анкеты и заявки, чтобы решение можно было расширить до аналитического контура.

## Источники для исследовательской части

Ниже перечислены официальные и близкие к первоисточнику ориентиры, на которых основана логика бенчмаркинга и омниканального сценария:

- Социальный фонд России: материалы о выборе способа доставки пенсии и возможности смены банка.
- Госуслуги: сценарии управления государственными услугами и подтвержденные цифровые маршруты.
- Сайты крупных банков и пенсионных продуктов: Сбер, ВТБ, Почта Банк.
- `mos.ru`: программа "Московское долголетие" как эталон нефинансовой вовлеченности аудитории старшего возраста.

В демо эти данные преобразованы в продуктовые гипотезы и сервисную модель, а не в буквальный пересказ конкретных банковских офферов.

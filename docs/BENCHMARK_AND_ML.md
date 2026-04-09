# Benchmark + ML

## Selenium benchmark

Скрипт:

- `/Users/hanq/PycharmProjects/sber1/scripts/benchmark_banks.py`

Где используется `ProxyAPI`:

- только в этом скрипте;
- не в рендерах сайта;
- не в FastAPI-ручках во время обычной работы пользователя.

Что делает:

1. открывает страницы банков через Selenium;
2. вытаскивает видимый текст страницы;
3. отправляет текст в ProxyAPI;
4. просит модель вернуть JSON с оценками и описанием;
5. сохраняет результаты в файл;
6. при необходимости отправляет результаты в backend.

## Почему ключ не вшит в код

Ключ ProxyAPI нельзя хранить в репозитории. Поэтому используется только `PROXYAPI_KEY` через переменные окружения.

Пример:

```bash
cp .env.example .env
export PROXYAPI_KEY="..."
python3 -m pip install -r scripts/requirements.txt
python3 scripts/benchmark_banks.py --backend-url http://localhost:8000
```

## Модель

По твоему запросу по умолчанию используется `gpt-4o-mini`.

Важно:

- по документации ProxyAPI модель `gpt-4o-mini` все еще доступна, но находится в legacy-секции;
- если захочешь более стабильный вариант на будущее, лучше переключиться на `gpt-4.1-mini`.

Источник:

- [ProxyAPI: модели OpenAI](https://proxyapi.ru/docs/openai-models)

## ML snapshot

Скрипт:

- `/Users/hanq/PycharmProjects/sber1/scripts/export_ml_snapshot.py`

Где используется ML-скрипт:

- только для офлайн-расчета snapshot;
- результат сохраняется в `backend/data/ml_barriers_snapshot.json`;
- сайт и backend потом просто читают готовые данные через `GET /api/ml/barriers`.

Что делает:

1. воспроизводит логику из `SBER.ipynb`;
2. строит сегменты;
3. считает важности факторов;
4. оценивает сценарный эффект;
5. сохраняет summary в JSON.

Пример:

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/export_ml_snapshot.py --output backend/data/ml_barriers_snapshot.json
```

После этого backend начинает отдавать snapshot через:

- `GET /api/ml/barriers`

## Стоимость и нагрузка

### Benchmark через LLM

Самая дорогая часть здесь не Selenium, а LLM-анализ страниц.

Стоимость зависит от:

- количества страниц;
- длины текста страницы;
- числа повторных прогонов.

Если гонять 5-7 банков по 1 странице раз в день, это обычно умеренная нагрузка.

### ML барьеры

Интеграция ML из ноутбука не должна быть дорогой, если:

- считать snapshot офлайн;
- не запускать `pandas/sklearn` на каждый API-запрос;
- обновлять JSON раз в день или по кнопке аналитика.

## Практичная архитектура

Лучший компромисс по цене и простоте:

1. Selenium + LLM запускается как batch-скрипт.
2. ML notebook тоже запускается как batch-скрипт.
3. Backend хранит результаты и отдает их фронту.
4. HTTP-ручки только читают готовые данные.

Это дешевле, быстрее и надежнее, чем real-time анализ в каждом запросе.

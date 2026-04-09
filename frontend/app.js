import React, { useEffect, useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(React.createElement);
const API_URL = "http://localhost:8000";

const surveyDefaults = {
  age_group: "55-64",
  persona_hint: "Молодой пенсионер",
  current_bank: "Сбер",
  trust_level: 4,
  digital_confidence: 3,
  assistance_needed: "Куратор в отделении",
  barriers: ["Ошибиться в документах"],
  motivators: ["Личное сопровождение"],
  channel_preference: "Гибридный маршрут",
  notes: "",
};

const transferDefaults = {
  full_name: "Наталья Иванова",
  phone: "+7 (999) 123-45-67",
  preferred_channel: "Гибридный маршрут",
  assistance_format: "С куратором",
  has_gosuslugi: "Да",
  mobility_level: "Могу прийти в отделение по записи",
  appointment_slot: "Завтра, 11:00-12:00",
};

const STATUS_LABELS = {
  done: "Готово",
  pending: "Требует подтверждения",
  waiting: "Ожидает следующий шаг",
  blocked: "Нужна помощь",
};

const STATUS_CLASSES = {
  done: "status-pill status-pill--done",
  pending: "status-pill status-pill--pending",
  waiting: "status-pill status-pill--waiting",
  blocked: "status-pill status-pill--blocked",
};

function Section({ eyebrow, title, description, children, id }) {
  return html`
    <section className="section" id=${id}>
      <div className="section__heading">
        ${eyebrow ? html`<span className="eyebrow">${eyebrow}</span>` : null}
        <h2>${title}</h2>
        ${description ? html`<p>${description}</p>` : null}
      </div>
      ${children}
    </section>
  `;
}

function App() {
  const [content, setContent] = useState({
    dashboard: null,
    research: null,
    personas: [],
    journey: [],
    benchmarks: [],
    benchmarkOverview: null,
    mlBarriers: null,
    channels: [],
    tutorials: [],
    trust: null,
    surveyQuestions: [],
    transfer: null,
  });
  const [surveyForm, setSurveyForm] = useState(surveyDefaults);
  const [transferForm, setTransferForm] = useState(transferDefaults);
  const [surveyResult, setSurveyResult] = useState(null);
  const [surveyInsight, setSurveyInsight] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [tutorialIndex, setTutorialIndex] = useState(0);

  useEffect(() => {
    const endpoints = [
      ["dashboard", "/api/dashboard"],
      ["research", "/api/research"],
      ["personas", "/api/personas"],
      ["journey", "/api/journey"],
      ["benchmarks", "/api/benchmarks"],
      ["benchmarkOverview", "/api/benchmarks/overview"],
      ["mlBarriers", "/api/ml/barriers"],
      ["channels", "/api/channels"],
      ["tutorials", "/api/tutorials"],
      ["trust", "/api/trust-architecture"],
      ["surveyQuestions", "/api/survey-questions"],
      ["transfer", "/api/transfer/process"],
    ];

    Promise.all(
      endpoints.map(([key, path]) =>
        fetch(`${API_URL}${path}`).then((response) =>
          response.json().then((data) => [key, data]),
        ),
      ),
    ).then((entries) => setContent(Object.fromEntries(entries)));
  }, []);

  const currentTutorial = useMemo(
    () => content.tutorials[tutorialIndex] || null,
    [content.tutorials, tutorialIndex],
  );
  const criteriaLabelMap = useMemo(
    () =>
      Object.fromEntries(
        [
          ["clarity", "Понятность"],
          ["trust", "Доверие"],
          ["omnichannel", "Омниканальность"],
          ["family_support", "Поддержка семьи"],
          ["education", "Обучение"],
          ["non_financial_value", "Нефинансовая ценность"],
        ],
      ),
    [],
  );

  const submitSurvey = async (event) => {
    event.preventDefault();
    const [saveResponse, analysisResponse] = await Promise.all([
      fetch(`${API_URL}/api/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyForm),
      }),
      fetch(`${API_URL}/api/surveys/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyForm),
      }),
    ]);
    setSurveyResult(await saveResponse.json());
    setSurveyInsight(await analysisResponse.json());
    const dashboardResponse = await fetch(`${API_URL}/api/dashboard`);
    const dashboard = await dashboardResponse.json();
    setContent((current) => ({ ...current, dashboard }));
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/api/transfer/intents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transferForm),
    });
    setTransferResult(await response.json());
  };

  const toggleOption = (field, value) => {
    setSurveyForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  return html`
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <span className="eyebrow">Сбер. Пенсионный поток доверия</span>
          <h1>Омниканальная модель перевода пенсии 60+ с упором на доверие, поддержку и социальную ценность.</h1>
          <p>
            Демо объединяет исследование барьеров, профили персон, карту клиентского пути, сценарий бесшовного
            перевода и концепцию социального хаба в стиле Сбера.
          </p>
          <div className="hero__actions">
            <a href="#transfer-flow" className="button button--primary">Запустить перевод</a>
            <a href="#research" className="button button--ghost">Смотреть исследование</a>
          </div>
        </div>
        <div className="hero__panel">
          ${(content.dashboard?.summary || []).map(
            (item) => html`
              <article key=${item.label} className="metric">
                <strong>${item.value}</strong>
                <span>${item.label}</span>
                <p>${item.hint}</p>
              </article>
            `,
          )}
        </div>
      </header>

      <main className="content">
        <${Section}
          eyebrow="Исследование"
          title="Что мешает переводу пенсии и почему деньги сами по себе не решают задачу"
          description=${content.research?.study_goal}
          id="research"
        >
          <div className="grid grid--two">
            <div className="card card--soft">
              <h3>Целевые сегменты</h3>
              <ul className="list">
                ${(content.research?.target_segments || []).map((item) => html`<li key=${item}>${item}</li>`)}
              </ul>
            </div>
            <div className="card card--soft">
              <h3>Кластеры барьеров</h3>
              <div className="stack">
                ${(content.research?.barrier_clusters || []).map(
                  (item) => html`
                    <article key=${item.title} className="mini-card">
                      <strong>${item.title}</strong>
                      <p>${item.details}</p>
                    </article>
                  `,
                )}
              </div>
            </div>
          </div>
          <div className="card card--highlight">
            <h3>Ключевая гипотеза</h3>
            <div className="pill-row">
              ${(content.research?.motivator_hypotheses || []).map(
                (item) => html`<span key=${item} className="pill">${item}</span>`,
              )}
            </div>
          </div>
        </${Section}>

        <${Section}
          eyebrow="Персоны"
          title="Три профиля пенсионеров с разными поколенческими барьерами"
          description="Фокус не на продукте, а на психологии перехода и способе сопровождения."
        >
          <div className="grid grid--three">
            ${content.personas.map(
              (persona) => html`
                <article key=${persona.id} className="card persona-card">
                  <span className="tag">${persona.segment}</span>
                  <h3>${persona.name}</h3>
                  <p>${persona.bio}</p>
                  <strong>Цели</strong>
                  <ul className="list">
                    ${persona.goals.map((item) => html`<li key=${item}>${item}</li>`)}
                  </ul>
                  <strong>Барьеры</strong>
                  <ul className="list">
                    ${persona.barriers.map((item) => html`<li key=${item}>${item}</li>`)}
                  </ul>
                </article>
              `,
            )}
          </div>
        </${Section}>

        <${Section}
          eyebrow="CJM"
          title="Карта пути от тревоги до регулярного использования карты"
          description="CJM показывает, где банк должен снижать стресс не интерфейсом, а моделью сервиса."
        >
          <div className="timeline">
            ${content.journey.map(
              (step, index) => html`
                <article key=${step.stage} className="timeline__item">
                  <div className="timeline__index">${index + 1}</div>
                  <div className="card">
                    <h3>${step.stage}</h3>
                    <p><strong>Эмоция:</strong> ${step.emotion}</p>
                    <p><strong>Боль:</strong> ${step.pain_point}</p>
                    <p><strong>Ответ Сбера:</strong> ${step.sber_response}</p>
                  </div>
                </article>
              `,
            )}
          </div>
        </${Section}>

        <${Section}
          eyebrow="Бесшовный перевод"
          title="Простой сценарий перевода пенсии с поддержкой человека на каждом шаге"
          description="Большие блоки, минимум терминов и переключение между каналами без потери контекста."
          id="transfer-flow"
        >
          <div className="grid grid--two">
            <form className="card form-card" onSubmit=${submitTransfer}>
              <h3>Демо маршрутизации клиента</h3>
              <label>ФИО<input value=${transferForm.full_name} onInput=${(e) => setTransferForm({ ...transferForm, full_name: e.target.value })} /></label>
              <label>Телефон<input value=${transferForm.phone} onInput=${(e) => setTransferForm({ ...transferForm, phone: e.target.value })} /></label>
              <label>Предпочтительный канал
                <select value=${transferForm.preferred_channel} onChange=${(e) => setTransferForm({ ...transferForm, preferred_channel: e.target.value })}>
                  <option>Онлайн</option>
                  <option>Гибридный маршрут</option>
                  <option>Отделение</option>
                </select>
              </label>
              <label>Формат помощи
                <select value=${transferForm.assistance_format} onChange=${(e) => setTransferForm({ ...transferForm, assistance_format: e.target.value })}>
                  <option>С куратором</option>
                  <option>С родственником-помощником</option>
                  <option>Самостоятельно</option>
                </select>
              </label>
              <label>Есть Госуслуги
                <select value=${transferForm.has_gosuslugi} onChange=${(e) => setTransferForm({ ...transferForm, has_gosuslugi: e.target.value })}>
                  <option>Да</option>
                  <option>Нет</option>
                </select>
              </label>
              <label>Мобильность
                <select value=${transferForm.mobility_level} onChange=${(e) => setTransferForm({ ...transferForm, mobility_level: e.target.value })}>
                  <option>Могу прийти в отделение по записи</option>
                  <option>Нужен звонок и сопровождение</option>
                  <option>Лучше только дистанционно</option>
                </select>
              </label>
              <label>Слот<input value=${transferForm.appointment_slot} onInput=${(e) => setTransferForm({ ...transferForm, appointment_slot: e.target.value })} /></label>
              <button className="button button--primary" type="submit">Сохранить маршрут</button>
            </form>
            <div className="stack">
              <div className="card card--soft">
                <h3>Этапы процесса</h3>
                <div className="stack">
                  ${(content.transfer?.steps || []).map(
                    (step) => html`
                      <article key=${step.title} className="mini-card">
                        <strong>${step.title}</strong>
                        <p>${step.description}</p>
                      </article>
                    `,
                  )}
                </div>
              </div>
              <div className="card card--status">
                <h3>Статус заявки клиента</h3>
                ${transferResult
                  ? html`
                      <div className="stack">
                        <p><strong>${transferResult.full_name}</strong></p>
                        <p>Маршрут обслуживания: ${transferResult.preferred_channel}</p>
                        ${transferResult.step_statuses.map(
                          (step) => html`
                            <div key=${step.name} className="status-row status-row--emphasis">
                              <span>${step.name}</span>
                              <span className=${STATUS_CLASSES[step.status] || "status-pill"}>${STATUS_LABELS[step.status] || step.status}</span>
                            </div>
                          `,
                        )}
                      </div>
                    `
                  : html`<p>После отправки формы появится дорожная карта обслуживания клиента.</p>`}
              </div>
            </div>
          </div>
        </${Section}>

        <${Section}
          eyebrow="Обучение"
          title="Интерактивные подсказки, которые снижают тревогу и учат пользоваться картой"
          description="Демо показывает мягкий сценарий сопровождения, а не сложный цифровой режим."
        >
          <div className="grid grid--two">
            <div className="card tutorial-card">
              <div>
                <h3>${currentTutorial?.title}</h3>
                <p>${currentTutorial?.description}</p>
              </div>
              <div className="hero__actions">
                <button className="button button--ghost" onClick=${() => setTutorialIndex((value) => (value === 0 ? content.tutorials.length - 1 : value - 1))}>Назад</button>
                <button className="button button--primary" onClick=${() => setTutorialIndex((value) => (value + 1) % content.tutorials.length)}>Далее</button>
              </div>
            </div>
            <div className="card card--soft">
              <h3>Что должно быть после первого зачисления</h3>
              <ul className="list">
                <li>Звонок или сообщение от куратора без банковского жаргона.</li>
                <li>Антифрод-памятка простыми примерами.</li>
                <li>Пошаговая помощь: баланс, оплата, снятие наличных, лимиты.</li>
                <li>Приглашение в клубные и образовательные активности как повод вернуться.</li>
              </ul>
            </div>
          </div>
        </${Section}>

        <${Section}
          eyebrow="Социальный хаб"
          title="Нефинансовая сервисная модель, которая делает Сбер точкой опоры"
          description="Главный фокус: здоровье, досуг, образование и помощь в повседневных задачах."
        >
          <div className="grid grid--three">
            ${(content.trust?.pillars || []).map(
              (pillar) => html`
                <article key=${pillar.title} className="card">
                  <h3>${pillar.title}</h3>
                  <ul className="list">
                    ${pillar.items.map((item) => html`<li key=${item}>${item}</li>`)}
                  </ul>
                </article>
              `,
            )}
          </div>
          <div className="card card--highlight">
            <h3>Прогноз эффекта</h3>
            <ul className="list">
              ${(content.trust?.effect_forecast || []).map((item) => html`<li key=${item}>${item}</li>`)}
            </ul>
          </div>
        </${Section}>

        <${Section}
          eyebrow="Benchmark"
          title="Сравнение банков по реальным критериям 60+: понятность, доверие, поддержка и нефинансовая ценность"
          description="Benchmark встроен в сайт как отдельный блок с общим score и разбором сильных/слабых сторон."
        >
          <div className="grid grid--two">
            <article className="card card--highlight">
              <h3>Лидер benchmark</h3>
              <p><strong>${content.benchmarkOverview?.leader?.name || "Сбер"}</strong> — ${content.benchmarkOverview?.leader?.score || "-"} баллов</p>
              <p>${content.benchmarkOverview?.leader?.summary || "Лучше всего работает связка доверия, офлайна и сервисной модели."}</p>
              <p><strong>Главный провал рынка:</strong> ${content.benchmarkOverview?.main_gap || "Поддержка родственников"}</p>
            </article>
            <article className="card card--soft">
              <h3>Средние оценки по критериям</h3>
              ${Object.entries(content.benchmarkOverview?.average_scores || {}).map(
                ([key, value]) => html`
                  <div key=${key} className="status-row">
                    <span>${criteriaLabelMap[key] || key}</span>
                    <strong>${value}/100</strong>
                  </div>
                `,
              )}
            </article>
          </div>
          <div className="grid grid--three">
            ${(content.benchmarkOverview?.records || []).map(
              (item) => html`
                <article key=${item.source_name} className="card">
                  <h3>${item.source_name}</h3>
                  <p><strong>Общий score:</strong> ${item.total_score}/100</p>
                  <p>${item.summary}</p>
                  <strong>Сильные стороны</strong>
                  <ul className="list">
                    ${item.strengths.map((point) => html`<li key=${point}>${point}</li>`)}
                  </ul>
                  <strong>Слабые стороны</strong>
                  <ul className="list">
                    ${item.gaps.map((point) => html`<li key=${point}>${point}</li>`)}
                  </ul>
                </article>
              `,
            )}
          </div>
          <div className="grid grid--two">
            ${content.benchmarks.map(
              (item) => html`
                <article key=${item.name} className="card">
                  <span className="tag">${item.category}</span>
                  <h3>${item.name}</h3>
                  <p><strong>Практика:</strong> ${item.practice}</p>
                  <p><strong>Вывод:</strong> ${item.takeaway}</p>
                </article>
              `,
            )}
          </div>
        </${Section}>

        <${Section}
          eyebrow="ML-анализ"
          title="Какие сегменты пенсионеров видит модель и что реально повышает готовность к переходу"
          description="Этот блок построен по логике твоего ML-ноутбука: сегментация, ключевые факторы и сценарный эффект сервисов."
        >
          <div className="grid grid--two">
            <article className="card card--highlight">
              <h3>Главный вывод модели</h3>
              <p>
                <strong>${content.mlBarriers?.top_factors?.[0]?.feature || "fear_digital"}</strong>
                ${" "}сильнее всего влияет на решение о переводе пенсии.
              </p>
              <p>${content.mlBarriers?.top_factors?.[0]?.insight || "Снижение тревожности и понятный маршрут дают максимальный эффект."}</p>
              <p>
                <strong>Размер выборки:</strong> ${content.mlBarriers?.sample_size || "-"}
              </p>
            </article>
            <article className="card card--soft">
              <h3>Эффект сервисных сценариев</h3>
              ${((content.mlBarriers?.scenario_effects) || []).map(
                (item) => html`
                  <div key=${item.name} className="status-row">
                    <span>${item.name}</span>
                    <strong>+${item.delta_pp} п.п.</strong>
                  </div>
                `,
              )}
            </article>
          </div>

          <div className="grid grid--three">
            ${((content.mlBarriers?.segments) || []).map(
              (segment) => html`
                <article key=${segment.name} className="card">
                  <h3>${segment.name}</h3>
                  <p><strong>Доля сегмента:</strong> ${segment.share_percent}%</p>
                  <ul className="list">
                    ${(segment.barriers || []).map((item) => html`<li key=${item}>${item}</li>`)}
                  </ul>
                </article>
              `,
            )}
          </div>

          <div className="grid grid--two">
            <article className="card">
              <h3>Топ факторов</h3>
              ${((content.mlBarriers?.top_factors) || []).map(
                (item) => html`
                  <div key=${item.feature} className="status-row">
                    <span>${item.feature}</span>
                    <strong>${Math.round((item.importance || 0) * 100)}%</strong>
                  </div>
                `,
              )}
            </article>
            <article className="card">
              <h3>Что делать Сберу</h3>
              <ul className="list">
                ${((content.mlBarriers?.recommendations) || []).map((item) => html`<li key=${item}>${item}</li>`)}
              </ul>
            </article>
          </div>
        </${Section}>

        <${Section}
          eyebrow="Опрос"
          title="Анкета будущего пенсионера с понятным выводом по маршруту обслуживания"
          description="После отправки система не просто сохраняет анкету, а интерпретирует ее и выдает человекочитаемый результат."
        >
          <div className="grid grid--two">
            <form className="card form-card" onSubmit=${submitSurvey}>
              <h3>Анкета будущего пенсионера</h3>
              <label>Возрастная группа
                <select value=${surveyForm.age_group} onChange=${(e) => setSurveyForm({ ...surveyForm, age_group: e.target.value })}>
                  <option>55-64</option>
                  <option>65-74</option>
                  <option>75+</option>
                </select>
              </label>
              <label>Тип респондента
                <select value=${surveyForm.persona_hint} onChange=${(e) => setSurveyForm({ ...surveyForm, persona_hint: e.target.value })}>
                  <option>Молодой пенсионер</option>
                  <option>С поддержкой семьи</option>
                  <option>Офлайн-консерватор</option>
                </select>
              </label>
              <label>Текущий банк<input value=${surveyForm.current_bank} onInput=${(e) => setSurveyForm({ ...surveyForm, current_bank: e.target.value })} /></label>
              <label>Доверие к банкам: ${surveyForm.trust_level}/5
                <input type="range" min="1" max="5" value=${surveyForm.trust_level} onInput=${(e) => setSurveyForm({ ...surveyForm, trust_level: Number(e.target.value) })} />
              </label>
              <label>Цифровая уверенность: ${surveyForm.digital_confidence}/5
                <input type="range" min="1" max="5" value=${surveyForm.digital_confidence} onInput=${(e) => setSurveyForm({ ...surveyForm, digital_confidence: Number(e.target.value) })} />
              </label>
              <label>Какая помощь нужна<input value=${surveyForm.assistance_needed} onInput=${(e) => setSurveyForm({ ...surveyForm, assistance_needed: e.target.value })} /></label>
              <div>
                <strong>${content.surveyQuestions[0]?.title}</strong>
                <div className="pill-row">
                  ${(content.surveyQuestions[0]?.options || []).map(
                    (option) => html`
                      <button
                        key=${option}
                        type="button"
                        className=${`pill-button ${surveyForm.barriers.includes(option) ? "pill-button--active" : ""}`}
                        onClick=${() => toggleOption("barriers", option)}
                      >
                        ${option}
                      </button>
                    `,
                  )}
                </div>
              </div>
              <div>
                <strong>${content.surveyQuestions[1]?.title}</strong>
                <div className="pill-row">
                  ${(content.surveyQuestions[1]?.options || []).map(
                    (option) => html`
                      <button
                        key=${option}
                        type="button"
                        className=${`pill-button ${surveyForm.motivators.includes(option) ? "pill-button--active" : ""}`}
                        onClick=${() => toggleOption("motivators", option)}
                      >
                        ${option}
                      </button>
                    `,
                  )}
                </div>
              </div>
              <label>Предпочитаемый канал<input value=${surveyForm.channel_preference} onInput=${(e) => setSurveyForm({ ...surveyForm, channel_preference: e.target.value })} /></label>
              <label>Заметки интервьюера<textarea rows="4" value=${surveyForm.notes} onInput=${(e) => setSurveyForm({ ...surveyForm, notes: e.target.value })}></textarea></label>
              <button className="button button--primary" type="submit">Сохранить анкету</button>
            </form>
            <div className="stack">
              <div className="card card--soft">
                <h3>Что чаще всего мешает по всем анкетам</h3>
                ${(content.dashboard?.top_barriers || []).map(
                  (barrier) => html`
                    <div key=${barrier.name} className="status-row">
                      <span>${barrier.name}</span>
                      <strong>${barrier.count} анкет</strong>
                    </div>
                  `,
                )}
              </div>
              <div className="card card--highlight">
                <h3>Разбор анкеты</h3>
                ${surveyInsight
                  ? html`
                      <div className="stack">
                        <p><strong>Профиль клиента:</strong> ${surveyInsight.persona_label}</p>
                        <p><strong>Уровень стресса:</strong> ${surveyInsight.stress_level}</p>
                        <p><strong>Готовность к переводу:</strong> ${surveyInsight.readiness_score}/100</p>
                        <p><strong>Рекомендованный маршрут:</strong> ${surveyInsight.recommended_route}</p>
                        <p>${surveyInsight.executive_summary}</p>
                        <strong>Следующие действия банка</strong>
                        <ul className="list">
                          ${surveyInsight.next_best_actions.map((item) => html`<li key=${item}>${item}</li>`)}
                        </ul>
                      </div>
                    `
                  : html`<p>После отправки анкеты здесь появится не сырая цифра, а читаемая интерпретация профиля клиента и нужного маршрута.</p>`}
                ${surveyResult
                  ? html`<p className="muted-note">Анкета №${surveyResult.id} сохранена в базе PostgreSQL.</p>`
                  : null}
              </div>
            </div>
          </div>
        </${Section}>

        <${Section}
          eyebrow="Каналы"
          title="Как выглядит единый сервис в цифровом, голосовом и офлайн-канале"
          description="Здесь показана CMS/CJM-логика обслуживания: один маршрут и разные точки контакта."
        >
          <div className="grid grid--three">
            ${content.channels.map(
              (channel) => html`
                <article key=${channel.channel} className="card">
                  <h3>${channel.channel}</h3>
                  <ul className="list">
                    ${channel.steps.map((step) => html`<li key=${step}>${step}</li>`)}
                  </ul>
                </article>
              `,
            )}
          </div>
        </${Section}>
      </main>
    </div>
  `;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);

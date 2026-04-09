import { useEffect, useMemo, useState } from "react";
import { Section } from "./components/Section";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

function App() {
  const [content, setContent] = useState({
    dashboard: null,
    research: null,
    personas: [],
    journey: [],
    benchmarks: [],
    channels: [],
    tutorials: [],
    trust: null,
    surveyQuestions: [],
    transfer: null,
  });
  const [surveyForm, setSurveyForm] = useState(surveyDefaults);
  const [transferForm, setTransferForm] = useState(transferDefaults);
  const [surveyResult, setSurveyResult] = useState(null);
  const [transferResult, setTransferResult] = useState(null);
  const [tutorialIndex, setTutorialIndex] = useState(0);

  useEffect(() => {
    const endpoints = [
      ["dashboard", "/api/dashboard"],
      ["research", "/api/research"],
      ["personas", "/api/personas"],
      ["journey", "/api/journey"],
      ["benchmarks", "/api/benchmarks"],
      ["channels", "/api/channels"],
      ["tutorials", "/api/tutorials"],
      ["trust", "/api/trust-architecture"],
      ["surveyQuestions", "/api/survey-questions"],
      ["transfer", "/api/transfer/process"],
    ];

    Promise.all(
      endpoints.map(([key, path]) =>
        fetch(`${API_URL}${path}`).then((response) => response.json().then((data) => [key, data])),
      ),
    ).then((entries) => {
      const nextState = Object.fromEntries(entries);
      setContent(nextState);
    });
  }, []);

  const currentTutorial = useMemo(
    () => content.tutorials[tutorialIndex] || null,
    [content.tutorials, tutorialIndex],
  );

  const submitSurvey = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/api/surveys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(surveyForm),
    });
    const data = await response.json();
    setSurveyResult(data);
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/api/transfer/intents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transferForm),
    });
    const data = await response.json();
    setTransferResult(data);
  };

  const toggleOption = (field, value) => {
    setSurveyForm((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <span className="eyebrow">Сбер. Пенсионный поток доверия</span>
          <h1>Омниканальная модель перевода пенсии 60+ с упором на доверие, поддержку и социальную ценность.</h1>
          <p>
            Демо объединяет исследование барьеров, профили персон, карту клиентского пути, сценарий бесшовного перевода
            и концепцию социального хаба в стиле Сбера.
          </p>
          <div className="hero__actions">
            <a href="#transfer-flow" className="button button--primary">
              Запустить перевод
            </a>
            <a href="#research" className="button button--ghost">
              Смотреть исследование
            </a>
          </div>
        </div>
        <div className="hero__panel">
          {content.dashboard?.summary?.map((item) => (
            <article key={item.label} className="metric">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.hint}</p>
            </article>
          ))}
        </div>
      </header>

      <main className="content">
        <Section
          eyebrow="Исследование"
          title="Что мешает переводу пенсии и почему деньги сами по себе не решают задачу"
          description={content.research?.study_goal}
        >
          <div className="grid grid--two" id="research">
            <div className="card card--soft">
              <h3>Целевые сегменты</h3>
              <ul className="list">
                {content.research?.target_segments?.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="card card--soft">
              <h3>Кластеры барьеров</h3>
              <div className="stack">
                {content.research?.barrier_clusters?.map((item) => (
                  <article key={item.title} className="mini-card">
                    <strong>{item.title}</strong>
                    <p>{item.details}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <div className="card card--highlight">
            <h3>Ключевая гипотеза</h3>
            <div className="pill-row">
              {content.research?.motivator_hypotheses?.map((item) => <span key={item} className="pill">{item}</span>)}
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Персоны"
          title="Три профиля пенсионеров с разными поколенческими барьерами"
          description="Фокус не на продукте, а на психологии перехода и способе сопровождения."
        >
          <div className="grid grid--three">
            {content.personas.map((persona) => (
              <article key={persona.id} className="card persona-card">
                <span className="tag">{persona.segment}</span>
                <h3>{persona.name}</h3>
                <p>{persona.bio}</p>
                <strong>Цели</strong>
                <ul className="list">
                  {persona.goals.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <strong>Барьеры</strong>
                <ul className="list">
                  {persona.barriers.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="CJM"
          title="Карта пути от тревоги до регулярного использования карты"
          description="CJM показывает, где банк должен снижать стресс не интерфейсом, а моделью сервиса."
        >
          <div className="timeline">
            {content.journey.map((step, index) => (
              <article key={step.stage} className="timeline__item">
                <div className="timeline__index">{index + 1}</div>
                <div className="card">
                  <h3>{step.stage}</h3>
                  <p><strong>Эмоция:</strong> {step.emotion}</p>
                  <p><strong>Боль:</strong> {step.pain_point}</p>
                  <p><strong>Ответ Сбера:</strong> {step.sber_response}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Бесшовный перевод"
          title="Простой сценарий перевода пенсии с поддержкой человека на каждом шаге"
          description="Большие блоки, минимум терминов и переключение между каналами без потери контекста."
        >
          <div className="grid grid--two" id="transfer-flow">
            <form className="card form-card" onSubmit={submitTransfer}>
              <h3>Демо маршрутизации клиента</h3>
              <label>
                ФИО
                <input value={transferForm.full_name} onChange={(e) => setTransferForm({ ...transferForm, full_name: e.target.value })} />
              </label>
              <label>
                Телефон
                <input value={transferForm.phone} onChange={(e) => setTransferForm({ ...transferForm, phone: e.target.value })} />
              </label>
              <label>
                Предпочтительный канал
                <select value={transferForm.preferred_channel} onChange={(e) => setTransferForm({ ...transferForm, preferred_channel: e.target.value })}>
                  <option>Онлайн</option>
                  <option>Гибридный маршрут</option>
                  <option>Отделение</option>
                </select>
              </label>
              <label>
                Формат помощи
                <select value={transferForm.assistance_format} onChange={(e) => setTransferForm({ ...transferForm, assistance_format: e.target.value })}>
                  <option>С куратором</option>
                  <option>С родственником-помощником</option>
                  <option>Самостоятельно</option>
                </select>
              </label>
              <label>
                Есть Госуслуги
                <select value={transferForm.has_gosuslugi} onChange={(e) => setTransferForm({ ...transferForm, has_gosuslugi: e.target.value })}>
                  <option>Да</option>
                  <option>Нет</option>
                </select>
              </label>
              <label>
                Мобильность
                <select value={transferForm.mobility_level} onChange={(e) => setTransferForm({ ...transferForm, mobility_level: e.target.value })}>
                  <option>Могу прийти в отделение по записи</option>
                  <option>Нужен звонок и сопровождение</option>
                  <option>Лучше только дистанционно</option>
                </select>
              </label>
              <label>
                Слот
                <input value={transferForm.appointment_slot} onChange={(e) => setTransferForm({ ...transferForm, appointment_slot: e.target.value })} />
              </label>
              <button className="button button--primary" type="submit">Сохранить маршрут</button>
            </form>

            <div className="stack">
              <div className="card card--soft">
                <h3>Этапы процесса</h3>
                <div className="stack">
                  {content.transfer?.steps?.map((step) => (
                    <article className="mini-card" key={step.title}>
                      <strong>{step.title}</strong>
                      <p>{step.description}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="card card--highlight">
                <h3>Статус демо-заявки</h3>
                {transferResult ? (
                  <div className="stack">
                    <p><strong>{transferResult.full_name}</strong>, маршрут: {transferResult.preferred_channel}</p>
                    {transferResult.step_statuses.map((step) => (
                      <div className="status-row" key={step.name}>
                        <span>{step.name}</span>
                        <span className={`status status--${step.status}`}>{step.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>После отправки формы появится дорожная карта обслуживания клиента.</p>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Обучение"
          title="Интерактивные подсказки, которые снижают тревогу и учат пользоваться картой"
          description="Демо показывает мягкий сценарий сопровождения, а не сложный цифровой режим."
        >
          <div className="grid grid--two">
            <div className="card tutorial-card">
              <h3>{currentTutorial?.title}</h3>
              <p>{currentTutorial?.description}</p>
              <div className="hero__actions">
                <button
                  className="button button--ghost"
                  onClick={() => setTutorialIndex((value) => (value === 0 ? content.tutorials.length - 1 : value - 1))}
                >
                  Назад
                </button>
                <button
                  className="button button--primary"
                  onClick={() => setTutorialIndex((value) => (value + 1) % content.tutorials.length)}
                >
                  Далее
                </button>
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
        </Section>

        <Section
          eyebrow="Социальный хаб"
          title="Нефинансовая сервисная модель, которая делает Сбер точкой опоры"
          description="Главный фокус: здоровье, досуг, образование и помощь в повседневных задачах."
        >
          <div className="grid grid--three">
            {content.trust?.pillars?.map((pillar) => (
              <article className="card" key={pillar.title}>
                <h3>{pillar.title}</h3>
                <ul className="list">
                  {pillar.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <div className="card card--highlight">
            <h3>Прогноз эффекта</h3>
            <ul className="list">
              {content.trust?.effect_forecast?.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </Section>

        <Section
          eyebrow="Benchmark"
          title="Лучшие практики банков, государства и сервисных экосистем"
          description="Сравнение показывает, что возрастной аудитории нужна не акция, а доверительный маршрут."
        >
          <div className="grid grid--two">
            {content.benchmarks.map((item) => (
              <article className="card" key={item.name}>
                <span className="tag">{item.category}</span>
                <h3>{item.name}</h3>
                <p><strong>Практика:</strong> {item.practice}</p>
                <p><strong>Вывод:</strong> {item.takeaway}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Опрос"
          title="FastAPI-форма для исследования будущих пенсионеров"
          description="Результаты опроса сохраняются в PostgreSQL и могут использоваться как база для дальнейшей аналитики."
        >
          <div className="grid grid--two">
            <form className="card form-card" onSubmit={submitSurvey}>
              <h3>Анкета будущего пенсионера</h3>
              <label>
                Возрастная группа
                <select value={surveyForm.age_group} onChange={(e) => setSurveyForm({ ...surveyForm, age_group: e.target.value })}>
                  <option>55-64</option>
                  <option>65-74</option>
                  <option>75+</option>
                </select>
              </label>
              <label>
                Тип респондента
                <select value={surveyForm.persona_hint} onChange={(e) => setSurveyForm({ ...surveyForm, persona_hint: e.target.value })}>
                  <option>Молодой пенсионер</option>
                  <option>С поддержкой семьи</option>
                  <option>Офлайн-консерватор</option>
                </select>
              </label>
              <label>
                Текущий банк
                <input value={surveyForm.current_bank} onChange={(e) => setSurveyForm({ ...surveyForm, current_bank: e.target.value })} />
              </label>
              <label>
                Доверие к банкам: {surveyForm.trust_level}/5
                <input type="range" min="1" max="5" value={surveyForm.trust_level} onChange={(e) => setSurveyForm({ ...surveyForm, trust_level: Number(e.target.value) })} />
              </label>
              <label>
                Цифровая уверенность: {surveyForm.digital_confidence}/5
                <input type="range" min="1" max="5" value={surveyForm.digital_confidence} onChange={(e) => setSurveyForm({ ...surveyForm, digital_confidence: Number(e.target.value) })} />
              </label>
              <label>
                Какая помощь нужна
                <input value={surveyForm.assistance_needed} onChange={(e) => setSurveyForm({ ...surveyForm, assistance_needed: e.target.value })} />
              </label>
              <div>
                <strong>{content.surveyQuestions[0]?.title}</strong>
                <div className="pill-row">
                  {content.surveyQuestions[0]?.options?.map((option) => (
                    <button
                      className={`pill-button ${surveyForm.barriers.includes(option) ? "pill-button--active" : ""}`}
                      type="button"
                      key={option}
                      onClick={() => toggleOption("barriers", option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <strong>{content.surveyQuestions[1]?.title}</strong>
                <div className="pill-row">
                  {content.surveyQuestions[1]?.options?.map((option) => (
                    <button
                      className={`pill-button ${surveyForm.motivators.includes(option) ? "pill-button--active" : ""}`}
                      type="button"
                      key={option}
                      onClick={() => toggleOption("motivators", option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                Предпочитаемый канал
                <input value={surveyForm.channel_preference} onChange={(e) => setSurveyForm({ ...surveyForm, channel_preference: e.target.value })} />
              </label>
              <label>
                Заметки интервьюера
                <textarea rows="4" value={surveyForm.notes} onChange={(e) => setSurveyForm({ ...surveyForm, notes: e.target.value })} />
              </label>
              <button className="button button--primary" type="submit">Сохранить анкету</button>
            </form>

            <div className="stack">
              <div className="card card--soft">
                <h3>Ключевые барьеры по демо-данным</h3>
                {content.dashboard?.top_barriers?.map((barrier) => (
                  <div className="status-row" key={barrier.name}>
                    <span>{barrier.name}</span>
                    <strong>{barrier.count}</strong>
                  </div>
                ))}
              </div>
              <div className="card card--highlight">
                <h3>Результат сохранения</h3>
                {surveyResult ? (
                  <div className="stack">
                    <p><strong>Анкета #{surveyResult.id}</strong> сохранена.</p>
                    <p>{surveyResult.persona_hint}, канал: {surveyResult.channel_preference}</p>
                    <p>Главный мотиватор: {surveyResult.motivators.join(", ")}</p>
                  </div>
                ) : (
                  <p>После отправки анкеты здесь появится подтверждение записи в хранилище FastAPI.</p>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Каналы"
          title="Как выглядит единый сервис в цифровом, голосовом и офлайн-канале"
          description="Здесь показана CMS/CJM-логика обслуживания: один маршрут и разные точки контакта."
        >
          <div className="grid grid--three">
            {content.channels.map((channel) => (
              <article className="card" key={channel.channel}>
                <h3>{channel.channel}</h3>
                <ul className="list">
                  {channel.steps.map((step) => <li key={step}>{step}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}

export default App;

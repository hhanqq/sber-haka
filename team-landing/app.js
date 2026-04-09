const teamProfile = {
  stats: [
    { value: "10", label: "участников" },
    { value: "100%", label: "готовность к показу" },
    { value: "1", label: "отдельный URL по QR" },
  ],
  highlights: [
    "Работает независимо от основного фронтенда",
    "Поднимается как отдельный контейнер и отдельный порт",
    "Корректно адаптирован под мобильные устройства",
  ],
  values: [
    {
      title: "Сильная подача",
      description: "Лендинг помогает быстро и уверенно показать, кто мы, за что отвечаем и чем усиливаем общий результат.",
    },
    {
      title: "Понятные роли",
      description: "Каждый участник представлен как отдельная экспертная единица, а не просто имя в конце презентации.",
    },
    {
      title: "Живой контакт",
      description: "Telegram и личный фокус делают страницу человечной и удобной для дальнейшего контакта после показа.",
    },
  ],
  stack: ["Аналитика", "Research", "UX/UI", "Frontend", "Backend", "ML", "Strategy", "Pitch"],
};

// Для реальных фото сложите файлы в team-landing/assets/team/
// и укажите путь вида ./assets/team/alina.jpg в поле photo.
const teamMembers = [
  {
    name: "Алина Морозова",
    role: "Team Lead",
    telegram: "@alina_sber",
    focus: "Координация команды и финальная подача",
    superpower: "Собирает людей, смыслы и дедлайны в один сильный результат",
    tagline: "Держит общую структуру проекта и темп всей команды.",
    photo: "",
  },
  {
    name: "Данил Ветров",
    role: "Product Manager",
    telegram: "@danil_pm",
    focus: "Продуктовая логика и пользовательская ценность",
    superpower: "Переводит идеи в ясный и защищаемый продуктовый сценарий",
    tagline: "Следит, чтобы решение было цельным и убедительным.",
    photo: "",
  },
  {
    name: "Мария Левина",
    role: "Business Analyst",
    telegram: "@maria_ba",
    focus: "Рынок, гипотезы и бизнес-обоснование",
    superpower: "Превращает данные и факты в сильные аргументы",
    tagline: "Помогает проекту звучать уверенно и содержательно.",
    photo: "",
  },
  {
    name: "Егор Беляев",
    role: "UX Research",
    telegram: "@egor_research",
    focus: "Пользовательские барьеры и мотивация",
    superpower: "Хорошо чувствует реальные боли и поведение людей",
    tagline: "Отвечает за то, чтобы проект был понятен пользователю.",
    photo: "",
  },
  {
    name: "Полина Орлова",
    role: "UX/UI Designer",
    telegram: "@polina_ui",
    focus: "Визуальная система и интерфейс",
    superpower: "Упаковывает идеи в аккуратный и запоминающийся визуал",
    tagline: "Делает так, чтобы страница сразу производила нужное впечатление.",
    photo: "",
  },
  {
    name: "Артем Зайцев",
    role: "Frontend Developer",
    telegram: "@artem_front",
    focus: "Верстка, адаптив и интерактив",
    superpower: "Быстро превращает макет в работающий веб-экран",
    tagline: "Следит за тем, чтобы все выглядело уверенно на любом устройстве.",
    photo: "",
  },
  {
    name: "Ксения Романова",
    role: "Frontend Developer",
    telegram: "@ksenia_dev",
    focus: "Компоненты и UI-логика",
    superpower: "Делает интерфейс чистым, ритмичным и удобным",
    tagline: "Добавляет аккуратность и плавность в пользовательский опыт.",
    photo: "",
  },
  {
    name: "Илья Соколов",
    role: "Backend Developer",
    telegram: "@ilya_backend",
    focus: "Серверная логика и интеграции",
    superpower: "Собирает устойчивую и понятную архитектуру под капотом",
    tagline: "Поддерживает надежную техническую основу проекта.",
    photo: "",
  },
  {
    name: "Софья Никитина",
    role: "ML Engineer",
    telegram: "@sofya_ml",
    focus: "Модели и интеллектуальные сценарии",
    superpower: "Находит, где технология реально усиливает продукт",
    tagline: "Добавляет проекту технологическую глубину и масштабируемость.",
    photo: "",
  },
  {
    name: "Никита Фролов",
    role: "Pitch & Strategy",
    telegram: "@nikita_pitch",
    focus: "Смысловая упаковка и защита проекта",
    superpower: "Формулирует идею так, чтобы ее запомнили и поддержали",
    tagline: "Собирает ключевые акценты для сильного выступления.",
    photo: "",
  },
];

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => (part[0] || "").toUpperCase())
    .join("");
}

function getTelegramHref(telegram) {
  if (telegram.startsWith("https://") || telegram.startsWith("http://")) {
    return telegram;
  }

  return `https://t.me/${telegram.replace(/^@/, "")}`;
}

function renderStats() {
  const root = document.getElementById("stats");
  root.innerHTML = teamProfile.stats
    .map(
      (item) => `
        <article class="stat">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </article>
      `,
    )
    .join("");
}

function renderHighlights() {
  const root = document.getElementById("highlights");
  root.innerHTML = teamProfile.highlights
    .map(
      (item) => `
        <div class="panel__item">
          <span></span>
          <p>${item}</p>
        </div>
      `,
    )
    .join("");
}

function renderStack() {
  const root = document.getElementById("stack");
  root.innerHTML = teamProfile.stack.map((item) => `<span class="chip">${item}</span>`).join("");
}

function renderValues() {
  const root = document.getElementById("values");
  root.innerHTML = teamProfile.values
    .map(
      (item, index) => `
        <article class="value-card" style="animation-delay:${index * 80}ms">
          <span class="value-card__index">0${index + 1}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </article>
      `,
    )
    .join("");
}

function renderMembers() {
  const root = document.getElementById("member-grid");
  root.innerHTML = teamMembers
    .map((member, index) => {
      const avatar = member.photo
        ? `<img class="member-card__avatar" src="${member.photo}" alt="${member.name}" />`
        : `<div class="member-card__avatar member-card__avatar--placeholder">${getInitials(member.name)}</div>`;

      return `
        <article class="member-card" style="animation-delay:${index * 60}ms">
          <div class="member-card__top">
            ${avatar}
            <div class="member-card__identity">
              <span class="member-card__role">${member.role}</span>
              <h3>${member.name}</h3>
              <p>${member.tagline}</p>
            </div>
          </div>

          <dl class="member-card__meta">
            <div>
              <dt>Telegram</dt>
              <dd><a href="${getTelegramHref(member.telegram)}" target="_blank" rel="noreferrer">${member.telegram}</a></dd>
            </div>
            <div>
              <dt>Фокус</dt>
              <dd>${member.focus}</dd>
            </div>
            <div>
              <dt>Сильная сторона</dt>
              <dd>${member.superpower}</dd>
            </div>
          </dl>
        </article>
      `;
    })
    .join("");
}

renderStats();
renderHighlights();
renderStack();
renderValues();
renderMembers();

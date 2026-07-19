const docx = require("docx");
const fs = require("fs");
const path = require("path");

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, TableLayoutType, WidthType,
  AlignmentType, BorderStyle, PageBreak,
  ImageRun, ShadingType, NumberFormat,
  convertInchesToTwip,
} = docx;

// Color palette
const C = {
  primary: "FF4D2D",
  secondary: "3DDC84",
  accent: "1A1A2E",
  muted: "6B6B7D",
  gold: "FFD93D",
  white: "FFFFFF",
  lightBg: "F5F5FA",
  border: "E5E5F0",
};

function heading(text, level = 1) {
  const sizes = { 1: 28, 2: 24, 3: 20, 4: 16 };
  const colors = { 1: C.accent, 2: C.accent, 3: C.primary, 4: C.accent };
  return new Paragraph({
    text,
    heading: level === 1 ? HeadingLevel.HEADING_1
          : level === 2 ? HeadingLevel.HEADING_2
          : level === 3 ? HeadingLevel.HEADING_3
          : HeadingLevel.HEADING_4,
    spacing: { before: level <= 2 ? 400 : 280, after: 200 },
    numbering: level <= 2 ? undefined : { reference: "nested-list", level: level - 3 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        font: "Geist Sans",
        color: C.accent,
        ...(opts.bold ? { bold: true } : {}),
        ...(opts.italic ? { italics: true } : {}),
        ...(opts.color ? { color: opts.color } : {}),
      }),
    ],
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    ...(opts.align ? { alignment: opts.align } : {}),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [
      new TextRun({ text, size: 22, font: "Geist Sans", color: C.accent }),
    ],
    bullet: { level },
    spacing: { after: 60 },
  });
}

function numberedItem(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, size: 22, font: "Geist Sans", color: C.accent }),
    ],
    numbering: { reference: "main-list", level: 0 },
    spacing: { after: 60 },
  });
}

function spacer(h = 200) {
  return new Paragraph({ spacing: { after: h, before: 0 }, children: [] });
}

function boldRun(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: "Geist Sans", color: C.accent }),
      new TextRun({ text: value, size: 22, font: "Geist Sans", color: C.accent }),
    ],
    spacing: { after: 60 },
  });
}

function coloredBox(content, bgColor = C.lightBg) {
  return new Paragraph({
    children: [
      new TextRun({
        text: content,
        size: 20,
        font: "Geist Sans",
        color: C.accent,
      }),
    ],
    spacing: { after: 100, before: 100 },
    shading: { type: ShadingType.CLEAR, fill: bgColor },
    indent: { left: convertInchesToTwip(0.3), right: convertInchesToTwip(0.3) },
    border: {
      top: { style: BorderStyle.SINGLE, size: 1, color: C.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: C.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: C.primary },
      right: { style: BorderStyle.SINGLE, size: 1, color: C.border },
    },
  });
}

function link(text) {
  return new TextRun({
    text,
    style: "Hyperlink",
    size: 22,
    font: "Geist Sans",
    color: C.primary,
    underline: { type: docx.UnderlineType.SINGLE },
  });
}

async function main() {
  const doc = new Document({
    title: "Naranja Feliz — Полная документация проекта",
    description: "Архитектура, инфраструктура, руководство пользователя и администратора",
    styles: {
      default: {
        document: {
          run: { size: 22, font: "Geist Sans", color: C.accent },
          paragraph: { spacing: { after: 120 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "main-list",
          levels: [
            { level: 0, format: NumberFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START },
          ],
        },
        {
          reference: "nested-list",
          levels: [
            { level: 0, format: NumberFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START },
            { level: 1, format: NumberFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.START },
          ],
        },
      ],
    },
    sections: [
      // ============ TITLE PAGE ============
      {
        children: [
          spacer(2000),
          new Paragraph({
            children: [
              new TextRun({
                text: "Naranja Feliz",
                size: 56,
                font: "Geist Sans",
                bold: true,
                color: C.primary,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Испанский язык с огоньком",
                size: 36,
                font: "Geist Sans",
                color: C.gold,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Полная документация проекта",
                size: 28,
                font: "Geist Sans",
                bold: true,
                color: C.accent,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Версия 1.0 — Июль 2026",
                size: 22,
                font: "Geist Sans",
                color: C.muted,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Motivación en cada gajo — мотивация в каждой дольке",
                size: 20,
                font: "Geist Sans",
                italics: true,
                color: C.muted,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },

      // ============ TABLE OF CONTENTS ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("Содержание", 1),
          spacer(100),
          ...([
            ["1", "Введение"],
            ["2", "Для учеников"],
            ["2.1", "Регистрация и вход"],
            ["2.2", "Главная страница (портал)"],
            ["2.3", "Курсы и уроки"],
            ["2.4", "Перевод в уроках"],
            ["2.5", "Словарь"],
            ["2.6", "Флеш-карты"],
            ["2.7", "Чат"],
            ["2.8", "Уведомления"],
            ["2.9", "Настройки и подписка"],
            ["3", "Для учителей и администраторов"],
            ["3.1", "Создание курсов"],
            ["3.2", "Редактор уроков"],
            ["3.3", "Типы блоков"],
            ["3.4", "Перевод в TEXT блоке"],
            ["3.5", "Проверка ответов"],
            ["3.6", "Контент (новости/статьи)"],
            ["3.7", "Статистика"],
            ["4", "Дизайн-система"],
            ["5", "Техническая документация"],
            ["6", "Тестовые аккаунты"],
          ].map(([num, title]) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${num}  ${title}`,
                  size: 22,
                  font: "Geist Sans",
                  color: num.includes(".") ? C.muted : C.accent,
                  bold: !num.includes("."),
                }),
              ],
              spacing: { after: num.includes(".") ? 40 : 80 },
            })
          )),
        ],
      },

      // ============ 1. ВВЕДЕНИЕ ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("1. Введение", 1),
          spacer(100),
          para("Naranja Feliz — это онлайн-школа испанского языка. Платформа позволяет ученикам проходить интерактивные уроки, пополнять словарь, общаться с учителем и отслеживать прогресс. Учителя создают курсы с разнотипными заданиями, проверяют ответы и управляют контентом."),
          spacer(100),
          para("Основные возможности:", "bold"),
          bullet("Интерактивные уроки с 10 типами блоков (текст, выбор ответа, вставка слова, аудио/видео ответы и др.)"),
          bullet("Встроенный перевод с озвучкой (Web Speech API) — выдели текст → нажми кнопку перевода → зелёное подчёркивание"),
          bullet("Правый клик на переведённом тексте → модалка с переводом + кнопка «Прослушать»"),
          bullet("Словарь с автопереводом, транскрипцией и флеш-картами"),
          bullet("VocabPicker — режим добавления слов с любого текста на уроке (клик или двойной клик)"),
          bullet("Система ролей: ученик / учитель / администратор"),
          bullet("Проверка ответов с чатом и уведомлениями"),
          bullet("Статистика успеваемости (диаграммы)"),
          bullet("Новости и статьи (контент-система)"),
        ],
      },

      // ============ 2. ДЛЯ УЧЕНИКОВ ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("2. Для учеников", 1),

          heading("2.1. Регистрация и вход", 2),
          para("Перейдите на страницу регистрации (/register) или входа (/login). Для регистрации укажите email, имя и пароль. После входа вы попадёте на главную страницу (портал)."),
          para("Тестовый ученик: outmilker@gmail.com", "bold"),

          heading("2.2. Главная страница (портал)", 2),
          para("На главной странице вы увидите:"),
          bullet("Анимированный слайд-шоу с фотографиями Испании (Ken Burns эффект)"),
          bullet("Кнопки: «Начать учиться», «Войти» (для неавторизованных) или «Перейти к курсам» (для учеников)"),
          bullet("Карточки новостей и статей"),
          bullet("Секции с преимуществами школы"),
          bullet("Подвал со ссылками"),
          spacer(60),
          para("В верхней панели навигации:"),
          bullet("Мои курсы — список доступных курсов"),
          bullet("Словарь — страница управления словарём"),
          bullet("Чат — общение с учителем"),
          bullet("Проверка — просмотр проверенных заданий"),
          bullet("Инструменты — быстрый доступ к словарю, карточкам, чату"),
          bullet("🔔 уведомления — колокольчик с непрочитанными"),
          bullet("Аватар — меню профиля (настройки, выход)"),

          heading("2.3. Курсы и уроки", 2),
          para("На странице /courses отображаются все доступные курсы. Курсы могут быть публичными (доступны всем) или по подписке."),
          spacer(60),
          para("Внутри курса — список уроков. Каждый урок состоит из блоков разных типов:"),
          bullet("Текст — форматированный текст с возможностью перевода"),
          bullet("Вставка слова — текст с пропусками, нужно вписать ответ"),
          bullet("Выбор ответа — вопрос с вариантами (один или несколько)"),
          bullet("Открытый вопрос — ответ текстом"),
          bullet("Запись голоса — ответ голосом"),
          bullet("Запись видео — ответ на камеру"),
          bullet("Порядок — расставить слова в правильном порядке"),
          bullet("Выбор изображения — выбрать правильную картинку"),
          spacer(60),
          para("После выполнения задания можно отправить ответ на проверку учителю.", "bold"),

          heading("2.4. Перевод в уроках", 2),
          para("В текстовых блоках есть встроенная функция перевода:", "bold"),
          numberedItem("Найди текст с зелёным подчёркиванием (это переведённые фразы)"),
          numberedItem("Наведи мышку на подчёркнутый текст — вся фраза подсветится зелёным"),
          numberedItem("Нажми правую кнопку мыши — появится модалка с переводом"),
          numberedItem("Нажми «Прослушать» — текст будет озвучен с испанским произношением"),
          spacer(60),
          para("Пример:", "bold", "italic"),
          coloredBox("Mañana el tonto de mi cuñado está en casa hasta la madrugada\n↓\nЗавтра мой глупый зять будет дома до рассвета."),

          heading("2.5. Словарь", 2),
          para("Страница /tools/vocabulary — все добавленные слова. Можно:"),
          bullet("Искать по слову или переводу"),
          bullet("Фильтровать по букве (A-Z)"),
          bullet("Фильтровать по тегам"),
          bullet("Переключаться между списком и карточками"),
          bullet("Слушать произношение (Volume2)"),
          bullet("Удалять слова (выборочно или массово)"),
          spacer(60),
          para("Добавление слов с урока:", "bold"),
          para("Включи режим словаря — нажми кнопку с книжкой (📖) в правом нижнем углу. Затем:"),
          bullet("Одинарный клик — если предварительно выделил слово (drag-select)"),
          bullet("Двойной клик — по любому слову в тексте урока"),
          spacer(60),
          para("После выбора слова откроется модалка:"),
          bullet("Автоматический перевод (или ручной ввод)"),
          bullet("Автоматическая транскрипция"),
          bullet("Теги (через запятую)"),
          bullet("Контекст — предложение, откуда взято слово"),
          bullet("Кнопка «Добавить в словарь»"),

          heading("2.6. Флеш-карты", 2),
          para("Страница /tools/cards — тренировка слов в формате карточек:"),
          bullet("Карточка: с лицевой стороны — слово на испанском, с оборотной — перевод + транскрипция"),
          bullet("Кнопка озвучки на лицевой стороне"),
          bullet("Кнопки: Знаю / Повторить — сортировка по прогрессу"),
          bullet("Shuffle — перемешать колоду"),

          heading("2.7. Чат", 2),
          para("Страница /tools/chat — общение с учителем в реальном времени."),

          heading("2.8. Уведомления", 2),
          para("Страница /notifications — все уведомления: проверка ответов, новые уроки, истечение подписки."),

          heading("2.9. Настройки и подписка", 2),
          para("Страница /settings — редактирование профиля. В секции «Подписка»:"),
          bullet("Статус: активна / неактивна / запрос отправлен"),
          bullet("Кнопка «Запросить продление» — отправляет запрос учителю"),
          para("Цены на подписку можно посмотреть на /pricing."),
        ],
      },

      // ============ 3. ДЛЯ УЧИТЕЛЕЙ ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("3. Для учителей и администраторов", 1),

          heading("3.1. Создание курсов", 2),
          para("Перейдите в /admin/courses/new. Заполните:"),
          bullet("Название курса"),
          bullet("Описание"),
          bullet("Обложка (загрузка файла)"),
          bullet("Режим доступа: публичный / по подписке"),
          spacer(60),
          para("После создания появятся кнопки «Добавить урок» и «Редактировать»."),

          heading("3.2. Редактор уроков", 2),
          para("Редактор уроков — блочный интерфейс. Каждый урок состоит из блоков, которые можно добавлять, редактировать, удалять и менять порядок (Drag & Drop)."),
          spacer(60),
          para("Для добавления блока выберите тип из выпадающего списка (с описанием каждого типа) и нажмите «Добавить блок»."),
          spacer(60),
          para("TEXT блок — использует Tiptap редактор (WYSIWYG). Панель инструментов:", "bold"),
          bullet("Bold, Italic, Underline"),
          bullet("Заголовки H1-H3"),
          bullet("Маркированный и нумерованный списки"),
          bullet("Цитаты"),
          bullet("Ссылки"),
          bullet("Изображения / аудио / видео (загрузка или ссылки)"),
          bullet("Undo / Redo"),
          bullet("Предпросмотр"),
          bullet("Languages — перевод выделенного текста"),
          spacer(60),
          para("Перевод в редакторе:", "bold"),
          para("1. Выделите испанский текст\n2. Нажмите кнопку Languages в панели\n3. Текст подчеркнётся зелёным — перевод сохранён\n4. Повторное нажатие на переведённом тексте — перевод снимается"),
          spacer(60),
          para("Кнопка «Предпросмотр» — открывает просмотр с зелёными подчёркиваниями, ховером и правым кликом (как в реальном уроке)."),

          heading("3.3. Типы блоков", 2),
          para("Доступные типы с описанием:"),
          boldRun("Текст — ", "Форматированный текст с возможностью перевода и озвучки фрагментов"),
          boldRun("Изображение — ", "Изображение с подписью, настраиваемой шириной"),
          boldRun("Видео / Аудио — ", "Видео или аудиофайл для вставки в урок"),
          boldRun("Вставка слова — ", "Текст с пропусками — ученик вставляет пропущенные слова"),
          boldRun("Выбор ответа — ", "Вопрос с вариантами ответа (один или несколько правильных)"),
          boldRun("Открытый вопрос — ", "Вопрос с открытым ответом — ученик пишет текстом"),
          boldRun("Запись голоса — ", "Задание записать голосовой ответ на вопрос"),
          boldRun("Запись видео — ", "Задание записать видеоответ"),
          boldRun("Порядок — ", "Слова перемешиваются — ученик собирает правильный порядок"),
          boldRun("Выбор изображения — ", "Выбор правильного изображения из нескольких"),

          heading("3.4. Проверка ответов", 2),
          para("Администраторы видят отправленные ответы учеников. Можно просматривать, комментировать и оценивать. Для каждого ответа есть чат с обсуждением."),

          heading("3.5. Контент (новости/статьи)", 2),
          para("Страница /admin/content — управление контентом. Создание новостей и статей с обложкой и текстом. Опубликованный контент отображается на главной странице и на /content/[id]."),

          heading("3.6. Статистика", 2),
          para("Страница /admin/stats — диаграммы успеваемости (pie charts), количество учеников, активность."),

          heading("3.7. Режим просмотра", 2),
          para("В профиле есть переключатель «Учитель / Ученик» — позволяет увидеть платформу глазами ученика."),
        ],
      },

      // ============ 4. ДИЗАЙН-СИСТЕМА ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("4. Дизайн-система", 1),
          spacer(100),
          para("Цветовая палитра:", "bold"),
          coloredBox("Primary (оранжевый): #FF4D2D — основной цвет бренда, кнопки, акценты"),
          coloredBox("Secondary (зелёный): #3DDC84 — перевод, успех, интерактивные элементы"),
          coloredBox("Gold (золотой): #FFD93D — выделения, цитаты, специальные акценты"),
          coloredBox("Accent (тёмный): #1A1A2E — заголовки, основной текст"),
          coloredBox("Surface (белый): #FFFFFF — фон карточек и модалок"),
          spacer(60),
          para("UI компоненты:", "bold"),
          bullet(".card — карточка с закруглёнными углами и тенью"),
          bullet(".btn-gradient — градиентная кнопка (primary → оранжевый)"),
          bullet(".btn-ghost — прозрачная кнопка с обводкой"),
          bullet(".badge — маленький индикатор (цветные варианты: badge-green, badge-gray)"),
          bullet(".glass-input — поле ввода с закруглёнными углами"),
          bullet(".text-content — класс для Word-подобных интервалов текста (используется в редакторе, предпросмотре и уроках)"),
          spacer(60),
          para("Иконки: Lucide React (strokeWidth=1.5). Шрифт: Geist Sans."),
          spacer(60),
          para("Все компоненты можно посмотреть на странице /design."),
        ],
      },

      // ============ 5. ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("5. Техническая документация", 1),
          spacer(100),
          para("Стек технологий и сервисы:", "bold"),
          spacer(60),
          para("Фронтенд / Бэкенд:", "bold"),
          bullet("Next.js 16 (App Router) — серверный рендеринг, API routes"),
          bullet("React 19 — клиентские компоненты"),
          bullet("TypeScript — типизация"),
          bullet("Tailwind CSS v4 — стилизация"),
          bullet("TipTap.js 3.27 — WYSIWYG редактор"),
          bullet("Recharts — диаграммы статистики"),
          bullet("Lucide React — иконки"),
          bullet("Web Speech API — озвучка испанского текста"),
          bullet("Sharp — сжатие изображений (серверный ресайз)"),
          spacer(60),
          para("Хостинг и инфраструктура:", "bold"),
          bullet("Yandex Cloud Serverless Containers — хостинг приложения (1GB RAM, 1vCPU)"),
          bullet("Yandex API Gateway — точка входа: naranja.outmilk.online → контейнер"),
          bullet("Yandex Container Registry — хранение Docker-образов"),
          bullet("Supabase (Free Tier) — PostgreSQL БД, Auth, Storage"),
          bullet("Yandex Translate API — перевод текста"),
          bullet("GitHub — репозиторий, CI/CD (GitHub Actions)"),
          bullet("GitHub Actions — авто-деплой при пуше в main"),
          spacer(60),
          para("Архитектура:", "bold"),
          coloredBox("Браузер → naranja.outmilk.online → API Gateway → Serverless Container (Next.js)"),
          spacer(40),
          coloredBox("  ├──→ /api/storage/[...path] (прокси-роут) → Supabase Storage\n  ├──→ /api/auth/* (регистрация, вход, сброс пароля) → Supabase Auth\n  ├──→ /api/* (основные API) → Supabase DB\n  └──→ /api/translate → Yandex Translate API"),
          spacer(60),
          para("Прокси-роут /api/storage/[...path]:", "bold"),
          bullet("Назначение: обход блокировок провайдера при загрузке фото (ERR_CONNECTION_RESET)"),
          bullet("Upstream: https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public/{path}"),
          bullet("Обработка: Sharp ресайз до 1920px + JPEG q80 (только для изображений)"),
          bullet("Кэш: Cache-Control: public, max-age=86400"),
          bullet("Не-изображения (PDF, видео, аудио): passthrough без изменений"),
          bullet("На фронтенде: proxyImgUrl() заменяет SUPABASE_STORAGE_ORIGIN на /api/storage/..."),
          spacer(60),
          para("Авторизация (Auth):", "bold"),
          bullet("Регистрация: POST /api/auth/signup → admin.createUser({ email_confirm: true })"),
          bullet("  - email_confirm: true — пользователь сразу активен, без письма"),
          bullet("  - После регистрации создаётся профиль в таблице profiles"),
          bullet("Вход: POST /api/auth/login → signInWithPassword() + cookie"),
          bullet("Сброс пароля: /forgot-password → resetPasswordForEmail() → письмо → /reset-password → updateUser()"),
          bullet("Внимание: Supabase Free = 2 письма/час для сброса пароля"),
          bullet("Auth callback: /auth/callback → exchangeCodeForSession() → редирект на NEXT_PUBLIC_SITE_URL"),
          spacer(60),
          para("Сжатие изображений:", "bold"),
          bullet("При загрузке: Sharp (JPEG mozjpeg q82, PNG→WebP, ресайз >1920px)"),
          bullet("Через прокси-роут: Sharp на лету (JPEG q80, 1920px)"),
          bullet("Пакетное сжатие: scripts/compress-storage.mjs — прошёлся по всем файлам >300KB в Storage"),
          spacer(60),
          para("Переменные окружения:", "bold"),
          coloredBox(
            "# Обязательные:\n" +
            "NEXT_PUBLIC_SUPABASE_URL=https://zphehhzgbudetyzezunk.supabase.co\n" +
            "NEXT_PUBLIC_SUPABASE_ANON_KEY=...\n" +
            "SUPABASE_SERVICE_ROLE_KEY=...\n" +
            "NEXT_PUBLIC_SITE_URL=http://localhost:3100 (локально) / https://naranja.outmilk.online (продакшн)\n\n" +
            "# Для перевода:\n" +
            "YANDEX_API_KEY=...\n" +
            "YANDEX_FOLDER_ID=b1gsrqv6ri6jr7ue41fc\n" +
            "DEEPL_API_KEY=... (опционально)"
          ),
          spacer(60),
          para("Архитектура перевода:", "bold"),
          bullet("Словарь служебных слов (src/data/spanish-function-words.ts) — 240 записей (артикли, местоимения, предлоги, союзы и т.д.) — возвращают грамматическое объяснение"),
          bullet("Yandex Translate API — основной переводчик (требует YANDEX_API_KEY + YANDEX_FOLDER_ID)"),
          bullet("DeepL — первый fallback (требует DEEPL_API_KEY)"),
          bullet("Google Translate — бесплатный fallback"),
          bullet("LibreTranslate — fallback"),
          bullet("MyMemory — последний fallback"),
          spacer(40),
          coloredBox("POST /api/translate { text, source?: \"es\", target?: \"ru\" } → { translation, functionWord? }"),
          spacer(60),
          para("Ключевые файлы:", "bold"),
          bullet("src/app/page.tsx — портал (главная)"),
          bullet("src/app/layout.tsx — корневой layout"),
          bullet("src/components/site-header.tsx — хедер"),
          bullet("src/app/api/storage/[...path]/route.ts — прокси-роут изображений (Sharp)"),
          bullet("src/lib/image-proxy.ts — утилита замены URL на /api/storage/..."),
          bullet("src/app/api/auth/signup/route.ts — регистрация"),
          bullet("src/app/api/auth/login/route.ts — вход"),
          bullet("src/app/api/auth/forgot-password/route.ts — сброс пароля"),
          bullet("src/app/api/auth/update-password/route.ts — обновление пароля"),
          bullet("src/app/auth/callback/route.ts — auth callback"),
          bullet("scripts/compress-storage.mjs — пакетное сжатие фото в Storage"),
          bullet("src/app/globals.css — дизайн-система"),
          spacer(60),
          para("Ключевые файлы инфраструктуры:", "bold"),
          bullet("Dockerfile — многостадийная сборка Next.js (standalone, порт 8080)"),
          bullet("gateway-spec.yaml — API Gateway (naranja-gateway → контейнер)"),
          bullet(".github/workflows/deploy.yml — CI/CD: сборка → пуш в YCR → ревизия"),
          bullet("supabase/migration.sql — схема БД"),
          spacer(60),
          para("База данных (Supabase PostgreSQL):", "bold"),
          bullet("courses — курсы (access_mode: public/subscription)"),
          bullet("lessons — уроки (blocks JSONB)"),
          bullet("vocabulary — словарь пользователей"),
          bullet("content — новости/статьи (page_sections — секции портала)"),
          bullet("content_blocks — динамические блоки (article/ad)"),
          bullet("profiles — профили (role: student/teacher/admin)"),
          bullet("notifications — уведомления"),
          bullet("subscriptions — подписки"),
          bullet("submissions — ответы учеников"),
          bullet("submission_thread — чат под ответами"),
          bullet("teacher_students — привязка учителя к ученикам"),
          spacer(60),
          para("CI/CD (GitHub Actions):", "bold"),
          bullet("Пуш в main → сборка Next.js → Docker build → push в YCR → новая ревизия контейнера → health check"),
          bullet("Секреты: YC_SA_KEY_JSON, SUPABASE_SERVICE_ROLE_KEY, YANDEX_API_KEY"),
          bullet("Правило: деплой только с разрешения пользователя (не автоматический)"),
        ],
      },

      // ============ 6. ТЕСТОВЫЕ АККАУНТЫ ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("6. Тестовые аккаунты", 1),
          spacer(100),
          para("Для тестирования используются аккаунты в Supabase Auth:", "bold"),
          spacer(60),
          coloredBox(
            "Администратор:\n" +
            "Email: outmilk@yandex.ru\n" +
            "Пароль: запросить у разработчика\n" +
            "Роль: admin\n" +
            "Возможности: всё — курсы, уроки, контент, проверка, статистика, управление порталом"
          ),
          spacer(100),
          coloredBox(
            "Ученик (тестовый):\n" +
            "Email: outmilker@gmail.com\n" +
            "Пароль: запросить у разработчика\n" +
            "Роль: student\n" +
            "Возможности: прохождение уроков, словарь, флеш-карты, чат, подписка"
          ),
          spacer(100),
          para("Примечание:", "bold"),
          bullet("Регистрация: email_confirm=true — после регистрации можно сразу войти (без письма)"),
          bullet("Режим просмотра: в профиле есть переключатель «Учитель/Ученик»"),
          bullet("Управление пользователями: Supabase Studio → Authentication → Users"),
        ],
      },

      // ============ APPENDIX: SCREENSHOTS ============
      {
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading("Приложение: Скриншоты", 1),
          spacer(100),
          para("Для добавления скриншотов сделайте снимки экрана следующих страниц:", "bold"),
          numberedItem("Главная страница — портал с hero и карточками (/ — http://localhost:3000/)"),
          numberedItem("Список курсов — с карточками и прогрессом (/courses)"),
          numberedItem("Урок с TEXT блоком — зелёные подчёркивания, правый клик на переводе (/courses/[id]/[id])"),
          numberedItem("Редактор урока — панель инструментов, кнопка Languages (/admin/courses/[id]/edit)"),
          numberedItem("Словарь — список слов с фильтрами (/tools/vocabulary)"),
          numberedItem("Флеш-карты — карточка с кнопкой озвучки (/tools/cards)"),
          numberedItem("VocabPicker — модалка добавления слова"),
          numberedItem("Дизайн-галерея — все компоненты (/design)"),
          numberedItem("Статистика — диаграммы (/admin/stats)"),
          numberedItem("Настройки — подписка (/settings)"),
        ],
      },
    ],
  });

  const outputDir = path.join(__dirname, "..", "docs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(outputDir, "Naranja_Feliz_Руководство_пользователя.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Документация создана: ${outputPath}`);
}

main().catch(console.error);

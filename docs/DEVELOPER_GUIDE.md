# Naranja Feliz — Руководство Разработчика

## Стек

| Компонент | Технология | Аккаунт |
|-----------|-----------|---------|
| **Frontend** | Next.js 16 (App Router, Server/Client Components), React 19, Tailwind CSS 4 | — |
| **Backend** | Next.js API Routes (Route Handlers) | — |
| **База данных** | Supabase (PostgreSQL) | outmilker@gmail.com |
| **Аутентификация** | Supabase Auth (email/password) | там же |
| **Хранилище файлов** | Supabase Storage (bucket `lesson-files`) | там же |
| **Хостинг/сервер** | Yandex Cloud Serverless Containers (Free Tier) | outmilker@gmail.com (Yandex ID) |
| **Git** | GitHub | outmilker1978 |
| **Домен** | naranja.outmilk.online | Yandex API Gateway |

### Связи между сервисами

```
Пользователь (браузер)
    ↓
naranja.outmilk.online
    ↓
Yandex API Gateway (gateway-spec.yaml)
    ↓
Yandex Serverless Container (Next.js SSR, порт 8080)
    ↓
Supabase (БД, Auth, Storage)
```

- **GitHub** → **Yandex CR**: GitHub Actions (docker build → push)
- **Yandex Cloud** → **Supabase**: подключение по URL + anon key + service role key (через переменные окружения)

### Переменные окружения (локально .env.local, в GitHub Actions — secrets)

| Переменная | Откуда | Назначение |
|-----------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | URL для клиента Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | там же | Публичный anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | там же (Service Role) | Админ-доступ к БД (обходит RLS) |
| `NEXT_PUBLIC_SITE_URL` | https://naranja.outmilk.online | Редиректы после выхода |
| `YANDEX_API_KEY` | AI Studio Yandex Cloud | Перевод текстов через Yandex Translate API |
| `YANDEX_FOLDER_ID` | AI Studio Yandex Cloud | Каталог в Yandex Cloud |

---

## Структура проекта

```
src/
├── app/
│   ├── (dashboard)/          # Все страницы после логина (layout с шапкой)
│   │   ├── admin/            # Админ-панель учителя
│   │   │   ├── content/      # Управление контентом портала (page_section, news, article, ad)
│   │   │   ├── courses/      # Управление курсами и уроками
│   │   │   ├── lessons/      # Редактор урока (блоки)
│   │   │   ├── stats/        # Статистика ресурсов
│   │   │   ├── submissions/  # Проверка заданий
│   │   │   └── teachers/     # Назначение учителей
│   │   ├── courses/          # Студенческая часть (курс + урок)
│   │   ├── notifications/    # Уведомления
│   │   └── settings/         # Настройки профиля
│   ├── page.tsx              # Главная (портал) — секции Hero, Features, About, CTA...
│   ├── content/[id]/         # Просмотр новости/статьи
│   ├── reviews/              # Страница отзывов
│   ├── about/                # О школе
│   ├── catalog/              # Каталог курсов
│   ├── teachers/             # Преподаватели
│   ├── api/                  # Route Handlers
│   └── ...
├── components/
│   ├── content-editor.tsx     # Редактор контента портала
│   ├── content-carousel.tsx   # Карусель контента (новости, статьи)
│   ├── resizable-image.tsx    # Редактор: изображение с ресайзом и выравниванием
│   ├── translation-mark.ts    # Редактор: разметка перевода
│   ├── orange-divider.tsx     # Декоративный оранжевый разделитель (SVG)
│   ├── tiptap-divider.tsx     # TipTap расширение для разделителя
│   ├── tiptap-editor.tsx      # TipTap редактор (текстовые блоки уроков)
│   ├── lesson-blocks/         # Рендер и редактор блоков уроков
│   ├── dashboard-header.tsx   # Шапка с меню
│   ├── site-header.tsx        # Шапка портала
│   ├── submission-thread.tsx  # Чат под ответом
│   └── ...
└── lib/
    ├── image-proxy.ts         # proxyImgUrl - замена URL Supabase Storage на прокси-роут
    └── supabase/              # Клиенты Supabase
        ├── server.ts          # createClient (SSR), createServiceClient, createAdminClient
        └── client.ts          # createClient (браузер)
```

---

## Типы блоков уроков

| Тип | Content | Описание |
|------|---------|----------|
| `text` | `{ html: string }` | Текст (HTML) |
| `image` | `{ src: string, alt: string }` | Изображение |
| `video` | `{ src: string }` | Видео (YouTube, Rutube, VK) |
| `fill_blank` | `{ sentenceTemplate: string }` | Вставка слов (`[word]`) |
| `choice` | `{ question: string, options: string[], correct: number[] }` | Выбор ответа |
| `open_question` | `{ question: string }` | Открытый вопрос |
| `audio_answer` | `{ prompt: string }` | Аудио-ответ |
| `video_answer` | `{ prompt: string }` | Видео-ответ (скоро) |
| `drag_order` | `{ sentenceTemplate: string }` | Составь предложение |
| `image_pick` | `{ question: string, images: { src, label }[], correct: number[], multiple: boolean }` | Выбери изображение |

---

## Редактор TipTap

Текстовые блоки уроков (`type: "text"`) редактируются через TipTap (на базе ProseMirror). Редактор собран в `tiptap-editor.tsx`.

### Расширения редактора

| Расширение | Модуль | Роль |
|-----------|--------|------|
| `StarterKit` | `@tiptap/starter-kit` | База: параграфы, заголовки (h1-h3), списки, жирный/курсив, code, blockquote, история |
| `Underline` | `@tiptap/extension-underline` | Подчёркнутый текст |
| `LinkExtension` | `@tiptap/extension-link` | Вставка ссылок (`openOnClick: false`) |
| `ResizableImage` | `@/components/resizable-image` | Изображение с ресайзом (угол захвата). Кастомный NodeView (React). Выравнивание через `TextAlign` |
| `TranslationMark` | `@/components/translation-mark` | Разметка перевода `data-translate` для всплывающего перевода |
| `OrangeDividerExtension` | `@/components/tiptap-divider` | Декоративный разделитель (SVG). Кастомный NodeView (React) |
| `Placeholder` | `@tiptap/extension-placeholder` | Плейсхолдер в пустом редакторе |
| `TextAlign` | `@tiptap/extension-text-align` | Выравнивание (`types: ["heading", "paragraph", "image"]`) |

### Выравнивание изображений

Выравнивание работает через `TextAlign.configure({ types: ["heading", "paragraph", "image"] })`:
- В **редакторе** — `ResizableImageComponent` читает `node.attrs.textAlign` и применяет `text-align` к обёртке
- В **предпросмотре урока/студенте** — CSS-правило `.text-content img[style*="text-align:"] { display:block; margin:auto }` в `TextBlockRenderer` конвертирует `text-align` на `<img>` в `display:block` + `margin`

### Кастомные NodeView

Два расширения используют `ReactNodeViewRenderer` — React-компоненты для рендера в редакторе:

1. **`ResizableImage`** — рендерит `<img>` с ресайз-хендлом и тултипом размеров
2. **`OrangeDividerExtension`** — рендерит `OrangeDivider` (декоративный SVG) внутри `<NodeViewWrapper>`

Сериализация в HTML (`editor.getHTML()`) использует `renderHTML()` расширения, а не React NodeView.

---

## API Endpoints

| Route | Method | Описание |
|-------|--------|----------|
| `/api/auth/login` | POST | Вход |
| `/api/auth/logout` | POST | Выход |
| `/api/auth/signup` | POST | Регистрация |
| `/api/submit-answer` | POST | Сохранить ответ + уведомить учителя |
| `/api/review-submission` | POST | Проверить ответ (учитель) |
| `/api/comments` | GET/POST | Комментарии к ответу |
| `/api/upload-file` | POST | Загрузить файл в Storage (со сжатием Sharp) |
| `/api/upload-audio` | POST | Загрузить аудио (legacy) |
| `/api/assign-teacher` | POST | Назначить учителя |
| `/api/enroll` | POST | Записаться на курс |
| `/api/notifications` | GET/PUT | Уведомления |
| `/api/stats` | GET | Статистика (учитель) |
| `/api/content` | GET/POST | CRUD контента портала |
| `/api/content/[id]` | GET/PUT/DELETE | CRUD одного элемента контента |
| `/api/content/reorder` | POST | Пересортировка блоков контента |
| `/api/translate` | POST | Перевод текста (Yandex → DeepL → Google → ...) |

---

## Supabase клиенты

- **`createClient()`** — SSR-клиент (cookies, RLS активен). Использовать в Server Components и Route Handlers, где нужна авторизация текущего пользователя.
- **`createServiceClient()`** — Service Role Key (обходит RLS). Использовать для операций от имени сервера (загрузка файлов, создание уведомлений).
- **`createAdminClient()`** — Admin API Key. Использовать только для `auth.admin.updateUserById()`.
- **Браузерный `createClient()`** — в Client Components (`useEffect`, обработчики).

---

## Ролевая модель

- **Роль** хранится в `profiles.role` (основной источник) и дублируется в `user_metadata.role` (кэш JWT).
- **Переключение роли**: через cookie `view_role`. Учитель может смотреть сайт как ученик.
- **Защита админки**: Server Components проверяют `profiles.role`, Client Components — через API.
- **Layout**: проверяет оба источника (`profiles.role` + `user_metadata.role`).

---

## Уведомления

Таблица `notifications`. Создаются в:
- `/api/submit-answer` — студент ответил → учителю
- `/api/comments` POST — студент прокомментировал → учителю
- `/api/review-submission` — учитель проверил → студенту

Поле `link` содержит URL для перехода. Типы:
- `Новый ответ — НазваниеКурса` → `/admin/submissions`
- `Комментарий — НазваниеКурса` → `/admin/submissions`
- `✓ Проверено — НазваниеКурса` → `/courses/.../...`
- `💬 Комментарий — НазваниеКурса` → `/courses/.../...`

---

## Хранилище файлов

- Bucket: `lesson-files`
- Загрузка через `/api/upload-file` (service client, без RLS)
- Структура: `uploads/{userId}/{timestamp}.{ext}`
- Поддерживаемые типы: image/*, audio/*, video/*, .pdf
- **Сжатие изображений**: все картинки проходят через Sharp:
  - JPEG → mozjpeg quality 82
  - PNG → compressionLevel 9 + palette; если >500KB → конверт в WebP
  - Остальные (GIF, WebP, AVIF, TIFF) → WebP quality 82
  - Ресайз >1920px по ширине (fit inside)
  - При ошибке Sharp — fallback на оригинальный файл
- **Доступ**: используется Signed URL (1 год) для гарантированной загрузки независимо от публичности bucket

---

## Загрузка и проверка ответов

1. Студент отправляет ответ → `/api/submit-answer` → `block_submissions.upsert()` + уведомление учителю
2. Учитель видит ответ в `/admin/submissions`
3. Учитель пишет комментарий (SubmissionThread) → `/api/comments` POST
4. Учитель нажимает «Принять» → `/api/review-submission` → `block_submissions.update({ reviewed: true })` + уведомление студенту
5. Студент видит «✓ Проверено» + комментарий под блоком

---

## Сборка и запуск

```bash
npm install
npm run dev      # Dev-сервер на localhost:3100 (см. package.json scripts)
npm run build    # Production сборка (output: standalone → .next/)
npm start        # Production сервер
```

## Деплой

### Через GitHub Actions (автоматически)
1. Пуш в ветку `main` → workflow `.github/workflows/deploy.yml`
2. Workflow: Docker build → push в Yandex CR → новая ревизия контейнера
3. Требуется секрет `YC_SA_KEY_JSON` в GitHub Actions secrets

### Вручную (локально с Docker)
```bash
set TAG=deploy-$(date +%s)
docker build -t cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:%TAG% .
docker push cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:%TAG%
yc serverless container revision deploy ^
  --container-id bba12ti21lgmv9glfl7k ^
  --image cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:%TAG% ^
  --service-account-id ajep2inmg605fd6ttbb2 ^
  --memory 1GB --cores 1 --execution-timeout 300s --concurrency 8
```

### Обновление БД
1. Открыть https://supabase.com → Project `zphehhzgbudetyzezunk` → SQL Editor
2. Вставить код из `supabase/migration.sql`
3. Run

### Проверка
```bash
curl -sI https://naranja.outmilk.online
yc serverless container revision list --container-id bba12ti21lgmv9glfl7k
```

---

## Правила разработки

1. **Не использовать RLS для Storage** — загрузка через service client.
2. **Не использовать `dangerouslySetInnerHTML`** для интерактивных элементов — React не сможет управлять состоянием.
3. **Уведомления создавать только через service client** — чтобы избежать RLS политик.
4. **Проверять роль учителя через `profiles.role`** — не через `user_metadata`.
5. **Новые интерактивные блоки должны использовать `/api/submit-answer`** — чтобы создавать уведомления.

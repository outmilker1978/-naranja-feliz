# Naranja Feliz — Руководство Разработчика

## Стек

| Компонент | Технология | Аккаунт |
|-----------|-----------|---------|
| **Frontend** | Next.js 16 (App Router, Server/Client Components), React 19, Tailwind CSS 4 | — |
| **Backend** | Next.js API Routes (Route Handlers) | — |
| **База данных** | Supabase (PostgreSQL) | outmilker@gmail.com |
| **Аутентификация** | Supabase Auth (email/password) | там же |
| **Хранилище файлов** | Supabase Storage (bucket `lesson-files`) | там же |
| **Хостинг/сервер** | Vercel (Hobby Free) | outmilker@gmail.com (GitHub OAuth) |
| **CDN/DNS** | Cloudflare (Free) | outmilker@gmail.com |
| **Git** | GitHub | outmilker1978 |
| **Домен** | outmilk.online (reg.ru) | outmilker@gmail.com |

### Связи между сервисами

```
Пользователь (браузер)
    ↓
naranja.outmilk.online
    ↓
Cloudflare (CDN, прокси)  ← DNS: adel.ns.cloudflare.com / ben.ns.cloudflare.com
    ↓
Vercel (сервер, SSR)     ← GitHub push → авто-деплой
    ↓
Supabase (БД, Auth, Storage)
```

- **GitHub** → **Vercel**: push в `main` → авто-деплой
- **Vercel** → **Supabase**: подключение по URL + anon key + service role key (через переменные окружения)
- **Cloudflare** → **Vercel**: DNS-запись CNAME `naranja` → `cname.vercel-dns.com`
- **Cloudflare** → **GitHub Pages**: DNS-запись CNAME `tvhamsters` → `outmilker1978.github.io`
- **reg.ru**: NS-серверы `outmilk.online` делегированы на Cloudflare

### Переменные окружения (Vercel)

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
│   │   │   ├── courses/      # Управление курсами и уроками
│   │   │   ├── lessons/      # Редактор урока (блоки)
│   │   │   ├── stats/        # Статистика ресурсов
│   │   │   ├── submissions/  # Проверка заданий
│   │   │   └── teachers/     # Назначение учителей
│   │   ├── courses/          # Студенческая часть
│   │   ├── notifications/    # Уведомления
│   │   └── settings/         # Настройки профиля
│   ├── api/                  # Route Handlers
│   ├── auth/                 # Auth callback
│   ├── login/                # Страница входа
│   └── register/             # Страница регистрации
├── components/
│   ├── lesson-blocks/        # Рендер и редактор блоков уроков
│   │   ├── block-renderer.tsx    # Рендер всех типов блоков (студент)
│   │   └── blocks-editor.tsx     # Редактор блоков (учитель)
│   ├── dashboard-header.tsx      # Шапка с меню
│   ├── submission-thread.tsx     # Чат под ответом
│   └── orange-progress.tsx       # Дольки апельсина
└── lib/
    └── supabase/             # Клиенты Supabase
        ├── server.ts         # createClient (SSR), createServiceClient, createAdminClient
        └── client.ts         # createClient (браузер)
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

## API Endpoints

| Route | Method | Описание |
|-------|--------|----------|
| `/api/auth/login` | POST | Вход |
| `/api/auth/logout` | POST | Выход |
| `/api/auth/signup` | POST | Регистрация |
| `/api/submit-answer` | POST | Сохранить ответ + уведомить учителя |
| `/api/review-submission` | POST | Проверить ответ (учитель) |
| `/api/comments` | GET/POST | Комментарии к ответу |
| `/api/upload-file` | POST | Загрузить файл в Storage |
| `/api/upload-audio` | POST | Загрузить аудио (legacy) |
| `/api/assign-teacher` | POST | Назначить учителя |
| `/api/enroll` | POST | Записаться на курс |
| `/api/notifications` | GET/PUT | Уведомления |
| `/api/stats` | GET | Статистика (учитель) |
| `/api/fix-name` | GET/POST | Фикс имени |
| `/api/debug` | GET | Отладка |
| `/api/migrate-lesson` | POST | Миграция урока (legacy) |

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
- Структура: `{type}/{userId}/{timestamp}.{ext}`
- Поддерживаемые типы: image/*, audio/*, video/*

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
npm run dev      # Dev-сервер на localhost:3000
npm run build    # Production сборка
npm start        # Production сервер
```

---

## Правила разработки

1. **Не использовать RLS для Storage** — загрузка через service client.
2. **Не использовать `dangerouslySetInnerHTML`** для интерактивных элементов — React не сможет управлять состоянием.
3. **Уведомления создавать только через service client** — чтобы избежать RLS политик.
4. **Проверять роль учителя через `profiles.role`** — не через `user_metadata`.
5. **Новые интерактивные блоки должны использовать `/api/submit-answer`** — чтобы создавать уведомления.

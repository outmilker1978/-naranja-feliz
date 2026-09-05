# Naranja Feliz — Архитектура, инфраструктура и развёртывание

## 1. Общая архитектура

```
Пользователь (браузер)
    ↓
naranja.outmilk.online
    ↓
Yandex API Gateway (прокси)
    ↓
Yandex Serverless Container (Next.js SSR, 1GB RAM, 1vCPU)
    ↓
Yandex Serverless Container (Next.js SSR, 1GB RAM, 1vCPU)
    │
    ├──→ /api/storage/[...path] (прокси с Sharp: ресайз 1920px, JPEG q80)
    │       ↓
    │   Supabase Storage (server-to-server fetch — не блокируется провайдером)
    │
    ├──→ /api/auth/signup (admin.createUser с auto-confirm)
    ├──→ /api/auth/login (signInWithPassword + cookie)
    ├──→ /api/auth/forgot-password (resetPasswordForEmail)
    ├──→ /api/auth/update-password (updateUser)
    │
    ├──→ Supabase (PostgreSQL + Auth)
    ├──→ Supabase Storage (lesson-files bucket)
    └──→ Yandex Translate API (перевод слов на уроках)
```

## 2. Инфраструктура (Yandex Cloud)

### Организация
- **Cloud ID:** b1gnm48rbktakl54i8vb
- **Folder ID:** b1gsrqv6ri6jr7ue41fc
- **Default Zone:** ru-central1-a

### Serverless Container
- **Container ID:** bba12ti21lgmv9glfl7k
- **Название:** naranja-backend
- **Состояние:** ACTIVE
- **Ресурсы:** 1GB RAM, 1 vCPU (100%), таймаут 300s, concurrency 8
- **Образ:** `cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX`
- **Сервисный аккаунт (naranja-container-sa):** ajep2inmg605fd6ttbb2

### Container Registry
- **Registry ID:** crpusm23v7g9ch5c5t9h
- **Репозиторий:** `naranja-backend` (только он, naranja-feliz удалён)

### API Gateway
- **Спекуляция:** gateway-spec.yaml
- **Домен:** naranja.outmilk.online

### Сервисные аккаунты
1. **ajep2inmg605fd6ttbb2** (naranja-container-sa) — для контейнера
   - Роли: `container-registry.images.puller` (на registry), `serverless-containers.editor` (на контейнер)
2. **ajefscetirf01br3unuc** (naranja-github-actions) — для GitHub Actions
   - Роли: `container-registry.images.pusher` (на registry), `serverless-containers.editor` (на контейнер), `iam.serviceAccounts.user` (на container-sa)

## 3. CI/CD (GitHub Actions)

### Как работает
1. Пуш в ветку `main` → GitHub Actions
2. Установка зависимостей, сборка Next.js, сборка Docker-образа
3. Пуш образа в Yandex Container Registry
4. Создание новой ревизии Serverless Container
5. Health check (HTTP 200)

### Файл: `.github/workflows/deploy.yml`
### Файл: `.github/workflows/cron-subscription.yml` — ежедневный cron уведомлений о подписке (06:00 UTC)
### Секреты GitHub: `YC_SA_KEY_JSON`, `SUPABASE_SERVICE_ROLE_KEY`, `YANDEX_API_KEY`, `SMTP_USER`, `SMTP_PASS`, `CRON_SECRET`

Подробнее — в `docs/CI_CD_PIPELINE.md`.

## 4. Supabase
- **URL:** https://zphehhzgbudetyzezunk.supabase.co
- **План:** Free Tier
- **Ключи:** в `.env.local` и GitHub Secrets

### Таблицы
(см. `supabase/migration.sql` и `docs/ADMIN_GUIDE.md`)

## 5. Yandex Translate
- **API Key:** в `.env.local` как `YANDEX_API_KEY`
- **Folder ID:** b1gsrqv6ri6jr7ue41fc
- **Цепочка:** Yandex → DeepL (опционально) → Google → LibreTranslate → MyMemory

## 6. Прокси-роут `/api/storage/[...path]`
- **Назначение:** сервер-серверный fetch до Supabase Storage (обходит блокировки провайдера)
- **Upstream:** `https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public/{path}`
- **Поддержка signed URL:** путь `/api/storage/object/sign/{bucket}/{file}?token=...` проксирует на `/storage/v1/object/sign/{path}?token=...` (нужен для старых записей, где URL был signed)
- **Авторизация upstream:** `Authorization: Bearer <anon key>` (без него — 403 для `lesson-files/uploads/*/*.mp3`)
- **Картинки** (ext в IMG_EXTS + Sharp-параметры): патченный Next-fetch + Sharp (resize `?w`/`?q`/`?fm`, JPEG q80, 1920px max, EXIF-ориентация, WebP/AVIF по Accept), `Cache-Control: public, max-age=86400`, in-memory кэш 10 мин (`X-Storage-Cache`)
- **Не-картинки (аудио/видео/PDF):** чтение через `node:https` `rawGet`/`rawGetRetryFull` (5 попыток, backoff) — **НЕ через Next-patched fetch** (рвётся на Range-ответах апстрима, `TypeError: terminated`). Прод: буферный ответ целиком (файлы ≤8 МБ). Dev: кап любой Range >1 МБ и GET без Range до 1 МБ — плеер читает кусками; если файл материаллизован — 302 на статику
- **Dev-медиа (`/_media/`):** `<audio>/<video>` в dev идут НЕ на динамический маршрут (dev-сервер не доставляет тело dynamic-route ответа для `Accept-Encoding: identity`, одинаково для 200/206/302), а на статический `/api/dev/media` + `scripts/materialize-media.mjs` (материаллизация кусками 1 МБ, retry 6, отдельный node-процесс) → файл кладётся в `public/_media/<basename>` (gitignored) и отдаётся статикой Next (любой Range за ~7 мс). Фронт: `src/components/lesson-blocks/media-asset.tsx` (`MediaAsset`) в dev направляет src на `/_media/<basename>`, в прод — на прокси
- **Прочее:** не-image файлы (видео, аудио, PDF) — passthrough без изменений (прод)
- **Отладка сборки:** `/api/dev/media` — dev-only (в проде 404)

## 7. Оптимизация изображений на фронтенде (next/image + StorageImage)
- Компонент `StorageImage` (`src/components/storage-image.tsx`, обёртка над next/image) — для контентных картинок из Supabase Storage.
- Storage-URL (public и signed) автоматически переписываются в прокси-путь `/api/storage/...` (`toProxyPath`/`isProxyable`); responsive srcset (`?w=256..2560`), ленивая загрузка, `priority` там где надо, защита от layout-shift (fill/пропорции).
- Всё остальное (внешние hotlink-и: Google Drive / Яндекс.Диск, gif, svg, локальные ассеты `/logo-128.png`) fallback на обычный `<img>` (`raw`) — через прокси не гоняется.
- `next.config.ts`: `images.loader: "custom"` (loader → `/api/storage`), `images.formats: ["image/avif","image/webp"]`.
- `upload-file` больше **не создаёт signed URL** — возвращает public URL (`/object/public/`), бакет `lesson-files` публичный.
- Распространено на все публичные страницы: главная, catalog, content/[id], reviews, about, teachers, teachers/[id], content-carousel, слайдшоу, CTA.
- Тяжёлые клиентские библиотеки (editor/ProseMirror, recharts) подтверждены **вне публичного пути** — route-splitting не тянет их на лендинг.

## 8. Auth (авторизация)
- **Регистрация:** `POST /api/auth/signup` → `admin.createUser({ email_confirm: true })` → сразу вход
- **Вход:** `POST /api/auth/login` → `signInWithPassword()` → установка cookie через `pendingCookies`
- **Выход:** `POST /api/auth/logout` → очистка сессии
- **Сброс пароля:** `/forgot-password` → `resetPasswordForEmail()` → письмо → `/auth/callback` → `/reset-password` → `updateUser()`
- **Auth callback:** `/auth/callback` → `exchangeCodeForSession()` → редирект на NEXT_PUBLIC_SITE_URL (не на request.url)
- **Текущий пользователь (BFF):** `GET /api/auth/me` → возвращает `{ user: { id, email, user_metadata } }` из серверной сессии (куки). Используется **клиентскими** страницами/компонентами вместо браузерного `supabase.auth.getUser()`. Это убирает прямой вызов Supabase из браузера → нет зависаний на медленных сетях, и задаёт направление **BFF** (Frontend ходит в наш API, не в Supabase напрямую).

### Закалка соединений к Supabase (надёжность)
- На **всех серверных** Supabase-клиентах (`createClient/createAdminClient/createServiceClient`, `middleware.ts`, auth-роуты, `tools-panel-wrapper`) применяется `supabaseFetch` из `lib/supabase/server.ts` — обёртка, форсирующая `Connection: close` на каждом запросе.
- **Зачем:** долгоживущий процесс накапливает «протухшие» keep-alive сокеты к Supabase → случайный запрос зависал на 20–70с (особенно в dev и на медленных сетях). `Connection: close` не даёт переиспользовать протухшие сокеты → стабильность.
- **Ограничение:** это закалка надёжности, а не оптимум. Правильнее — настроить undici Agent (keepAliveTimeout) и **сократить число последовательных запросов** (см. направление B + RPC). Для низкого трафика текущее решение приемлемо.

### Направление BFF (важно для Android)
- Браузер/мобильный клиент **не должен** ходить в Supabase напрямую (анон-ключ + зависания). Все данные — через наш Next-API (`/api/*`), сервер — единственный, кто знает секреты.
- Контентные страницы (уроки, курсы) уже собираются на сервере. Клиентские сценарии, которым нужен `getUser`, переводятся на `/api/auth/me`.

## 9. ЮKassa
- **Статус:** НЕ НАСТРОЕНА
- **shop_id / secret_key:** ожидаются от менеджера ЮKassa

## 10. GitHub
- **Репозиторий:** https://github.com/outmilker1978/-naranja-feliz.git
- **Ветка:** main (единственная, защищённая)

## 11. .env.local (локальная разработка)
```
NEXT_PUBLIC_SUPABASE_URL=https://zphehhzgbudetyzezunk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (реальный — только в .env.local, не коммитить, убрано из доков по гигиене) 
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3100
YANDEX_API_KEY=...
YANDEX_FOLDER_ID=b1gsrqv6ri6jr7ue41fc
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=naranja-feliz@yandex.ru
SMTP_PASS=<пароль приложения Яндекс, созданный в id.yandex.ru/security/app-passwords>
SMTP_FROM=naranja-feliz@yandex.ru
CRON_SECRET=<случайная строка для защиты cron endpoint>
YOO_KASSA_SHOP_ID=
YOO_KASSA_SECRET_KEY=
```

## 12. Локальная разработка
```bash
npm install
npm run dev      # localhost:3100
npm run build    # production сборка (output: standalone)
```

## 13. Сжатие изображений
- **При загрузке:** Sharp (JPEG mozjpeg q82, PNG→WebP, ресайз >1920px), fallback при ошибке
- **Пакетное:** `scripts/compress-storage.mjs` — прошёлся по всем bucket-файлам >300KB
- **Через прокси:** `/api/storage/[...path]` — Sharp на лету (JPEG q80, 1920px)

## 14. Тестовые аккаунты
- Учитель и ученик — в Supabase Auth, roles в `profiles`

## 15. Система блоков контента портала

### Типы блоков
- **page_section** — статичные секции главной: hero (locked), features, about, testimonials, faq, cta (locked). Каждая — одна запись в `content` с `type=page_section` и `category`.
- **news** — коллекция новостей (одна запись = одна новость), группируются в блок "Новости".
- **article** / **ad** — динамические блоки из `content_blocks` таблицы, содержат ссылки на записи в `content`.

### Порядок блоков
- **Админка:** `buildSectionBlocks` → STATIC_BLOCK_DEFS (features→about→testimonials→faq→news) + content_blocks, сортировка: hero first, cta last, остальное по `sort_order`.
- **Портал (page.tsx):** Hero → Courses → Features → About → Testimonials → FAQ → News → Article/Ad блоки → CTA. Каждой секции присваивается `order` (sort_order из БД для page_sections/content_blocks, Infinity для CTA).

### Реордер блоков (`moveBlock`)
1. Копируется массив `sectionBlocks`, меняются местами два соседних блока.
2. locked-блоки (hero, cta) исключаются из перенумерации.
3. Все unlocked-блоки получают `sort_order = index × 1000`.
4. Статики обновляются через `/api/content/reorder`, динамики — через `/api/content-blocks/reorder`.
5. После сохранения — `fetchAll()` перегружает данные с сервера.

### Реордер внутри блока (`moveItemInBlock`)
- Все items блока получают последовательные sort_order (0, 1, 2...) через `/api/content/reorder`.

## 16. Важные файлы
| Файл | Назначение |
|------|-----------|
| `Dockerfile` | Многостадийная сборка Next.js (standalone) |
| `gateway-spec.yaml` | API Gateway routes |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `supabase/migration.sql` | Схема и миграции БД |
| `next.config.ts` | output: "standalone" |
| `.dockerignore` | Исключения для Docker |
| `src/proxy.ts` | Middleware (Next.js 16 proxy convention) |
| `src/lib/image-proxy.ts` | Утилита замены URL на прокси-роут |
| `src/app/api/storage/[...path]/route.ts` | Proxy-роут с Sharp |
| `src/app/api/auth/signup/route.ts` | Регистрация с auto-confirm |
| `src/app/api/auth/login/route.ts` | Серверный вход |
| `src/app/api/auth/forgot-password/route.ts` | Сброс пароля |
| `src/app/api/auth/update-password/route.ts` | Обновление пароля |
| `src/app/auth/callback/route.ts` | Auth callback |
| `scripts/compress-storage.mjs` | Пакетное сжатие фото в Storage |
## 17. TipTap Editor Extensions

Текстовые блоки уроков используют TipTap редактор (`tiptap-editor.tsx`). Зарегистрированные расширения:

| Расширение | Тип | Роль |
|-----------|-----|------|
| `StarterKit` | Бандл | Параграфы, заголовки, списки, форматирование |
| `Underline` | Mark | Подчёркивание |
| `LinkExtension` | Mark | Ссылки |
| `ResizableImage` | Node (React NodeView) | `<img>` с ресайзом, выравнивание через TextAlign |
| `TranslationMark` | Mark | Разметка `data-translate` для перевода |
| `OrangeDividerExtension` | Node (React NodeView) | Декоративный разделитель (SVG) |
| `Placeholder` | Extension | Плейсхолдер редактора |
| `TextAlign` | Extension | Выравнивание текста и изображений (`types: ["heading", "paragraph", "image"]`) |

Два кастомных NodeView используют `ReactNodeViewRenderer` — в редакторе рендерятся React-компонентами, в сохранённом HTML (`editor.getHTML()`) сериализуются через `renderHTML()`.

## 18. Per-course доступ

### Схема работы
1. Студент видит курс с бейджем «По запросу» → нажимает «Запросить доступ у учителя»
2. Учитель получает уведомление со ссылкой на учительскую с открытой модалкой студента
3. Учитель выбирает курс(ы) и срок → «Выдать доступ»
4. API создаёт запись в course_access + автоматически upsert в enrollments
5. Студент получает уведомление → переходит в список курсов → курс уже с прогрессом и уроками

### API Endpoints (новые)
| Endpoint | Метод | Назначение |
|----------|-------|-----------|
| /api/course-access/request | POST | Студент запрашивает доступ (уведомление учителям/админам) |
| /api/course-access/grant | POST | Учитель выдаёт доступ (course_access + enrollments) |
| /api/course-access/check?courseId=X | GET | Проверка доступа (через RPC check_course_access) |
| /api/course-access/student-courses?studentId=X | GET | Список выданных доступов ученика (для модалки) |
| /api/course-access/revoke | POST | Отзыв доступа (удаление course_access + enrollment) |

### Таблицы БД
- **course_access** — student_id, course_id, granted_by, granted_at, expires_at, eason
- **profiles** — добавлено поле subscription_requested_at (timestamp)

### Owner bypass
Создатель курса (`created_by`) всегда имеет доступ — `check_course_access` не вызывается если `user.id === course.created_by`. Реализовано в:
- `courses/[courseId]/page.tsx` — `isOwner` пропускает проверку
- `courses/page.tsx` — `ownedIds` добавляются к списку доступных курсов
- `api/course-access/check/route.ts` — проверка `course.created_by === user.id` → `{ hasAccess: true }`

### RPC
- check_course_access(uid uuid, cid uuid) — возвращает true если есть действующая запись в course_access (expires_at IS NULL OR expires_at > now())

### Фронтенд
- CourseAccessControl — модалка выдачи/отзыва доступа в учительской
- RequestAccessButton — кнопка запроса доступа на странице курса
- EnrollButton — при 403 (доступ ограничен) меняет текст на «Запросить доступ у учителя»
- Страницы: orce-dynamic для актуальности данных

### Важные файлы (дополнительно)
| Файл | Назначение |
|------|-----------|
| src/app/api/course-access/request/route.ts | Запрос доступа |
| src/app/api/course-access/grant/route.ts | Выдача доступа + auto-enrollment |
| src/app/api/course-access/check/route.ts | Проверка доступа |
| src/app/api/course-access/student-courses/route.ts | Список доступов ученика |
| src/app/api/course-access/revoke/route.ts | Отзыв доступа |
| src/app/(dashboard)/admin/teachers/course-access-control.tsx | Модалка выдачи |
| src/app/(dashboard)/courses/[courseId]/request-access-button.tsx | Кнопка запроса |
| src/app/(dashboard)/courses/enroll-button.tsx | Умная кнопка (403→запрос) |

## 19. Подписка и уведомления

### Статусы подписки
- `profiles.subscription_until` — дата окончания. NULL = подписки нет.
- `profiles.credit_days` — кредит (дни в долг от школы, погашается оплатой).
- `subscription_credit_history` — история операций (gift/credit/payment/writeoff/close).
- `check_subscription(uid)` RPC — true если `subscription_until > now()`.

### Уведомления о подписке
- **Стадии:** за 5 дней, за 1 день, «закончилась».
- **Механика:** единый модуль `src/lib/subscription-reminders.ts`:
  - `getReminderStage(daysLeft)` — текст для сайта (title/body/link → `/settings`) и email (subject/text → `/pricing`).
  - `ensureSubscriptionReminder()` — дедупликация по `title+body` (сайт) и по таблице `subscription_email_log` (email, retry при сбое SMTP).
  - `sendSubscriptionEmail()` — nodemailer через SMTP Яндекс, ошибки логируются в console.error.
- **Запуск:**
  1. **Мгновенно при входе** — `SubscriptionCheckOnLogin` в `(dashboard)/layout.tsx` → GET `/api/subscription/check` (emailMode "only-on-create").
  2. **Ежедневный cron** — `/api/cron/subscription-expiry` (защищён CRON_SECRET), вызывается GitHub Actions `cron-subscription.yml` (06:00 UTC, emailMode "always").

### Таблица subscription_email_log
- `user_id`, `stage` (in_5_days / in_1_day / expired), `UNIQUE(user_id, stage)`.
- Нужна для повторной отправки письма: если SMTP упал в первый раз, письмо уйдёт при следующем запуске.

### Ключевые файлы
| Файл | Назначение |
|------|-----------|
| src/lib/subscription-reminders.ts | Логика уведомлений + email |
| src/app/api/subscription/check/route.ts | Мгновенная проверка при входе |
| src/app/api/cron/subscription-expiry/route.ts | Cron уведомлений |
| src/app/api/subscription/extend/route.ts | Выдача подарка/кредита/списание |
| src/app/api/subscription/credit-history/route.ts | История операций |
| src/app/api/subscription/request-extend/route.ts | Запрос продления |
| src/app/(dashboard)/settings/credit-history.tsx | История кредита для ученика |
| src/components/subscription-check-on-login.tsx | Клиентский хук при входе |

## 20. Директор школы
- `profiles.is_director` — флаг (ставит админ, только один директор).
- Запрос продления подписки → директору (если есть), иначе первому учителю.
- Запрос доступа к курсу → директору (если есть), иначе всем учителям.
- `src/lib/director.ts` + `src/app/api/set-director/route.ts`.

## 21. RPC-агрегация (этап B1 оптимизации, v0.7.2)
Серверные страницы получают данные **одним вызовом** Postgres-функции вместо 6–12 последовательных запросов (51→5). Функции в `supabase/rpc-aggregation.sql` (применён в Supabase):

| Функция | Страница | Было запросов | Стало |
|---------|----------|:---:|:---:|
| `get_home_data(uid)` | Главная `/` | 10 | 1 |
| `get_course_page(uid, cid)` | Курс `/courses/[courseId]` | 6 | 1 |
| `get_lesson_page(uid, cid, lid)` | Урок `/courses/[courseId]/[lessonId]` | 12 | 1 |
| `get_course_list(uid)` | Список `/courses` | 9 | 1+1 |
| `get_chat_data(uid)` | Чат `/tools/chat` | 5–7 | 1 (v0.8.0, см. §23) |

- Все функции — `SECURITY DEFINER` (`SET search_path='public'`), принимают `uid` и проверяют доступ внутри SQL.
- Логика редиректов сохранилась: неопубликованный урок видит только владелец (`@page.tsx:42-44`), отсутствие доступа → редирект на `/courses`.
- Индексы: `lesson_blocks(lesson_id, order_index)`, `enrollments(student_id)`, `course_access(student_id)`, `lesson_progress(student_id, lesson_id)`, `content(type,status,sort_order)`, `chat_messages(chat_id, created_at)` и др. — 14 штук.
- Обновление функции после правки SQL: перезапустить `CREATE OR REPLACE FUNCTION ...` в Supabase SQL Editor.

## 22. Фиксы UX (v0.7.3)

### `<Avatar>` — единый аватар (`src/components/avatar.tsx`)
- Все аватары (шапка, настройки, чат, уведомления, учительская, проверка) идут через компонент `<Avatar>`:
  - URL через прокси `/api/storage` с `?w={size}&q=65&fm=webp` (маленький вес).
  - Если картинка не грузится (`onError`) — показывается первая буква имени (fallback).
- Заменил сырые `<img>` в: `user-menu`, `dashboard-header`, `settings-form`, `tools/chat`, `notifications`, `admin/teachers/profile-list`, `admin/submissions/submissions-list`, `admin/courses/[courseId]`, `content/[id]`, `submission-thread`.

### Кэш картинок в прокси (`src/app/api/storage/[...path]/route.ts`)
- In-memory кэш обработанных картинок: `Map` (ключ — URL), TTL 10 мин, лимит 500 записей, LRU-evict.
- Повторный запрос того же URL → `X-Storage-Cache: hit` (не повторяет sharp/fetch).
- Ответы с `Cache-Control: public, max-age=86400, s-maxage=86400, immutable` — браузер не перекачивает.

### RPC `clear_lesson_answers(student_id, lesson_id)` (`supabase/rpc-aggregation.sql`)
- Удаляет ответы блока (`block_submissions`) + прогресс урока (`lesson_progress`) в **одной транзакции**.
- Кнопка «Очистить ответы» (`clear-answers-button.tsx`): 1 вызов RPC + `router.refresh()` (без полной перезагрузки страницы).
- Раньше было 2 клиентских запроса + `window.location.reload()` — урок с 13 блоками вис висел ~1 мин.

### Доступ к черновикам уроков
- `page.tsx` урока: редирект для неопубликованных уроков пропускает `isAdmin` и владельца курса.
- RPC `get_course_page`: список уроков фильтрует черновики (`published OR админ OR владелец`).

### Статистика
- `/api/stats` — `revalidate = 0` + `Cache-Control: no-store` (были устаревшие цифры из кэша).

## 23. Скорость дашборда (v0.8.0, задеплоен — `73e60ff` → `deploy-1788547720`)

### Чат на 1 запрос (`/api/chat/init`)
- `src/app/api/chat/init/route.ts`: `POST` → RPC `get_chat_data(uid)` (профиль, учителя, история, подписка в одной транзакции). Если RPC упал — fallback `legacyInit()` на старой клиентской логике (чат не ломается).
- `tools/chat/page.tsx`: начальная загрузка одним `fetch("/api/chat/init")` вместо `/api/auth/me` + `/api/chat/teachers` + `/api/chat`.

### Дедупликация сессии на дашборде (`src/lib/auth-cache.ts`)
- `getServerClient()` — `React.cache()`-обёртка над `createClient()`: **1 Supabase-клиент на HTTP-запрос**.
- `getCurrentUser()` — `React.cache()`-обёртка над `auth.getUser()` + `profiles`: **1 `getUser` + 1 `profiles` на запрос** (было: 3×`getUser` в layout + 2×`profiles` в страницах, которые дублировали друг друга).
- Переведены: `(dashboard)/layout.tsx`, курсы (список/курс/урок), `settings`, `admin/teachers`, `admin/submissions`, `admin/courses/[courseId]`, `admin/lessons/[lessonId]` (для RLS-запросов — `getServerClient()`), `tools/chat`.
- Client-страницы (`admin/stats`, `admin/history`, `admin/content*`, `admin/courses/new`) используют `@/lib/supabase/client` — не затронуты.

### B7 (кэш публичных страниц) — объяснение, почему не сделано
- `export const revalidate = 60` на публичные страницы (catalog/content/reviews/about/teachers) **не даёт ISR**: страницы остаются `ƒ Dynamic`, т.к. `supabaseFetch` (`server.ts`) делает обычный `fetch` без `next:{revalidate}`.
- Включение revalidate при данных из cookies/авторизации рискованно (устаревший контент учителя). Отклонено на сессии 04.09.2026.
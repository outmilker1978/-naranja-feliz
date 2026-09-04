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
- **Query-параметры сжатия:** `?w` (ширина), `?q` (качество), `?fm` (формат) — используются next/image srcset
- **Обработка изображений:** Sharp resize (fit inside, без увеличений) + JPEG quality + `sharp.rotate()` (EXIF-ориентация)
- **Content-Type:** принудительно `image/jpeg` для изображений (Supabase отдаёт `text/plain`)
- **Accept-negotiation:** отдаёт WebP/AVIF если браузер поддерживает (+`Vary: Accept`)
- **Кэш:** `Cache-Control: public, max-age=86400`
- **Fallback:** не-image файлы (видео, аудио, PDF) — passthrough без изменений

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
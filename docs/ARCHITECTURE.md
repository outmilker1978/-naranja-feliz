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
Supabase (PostgreSQL + Auth + Storage)
    ↓
Yandex Translate API (перевод слов на уроках)
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
### Секреты GitHub: `YC_SA_KEY_JSON`, `SUPABASE_SERVICE_ROLE_KEY`, `YANDEX_API_KEY`

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

## 6. ЮKassa
- **Статус:** НЕ НАСТРОЕНА
- **shop_id / secret_key:** ожидаются от менеджера ЮKassa

## 7. GitHub
- **Репозиторий:** https://github.com/outmilker1978/-naranja-feliz.git
- **Ветка:** main (единственная, защищённая)

## 8. .env.local (локальная разработка)
```
NEXT_PUBLIC_SUPABASE_URL=https://zphehhzgbudetyzezunk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Uyz3DPUyEZFkfXzDTOUiJg_aupb397O
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3100
YANDEX_API_KEY=...
YANDEX_FOLDER_ID=b1gsrqv6ri6jr7ue41fc
YOO_KASSA_SHOP_ID=
YOO_KASSA_SECRET_KEY=
```

## 9. Локальная разработка
```bash
npm install
npm run dev      # localhost:3100
npm run build    # production сборка (output: standalone)
```

## 10. Тестовые аккаунты
- Учитель и ученик — в Supabase Auth, roles в `profiles`

## 11. Система блоков контента портала

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

## 12. Важные файлы
| Файл | Назначение |
|------|-----------|
| `Dockerfile` | Многостадийная сборка Next.js (standalone) |
| `gateway-spec.yaml` | API Gateway routes |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `supabase/migration.sql` | Схема и миграции БД |
| `next.config.ts` | output: "standalone" |
| `.dockerignore` | Исключения для Docker |
| `src/proxy.ts` | Middleware (Next.js 16 proxy convention) |

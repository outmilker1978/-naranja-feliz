# Naranja Feliz — Архитектура, инфраструктура и развёртывание

## 1. Общая архитектура

```
Пользователь (браузер)
    ↓
naranja.outmilk.online
    ↓
Yandex API Gateway (прокси)
    ↓
Yandex Serverless Container (Next.js SSR)
    ↓
Supabase (PostgreSQL + Auth + Storage)
```

## 2. Инфраструктура (Yandex Cloud)

### Организация
- **Cloud ID:** b1gnm48rbktakl54i8vb
- **Folder ID:** b1gsrqv6ri6jr7ue41fc
- **Default Zone:** ru-central1-a
- **Вход:** через Yandex ID (outmilker@gmail.com) — AI Studio / Console

### Serverless Container
- **Container ID:** bba12ti21lgmv9glfl7k
- **Название:** naranja-backend
- **Состояние:** ACTIVE
- **Ресурсы:** 1GB RAM, 1 vCPU (100% fraction)
- **Таймаут:** 300s, **Concurrency:** 8
- **Образ:** `cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX`
- **Сервисный аккаунт:** ajep2inmg605fd6ttbb2

### Container Registry
- **Registry ID:** crpusm23v7g9ch5c5t9h
- **Репозитории:**
  - `naranja-backend` — текущий активный (deploy-016, 11.07.2026)
  - `naranja-feliz` — предыдущие сборки

### API Gateway
- **Спекуляция:** gateway-spec.yaml (в корне проекта)
- **Домен:** naranja.outmilk.online
- **Тип:** serverless_containers → container bba12ti21lgmv9glfl7k

### Сервисные аккаунты
1. **ajep2inmg605fd6ttbb2** — для контейнера (доступ к реестру)
2. **ajefscetirf01br3unuc** — для GitHub Actions (роли: container-registry.images.pusher, serverless-containers.editor, viewer)

### Платежи
- Бесплатные квоты Yandex Cloud: Serverless Containers (10GB/мес трафика), Container Registry (1GB)

## 3. Supabase

- **URL:** https://zphehhzgbudetyzezunk.supabase.co
- **Аккаунт:** outmilker@gmail.com
- **План:** Free Tier

### Ключи (в .env.local)
| Переменная | Описание |
|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (обходит RLS) |

### Таблицы
(см. supabase/migration.sql и docs/ADMIN_GUIDE.md)

## 4. Yandex Translate
- **API Key:** в .env.local `YANDEX_API_KEY`
- **Folder ID:** b1gsrqv6ri6jr7ue41fc (тот же что и cloud folder)
- **Цепочка:** Yandex → DeepL (опционально) → Google → LibreTranslate → MyMemory

## 5. YooKassa (ЮKassa)
- **Статус:** НЕ НАСТРОЕНА
- **Переменные:** `YOO_KASSA_SHOP_ID`, `YOO_KASSA_SECRET_KEY` — пустые
- **Необходимо:** зарегистрироваться в ЮKassa, получить shop_id и секретный ключ

## 6. GitHub
- **Репозиторий:** https://github.com/outmilker1978/-naranja-feliz.git
- **Ветка:** main
- **Аккаунт:** outmilker1978

## 7. Деплой

### Через GitHub Actions (рекомендуемый способ)
1. Убедиться что секрет `YC_SA_KEY_JSON` есть в GitHub → Settings → Secrets and variables → Actions
2. Пуш в ветку `main` → автоматический деплой
3. Либо ручной запуск: GitHub → Actions → Deploy to Yandex Cloud → Run workflow

### Вручную (Docker на локальной машине)
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

### Проверка деплоя
```bash
curl -sI https://naranja.outmilk.online
yc serverless container revision list --container-id bba12ti21lgmv9glfl7k
```

### Обновления БД
1. Открыть https://supabase.com → Project → SQL Editor
2. Вставить код из supabase/migration.sql
3. Run

## 8. .env.local (локальная разработка)

```
NEXT_PUBLIC_SUPABASE_URL=https://zphehhzgbudetyzezunk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Uyz3DPUyEZFkfXzDTOUiJg_aupb397O
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx
NEXT_PUBLIC_SITE_URL=https://naranja.outmilk.online
YANDEX_API_KEY=AQVNxxxxx
YANDEX_FOLDER_ID=b1gsrqv6ri6jr7ue41fc
YOO_KASSA_SHOP_ID=
YOO_KASSA_SECRET_KEY=
```

## 9. Локальная разработка
```bash
npm install
npm run dev      # localhost:3100 (настроено в package.json)
npm run build    # Production сборка (output: standalone)
```

## 10. Тестовые аккаунты
- **Учитель:** создан в Supabase Auth, роль `teacher` в `profiles`
- **Ученик:** создан в Supabase Auth, роль `student` в `profiles`
- Переключение режима просмотра: профиль → переключатель Учитель/Ученик

## 11. Важные файлы
| Файл | Назначение |
|------|-----------|
| `Dockerfile` | Сборка Docker образа для Yandex Serverless Containers |
| `gateway-spec.yaml` | Конфиг API Gateway Yandex Cloud |
| `.github/workflows/deploy.yml` | CI/CD деплой через GitHub Actions |
| `supabase/migration.sql` | Схема БД |
| `next.config.ts` | `output: "standalone"` — для Docker |

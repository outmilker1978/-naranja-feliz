# CI/CD Pipeline — Naranja Feliz

## Схема деплоя

```
ЛОКАЛЬНО (твой ПК — разработка)
    │
    ├── 1. Пишешь код (новые фичи, исправления)
    ├── 2. Тестируешь локально (npm run dev)
    ├── 3. Если менял БД → Supabase Studio → SQL Editor (вручную)
    │
    └── 4. git add → git commit → git push origin main
                              │
                              ▼
                ╔══════════════════════════╗
                ║   GitHub Actions         ║
                ║   (бесплатно, ~2 мин)    ║
                ╚══════════════════════════╝
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                    ▼
    ┌──────────┐      ┌──────────────┐     ┌──────────┐
    │ npm ci   │      │  next build  │     │ docker   │
    │ (зависим)│      │  (сборка     │     │ build    │
    └──────────┘      │   фронта)    │     └────┬─────┘
                      └──────────────┘          │
                                                ▼
                                   ╔══════════════════════════╗
                                   ║ Yandex Container Registry║
                                   ║ (хранилище образов)      ║
                                   ║ ~0.05₽/ГБ/мес           ║
                                   ╚══════════════════════════╝
                                                │
                                                ▼
                                   ╔══════════════════════════╗
                                   ║ Yandex Serverless        ║
                                   ║ Container (новая         ║
                                   ║ ревизия)                 ║
                                   ║ ~0₽ в квотах             ║
                                   ╚══════════════════════════╝
                                                │
                                                ▼
                                   ╔══════════════════════════╗
                                   ║ Yandex API Gateway       ║
                                   ║ naranja.outmilk.online   ║
                                   ║ ~0₽ (100k запросов/мес)  ║
                                   ╚══════════════════════════╝
                                                │
                                                ▼
                                      ПОЛЬЗОВАТЕЛИ (сайт)
```

## Параллельный сервис: База данных

```
Supabase (PostgreSQL) — живёт отдельно, НЕ через GitHub Actions

Изменения БД → вручную через Supabase Studio → SQL Editor
```

## Пошаговый план действий

### Когда ты сделал новую фичу / починил баг:

1. **Разработка на локальном ПК**
   - `npm run dev` — проверяешь что работает
   - Если менял БД — SQL скрипт кладёшь в `supabase/migration.sql`

2. **Если менялась БД** (новая таблица, колонка, политика RLS):
   - Открыть https://supabase.com → Project → SQL Editor
   - Вставить код из `supabase/migration.sql`
   - Нажать **Run**

3. **Пуш в GitHub**
   ```bash
   git add .
   git commit -m "что сделано"
   git push origin main
   ```

4. **GitHub Actions делает всё автоматом:**
   - Установка зависимостей (npm ci)
   - Сборка Next.js (next build)
   - Сборка Docker-образа
   - Пуш образа в Yandex Container Registry
   - Создание новой ревизии контейнера
   - Health check (проверка что сайт отвечает 200)

5. **Готово** — через ~2 минуты сайт обновлён

## Стоимость каждого действия

| Этап | Сервис | Цена |
|------|--------|------|
| Сборка | GitHub Actions (2000 мин/мес бесплатно) | **0 ₽** (тратим ~2 мин на пуш) |
| Хранение образа | Yandex Container Registry | **~0.05 ₽/ГБ/мес** (образ ~300МБ = копейки) |
| Запуск контейнера | Yandex Serverless Containers | **0 ₽** (бесплатные квоты: 10 ГБ трафика, 1000 CPU-часов) |
| API Gateway | Yandex API Gateway | **0 ₽** (100 000 запросов/мес бесплатно) |
| База данных | Supabase Free Plan | **0 ₽** (500 МБ БД, 1 ГБ Storage, 50K пользователей) |

**Итого:** стоимость поддержки — около **0–1 ₽ в месяц** при текущем объёме.

## Как чистить старые образы (чтобы не платить)

Каждый пуш создаёт новый образ с тегом `deploy-{timestamp}`. Старые накапливаются и занимают место в Registry.

**Когда чистить:** раз в 1-2 недели, или когда тегов стало >10.

**Команда:**
```bash
# Показать все теги
yc container image list --repository-name cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend

# Удалить всё кроме 2 последних
# (делает opencode по команде "почисти registry")
```

**Правило:** оставлять 2 последних тега (текущий + предыдущий — для отката).

## Откат на предыдущую версию

В Yandex Cloud Console:
1. Serverless Containers → naranja-backend
2. Вкладка **Revisions**
3. Найти предыдущую активную ревизию
4. Нажать **Make active**

Или через CLI:
```bash
yc serverless container revision deploy --container-id bba12ti21lgmv9glfl7k \
  --image cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX \
  --service-account-id ajep2inmg605fd6ttbb2
```

## Переменные окружения (секреты)

### В GitHub Secrets (настройки репозитория → Secrets and variables → Actions)
| Secret | Зачем |
|--------|-------|
| `YC_SA_KEY_JSON` | Сервисный ключ Yandex Cloud для деплоя |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role Supabase (обходит RLS) |
| `YANDEX_API_KEY` | API ключ Yandex Translate |

### В .env.local (локально на ПК для разработки)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3100
YANDEX_API_KEY=...
YANDEX_FOLDER_ID=...
```

## Полезные ссылки

| Ресурс | Ссылка |
|--------|--------|
| GitHub репозиторий | https://github.com/outmilker1978/-naranja-feliz |
| GitHub Actions (лог деплоя) | https://github.com/outmilker1978/-naranja-feliz/actions |
| Yandex Cloud Console | https://console.yandex.cloud/folders/b1gsrqv6ri6jr7ue41fc |
| Yandex Serverless Containers | https://console.yandex.cloud/folders/b1gsrqv6ri6jr7ue41fc/serverless-containers |
| Supabase Dashboard | https://supabase.com/dashboard/project/zphehhzgbudetyzezunk |
| Сайт (прод) | https://naranja.outmilk.online |

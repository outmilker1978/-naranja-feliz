<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:user-rules -->
# Правила пользователя (Denis Brel)

## Как давать задачи
- Задачи формулируются кратко, по делу, без лишних слов
- Ответ должен быть по существу, без пояснений кода
- Если не уверен — спроси, не делай предположений

## ГЛАВНОЕ ПРАВИЛО: НИЧЕГО БЕЗ РАЗРЕШЕНИЯ
- **Любой пуш в main / деплой / коммит — ТОЛЬКО после команды «давай», «делай», «залей», «деплой»**
- Новые файлы, изменения инфраструктуры, переезды — только с одобрения
- Если не уверен что можно — спроси. Всегда.

## Золотое правило
**НЕ ЛОМАТЬ СТАРОЕ ПРИ ДОБАВЛЕНИИ НОВОГО**
- Перед изменением существующей функции/компонента — прочитай весь код, пойми все зависимости
- Если переписываешь — сохрани старый функционал, не регрессируй
- После любых изменений — проверь что всё смежное работает (ссылки, кнопки, переходы)
- Для интерактивных блоков (DragOrder и т.п.) — протестируй в браузере после изменений


## Чек-лист деплоя (СТРОГО)
Перед любым коммитом/деплоем — проверить все пункты:

□ 1. Разработка + тестирование готово
□ 2. Обновлены docs:
   □ DEVELOPER_GUIDE.md — для разработчика (чтобы не обнулиться)
   □ ADMIN_GUIDE.md — для администратора/учителя
   □ USER_GUIDE.md — для ученика/пользователя
   □ RELEASE_NOTES.md — что нового
   □ ARCHITECTURE.md — схема, endpoints, таблицы, инфра
□ 3. Порядок в проекте: мусор почищен, YCR — 2 последних тега
□ 4. Коммит + тег deploy-{epoch}
□ 5. Пуш + деплой

**Порядок не нарушать. Сначала docs, потом деплой.**

## Тестирование
- Минимальное количество шагов для максимального покрытия
- Приоритет: критические пути (вход, переходы, отправка ответов, проверка)
- После исправлений — дать краткий тест-кейс (3-5 шагов)

## Коммуникация
- Писать кратко, по делу
- Если ошибка — сразу указать что не работает и как исправить
- Не тратить время на объяснения кода — только результат
- В тест-кейсах и инструкциях **обязательно давать прямые ссылки** (http://localhost:3000/...) на страницы
- **Если прошу пользователя что-то сделать — ТОЛЬКО с кликабельными полными ссылками, пошаговой инструкцией и ожидаемым результатом каждого шага.**
- **НЕ ДЕПЛОИТЬ БЕЗ ПОДТВЕРЖДЕНИЯ. Деплой только после команды "деплой" или "залей". Каждый деплой стоит денег.**

## Золотое правило 2: ГИГИЕНА ПРОЕКТА (поддерживать порядок)
**Цикл работы:** Анализировать → Обновлять/Разрабатывать → Описывать (docs) → Наводить порядок → к следующему циклу.

- **После каждого релиза** — чистить Yandex Container Registry: оставить только deploy-XXX (текущий) + deploy-YYY (предыдущий), удалить все untagged/старые образы.
- **После каждой сессии разработки** — удалить мусор: `.next/dev/` (3.5 ГБ кэша), пустые dev-лог-файлы, неиспользуемые скрипты.
- **В облаке:** Yandex CR держать 2 последних тега. Старые репозитории (naranja-feliz) удалять при переезде.
- **Локально:** `docker image prune` после серии сборок. `npm cache clean` не нужен (мало весит).
- **Файлы проекта:** не коммитить .docx, .ps1 дубликаты, бинарные артефакты. Удалять мёртвый код.
- **Перед пушем:** проверить что в коммит не попали реальные ключи/секреты.
- **Документация:** после каждой чистки — обновить ARCHITECTURE.md (размер/состав реестра) и RELEASE_NOTES.md.

## Технические требования
- Два аккаунта для тестирования: учитель + ученик (не только плзунок режима)
- Переключатель «Учитель/Ученик» в профиле — только для просмотра, не для полного цикла
- Проверять уведомления, чат, проверку ответов между двумя аккаунтами

## Документация
- В начале сессии (после обнуления) — **прочитать `docs/ARCHITECTURE.md`** и всю `AGENTS.md` для ориентации
- **После каждого согласованного изменения** — обновить `docs/ARCHITECTURE.md` (инфраструктура, endpoints, ключи)
- **После каждого успешного релиза/деплоя** — обновить `docs/RELEASE_NOTES.md` и `docs/ARCHITECTURE.md`

## Подписка в настройках
- На `/settings` добавлена секция Подписка для студентов: статус (активна/неактивна/запрос отправлен) + кнопка "Запросить продление"
- Данные приходят из серверного компонента (profile через RPC) → SettingsForm
- `/pricing` остаётся отдельной страницей (ссылки из уведомлений ведут туда)

## Yandex Translate API

### Настройка
1. Зайти на https://aistudio.yandex.cloud/platform/
2. Кнопка **"Create API key"** (правый верхний угол)
3. Создать ключ (без срока действия) — скопировать Secret
4. Скопировать **folder ID** из шапки страницы (вида `b1g...`)
5. Добавить в `.env.local`:
   - `YANDEX_API_KEY=<secret>`
   - `YANDEX_FOLDER_ID=<folder_id>`

### Механика работы перевода

При добавлении слова в словарь (через vocab-picker на уроке) происходит следующее:

1. **Словарь служебных слов** (`src/data/spanish-function-words.ts`) — если слово одно и есть в этом словаре, возвращается грамматическое объяснение вместо перевода. В словаре ~240 записей: артикли (el/la/un/una), местоимения (yo/tú/él/ella), предлоги (a/de/en/para/por), союзы (y/pero/que), частицы (no/sí/ya), короткие глаголы (es/está/hay/tiene). Это решает проблему "el → он" вместо "артикль".

2. **Yandex Translate API** — если слова нет в словаре, переводит через Yandex Cloud.
   
3. **DeepL** — fallback, если Yandex не сработал (требует `DEEPL_API_KEY`).

4. **Google Translate** — fallback, бесплатно, без ключа.

5. **LibreTranslate** → **MyMemory** — последние fallback'и.

### Как работает словарь служебных слов

Файл: `src/data/spanish-function-words.ts`

Каждая запись:
```ts
el: { word: "el", type: "артикль", explanation: "определённый артикль мужского рода (не переводится)", note: "él (с ударением) = он" }
```

API возвращает `{ translation: "[тип] объяснение (примечание)", functionWord: true }`.
Фронтенд показывает это как информационный блок 📖 вместо поля ввода.

### Как добавить слово в словарь

Открыть `src/data/spanish-function-words.ts`, добавить запись:
```ts
palabra: { word: "palabra", type: "тип", explanation: "объяснение на русском", note?: "доп. примечание" }
```

### Цепочка перевода (приоритет)
Yandex Translate → DeepL (если `DEEPL_API_KEY` в .env) → Google Translate → LibreTranslate → MyMemory

API: `POST /api/translate` — тело `{ text: "слово", source?: "es", target?: "ru" }` → `{ translation: "перевод" }`

# ═══════════════════════════════════════════════
# ПРОЕКТНАЯ БАЗА ЗНАНИЙ (Naranja Feliz)
# Всё необходимое для продолжения работы через 6+ месяцев
# ═══════════════════════════════════════════════

## Суть проекта
- Бесплатная онлайн-школа испанского языка с нуля
- Next.js 16 (App Router) + Tailwind CSS 4 + TypeScript
- Supabase (PostgreSQL + Auth + Storage) — бесплатный план
- Хостинг: Yandex Cloud Serverless Containers (бесплатные квоты)
- Оплата: ЮKassa (YooKassa) — НЕ НАСТРОЕНА

## Инфраструктура

### Yandex Cloud
- Cloud: `b1gnm48rbktakl54i8vb`, Folder: `b1gsrqv6ri6jr7ue41fc`, Zone: ru-central1-a
- Container: `bba12ti21lgmv9glfl7k` (naranja-backend), 1GB RAM, 1 vCPU, 300s timeout, concurrency 8
- Registry: `crpusm23v7g9ch5c5t9h` → репозитории: `naranja-backend`, `naranja-feliz`
- API Gateway: `naranja.outmilk.online` → контейнер
- SA для контейнера: `ajep2inmg605fd6ttbb2`
- SA для GitHub Actions: `ajefscetirf01br3unuc` (pusher + editor + viewer)
- Секрет GitHub Actions: `YC_SA_KEY_JSON` (сервисный ключ)

### Supabase
- URL: `https://zphehhzgbudetyzezunk.supabase.co`
- Аккаунт: outmilker@gmail.com
- Ключи в `.env.local` и в GitHub Actions secrets

### Домен
- `naranja.outmilk.online` — API Gateway Yandex Cloud

## Деплой
1. Пуш в GitHub `main` → GitHub Actions (deploy.yml) → сборка + пуш в YCR + ревизия
2. ИЛИ вручную: docker build → push → yc serverless container revision deploy
3. Обновления БД: Supabase Studio → SQL Editor → migration.sql

## Ключевые команды деплоя (Windows PowerShell)
```
docker build -t cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX .
docker push cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX
yc serverless container revision deploy --container-id bba12ti21lgmv9glfl7k --image cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX --service-account-id ajep2inmg605fd6ttbb2 --memory 1GB --cores 1 --execution-timeout 300s --concurrency 8
```

## Важные файлы
- `Dockerfile` — сборка standalone Next.js на 8080
- `gateway-spec.yaml` — API Gateway routes
- `.github/workflows/deploy.yml` — CI/CD
- `supabase/migration.sql` — схема БД
- `next.config.ts` — `output: "standalone"`

## Ключи и доступы
- Supabase: в .env.local (anon key + service role)
- Yandex Translate: в .env.local
- ЮKassa: не настроена
- Yandex Cloud CLI: авторизован локально (yc config list)

## Мобильный словарь на уроках

Компонент `vocab-picker-fab.tsx` — кнопка 📖 (FAB) в правом нижнем углу урока. Включает **режим словаря**:

- **На телефоне (touch):**
  - Двойной тап по слову → модалка добавления в словарь (автоперевод, транскрипция, теги)
  - Долгое нажатие (600ms) → модалка перевода всего текста в блоке
- **На десктопе (mouse):**
  - Выделение текста / двойной клик → модалка добавления в словарь
- `touch-action: manipulation` на body в режиме, чтобы двойной тап не зумил
- `document.caretRangeFromPoint` для определения слова по координатам тапа
- Флаг `touchConsumed`, чтобы touch-события не дублировались через click/dblclick
- Баннер-подсказка сверху: «Двойной тап — слово, долгое нажатие — перевод»


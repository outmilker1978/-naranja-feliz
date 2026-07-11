# Naranja Feliz — Руководство Администратора Системы и БД

## Архитектура продукта

### Общая схема

```
Пользователь (Браузер)
    │
    ▼
Vercel (Next.js)
    │
    ├── Server Components (SSR) ───→ Supabase Auth (cookies)
    ├── Client Components (CSR) ───→ Supabase Client (anon key)
    ├── Route Handlers (API) ──────→ Supabase Service/Admin Client
    │
    ▼
Supabase
    ├── Auth (email/password, JWT, user_metadata)
    ├── PostgreSQL (таблицы приложения)
    ├── Storage (bucket lesson-files)
    └── SQL (RPC функции, RLS политики)
```

### Принципы
- Server Components получают данные через SSR-клиент (cookies сессии)
- API Route Handlers используют service client для обхода RLS
- Загрузка файлов — только через `/api/upload-file` (service client)
- Роль пользователя — основной источник `profiles.role`; `user_metadata.role` — кэш

---

## Структура БД

### Таблицы

#### `profiles`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | = auth.users.id |
| email | text | Email пользователя |
| full_name | text | Имя |
| avatar_url | text | URL аватара |
| role | text | 'student' или 'teacher' |
| created_at | timestamptz | Дата создания |

Создаётся триггером `on_auth_user_created` при регистрации.
RLS: пользователь читает свою запись, учитель — все.

#### `courses`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| title | text | Название |
| description | text | Описание |
| level | text | A1–C2 |
| image_url | text | URL обложки |
| published | boolean | Опубликован? |
| created_by | uuid FK → auth.users | Автор курса |
| created_at | timestamptz | |

#### `lessons`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| course_id | uuid FK → courses.id | |
| title | text | Название |
| order_index | int | Порядок |
| published | boolean | |
| created_at | timestamptz | |

#### `lesson_blocks`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| lesson_id | uuid FK → lessons.id | |
| type | text | Тип блока |
| content | jsonb | Данные блока |
| order_index | int | Порядок |
| created_at | timestamptz | |

##### Content JSON для каждого типа блока:
- `text`: `{ "html": "<p>текст</p>" }`
- `image`: `{ "src": "https://...", "alt": "описание" }`
- `video`: `{ "src": "https://..." }`
- `fill_blank`: `{ "sentenceTemplate": "Я [люблю] [испанский]" }`
- `choice`: `{ "question": "Какой...", "options": ["вар1","вар2","вар3"], "correct": [0, 2] }`
- `open_question`: `{ "question": "Напиши..." }`
- `audio_answer`: `{ "prompt": "Запиши..." }`
- `video_answer`: `{ "prompt": "Запиши..." }` (скоро)
- `drag_order`: `{ "sentenceTemplate": "Я [домой] [иду]" }`
- `image_pick`: `{ "question": "Выбери...", "images": [{"src":"...","label":"кот"}], "correct": [0], "multiple": false }`

#### `enrollments`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| course_id | uuid FK | |
| student_id | uuid FK | |
| paid | boolean | Оплачено ли? |
| created_at | timestamptz | |

Unique: `(course_id, student_id)`

#### `block_submissions`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| lesson_block_id | uuid FK | |
| student_id | uuid FK | |
| answer | text | JSON-stringified ответ |
| reviewed | boolean | Проверено учителем? |
| comment | text | Комментарий учителя |
| created_at | timestamptz | |

Unique: `(lesson_block_id, student_id)` — upsert по этому ключу.

#### `submission_comments`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| submission_id | uuid FK → block_submissions.id | |
| author_id | uuid FK | |
| text | text | |
| created_at | timestamptz | |

#### `lesson_progress`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| lesson_id | uuid FK | |
| student_id | uuid FK | |
| completed | boolean | |
| created_at | timestamptz | |

Unique: `(lesson_id, student_id)`

#### `notifications`
| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| user_id | uuid FK | Кому |
| title | text | Заголовок |
| body | text | Текст |
| link | text | URL перехода |
| read | boolean | Прочитано? |
| created_at | timestamptz | |

---

### RLS Политики

#### `profiles`
- SELECT: auth.uid() = id OR auth.jwt() ->> 'role' = 'teacher'
- INSERT: auth.uid() = id (только триггер)
- UPDATE: auth.uid() = id

#### `courses`
- SELECT: published = true OR created_by = auth.uid()
- INSERT: authenticated
- UPDATE: created_by = auth.uid()
- DELETE: created_by = auth.uid()

#### `lessons`
- SELECT: published = true OR course.created_by = auth.uid()
- INSERT: course.created_by = auth.uid()
- UPDATE: course.created_by = auth.uid()
- DELETE: course.created_by = auth.uid()

#### `lesson_blocks`
- SELECT: lesson.published = true OR lesson.course.created_by = auth.uid()
- INSERT: lesson.course.created_by = auth.uid()
- UPDATE: lesson.course.created_by = auth.uid()
- DELETE: lesson.course.created_by = auth.uid()

#### `enrollments`
- SELECT: auth.uid() = student_id OR course.created_by = auth.uid()
- INSERT: authenticated

#### `block_submissions`
- SELECT: auth.uid() = student_id OR lesson.course.created_by = auth.uid()
- INSERT: auth.uid() = student_id
- UPDATE: lesson.course.created_by = auth.uid()

#### `submission_comments`
- SELECT: auth.uid() = submission.student_id OR lesson.course.created_by = auth.uid()
- INSERT: authenticated

#### `lesson_progress`
- SELECT: auth.uid() = student_id OR lesson.course.created_by = auth.uid()
- INSERT/UPDATE: auth.uid() = student_id

#### `notifications`
- SELECT: auth.uid() = user_id
- UPDATE: auth.uid() = user_id

---

### RPC функции

#### `get_db_stats()`
Возвращает размер БД для страницы статистики:
```sql
CREATE OR REPLACE FUNCTION get_db_stats()
RETURNS TABLE (size_bytes bigint, size_pretty text)
LANGUAGE sql AS $$
  SELECT pg_database_size(current_database()),
         pg_size_pretty(pg_database_size(current_database()));
$$;
```

---

## Настройка Supabase

### Проект
- ID: `zphehhzgbudetyzezunk`
- URL: `https://zphehhzgbudetyzezunk.supabase.co`
- anon key: в `.env.local` как `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service role key: в `.env.local` как `SUPABASE_SERVICE_ROLE_KEY`

### Бакет Storage
- Имя: `lesson-files`
- Публичный (no RLS — загрузка через service client)
- URL: `https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public/lesson-files/`
- Сжатие: все изображения проходят через Sharp (JPEG quality 82, PNG → WebP при >500KB, ресайз >1920px). При ошибке — fallback на оригинал.
- Доступ: выдаётся Signed URL (1 год) для гарантированной загрузки.

### SQL Editor
Для добавления триггера создания профиля:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

Unique constraint для upsert ответов:
```sql
ALTER TABLE block_submissions
ADD CONSTRAINT block_submissions_unique UNIQUE (lesson_block_id, student_id);
```

---

## Хостинг (Vercel)

### Переменные окружения (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://zphehhzgbudetyzezunk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

### Деплой
```bash
npm run build    # Проверка сборки
vercel deploy    # Деплой на Vercel
```

---

---

## Система оплаты (ЮKassa)

### Механика

1. Ученик выбирает тариф на `/pricing` (1/3/6/12 месяцев)
2. Фронтенд вызывает `POST /api/payment/create-checkout` с `planId`
3. Сервер создаёт платеж в ЮKassa через API, сохраняет запись в `payment_transactions` со статусом `pending`
4. Ученик перенаправляется на `confirmation_url` ЮKassa — оплачивает картой/СБП/ЮMoney
5. ЮKassa присылает webhook на `POST /api/payment/webhook`
6. Сервер проверяет IP webhook'а (белый список ЮKassa), обновляет статус на `succeeded`, продлевает `profiles.subscription_until`
7. Ученик возвращается на сайт → видит активную подписку

### Таблица `payment_transactions`

| Колонка | Тип | Описание |
|----------|------|----------|
| id | uuid PK | |
| user_id | uuid FK → profiles | Кто оплатил |
| amount | numeric(10,2) | Сумма |
| currency | text | RUB |
| description | text | Название тарифа |
| yookassa_id | text UNIQUE | ID платежа в ЮKassa |
| status | text | pending / succeeded / canceled / failed |
| plan_duration_days | integer | 30 / 90 / 180 / 365 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Webhook URL
Настроить в кабинете ЮKassa: `https://naranja.outmilk.online/api/payment/webhook`

### Проверка доступа к уроку
Функция `check_subscription(uid)` → true/false. Используется в уроке: если курс имеет `access_mode = 'subscription'`, проверяется подписка.

### Учитель может продлить вручную
Через `/admin/teachers` → кнопка «+30 дней» — полезно для тестовых доступов и подарков.

---

## Лимиты бесплатного тарифа

| Ресурс | Лимит |
|--------|-------|
| Хранилище (Storage) | 1 ГБ |
| База данных | 500 МБ |
| Аутентификация | 50 000 пользователей |
| Vercel (Hobby) | 100 ГБ трафика / мес |
| Vercel Serverless | 100 ч / мес |

При заполнении хранилища — создать второй Supabase проект и перенести часть файлов.

---

## Контент портала (`/admin/content`)

### Типы контента

| Тип | Описание | Где отображается |
|-----|----------|-----------------|
| `page_section` (Hero) | Главный экран: заголовок, подзаголовок, кнопка, статистика, карточки | Главная страница, самый верх |
| `page_section` (Features) | Преимущества: заголовок + карточки с иконками | Главная, после курсов |
| `page_section` (About) | О школе: заголовок, текст, фото | Главная |
| `page_section` (Testimonials) | Отзывы: заголовок + карточки (автор, текст, аватар) | Главная + `/reviews` |
| `page_section` (FAQ) | Частые вопросы: заголовок + вопросы/ответы | Главная |
| `page_section` (CTA) | Призыв к действию: текст, кнопка, фон | Главная, всегда внизу |
| `news` | Новости школы | Главная (карусель) + `/content/[id]` |
| `article` | Полезные статьи | Главная (карусель) + `/content/[id]` |
| `ad` | Рекламные баннеры | Главная |
| `teacher` | Профиль преподавателя | `/teachers/[id]` |

### Иерархия блоков в админке

В `/admin/content` блоки расположены в фиксированном порядке:

1. **HERO** 🔒 — заблокирован, всегда первый
2. **Преимущества** — можно перемещать ▲▼
3. **О школе** — можно перемещать
4. **Отзывы** — можно перемещать
5. **FAQ** — можно перемещать
6. **Новости** 📰 — коллекция, раскрывается (внутри сортировка ▲▼)
7. **Статьи** 📄 — коллекция, раскрывается (внутри сортировка ▲▼)
8. **Реклама** 📢 — коллекция, раскрывается (внутри сортировка ▲▼)
9. **CTA** 🔒 — заблокирован, всегда последний

Блоки HERO и CTA нельзя перемещать. Коллекции разворачиваются/сворачиваются — внутри каждого элемента свои стрелки для реордеринга.

### Редактор Hero

Поля:
- **Заголовок** — большой текст на Hero
- **Подзаголовок** — если заполнить, заменяет стандартную графику с «Motivación en cada gajo»
- **Текст кнопки** — для неавторизованных
- **Ссылка кнопки** — куда ведёт CTA
- **Статистика (4 пилюли)** — иконка + текст + ссылка
- **Карточки быстрого доступа (до 6)** — иконка, заголовок, описание, ссылка, видимость (all/teacher/student)

### Навигация по страницам контента

На всех страницах просмотра контента сверху добавлена **фиксированная панель**:
- `/content/[id]` — `← Все новости/статьи` + `Следующая новость/статья →`
- `/courses/[courseId]` — `← Все курсы` + `Первый урок/Продолжить →`
- `/courses/[courseId]/[lessonId]` — `← Название курса` + `Следующий урок →`

Панель прилипает под шапкой при скролле (`position: fixed; top: 73px`).

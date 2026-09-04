-- ============================================================
-- RPC Aggregation: N+1 → 1 вызов на страницу
-- ФАЗ-7, шаг B1
-- ============================================================

-- 1. get_home_data(uid) — данные главной страницы
-- Заменяет 8-10 последовательных запросов на 1
CREATE OR REPLACE FUNCTION public.get_home_data(uid uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    -- Публичные секции портала (hero, features, about, testimonials, faq)
    'sections', (
      SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY s.sort_order), '[]'::jsonb)
      FROM (
        SELECT id, type, category, title, slug, excerpt, content, cover_image, sort_order
        FROM content
        WHERE type = 'page_section' AND status = 'published'
          AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ) s
    ),
    -- Новости (последние 6)
    'news', (
      SELECT COALESCE(jsonb_agg(row_to_json(n) ORDER BY n.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT c.id, c.title, c.slug, c.excerpt, c.cover_image, c.created_at, c.sort_order,
               jsonb_build_object('full_name', p.full_name, 'avatar_url', p.avatar_url) AS author
        FROM content c
        LEFT JOIN profiles p ON p.id = c.author_id
        WHERE c.type = 'news' AND c.status = 'published'
          AND (c.scheduled_at IS NULL OR c.scheduled_at <= NOW())
        ORDER BY c.created_at DESC
        LIMIT 6
      ) n
    ),
    -- Динамические блоки (реклама, статьи) — content.block_id → content_blocks.id
    'content_blocks', (
      SELECT COALESCE(jsonb_agg(row_to_json(cb) ORDER BY cb.sort_order), '[]'::jsonb)
      FROM (
        SELECT cb2.id, cb2.type, cb2.label, cb2.sort_order, cb2.status,
               COALESCE(
                 (SELECT jsonb_agg(row_to_json(c) ORDER BY c.sort_order)
                  FROM content c WHERE c.block_id = cb2.id),
                 '[]'::jsonb
               ) AS content
        FROM content_blocks cb2
        WHERE cb2.status = 'published'
      ) cb
    ),
    -- Статистика
    'course_count', (SELECT COUNT(*)::int FROM courses WHERE published = true),
    'lesson_count', (SELECT COUNT(*)::int FROM lessons WHERE published = true),
    -- Профиль пользователя (если авторизован)
    'profile', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT row_to_json(p)
        FROM (
          SELECT id, role, full_name, avatar_url, subscription_until
          FROM profiles WHERE id = uid
        ) p
      ) ELSE NULL END
    ),
    -- Записи пользователя (курсы, в которые записан)
    'enrollments', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT COALESCE(jsonb_agg(e.course_id), '[]'::jsonb)
        FROM enrollments e WHERE e.student_id = uid
      ) ELSE '[]'::jsonb END
    ),
    -- Курсы автора (если учитель)
    'owned_courses', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
        FROM (
          SELECT id, title, image_url, level, access_mode
          FROM courses WHERE created_by = uid
          ORDER BY created_at DESC LIMIT 6
        ) c
      ) ELSE '[]'::jsonb END
    ),
    -- Непроверенные ответы (для учителя)
    'pending_count', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT COUNT(*)::int FROM block_submissions WHERE reviewed = false
      ) ELSE 0 END
    ),
    -- Опубликованные курсы (для каталога на главной)
    'published_courses', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT id, title, image_url, level, description, access_mode
        FROM courses WHERE published = true
        ORDER BY created_at DESC LIMIT 8
      ) c
    )
  );
$$;


-- 2. get_course_page(uid, cid) — страница курса с уроками и прогрессом
-- Заменяет 5-6 последовательных запросов на 1
CREATE OR REPLACE FUNCTION public.get_course_page(uid uuid, cid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    -- Курс
    'course', (
      SELECT row_to_json(c)
      FROM (
        SELECT id, title, description, level, image_url, published, created_by, access_mode, created_at
        FROM courses WHERE id = cid
      ) c
    ),
    -- Уроки курса (с прогрессом)
    'lessons', (
      SELECT COALESCE(jsonb_agg(row_to_json(l) ORDER BY l.order_index), '[]'::jsonb)
      FROM (
        SELECT les.id, les.title, les.order_index, les.published, les.cover_url,
               COALESCE(lp.completed, false) AS completed,
               lp.completed_at
        FROM lessons les
        LEFT JOIN lesson_progress lp ON lp.lesson_id = les.id AND lp.student_id = uid
        WHERE les.course_id = cid
          AND (
            les.published = true
            OR EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role = 'admin')
            OR EXISTS (SELECT 1 FROM courses WHERE id = cid AND created_by = uid)
          )
        ORDER BY les.order_index
      ) l
    ),
    -- Доступ пользователя
    'has_access', (
      SELECT -- Владелец курса — всегда OK
        (c.created_by = uid)
        OR EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role = 'admin')
        OR EXISTS (SELECT 1 FROM profiles WHERE id = uid AND subscription_until > NOW())
        OR EXISTS (
          SELECT 1 FROM course_access
          WHERE student_id = uid AND course_id = cid
            AND (expires_at IS NULL OR expires_at > NOW())
        )
      FROM courses c WHERE c.id = cid
    ),
    -- Запись в курсе
    'enrollment', (
      SELECT row_to_json(e)
      FROM (
        SELECT id, paid, enrolled_at
        FROM enrollments
        WHERE student_id = uid AND course_id = cid
      ) e
    ),
    -- Роль пользователя
    'role', (
      SELECT role FROM profiles WHERE id = uid
    )
  );
$$;


-- 3. get_lesson_page(uid, cid, lid) — страница урока: блоки, ответы, навигация
-- Заменяет 10-12 последовательных запросов на 1
CREATE OR REPLACE FUNCTION public.get_lesson_page(uid uuid, cid uuid, lid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH course_info AS (
    SELECT c.id, c.title, c.created_by, c.access_mode
    FROM courses c WHERE c.id = cid
  ),
  user_role AS (
    SELECT role FROM profiles WHERE id = uid
  ),
  all_lessons AS (
    SELECT les.id, les.title, les.order_index
    FROM lessons les
    WHERE les.course_id = cid AND les.published = true
    ORDER BY les.order_index
  ),
  current_lesson AS (
    SELECT * FROM all_lessons WHERE id = lid
  ),
  blocks AS (
    SELECT lb.id, lb.lesson_id, lb.type, lb.content, lb.order_index
    FROM lesson_blocks lb
    WHERE lb.lesson_id = lid
    ORDER BY lb.order_index
  )
  SELECT jsonb_build_object(
    -- Урок
    'lesson', (
      SELECT row_to_json(l)
      FROM (
        SELECT les.id, les.title, les.content, les.order_index, les.course_id
        FROM lessons les WHERE les.id = lid
      ) l
    ),
    -- Блоки урока
    'blocks', (
      SELECT COALESCE(jsonb_agg(row_to_json(b) ORDER BY b.order_index), '[]'::jsonb)
      FROM blocks b
    ),
    -- Сохранённые ответы ученика (одним запросом, НЕ по одному на блок)
    'saved_answers', (
      SELECT COALESCE(jsonb_agg(row_to_json(bs)), '[]'::jsonb)
      FROM (
        SELECT id, lesson_block_id, answer, reviewed, comment, created_at
        FROM block_submissions
        WHERE student_id = uid
          AND lesson_block_id IN (SELECT id FROM blocks)
      ) bs
    ),
    -- Навигация: предыдущий/следующий урок
    'prev_lesson', (
      SELECT row_to_json(pl)
      FROM (
        SELECT id, title, order_index
        FROM all_lessons
        WHERE order_index < (SELECT order_index FROM current_lesson)
        ORDER BY order_index DESC LIMIT 1
      ) pl
    ),
    'next_lesson', (
      SELECT row_to_json(nl)
      FROM (
        SELECT id, title, order_index
        FROM all_lessons
        WHERE order_index > (SELECT order_index FROM current_lesson)
        ORDER BY order_index ASC LIMIT 1
      ) nl
    ),
    -- Все уроки курса (для сайдбара/навигации)
    'all_lessons', (
      SELECT COALESCE(jsonb_agg(row_to_json(al) ORDER BY al.order_index), '[]'::jsonb)
      FROM all_lessons al
    ),
    -- Информация о курсе
    'course', (
      SELECT row_to_json(ci)
      FROM course_info ci
    ),
    -- Роль
    'role', (
      SELECT role FROM user_role
    ),
    -- Доступ
    'has_access', (
      SELECT
        (ci.created_by = uid)
        OR EXISTS (SELECT 1 FROM user_role WHERE role = 'admin')
        OR EXISTS (SELECT 1 FROM profiles WHERE id = uid AND subscription_until > NOW())
        OR EXISTS (
          SELECT 1 FROM course_access
          WHERE student_id = uid AND course_id = cid
            AND (expires_at IS NULL OR expires_at > NOW())
        )
      FROM course_info ci
    ),
    -- Прогресс урока
    'completed', (
      SELECT COALESCE(lp.completed, false)
      FROM lesson_progress lp
      WHERE lp.student_id = uid AND lp.lesson_id = lid
    )
  );
$$;


-- 4. get_chat_data(uid) — чаты с последними сообщениями и непрочитанными
-- Заменяет 5-7 запросов на 1
CREATE OR REPLACE FUNCTION public.get_chat_data(uid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH user_chats AS (
    SELECT c.id, c.student_id, c.teacher_id, c.created_at
    FROM chats c
    WHERE c.student_id = uid OR c.teacher_id = uid
  ),
  chat_partners AS (
    SELECT uc.id AS chat_id,
           CASE
             WHEN uc.student_id = uid THEN jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 'role', p.role, 'last_seen', p.last_seen, 'email', p.email)
             ELSE jsonb_build_object('id', p2.id, 'full_name', p2.full_name, 'avatar_url', p2.avatar_url, 'role', p2.role, 'last_seen', p2.last_seen, 'email', p2.email)
           END AS partner
    FROM user_chats uc
    JOIN profiles p ON p.id = uc.teacher_id
    JOIN profiles p2 ON p2.id = uc.student_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (cm.chat_id)
      cm.chat_id, cm.id AS message_id, cm.content, cm.file_url, cm.sender_id, cm.created_at, cm.read
    FROM chat_messages cm
    WHERE cm.chat_id IN (SELECT id FROM user_chats)
    ORDER BY cm.chat_id, cm.created_at DESC
  ),
  unread_counts AS (
    SELECT cm.chat_id, COUNT(*)::int AS unread_count
    FROM chat_messages cm
    WHERE cm.chat_id IN (SELECT id FROM user_chats)
      AND cm.sender_id != uid AND cm.read = false
    GROUP BY cm.chat_id
  )
  SELECT jsonb_build_object(
    -- Список чатов с партнёрами и последним сообщением
    'chats', (
      SELECT COALESCE(jsonb_agg(row_to_json(ch) ORDER BY ch.last_message_at DESC NULLS LAST), '[]'::jsonb)
      FROM (
        SELECT uc.id,
               cp.partner,
               lm.content AS last_message,
               lm.file_url AS last_file_url,
               lm.sender_id AS last_sender_id,
               lm.created_at AS last_message_at,
               COALESCE(uc2.unread_count, 0) AS unread_count
        FROM user_chats uc
        JOIN chat_partners cp ON cp.chat_id = uc.id
        LEFT JOIN last_messages lm ON lm.chat_id = uc.id
        LEFT JOIN unread_counts uc2 ON uc2.chat_id = uc.id
        ORDER BY lm.created_at DESC NULLS LAST
      ) ch
    ),
    -- Доступные учителя (для создания нового чата)
    'teachers', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT id, full_name, avatar_url, role, last_seen, email
        FROM profiles WHERE role = 'teacher'
      ) t
    ),
    -- Роль пользователя
    'role', (
      SELECT role FROM profiles WHERE id = uid
    )
  );
$$;


-- 5. get_course_list(uid) — список курсов (для страницы /courses)
-- Заменяет 8-9 запросов на 1
CREATE OR REPLACE FUNCTION public.get_course_list(uid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    -- Роль
    'role', (
      SELECT role FROM profiles WHERE id = uid
    ),
    -- Записи пользователя
    'enrollments', (
      SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM (
        SELECT course_id, paid
        FROM enrollments WHERE student_id = uid
      ) e
    ),
    -- Доступы по запросу
    'course_access', (
      SELECT COALESCE(jsonb_agg(ca.course_id), '[]'::jsonb)
      FROM course_access ca
      WHERE ca.student_id = uid
        AND (ca.expires_at IS NULL OR ca.expires_at > NOW())
    ),
    -- Курсы учителя (собственные)
    'owned_courses', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM (
        SELECT id, title, description, level, image_url, published, access_mode, created_at
        FROM courses WHERE created_by = uid
        ORDER BY created_at DESC
      ) c
    ),
    -- Прогресс по урокам
    'lesson_progress', (
      SELECT COALESCE(jsonb_agg(row_to_json(lp)), '[]'::jsonb)
      FROM (
        SELECT lesson_id, completed
        FROM lesson_progress WHERE student_id = uid
      ) lp
    ),
    -- Все опубликованные курсы
    'courses', (
      SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY c.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT id, title, description, level, image_url, published, access_mode, created_at
        FROM courses WHERE published = true
        ORDER BY created_at DESC
      ) c
    )
  );
$$;


-- ============================================================
-- clear_lesson_answers(student_id, lesson_id) — быстрая очистка ответов
-- Одна транзакция вместо 2 клиентских запросов + reload (~1 минута висения → <1с)
-- ============================================================
CREATE OR REPLACE FUNCTION public.clear_lesson_answers(student_id uuid, lesson_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM block_submissions
  WHERE block_submissions.student_id = clear_lesson_answers.student_id
    AND block_submissions.lesson_block_id IN (
      SELECT id FROM lesson_blocks WHERE lesson_blocks.lesson_id = clear_lesson_answers.lesson_id
    );

  INSERT INTO lesson_progress (lesson_id, student_id, completed, completed_at)
  VALUES (clear_lesson_answers.lesson_id, clear_lesson_answers.student_id, false, NULL)
  ON CONFLICT (lesson_id, student_id)
  DO UPDATE SET completed = false, completed_at = NULL;

  SELECT true;
$$;

-- ============================================================
-- Индексы для ускорения RPC-функций
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson ON lesson_blocks(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_block_submissions_student_block ON block_submissions(student_id, lesson_block_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson ON lesson_progress(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_chats_student ON chats(student_id);
CREATE INDEX IF NOT EXISTS idx_chats_teacher ON chats(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(chat_id, read, sender_id);
CREATE INDEX IF NOT EXISTS idx_content_type_status ON content(type, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(published, created_at DESC);

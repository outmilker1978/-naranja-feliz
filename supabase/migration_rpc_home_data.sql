-- ============================================================
-- Миграция: актуализация get_home_data (новые поля course_count / lesson_count)
-- Суть: продовая функция старая (возвращает user_stats, без course_count/lesson_count),
-- из-за чего Hero на главной показывает «0 курсов, 0 уроков» (page.tsx ждёт
-- course_count/lesson_count с релиза 302238e "B1 RPC-aggregation").
-- Безопасно: CREATE OR REPLACE — не трогает существующие записи.
-- Выполнить в: Supabase Dashboard → SQL Editor → New query → Run.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_home_data(uid uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'sections', (
      SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY s.sort_order), '[]'::jsonb)
      FROM (
        SELECT id, type, category, title, slug, excerpt, content, cover_image, sort_order
        FROM content
        WHERE type = 'page_section' AND status = 'published'
          AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ) s
    ),
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
    'course_count', (SELECT COUNT(*)::int FROM courses WHERE published = true),
    'lesson_count', (SELECT COUNT(*)::int FROM lessons WHERE published = true),
    'profile', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT row_to_json(p)
        FROM (
          SELECT id, role, full_name, avatar_url, subscription_until
          FROM profiles WHERE id = uid
        ) p
      ) ELSE NULL END
    ),
    'enrollments', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT COALESCE(jsonb_agg(e.course_id), '[]'::jsonb)
        FROM enrollments e WHERE e.student_id = uid
      ) ELSE '[]'::jsonb END
    ),
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
    'pending_count', (
      CASE WHEN uid IS NOT NULL THEN (
        SELECT COUNT(*)::int FROM block_submissions WHERE reviewed = false
      ) ELSE 0 END
    ),
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
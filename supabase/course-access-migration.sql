-- ============================================================
-- Миграция: система per-course доступа + subscription_requested_at
-- Запустить в Supabase Studio → SQL Editor
-- ============================================================

-- 1. Колонка subscription_requested_at (нужна для кнопки "Запросить продление")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_requested_at TIMESTAMPTZ;

-- 2. Таблица course_access (доступ студента к конкретному курсу)
CREATE TABLE IF NOT EXISTS course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  reason TEXT CHECK (reason IN ('subscription', 'manual', 'request')),
  UNIQUE(student_id, course_id)
);

ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;

-- 3. Политики RLS
DROP POLICY IF EXISTS "Users read own course access" ON course_access;
CREATE POLICY "Users read own course access"
  ON course_access FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers manage course access" ON course_access;
CREATE POLICY "Teachers manage course access"
  ON course_access FOR ALL
  USING (auth.uid() = granted_by);

-- 4. Индексы
CREATE INDEX IF NOT EXISTS idx_course_access_student ON course_access(student_id);
CREATE INDEX IF NOT EXISTS idx_course_access_course ON course_access(course_id);

-- 5. Функция проверки доступа (course_access ИЛИ subscription_until)
CREATE OR REPLACE FUNCTION public.check_course_access(uid uuid, cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_access
    WHERE student_id = uid AND course_id = cid
      AND (expires_at IS NULL OR expires_at > NOW())
  ) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND subscription_until > NOW()
  );
$$;

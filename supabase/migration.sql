-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'A1',
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'fill_blank',
  question TEXT NOT NULL,
  correct_answer TEXT,
  options TEXT[],
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Submissions (student answers)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  answer TEXT NOT NULL,
  comment TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  paid BOOLEAN NOT NULL DEFAULT false,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Lesson progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies (drop first to allow re-run)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can insert courses" ON courses;
DROP POLICY IF EXISTS "Teachers can update own courses" ON courses;
DROP POLICY IF EXISTS "Teachers can delete own courses" ON courses;
DROP POLICY IF EXISTS "Anyone can read published courses" ON courses;
DROP POLICY IF EXISTS "Teachers manage lessons" ON lessons;
DROP POLICY IF EXISTS "Students read lessons from enrolled courses" ON lessons;
DROP POLICY IF EXISTS "Teachers manage exercises" ON exercises;
DROP POLICY IF EXISTS "Teachers can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Students read exercises from enrolled lessons" ON exercises;
DROP POLICY IF EXISTS "Students manage own submissions" ON submissions;
DROP POLICY IF EXISTS "Students read own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers read submissions for their exercises" ON submissions;
DROP POLICY IF EXISTS "Teachers can comment submissions" ON submissions;
DROP POLICY IF EXISTS "Students read own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers read enrollments for their courses" ON enrollments;
DROP POLICY IF EXISTS "Students manage own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Teachers read progress for their courses" ON lesson_progress;
-- Lesson blocks
CREATE TABLE IF NOT EXISTS lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text','image','video','fill_blank','choice','open_question','audio_answer','video_answer')),
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage lesson blocks" ON lesson_blocks;
DROP POLICY IF EXISTS "Students read lesson blocks from enrolled lessons" ON lesson_blocks;

CREATE POLICY "Teachers manage lesson blocks"
  ON lesson_blocks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM lessons JOIN courses ON courses.id = lessons.course_id WHERE lessons.id = lesson_blocks.lesson_id AND courses.created_by = auth.uid())
  );

CREATE POLICY "Students read lesson blocks from enrolled lessons"
  ON lesson_blocks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lessons JOIN enrollments ON enrollments.course_id = lessons.course_id AND enrollments.student_id = auth.uid() WHERE lessons.id = lesson_blocks.lesson_id)
  );

-- Block submissions (student answers to lesson blocks)
CREATE TABLE IF NOT EXISTS block_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_block_id UUID NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  answer TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE block_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own block submissions" ON block_submissions;
DROP POLICY IF EXISTS "Teachers review block submissions" ON block_submissions;

CREATE POLICY "Students manage own block submissions"
  ON block_submissions FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers review block submissions"
  ON block_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_blocks
      JOIN lessons ON lessons.id = lesson_blocks.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE lesson_blocks.id = block_submissions.lesson_block_id AND courses.created_by = auth.uid()
    )
  );

-- Profiles: users can read own profile, teachers can read all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teachers can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Courses: teachers can CRUD their own; students can read published
CREATE POLICY "Teachers can insert courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Teachers can delete own courses"
  ON courses FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Anyone can read published courses"
  ON courses FOR SELECT
  USING (published = true OR auth.uid() = created_by);

-- Lessons: teachers can CRUD their course lessons; students read enrolled
CREATE POLICY "Teachers manage lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.created_by = auth.uid())
  );

CREATE POLICY "Students read lessons from enrolled courses"
  ON lessons FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM enrollments WHERE enrollments.course_id = lessons.course_id AND enrollments.student_id = auth.uid())
  );

-- Exercises
CREATE POLICY "Teachers manage exercises"
  ON exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = exercises.lesson_id AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert exercises"
  ON exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = exercises.lesson_id AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Students read exercises from enrolled lessons"
  ON exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN enrollments ON enrollments.course_id = lessons.course_id AND enrollments.student_id = auth.uid()
      WHERE lessons.id = exercises.lesson_id
    )
  );

-- Submissions
CREATE POLICY "Students manage own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students read own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers read submissions for their exercises"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exercises
      JOIN lessons ON lessons.id = exercises.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE exercises.id = submissions.exercise_id AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Teachers can comment submissions"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exercises
      JOIN lessons ON lessons.id = exercises.lesson_id
      JOIN courses ON courses.id = lessons.course_id
      WHERE exercises.id = submissions.exercise_id AND courses.created_by = auth.uid()
    )
  );

-- Enrollments
CREATE POLICY "Students read own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers read enrollments for their courses"
  ON enrollments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.created_by = auth.uid())
  );

-- Lesson progress
CREATE POLICY "Students manage own progress"
  ON lesson_progress FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers read progress for their courses"
  ON lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = lesson_progress.lesson_id AND courses.created_by = auth.uid()
    )
  );

-- Add published column to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Function to get database size (used by stats API)
CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'size_bytes', pg_database_size(current_database()),
    'size_pretty', pg_size_pretty(pg_database_size(current_database()))
  );
$$;

-- Update lesson policy to respect published status
DROP POLICY IF EXISTS "Students read lessons from enrolled courses" ON lessons;
CREATE POLICY "Students read lessons from enrolled courses"
  ON lessons FOR SELECT
  USING (
    published = true AND EXISTS (
      SELECT 1 FROM enrollments WHERE enrollments.course_id = lessons.course_id AND enrollments.student_id = auth.uid()
    )
  );

-- Allow new block types in lesson_blocks CHECK constraint
ALTER TABLE lesson_blocks DROP CONSTRAINT IF EXISTS lesson_blocks_type_check;
ALTER TABLE lesson_blocks ADD CONSTRAINT lesson_blocks_type_check
  CHECK (type IN ('text','image','video','fill_blank','choice','open_question','audio_answer','video_answer','drag_order','image_pick'));

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- Submission comments (dialog thread under each answer)
CREATE TABLE IF NOT EXISTS submission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES block_submissions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE submission_comments ENABLE ROW LEVEL SECURITY;

-- Policy: comments are managed via API (service client), no RLS policies needed

-- Add actor_id to notifications for avatar display (references profiles for API joins)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- Language level for students
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_level TEXT CHECK (language_level IN ('A1','A2','B1','B2','C1','C2'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_level_confirmed_by UUID REFERENCES profiles(id);

-- Allow users to update/insert their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Bypass PostgREST schema cache for new columns
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_agg(to_jsonb(profiles.*) ORDER BY full_name) FROM profiles;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile(uid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT to_jsonb(profiles.*) FROM profiles WHERE id = uid;
$$;

-- Chats (1:1 student-teacher)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

-- Delete self-chats where student == teacher (bug #1)
DELETE FROM chat_messages WHERE chat_id IN (SELECT id FROM chats WHERE student_id = teacher_id);
DELETE FROM chats WHERE student_id = teacher_id;

-- Prevent self-chats going forward
ALTER TABLE chats ADD CONSTRAINT chats_no_self CHECK (student_id <> teacher_id);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Read tracking for chat messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Subscription system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.check_subscription(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(subscription_until > NOW(), false) FROM profiles WHERE id = uid;
$$;

-- Add admin role to existing profiles check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'teacher', 'admin'));

-- Online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Content management system for portal
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('news', 'article', 'ad', 'page_section')),
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID NOT NULL REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published content"
  ON content FOR SELECT
  USING (status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= NOW()));

CREATE POLICY "Teachers and admins can manage content"
  ON content FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Allow teacher type in content
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check;
ALTER TABLE content ADD CONSTRAINT content_type_check CHECK (type IN ('news', 'article', 'ad', 'page_section', 'teacher'));

-- Allow teacher type in content
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check;
ALTER TABLE content ADD CONSTRAINT content_type_check CHECK (type IN ('news', 'article', 'ad', 'page_section', 'teacher'));
ALTER TABLE content ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_sort_order ON content(sort_order);

-- Stats RPCs for admin dashboard
CREATE OR REPLACE FUNCTION public.get_users_by_role()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_agg(jsonb_build_object('role', role, 'count', count::int))
  FROM (
    SELECT role, COUNT(*)::int AS count
    FROM profiles
    GROUP BY role
    ORDER BY role
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.get_courses_by_level()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_agg(jsonb_build_object('level', level, 'count', count::int))
  FROM (
    SELECT COALESCE(level, 'unknown') AS level, COUNT(*)::int AS count
    FROM courses
    GROUP BY level
    ORDER BY level
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.get_students_by_language_level()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_agg(jsonb_build_object('level', level, 'count', count::int))
  FROM (
    SELECT COALESCE(language_level, 'none') AS level, COUNT(*)::int AS count
    FROM profiles
    WHERE role = 'student'
    GROUP BY language_level
    ORDER BY level
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.get_progress_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_agg(jsonb_build_object('student_name', name, 'submitted', submitted::int))
  FROM (
    SELECT p.full_name AS name, COUNT(DISTINCT bs.lesson_block_id) AS submitted
    FROM profiles p
    LEFT JOIN block_submissions bs ON bs.student_id = p.id
    WHERE p.role = 'student'
    GROUP BY p.id, p.full_name
    ORDER BY p.full_name
  ) t;
$$;

-- Access mode for courses (public / subscription)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'public' CHECK (access_mode IN ('public', 'subscription'));

-- Vocabulary (personal word book)
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  transcription TEXT,
  example_sentence TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  source_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word)
);

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vocabulary"
  ON vocabulary FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vocabulary_user ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_tags ON vocabulary USING GIN(tags);

-- Payment transactions for YooKassa integration
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  description TEXT,
  yookassa_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'canceled', 'failed')),
  plan_duration_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage payment transactions"
  ON payment_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_yookassa ON payment_transactions(yookassa_id);

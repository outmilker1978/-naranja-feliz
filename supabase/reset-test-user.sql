-- ============================================================
-- Сброс тестового пользователя madhamster78@gmail.com
-- Удаляет все enrollment'ы, course_access, обнуляет подписку
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Найти пользователя по email (из auth.users через profiles)
  SELECT id INTO v_user_id FROM profiles WHERE email = 'madhamster78@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Пользователь madhamster78@gmail.com не найден в profiles';
    RETURN;
  END IF;

  -- Удалить enrollments
  DELETE FROM enrollments WHERE student_id = v_user_id;
  
  -- Удалить course_access
  DELETE FROM course_access WHERE student_id = v_user_id;
  
  -- Обнулить подписку
  UPDATE profiles SET 
    subscription_until = NULL,
    subscription_requested_at = NULL
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Сброшен пользователь: %', v_user_id;
END $$;

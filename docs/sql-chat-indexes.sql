-- Индексы для ускорения чата (выполнить в Supabase SQL Editor,
-- когда восстановится доступ к базе).
-- Причина: запросы по chat_id / (chat_id, read) / sender_id без индексов
-- делают полное сканирование таблицы chat_messages, из-за чего чат грузился минутами.
-- Эти индексы решают проблему на уровне базы (код уже оптимизирован).

-- 1) Последнее сообщение каждого чата: фильтр по chat_id + сортировка по created_at
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created
  ON public.chat_messages (chat_id, created_at DESC);

-- 2) Счётчик непрочитанных: фильтр по chat_id, sender_id, read
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_sender_read
  ON public.chat_messages (chat_id, sender_id, read);

-- 3) Сообщения от конкретного отправителя (для соседних запросов)
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
  ON public.chat_messages (sender_id);

-- 4) Выборка чатов по участнику (student_id / teacher_id)
CREATE INDEX IF NOT EXISTS idx_chats_student_id
  ON public.chats (student_id);
CREATE INDEX IF NOT EXISTS idx_chats_teacher_id
  ON public.chats (teacher_id);

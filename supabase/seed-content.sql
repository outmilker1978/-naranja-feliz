-- =============================================================
-- Seed: NF-2 content_blocks + test articles/ads
-- =============================================================
-- 1. Create table (if not exists)
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('ad', 'article')),
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_blocks' AND policyname = 'Anyone can read published blocks') THEN
    CREATE POLICY "Anyone can read published blocks"
      ON content_blocks FOR SELECT
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_blocks' AND policyname = 'Teachers and admins can manage blocks') THEN
    CREATE POLICY "Teachers and admins can manage blocks"
      ON content_blocks FOR ALL
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
      );
  END IF;
END $$;

-- 2. Add block_id to content
ALTER TABLE content ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES content_blocks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_content_block_id ON content(block_id);

-- 3. Create default blocks & migrate existing items
DO $$
DECLARE
  ad_block_id UUID;
  article_block_id UUID;
  author_id UUID;
BEGIN
  -- Get first admin/teacher for author
  SELECT id INTO author_id FROM profiles WHERE role IN ('admin', 'teacher') LIMIT 1;
  IF author_id IS NULL THEN
    SELECT id INTO author_id FROM profiles LIMIT 1;
  END IF;

  -- Default ad block
  INSERT INTO content_blocks (type, label, sort_order)
  VALUES ('ad', 'Все объявления', 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO ad_block_id;

  -- Default article block
  INSERT INTO content_blocks (type, label, sort_order)
  VALUES ('article', 'Все статьи', 0)
  ON CONFLICT DO NOTHING
  RETURNING id INTO article_block_id;

  -- Link existing ads/articles to default blocks
  UPDATE content SET block_id = ad_block_id WHERE type = 'ad' AND block_id IS NULL;
  UPDATE content SET block_id = article_block_id WHERE type = 'article' AND block_id IS NULL;

  -- 4. Seed test articles (only if content table is empty for articles)
  IF NOT EXISTS (SELECT 1 FROM content WHERE type = 'article' AND block_id = article_block_id LIMIT 1) THEN
    INSERT INTO content (type, title, excerpt, content, status, author_id, block_id, sort_order) VALUES
    ('article', '5 причин начать учить испанский', 'Испанский — второй по распространённости язык в мире. Вот почему стоит начать прямо сейчас.',
     '{"button_text": "Читать", "button_icon": "→", "blocks": [{"type": "text", "value": "Испанский язык — это не просто средство общения. Это ключ к культуре 21 страны, музыке, литературе и кухне. В этой статье мы расскажем о главных причинах, почему стоит начать учить испанский уже сегодня."}]}',
     'published', author_id, article_block_id, 0),
    ('article', 'Сервантес и современность', 'Влияние великого писателя на современный испанский язык и культуру.',
     '{"button_text": "Узнать", "button_icon": "📖", "blocks": [{"type": "text", "value": "Мигель де Сервантес написал «Дон Кихота» более 400 лет назад, но его влияние ощущается до сих пор. Многие фразы из книги стали крылатыми выражениями в современном испанском."}]}',
     'published', author_id, article_block_id, 1);
  END IF;

  -- 5. Seed test ads (only if empty)
  IF NOT EXISTS (SELECT 1 FROM content WHERE type = 'ad' AND block_id = ad_block_id LIMIT 1) THEN
    INSERT INTO content (type, title, content, status, author_id, block_id, sort_order) VALUES
    ('ad', 'Пробный урок бесплатно',
     '{"link": "https://naranja.outmilk.online/register", "caption": "Запишись на бесплатный пробный урок испанского", "image": null}',
     'published', author_id, ad_block_id, 0),
    ('ad', 'Курс для начинающих A1',
     '{"link": "https://naranja.outmilk.online/courses", "caption": "Старт группы каждую неделю. Всего 2990₽/мес", "image": null}',
     'published', author_id, ad_block_id, 1);
  END IF;
END $$;

-- 6. Seed "Преимущества" (Features) page_section if missing
DO $$
DECLARE
  author_id UUID;
BEGIN
  SELECT id INTO author_id FROM profiles WHERE role IN ('admin', 'teacher') LIMIT 1;
  IF author_id IS NULL THEN
    SELECT id INTO author_id FROM profiles LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM content WHERE type = 'page_section' AND category = 'features') THEN
    INSERT INTO content (type, category, title, content, status, author_id, sort_order)
    VALUES (
      'page_section', 'features', 'Почему Naranja Feliz?',
      jsonb_build_object(
        'title', 'Почему Naranja Feliz?',
        'items', jsonb_build_array(
          jsonb_build_object('icon', 'BookOpen', 'title', 'Интерактивные уроки', 'description', 'Тексты, аудио, видео, задания — всё для погружения в испанский'),
          jsonb_build_object('icon', 'PenLine', 'title', 'Разнообразные задания', 'description', 'Вставь слово, перетащи ответ, выбери картинку — учись играючи'),
          jsonb_build_object('icon', 'MessageCircle', 'title', 'Проверка преподавателем', 'description', 'Каждое задание проверяет учитель с подробным комментарием'),
          jsonb_build_object('icon', 'BarChart3', 'title', 'Отслеживай прогресс', 'description', 'Дольки показывают, сколько ты уже прошёл'),
          jsonb_build_object('icon', 'MessageCircle', 'title', 'Чат с учителем', 'description', 'Задай вопрос в любое время, не выходя из платформы'),
          jsonb_build_object('icon', 'Layers', 'title', 'Уровни A1–C2', 'description', 'От начального до продвинутого — выбирай свой темп')
        )
      ),
      'published', author_id, 0
    );
  END IF;
END $$;

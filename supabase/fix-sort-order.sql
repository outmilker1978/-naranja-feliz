-- Fix sort_order for existing items that all have 0
UPDATE content SET sort_order = sub.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY type, COALESCE(block_id::text, 'none') ORDER BY created_at) - 1 AS new_order
  FROM content
  WHERE type IN ('news', 'ad', 'article')
) sub
WHERE content.id = sub.id AND content.sort_order = 0;

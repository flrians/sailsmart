-- Migration: Replace boat_type_id on manual_chunks with manual_boat_types junction table
-- Run this in the Supabase SQL Editor (one block at a time, top to bottom)

-- ── Step 1: Add engine_model to boat_types (if not already there) ────────────
ALTER TABLE boat_types ADD COLUMN IF NOT EXISTS engine_model text;

-- ── Step 2: Create the junction table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manual_boat_types (
  manual_id    uuid REFERENCES manuals(id) ON DELETE CASCADE,
  boat_type_id uuid REFERENCES boat_types(id) ON DELETE CASCADE,
  PRIMARY KEY (manual_id, boat_type_id)
);

-- ── Step 3: Migrate existing associations from chunks into the junction table ─
INSERT INTO manual_boat_types (manual_id, boat_type_id)
SELECT DISTINCT manual_id, boat_type_id
FROM manual_chunks
WHERE boat_type_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ── Step 4: Drop the old column from chunks ───────────────────────────────────
ALTER TABLE manual_chunks DROP COLUMN IF EXISTS boat_type_id;

-- ── Step 5: Update the RPC to JOIN through the junction table ─────────────────
CREATE OR REPLACE FUNCTION match_manual_chunks (
  query_embedding     vector(1536),
  match_threshold     float,
  match_count         int,
  filter_boat_type_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  manual_id   uuid,
  page_number integer,
  content     text,
  similarity  float,
  filename    text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    mc.id,
    mc.manual_id,
    mc.page_number,
    mc.content,
    1 - (mc.embedding <=> query_embedding) AS similarity,
    m.filename
  FROM manual_chunks mc
  JOIN manuals m ON m.id = mc.manual_id
  JOIN manual_boat_types mbt ON mbt.manual_id = mc.manual_id
  WHERE
    (filter_boat_type_id IS NULL OR mbt.boat_type_id = filter_boat_type_id)
    AND 1 - (mc.embedding <=> query_embedding) > match_threshold
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
$$;

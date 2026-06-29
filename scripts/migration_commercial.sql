-- Migration: Commercial Accounts + Fleet + Analytics
-- Run this in your Supabase SQL Editor

-- 1. Extend profiles with account type and company info
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type   TEXT NOT NULL DEFAULT 'personal'
                                          CHECK (account_type IN ('personal', 'commercial')),
  ADD COLUMN IF NOT EXISTS company_name   TEXT,
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- 2. Fleet boats (one per QR code, owned by a commercial account)
CREATE TABLE IF NOT EXISTS charter_boats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  boat_type_id UUID REFERENCES boat_types(id),
  boat_name    TEXT NOT NULL,
  configuration TEXT,
  qr_token     TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::TEXT, '-', ''),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Guest sessions (one per QR scan)
CREATE TABLE IF NOT EXISTS charter_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id    UUID NOT NULL REFERENCES charter_boats(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  language   TEXT
);

-- 4. Chat messages (user + assistant, with topic classification for analytics)
CREATE TABLE IF NOT EXISTS charter_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES charter_sessions(id) ON DELETE CASCADE,
  message_index   INTEGER NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  topic           TEXT,             -- AI-classified: navigation|sicherheit|motor|technik|komfort|proviant|wetter|sonstiges
  rag_chunks_used INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_charter_boats_owner    ON charter_boats(owner_id);
CREATE INDEX IF NOT EXISTS idx_charter_sessions_boat  ON charter_sessions(boat_id, started_at);
CREATE INDEX IF NOT EXISTS idx_charter_messages_sess  ON charter_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_charter_messages_topic ON charter_messages(topic) WHERE role = 'user';

-- 5. RLS
ALTER TABLE charter_boats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE charter_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE charter_messages  ENABLE ROW LEVEL SECURITY;

-- Commercial owner sees/manages their own boats
CREATE POLICY "owner_manages_boats" ON charter_boats
  FOR ALL USING (owner_id = auth.uid());

-- Public: anyone can read a boat by qr_token (needed for guest page)
CREATE POLICY "public_read_boat_by_token" ON charter_boats
  FOR SELECT USING (true);

-- Public: anyone can insert a session (QR scan)
CREATE POLICY "public_insert_session" ON charter_sessions
  FOR INSERT WITH CHECK (true);

-- Owner sees their boats' sessions
CREATE POLICY "owner_reads_sessions" ON charter_sessions
  FOR SELECT USING (
    boat_id IN (SELECT id FROM charter_boats WHERE owner_id = auth.uid())
  );

-- Public: anyone can insert messages into a session
CREATE POLICY "public_insert_messages" ON charter_messages
  FOR INSERT WITH CHECK (true);

-- Owner sees their boats' messages
CREATE POLICY "owner_reads_messages" ON charter_messages
  FOR SELECT USING (
    session_id IN (
      SELECT cs.id FROM charter_sessions cs
      JOIN charter_boats cb ON cb.id = cs.boat_id
      WHERE cb.owner_id = auth.uid()
    )
  );

-- 6. Supabase Storage bucket for company logos (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true)
-- ON CONFLICT DO NOTHING;

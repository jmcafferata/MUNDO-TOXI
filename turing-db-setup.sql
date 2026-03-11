-- Turing Test DB setup for Supabase
-- Run this in the Supabase SQL Editor (supabase.com → project → SQL Editor)

CREATE TABLE IF NOT EXISTS turing_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ      DEFAULT NOW(),
  status      TEXT             DEFAULT 'waiting',  -- 'waiting' | 'active' | 'concluded'
  human_side  CHAR(1)          NOT NULL,            -- 'A' or 'B'
  message_count INT            DEFAULT 0,
  user_guess  CHAR(1),                              -- 'A' or 'B'
  correct_guess BOOLEAN
);

CREATE TABLE IF NOT EXISTS turing_messages (
  id          BIGSERIAL PRIMARY KEY,
  session_id  UUID             REFERENCES turing_sessions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ      DEFAULT NOW(),
  role        TEXT             NOT NULL,            -- 'user' | 'human' | 'ai'
  column_side CHAR(1),                              -- 'A' or 'B' (null for user messages)
  content     TEXT             NOT NULL
);

-- Index for fast session message lookups
CREATE INDEX IF NOT EXISTS idx_turing_messages_session ON turing_messages(session_id, created_at);

-- Row Level Security (service role bypasses these — the backend uses service key)
ALTER TABLE turing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turing_messages ENABLE ROW LEVEL SECURITY;

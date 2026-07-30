CREATE TABLE IF NOT EXISTS candidate_states (
  candidate_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('verified', 'deleted')),
  updated_at TEXT NOT NULL
);

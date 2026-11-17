CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY CHECK (id = 'portfolio'),
  content TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  base_sha TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  publish_lock TEXT,
  lock_time INTEGER
);
CREATE TABLE IF NOT EXISTS publishes (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL,
  commit_sha TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

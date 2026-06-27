-- Initial schema. Replace with the real tables once designs land.
-- Apply locally:  npm run db:migrate:local
-- Apply remote:   npm run db:migrate:remote

CREATE TABLE IF NOT EXISTS examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

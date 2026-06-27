-- Allowlist of Google accounts permitted to sign into the admin panel.
-- Login is gated against this table (see src/auth.ts signIn callback).

CREATE TABLE IF NOT EXISTS allowlist (
  email TEXT PRIMARY KEY,
  added TEXT NOT NULL DEFAULT (date('now'))
);

INSERT OR IGNORE INTO allowlist (email, added) VALUES ('bopke2@gmail.com', date('now'));

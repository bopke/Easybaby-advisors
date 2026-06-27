-- Advisors live in D1 now (single source for the public list and the admin panel).
-- `regiony` is a JSON array of { woj, miasta: [...] }; woj filtering/counts use json_each.
-- Seeding is done lazily in code (see advisors-repo.ts) and guarded by app_meta,
-- so deleting advisors in the admin panel never triggers a re-seed.

CREATE TABLE IF NOT EXISTS advisors (
  id              TEXT PRIMARY KEY,
  imie            TEXT NOT NULL,
  nazwisko        TEXT NOT NULL,
  status          TEXT NOT NULL,
  zweryfikowany   INTEGER NOT NULL DEFAULT 0,
  zdjecie         TEXT NOT NULL DEFAULT '',
  regiony         TEXT NOT NULL DEFAULT '[]',
  email           TEXT NOT NULL DEFAULT '',
  telefon         TEXT NOT NULL DEFAULT '',
  www             TEXT NOT NULL DEFAULT '',
  specjalnosc     TEXT NOT NULL DEFAULT '',
  oferta          TEXT NOT NULL DEFAULT '',
  dataUprawnien   TEXT NOT NULL DEFAULT '',
  dataDolaczenia  TEXT NOT NULL DEFAULT '',
  dataWeryfikacji TEXT NOT NULL DEFAULT '',
  dataUtraty      TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_advisors_nazwisko ON advisors (nazwisko COLLATE NOCASE, imie COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

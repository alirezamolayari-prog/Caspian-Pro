/**
 * SQLite storage (built into Node 22, no native modules to compile).
 * One file: `{DATA_DIR}/caspian.db`. Back it up by copying the file.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stores (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  unit       TEXT NOT NULL,
  floor      TEXT NOT NULL,
  manager    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '',
  active     INTEGER NOT NULL DEFAULT 1
);

-- Phones allowed to log in for a store (owner, staff).
CREATE TABLE IF NOT EXISTS members (
  phone      TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS otps (
  phone      TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  sent_at    INTEGER NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  phone      TEXT NOT NULL,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id  TEXT,
  module     TEXT NOT NULL,
  title      TEXT NOT NULL,
  details    TEXT NOT NULL,
  status     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (store_id, client_id)
);
CREATE INDEX IF NOT EXISTS tickets_store ON tickets (store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS attachments (
  id         TEXT PRIMARY KEY,
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file       TEXT NOT NULL,
  mime       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,
  created_at INTEGER NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS notifications_store ON notifications (store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS push_subs (
  endpoint   TEXT PRIMARY KEY,
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone      TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- One parking reminder per store per subscription end date.
CREATE TABLE IF NOT EXISTS parking_reminders (
  store_id   TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  ends_at    INTEGER NOT NULL,
  sent_at    INTEGER NOT NULL,
  PRIMARY KEY (store_id, ends_at)
);
`;

/** Opens (or creates) the database. Pass `':memory:'` for tests. */
export function openDb(dataDir: string | ':memory:'): Db {
  let file = ':memory:';
  if (dataDir !== ':memory:') {
    mkdirSync(join(dataDir, 'uploads'), { recursive: true });
    file = join(dataDir, 'caspian.db');
  }
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

/** Runs `fn` inside a transaction. */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

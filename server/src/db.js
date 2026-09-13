import pg from 'pg';

/* Railway injects DATABASE_URL when a Postgres service is attached. */
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — attach a Postgres database to this service.');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  /* The database runs as a plain Postgres container with no TLS configured,
     and the API reaches it over Railway's private network, which does not
     leave Railway. Opt in explicitly if that ever changes. */
  ssl: /\bsslmode=require\b/.test(process.env.DATABASE_URL) || process.env.PGSSL === 'require'
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idleTimeoutMillis: 30_000,
  /* Without this a bad host hangs forever and the container looks silent. */
  connectionTimeoutMillis: 10_000,
});

/* Log where we are connecting, never the credentials — this is the one fact
   needed to tell an unresolved variable reference from a real outage. */
try {
  const u = new URL(process.env.DATABASE_URL);
  console.log(`database target: ${u.hostname}:${u.port || 5432}${u.pathname}`);
} catch (e) {
  console.error('DATABASE_URL is not a valid URL — check the variable reference');
}

export const q = (text, params) => pool.query(text, params);

/* The whole schema, applied on boot. Every statement is idempotent so a
   redeploy is a no-op and there is no separate migration step to forget. */
const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'member',
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- case-insensitive uniqueness without needing the citext extension
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  token      text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

-- One shared company dataset: exactly one row, id pinned to 1.
CREATE TABLE IF NOT EXISTS app_state (
  id         smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  version    integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO app_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
`;

export async function migrate() {
  await q(SCHEMA);
  console.log('schema ready');
}

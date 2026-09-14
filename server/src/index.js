import express from 'express';
import { q, migrate } from './db.js';
import {
  hashPassword, verifyPassword, createSession,
  requireAuth, requireAdmin, throttle, recordFail, clearFails,
} from './auth.js';

const app = express();
app.set('trust proxy', 1);            /* Railway terminates TLS in front of us */
app.use(express.json({ limit: '4mb' }));

/* ---------------------------------------------------------------- CORS ---
   The page lives on GitHub Pages and this API on Railway, so every request is
   cross-origin. The allow-list is explicit — never '*' — and credentials are
   not used, because auth travels in the Authorization header. */
const ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin && ORIGINS.includes(origin) ? 204 : 403);
  next();
});

const ok = (v) => typeof v === 'string' && v.trim().length > 0;

/* ---------------------------------------------------------------- health --*/
app.get('/api/health', async (_req, res) => {
  if (!dbReady) {
    /* Deliberately 200: the process is alive and this is the only place that
       explains why it cannot serve yet. A 502 with no body tells nobody
       anything. */
    return res.json({ ok: false, db: 'not_ready', error: dbError });
  }
  try {
    const { rows } = await q('SELECT count(*)::int AS users FROM users');
    res.json({ ok: true, users: rows[0].users, signup: signupMode() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

/* ------------------------------------------------------------------ auth --
   Who may create an account, set by the SIGNUP_MODE variable:
     invite  (default) — needs INVITE_CODE, which you set as a Railway variable
     domain            — any email ending in ALLOWED_EMAIL_DOMAIN
     open              — anyone at all, no code. Note what this means: the site
                         is a public URL, so anyone who finds it can read your
                         supplier prices and margins. Use it only briefly.
     closed            — nobody; an admin creates accounts
   The very first account is always allowed, and becomes the admin. */
function signupMode() {
  const m = (process.env.SIGNUP_MODE || 'invite').toLowerCase();
  return ['invite', 'domain', 'open', 'closed'].includes(m) ? m : 'invite';
}

async function signupAllowed(email, inviteCode) {
  const { rows } = await q('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) return { allowed: true, role: 'admin' };

  const mode = signupMode();
  if (mode === 'closed') return { allowed: false, reason: 'signup_closed' };
  if (mode === 'open') return { allowed: true, role: 'member' };
  if (mode === 'domain') {
    const domain = (process.env.ALLOWED_EMAIL_DOMAIN || '').toLowerCase().replace(/^@/, '');
    if (!domain) return { allowed: false, reason: 'signup_misconfigured' };
    return email.toLowerCase().endsWith('@' + domain)
      ? { allowed: true, role: 'member' }
      : { allowed: false, reason: 'email_domain_not_allowed' };
  }
  /* Compare leniently. The stored variable can easily pick up a trailing
     newline or space depending on how it was set, and a colleague pasting the
     code from a chat message brings its own whitespace — neither should read
     as "wrong code". Case is ignored too: this gates team sign-up, and a
     capitalisation mismatch costs far more in support than it buys in
     entropy. */
  const norm = v => String(v == null ? '' : v).trim().toLowerCase();
  const expected = norm(process.env.INVITE_CODE);
  if (!expected) return { allowed: false, reason: 'signup_misconfigured' };
  return norm(inviteCode) === expected
    ? { allowed: true, role: 'member' }
    : { allowed: false, reason: 'bad_invite_code' };
}

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, name, inviteCode } = req.body || {};
    if (!ok(email) || !ok(password)) return res.status(400).json({ error: 'email_and_password_required' });
    if (password.length < 8) return res.status(400).json({ error: 'password_too_short' });

    const gate = await signupAllowed(email, inviteCode);
    if (!gate.allowed) return res.status(403).json({ error: gate.reason });

    const hash = await hashPassword(password);
    let row;
    try {
      ({ rows: [row] } = await q(
        `INSERT INTO users (email, name, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING id, email, name, role`,
        [email.trim(), (name || '').trim(), hash, gate.role]
      ));
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'email_taken' });
      throw err;
    }
    const token = await createSession(row.id);
    res.status(201).json({ token, user: row });
  } catch (err) { next(err); }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!ok(email) || !ok(password)) return res.status(400).json({ error: 'email_and_password_required' });

    const key = `${req.ip}:${email.toLowerCase()}`;
    if (throttle(key).blocked) return res.status(429).json({ error: 'too_many_attempts' });

    const { rows } = await q(
      `SELECT id, email, name, role, password_hash FROM users WHERE lower(email) = lower($1)`,
      [email.trim()]
    );
    const user = rows[0];
    /* same response and roughly the same work either way, so the endpoint does
       not reveal which addresses have accounts */
    const good = user
      ? await verifyPassword(password, user.password_hash)
      : await verifyPassword(password, 'scrypt$16384$00$00');
    if (!user || !good) {
      recordFail(key);
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    clearFails(key);
    const token = await createSession(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

app.post('/api/auth/logout', requireAuth, async (req, res, next) => {
  try {
    await q('DELETE FROM sessions WHERE token = $1', [req.token]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

/* ----------------------------------------------------------------- state --
   One shared company dataset. Writes carry the version the client started
   from; if someone else saved in between, the write is refused with 409 and
   the current data comes back, so an edit is never silently overwritten. */
app.get('/api/state', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await q(
      `SELECT s.data, s.version, s.updated_at, u.name AS updated_by_name, u.email AS updated_by_email
         FROM app_state s LEFT JOIN users u ON u.id = s.updated_by
        WHERE s.id = 1`
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.put('/api/state', requireAuth, async (req, res, next) => {
  try {
    const { data, baseVersion } = req.body || {};
    if (data === undefined || data === null || typeof data !== 'object') {
      return res.status(400).json({ error: 'data_object_required' });
    }
    const { rows } = await q(
      `UPDATE app_state
          SET data = $1::jsonb, version = version + 1, updated_by = $2, updated_at = now()
        WHERE id = 1 AND ($3::int IS NULL OR version = $3::int)
        RETURNING version, updated_at`,
      [JSON.stringify(data), req.user.id, baseVersion === undefined ? null : baseVersion]
    );
    if (!rows.length) {
      const { rows: cur } = await q(
        `SELECT s.data, s.version, s.updated_at, u.name AS updated_by_name, u.email AS updated_by_email
           FROM app_state s LEFT JOIN users u ON u.id = s.updated_by WHERE s.id = 1`
      );
      return res.status(409).json({ error: 'version_conflict', current: cur[0] });
    }
    res.json({ ok: true, version: rows[0].version, updatedAt: rows[0].updated_at });
  } catch (err) { next(err); }
});

/* ----------------------------------------------------------------- users --*/
app.get('/api/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await q(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at'
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

/* Listen first. Railway's private network needs a moment after the container
   starts, so binding the port before touching the database means the service
   is reachable — and its logs are useful — even while Postgres is still
   coming up. */
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`formulation-api listening on ${port}`));

let dbReady = false;
let dbError = null;

(async function initDb(attempt = 1) {
  try {
    await migrate();
    dbReady = true;
    dbError = null;
    console.log('database ready');
  } catch (err) {
    dbError = String(err.message || err);
    console.error(`database not ready (attempt ${attempt}): ${dbError}`);
    if (attempt < 10) {
      setTimeout(() => initDb(attempt + 1), Math.min(attempt * 2000, 15000));
    } else {
      console.error('giving up on the database; /api/health explains the state');
    }
  }
})();

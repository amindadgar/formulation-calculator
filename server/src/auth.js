import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { q } from './db.js';

const scrypt = promisify(_scrypt);

/* scrypt ships with Node, so there is no native module to fail at deploy time.
   Format: scrypt$N$salt$hash — the parameters travel with the hash, so they
   can be raised later without invalidating existing passwords. */
const N = 16384, KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEYLEN, { N });
  return `scrypt$${N}$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, n, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt') return false;
  const key = await scrypt(password, salt, KEYLEN, { N: Number(n) });
  const expected = Buffer.from(hash, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

const SESSION_DAYS = 30;

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  await q(
    `INSERT INTO sessions (token, user_id, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [token, userId, String(SESSION_DAYS)]
  );
  return token;
}

/* Express middleware: resolves the Bearer token to req.user, or 401s.
   Cookies are deliberately not used — the page is served from GitHub Pages and
   the API from Railway, which makes every request cross-site, and Safari
   blocks third-party cookies outright. */
export async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'not_authenticated' });

    const { rows } = await q(
      `SELECT u.id, u.email, u.name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    );
    if (!rows.length) return res.status(401).json({ error: 'session_expired' });

    req.user = rows[0];
    req.token = token;
    /* touch at most once an hour, to keep this off the write path */
    q(`UPDATE sessions SET last_seen = now()
        WHERE token = $1 AND last_seen < now() - interval '1 hour'`, [token])
      .catch(() => {});
    next();
  } catch (err) { next(err); }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'admin_only' });
  next();
}

/* Small in-memory throttle on failed logins. Enough to stop casual guessing;
   it resets on redeploy and is per-instance, which is fine at this scale. */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000, MAX_FAILS = 10;

export function throttle(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(key, { first: now, count: 0 });
    return { blocked: false };
  }
  return { blocked: rec.count >= MAX_FAILS };
}

export function recordFail(key) {
  const rec = attempts.get(key);
  if (rec) rec.count += 1;
}

export function clearFails(key) { attempts.delete(key); }

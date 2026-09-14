/* Talks to the shared API. Loaded before app.js; does nothing at all when
 * window.FORMULATION_API is empty, which keeps the offline/file:// mode intact.
 *
 * Auth is a Bearer token in localStorage rather than a cookie: the page is
 * served from GitHub Pages and the API from Railway, so every request is
 * cross-site, and Safari blocks third-party cookies outright.
 */
'use strict';

const API_BASE = (window.FORMULATION_API || '').replace(/\/+$/, '');
const TOKEN_KEY = 'formulation-token';

const api = {
  enabled: !!API_BASE,
  user: null,
  version: null,          /* version of the shared state we last saw */
  lastSync: null,
};

function apiToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}
function setApiToken(tok) {
  try {
    if (tok) localStorage.setItem(TOKEN_KEY, tok);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) { /* private mode */ }
}

/* Throws an Error whose .code is the API's error string, so callers can map it
   to a translated message instead of showing raw server text. */
async function apiFetch(path, opts = {}) {
  if (!api.enabled) throw Object.assign(new Error('api_disabled'), { code: 'api_disabled' });
  const headers = Object.assign({}, opts.headers);
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const tok = apiToken();
  if (tok) headers['Authorization'] = 'Bearer ' + tok;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch (e) {
    throw Object.assign(new Error('network'), { code: 'network' });
  }

  let payload = null;
  try { payload = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) {
    const err = new Error((payload && payload.error) || ('http_' + res.status));
    err.code = (payload && payload.error) || ('http_' + res.status);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

const apiAuth = {
  /* Which sign-up rule the server is enforcing, so the form can ask for an
     invite code only when one is actually required. Never blocks sign-in: if
     the server cannot be reached we fall back to asking for the code. */
  async signupMode() {
    try {
      const h = await apiFetch('/api/health');
      return h && h.signup ? h.signup : 'invite';
    } catch (e) {
      return 'invite';
    }
  },

  async register(email, password, name, inviteCode) {
    const r = await apiFetch('/api/auth/register', {
      method: 'POST', body: { email, password, name, inviteCode },
    });
    setApiToken(r.token); api.user = r.user; return r.user;
  },
  async login(email, password) {
    const r = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
    setApiToken(r.token); api.user = r.user; return r.user;
  },
  async logout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch (e) { /* offline */ }
    setApiToken(''); api.user = null; api.version = null;
  },
  /* Resolves to the user for a still-valid stored token, or null. */
  async resume() {
    if (!api.enabled || !apiToken()) return null;
    try {
      const r = await apiFetch('/api/auth/me');
      api.user = r.user;
      return r.user;
    } catch (e) {
      if (e.status === 401) setApiToken('');
      return null;
    }
  },
};

const apiState = {
  async pull() {
    const r = await apiFetch('/api/state');
    api.version = r.version;
    api.lastSync = new Date();
    return r;
  },
  /* Returns {ok:true} or {conflict:true, current} — never throws on a version
     clash, because that is an expected outcome with several people editing. */
  async push(data) {
    try {
      const r = await apiFetch('/api/state', {
        method: 'PUT', body: { data, baseVersion: api.version },
      });
      api.version = r.version;
      api.lastSync = new Date();
      return { ok: true, version: r.version };
    } catch (e) {
      if (e.status === 409) {
        return { conflict: true, current: e.payload && e.payload.current };
      }
      throw e;
    }
  },
};

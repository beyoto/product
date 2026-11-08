const pool = require('../config/db.js');
const { isStore, storeFromOrigin } = require('../config/stores.js');

const SEVERITY = {
  login_success: 'info',
  logout: 'info',
  token_missing: 'info',
  token_expired: 'info',
  admin_action: 'info',
  login_failed: 'warning',
  login_new_ip: 'warning',
  token_invalid: 'warning',
  access_denied: 'warning',
  admin_created: 'warning',
  admin_updated: 'warning',
  admin_deleted: 'warning',
  login_blocked: 'critical',
  login_success_after_failures: 'critical',
  register_probe: 'critical',
};

// Эти события может вызывать кто угодно без входа. Лимит не даёт забить ими базу.
const THROTTLED = new Set([
  'token_missing', 'token_expired', 'token_invalid', 'login_blocked', 'register_probe',
]);
const THROTTLE_MS = 60 * 1000;
const lastWritten = new Map();

function isThrottled(type, ip) {
  if (!THROTTLED.has(type)) return false;

  const key = `${type}:${ip}`;
  const now = Date.now();
  if (now - (lastWritten.get(key) || 0) < THROTTLE_MS) return true;

  if (lastWritten.size > 10000) lastWritten.clear();
  lastWritten.set(key, now);
  return false;
}

const clip = (value, max) => (typeof value === 'string' ? value.slice(0, max) : null);

// Магазин из тела запроса указывает сам клиент, поэтому годится только для журнала.
function declaredStore(req) {
  const store = req.body?.store;
  return typeof store === 'string' && isStore(store) ? store : null;
}

// Журнал не должен ломать запрос, поэтому ошибки записи только выводятся в консоль.
// Пароли и токены сюда не передавать.
async function recordSecurityEvent(req, type, fields = {}) {
  const { username, store, status, details } = fields;
  const ip = req.ip || null;

  if (isThrottled(type, ip)) return;

  try {
    await pool.query(
      `INSERT INTO security_events
        (severity, event_type, username, store, ip, user_agent, method, path, status, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        SEVERITY[type] || 'info',
        type,
        clip(username, 50),
        store ?? storeFromOrigin(req.headers.origin) ?? declaredStore(req),
        clip(ip, 64),
        clip(req.headers['user-agent'], 300),
        req.method,
        clip(req.originalUrl.split('?')[0], 200),
        status ?? null,
        JSON.stringify({ origin: clip(req.headers.origin, 200), ...details }),
      ]
    );
  } catch (err) {
    console.error('Security log write failed:', err.message);
  }
}

module.exports = { recordSecurityEvent };

const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const { isStore, siteKey } = require('../config/stores.js');
const { recordSecurityEvent } = require('../utils/securityLog.js');

const STORE_ROUTE = /^\/api\/(?:products|analytics)(?:_([A-Za-z0-9_]+))?$/;
const SITE_ROUTE = /^\/api\/sites\/([a-z0-9-]+)$/;

// Магазин определяется по пути, на котором смонтирован роутер.
// null означает, что путь не относится к магазину: туда пускаем только суперадмина.
function storeFromRequest(req) {
  const site = req.baseUrl.match(SITE_ROUTE);
  if (site) return siteKey(site[1]);

  const match = req.baseUrl.match(STORE_ROUTE);
  if (!match) return null;

  const key = match[1] || 'main';
  return isStore(key) ? key : null;
}

// Проверяет токен и читает админа из базы при каждом запросе, поэтому
// блокировка админа или смена его магазинов действуют сразу, а не через 7 дней.
async function loadAdmin(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401, error: 'No token provided', event: 'token_missing' };
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    return {
      status: 401,
      error: 'Invalid or expired token',
      event: err.name === 'TokenExpiredError' ? 'token_expired' : 'token_invalid',
    };
  }

  const result = await pool.query(
    'SELECT id, username, role, stores, is_active FROM admins WHERE id = $1',
    [decoded.id]
  );
  const admin = result.rows[0];

  if (!admin || !admin.is_active) {
    return { status: 401, error: 'Invalid or expired token', event: 'token_invalid' };
  }

  return { admin };
}

function guard(isAllowed, { audit = false } = {}) {
  return async (req, res, next) => {
    try {
      const store = storeFromRequest(req);
      const { admin, status, error, event } = await loadAdmin(req);

      if (!admin) {
        recordSecurityEvent(req, event, { store, status });
        return res.status(status).json({ error });
      }

      if (!isAllowed(admin, req)) {
        recordSecurityEvent(req, 'access_denied', { username: admin.username, store, status: 403 });
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.admin = admin;

      if (audit && req.method !== 'GET') {
        res.on('finish', () => {
          recordSecurityEvent(req, 'admin_action', {
            username: admin.username,
            store,
            status: res.statusCode,
          });
        });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

const isSuperAdmin = (admin) => admin.role === 'super_admin';

// Роуты магазинов: нужен доступ именно к этому магазину.
const checkAuth = guard((admin, req) => {
  if (isSuperAdmin(admin)) return true;
  const store = storeFromRequest(req);
  return store !== null && admin.stores.includes(store);
}, { audit: true });

// Любой вошедший админ.
const requireAdmin = guard(() => true);

// Управление админами.
const requireSuperAdmin = guard(isSuperAdmin);

module.exports = checkAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireSuperAdmin = requireSuperAdmin;

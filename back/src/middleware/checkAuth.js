const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const { isStore } = require('../config/stores.js');

const STORE_ROUTE = /^\/api\/(?:products|analytics)(?:_([A-Za-z0-9_]+))?$/;

// Магазин определяется по пути, на котором смонтирован роутер.
// null означает, что путь не относится к магазину: туда пускаем только суперадмина.
function storeFromRequest(req) {
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
    return { status: 401, error: 'No token provided' };
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    return { status: 401, error: 'Invalid or expired token' };
  }

  const result = await pool.query(
    'SELECT id, username, role, stores, is_active FROM admins WHERE id = $1',
    [decoded.id]
  );
  const admin = result.rows[0];

  if (!admin || !admin.is_active) {
    return { status: 401, error: 'Invalid or expired token' };
  }

  return { admin };
}

function guard(isAllowed) {
  return async (req, res, next) => {
    try {
      const { admin, status, error } = await loadAdmin(req);
      if (!admin) return res.status(status).json({ error });

      if (!isAllowed(admin, req)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.admin = admin;
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
});

// Любой вошедший админ.
const requireAdmin = guard(() => true);

// Управление админами.
const requireSuperAdmin = guard(isSuperAdmin);

module.exports = checkAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireSuperAdmin = requireSuperAdmin;

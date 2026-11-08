const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db.js');
const { SHOP, STORES, isStore, isSiteKey, siteKey } = require('../config/stores.js');
const { requireSuperAdmin } = require('../middleware/checkAuth');
const { recordSecurityEvent } = require('../utils/securityLog.js');
const { validatePassword, validateUsername } = require('../utils/passwords.js');
const superSitesRouter = require('./superSites.js');

const EVENT_FILTERS = {
  severity: (value) => ['info', 'warning', 'critical'].includes(value),
  event_type: (value) => /^[a-z_]{1,50}$/.test(value),
  store: isStore,
  username: (value) => value.length <= 50,
  ip: (value) => value.length <= 64,
};
const ALERT_TYPES = [
  'login_failed', 'login_blocked', 'login_success_after_failures',
  'access_denied', 'token_invalid', 'register_probe',
];

const ADMIN_FIELDS = 'id, username, role, stores, is_active, created_at';

router.use(requireSuperAdmin);
router.use('/sites', superSitesRouter);

// Старые магазины — из config/stores.js, магазины из конструктора — должны существовать в sites.
async function validateStores(stores) {
  if (!Array.isArray(stores) || !stores.every((key) => typeof key === 'string' && isStore(key))) return false;

  const slugs = stores.filter(isSiteKey).map((key) => key.slice('site:'.length));
  if (slugs.length === 0) return true;

  const result = await pool.query('SELECT COUNT(*)::int AS count FROM sites WHERE slug = ANY($1)', [slugs]);
  return result.rows[0].count === new Set(slugs).size;
}

// Суперадмин не редактируется через панель, поэтому себя случайно не заблокировать.
async function findStoreAdmin(id) {
  if (!/^\d{1,9}$/.test(id)) return { status: 404, error: 'Admin not found' };

  const result = await pool.query('SELECT id, role FROM admins WHERE id = $1', [id]);
  const admin = result.rows[0];

  if (!admin) return { status: 404, error: 'Admin not found' };
  if (admin.role !== 'store_admin') return { status: 403, error: 'Суперадмина здесь менять нельзя' };
  return { admin };
}

// GET /api/super/stores — старые магазины и магазины из конструктора
router.get('/stores', async (req, res) => {
  try {
    const sites = await pool.query('SELECT slug, name FROM sites ORDER BY created_at');
    res.json([
      ...Object.entries(STORES).map(([key, store]) => ({ key, label: store.label, url: store.url })),
      ...sites.rows.map((site) => ({ key: siteKey(site.slug), label: site.name, url: `${SHOP}/${site.slug}/` })),
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/super/admins
router.get('/admins', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${ADMIN_FIELDS} FROM admins ORDER BY role DESC, username`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/super/admins — создать админа магазинов
router.post('/admins', async (req, res) => {
  try {
    const { password, stores } = req.body;
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';

    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Логин должен быть от 3 до 50 символов' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Пароль должен быть от 8 до 72 символов' });
    }
    if (!(await validateStores(stores)) || stores.length === 0) {
      return res.status(400).json({ error: 'Выбери хотя бы один магазин' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO admins (username, password_hash, role, stores)
       VALUES ($1, $2, 'store_admin', $3)
       RETURNING ${ADMIN_FIELDS}`,
      [username, passwordHash, stores]
    );

    recordSecurityEvent(req, 'admin_created', {
      username: req.admin.username,
      status: 201,
      details: { target: username, stores },
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/super/admins/:id — магазины, блокировка, новый пароль
router.patch('/admins/:id', async (req, res) => {
  try {
    const { stores, is_active: isActive, password } = req.body;
    const { admin, status, error } = await findStoreAdmin(req.params.id);
    if (!admin) return res.status(status).json({ error });

    if (stores !== undefined && !(await validateStores(stores))) {
      return res.status(400).json({ error: 'Неизвестный магазин' });
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be boolean' });
    }
    if (password !== undefined && !validatePassword(password)) {
      return res.status(400).json({ error: 'Пароль должен быть от 8 до 72 символов' });
    }

    const passwordHash = password === undefined ? null : await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE admins
       SET stores = COALESCE($1, stores),
           is_active = COALESCE($2, is_active),
           password_hash = COALESCE($3, password_hash)
       WHERE id = $4
       RETURNING ${ADMIN_FIELDS}`,
      [stores ?? null, isActive ?? null, passwordHash, admin.id]
    );

    recordSecurityEvent(req, 'admin_updated', {
      username: req.admin.username,
      status: 200,
      details: {
        target: result.rows[0].username,
        stores,
        is_active: isActive,
        password_changed: password !== undefined,
      },
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/super/admins/:id
router.delete('/admins/:id', async (req, res) => {
  try {
    const { admin, status, error } = await findStoreAdmin(req.params.id);
    if (!admin) return res.status(status).json({ error });

    await pool.query('DELETE FROM admins WHERE id = $1', [admin.id]);

    recordSecurityEvent(req, 'admin_deleted', {
      username: req.admin.username,
      status: 200,
      details: { target_id: admin.id },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/super/events — журнал безопасности, новые записи первыми
router.get('/events', async (req, res) => {
  try {
    const where = [];
    const params = [];

    for (const [field, isValid] of Object.entries(EVENT_FILTERS)) {
      const value = req.query[field];
      if (value === undefined || value === '') continue;
      if (typeof value !== 'string' || !isValid(value)) {
        return res.status(400).json({ error: `Invalid ${field}` });
      }
      params.push(value);
      where.push(`${field} = $${params.length}`);
    }

    if (req.query.before !== undefined) {
      if (!/^\d{1,18}$/.test(req.query.before)) {
        return res.status(400).json({ error: 'Invalid before' });
      }
      params.push(req.query.before);
      where.push(`id < $${params.length}`);
    }

    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 200);
    params.push(limit);

    const result = await pool.query(
      `SELECT * FROM security_events
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY id DESC
       LIMIT $${params.length}`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/super/events/summary — сводка за 24 часа
router.get('/events/summary', async (req, res) => {
  try {
    const [counts, topIps] = await Promise.all([
      pool.query(
        `SELECT event_type, COUNT(*)::int AS count
         FROM security_events
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY event_type`
      ),
      pool.query(
        `SELECT ip, COUNT(*)::int AS count, MAX(created_at) AS last_seen
         FROM security_events
         WHERE created_at > NOW() - INTERVAL '24 hours' AND event_type = ANY($1)
         GROUP BY ip
         ORDER BY count DESC
         LIMIT 5`,
        [ALERT_TYPES]
      ),
    ]);

    res.json({
      counts: Object.fromEntries(counts.rows.map((row) => [row.event_type, row.count])),
      topIps: topIps.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db.js');
const { STORES, isStore } = require('../config/stores.js');
const { requireSuperAdmin } = require('../middleware/checkAuth');
const { logEvent } = require('../utils/logger.js');

const ADMIN_FIELDS = 'id, username, role, stores, is_active, created_at';

router.use(requireSuperAdmin);

function validateStores(stores) {
  return Array.isArray(stores) && stores.every((key) => typeof key === 'string' && isStore(key));
}

// bcrypt учитывает только первые 72 байта пароля
function validatePassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && Buffer.byteLength(password) <= 72;
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

// GET /api/super/stores
router.get('/stores', (req, res) => {
  res.json(Object.entries(STORES).map(([key, store]) => ({ key, ...store })));
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

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Логин должен быть от 3 до 50 символов' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Пароль должен быть от 8 до 72 символов' });
    }
    if (!validateStores(stores) || stores.length === 0) {
      return res.status(400).json({ error: 'Выбери хотя бы один магазин' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO admins (username, password_hash, role, stores)
       VALUES ($1, $2, 'store_admin', $3)
       RETURNING ${ADMIN_FIELDS}`,
      [username, passwordHash, stores]
    );

    logEvent('admin_created', { by: req.admin.username, username, stores });
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

    if (stores !== undefined && !validateStores(stores)) {
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

    logEvent('admin_updated', {
      by: req.admin.username,
      id: admin.id,
      stores,
      is_active: isActive,
      password_changed: password !== undefined,
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

    logEvent('admin_deleted', { by: req.admin.username, id: admin.id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const { logEvent } = require('../utils/logger.js')
const { requireAdmin } = require('../middleware/checkAuth');

// Открытой регистрации нет: админов создаёт суперадмин (/api/super/admins),
// а самого суперадмина — скрипт src/scripts/createSuperAdmin.js.

// POST /api/auth/login — получить JWT токен
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword || !admin.is_active) {
      logEvent('login_failed', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    //логирование
    logEvent('login_success', { username: admin.username });
    
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — кто вошёл и к каким магазинам есть доступ
router.get('/me', requireAdmin, (req, res) => {
  const { id, username, role, stores } = req.admin;
  res.json({ id, username, role, stores });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const { requireAdmin } = require('../middleware/checkAuth');
const { recordSecurityEvent } = require('../utils/securityLog.js');
const {
  RETRY_AFTER_SECONDS,
  countFailures,
  isBlocked,
  isSuspiciousSuccess,
  isNewIpForUser,
} = require('../utils/loginGuard.js');

// Сравнение с этим хешем выравнивает время ответа для несуществующего логина.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

// Открытой регистрации нет: админов создаёт суперадмин (/api/super/admins),
// а самого суперадмина — скрипт src/scripts/createSuperAdmin.js.
// Обращения к старому адресу — признак сканирования, поэтому фиксируем их.
router.post('/register', (req, res) => {
  recordSecurityEvent(req, 'register_probe', { status: 404 });
  res.status(404).json({ error: 'Not found' });
});

// POST /api/auth/login — получить JWT токен
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const failures = await countFailures(req.ip, username);

    if (isBlocked(failures)) {
      recordSecurityEvent(req, 'login_blocked', { username, status: 429, details: failures });
      res.set('Retry-After', String(RETRY_AFTER_SECONDS));
      return res.status(429).json({ error: 'Слишком много попыток. Попробуй через 15 минут' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);

    if (!admin || !validPassword || !admin.is_active) {
      let reason = 'bad_password';
      if (!admin) reason = 'unknown_user';
      else if (validPassword) reason = 'account_blocked';

      // Ждём записи: по этим событиям считается лимит попыток.
      await recordSecurityEvent(req, 'login_failed', { username, status: 401, details: { reason } });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const details = { role: admin.role };

    if (isSuspiciousSuccess(failures)) {
      recordSecurityEvent(req, 'login_success_after_failures', {
        username: admin.username,
        status: 200,
        details: failures,
      });
    }
    if (await isNewIpForUser(admin.username, req.ip)) {
      recordSecurityEvent(req, 'login_new_ip', { username: admin.username, status: 200, details });
    }
    recordSecurityEvent(req, 'login_success', { username: admin.username, status: 200, details });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout — фиксирует выход в журнале
router.post('/logout', requireAdmin, (req, res) => {
  recordSecurityEvent(req, 'logout', { username: req.admin.username, status: 200 });
  res.json({ ok: true });
});

// GET /api/auth/me — кто вошёл и к каким магазинам есть доступ
router.get('/me', requireAdmin, (req, res) => {
  const { id, username, role, stores } = req.admin;
  res.json({ id, username, role, stores });
});

module.exports = router;

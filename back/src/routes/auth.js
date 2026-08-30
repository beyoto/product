const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db.js');
const { logEvent } = require('../utils/logger.js')

// POST /api/auth/register — создать админа (используешь один раз вручную, потом можно убрать/защитить)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, password_hash]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

    if (!validPassword) {
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

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');


router.post('/', async (req, res) => {
  try {
    const { name, attending, guestsCount } = req.body;

    if (!name || typeof attending !== 'boolean') {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const result = await pool.query(
      `INSERT INTO guests (name, attending, guests_count) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), attending, guestsCount || 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
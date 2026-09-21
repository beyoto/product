const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const checkAuth = require('../middleware/checkAuth');

// GET /api/analytics_asiamixx/views?productId=5&range=24h|7d|30d
router.get('/views', checkAuth, async (req, res) => {
  try {
    const { productId, range } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const intervals = {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
    };

    const interval = intervals[range] || intervals['24h'];

    const result = await pool.query(
      `SELECT captured_at, views_count
       FROM views_snapshots_asiamixx
       WHERE product_id = $1 AND captured_at >= NOW() - INTERVAL '${interval}'
       ORDER BY captured_at ASC`,
      [productId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics_asiamixx/views-summary?range=24h|7d|30d — сумма просмотров всех товаров вместе
router.get('/views-summary', checkAuth, async (req, res) => {
  try {
    const { range } = req.query;
    const intervals = { '24h': '24 hours', '7d': '7 days', '30d': '30 days' };
    const interval = intervals[range] || intervals['24h'];

    const result = await pool.query(
      `SELECT captured_at, SUM(views_count) AS total_views
       FROM views_snapshots_asiamixx
       WHERE captured_at >= NOW() - INTERVAL '${interval}'
       GROUP BY captured_at
       ORDER BY captured_at ASC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics_asiamixx/views-compare?productIds=1,2,3&range=24h|7d|30d — сравнение нескольких товаров
router.get('/views-compare', checkAuth, async (req, res) => {
  try {
    const { productIds, range } = req.query;

    if (!productIds) {
      return res.status(400).json({ error: 'productIds is required' });
    }

    const ids = productIds.split(',').map(Number);
    const intervals = { '24h': '24 hours', '7d': '7 days', '30d': '30 days' };
    const interval = intervals[range] || intervals['24h'];

    const result = await pool.query(
      `SELECT captured_at, product_id, views_count
       FROM views_snapshots_asiamixx
       WHERE product_id = ANY($1) AND captured_at >= NOW() - INTERVAL '${interval}'
       ORDER BY captured_at ASC`,
      [ids]
    );

    // Собираем строки в формат, удобный для Recharts:
    // [{ captured_at, "5": 12, "9": 4 }, ...]
    const grouped = {};
    for (const row of result.rows) {
      const key = row.captured_at.toISOString();
      if (!grouped[key]) grouped[key] = { captured_at: row.captured_at };
      grouped[key][row.product_id] = row.views_count;
    }

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
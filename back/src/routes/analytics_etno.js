const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const checkAuth = require('../middleware/checkAuth');

const intervals = { '24h': '24 hours', '7d': '7 days', '30d': '30 days' };

router.get('/views', checkAuth, async (req, res) => {
  try {
    const { productId, range } = req.query;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const interval = intervals[range] || intervals['24h'];
    const result = await pool.query(
      `SELECT captured_at, views_count
       FROM views_snapshots_etno
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

router.get('/views-summary', checkAuth, async (req, res) => {
  try {
    const interval = intervals[req.query.range] || intervals['24h'];
    const result = await pool.query(
      `SELECT captured_at, SUM(views_count) AS total_views
       FROM views_snapshots_etno
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

router.get('/views-compare', checkAuth, async (req, res) => {
  try {
    const { productIds, range } = req.query;
    if (!productIds) return res.status(400).json({ error: 'productIds is required' });

    const ids = productIds.split(',').map(Number);
    const interval = intervals[range] || intervals['24h'];
    const result = await pool.query(
      `SELECT captured_at, product_id, views_count
       FROM views_snapshots_etno
       WHERE product_id = ANY($1) AND captured_at >= NOW() - INTERVAL '${interval}'
       ORDER BY captured_at ASC`,
      [ids]
    );

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

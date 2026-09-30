const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');
const { logEvent } = require('../utils/logger.js');
const checkAuth = require('../middleware/checkAuth.js');

router.get('/', async (req, res) => {
  try {
    const { category, sort } = req.query;
    let query = `
      SELECT p.*,
        COALESCE(
          json_agg(pi.image_url ORDER BY pi.position)
            FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM products_ernis_costumes p
      LEFT JOIN product_images_ernis_costumes pi ON pi.product_id = p.id
      WHERE p.is_active = true
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    query += ' GROUP BY p.id';

    if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
    else query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/admin/all', checkAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(
          json_agg(pi.image_url ORDER BY pi.position)
            FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM products_ernis_costumes p
      LEFT JOIN product_images_ernis_costumes pi ON pi.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        COALESCE(
          json_agg(pi.image_url ORDER BY pi.position)
            FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS images
       FROM products_ernis_costumes p
       LEFT JOIN product_images_ernis_costumes pi ON pi.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await pool.query(
      'UPDATE products_ernis_costumes SET views_count = views_count + 1 WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', checkAuth, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!name || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'name, price, category are required' });
    }

    const result = await pool.query(
      `INSERT INTO products_ernis_costumes (name, description, price, category)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, price, category]
    );
    logEvent('product_created', { name: result.rows[0].name, price: result.rows[0].price });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, is_active } = req.body;
    const result = await pool.query(
      `UPDATE products_ernis_costumes SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        category = COALESCE($4, category),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description, price, category, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logEvent('product_edited', { id, changes: req.body });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products_ernis_costumes WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

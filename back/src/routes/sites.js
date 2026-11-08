// Магазины из конструктора: /api/sites/<slug>/...
// Один роутер на все магазины, товары разделены по site_id.
const express = require('express');
const streamifier = require('streamifier');
const pool = require('../config/db.js');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');
const checkAuth = require('../middleware/checkAuth.js');
const { SITE_TYPES, THEMES } = require('../config/siteTypes.js');
const { ValidationError, validateProduct } = require('../utils/siteValidation.js');

const router = express.Router({ mergeParams: true });

const MAX_IMAGES = 10;
const INTERVALS = { '24h': '24 hours', '7d': '7 days', '30d': '30 days' };
const ID_RE = /^\d{1,9}$/;

const handleError = (res, err) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
};

// Публичный набор полей типа магазина: что показывать на сайте и в форме товара.
function publicType(type) {
  const def = SITE_TYPES[type];
  return {
    key: type,
    label: def.label,
    categories: def.categories,
    fields: def.fields,
    hero: def.hero,
    badges: def.badges,
    catalogTitle: def.catalogTitle,
  };
}

router.use(async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM sites WHERE slug = $1', [req.params.slug]);
    const site = result.rows[0];
    if (!site || !SITE_TYPES[site.type]) return res.status(404).json({ error: 'Магазин не найден' });

    req.site = site;
    req.siteType = SITE_TYPES[site.type];
    next();
  } catch (err) {
    handleError(res, err);
  }
});

// Отключённый магазин не виден покупателям. Админка (под checkAuth) продолжает работать.
const requireActiveSite = (req, res, next) => (
  req.site.is_active ? next() : res.status(404).json({ error: 'Магазин не найден' })
);

const IMAGES_URLS = `
  COALESCE(
    (SELECT json_agg(i.image_url ORDER BY i.position, i.id) FROM site_product_images i WHERE i.product_id = p.id),
    '[]'
  ) AS images`;

const IMAGES_FULL = `
  COALESCE(
    (SELECT json_agg(json_build_object('id', i.id, 'url', i.image_url) ORDER BY i.position, i.id)
     FROM site_product_images i WHERE i.product_id = p.id),
    '[]'
  ) AS images`;

// GET /api/sites/:slug — настройки магазина для сайта
router.get('/', requireActiveSite, (req, res) => {
  const { slug, name, theme, info } = req.site;
  res.json({
    slug,
    name,
    info,
    theme: { key: theme, ...(THEMES[theme] || THEMES.blush) },
    type: publicType(req.site.type),
  });
});

function parsePrice(value) {
  if (value === undefined || value === '') return undefined;
  const price = Number(value);
  if (typeof value !== 'string' || !Number.isFinite(price) || price < 0) throw new ValidationError('Неверный фильтр цены');
  return price;
}

// GET /api/sites/:slug/products?category=&price_from=&price_to=&sort=&attr.<поле>=
router.get('/products', requireActiveSite, async (req, res) => {
  try {
    const { category, sort } = req.query;
    const params = [req.site.id];
    const where = ['p.site_id = $1', 'p.is_active = true'];

    if (category !== undefined && category !== '') {
      if (!req.siteType.categories.some((item) => item.value === category)) {
        throw new ValidationError('Неизвестная категория');
      }
      params.push(category);
      where.push(`p.category = $${params.length}`);
    }

    const from = parsePrice(req.query.price_from);
    const to = parsePrice(req.query.price_to);
    if (from !== undefined) {
      params.push(from);
      where.push(`p.price >= $${params.length}`);
    }
    if (to !== undefined) {
      params.push(to);
      where.push(`p.price <= $${params.length}`);
    }

    // Фильтры по особым полям: только поля с filter и только значения из справочника.
    for (const field of req.siteType.fields) {
      const value = req.query[`attr.${field.key}`];
      if (!field.filter || value === undefined || value === '') continue;
      if (typeof value !== 'string' || !field.options.some((option) => option.value === value)) {
        throw new ValidationError(`Неверный фильтр «${field.label}»`);
      }
      params.push(field.key, value);
      const keyParam = `$${params.length - 1}`;
      const valueParam = `$${params.length}`;
      where.push(field.type === 'multiselect'
        ? `p.attributes -> ${keyParam} ? ${valueParam}`
        : `p.attributes ->> ${keyParam} = ${valueParam}`);
    }

    let order = 'p.created_at DESC';
    if (sort === 'price_asc') order = 'p.price ASC, p.id DESC';
    else if (sort === 'price_desc') order = 'p.price DESC, p.id DESC';

    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.category, p.attributes, p.created_at, ${IMAGES_URLS}
       FROM site_products p
       WHERE ${where.join(' AND ')}
       ORDER BY ${order}
       LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/sites/:slug/products/:id — карточка товара, считает просмотр
router.get('/products/:id', requireActiveSite, async (req, res) => {
  try {
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Товар не найден' });

    const result = await pool.query(
      `UPDATE site_products p SET views_count = views_count + 1
       WHERE p.id = $1 AND p.site_id = $2 AND p.is_active = true
       RETURNING p.id, p.name, p.description, p.price, p.category, p.attributes, ${IMAGES_URLS}`,
      [req.params.id, req.site.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err);
  }
});

// ===== Админка магазина =====

// GET /api/sites/:slug/admin/products — все товары, включая скрытые
router.get('/admin/products', checkAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, ${IMAGES_URLS} FROM site_products p
       WHERE p.site_id = $1 ORDER BY p.created_at DESC`,
      [req.site.id]
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err);
  }
});

async function findProduct(req, fields = 'p.*') {
  if (!ID_RE.test(req.params.id)) return null;
  const result = await pool.query(
    `SELECT ${fields} FROM site_products p WHERE p.id = $1 AND p.site_id = $2`,
    [req.params.id, req.site.id]
  );
  return result.rows[0] || null;
}

// GET /api/sites/:slug/admin/products/:id — для формы редактирования (фото с id)
router.get('/admin/products/:id', checkAuth, async (req, res) => {
  try {
    const product = await findProduct(req, `p.*, ${IMAGES_FULL}`);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/sites/:slug/products
router.post('/products', checkAuth, async (req, res) => {
  try {
    const values = validateProduct(req.siteType, req.body);
    const result = await pool.query(
      `INSERT INTO site_products (site_id, name, description, price, category, attributes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.site.id, values.name, values.description, values.price, values.category,
        JSON.stringify(values.attributes), values.is_active ?? true,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleError(res, err);
  }
});

const UPDATABLE = ['name', 'description', 'price', 'category', 'attributes', 'is_active'];

// PUT /api/sites/:slug/products/:id — можно прислать только изменённые поля
router.put('/products/:id', checkAuth, async (req, res) => {
  try {
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Товар не найден' });

    const values = validateProduct(req.siteType, req.body, { partial: true });
    const sets = [];
    const params = [];
    for (const key of UPDATABLE) {
      if (values[key] === undefined) continue;
      params.push(key === 'attributes' ? JSON.stringify(values[key]) : values[key]);
      sets.push(`${key} = $${params.length}`);
    }
    if (sets.length === 0) throw new ValidationError('Нечего сохранять');

    params.push(req.params.id, req.site.id);
    const result = await pool.query(
      `UPDATE site_products SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length - 1} AND site_id = $${params.length}
       RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/sites/:slug/products/:id
router.delete('/products/:id', checkAuth, async (req, res) => {
  try {
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Товар не найден' });
    const result = await pool.query(
      'DELETE FROM site_products WHERE id = $1 AND site_id = $2 RETURNING id',
      [req.params.id, req.site.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

function uploadToCloudinary(buffer, slug) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `sites/${slug}` },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/sites/:slug/products/:id/images — до 5 файлов за раз, всего до MAX_IMAGES
router.post('/products/:id/images', checkAuth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Файлы не выбраны' });

    const product = await findProduct(req, 'p.id');
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    const existing = await pool.query(
      'SELECT COUNT(*)::int AS count, COALESCE(MAX(position), -1)::int AS last FROM site_product_images WHERE product_id = $1',
      [product.id]
    );
    const { count, last } = existing.rows[0];
    if (count + req.files.length > MAX_IMAGES) {
      return res.status(400).json({ error: `У товара может быть не больше ${MAX_IMAGES} фото` });
    }

    const uploaded = await Promise.all(req.files.map((file) => uploadToCloudinary(file.buffer, req.site.slug)));
    const urls = uploaded.map((item) => item.secure_url);
    const positions = urls.map((_, index) => last + 1 + index);

    const result = await pool.query(
      `INSERT INTO site_product_images (product_id, image_url, position)
       SELECT $1, url, position FROM unnest($2::text[], $3::int[]) AS t(url, position)
       RETURNING id, image_url AS url`,
      [product.id, urls, positions]
    );
    res.status(201).json(result.rows);
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/sites/:slug/products/:id/images/:imageId
router.delete('/products/:id/images/:imageId', checkAuth, async (req, res) => {
  try {
    if (!ID_RE.test(req.params.id) || !ID_RE.test(req.params.imageId)) {
      return res.status(404).json({ error: 'Фото не найдено' });
    }
    const result = await pool.query(
      `DELETE FROM site_product_images i
       USING site_products p
       WHERE i.id = $1 AND i.product_id = $2 AND p.id = i.product_id AND p.site_id = $3
       RETURNING i.id`,
      [req.params.imageId, req.params.id, req.site.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Фото не найдено' });
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

// ===== Аналитика просмотров (снимки каждые 3 часа: jobs/viewsSnapshotJob_sites.js) =====

const intervalOf = (range) => INTERVALS[range] || INTERVALS['24h'];

router.get('/analytics/views', checkAuth, async (req, res) => {
  try {
    if (!ID_RE.test(String(req.query.productId))) throw new ValidationError('productId is required');
    const result = await pool.query(
      `SELECT s.captured_at, s.views_count
       FROM site_views_snapshots s JOIN site_products p ON p.id = s.product_id
       WHERE s.product_id = $1 AND p.site_id = $2 AND s.captured_at >= NOW() - $3::interval
       ORDER BY s.captured_at`,
      [req.query.productId, req.site.id, intervalOf(req.query.range)]
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/analytics/views-summary', checkAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.captured_at, SUM(s.views_count)::int AS total_views
       FROM site_views_snapshots s JOIN site_products p ON p.id = s.product_id
       WHERE p.site_id = $1 AND s.captured_at >= NOW() - $2::interval
       GROUP BY s.captured_at
       ORDER BY s.captured_at`,
      [req.site.id, intervalOf(req.query.range)]
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/analytics/views-compare', checkAuth, async (req, res) => {
  try {
    const ids = typeof req.query.productIds === 'string' ? req.query.productIds.split(',') : [];
    if (ids.length === 0 || ids.length > 20 || ids.some((id) => !ID_RE.test(id))) {
      throw new ValidationError('Invalid productIds');
    }
    const result = await pool.query(
      `SELECT s.captured_at, s.product_id, s.views_count
       FROM site_views_snapshots s JOIN site_products p ON p.id = s.product_id
       WHERE s.product_id = ANY($1::int[]) AND p.site_id = $2 AND s.captured_at >= NOW() - $3::interval
       ORDER BY s.captured_at`,
      [ids.map(Number), req.site.id, intervalOf(req.query.range)]
    );

    const grouped = {};
    for (const row of result.rows) {
      const key = row.captured_at.toISOString();
      if (!grouped[key]) grouped[key] = { captured_at: row.captured_at };
      grouped[key][row.product_id] = row.views_count;
    }
    res.json(Object.values(grouped));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;

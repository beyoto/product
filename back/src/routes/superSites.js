// /api/super/sites — конструктор магазинов. Доступ проверяет super.js (requireSuperAdmin).
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db.js');
const { SHOP, siteKey } = require('../config/stores.js');
const { SITE_TYPES, THEMES, toList } = require('../config/siteTypes.js');
const {
  ValidationError,
  validateSlug,
  validateType,
  validateTheme,
  validateInfo,
} = require('../utils/siteValidation.js');
const { validatePassword, validateUsername } = require('../utils/passwords.js');
const { recordSecurityEvent } = require('../utils/securityLog.js');

const router = express.Router();
const ID_RE = /^\d{1,9}$/;

const handleError = (res, err) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err.code === '23505') {
    const field = err.constraint?.includes('username') ? 'Такой логин уже занят' : 'Этот адрес уже занят';
    return res.status(409).json({ error: field });
  }
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
};

function validateName(name) {
  const value = typeof name === 'string' ? name.trim() : '';
  if (!value || value.length > 80) throw new ValidationError('Название: от 1 до 80 символов');
  return value;
}

const SITE_FIELDS = `
  s.id, s.slug, s.type, s.theme, s.name, s.info, s.is_active, s.created_at,
  (SELECT COUNT(*)::int FROM site_products p WHERE p.site_id = s.id) AS products_count,
  COALESCE(
    (SELECT array_agg(a.username ORDER BY a.username) FROM admins a WHERE ('site:' || s.slug) = ANY(a.stores)),
    '{}'
  ) AS admins`;

const withUrl = (site) => ({ ...site, key: siteKey(site.slug), url: `${SHOP}/${site.slug}/` });

// GET /api/super/sites/meta — типы магазинов и темы для формы создания
router.get('/meta', (req, res) => {
  res.json({ types: toList(SITE_TYPES), themes: toList(THEMES), shopUrl: SHOP });
});

// GET /api/super/sites
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${SITE_FIELDS} FROM sites s ORDER BY s.created_at DESC`);
    res.json(result.rows.map(withUrl));
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/super/sites — создать магазин и (по желанию) его админа одной транзакцией
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const slug = validateSlug(req.body.slug);
    const type = validateType(req.body.type);
    const theme = validateTheme(req.body.theme);
    const name = validateName(req.body.name);
    const info = validateInfo(req.body.info ?? {});

    let admin = null;
    if (req.body.admin) {
      const username = typeof req.body.admin.username === 'string' ? req.body.admin.username.trim() : '';
      if (!validateUsername(username)) throw new ValidationError('Логин админа: от 3 до 50 символов');
      if (!validatePassword(req.body.admin.password)) throw new ValidationError('Пароль админа: от 8 до 72 символов');
      admin = { username, passwordHash: await bcrypt.hash(req.body.admin.password, 10) };
    }

    await client.query('BEGIN');
    const created = await client.query(
      `INSERT INTO sites (slug, type, theme, name, info) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [slug, type, theme, name, JSON.stringify(info)]
    );
    if (admin) {
      await client.query(
        `INSERT INTO admins (username, password_hash, role, stores) VALUES ($1, $2, 'store_admin', $3)`,
        [admin.username, admin.passwordHash, [siteKey(slug)]]
      );
    }
    await client.query('COMMIT');

    recordSecurityEvent(req, 'site_created', {
      username: req.admin.username,
      store: siteKey(slug),
      status: 201,
      details: { target: slug, type, admin: admin?.username },
    });
    if (admin) {
      recordSecurityEvent(req, 'admin_created', {
        username: req.admin.username,
        store: siteKey(slug),
        status: 201,
        details: { target: admin.username, stores: [siteKey(slug)] },
      });
    }

    const result = await pool.query(`SELECT ${SITE_FIELDS} FROM sites s WHERE s.id = $1`, [created.rows[0].id]);
    res.status(201).json(withUrl(result.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    handleError(res, err);
  } finally {
    client.release();
  }
});

// PATCH /api/super/sites/:id — название, тема, тексты и контакты, включение.
// Адрес и тип не меняются: на них завязаны ссылки, права админов и поля товаров.
router.patch('/:id', async (req, res) => {
  try {
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Магазин не найден' });

    const { name, theme, info, is_active: isActive } = req.body;
    if (isActive !== undefined && typeof isActive !== 'boolean') throw new ValidationError('is_active must be boolean');

    const result = await pool.query(
      `UPDATE sites SET
         name = COALESCE($1, name),
         theme = COALESCE($2, theme),
         info = COALESCE($3, info),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
       WHERE id = $5 RETURNING slug`,
      [
        name === undefined ? null : validateName(name),
        theme === undefined ? null : validateTheme(theme),
        info === undefined ? null : JSON.stringify(validateInfo(info)),
        isActive ?? null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Магазин не найден' });

    const { slug } = result.rows[0];
    recordSecurityEvent(req, 'site_updated', {
      username: req.admin.username,
      store: siteKey(slug),
      status: 200,
      details: { target: slug, fields: Object.keys(req.body) },
    });

    const site = await pool.query(`SELECT ${SITE_FIELDS} FROM sites s WHERE s.id = $1`, [req.params.id]);
    res.json(withUrl(site.rows[0]));
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/super/sites/:id — тело { confirm: "<slug>" }. Удаляет магазин со всеми товарами.
// Фото остаются в Cloudinary (папка sites/<slug>).
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Магазин не найден' });

    const found = await client.query('SELECT slug FROM sites WHERE id = $1', [req.params.id]);
    const slug = found.rows[0]?.slug;
    if (!slug) return res.status(404).json({ error: 'Магазин не найден' });
    if (req.body?.confirm !== slug) throw new ValidationError('Для удаления введи адрес магазина');

    await client.query('BEGIN');
    await client.query('DELETE FROM sites WHERE id = $1', [req.params.id]);
    await client.query('UPDATE admins SET stores = array_remove(stores, $1) WHERE $1 = ANY(stores)', [siteKey(slug)]);
    await client.query('COMMIT');

    recordSecurityEvent(req, 'site_deleted', {
      username: req.admin.username,
      store: siteKey(slug),
      status: 200,
      details: { target: slug },
    });
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    handleError(res, err);
  } finally {
    client.release();
  }
});

module.exports = router;

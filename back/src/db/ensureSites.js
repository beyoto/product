const pool = require('../config/db.js');

// Магазины-конструкторы: одна схема на все магазины.
// Общие поля товара — колонки, особые поля типа магазина — attributes (JSONB),
// их состав и проверка — в config/siteTypes.js и utils/siteValidation.js.
async function ensureSites() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(40) UNIQUE NOT NULL,
      type VARCHAR(30) NOT NULL,
      theme VARCHAR(30) NOT NULL,
      name VARCHAR(80) NOT NULL,
      info JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_products (
      id SERIAL PRIMARY KEY,
      site_id INTEGER NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
      category VARCHAR(40) NOT NULL,
      attributes JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN NOT NULL DEFAULT true,
      views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS site_products_site_idx ON site_products (site_id, is_active, created_at DESC);

    CREATE TABLE IF NOT EXISTS site_product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES site_products (id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS site_product_images_product_idx ON site_product_images (product_id, position);

    CREATE TABLE IF NOT EXISTS site_views_snapshots (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES site_products (id) ON DELETE CASCADE,
      views_count INTEGER NOT NULL CHECK (views_count >= 0),
      captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS site_views_snapshots_idx ON site_views_snapshots (product_id, captured_at);
  `);
}

module.exports = ensureSites;

-- Таблица админов
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('ring', 'bracelet', 'chain', 'set')),
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица фото товара (несколько фото на товар)
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого фильтра по категории
CREATE INDEX idx_products_category ON products(category);

-- Индекс для быстрой выборки только активных товаров
CREATE INDEX idx_products_is_active ON products(is_active);
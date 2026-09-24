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
    category VARCHAR(20) NOT NULL CHECK (
        category IN (
            'ring',
            'bracelet',
            'chain',
            'set'
        )
    ),
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица фото товара (несколько фото на товар)
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого фильтра по категории
CREATE INDEX idx_products_category ON products (category);

-- Индекс для быстрой выборки только активных товаров
CREATE INDEX idx_products_is_active ON products (is_active);

CREATE TABLE views_snapshots (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL,
    captured_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products_asiamixx (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (
        category IN (
            'tshirt', -- футболки
            'shirt', -- рубашки
            'hoodie', -- худи/свитшоты
            'jacket', -- куртки
            'jeans', -- джинсы
            'pants', -- брюки
            'shorts', -- шорты
            'shoes', -- обувь
            'accessory', -- аксессуары (ремни, кепки и т.д.)
            'set' -- комплекты (верх+низ)
        )
    ),
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images_asiamixx (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_asiamixx (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE views_snapshots_asiamixx (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_asiamixx (id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL,
    captured_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products_etno (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (
        category IN (
            'tshirt',
            'jeans',
            'jacket',
            'hoodie',
            'shirt',
            'pants',
            'shorts',
            'shoes'
        )
    ),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images_etno (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_etno (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE views_snapshots_etno (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_etno (id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL,
    captured_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products_myrzaBrands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (
        category IN (
            'ring',
            'bracelet',
            'chain',
            'set'
        )
    ),
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images_myrzaBrands (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_myrzaBrands (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE views_snapshots_myrzaBrands (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_myrzaBrands (id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL,
    captured_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products_crowncarat (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (
        category IN ('gold', 'silver', 'diamond')
    ),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images_crowncarat (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_crowncarat (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE views_snapshots_crowncarat (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_crowncarat (id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL CHECK (views_count >= 0),
    captured_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products_baha_auto (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (
        category IN (
            'sedan',
            'suv',
            'hatchback',
            'minivan',
            'coupe',
            'pickup'
        )
    ),
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2030),
    mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
    engine_volume VARCHAR(20),
    transmission VARCHAR(20) NOT NULL,
    fuel VARCHAR(20) NOT NULL,
    drive VARCHAR(20) NOT NULL,
    steering VARCHAR(10) NOT NULL,
    condition VARCHAR(10) NOT NULL,
    color VARCHAR(50),
    vin VARCHAR(50),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images_baha_auto (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_baha_auto (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE views_snapshots_baha_auto (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_baha_auto (id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL,
    captured_at TIMESTAMP DEFAULT NOW()
);
require('dotenv').config(); // Загружает переменные из .env в process.env
const express = require('express');
const cors = require('cors'); // Разрешает запросы с фронтенда (другой домен/порт)
const pool = require('./config/db.js'); // Подключение к PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Позволяет читать JSON из тела запроса (req.body)

// Роуты товаров: GET/POST/PUT/DELETE для CRUD, включая GET /admin/all
const productRouter = require('./routes/products');
app.use('/api/products', productRouter)

const productAsiaMixxRouter = require('./routes/products_asiamixx')
app.use('/api/products_asiamixx', productAsiaMixxRouter)

const productImagesAsiamixxRouter = require('./routes/productImages_asiamixx');
app.use('/api/products_asiamixx', productImagesAsiamixxRouter);

const productEtnoRouter = require('./routes/products_etno');
app.use('/api/products_etno', productEtnoRouter);

const productImagesEtnoRouter = require('./routes/productImages_etno');
app.use('/api/products_etno', productImagesEtnoRouter);

const productMyrzaBrandsRouter = require('./routes/products_myrzaBrands');
app.use('/api/products_myrzaBrands', productMyrzaBrandsRouter);

const productImagesMyrzaBrandsRouter = require('./routes/productImages_myrzaBrands');
app.use('/api/products_myrzaBrands', productImagesMyrzaBrandsRouter);

// Роуты гостей (приглашение) — отдельный проект/фича, не связан с товарами
const guestRouter = require('./routes/guests');
app.use('/api/guests', guestRouter);

// Роуты авторизации: регистрация и логин админа, выдача JWT-токена
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Роуты для фото товаров: загрузка в Cloudinary и удаление конкретного фото
const productImagesRouter = require('./routes/productImages');
app.use('/api/products', productImagesRouter);

// Cron-задача: каждые 3 часа сохраняет снимок просмотров всех товаров
const startViewsSnapshotJob = require('./jobs/viewsSnapshotJob');
startViewsSnapshotJob();

const analyticsRouter = require('./routes/analytics');
app.use('/api/analytics', analyticsRouter);

const startViewsSnapshotJobAsiamixx = require('./jobs/viewsSnapshotJob_asiamixx');
startViewsSnapshotJobAsiamixx();

const analyticsAsiamixxRouter = require('./routes/analytics_asiamixx');
app.use('/api/analytics_asiamixx', analyticsAsiamixxRouter);

const startViewsSnapshotJobEtno = require('./jobs/viewsSnapshotJob_etno');
startViewsSnapshotJobEtno();

const analyticsEtnoRouter = require('./routes/analytics_etno');
app.use('/api/analytics_etno', analyticsEtnoRouter);

const startViewsSnapshotJobMyrzaBrands = require('./jobs/viewsSnapshotJob_myrzaBrands');
startViewsSnapshotJobMyrzaBrands();

const analyticsMyrzaBrandsRouter = require('./routes/analytics_myrzaBrands');
app.use('/api/analytics_myrzaBrands', analyticsMyrzaBrandsRouter);

//////////////////////////////////////////////////////////////////////////


// Проверка живости сервера и связи с базой данных (используется для отладки/мониторинга)
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      status: 'ok',
      dbTime: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error);

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

// Запуск сервера на указанном порту
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

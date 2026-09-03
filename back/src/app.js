require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const productRouter = require('./routes/products');
app.use('/api/products', productRouter)

const guestRouter = require('./routes/guests');
app.use('/api/guests', guestRouter);

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const productImagesRouter = require('./routes/productImages');
app.use('/api/products', productImagesRouter);


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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
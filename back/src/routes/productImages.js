const express = require('express');
const router = express.Router();
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');
const checkAuth = require('../middleware/checkAuth');
const pool = require('../config/db');

// Функция-обёртка: загружает буфер файла в Cloudinary через поток
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'jewelry_shop' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/products/:id/images — загрузить одно или несколько фото к товару
// Форма должна слать поле "images" (можно несколько файлов сразу)
router.post('/:id/images', checkAuth, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Загружаем все файлы параллельно в Cloudinary
    const uploadResults = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );

    // Сохраняем ссылки в БД
    const insertedImages = [];
    for (const result of uploadResults) {
      const dbResult = await pool.query(
        'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2) RETURNING *',
        [id, result.secure_url]
      );
      insertedImages.push(dbResult.rows[0]);
    }

    res.status(201).json(insertedImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/products/images/:imageId — удалить одно фото
router.delete('/images/:imageId', checkAuth, async (req, res) => {
  try {
    const { imageId } = req.params;
    const result = await pool.query(
      'DELETE FROM product_images WHERE id = $1 RETURNING *',
      [imageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const upload = require('../middleware/upload');
const checkAuth = require('../middleware/checkAuth');
const pool = require('../config/db');

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'etno_shop' },
      (error, result) => error ? reject(error) : resolve(result)
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

router.post('/:id/images', checkAuth, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadResults = await Promise.all(req.files.map((file) => uploadToCloudinary(file.buffer)));
    const insertedImages = [];
    for (const result of uploadResults) {
      const dbResult = await pool.query(
        'INSERT INTO product_images_etno (product_id, image_url) VALUES ($1, $2) RETURNING *',
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

router.delete('/images/:imageId', checkAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM product_images_etno WHERE id = $1 RETURNING *',
      [req.params.imageId]
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

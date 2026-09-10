const cron = require('node-cron');
const pool = require('../config/db');

function startViewsSnapshotJob() {
  // Запускается каждые 3 часа: в 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
  cron.schedule('0 */3 * * *', async () => {
    try {
      const products = await pool.query('SELECT id, views_count FROM products');
      const batchTime = new Date(); // одно время на весь снимок


      for (const product of products.rows) {
        await pool.query(
          'INSERT INTO views_snapshots (product_id, views_count, captured_at) VALUES ($1, $2, $3)',
          [product.id, product.views_count, batchTime]
        );
      }

      console.log(`[views_snapshot] Сохранено снимков: ${products.rows.length}`);
    } catch (err) {
      console.error('[views_snapshot] Ошибка при сохранении снимка:', err);
    }
  });
}

module.exports = startViewsSnapshotJob;
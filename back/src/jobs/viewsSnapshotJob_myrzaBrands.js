const cron = require('node-cron');
const pool = require('../config/db');

function startViewsSnapshotJobMyrzaBrands() {
  // Тот же интервал, что и у украшений: каждые 3 часа
  cron.schedule('0 */3 * * *', async () => {
    try {
      const products = await pool.query('SELECT id, views_count FROM products_myrzaBrands');
      const batchTime = new Date(); // одно время на весь снимок

      for (const product of products.rows) {
        await pool.query(
          'INSERT INTO views_snapshots_myrzaBrands (product_id, views_count, captured_at) VALUES ($1, $2, $3)',
          [product.id, product.views_count, batchTime]
        );
      }

      console.log(`[views_snapshot_myrzaBrands] Сохранено снимков: ${products.rows.length}`);
    } catch (err) {
      console.error('[views_snapshot_myrzaBrands] Ошибка при сохранении снимка:', err);
    }
  });
}

module.exports = startViewsSnapshotJobMyrzaBrands;
const cron = require('node-cron');
const pool = require('../config/db');

function startViewsSnapshotJobErnisCostumes() {
  cron.schedule('0 */3 * * *', async () => {
    try {
      const products = await pool.query(
        'SELECT id, views_count FROM products_ernis_costumes'
      );
      const batchTime = new Date();

      for (const product of products.rows) {
        await pool.query(
          `INSERT INTO views_snapshots_ernis_costumes
           (product_id, views_count, captured_at) VALUES ($1, $2, $3)`,
          [product.id, product.views_count, batchTime]
        );
      }

      console.log(`[views_snapshot_ernis_costumes] Saved snapshots: ${products.rows.length}`);
    } catch (err) {
      console.error('[views_snapshot_ernis_costumes] Snapshot save failed:', err);
    }
  });
}

module.exports = startViewsSnapshotJobErnisCostumes;

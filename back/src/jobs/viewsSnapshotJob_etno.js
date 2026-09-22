const cron = require('node-cron');
const pool = require('../config/db');

function startViewsSnapshotJobEtno() {
  cron.schedule('0 */3 * * *', async () => {
    try {
      const products = await pool.query('SELECT id, views_count FROM products_etno');
      const batchTime = new Date();

      for (const product of products.rows) {
        await pool.query(
          'INSERT INTO views_snapshots_etno (product_id, views_count, captured_at) VALUES ($1, $2, $3)',
          [product.id, product.views_count, batchTime]
        );
      }
      console.log(`[views_snapshot_etno] Saved snapshots: ${products.rows.length}`);
    } catch (err) {
      console.error('[views_snapshot_etno] Snapshot save failed:', err);
    }
  });
}

module.exports = startViewsSnapshotJobEtno;

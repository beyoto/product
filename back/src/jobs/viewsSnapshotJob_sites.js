const cron = require('node-cron');
const pool = require('../config/db');

// Каждые 3 часа снимок просмотров всех товаров всех магазинов-конструкторов одним запросом.
function startViewsSnapshotJobSites() {
  cron.schedule('0 */3 * * *', async () => {
    try {
      const result = await pool.query(
        `INSERT INTO site_views_snapshots (product_id, views_count, captured_at)
         SELECT id, views_count, date_trunc('minute', NOW()) FROM site_products`
      );
      console.log(`[views_snapshot_sites] Saved snapshots: ${result.rowCount}`);
    } catch (err) {
      console.error('[views_snapshot_sites] Snapshot save failed:', err);
    }
  });
}

module.exports = startViewsSnapshotJobSites;

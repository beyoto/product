const cron = require('node-cron');
const pool = require('../config/db.js');

const RETENTION_DAYS = 180;

// Раз в сутки удаляет записи журнала старше 180 дней.
function startSecurityEventsCleanup() {
  cron.schedule('0 4 * * *', async () => {
    try {
      await pool.query(
        `DELETE FROM security_events WHERE created_at < NOW() - make_interval(days => $1)`,
        [RETENTION_DAYS]
      );
    } catch (err) {
      console.error('Security log cleanup failed:', err.message);
    }
  });
}

module.exports = startSecurityEventsCleanup;

const pool = require('../config/db.js');

async function logEvent(eventType, details) {
  await pool.query(
    'INSERT INTO logs (event_type, details) VALUES ($1, $2)',
    [eventType, JSON.stringify(details)]
  );
}

module.exports = { logEvent };
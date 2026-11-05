const pool = require('../config/db.js');

async function logEvent(eventType, details) {
  try {
    await pool.query(
      'INSERT INTO logs (event_type, details) VALUES ($1, $2)',
      [eventType, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Log write failed:', err.message);
  }
}

module.exports = { logEvent };
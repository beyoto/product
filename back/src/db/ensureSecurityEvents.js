const pool = require('../config/db.js');

// Выполняется при старте сервера, поэтому не требует ручной миграции и публичного доступа к базе.
async function ensureSecurityEvents() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_events (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      severity VARCHAR(10) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
      event_type VARCHAR(50) NOT NULL,
      username VARCHAR(50),
      store VARCHAR(50),
      ip VARCHAR(64),
      user_agent VARCHAR(300),
      method VARCHAR(10),
      path VARCHAR(200),
      status INTEGER,
      details JSONB NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS security_events_created_idx ON security_events (created_at DESC);
    CREATE INDEX IF NOT EXISTS security_events_type_idx ON security_events (event_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS security_events_ip_idx ON security_events (ip, created_at DESC);
    CREATE INDEX IF NOT EXISTS security_events_user_idx ON security_events (username, created_at DESC);
  `);
}

module.exports = ensureSecurityEvents;

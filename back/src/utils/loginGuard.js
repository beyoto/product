const pool = require('../config/db.js');

const WINDOW = '15 minutes';
const RETRY_AFTER_SECONDS = 15 * 60;

const MAX_FAILS_PAIR = 5; // один IP подбирает пароль к одному логину
const MAX_FAILS_IP = 20; // один IP перебирает разные логины
const MAX_FAILS_USER = 30; // один логин атакуют с разных IP
const SUSPICIOUS_FAILS = 3;

async function countFailures(ip, username) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ip = $1 AND username = $2)::int AS pair,
       COUNT(*) FILTER (WHERE ip = $1)::int AS by_ip,
       COUNT(*) FILTER (WHERE username = $2)::int AS by_user
     FROM security_events
     WHERE event_type = 'login_failed'
       AND created_at > NOW() - INTERVAL '${WINDOW}'
       AND (ip = $1 OR username = $2)`,
    [ip, username]
  );
  return result.rows[0];
}

const isBlocked = ({ pair, by_ip: byIp, by_user: byUser }) => (
  pair >= MAX_FAILS_PAIR || byIp >= MAX_FAILS_IP || byUser >= MAX_FAILS_USER
);

const isSuspiciousSuccess = ({ pair, by_user: byUser }) => (
  pair >= SUSPICIOUS_FAILS || byUser >= SUSPICIOUS_FAILS
);

async function isNewIpForUser(username, ip) {
  const result = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE ip = $2)::int AS same_ip, COUNT(*)::int AS total
     FROM security_events
     WHERE event_type = 'login_success' AND username = $1`,
    [username, ip]
  );
  const { same_ip: sameIp, total } = result.rows[0];
  return total > 0 && sameIp === 0;
}

module.exports = {
  RETRY_AFTER_SECONDS,
  countFailures,
  isBlocked,
  isSuspiciousSuccess,
  isNewIpForUser,
};

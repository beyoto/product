// npm run migrate:admins
const fs = require('fs');
const path = require('path');
const pool = require('../config/db.js');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '../db/migrate_admin_roles.sql'), 'utf8');
  await pool.query(sql);

  const result = await pool.query(
    'SELECT username, role, cardinality(stores) AS stores_count FROM admins ORDER BY id'
  );
  console.log('Миграция выполнена. Админы:');
  console.table(result.rows);
}

main()
  .catch((err) => {
    console.error('Ошибка миграции:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

// npm run super:check -- <логин>
// Только читает базу: показывает, куда подключён скрипт, и проверяет логин с паролем.
const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../config/db.js');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    rl._writeToOutput = () => {};
  });
}

async function main() {
  const username = (process.argv[2] || '').trim();
  if (!username) throw new Error('Укажи логин: npm run super:check -- <логин>');

  const { hostname, port } = new URL(process.env.DATABASE_URL);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  console.log(`База: ${hostname}:${port} (${isLocal ? 'ЛОКАЛЬНАЯ, не Railway' : 'внешняя'})`);

  const columns = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'admins' AND column_name = 'is_active'`
  );
  const migrated = columns.rows.length > 0;
  console.log(`Миграция: ${migrated ? 'есть' : 'НЕТ'}`);
  if (!migrated) return;

  const list = await pool.query(
    'SELECT username, role, cardinality(stores) AS stores_count, is_active FROM admins ORDER BY id'
  );
  console.table(list.rows);

  const admin = await pool.query(
    'SELECT password_hash, role, is_active FROM admins WHERE username = $1',
    [username]
  );
  if (admin.rows.length === 0) {
    console.log(`Логина "${username}" в этой базе нет.`);
    return;
  }

  const password = await askHidden('Пароль (ввод скрыт): ');
  const valid = await bcrypt.compare(password, admin.rows[0].password_hash);
  console.log(`Пароль: ${valid ? 'подходит' : 'НЕ подходит'}`);
  console.log(`Роль: ${admin.rows[0].role}, активен: ${admin.rows[0].is_active}`);
}

main()
  .catch((err) => {
    console.error('Ошибка:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

// npm run super:create -- <логин>
// Создаёт суперадмина или делает суперадмином существующего и задаёт ему новый пароль.
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
    // Подсказка уже напечатана, дальше не показываем вводимые символы.
    rl._writeToOutput = () => {};
  });
}

async function main() {
  const username = (process.argv[2] || '').trim();
  if (username.length < 3 || username.length > 50) {
    throw new Error('Укажи логин: npm run super:create -- <логин>');
  }

  const password = await askHidden('Пароль (минимум 12 символов, ввод скрыт): ');
  if (password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('Пароль должен быть от 12 до 72 символов');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admins (username, password_hash, role, stores, is_active)
     VALUES ($1, $2, 'super_admin', '{}', true)
     ON CONFLICT (username) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, role = 'super_admin', is_active = true`,
    [username, passwordHash]
  );

  console.log(`Суперадмин ${username} готов.`);
}

main()
  .catch((err) => {
    console.error('Ошибка:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

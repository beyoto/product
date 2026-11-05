// npm run railway:setup -- <логин>
// Спрашивает адрес базы Railway, запускает миграцию и создаёт суперадмина именно там.
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

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

function parseUrl(value) {
  const url = value.trim().replace(/^["']|["']$/g, '');

  let hostname;
  try {
    ({ hostname } = new URL(url));
  } catch (err) {
    throw new Error('Это не похоже на адрес базы. Он должен начинаться с postgresql://');
  }

  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Это локальная база, нужен адрес Railway');
  }
  if (hostname.endsWith('.railway.internal')) {
    throw new Error('Это внутренний адрес. Нужен DATABASE_PUBLIC_URL');
  }

  return { url, hostname };
}

function runScript(file, args) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file), ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`Шаг ${file} не выполнен`);
}

async function main() {
  const username = (process.argv[2] || '').trim();
  if (!username) throw new Error('Укажи логин: npm run railway:setup -- <логин>');

  const { url, hostname } = parseUrl(await askHidden('Вставь DATABASE_PUBLIC_URL (ввод скрыт) и нажми Enter: '));
  console.log(`База: ${hostname}`);

  // Заданную здесь переменную dotenv не перезапишет значением из .env.
  process.env.DATABASE_URL = url;

  runScript('migrateAdminRoles.js', []);
  runScript('createSuperAdmin.js', [username]);

  console.log('Готово. Теперь войди на https://aveline-pi.vercel.app/super');
}

main().catch((err) => {
  console.error('Ошибка:', err.message);
  process.exitCode = 1;
});

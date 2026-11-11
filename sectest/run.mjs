// Локальный тест безопасности своего API (цель — http://127.0.0.1:3001).
// Только своя копия приложения на тестовой базе. Ничего боевого не трогаем.
import crypto from 'node:crypto';

const BASE = 'http://127.0.0.1:3001';
const rnd = crypto.randomBytes(3).toString('hex');
const results = [];
const rec = (name, pass, detail) => { results.push({ name, pass, detail }); };

async function api(path, { method = 'GET', token, body, raw } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? (raw ?? JSON.stringify(body)) : undefined });
  let data = null; const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

const login = async (username, password) => {
  const r = await api('/api/auth/login', { method: 'POST', body: { username, password } });
  return r.status === 200 ? r.data.token : null;
};

// ───────────────────────── Подготовка ─────────────────────────
const superTok = await login('rootsec', 'SuperTest12345');
if (!superTok) { console.error('Не удалось войти суперадмином — проверь сид'); process.exit(1); }

const shopA = `seca-${rnd}`, shopB = `secb-${rnd}`;
const mkSite = (slug, adminUser) => api('/api/super/sites', {
  method: 'POST', token: superTok,
  body: { slug, type: 'clothing', theme: 'ocean', name: `Shop ${slug}`,
    admin: { username: adminUser, password: 'AdminPass123' } },
});
const ca = await mkSite(shopA, `adminA_${rnd}`);
const cb = await mkSite(shopB, `adminB_${rnd}`);
rec('Подготовка: создание 2 магазинов суперадмином', ca.status === 201 && cb.status === 201, `A=${ca.status} B=${cb.status}`);

const tokA = await login(`adminA_${rnd}`, 'AdminPass123');
const tokB = await login(`adminB_${rnd}`, 'AdminPass123');
rec('Подготовка: вход обоими админами магазинов', !!tokA && !!tokB, `A=${!!tokA} B=${!!tokB}`);

// adminA создаёт товар в своём магазине
const createP = await api(`/api/sites/${shopA}/products`, {
  method: 'POST', token: tokA,
  body: { name: 'Secret A', description: 'd', price: 100, category: 'tshirt', attributes: {} },
});
const prodId = createP.data?.id;
rec('Подготовка: adminA создал товар в своём магазине', createP.status === 201 && !!prodId, `status=${createP.status}`);

// ─────────────────── A. Изоляция между магазинами (BOLA/IDOR) ───────────────────
{
  // adminB читает товар магазина A через путь A (нет доступа к store A)
  const readViaA = await api(`/api/sites/${shopA}/admin/products/${prodId}`, { token: tokB });
  rec('A1. adminB НЕ читает товар чужого магазина (путь A)', readViaA.status === 403, `ожид 403, получили ${readViaA.status}`);

  // adminB пытается подменить товар A, обращаясь по своему пути B (IDOR по id)
  const putViaB = await api(`/api/sites/${shopB}/products/${prodId}`, {
    method: 'PUT', token: tokB, body: { name: 'HACKED', price: 1 },
  });
  const putBlocked = putViaB.status === 404 || putViaB.status === 403;
  rec('A2. adminB НЕ меняет товар A через свой путь B (IDOR по id)', putBlocked, `status=${putViaB.status}`);

  // adminB удаляет товар A по своему пути B
  const delViaB = await api(`/api/sites/${shopB}/products/${prodId}`, { method: 'DELETE', token: tokB });
  const delBlocked = delViaB.status === 404 || delViaB.status === 403;
  rec('A3. adminB НЕ удаляет товар A через свой путь B', delBlocked, `status=${delViaB.status}`);

  // Контроль: товар A цел и доступен его владельцу
  const stillThere = await api(`/api/sites/${shopA}/admin/products/${prodId}`, { token: tokA });
  const intact = stillThere.status === 200 && stillThere.data?.name === 'Secret A';
  rec('A4. Товар A не изменён и не удалён (контроль)', intact, `status=${stillThere.status} name=${stillThere.data?.name}`);
}

// ─────────────────── B. Доступ без токена ───────────────────
{
  const noTok = await api(`/api/sites/${shopA}/admin/products`, {});
  rec('B1. Админ-эндпоинт без токена → 401', noTok.status === 401, `status=${noTok.status}`);
  const superNoTok = await api('/api/super/sites', {});
  rec('B2. Супер-эндпоинт без токена → 401', superNoTok.status === 401, `status=${superNoTok.status}`);
}

// ─────────────────── C. Подделка JWT ───────────────────
{
  // Подмена подписи
  const parts = tokA.split('.');
  const tampered = `${parts[0]}.${parts[1]}.${crypto.randomBytes(32).toString('base64url')}`;
  const r1 = await api(`/api/sites/${shopA}/admin/products`, { token: tampered });
  rec('C1. Токен с подменённой подписью → 401', r1.status === 401, `status=${r1.status}`);

  // alg:none — классический обход
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const noneTok = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: 1, username: 'rootsec' })}.`;
  const r2 = await api('/api/super/sites', { token: noneTok });
  rec('C2. Поддельный токен alg:none → 401', r2.status === 401, `status=${r2.status}`);

  // Токен, подписанный чужим секретом
  const jwtMod = await import('jsonwebtoken').catch(() => null);
  if (jwtMod) {
    const forged = jwtMod.default.sign({ id: 1, username: 'rootsec' }, 'wrong-secret');
    const r3 = await api('/api/super/sites', { token: forged });
    rec('C3. Токен с чужим секретом → 401', r3.status === 401, `status=${r3.status}`);
  }
}

// ─────────────────── D. Повышение привилегий ───────────────────
{
  // Админ магазина лезет в суперадминку
  const r1 = await api('/api/super/sites', { token: tokA });
  rec('D1. Админ магазина НЕ получает список всех магазинов → 403', r1.status === 403, `status=${r1.status}`);
  const r2 = await api('/api/super/admins', { token: tokA });
  rec('D2. Админ магазина НЕ видит всех админов → 403', r2.status === 403, `status=${r2.status}`);
  // Пытается создать магазин
  const r3 = await api('/api/super/sites', { method: 'POST', token: tokA, body: { slug: `evil-${rnd}`, type: 'clothing', theme: 'ocean', name: 'x' } });
  rec('D3. Админ магазина НЕ создаёт магазины → 403', r3.status === 403, `status=${r3.status}`);
}

// ─────────────────── E. SQL-инъекции ───────────────────
{
  // В логине
  const r1 = await api('/api/auth/login', { method: 'POST', body: { username: "admin' OR '1'='1", password: "x' OR '1'='1" } });
  rec('E1. SQLi в логине не даёт входа', r1.status === 401 || r1.status === 400, `status=${r1.status}`);

  // В параметре id
  const r2 = await api(`/api/sites/${shopA}/admin/products/1 OR 1=1`, { token: tokA });
  const safe2 = r2.status === 400 || r2.status === 404 || (r2.status === 200 && r2.data == null);
  rec('E2. SQLi в :id не выгружает чужие строки', safe2, `status=${r2.status}`);

  // В slug
  const r3 = await api(`/api/sites/${shopA}' OR '1'='1/products`, {});
  rec('E3. SQLi в slug не ломает выборку', r3.status === 404 || r3.status === 400, `status=${r3.status}`);

  // Сервер жив после инъекций
  const h = await api('/api/health');
  rec('E4. Сервер жив после инъекций (health=ok)', h.status === 200 && h.data?.status === 'ok', `status=${h.status}`);
}

// ─────────────────── F. Mass assignment (подмена чужих полей) ───────────────────
{
  // Пытаемся выставить site_id чужого магазина и is_demo через тело запроса
  const bId = cb.data?.id; // внутренний id магазина B неизвестен админу A; пробуем явно
  const r = await api(`/api/sites/${shopA}/products`, {
    method: 'POST', token: tokA,
    body: { name: 'MassAssign', description: 'd', price: 10, category: 'tshirt', attributes: {},
      site_id: 999999, is_demo: true, id: 1 },
  });
  // Товар должен создаться в магазине A, а не в 999999, и не стать демо
  let placedOk = false, notDemo = false;
  if (r.status === 201 && r.data?.id) {
    const check = await api(`/api/sites/${shopA}/admin/products/${r.data.id}`, { token: tokA });
    placedOk = check.status === 200;
    notDemo = check.data?.is_demo !== true;
  }
  rec('F1. Лишние поля (site_id/id) не уводят товар из магазина', placedOk, `status=${r.status}`);
  rec('F2. Нельзя через тело пометить товар демо (is_demo)', notDemo, `is_demo=${r.data?.is_demo}`);
}

// ─────────────────── G. Валидация ввода ───────────────────
{
  const bad = await api(`/api/sites/${shopA}/products`, {
    method: 'POST', token: tokA,
    body: { name: 123, price: 'бесплатно', category: {}, attributes: 'нет' },
  });
  rec('G1. Кривые типы товара отклоняются (4xx)', bad.status >= 400 && bad.status < 500, `status=${bad.status}`);

  const huge = 'A'.repeat(100000);
  const big = await api(`/api/sites/${shopA}/products`, {
    method: 'POST', token: tokA, body: { name: huge, description: huge, price: 1, category: 'tshirt', attributes: {} },
  });
  rec('G2. Сервер не падает на огромном вводе', big.status >= 200 && big.status < 500, `status=${big.status}`);

  const brokenJson = await api('/api/auth/login', { method: 'POST', body: {}, raw: '{ broken', });
  rec('G3. Битый JSON → 4xx, не 500', brokenJson.status >= 400 && brokenJson.status < 500, `status=${brokenJson.status}`);
}

// ─────────────────── H. Заголовки и утечки ───────────────────
{
  const r = await api('/api/health');
  const xp = r.headers.get('x-powered-by');
  rec('H1. Нет заголовка X-Powered-By (скрыт Express)', !xp, xp ? `есть: ${xp}` : 'отсутствует');

  // Трассировки стека не утекают в тело ошибки
  const err = await api(`/api/sites/${shopA}/admin/products/1 OR 1=1`, { token: tokA });
  const leak = typeof err.data === 'string' && /at \/|\\node_modules\\|Error:.*\n\s+at /.test(err.data);
  rec('H2. Стек-трейсы не утекают в ответах об ошибке', !leak, leak ? 'есть трассировка' : 'чисто');
}

// ─────────────────── I. Ограничение попыток входа ───────────────────
{
  let blocked = false, last = 0;
  for (let i = 0; i < 12; i++) {
    const r = await api('/api/auth/login', { method: 'POST', body: { username: `brute_${rnd}`, password: 'nope' } });
    last = r.status;
    if (r.status === 429) { blocked = true; break; }
  }
  rec('I1. Есть ограничение на перебор пароля (429)', blocked, blocked ? 'сработало 429' : `без лимита, последний=${last}`);
}

// ───────────────────────── Отчёт ─────────────────────────
const pass = results.filter((r) => r.pass).length;
console.log('\n================ ОТЧЁТ ПО БЕЗОПАСНОСТИ (локально) ================\n');
for (const r of results) console.log(`${r.pass ? ' OK ' : 'FAIL'} | ${r.name}\n       ${r.detail}`);
console.log(`\nИтог: ${pass}/${results.length} проверок пройдено.`);
const fails = results.filter((r) => !r.pass);
if (fails.length) { console.log('\nТребует внимания:'); fails.forEach((f) => console.log(' - ' + f.name + ' (' + f.detail + ')')); }
console.log('\n==================================================================\n');

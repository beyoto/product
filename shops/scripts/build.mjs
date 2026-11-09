// npm run build            собрать все магазины и шаблон конструктора
// npm run build -- baha    собрать один магазин
// npm run build -- site    собрать только шаблон конструктора
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import {
  SITE_APP_BASE,
  SITE_DIR,
  STORES_DIR,
  checkVercelRewrites,
  listStores,
  prepareStore,
  setApiEnv,
  setStoreEnv,
} from './stores.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');

checkVercelRewrites();

const requested = process.argv.slice(2);
const buildSite = !requested.length || requested.includes('site');
const stores = requested.length ? requested.filter((slug) => slug !== 'site') : listStores();

for (const slug of stores) {
  if (!fs.existsSync(path.join(STORES_DIR, slug))) {
    throw new Error(`Магазин ${slug} не найден в stores/`);
  }
}

if (!requested.length) fs.rmSync(DIST, { recursive: true, force: true });

// Магазины из конструктора (суперадминка) — одна сборка на все, настройки грузятся с API.
if (buildSite) {
  console.log('\n=== шаблон конструктора (site) ===');
  setApiEnv();
  await build({
    root: SITE_DIR,
    base: SITE_APP_BASE,
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    build: {
      outDir: path.join(DIST, SITE_APP_BASE),
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
    },
  });
}

for (const slug of stores) {
  console.log(`\n=== ${slug} ===`);
  const root = prepareStore(slug);
  setStoreEnv(slug);

  await build({
    root,
    base: `/${slug}/`,
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    build: {
      outDir: path.join(DIST, slug),
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
    },
  });
}

// Главная kg-shop.vercel.app — визитка владельца (landing/), список магазинов не показываем.
// index.html → корень, картинки → /_landing/ (путь с «_» не примут за адрес магазина).
const LANDING = path.join(ROOT, 'landing');
fs.mkdirSync(path.join(DIST, '_landing'), { recursive: true });
for (const file of fs.readdirSync(LANDING)) {
  const target = file === 'index.html' ? path.join(DIST, 'index.html') : path.join(DIST, '_landing', file);
  fs.copyFileSync(path.join(LANDING, file), target);
}

console.log(`\nГотово: ${stores.length} магаз.${buildSite ? ' + шаблон конструктора' : ''}`);

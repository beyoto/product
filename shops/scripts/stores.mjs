import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CORE_DIR = path.join(ROOT, 'core');
const WORK_DIR = path.join(ROOT, '.build');

export const STORES_DIR = path.join(ROOT, 'stores');
export const SITE_DIR = path.join(ROOT, 'site');
// Путь сборки шаблона конструктора. Подчёркивание не может быть в адресе магазина, конфликтов нет.
export const SITE_APP_BASE = '/_app/';

const DEFAULT_API_URL = 'https://product-production-1794.up.railway.app';

export function listStores() {
  return fs.readdirSync(STORES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

// Сайт магазина = core + файлы из stores/<магазин>, которые заменяют одноимённые.
export function prepareStore(slug) {
  const target = path.join(WORK_DIR, slug);

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(CORE_DIR, target, { recursive: true });
  fs.cpSync(path.join(STORES_DIR, slug), target, { recursive: true });

  return target;
}

export function setApiEnv() {
  process.env.VITE_API_URL ??= DEFAULT_API_URL;
}

export function setStoreEnv(slug) {
  const config = JSON.parse(fs.readFileSync(path.join(STORES_DIR, slug, 'store.json'), 'utf8'));

  process.env.VITE_STORE = slug;
  process.env.VITE_STORE_KEY = config.key;
  setApiEnv();
}

// vercel.json отправляет пути старых магазинов в их сборки, остальные — в шаблон конструктора.
// Если добавить папку в stores/ и забыть vercel.json, магазин откроет шаблон — поэтому сборка падает.
export function checkVercelRewrites() {
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const source = vercel.rewrites[0]?.source || '';
  const listed = (source.match(/^\/:store\(([^)]*)\)/)?.[1] || '').split('|').filter(Boolean).sort();
  const stores = listStores();

  if (listed.join() !== stores.join()) {
    throw new Error([
      'vercel.json: в первом rewrite должны быть все папки stores/.',
      `Сейчас: ${listed.join(', ')}`,
      `Нужно:  ${stores.join(', ')}`,
    ].join('\n'));
  }
}

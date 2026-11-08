import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CORE_DIR = path.join(ROOT, 'core');
const WORK_DIR = path.join(ROOT, '.build');

export const STORES_DIR = path.join(ROOT, 'stores');

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

export function setStoreEnv(slug) {
  const config = JSON.parse(fs.readFileSync(path.join(STORES_DIR, slug, 'store.json'), 'utf8'));

  process.env.VITE_STORE = slug;
  process.env.VITE_STORE_KEY = config.key;
  process.env.VITE_API_URL ??= DEFAULT_API_URL;
}

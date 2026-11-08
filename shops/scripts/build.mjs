// npm run build            собрать все магазины
// npm run build -- baha    собрать один магазин
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { STORES_DIR, listStores, prepareStore, setStoreEnv } from './stores.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');

const requested = process.argv.slice(2);
const stores = requested.length ? requested : listStores();

for (const slug of stores) {
  if (!fs.existsSync(path.join(STORES_DIR, slug))) {
    throw new Error(`Магазин ${slug} не найден в stores/`);
  }
}

if (!requested.length) fs.rmSync(DIST, { recursive: true, force: true });

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

const links = listStores()
  .map((slug) => `<li><a href="/${slug}/">${slug}</a></li>`)
  .join('');

fs.writeFileSync(
  path.join(DIST, 'index.html'),
  `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Магазины</title></head><body><h1>Магазины</h1><ul>${links}</ul></body></html>`
);

console.log(`\nГотово: ${stores.length} магаз.`);

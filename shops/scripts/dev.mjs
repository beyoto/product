// npm run dev -- baha    старый магазин
// npm run dev -- site    шаблон конструктора: открывать http://localhost:5173/<адрес-магазина>/
// Правки в core/ и stores/ попадают в сборку после перезапуска команды.
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import { SITE_DIR, prepareStore, setApiEnv, setStoreEnv } from './stores.mjs';

const slug = process.argv[2];
if (!slug) throw new Error('Укажи магазин: npm run dev -- baha (или site)');

const isSite = slug === 'site';
if (isSite) setApiEnv();
else setStoreEnv(slug);

const server = await createServer({
  root: isSite ? SITE_DIR : prepareStore(slug),
  base: isSite ? '/' : `/${slug}/`,
  configFile: false,
  plugins: [react()],
});

await server.listen();
server.printUrls();

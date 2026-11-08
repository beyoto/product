// npm run dev -- baha
// Правки в core/ и stores/ попадают в сборку после перезапуска команды.
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import { prepareStore, setStoreEnv } from './stores.mjs';

const slug = process.argv[2];
if (!slug) throw new Error('Укажи магазин: npm run dev -- baha');

const root = prepareStore(slug);
setStoreEnv(slug);

const server = await createServer({
  root,
  base: `/${slug}/`,
  configFile: false,
  plugins: [react()],
});

await server.listen();
server.printUrls();

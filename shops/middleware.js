// Vercel Routing Middleware: для магазинов из конструктора вписывает SEO и превью ссылок в HTML,
// отдаёт robots.txt и sitemap.xml. При любой ошибке пропускает запрос дальше — сайт работает как раньше.
import { LEGACY_STORES } from './legacyStores.js';
import {
  homeMeta,
  injectMeta,
  productMeta,
  robotsTxt,
  sitemapIndexXml,
  sitemapXml,
} from './seo/render.js';

const API_URL = globalThis.process?.env?.API_URL || 'https://product-production-1794.up.railway.app';
const API_TIMEOUT_MS = 2500;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/;
const LEGACY = new Set(LEGACY_STORES);

export const config = {
  // Файлы (с точкой в пути) и сборка шаблона /_app/ не проходят через middleware.
  matcher: ['/robots.txt', '/sitemap.xml', '/:slug/sitemap.xml', '/((?!_app/|.*\\.).*)'],
};

// То же, что next() из @vercel/functions: пропустить запрос дальше (к rewrites и файлам).
// Свой вариант — чтобы не тянуть пакет с зависимостями ради одного заголовка.
const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

async function api(path) {
  const res = await fetch(`${API_URL}/api${path}`, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  return res.ok ? res.json() : null;
}

const respond = (body, type, maxAge = 300) => new Response(body, {
  headers: {
    'Content-Type': `${type}; charset=utf-8`,
    'Cache-Control': `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=600`,
  },
});

export default async function middleware(request) {
  const url = new URL(request.url);
  const { origin, pathname } = url;

  try {
    if (pathname === '/robots.txt') return respond(robotsTxt(origin), 'text/plain', 3600);

    if (pathname === '/sitemap.xml') {
      const sites = await api('/sites');
      return sites ? respond(sitemapIndexXml(sites, origin), 'application/xml') : next();
    }

    const [slug, ...rest] = pathname.split('/').filter(Boolean);
    if (!slug || !SLUG_RE.test(slug) || LEGACY.has(slug)) return next();

    if (rest.length === 1 && rest[0] === 'sitemap.xml') {
      const data = await api(`/sites/${slug}/sitemap`);
      return data ? respond(sitemapXml(slug, data, origin), 'application/xml') : next();
    }

    const isHome = rest.length === 0;
    const isProduct = rest.length === 2 && rest[0] === 'product' && /^\d{1,9}$/.test(rest[1]);
    if (!isHome && !isProduct) return next();

    const [share, page] = await Promise.all([
      api(`/sites/${slug}/share${isProduct ? `?product=${rest[1]}` : ''}`),
      fetch(new URL('/_app/index.html', origin), { signal: AbortSignal.timeout(API_TIMEOUT_MS) }),
    ]);
    if (!share || !page.ok) return next();

    const meta = isProduct ? productMeta(share.site, share.product, origin) : homeMeta(share.site, origin);
    return respond(injectMeta(await page.text(), meta), 'text/html', 60);
  } catch (err) {
    console.error('SEO middleware:', err);
    return next();
  }
}

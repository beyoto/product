// Мета-теги для поисковиков и превью ссылок в соцсетях (WhatsApp, Telegram, Instagram, VK).
// Соцсети не выполняют JavaScript, поэтому теги вписываются в HTML на сервере (middleware.js).

const DESCRIPTION_MAX = 200;
const OG_SIZE = { width: 1200, height: 630 };

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const escapeXml = escapeHtml;

function clip(text, max = DESCRIPTION_MAX) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

function formatPrice(price, currency) {
  const value = Number(price);
  return value > 0 ? `${value.toLocaleString('ru-RU')} ${currency}` : 'Цена по запросу';
}

// Cloudinary сам обрезает фото под размер превью 1200×630.
function shareImage(url) {
  if (!url) return null;
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!match) return { url };
  return {
    url: `${match[1]}c_fill,g_auto,w_${OG_SIZE.width},h_${OG_SIZE.height},q_auto,f_jpg/${match[2]}`,
    ...OG_SIZE,
  };
}

const currencyCode = (currency) => (/^(сом|kgs)$/i.test(currency.trim()) ? 'KGS' : null);

export function homeMeta(site, origin) {
  const title = site.seoTitle || (site.tagline ? `${site.name} — ${site.tagline}` : site.name);
  const description = clip(site.seoDescription || site.description
    || `${site.typeLabel}: каталог ${site.name} с ценами и фото.`);

  return {
    title,
    description,
    url: `${origin}/${site.slug}/`,
    type: 'website',
    siteName: site.name,
    image: shareImage(site.shareImage || site.coverImage),
  };
}

export function productMeta(site, product, origin) {
  const price = formatPrice(product.price, site.currency);
  const url = `${origin}/${site.slug}/product/${product.id}`;
  const description = clip(product.seo?.description || product.description
    || [product.categoryLabel, price, site.name].filter(Boolean).join(' · '));
  const image = shareImage(product.image || site.shareImage || site.coverImage);

  // Разметка товара для Google: цена показывается только если она есть и валюта известна.
  const code = currencyCode(site.currency);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    url,
    ...(product.image ? { image: [product.image] } : {}),
    ...(product.categoryLabel ? { category: product.categoryLabel } : {}),
    brand: { '@type': 'Brand', name: site.name },
    ...(Number(product.price) > 0 && code ? {
      offers: {
        '@type': 'Offer',
        price: Number(product.price).toFixed(2),
        priceCurrency: code,
        availability: 'https://schema.org/InStock',
        url,
      },
    } : {}),
  };

  return {
    title: product.seo?.title || `${product.name} — ${site.name}`,
    description,
    url,
    type: 'product',
    siteName: site.name,
    image,
    jsonLd,
  };
}

export function injectMeta(html, meta) {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    '<meta property="og:locale" content="ru_RU" />',
  ];

  if (meta.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.image.url)}" />`);
    if (meta.image.width) {
      tags.push(`<meta property="og:image:width" content="${meta.image.width}" />`);
      tags.push(`<meta property="og:image:height" content="${meta.image.height}" />`);
    }
    tags.push('<meta name="twitter:card" content="summary_large_image" />');
  } else {
    tags.push('<meta name="twitter:card" content="summary" />');
  }

  if (meta.jsonLd) {
    // < экранируется, чтобы текст товара не мог закрыть тег script
    const json = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }

  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<\/head>/i, `    ${tags.join('\n    ')}\n  </head>`);
}

export function robotsTxt(origin) {
  return [
    'User-agent: *',
    'Disallow: /*/admin',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

const day = (date) => new Date(date).toISOString().slice(0, 10);

export function sitemapIndexXml(sites, origin) {
  const items = sites.map((site) => (
    `  <sitemap><loc>${escapeXml(`${origin}/${site.slug}/sitemap.xml`)}</loc><lastmod>${day(site.updated_at)}</lastmod></sitemap>`
  ));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</sitemapindex>\n`;
}

export function sitemapXml(slug, data, origin) {
  const base = `${origin}/${slug}`;
  const urls = [
    { loc: `${base}/`, lastmod: data.updated_at },
    { loc: `${base}/contacts` },
    ...data.products.map((product) => ({ loc: `${base}/product/${product.id}`, lastmod: product.updated_at })),
  ];
  const items = urls.map(({ loc, lastmod }) => (
    `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${day(lastmod)}</lastmod>` : ''}</url>`
  ));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>\n`;
}

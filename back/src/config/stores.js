// Единый список магазинов. Ключ — суффикс в роутах:
// /api/products_<ключ> и /api/analytics_<ключ>. 'main' — роуты без суффикса (/api/products).
// Новый магазин: добавить строку сюда, после этого он появится в суперадминке.
const STORES = {
  main: { label: 'Aveline', url: 'https://aveline-pi.vercel.app' },
  asiamixx: { label: 'Asia Mixx', url: 'https://asia-mixx.vercel.app' },
  etno: { label: 'Etno Zamanbap', url: 'https://etno-zamanbap.vercel.app' },
  myrzaBrands: { label: 'Myrza Brands', url: 'https://myrza-brands.vercel.app' },
  crowncarat: { label: 'Crown Carat', url: 'https://crown-carat.vercel.app' },
  // Baha 777 и Auto HAYK используют одни и те же роуты и таблицы.
  baha_auto: { label: 'Baha 777 / Auto HAYK', url: 'https://baha-777.vercel.app', extraOrigins: ['https://hayk-auto.vercel.app'] },
  ernis_costumes: { label: 'Ernis Costumes', url: 'https://ernis-costumes.vercel.app' },
  nova_flowers: { label: 'Nova Flowers', url: null },
};

const isStore = (key) => Object.hasOwn(STORES, key);

// Для журнала: с какого сайта пришёл запрос. Заголовок Origin можно подделать,
// поэтому для проверки доступа он не используется.
const ORIGINS = new Map(
  Object.entries(STORES).flatMap(([key, store]) => (
    [store.url, ...(store.extraOrigins || [])].filter(Boolean).map((origin) => [origin, key])
  ))
);

const storeFromOrigin = (origin) => ORIGINS.get(origin) || null;

module.exports = { STORES, isStore, storeFromOrigin };

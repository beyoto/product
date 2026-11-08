// Единый список магазинов. Ключ — суффикс в роутах:
// /api/products_<ключ> и /api/analytics_<ключ>. 'main' — роуты без суффикса (/api/products).
// Новый магазин: добавить строку сюда, после этого он появится в суперадминке.
// url — адрес магазина на kg-shop (папка shops/). extraOrigins — старые отдельные
// проекты на Vercel, нужны журналу безопасности, пока они не удалены.
const SHOP = 'https://kg-shop.vercel.app';

const STORES = {
  main: { label: 'Aveline', url: `${SHOP}/aveline`, extraOrigins: ['https://aveline-pi.vercel.app'] },
  asiamixx: { label: 'Asia Mixx', url: `${SHOP}/asiamixx`, extraOrigins: ['https://asia-mixx.vercel.app'] },
  etno: { label: 'Etno Zamanbap', url: `${SHOP}/etno`, extraOrigins: ['https://etno-zamanbap.vercel.app'] },
  myrzaBrands: { label: 'Myrza Brands', url: `${SHOP}/myrza`, extraOrigins: ['https://myrza-brands.vercel.app'] },
  crowncarat: { label: 'Crown Carat', url: `${SHOP}/crowncarat`, extraOrigins: ['https://crown-carat.vercel.app'] },
  // Baha 777 и Auto HAYK используют одни и те же роуты и таблицы.
  baha_auto: {
    label: 'Baha 777 / Auto HAYK',
    url: `${SHOP}/baha`,
    extraOrigins: ['https://baha-777.vercel.app', 'https://hayk-auto.vercel.app'],
  },
  ernis_costumes: { label: 'Ernis Costumes', url: `${SHOP}/ernis`, extraOrigins: ['https://ernis-costumes.vercel.app'] },
  nova_flowers: { label: 'Nova Flowers', url: `${SHOP}/nova` },
};

const isStore = (key) => Object.hasOwn(STORES, key);

// Для журнала: с какого сайта пришёл запрос. Заголовок Origin можно подделать,
// поэтому для проверки доступа он не используется.
// Все магазины kg-shop шлют один Origin, его не сопоставляем: магазин берётся из тела запроса.
const ORIGINS = new Map(
  Object.entries(STORES).flatMap(([key, store]) => (
    (store.extraOrigins || []).map((origin) => [origin, key])
  ))
);

const storeFromOrigin = (origin) => ORIGINS.get(origin) || null;

module.exports = { STORES, isStore, storeFromOrigin };

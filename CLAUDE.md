# CLAUDE.md

Репозиторий `beyoto/product`: один бэкенд и несколько интернет-магазинов (витрина + админка товаров у каждого).
Общаемся с владельцем на русском. Что сделано и что дальше — в [ROADMAP.md](ROADMAP.md).

## Структура

| Папка | Что это | Где задеплоено |
|---|---|---|
| `back/` | Express + PostgreSQL + Cloudinary. Все магазины ходят сюда | Railway: `https://product-production-1794.up.railway.app` |
| `shops/` | **Все магазины в одном сайте.** Старые: общий код + отличия. Новые: шаблон конструктора `shops/site/` | Vercel, проект `kg-shop` (Root Directory `shops`): `https://kg-shop.vercel.app/<магазин>/` |
| `admin/` | Суперадминка: конструктор магазинов, админы, журнал безопасности | Vercel, проект `panel` (Root Directory `admin`) |
| `front/` | Старый исходник Aveline. Перенесён в `shops/stores/aveline`, не правь | старый отдельный проект |
| `result/` | Одиночная статичная страница, к магазинам не относится | — |

Папки рядом с репозиторием (`../baha`, `../nova_flowers`, `../asiamixx/front` и т.д.) — **старые** исходники отдельных
магазинов. Весь их код уже в `shops/`. Новые правки делать только в `shops/`.

## Два вида магазинов

1. **Магазины из конструктора (новые, основной путь).** Создаются в панели → «Магазины» без кода и без деплоя.
   Данные: таблицы `sites`, `site_products` (+ `site_product_images`, `site_views_snapshots`), создаются сами при старте бэка
   (`back/src/db/ensureSites.js`). Фронт — один шаблон `shops/site/`, собирается в `dist/_app/`; Vercel отправляет на него
   все пути, кроме старых магазинов. Шаблон берёт адрес магазина из URL и грузит настройки с `GET /api/sites/<slug>`.
2. **Старые магазины** (папки `shops/stores/*`, свои таблицы `products_<key>`). Живут в коде, меняются через разработку.

### Конструктор: где что
- `back/src/config/siteTypes.js` — **типы магазинов** (цветы, одежда, обувь, ювелирка, двери, авто, мебель, косметика,
  электроника, универсальный): категории, особые поля товара, заголовок каталога, `taglines` (3 варианта подзаголовка — кнопки быстрого выбора в панели); и **цветовые темы**. Главная: шапка → преимущества (3 фразы, редактируются в панели) → каталог; карусель убрана 2026-11-09.
  Это единый источник: бэк проверяет по нему товары, панель рисует форму создания, сайт — форму товара, фильтры и характеристики.
  - Поле: `text | number | select | multiselect`; `required`, `unit`, `integer`, `min/max`, `card` (на карточке), `filter` (фильтр каталога; только select/multiselect).
  - **`value` у категорий и опций хранится в базе — не переименовывать**; `label` менять можно. Новые поля/опции добавлять можно.
- Товар: общие колонки `name, description, price, category` + особые поля в `attributes JSONB`
  (`back/src/utils/siteValidation.js`: неизвестные ключи отбрасываются, select/multiselect только из справочника). Цена 0 = «Цена по запросу».
- `back/src/routes/sites.js` — `/api/sites/:slug/...` (каталог, товары, фото, аналитика). Товары всегда фильтруются по `site_id`.
- `back/src/routes/superSites.js` — `/api/super/sites` (meta, создать с админом в одной транзакции, изменить, отключить, удалить с подтверждением).
- Права: ключ магазина `site:<slug>` в `admins.stores`; `checkAuth` берёт его из пути `/api/sites/<slug>`.
- Адрес (`slug`) и тип после создания не меняются. Занятые адреса — `RESERVED_SLUGS` в `back/src/config/stores.js`.
- Фото — Cloudinary, папка `sites/<slug>`, до 10 на товар. При удалении магазина фото в Cloudinary остаются.
- Тема: `shops/site/src/theme.js` пишет цвета в CSS-переменные (`--color-gold` = акцент, `--color-ivory` = текст, `--header-*`, `--footer-*`).
  CSS шаблона — копия вёрстки nova, все цвета через переменные/`color-mix`. Новую тему добавлять только в `THEMES`.

### SEO и превью ссылок (только магазины конструктора)
- Сайт — SPA, а соцсети (WhatsApp, Telegram, VK, Facebook) не выполняют JS. Поэтому `shops/middleware.js`
  (Vercel Routing Middleware) для `/<slug>/` и `/<slug>/product/<id>` берёт `/_app/index.html` и вписывает
  title, description, canonical, Open Graph, JSON-LD Product. Логика — `shops/seo/render.js`.
  Отдаёт `robots.txt`, `sitemap.xml` (индекс по `GET /api/sites`) и `/<slug>/sitemap.xml`.
  При любой ошибке/таймауте API (2.5 с) — `next()`, сайт открывается без тегов. Старые магазины не трогает (`legacyStores.js`).
- Данные: `GET /api/sites/<slug>/share?product=<id>` (не считает просмотры) и `GET /api/sites/<slug>/sitemap`.
- SEO товара — колонка `site_products.seo` `{title, description}`; SEO главной — `sites.info.seoTitle/seoDescription/shareImage`.
  Пусто → подставляется из названия/описания/фото. Картинки Cloudinary обрезаются под 1200×630 через URL.
  Формулы подстановки продублированы в превью (`shops/site/src/components/SeoFields.jsx`, `admin/src/pages/Sites.jsx`) — менять вместе.
- Список старых магазинов теперь в трёх местах: `shops/stores/`, `shops/vercel.json`, `shops/legacyStores.js` (+ `RESERVED_SLUGS` на бэке);
  сборка проверяет совпадение.

## shops/ — старые магазины, как устроено

- `shops/core/` — общий Vite + React 19 + MUI сайт (роутинг, корзина/избранное, админка товаров, аналитика).
- `shops/stores/<slug>/` — только файлы, которыми магазин отличается. Файл заменяет одноимённый из `core/`
  (тот же относительный путь). Обычно это `index.html`, `src/index.css`, `src/config/store.js`, `src/constants/catalog.js`, страницы.
- `shops/stores/<slug>/store.json` — `{ "key": "<ключ бэкенда>" }`.
- `shops/scripts/stores.mjs` копирует `core` + `stores/<slug>` в `shops/.build/<slug>` и задаёт env:
  `VITE_STORE` (= slug), `VITE_STORE_KEY` (= key), `VITE_API_URL` (по умолчанию Railway).
- `shops/scripts/build.mjs` собирает каждый магазин с `base: /<slug>/` в `shops/dist/<slug>` и пишет `dist/index.html`
  (служебный список ссылок — это и есть «голая» главная `kg-shop.vercel.app`).
- `shops/vercel.json`: первый rewrite — явный список старых магазинов → `/<slug>/index.html`, второй — всё остальное → `/_app/index.html` (конструктор).
  **Новая папка в `stores/` = добавить её в этот список**, иначе сборка упадёт (`checkVercelRewrites` в `scripts/stores.mjs`) — и в `RESERVED_SLUGS` на бэке.

Правила, из-за того что все магазины на одном домене:
- `BrowserRouter basename={import.meta.env.BASE_URL}`.
- Ключи `localStorage`/`sessionStorage` всегда с префиксом `${import.meta.env.VITE_STORE}:` — иначе магазины делят токен и избранное.
- Картинки из `public/` в JSX — через `import.meta.env.BASE_URL`, не абсолютным `/file.png` (в `index.html` Vite подставляет base сам).
- Путь к API — из `core/src/config/api.js` (`/products_<key>`, `/analytics_<key>`; `main` — без суффикса).
  Часть старых страниц магазинов (asiamixx, aveline, etno, myrza) ещё пишут путь строкой.

Магазины и ключи:

| slug | key на бэке | магазин |
|---|---|---|
| aveline | main | Aveline |
| asiamixx | asiamixx | Asia Mixx |
| etno | etno | Etno Zamanbap |
| myrza | myrzaBrands | Myrza Brands |
| crowncarat | crowncarat | Crown Carat |
| baha | baha_auto | Baha 777 |
| hayk | baha_auto | Auto HAYK (общие таблицы с Baha) |
| ernis | ernis_costumes | Ernis Costumes |
| nova | nova_flowers | Nova Flowers |

## back/ — как устроено

- `back/src/app.js` подключает роуты. На каждый магазин отдельные файлы-копии:
  `routes/products_<key>.js`, `routes/productImages_<key>.js`, `routes/analytics_<key>.js`, `jobs/viewsSnapshotJob_<key>.js`,
  и свои таблицы в БД (`back/src/db/schema.sql`).
- `back/src/config/stores.js` — единый список магазинов (подпись, адрес на kg-shop, старые домены для журнала).
- Авторизация: `routes/auth.js` (JWT), `middleware/checkAuth.js`; роли super/store-admin, `routes/super.js`.
- Журнал безопасности: `utils/securityLog.js`, таблица `security_events`, чистка старше 180 дней. Пишет события входа/выхода,
  проблемы с токеном, отказ в доступе, все изменения (не GET) в любом магазине, действия суперадмина (админы, магазины).
  Магазин определяется по пути запроса, старому Origin или по `store` из тела логина/логаута. Лимит входа: `utils/loginGuard.js`.

## Команды

```bash
cd shops
npm run dev -- baha       # один магазин локально
npm run build             # все магазины -> shops/dist
npm run build -- baha     # один
npm run dev -- site       # шаблон конструктора: http://localhost:5173/<адрес-магазина>/

cd back
npm run dev
```

## Деплой

Push в `main` → Vercel пересобирает `kg-shop` и `panel`, Railway — бэкенд.
Коммитить/пушить — только когда владелец просит.

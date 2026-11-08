# CLAUDE.md

Репозиторий `beyoto/product`: один бэкенд и несколько интернет-магазинов (витрина + админка товаров у каждого).
Общаемся с владельцем на русском. Что сделано и что дальше — в [ROADMAP.md](ROADMAP.md).

## Структура

| Папка | Что это | Где задеплоено |
|---|---|---|
| `back/` | Express + PostgreSQL + Cloudinary. Все магазины ходят сюда | Railway: `https://product-production-1794.up.railway.app` |
| `shops/` | **Все магазины в одном сайте.** Общий код + отличия магазинов | Vercel, проект `kg-shop` (Root Directory `shops`): `https://kg-shop.vercel.app/<магазин>/` |
| `admin/` | Суперадминка: админы магазинов, журнал безопасности | Vercel, проект `panel` (Root Directory `admin`) |
| `front/` | Старый исходник Aveline. Перенесён в `shops/stores/aveline`, не правь | старый отдельный проект |
| `result/` | Одиночная статичная страница, к магазинам не относится | — |

Папки рядом с репозиторием (`../baha`, `../nova_flowers`, `../asiamixx/front` и т.д.) — **старые** исходники отдельных
магазинов. Весь их код уже в `shops/`. Новые правки делать только в `shops/`.

## shops/ — как устроено

- `shops/core/` — общий Vite + React 19 + MUI сайт (роутинг, корзина/избранное, админка товаров, аналитика).
- `shops/stores/<slug>/` — только файлы, которыми магазин отличается. Файл заменяет одноимённый из `core/`
  (тот же относительный путь). Обычно это `index.html`, `src/index.css`, `src/config/store.js`, `src/constants/catalog.js`, страницы.
- `shops/stores/<slug>/store.json` — `{ "key": "<ключ бэкенда>" }`.
- `shops/scripts/stores.mjs` копирует `core` + `stores/<slug>` в `shops/.build/<slug>` и задаёт env:
  `VITE_STORE` (= slug), `VITE_STORE_KEY` (= key), `VITE_API_URL` (по умолчанию Railway).
- `shops/scripts/build.mjs` собирает каждый магазин с `base: /<slug>/` в `shops/dist/<slug>` и пишет `dist/index.html`
  (служебный список ссылок — это и есть «голая» главная `kg-shop.vercel.app`).
- `shops/vercel.json` переписывает `/<slug>/*` на `/<slug>/index.html` (SPA).

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
- Журнал безопасности: `utils/securityLog.js`. Магазин определяется по старому Origin или по `store` из тела логина/логаута.

## Команды

```bash
cd shops
npm run dev -- baha       # один магазин локально
npm run build             # все магазины -> shops/dist
npm run build -- baha     # один

cd back
npm run dev
```

## Деплой

Push в `main` → Vercel пересобирает `kg-shop` и `panel`, Railway — бэкенд.
Коммитить/пушить — только когда владелец просит.

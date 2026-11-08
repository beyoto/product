# Магазины

Все магазины живут на одном адресе: `/baha/`, `/crowncarat/` и так далее.

- `core/` — общий код.
- `stores/<магазин>/` — только то, чем магазин отличается. Файл заменяет одноимённый файл из `core/`.
- `stores/<магазин>/store.json` — ключ магазина на бэкенде, например `baha_auto`.

## Команды

```bash
npm run dev -- baha     # запустить один магазин
npm run build           # собрать все
npm run build -- baha   # собрать один
```

## Новый магазин

1. Скопируй папку похожего магазина: `stores/novyi/`.
2. Поменяй `index.html`, `src/config/store.js`, цвета в `src/index.css`.
3. Укажи ключ в `store.json`.
4. На бэкенде добавь таблицы, роуты и строку в `back/src/config/stores.js`.
5. Сделай push. Магазин появится на `/novyi/`.

## Vercel (один раз)

1. Add New → Project → тот же репозиторий.
2. Root Directory: `product/shops`. Остальное Vercel возьмёт из `vercel.json`.
3. Environment Variables — ничего не нужно (адрес API по умолчанию в `scripts/stores.mjs`; при желании задай `VITE_API_URL`).
4. После деплоя обнови `url` магазинов в `back/src/config/stores.js` на новые адреса (`https://<домен>/baha` и т.д.).

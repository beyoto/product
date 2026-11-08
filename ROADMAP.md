# Roadmap

Цель: все магазины в одном репозитории и одном Vercel-проекте. Новый магазин = папка в `shops/stores/` + push.
Устройство — в [CLAUDE.md](CLAUDE.md).

## Сделано

- [x] `shops/`: общий `core/` + отличия магазинов в `stores/<slug>/`, сборка всех магазинов одной командой.
- [x] Перенесены все 9 магазинов: aveline, asiamixx, etno, myrza, crowncarat, baha, hayk, ernis, nova.
      Сверено с исходниками: отличаются только правки под общий домен (basename, префиксы storage, `store` в логине).
- [x] `core/src/config/api.js` берёт путь API из ключа в `store.json`.
- [x] Vercel-проект `kg-shop` (Root Directory `shops`) — `https://kg-shop.vercel.app`. Все `/<slug>/` отвечают 200.
- [x] Бэкенд: журнал безопасности определяет магазин по `store` из тела запроса (на общем домене Origin один).
- [x] Бэкенд: удалены роуты гостей/приглашений (`/api/guests`) — больше не нужны.
- [x] `back/src/config/stores.js`: адреса магазинов указывают на kg-shop.

## Нужно сделать

### Владелец (руками)
- [ ] Пройти по каждому магазину на kg-shop: главная, карточка товара, вход в админку, добавление/редактирование товара.
- [ ] После проверки удалить старые отдельные проекты в Vercel. Затем убрать `extraOrigins` из `back/src/config/stores.js`.
- [ ] Если у магазинов есть свои домены — привязать их к `kg-shop` (Vercel → Domains) или сделать редирект на `/<slug>/`.

### Код
- [ ] Главная `kg-shop.vercel.app/` — сейчас служебный список ссылок (генерится в `shops/scripts/build.mjs`).
      Решить: оставить, сделать красивый каталог магазинов или закрыть.
- [ ] Перевести строковые пути API в asiamixx/aveline/etno/myrza на `core/src/config/api.js`,
      затем сократить их оверрайды (многие страницы почти совпадают с `core`).
- [ ] Бэкенд: заменить копии `products_<key>.js` / `productImages_<key>.js` / `analytics_<key>.js` / `viewsSnapshotJob_<key>.js`
      одной фабрикой роутов по `config/stores.js`. Тогда новый магазин на бэке = строка в конфиге + таблицы.
- [ ] CORS на бэке открыт для всех (`app.use(cors())`) — можно ограничить kg-shop и panel.
- [ ] Удалить из репозитория `front/` (старый Aveline), когда старый проект Aveline удалён.

## Как добавить новый магазин (сейчас)

1. Скопировать похожий `shops/stores/<slug>/` в новую папку, поменять `index.html`, `src/config/store.js`, цвета в `src/index.css`.
2. `store.json` → `{ "key": "<новый_ключ>" }`.
3. Бэкенд: таблицы в БД, файлы роутов по образцу существующих, подключить в `app.js`, строка в `config/stores.js`.
4. Push → магазин на `https://kg-shop.vercel.app/<slug>/`.

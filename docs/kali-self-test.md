# Самостоятельная проверка сайта из Kali Linux

Цель — научиться прогонять **свой** сайт настоящими инструментами. Бьём только по
**локальной копии** бэкенда, не по боевому Railway/Vercel.

> Это твоё приложение и твоя тестовая копия — тестировать её можно.
> По боевому `kg-shop.vercel.app` активные сканеры не запускай: это чужие сервера (Vercel/Railway) с их правилами.

---

## Шаг 0. Поднять цель на Windows (хост)

В одном окне PowerShell/терминала на Windows запущен бэкенд на тестовой базе:

```bash
# Postgres уже поднят на :5433, база kgshop_sec (см. SECURITY-AUDIT.md)
cd back
# Переменные тестовые, боевой .env не трогаем:
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/kgshop_sec" \
JWT_SECRET="local-test-secret-not-prod" PORT=3001 \
CLOUDINARY_CLOUD_NAME=dummy CLOUDINARY_API_KEY=dummy CLOUDINARY_API_SECRET=dummy \
node src/app.js
```

Node слушает на всех интерфейсах (`0.0.0.0:3001`), значит из виртуалки он доступен.

---

## Шаг 1. Сеть: чтобы Kali видел хост

**Найти IP хоста, видимый из Kali.**

- На Windows: `ipconfig` → у VMware обычно адаптер **VMware Network Adapter VMnet8** (режим NAT),
  его IPv4 (например `192.168.206.1`) — это адрес хоста со стороны виртуалки.
- Или в Kali: `ip route | grep default` — шлюз часто и есть хост (при bridged — хост в той же подсети).

**Открыть порт в брандмауэре Windows** (иначе виртуалка не достучится). В PowerShell от админа:

```powershell
New-NetFirewallRule -DisplayName "kgshop-sec-test" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**Проверить связь из Kali** (подставь свой IP хоста, далее он как `$TARGET`):

```bash
export TARGET=192.168.206.1        # <-- замени на свой
curl -s http://$TARGET:3001/api/health    # должно вернуть {"status":"ok",...}
```

Если `health` ответил — цель доступна, можно сканировать.

---

## Шаг 2. Свои учётки для тестов

Чтобы проверять защищённые эндпоинты, нужен токен. Создай тестовый магазин с админом
(суперадмин `rootsec` / `SuperTest12345` уже заведён в тестовой БД):

```bash
# вход суперадмином
SUP=$(curl -s -X POST http://$TARGET:3001/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"rootsec","password":"SuperTest12345"}' | jq -r .token)

# создать магазин с админом
curl -s -X POST http://$TARGET:3001/api/super/sites \
  -H "authorization: Bearer $SUP" -H 'content-type: application/json' \
  -d '{"slug":"kali-test","type":"clothing","theme":"ocean","name":"Kali Test",
       "admin":{"username":"kali_admin","password":"KaliPass123"}}'

# токен админа магазина
TOK=$(curl -s -X POST http://$TARGET:3001/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"kali_admin","password":"KaliPass123"}' | jq -r .token)
echo $TOK
```

---

## Шаг 3. nmap — порты и сервисы

```bash
nmap -sV -p 3001 $TARGET
# что ищем: открыт ли только нужный порт, что видно про сервис/версию
```

---

## Шаг 4. nikto — типовые проблемы веб-сервера

```bash
nikto -h http://$TARGET:3001
# смотрим: заголовки безопасности, служебные файлы, засветка версий.
# Ожидаемо отметит, что это API (многие пути отдают 404/401) — это нормально.
```

---

## Шаг 5. OWASP ZAP — главный инструмент

ZAP — бесплатный сканер веб/API (в Kali: меню → Web Application Analysis → OWASP ZAP,
или `zaproxy` / `zap.sh`).

**Вариант А — быстрый автоскан (без аутентификации):**
1. ZAP → «Automated Scan».
2. URL to attack: `http://<TARGET>:3001/api/health`
3. Снять галку «Use traditional spider» для API (там нет ссылок), запустить.
4. Смотреть вкладку **Alerts** — ZAP отметит отсутствие заголовков (мы часть уже закрыли),
   засветку версий и т.п.

**Вариант Б — скан с токеном (так проверяются защищённые роуты):**
1. ZAP → вкладка **Request** (Manual Request Editor) или настрой **Replacer**:
   добавь заголовок `Authorization: Bearer <TOK>` ко всем запросам
   (Tools → Options → Replacer → Add → "Request Header", Header=`Authorization`, Value=`Bearer <TOK>`).
2. Прогоняй запросы к `/api/sites/kali-test/admin/products`, `/api/sites/kali-test/products` и смотри Alerts.
3. Для активного скана: правой кнопкой по запросу в истории → **Attack → Active Scan**.

**Что ожидать:** активный скан ZAP гоняет SQLi/XSS-пейлоады. По нашему тесту инъекции не проходят,
XSS в JSON-API не применим. Главная ценность — ZAP строит отчёт, который можно приложить к работе
(Report → Generate HTML Report).

---

## Шаг 6. sqlmap — точечно по параметрам

sqlmap проверяет SQL-инъекции. Нацель на конкретные точки с валидным токеном:

```bash
# параметр id в пути
sqlmap -u "http://$TARGET:3001/api/sites/kali-test/admin/products/1" \
  --headers="Authorization: Bearer $TOK" --batch --level=2 --risk=2

# query-параметры фильтра каталога (публичные)
sqlmap -u "http://$TARGET:3001/api/sites/kali-test/products?category=tshirt&sort=new" \
  --batch --level=2
```

Ожидаемо: `all tested parameters do not appear to be injectable` — потому что код использует
параметризованные запросы (`$1, $2`). Это и есть правильный результат защиты.

---

## Шаг 7. Ручные проверки (самое полезное для понимания)

**IDOR / изоляция магазинов.** Создай второй магазин `kali-test2` с админом, возьми его токен `$TOK2`,
создай товар в `kali-test` и попробуй достать его токеном второго админа:

```bash
# товар в kali-test (токен TOK)
PID=$(curl -s -X POST http://$TARGET:3001/api/sites/kali-test/products \
  -H "authorization: Bearer $TOK" -H 'content-type: application/json' \
  -d '{"name":"Secret","description":"d","price":100,"category":"tshirt","attributes":{}}' | jq -r .id)

# чужим токеном — должно быть 403/404
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "authorization: Bearer $TOK2" \
  http://$TARGET:3001/api/sites/kali-test/admin/products/$PID
```

**JWT.** Возьми токен на https://jwt.io, поменяй `alg` на `none` или подправь payload — сервер
должен ответить 401 (`jwt.verify` с нашим секретом не пропустит).

**Перебор пароля.** Повтори вход с неверным паролем 10+ раз — поймаешь `429` (loginGuard).

---

## Шаг 8. Анализ зависимостей (без сети на цель)

```bash
cd back && npm audit
cd ../shops && npm audit
cd ../admin && npm audit
```

---

## Как читать итог

Если активные сканеры «ничего не нашли» — это **хороший** результат, а не неудача.
Твоя работа как специалиста: показать методику, перечислить проверенные классы уязвимостей,
приложить отчёты инструментов и вывод. Отрицательный результат при грамотной методике — это тоже результат.

Автоматический сводный тест (быстрее, чем гонять всё руками): `node sectest/run.mjs`.

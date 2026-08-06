# Развёртывание на сервер msk-1-vm-ogoi

Инструкция составлена по фактическому отчёту инвентаризации
(`scripts/server-inventory.sh`, снят 2026-08-06). Общая, не привязанная к этому
серверу документация — в [`../docs/deployment.md`](../docs/deployment.md).

## Что уже есть на сервере

| Компонент | Состояние |
| --- | --- |
| Ubuntu 24.04, 4 CPU, 7.8 ГБ RAM | swap 4 ГБ, из них занято 1.4 ГБ |
| Диск 58 ГБ | **свободно 14 ГБ (77 % занято)** |
| Docker 29.4 + Compose v5 | 16 работающих контейнеров |
| nginx 1.24 на :80 и :443 | 8 виртуальных хостов |
| certbot 2.9 + таймер | 7 сертификатов, автопродление работает |
| Node.js 20.20.2, npm 10.8 | pnpm нет (не нужен: собираем в Docker) |
| PostgreSQL | только в контейнерах: picglot (pg17), skilltest (pgvector pg15) |
| ufw | открыты 22, 80, 443, 4000, 10050 |

Соседние проекты: **picglot** (`/opt/picglot`, порты 3000 и 8000),
**skilltest** (`/root/skilltest`, порт 4000), **ai-stack** (`/root/ai-stack`,
localhost 3080 и 4001), **proglubinu.ru** (`/var/www/proglubinu.ru`, Next.js
под pm2 на порту 3001).

## Принятые решения

| Вопрос | Решение | Почему |
| --- | --- | --- |
| Порт приложения | **3002**, слушает только `127.0.0.1` | 3000, 3001 и 4000 заняты; наружу отдаёт nginx, правила ufw менять не нужно |
| База данных | **свой контейнер** `greymouse-postgres` на образе `postgres:17-alpine` | Образ уже скачан — лишнего места не займёт. Отдельный контейнер даёт независимые бэкапы и обновления, не трогая picglot |
| Файлы загрузок | **том Docker** `greymouse-media` | Том переживает пересоздание контейнера. MinIO у picglot можно подключить позже — поля S3 в `.env` уже есть |
| Схема БД | миграции одноразовым сервисом `migrate` | В production `push` выключен; в standalone-образе нет CLI Payload, поэтому для миграций собирается отдельная цель `migrator` |
| Память | лимит **1 ГБ** на контейнер приложения | На сервере уже занят swap; лимит не даст сайту вытеснить соседей |

## Порядок действий

### Шаг 0. Освободить место — сделать до всего остального

На диске 14 ГБ, а сборка образа требует несколько гигабайт. При этом
**17.1 ГБ занимает кэш сборок Docker и он полностью подлежит очистке**:

```bash
docker system df                 # посмотреть, что предлагается очистить
sudo docker builder prune -af    # освободит ~17 ГБ
```

Это удаляет только кэш промежуточных слоёв. Образы, контейнеры, тома и данные
соседних проектов не затрагиваются — им лишь придётся дольше пересобираться в
следующий раз. После очистки занятость диска упадёт с 77 % примерно до 48 %.

Дополнительно, если места всё ещё мало:

```bash
sudo docker image prune -a --filter "until=720h"   # ещё ~2.2 ГБ неиспользуемых образов
```

### Шаг 1. DNS

Сейчас `сераямышь.рф` **не резолвится вообще** — записи нет.
В панели регистратора добавьте:

```
A    @      37.252.20.7
A    www    37.252.20.7
```

Проверка (домен можно писать и кириллицей, и в punycode):

```bash
dig +short xn--80apaghdkxi3f.xn--p1ai     # должен ответить 37.252.20.7
```

Дальше двигайтесь только после того, как запись разошлась: без неё certbot не
выпустит сертификат.

### Шаг 2. Код на сервер

```bash
sudo mkdir -p /opt/greymouse
sudo git clone -b claude/seraya-mysh-production-site-lzcauc \
  https://github.com/anton-shcherbakov01/greymouse.git /opt/greymouse
cd /opt/greymouse
```

Каталог `/opt` выбран для единообразия с picglot.

### Шаг 3. Окружение

```bash
cp deploy/env.server.example deploy/.env
chmod 600 deploy/.env
nano deploy/.env
```

Заполнить обязательное:

```bash
NEXT_PUBLIC_SITE_URL=https://xn--80apaghdkxi3f.xn--p1ai
PAYLOAD_SECRET=$(openssl rand -hex 32)
PREVIEW_SECRET=$(openssl rand -hex 24)
POSTGRES_PASSWORD=$(openssl rand -hex 24)
```

> `NEXT_PUBLIC_SITE_URL` пишется в punycode и должен точно совпадать с адресом,
> по которому открывается сайт. Значение уходит в CORS и CSRF Payload: при
> несовпадении админка откроется, но перестанет сохранять данные.

### Шаг 4. Запуск

Порядок именно такой: миграции должны примениться до сборки приложения —
Next пререндерит страницы кейсов и читает для этого базу.

```bash
cd /opt/greymouse

# 1. База: поднимается и ждёт готовности
docker compose -f deploy/docker-compose.server.yml up -d postgres

# 2. Схема: создаётся миграциями
docker compose -f deploy/docker-compose.server.yml run --rm migrate

# 3. Демонстрационный контент (по желанию, потом его нужно будет удалить)
docker compose -f deploy/docker-compose.server.yml run --rm migrate pnpm seed

# 4. Приложение: собирается и запускается
docker compose -f deploy/docker-compose.server.yml up -d --build app
```

Сборка занимает несколько минут. Если база на шаге 4 недоступна, сборка не
падает — страницы просто отрисуются при первом обращении, но лучше не
пропускать шаги 1–2.

> Если ранее сборка падала с `Can't resolve '../importMap.js'` — обновитесь
> (`git pull`). Файл теперь в репозитории и вдобавок пересоздаётся при сборке.

При нехватке памяти во время сборки:

```bash
docker compose -f deploy/docker-compose.server.yml build \
  --build-arg NODE_OPTIONS=--max-old-space-size=2048 app
```

Проверка:

```bash
docker compose -f deploy/docker-compose.server.yml ps
curl -fsS http://127.0.0.1:3002/healthz     # {"status":"ok","database":"ok"}
```

### Шаг 5. nginx и сертификат

Три подшага, порядок важен: конечный конфиг слушает 443 и ссылается на файлы
сертификата, поэтому до выпуска сертификата nginx с ним не запустится
(`no "ssl_certificate" is defined for the "listen ... ssl" directive`).

**5.1. Временный конфиг — только чтобы пройти проверку домена.**

```bash
sudo mkdir -p /var/www/certbot
sudo cp deploy/nginx/seraya-mysh-bootstrap.conf /etc/nginx/sites-available/seraya-mysh
sudo ln -s /etc/nginx/sites-available/seraya-mysh /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**5.2. Сертификат.**

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d xn--80apaghdkxi3f.xn--p1ai \
  -d www.xn--80apaghdkxi3f.xn--p1ai
```

Домен указывается в punycode: часть ACME-клиентов не принимает unicode.
Порядок `-d` определяет имя каталога сертификата, на которое ссылается конфиг,
— менять его нельзя.

Используется `certonly --webroot`, а не `--nginx`: плагин nginx редактирует
конфигурацию сам и отказывается работать, если хоть один из восьми чужих
виртуальных хостов ему непонятен (`The nginx plugin is not working; there may be
problems with your existing configuration`). Режим `--webroot` ничего не правит.

Автопродление уже настроено таймером `certbot.timer`, отдельно делать ничего не
нужно: конечный конфиг сохраняет тот же `location /.well-known/acme-challenge/`,
поэтому продление проходит тем же способом. Проверить: `sudo certbot renew --dry-run`.

**5.3. Конечный конфиг.**

```bash
sudo cp deploy/nginx/seraya-mysh.conf /etc/nginx/sites-available/seraya-mysh
sudo nginx -t && sudo systemctl reload nginx
```

Про вывод `nginx -t`:

* предупреждения `protocol options redefined` идут по чужим конфигам — это
  существующее состояние сервера, не связанное с нашим файлом;
* важно, чтобы в конце было `test is successful`;
* если появится `socket() [::]:443 failed (97: Address family not supported by
  protocol)` — на сервере отключён IPv6; удалите из файла строки
  `listen [::]:…` и повторите.

HTTP/2 включён формой `listen 443 ssl http2` — отдельная директива `http2 on`
существует только с nginx 1.25.1, а на сервере 1.24.0. Оба файла проверены
`nginx -t` на 1.24.0 и на 1.27.

### Шаг 6. Первый администратор

```bash
docker compose -f deploy/docker-compose.server.yml run --rm \
  -e ADMIN_EMAIL='you@example.com' \
  -e ADMIN_PASSWORD='длинный-случайный-пароль' \
  -e ADMIN_NAME='Имя Фамилия' \
  migrate pnpm create-admin
```

Сервис `migrate` собран из полного образа с исходниками, поэтому в нём доступны
все CLI-команды проекта (`pnpm seed`, `pnpm create-admin`, `pnpm migrate`).
Он монтирует тот же том медиа, что и приложение, — файлы из seed не теряются.

### Шаг 7. Проверка

```bash
curl -fsS https://xn--80apaghdkxi3f.xn--p1ai/healthz
curl -fsS https://xn--80apaghdkxi3f.xn--p1ai/robots.txt   # должно быть Allow: /
```

Затем в браузере: главная, `/cases`, один кейс, вход в `/admin` и сохранение
любого документа — последнее проверяет, что `NEXT_PUBLIC_SITE_URL` задан верно.

## Обновление

```bash
cd /opt/greymouse
git pull
docker compose -f deploy/docker-compose.server.yml run --rm migrate
docker compose -f deploy/docker-compose.server.yml up -d --build app
```

Сначала миграции, потом сборка — по той же причине, что и при первом запуске.

## Резервные копии

База:

```bash
docker exec greymouse-postgres pg_dump -U greymouse --format=custom greymouse \
  > /root/backups/greymouse-$(date +%F).dump
```

Файлы (том):

```bash
docker run --rm -v greymouse-media:/data -v /root/backups:/backup alpine \
  tar czf /backup/greymouse-media-$(date +%F).tar.gz -C /data .
```

У picglot уже есть контейнер `picglot-backup-1` — при желании добавьте эти две
команды в тот же механизм, чтобы бэкапы были в одном месте.

## Откат

```bash
cd /opt/greymouse
git checkout <предыдущий-коммит>
docker compose -f deploy/docker-compose.server.yml up -d --build
```

Миграции Payload имеют обратные операции, но автоматически они не откатываются.
Если релиз менял схему, откат делается вручную:

```bash
docker compose -f deploy/docker-compose.server.yml run --rm migrate pnpm payload migrate:down
```

## Полное удаление

```bash
docker compose -f deploy/docker-compose.server.yml down
sudo rm /etc/nginx/sites-enabled/seraya-mysh
sudo systemctl reload nginx
# тома удаляются отдельно и только осознанно — в них данные:
# docker volume rm greymouse-postgres-data greymouse-media
```

Соседние проекты ничего из этого не затрагивает: у сайта своя сеть
`greymouse-internal`, свои тома с префиксом `greymouse` и свой порт.

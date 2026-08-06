# Развёртывание

Приложение собирается в один Docker-образ (`output: 'standalone'`) и требует
PostgreSQL. Для production-загрузок нужно S3-совместимое хранилище.

## 1. Требования

* Node.js 20.9+ (в образе — 22) либо Docker;
* PostgreSQL 14+ (проверено на 16);
* S3-совместимое объектное хранилище (Yandex Object Storage, Selectel, MinIO,
  Cloudflare R2 и т. п.);
* HTTPS-терминация перед приложением (nginx, Caddy, Traefik или балансировщик).

## 2. Переменные окружения

Полный список — в `.env.example`. Обязательные для production:

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Публичный адрес сайта. **Критично**, см. ниже |
| `PAYLOAD_SECRET` | Подпись JWT и шифрование полей. `openssl rand -hex 32` |
| `DATABASE_URI` | Строка подключения к PostgreSQL |
| `PREVIEW_SECRET` | Секрет ссылки предпросмотра. `openssl rand -hex 24` |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Хранилище загрузок |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | Публичный адрес бакета/CDN для `next/image` |

### `NEXT_PUBLIC_SITE_URL` — самое важное

Значение попадает в `cors` и `csrf` конфигурации Payload. Если оно **не
совпадает** с origin, по которому реально открывают сайт, админка загрузится,
но перестанет сохранять данные: Payload отклонит cookie-токен как
межсайтовый запрос, а в логах появится
`Unauthorized, you must be logged in to make this request`.

Эта ошибка воспроизводилась при проверке — она не сломана, а именно так
работает защита от CSRF.

Для IDN-домена указывайте **punycode**:

```
сераямышь.рф → https://xn--80apaghdkxi3f.xn--p1ai
```

Приложение само нормализует значение через `new URL()`, поэтому unicode-запись
тоже сработает, но в конфигурации лучше хранить punycode — так меньше
неожиданностей в логах и заголовках.

Переменная используется ровно в одном месте (`src/lib/site.ts`), продублировать
адрес где-то ещё невозможно.

## 3. Локальная разработка

```bash
pnpm install
cp .env.example .env          # заполните PAYLOAD_SECRET, DATABASE_URI, PREVIEW_SECRET
pnpm db:up                    # PostgreSQL в Docker на :5432
pnpm dev                      # http://localhost:3000
pnpm seed                     # демонстрационные данные
pnpm create-admin             # первый администратор из ADMIN_EMAIL/ADMIN_PASSWORD
```

Без переменной `S3_BUCKET` файлы пишутся в `public/media` — этого достаточно
для разработки. Каталог исключён из git.

Проверить работу S3-конфигурации локально можно через MinIO:

```bash
docker compose --profile storage up -d minio   # консоль на :9001
```

## 4. Миграции

В development схема синхронизируется автоматически (`push: true`).
В production — **только миграции**.

```bash
pnpm migrate:create <название>   # после изменения коллекций
pnpm migrate                     # применить (выполняется при деплое)
```

Файлы миграций лежат в `src/migrations/` и коммитятся в репозиторий.

## 5. Сборка образа

```bash
docker build -t greymouse:latest .
```

Образ многоступенчатый: зависимости → сборка → runtime на `node:22-alpine`.
Приложение работает от непривилегированного пользователя `nextjs` (uid 1001).
Встроенный healthcheck опрашивает `/healthz` — маршрут проверяет и приложение,
и доступность базы.

## 6. Запуск

```bash
docker run -d --name greymouse -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://xn--80apaghdkxi3f.xn--p1ai \
  -e PAYLOAD_SECRET=... \
  -e DATABASE_URI=postgres://user:pass@db-host:5432/greymouse \
  -e PREVIEW_SECRET=... \
  -e S3_BUCKET=... -e S3_REGION=... -e S3_ENDPOINT=... \
  -e S3_ACCESS_KEY_ID=... -e S3_SECRET_ACCESS_KEY=... \
  -e NEXT_PUBLIC_S3_PUBLIC_URL=https://cdn.example.com \
  greymouse:latest
```

Порядок при деплое: применить миграции → запустить новый контейнер →
дождаться healthcheck → переключить трафик.

## 7. Хранилище файлов

Файловая система контейнера эфемерна: без S3 загрузки исчезнут при
пересоздании контейнера. Как только задан `S3_BUCKET`, Payload автоматически
подключает `@payloadcms/storage-s3` — менять код не нужно.

Для S3-совместимых сервисов (не AWS) задайте `S3_ENDPOINT` и, как правило,
`S3_FORCE_PATH_STYLE=true`.

Бакет должен отдавать файлы публично на чтение (или через CDN). Домен из
`NEXT_PUBLIC_S3_PUBLIC_URL` автоматически попадает в `images.remotePatterns`.

## 8. DNS и HTTPS

Инструкция не привязана к провайдеру.

1. **DNS.** Заведите `A`/`AAAA`-запись домена (для `.рф` панель регистратора
   принимает и unicode-, и punycode-запись) на IP балансировщика или сервера.
   При использовании CDN — `CNAME` на его адрес.
2. **HTTPS.** Выпустите сертификат на **punycode-имя**
   (`xn--80apaghdkxi3f.xn--p1ai`) — часть ACME-клиентов не принимает unicode.
   Let's Encrypt поддерживает IDN.
3. **Прокси.** Проксируйте на порт приложения и передавайте заголовки:

   ```nginx
   proxy_set_header Host              $host;
   proxy_set_header X-Real-IP         $remote_addr;
   proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

   `X-Forwarded-For` нужен: по нему считается ограничение частоты отправки формы.
4. **Редиректы.** Настройте `www` → апекс (или наоборот) и `http` → `https`.
   HSTS приложение отдаёт само.
5. **Размер загрузки.** Увеличьте лимит тела запроса до 25 МБ и более
   (`client_max_body_size 32m;` в nginx), иначе крупные медиафайлы не пройдут.

## 9. Первый администратор

Пароля по умолчанию в коде нет. Два поддерживаемых способа:

**Способ 1 — CLI (рекомендуется).**

```bash
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD='длинный-случайный-пароль' \
ADMIN_NAME='Имя Фамилия' \
pnpm create-admin
```

В контейнере:

```bash
docker exec -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -it greymouse node -e "..."
```

либо запустите скрипт из рабочей копии, подключившись к той же базе.

Скрипт идемпотентен: существующий пользователь не перезаписывается.
Пароль короче 12 символов отклоняется.

**Способ 2 — экран создания первого пользователя.** Если в базе нет ни одного
пользователя, Payload при первом открытии `/admin` сам предложит создать
администратора. Способ удобен, но требует, чтобы `/admin` был доступен
до создания учётной записи, — сразу после регистрации проверьте, что
посторонние не успели воспользоваться формой.

## 10. Резервные копии

**База данных** (единственный источник структурированных данных):

```bash
pg_dump --format=custom --no-owner "$DATABASE_URI" > greymouse-$(date +%F).dump
pg_restore --clean --no-owner --dbname="$DATABASE_URI" greymouse-2026-01-01.dump
```

Рекомендуется ежедневный дамп с хранением 30 дней и еженедельный — 6 месяцев.

**Файлы.** Включите версионирование объектов в бакете либо настройте
регулярную синхронизацию (`rclone sync`, `aws s3 sync`) в отдельный бакет.

**Что не бэкапится и не нужно:** `.next`, `node_modules`, `public/media`
(в production файлы лежат в S3).

Проверяйте восстановление: разверните дамп в тестовую базу и запустите
приложение с `DATABASE_URI`, указывающим на неё.

## 11. Ограничения, о которых нужно знать

| Ограничение | Причина | Что делать при росте |
| --- | --- | --- |
| Счётчик частоты формы живёт в памяти процесса | Нет внешнего хранилища | При нескольких репликах вынести в Redis (`src/lib/rate-limit.ts`) |
| Отложенная публикация не включена | Требует очереди задач Payload | Добавить `schedulePublish: true` и обработчик очереди |
| Письма уходят только при заданном SMTP | Доступ не предоставлен | Задать `SMTP_*` и `CONTACT_NOTIFY_EMAIL`; заявки в любом случае сохраняются в БД |
| Фильтрация кейсов идёт по всему списку | Кейсов десятки | При сотнях — переводить на запрос к БД с пагинацией |

## 12. Проверка после деплоя

```bash
curl -fsS https://<домен>/healthz          # {"status":"ok","database":"ok"}
curl -fsS https://<домен>/robots.txt       # Allow: / и ссылка на sitemap
curl -fsS https://<домен>/sitemap.xml | head
```

Затем вручную: открыть `/`, `/cases`, один кейс, `/admin`, войти и сохранить
любой документ (это проверяет корректность `NEXT_PUBLIC_SITE_URL`).

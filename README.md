# Серая Мышь — сайт digital-студии

Production-сайт студии «Серая Мышь»: публичная часть и админка в одном
Next.js-приложении на Payload CMS.

Основной домен: **https://сераямышь.рф** (`xn--80ajwod0cujx.xn--p1ai`)

> **Тихо делаем заметные цифровые продукты.**

## Что это

* Публичный сайт: главная с интерактивной 3D-сценой, кейсы с фильтрами и
  поиском, услуги, «О студии», контакты с формой.
* Админка на `/admin`: кейсы с черновиками и предпросмотром, услуги, категории,
  команда, медиатека, заявки, настройки сайта и меню.
* Весь пользовательский текст сайта редактируется через CMS — в коде он не зашит.

## Стек

| Слой | Решение |
| --- | --- |
| Фреймворк | Next.js 16.3 (App Router, `output: standalone`) |
| UI | React 19.2, TypeScript 5.9 (strict) |
| CMS | Payload 3.87 |
| БД | PostgreSQL 16 |
| Стили | Tailwind CSS v4 + CSS-переменные |
| Motion | `motion` 12 + CSS-анимации |
| 3D | Чистый three.js 0.185 |
| Валидация | Zod 4 |
| Тесты | Vitest + Playwright |
| Пакеты | pnpm 10 |

Обоснование каждого выбора — в [`docs/decisions.md`](docs/decisions.md).

## Системные требования

* Node.js **20.9+** (рекомендуется 22)
* pnpm **10+**
* PostgreSQL **14+** (или Docker для локального запуска)
* Docker — для локальной БД и сборки production-образа

## Установка

```bash
pnpm install
cp .env.example .env
```

Заполните в `.env` как минимум:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYLOAD_SECRET=$(openssl rand -hex 32)
DATABASE_URI=postgres://greymouse:greymouse@localhost:5432/greymouse
PREVIEW_SECRET=$(openssl rand -hex 24)
```

## Переменные окружения

Полный список с комментариями — в [`.env.example`](.env.example).

| Переменная | Обязательна | Назначение |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | да | Публичный адрес. Единственное место, где задан домен |
| `PAYLOAD_SECRET` | да | Подпись JWT и шифрование полей |
| `DATABASE_URI` | да | Подключение к PostgreSQL |
| `PREVIEW_SECRET` | да | Секрет ссылки предпросмотра |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | для `create-admin` | Первый администратор |
| `S3_*`, `NEXT_PUBLIC_S3_PUBLIC_URL` | в production | Хранилище загрузок |
| `CONTACT_NOTIFY_EMAIL`, `SMTP_*` | нет | Письма о новых заявках |
| `CONTACT_RATE_LIMIT`, `CONTACT_RATE_WINDOW_MS` | нет | Ограничение частоты формы (по умолчанию 5 за 10 минут) |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | нет | Аналитика; без значения скрипт не подключается |

> `NEXT_PUBLIC_SITE_URL` должен совпадать с адресом, по которому реально
> открывается сайт: значение попадает в CORS и CSRF Payload. При несовпадении
> админка перестанет сохранять данные. Подробности — в
> [`docs/deployment.md`](docs/deployment.md).

## База данных

```bash
pnpm db:up      # PostgreSQL 16 в Docker на :5432
pnpm db:down    # остановить
```

Или используйте существующий PostgreSQL — достаточно указать `DATABASE_URI`.

## Запуск разработки

```bash
pnpm dev        # http://localhost:3000, админка на /admin
```

В development схема базы синхронизируется автоматически.

## Миграции

```bash
pnpm migrate:create <название>   # создать после изменения коллекций
pnpm migrate                     # применить (обязательно в production)
```

## Демонстрационные данные

```bash
pnpm seed
```

Создаёт 4 опубликованных и 1 черновой кейс, услуги, категории, двух
основателей с фотографиями и заполняет настройки сайта. Все кейсы помечены
префиксом `[demo]` — удалите их, когда заведёте реальные.

Скрипт идемпотентен: повторный запуск обновляет записи по slug.

## Первый администратор

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='длинный-случайный-пароль' pnpm create-admin
```

Пароля по умолчанию в коде нет. Пароль короче 12 символов отклоняется.
Скрипт не перезаписывает существующего пользователя.

Альтернатива: если в базе нет ни одного пользователя, Payload сам предложит
создать администратора при первом открытии `/admin`.

## Проверки

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript strict
pnpm test          # Vitest, 38 тестов
pnpm build         # production-сборка
pnpm test:e2e      # Playwright, 29 тестов (нужен запущенный сервер)
```

Дополнительно:

```bash
node scripts/screenshot-site.mjs    # скриншоты в 5 размерах + проверка вёрстки
node scripts/lighthouse-audit.mjs   # Lighthouse по production-сборке
```

Фактические результаты — в [`docs/qa-report.md`](docs/qa-report.md) и
[`docs/performance-report.md`](docs/performance-report.md).

## Production-сборка

```bash
pnpm build
pnpm start
```

Docker:

```bash
docker build -t greymouse:latest .
docker run -p 3000:3000 --env-file .env greymouse:latest
```

## Развёртывание

Полная инструкция — [`docs/deployment.md`](docs/deployment.md): переменные
окружения, миграции, S3, DNS и HTTPS для IDN-домена, резервные копии,
создание администратора, проверка после деплоя.

## Структура каталогов

```
src/
  app/
    (frontend)/      публичный сайт
    (payload)/       админка и API Payload
    preview/         режим предпросмотра черновиков
    healthz/         проверка живости
    robots.ts  sitemap.ts
  collections/       коллекции CMS
  globals/           настройки сайта и навигация
  blocks/            блоки страницы кейса
  fields/  access/  hooks/
  features/hero-scene/   3D-сцена Grey Signal
  components/        UI, layout, секции, блоки
  lib/               запросы к CMS, схемы, утилиты
  styles/            дизайн-токены и глобальные стили
  seed-assets/       исходники для демо-данных
scripts/             seed, админ, генерация ассетов, исследование, аудиты
tests/unit/  tests/e2e/
docs/                документация
research/            исследование референсов, финальные скриншоты, Lighthouse
```

## Работа с CMS

Пошаговое руководство для редактора — [`docs/admin-guide.md`](docs/admin-guide.md).
Описание модели контента — [`docs/content-model.md`](docs/content-model.md).

Коротко:

* **Кейсы** — черновик → предпросмотр → публикация. Порядок задаётся полем
  «Порядок», избранные выводятся на главной.
* **Услуги** группируются по этапам жизненного цикла проекта.
* **Команда** — имена, роли, фотографии и биографии основателей.
* **Настройки сайта** — тексты первого экрана, контакты, футер, SEO.
* **Навигация** — меню шапки и футера без правки кода.

## Замена фотографий основателей

1. `/admin` → «Контент» → **Команда**.
2. Откройте человека, в поле **Фотография** нажмите ✕, затем **Create New**.
3. Загрузите вертикальный портрет (соотношение 4:5, лучше от 1600 px по ширине).
4. Заполните **Alt-текст** — например, «Портрет: Имя Фамилия».
5. Сохраните.

Размеры для разных экранов создаются автоматически. Внешность на фотографиях
не изменяется — применяются только кадрирование и сжатие.

Исходники, использованные при первом наполнении, лежат в `src/seed-assets/`.

## Что заменить перед запуском

| Что | Где |
| --- | --- |
| Демонстрационные кейсы `[demo]` | `/admin` → Кейсы |
| Роли и биографии основателей | `/admin` → Команда |
| Email и Telegram (сейчас `hello@example.test`) | `/admin` → Настройки сайта → Контакты |
| Юридическое наименование и правовые ссылки | `/admin` → Настройки сайта → Футер и право |
| Логотип, если появится брендбук | `src/components/brand/Wordmark.tsx` |

## Troubleshooting

**`/admin` открывается, но ничего не сохраняется; в логах
`Unauthorized, you must be logged in to make this request`.**
`NEXT_PUBLIC_SITE_URL` не совпадает с origin, по которому открыт сайт.
Приведите значение в соответствие и пересоберите.

**Изображения не грузятся, `/_next/image` отдаёт 403.**
Домен хранилища не описан в `images.remotePatterns`. Задайте
`NEXT_PUBLIC_S3_PUBLIC_URL` и пересоберите.

**`robots.txt` отдаёт `Disallow: /`.**
Так и задумано для не-production окружений: правило зависит от того, указывает
ли `NEXT_PUBLIC_SITE_URL` на localhost.

**Опубликованный кейс не появился на сайте.**
Проверьте статус документа («Опубликовано») и что сборка запущена с той же
базой. Кеш сбрасывается автоматически хуком; при ручном вмешательстве в БД
мимо Payload сброс не произойдёт.

**3D-сцена не видна.**
Так и должно быть при: отсутствии WebGL, `prefers-reduced-motion` (статичный
кадр), слабом устройстве (см. `docs/architecture.md`). Виден постер.

**Загрузка крупного файла обрывается.**
Ограничение Payload — 25 МБ. Дополнительно увеличьте лимит тела запроса на
обратном прокси (`client_max_body_size`).

**`pnpm dev` отдаёт 403 на `/_next/*`.**
Вы открыли сайт по адресу, которого нет в `allowedDevOrigins` в
`next.config.mjs`. Добавьте туда нужный хост.

## Документация

| Файл | Содержание |
| --- | --- |
| [`docs/reference-research.md`](docs/reference-research.md) | Исследование семи референсов и дизайн-концепция |
| [`docs/assets-inventory.md`](docs/assets-inventory.md) | Инвентаризация ассетов |
| [`docs/design-system.md`](docs/design-system.md) | Цвет, типографика, сетка, motion |
| [`docs/architecture.md`](docs/architecture.md) | Архитектура приложения |
| [`docs/content-model.md`](docs/content-model.md) | Модель контента |
| [`docs/admin-guide.md`](docs/admin-guide.md) | Руководство редактора |
| [`docs/deployment.md`](docs/deployment.md) | Развёртывание и эксплуатация |
| [`docs/performance-report.md`](docs/performance-report.md) | Замеры Lighthouse |
| [`docs/qa-report.md`](docs/qa-report.md) | Отчёт о тестировании |
| [`docs/decisions.md`](docs/decisions.md) | Технические решения и их обоснование |

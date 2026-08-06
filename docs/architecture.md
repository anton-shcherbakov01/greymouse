# Архитектура

## 1. Общая схема

Одно Next.js-приложение обслуживает и публичный сайт, и админку Payload.

```
Браузер
  │
  ├── /                     → (frontend)  Server Components + серверные данные Payload
  ├── /cases, /services …   → (frontend)
  ├── /admin/*              → (payload)   React-админка Payload
  ├── /api/*                → (payload)   REST и GraphQL Payload
  ├── /preview, /healthz    → собственные route handlers
  │
  └── Next.js (Node, standalone)
        ├── Payload Local API (в том же процессе, без HTTP-походов в себя)
        ├── PostgreSQL
        └── Файлы: локальная ФС (dev) или S3-совместимое хранилище (production)
```

Публичные страницы **не** обращаются к собственному REST API: серверные
компоненты вызывают Payload Local API напрямую (`src/lib/queries.ts`). Это
исключает лишний сетевой цикл и проблемы с авторизацией внутренних запросов.

## 2. Стек и версии

| Слой | Выбор | Версия |
| --- | --- | --- |
| Фреймворк | Next.js App Router, output `standalone` | 16.3.0 |
| UI | React | 19.2.8 |
| Язык | TypeScript, `strict: true` | 5.9 |
| CMS | Payload | 3.87.0 |
| БД | PostgreSQL через `@payloadcms/db-postgres` | 16 |
| Редактор | Lexical (`@payloadcms/richtext-lexical`) | 3.87.0 |
| Хранилище | `@payloadcms/storage-s3` (включается наличием `S3_BUCKET`) | 3.87.0 |
| Стили | Tailwind CSS v4 + CSS-переменные | 4.3 |
| Motion | `motion` (Motion for React) | 12.x |
| 3D | Чистый three.js | 0.185 |
| Валидация | Zod | 4.x |
| Тесты | Vitest (юнит) + Playwright (E2E) | 4.1 / 1.62 |
| Качество | ESLint 9 (flat config) + Prettier | — |
| Пакеты | pnpm | 10.33 |

Совместимость Next ↔ Payload проверена по `peerDependencies` пакета
`@payloadcms/next@3.87.0` до установки — подробности в `docs/decisions.md`.

## 3. Структура каталогов

```
src/
  app/
    (frontend)/         публичный сайт
      layout.tsx        html/body, шрифты, header, footer, skip-link
      page.tsx          главная
      cases/            список и детальная страница
      services/  about/  contact/
      not-found.tsx
    (payload)/          админка и API Payload
      layout.tsx        RootLayout Payload
      admin/[[...segments]]/
      api/[...slug]/    REST
      api/graphql/
      custom.scss       лёгкая подгонка админки под бренд
    preview/            включение и выход из режима черновика
    healthz/            проверка живости для контейнера
    robots.ts           метаданные лежат в корне app: в route group Next их не собирает
    sitemap.ts
  collections/          Cases, Services, Categories, Team, Media, Enquiries, Users
  globals/              SiteSettings, Navigation
  blocks/               типизированные блоки страницы кейса
  fields/               переиспользуемые поля (slug, seo)
  access/               функции контроля доступа
  hooks/                сброс кеша после правок в CMS
  features/hero-scene/  изолированная 3D-сцена
  components/           layout, ui, home, cases, blocks, contact, seo, admin, brand
  lib/                  payload, queries, site, media-url, services, фильтры, схемы форм
  styles/               tokens.css, globals.css
  seed-assets/          исходники для наполнения демо-данными
scripts/                seed, create-admin, генерация ассетов, исследование, аудиты
tests/unit/  tests/e2e/
docs/                   документация
research/               исследование референсов, финальные скриншоты, Lighthouse
```

## 4. Границы клиента и сервера

Серверные компоненты — по умолчанию. `'use client'` есть только у пяти файлов,
и каждый имеет причину:

| Файл | Зачем клиент |
| --- | --- |
| `components/layout/MobileMenu.tsx` | Диалог с ловушкой фокуса и обработкой Escape |
| `components/ui/Reveal.tsx` | `IntersectionObserver` |
| `components/contact/ContactForm.tsx` | `useActionState`, состояния отправки |
| `components/cases/CaseSearchField.tsx` | Debounce ввода и обновление адреса |
| `components/blocks/CaseVideo.tsx` | Автовоспроизведение по видимости |
| `features/hero-scene/*` | WebGL |

**Фильтры кейсов работают на сервере.** Первая версия использовала
`useSearchParams` в клиентском компоненте: Next выводил его из SSR, список
подставлялся после гидратации и давал CLS ≈ 0.33. Сейчас `/cases` читает
`searchParams` как серверный компонент, фильтрует список на сервере и отдаёт
готовый HTML — CLS = 0, а фильтры (обычные ссылки) работают даже без JS.

## 5. Данные и кеширование

* Все публичные чтения проходят через `unstable_cache` с тегами
  (`src/lib/queries.ts`), `revalidate` = 300 с.
* Хуки `afterChange`/`afterDelete` коллекций и глобалов вызывают
  `revalidateTag` и `revalidatePath` (`src/hooks/revalidate.ts`), поэтому
  опубликованный кейс появляется на сайте сразу, а не через пять минут.
  Это проверяется E2E-тестом полного цикла.
* Страницы кейсов пререндерятся через `generateStaticParams`.
* Черновики читаются **без** кеша: иначе предпросмотр показывал бы устаревшее.

## 6. Медиа

* Payload генерирует размеры `thumbnail`, `card`, `portrait`, `wide`, `hero`, `og`
  и конвертирует загруженное в WebP.
* `MediaImage` — единственная точка вывода: обязательный `sizes`, фиксированный
  `aspect-ratio`, focal point, `priority` для первого экрана.
* `toImageSrc` (`src/lib/media-url.ts`) приводит URL к относительному пути, если
  файл на нашем же хосте. Без этого оптимизатор Next 16 отказывался забирать
  изображение (защита от SSRF: хост резолвится в приватный IP). Адреса
  S3/CDN остаются абсолютными и покрываются `remotePatterns`.

## 7. 3D-сцена

Изолирована в `src/features/hero-scene/` и делится на три слоя:

1. `shaders.ts` — GLSL: симплекс-шум, функция формы, освещение, частицы.
2. `GreySignalScene.ts` — класс three.js. Не знает про React: управляет
   рендером, DPR, паузами, потерей контекста, понижением качества.
3. `HeroCanvas.tsx` — клиентская обёртка: когда запускать и когда не запускать.

Загрузка: `next/dynamic` с `ssr: false`, старт после события `load` и следующего
простоя. Постер отрисовывается **сервером** в `Hero` через `next/image` с
`priority` — когда он лежал внутри клиентского компонента, LCP ждал бандл.

Сцена не запускается вовсе при: отсутствии WebGL, `deviceMemory ≤ 2`,
touch-устройстве слабее 6 ядер / 4 ГБ, ≤ 2 ядрах на десктопе. В этих случаях
остаётся постер, отрендеренный из этой же сцены.

## 8. Безопасность

* Аутентификация — только Payload: httpOnly-cookie, `maxLoginAttempts: 8`,
  `lockTime` 10 минут, `secure` cookie в production.
* Роли `admin` / `editor`; поля `role` и `active` меняет только администратор.
* Публичное чтение отдаёт только опубликованное (`publishedOrEditor`).
* Создание заявок закрыто для API: только серверный экшен с `overrideAccess`.
* Форма: honeypot, минимальное время заполнения, ограничение частоты по IP,
  серверная валидация Zod.
* Security headers в `next.config.mjs`; `/admin` и `/api` помечены `noindex`.
* Предпросмотр требует секрет **и** активную сессию редактора.
* `csrf`/`cors` в конфиге Payload ограничены значением `NEXT_PUBLIC_SITE_URL`.
  **Важно:** значение должно совпадать с публичным origin, иначе админка
  перестанет сохранять данные (см. `docs/deployment.md`).

## 9. Изображения и шрифты в сборке

`output: 'standalone'` — образ содержит только нужные зависимости. Шрифты
самохостятся Next во время сборки. Сторонних render-blocking скриптов нет;
аналитика подключается только при заданном идентификаторе, стратегией
`afterInteractive`.

/**
 * Наполнение базы демонстрационными данными.
 *
 * Все кейсы явно помечены как демонстрационные: названия клиентов вымышлены,
 * а метрики сопровождаются пометкой «демо-данные». Реальные цифры и названия
 * заводит владелец сайта через админку.
 *
 * Скрипт идемпотентен: повторный запуск обновляет уже созданные записи по slug.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const assetPath = (file: string) => path.resolve(dirname, '../src/seed-assets', file)

const DEMO_NOTE = 'демо-данные'

type MediaSeed = { file: string; alt: string; credit?: string }

const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text,
          version: 1,
        },
      ],
    })),
  },
})

const upsertMedia = async (payload: Payload, seed: MediaSeed): Promise<number> => {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { like: seed.file.replace(/\.[^.]+$/, '') } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) return existing.docs[0].id

  const created = await payload.create({
    collection: 'media',
    overrideAccess: true,
    filePath: assetPath(seed.file),
    data: { alt: seed.alt, credit: seed.credit, decorative: false },
  })
  return created.id
}

const upsertBySlug = async <T extends 'categories' | 'services' | 'team' | 'cases'>(
  payload: Payload,
  collection: T,
  slug: string,
  data: Record<string, unknown>,
): Promise<number> => {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
    draft: true,
  })

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection,
      id: existing.docs[0].id,
      overrideAccess: true,
      data: data as never,
    })
    return updated.id
  }

  const created = await payload.create({
    collection,
    overrideAccess: true,
    data: { ...data, slug } as never,
  })
  return created.id
}

const run = async () => {
  const payload = await getPayload({ config })
  console.log('Заполняем демонстрационные данные…')

  // ── Медиа ──────────────────────────────────────────────────────────────
  const covers: number[] = []
  for (let i = 1; i <= 5; i += 1) {
    covers.push(
      await upsertMedia(payload, {
        file: `demo-cover-${i}.jpg`,
        alt: `Абстрактная обложка демонстрационного кейса ${i}`,
      }),
    )
  }

  const photoShcherbakov = await upsertMedia(payload, {
    file: 'founder-shcherbakov.jpg',
    alt: 'Портрет: Антон Щербаков',
    credit: 'Фото предоставлено основателем',
  })
  const photoKhityaev = await upsertMedia(payload, {
    file: 'founder-khityaev.jpg',
    alt: 'Портрет: Евгений Хитяев',
    credit: 'Фото предоставлено основателем',
  })

  // ── Категории ──────────────────────────────────────────────────────────
  const categories = [
    {
      slug: 'product',
      title: 'Цифровые продукты',
      sortOrder: 10,
      description: 'Веб-сервисы и приложения.',
    },
    {
      slug: 'ecommerce',
      title: 'E-commerce',
      sortOrder: 20,
      description: 'Магазины и маркетплейсы.',
    },
    {
      slug: 'corporate',
      title: 'Корпоративные сайты',
      sortOrder: 30,
      description: 'Сайты компаний и брендов.',
    },
    {
      slug: 'internal',
      title: 'Внутренние системы',
      sortOrder: 40,
      description: 'Панели и админки.',
    },
  ]
  const categoryIds: Record<string, number> = {}
  for (const category of categories) {
    categoryIds[category.slug] = await upsertBySlug(payload, 'categories', category.slug, category)
  }

  // ── Услуги ─────────────────────────────────────────────────────────────
  const services = [
    {
      slug: 'discovery',
      title: 'Discovery и стратегия',
      icon: 'path',
      sortOrder: 10,
      promise: 'Понятная картина: что делаем, для кого и в каком порядке.',
      shortDescription:
        'Разбираемся в задаче до начала работы: интервью, аналитика, конкуренты, ограничения.',
      clientProblems: [
        { text: 'Идей много, непонятно, с чего начинать' },
        { text: 'Не сходится экономика продукта' },
        { text: 'Прошлая команда сделала не то' },
      ],
      scope: [
        { text: 'Интервью с командой и пользователями' },
        { text: 'Разбор аналитики и текущих сценариев' },
        { text: 'Приоритизация функций' },
      ],
      deliverables: [
        { text: 'Карта сценариев', note: 'основные пути пользователя' },
        { text: 'Список гипотез с приоритетом' },
        { text: 'План работ по этапам' },
      ],
    },
    {
      slug: 'ux-ui',
      title: 'UX/UI-дизайн',
      icon: 'grid',
      sortOrder: 20,
      promise: 'Интерфейс, в котором понятно, что делать дальше.',
      shortDescription: 'Проектирование, визуальный язык и передача макетов в разработку.',
      clientProblems: [
        { text: 'Пользователи не доходят до целевого действия' },
        { text: 'Интерфейс вырос стихийно и стал неуправляемым' },
      ],
      scope: [
        { text: 'Структура и прототипы' },
        { text: 'Визуальный язык и компоненты' },
        { text: 'Адаптив и состояния' },
      ],
      deliverables: [
        { text: 'Макеты ключевых экранов' },
        { text: 'UI-кит с компонентами' },
        { text: 'Спецификация состояний' },
      ],
    },
    {
      slug: 'design-system',
      title: 'Дизайн-система',
      icon: 'layers',
      sortOrder: 30,
      promise: 'Один источник правды по интерфейсу для дизайна и кода.',
      shortDescription: 'Токены, компоненты и правила, синхронные между макетами и кодом.',
      clientProblems: [{ text: 'Каждая новая страница выглядит по-своему' }],
      scope: [{ text: 'Токены и типографика' }, { text: 'Библиотека компонентов' }],
      deliverables: [{ text: 'Библиотека компонентов' }, { text: 'Документация по применению' }],
    },
    {
      slug: 'web-development',
      title: 'Веб-разработка',
      icon: 'core',
      sortOrder: 40,
      promise: 'Быстрый сайт или сервис, который выдерживает нагрузку и правки.',
      shortDescription: 'Next.js, TypeScript, PostgreSQL, headless CMS.',
      clientProblems: [
        { text: 'Сайт медленный и плохо индексируется' },
        { text: 'Каждая правка контента требует разработчика' },
      ],
      scope: [{ text: 'Фронтенд и бэкенд' }, { text: 'Интеграция CMS' }, { text: 'Тесты и CI' }],
      deliverables: [
        { text: 'Рабочее приложение' },
        { text: 'Админка для контента' },
        { text: 'Инструкции по деплою' },
      ],
    },
    {
      slug: 'cms-integration',
      title: 'CMS и контент',
      icon: 'layers',
      sortOrder: 50,
      promise: 'Контент меняется без участия разработчиков.',
      shortDescription: 'Настройка модели контента, ролей и предпросмотра.',
      clientProblems: [{ text: 'Редакторы боятся что-нибудь сломать' }],
      scope: [
        { text: 'Модель контента' },
        { text: 'Роли и права' },
        { text: 'Обучение редакторов' },
      ],
      deliverables: [{ text: 'Настроенная CMS' }, { text: 'Инструкция для редактора' }],
    },
    {
      slug: 'support',
      title: 'Поддержка и развитие',
      icon: 'signal',
      sortOrder: 60,
      promise: 'После запуска продукт продолжает жить и улучшаться.',
      shortDescription: 'Мониторинг, обновления, доработки по спринтам.',
      clientProblems: [{ text: 'После сдачи проекта команда исчезла' }],
      scope: [{ text: 'Мониторинг и обновления' }, { text: 'Регулярные доработки' }],
      deliverables: [{ text: 'Отчёт по спринту' }, { text: 'План улучшений' }],
    },
  ]

  const serviceIds: Record<string, number> = {}
  for (const service of services) {
    serviceIds[service.slug] = await upsertBySlug(payload, 'services', service.slug, {
      ...service,
      published: true,
      fullDescription: richText([service.shortDescription]),
      ctaLabel: 'Обсудить проект',
      ctaHref: '/contact',
    })
  }

  // ── Команда ────────────────────────────────────────────────────────────
  await upsertBySlug(payload, 'team', 'anton-shcherbakov', {
    name: 'Антон Щербаков',
    role: 'Сооснователь',
    photo: photoShcherbakov,
    shortBio:
      'Отвечает за техническую часть проектов. Роль и биография — редактируемые поля, уточните их в админке.',
    published: true,
    sortOrder: 10,
  })

  await upsertBySlug(payload, 'team', 'evgeniy-khityaev', {
    name: 'Евгений Хитяев',
    role: 'Сооснователь',
    photo: photoKhityaev,
    shortBio:
      'Отвечает за продукт и работу с клиентами. Роль и биография — редактируемые поля, уточните их в админке.',
    published: true,
    sortOrder: 20,
  })

  // ── Кейсы ──────────────────────────────────────────────────────────────
  const cases = [
    {
      slug: 'demo-logistics-platform',
      title: '[demo] Платформа для логистической компании',
      client: '[demo] «Северный путь»',
      year: 2025,
      featured: true,
      sortOrder: 10,
      status: 'published',
      categories: [categoryIds.product, categoryIds.internal],
      services: [serviceIds.discovery, serviceIds['ux-ui'], serviceIds['web-development']],
      cover: covers[0],
      shortDescription:
        'Демонстрационный кейс. Свели заявки, маршруты и статусы в один интерфейс вместо трёх таблиц.',
      shortResult: 'Оформление заявки: 14 → 4 мин',
      tags: [{ label: 'Платформа' }, { label: 'Next.js' }, { label: 'Дашборд' }],
      metrics: [
        {
          value: '−71%',
          label: 'Время оформления заявки',
          source: `Замеры до и после, ${DEMO_NOTE}`,
        },
        { value: '3 → 1', label: 'Количество систем у оператора', source: DEMO_NOTE },
      ],
    },
    {
      slug: 'demo-ecommerce-redesign',
      title: '[demo] Редизайн интернет-магазина',
      client: '[demo] «Тихий Склад»',
      year: 2025,
      featured: true,
      sortOrder: 20,
      status: 'published',
      categories: [categoryIds.ecommerce],
      services: [serviceIds['ux-ui'], serviceIds['design-system'], serviceIds['web-development']],
      cover: covers[1],
      shortDescription:
        'Демонстрационный кейс. Пересобрали каталог и оформление заказа, унифицировали компоненты.',
      shortResult: 'LCP 3.9 с → 1.4 с',
      tags: [{ label: 'E-commerce' }, { label: 'Дизайн-система' }],
      metrics: [{ value: '1.4 с', label: 'LCP на мобильных', source: `Lighthouse, ${DEMO_NOTE}` }],
    },
    {
      slug: 'demo-medical-service',
      title: '[demo] Сервис онлайн-записи',
      client: '[demo] Клиника «Ровно»',
      year: 2024,
      featured: true,
      sortOrder: 30,
      status: 'published',
      categories: [categoryIds.product],
      services: [serviceIds.discovery, serviceIds['web-development'], serviceIds.support],
      cover: covers[2],
      shortDescription:
        'Демонстрационный кейс. Запись к врачу в три шага и понятные статусы вместо звонков в регистратуру.',
      shortResult: 'Доля онлайн-записи: 12% → 47%',
      tags: [{ label: 'Здоровье' }, { label: 'Сервис' }],
      metrics: [{ value: '47%', label: 'Доля онлайн-записи', source: DEMO_NOTE }],
    },
    {
      slug: 'demo-corporate-site',
      title: '[demo] Корпоративный сайт производителя',
      client: '[demo] «Гранит-Про»',
      year: 2024,
      featured: false,
      sortOrder: 40,
      status: 'published',
      categories: [categoryIds.corporate],
      services: [serviceIds['ux-ui'], serviceIds['cms-integration']],
      cover: covers[3],
      shortDescription:
        'Демонстрационный кейс. Сайт с каталогом продукции, который редакторы обновляют сами.',
      tags: [{ label: 'Сайт' }, { label: 'CMS' }],
    },
    {
      slug: 'demo-internal-dashboard',
      title: '[demo] Панель управления складом',
      client: '[demo] «Полка»',
      year: 2026,
      featured: false,
      sortOrder: 50,
      // Черновик: нужен, чтобы проверить, что неопубликованное не попадает на сайт.
      status: 'draft',
      categories: [categoryIds.internal],
      services: [serviceIds['web-development']],
      cover: covers[4],
      shortDescription:
        'Демонстрационный черновик. Не опубликован — на публичном сайте появляться не должен.',
      tags: [{ label: 'Внутренние системы' }],
    },
  ]

  const caseIds: Record<string, number> = {}
  for (const item of cases) {
    const { status, ...rest } = item
    caseIds[item.slug] = await upsertBySlug(payload, 'cases', item.slug, {
      ...rest,
      _status: status,
      publishedAt: status === 'published' ? new Date(item.year, 5, 1).toISOString() : undefined,
      challenge: richText([
        'Это демонстрационный кейс, созданный скриптом наполнения. Замените текст реальным описанием задачи через админку.',
      ]),
      context: richText([
        'Раздел «Контекст» показывает, как выглядит структура рассказа о проекте. Любую секцию можно оставить пустой — тогда она не выводится.',
      ]),
      solution: richText([
        'Раздел «Решение» описывает, что именно было сделано и почему выбран такой подход.',
      ]),
      results: richText([
        'Раздел «Результат» описывает, что изменилось. Цифры добавляйте только там, где их действительно измеряли.',
      ]),
      contentBlocks:
        item.slug === 'demo-logistics-platform'
          ? [
              {
                blockType: 'richText',
                eyebrow: 'Подход',
                heading: 'Что мы поменяли',
                width: 'narrow',
                content: richText([
                  'Пример текстового блока страницы кейса. Блоки добавляются и переставляются в админке.',
                ]),
              },
              {
                blockType: 'fullWidthImage',
                image: covers[0],
                caption: 'Пример изображения во всю ширину (демонстрационное).',
                bleed: true,
              },
              {
                blockType: 'metricGrid',
                heading: 'Что изменилось',
                metrics: [
                  { value: '−71%', label: 'Время оформления заявки', source: DEMO_NOTE },
                  { value: '×2', label: 'Заявок на оператора в смену', source: DEMO_NOTE },
                ],
              },
              {
                blockType: 'stickyText',
                heading: 'Как шла работа',
                intro: 'Пример блока с закреплённым заголовком и списком шагов.',
                steps: [
                  { title: 'Discovery', text: 'Интервью с операторами и разбор текущих таблиц.' },
                  {
                    title: 'Прототип',
                    text: 'Собрали кликабельный прототип и проверили на реальных заявках.',
                  },
                  {
                    title: 'Разработка',
                    text: 'Собрали интерфейс и подключили к учётной системе.',
                  },
                ],
              },
            ]
          : [],
    })
  }

  // Связанные кейсы проставляем вторым проходом: на первом их id ещё не существует.
  await payload.update({
    collection: 'cases',
    id: caseIds['demo-logistics-platform'],
    overrideAccess: true,
    data: { relatedCase: caseIds['demo-ecommerce-redesign'] },
  })
  await payload.update({
    collection: 'services',
    id: serviceIds['web-development'],
    overrideAccess: true,
    data: {
      relatedCases: [caseIds['demo-logistics-platform'], caseIds['demo-medical-service']],
    },
  })

  // ── Глобальные настройки ───────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      siteName: 'Серая Мышь',
      heroHeading: 'Серая Мышь',
      heroSubheading: 'Тихо делаем заметные цифровые продукты.',
      heroNote: 'Проектируем, разрабатываем и поддерживаем сайты и сервисы.',
      primaryCta: { label: 'Смотреть кейсы', href: '/cases' },
      secondaryCta: { label: 'Обсудить проект', href: '/contact' },
      positioning:
        'Небольшая студия, которая делает продукты внимательно и без лишнего шума: разбираемся в задаче, проектируем, пишем код и остаёмся рядом после запуска.',
      principles: [
        {
          title: 'Сначала разобраться',
          text: 'Не начинаем макеты, пока не поймём, как устроены задача и ограничения.',
        },
        {
          title: 'Небольшая команда',
          text: 'С проектом работают те же люди, что его начинали. Передач между отделами нет.',
        },
        {
          title: 'Работающий код важнее презентаций',
          text: 'Показываем прогресс на стенде, а не в слайдах.',
        },
        {
          title: 'Честные сроки',
          text: 'Если что-то не успеваем, говорим об этом сразу, а не в день сдачи.',
        },
      ],
      processSteps: [
        {
          title: 'Разговор',
          text: 'Обсуждаем задачу и ограничения, оцениваем объём.',
          duration: '2–3 дня',
        },
        {
          title: 'Discovery',
          text: 'Сценарии, приоритеты, план по этапам.',
          duration: '1–2 недели',
        },
        {
          title: 'Дизайн и сборка',
          text: 'Прототип, интерфейс, разработка итерациями.',
          duration: 'от 4 недель',
        },
        {
          title: 'Запуск и развитие',
          text: 'Выкладываем, замеряем, дорабатываем.',
          duration: 'постоянно',
        },
      ],
      contactHeading: 'Расскажите про задачу',
      contactText:
        'Напишите пару предложений о продукте и о том, что нужно сделать. Ответим в течение рабочего дня.',
      // Контакты-заглушки: заменить реальными перед публикацией сайта.
      email: 'hello@example.test',
      city: 'Россия, удалённо',
      footerText: 'Digital-студия. Проектируем, разрабатываем и поддерживаем цифровые продукты.',
      legalName: 'Серая Мышь',
      consentText:
        'Отправляя форму, вы соглашаетесь на обработку персональных данных для ответа на обращение.',
      organizationDescription:
        'Digital-студия «Серая Мышь»: исследование, дизайн, разработка и поддержка цифровых продуктов.',
      seo: {
        title: 'Серая Мышь — digital-студия',
        description:
          'Проектируем, разрабатываем и поддерживаем сайты и цифровые сервисы. Тихо делаем заметные продукты.',
      },
    },
  })

  await payload.updateGlobal({
    slug: 'navigation',
    overrideAccess: true,
    data: {
      header: [
        { label: 'Кейсы', href: '/cases' },
        { label: 'Услуги', href: '/services' },
        { label: 'О студии', href: '/about' },
        { label: 'Контакты', href: '/contact' },
      ],
      headerCta: { label: 'Обсудить проект', href: '/contact', enabled: true },
      footerGroups: [
        {
          title: 'Студия',
          links: [
            { label: 'Кейсы', href: '/cases' },
            { label: 'Услуги', href: '/services' },
            { label: 'О студии', href: '/about' },
          ],
        },
        {
          title: 'Связь',
          links: [{ label: 'Контакты', href: '/contact' }],
        },
      ],
    },
  })

  console.log('Готово. Демонстрационные кейсы помечены префиксом [demo].')
  process.exit(0)
}

run().catch((error) => {
  console.error('Ошибка при наполнении данными:', error)
  process.exit(1)
})

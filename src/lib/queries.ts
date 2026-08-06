import { unstable_cache } from 'next/cache'

import type {
  Case,
  Category,
  Navigation as NavigationType,
  Service,
  SiteSetting,
  Team,
} from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Типизированные запросы к CMS. Все публичные чтения проходят через
 * `unstable_cache` с тегами, которые сбрасываются вебхуком ревалидации.
 */

export const CACHE_TAGS = {
  cases: 'cases',
  services: 'services',
  categories: 'categories',
  team: 'team',
  settings: 'site-settings',
  navigation: 'navigation',
} as const

const revalidateSeconds = 300

/**
 * Обёртка для чтений из CMS.
 *
 * Страницы пререндерятся на этапе сборки, а образ может собираться без
 * доступной базы (например, при первой сборке до применения миграций).
 * В этом случае сборка не должна падать: возвращаем пустой результат и пишем
 * предупреждение, а реальные данные подтянутся при первом запросе.
 *
 * В рантайме ошибка подключения тоже не роняет страницу целиком — секция
 * просто не отрисуется, а `/healthz` покажет `database: unreachable`.
 */
const safeQuery = async <T>(label: string, fallback: T, query: () => Promise<T>): Promise<T> => {
  try {
    return await query()
  } catch (error) {
    console.warn(`[cms] запрос «${label}» не выполнен, используется пустой результат:`, error)
    return fallback
  }
}

/*
  Запасные значения глобалов на случай недоступной базы. Они совпадают с
  defaultValue соответствующих полей, поэтому шапка, футер и первый экран
  остаются осмысленными даже без CMS.
*/
const EMPTY_SITE_SETTINGS = {
  id: 0,
  siteName: 'Серая Мышь',
  heroHeading: 'Серая Мышь',
  heroSubheading: 'Тихо делаем заметные цифровые продукты.',
  primaryCta: { label: 'Смотреть кейсы', href: '/cases' },
  secondaryCta: { label: 'Обсудить проект', href: '/contact' },
  updatedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
} as SiteSetting

const EMPTY_NAVIGATION = {
  id: 0,
  header: [
    { id: 'cases', label: 'Кейсы', href: '/cases' },
    { id: 'services', label: 'Услуги', href: '/services' },
    { id: 'about', label: 'О студии', href: '/about' },
    { id: 'contact', label: 'Контакты', href: '/contact' },
  ],
  headerCta: { label: 'Обсудить проект', href: '/contact', enabled: true },
  footerGroups: [],
  updatedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
} as NavigationType

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSetting> =>
    safeQuery('site-settings', EMPTY_SITE_SETTINGS, async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'site-settings', depth: 2 })
    }),
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: revalidateSeconds },
)

export const getNavigation = unstable_cache(
  async (): Promise<NavigationType> =>
    safeQuery('navigation', EMPTY_NAVIGATION, async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'navigation', depth: 0 })
    }),
  ['navigation'],
  { tags: [CACHE_TAGS.navigation], revalidate: revalidateSeconds },
)

export const getPublishedCases = unstable_cache(
  async (): Promise<Case[]> =>
    safeQuery('cases', [], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'cases',
        where: { _status: { equals: 'published' } },
        sort: ['sortOrder', '-publishedAt'],
        limit: 200,
        depth: 2,
      })
      return result.docs
    }),
  ['cases-published'],
  { tags: [CACHE_TAGS.cases], revalidate: revalidateSeconds },
)

export const getFeaturedCases = unstable_cache(
  async (limit = 3): Promise<Case[]> =>
    safeQuery('featured-cases', [], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'cases',
        where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
        sort: ['sortOrder', '-publishedAt'],
        limit,
        depth: 2,
      })
      return result.docs
    }),
  ['cases-featured'],
  { tags: [CACHE_TAGS.cases], revalidate: revalidateSeconds },
)

export const getPublishedServices = unstable_cache(
  async (): Promise<Service[]> =>
    safeQuery('services', [], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'services',
        where: { published: { equals: true } },
        sort: ['sortOrder'],
        limit: 50,
        depth: 2,
      })
      return result.docs
    }),
  ['services-published'],
  { tags: [CACHE_TAGS.services, CACHE_TAGS.cases], revalidate: revalidateSeconds },
)

export const getCategories = unstable_cache(
  async (): Promise<Category[]> =>
    safeQuery('categories', [], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        sort: ['sortOrder'],
        limit: 50,
        depth: 0,
      })
      return result.docs
    }),
  ['categories'],
  { tags: [CACHE_TAGS.categories], revalidate: revalidateSeconds },
)

export const getTeam = unstable_cache(
  async (): Promise<Team[]> =>
    safeQuery('team', [], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'team',
        where: { published: { equals: true } },
        sort: ['sortOrder'],
        limit: 50,
        depth: 2,
      })
      return result.docs
    }),
  ['team'],
  { tags: [CACHE_TAGS.team], revalidate: revalidateSeconds },
)

/**
 * Кейс по slug. Черновики отдаются только в draft mode — кеш здесь не
 * используется, иначе предпросмотр показывал бы устаревшие данные.
 */
export const getCaseBySlug = async (slug: string, draft = false): Promise<Case | null> =>
  safeQuery(`case:${slug}`, null, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'cases',
      where: draft
        ? { slug: { equals: slug } }
        : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      draft,
      limit: 1,
      depth: 3,
      overrideAccess: draft,
    })
    return result.docs[0] ?? null
  })

export const getServiceBySlug = async (slug: string): Promise<Service | null> =>
  safeQuery(`service:${slug}`, null, async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'services',
      where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
      limit: 1,
      depth: 2,
    })
    return result.docs[0] ?? null
  })

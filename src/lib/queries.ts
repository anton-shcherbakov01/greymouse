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

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSetting> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'site-settings', depth: 2 })
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.settings], revalidate: revalidateSeconds },
)

export const getNavigation = unstable_cache(
  async (): Promise<NavigationType> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'navigation', depth: 0 })
  },
  ['navigation'],
  { tags: [CACHE_TAGS.navigation], revalidate: revalidateSeconds },
)

export const getPublishedCases = unstable_cache(
  async (): Promise<Case[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'cases',
      where: { _status: { equals: 'published' } },
      sort: ['sortOrder', '-publishedAt'],
      limit: 200,
      depth: 2,
    })
    return result.docs
  },
  ['cases-published'],
  { tags: [CACHE_TAGS.cases], revalidate: revalidateSeconds },
)

export const getFeaturedCases = unstable_cache(
  async (limit = 3): Promise<Case[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'cases',
      where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
      sort: ['sortOrder', '-publishedAt'],
      limit,
      depth: 2,
    })
    return result.docs
  },
  ['cases-featured'],
  { tags: [CACHE_TAGS.cases], revalidate: revalidateSeconds },
)

export const getPublishedServices = unstable_cache(
  async (): Promise<Service[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'services',
      where: { published: { equals: true } },
      sort: ['sortOrder'],
      limit: 50,
      depth: 2,
    })
    return result.docs
  },
  ['services-published'],
  { tags: [CACHE_TAGS.services, CACHE_TAGS.cases], revalidate: revalidateSeconds },
)

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'categories',
      sort: ['sortOrder'],
      limit: 50,
      depth: 0,
    })
    return result.docs
  },
  ['categories'],
  { tags: [CACHE_TAGS.categories], revalidate: revalidateSeconds },
)

export const getTeam = unstable_cache(
  async (): Promise<Team[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'team',
      where: { published: { equals: true } },
      sort: ['sortOrder'],
      limit: 50,
      depth: 2,
    })
    return result.docs
  },
  ['team'],
  { tags: [CACHE_TAGS.team], revalidate: revalidateSeconds },
)

/**
 * Кейс по slug. Черновики отдаются только в draft mode — кеш здесь не
 * используется, иначе предпросмотр показывал бы устаревшие данные.
 */
export const getCaseBySlug = async (slug: string, draft = false): Promise<Case | null> => {
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
}

export const getServiceBySlug = async (slug: string): Promise<Service | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'services',
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

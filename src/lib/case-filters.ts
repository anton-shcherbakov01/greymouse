import type { Case } from '@/payload-types'

export type CaseFilterState = {
  category: string | null
  service: string | null
  query: string
}

export const EMPTY_FILTERS: CaseFilterState = { category: null, service: null, query: '' }

/** Разбор состояния фильтров из query params — общий для сервера и клиента. */
export const parseFilters = (params: URLSearchParams | Record<string, string | undefined>): CaseFilterState => {
  const read = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key)
    return params[key] ?? null
  }

  const clean = (value: string | null): string | null => {
    const trimmed = value?.trim() ?? ''
    return trimmed.length > 0 && trimmed !== 'all' ? trimmed : null
  }

  return {
    category: clean(read('category')),
    service: clean(read('service')),
    query: (read('q') ?? '').trim().slice(0, 80),
  }
}

export const serialiseFilters = (filters: CaseFilterState): string => {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.service) params.set('service', filters.service)
  if (filters.query) params.set('q', filters.query)
  const value = params.toString()
  return value ? `?${value}` : ''
}

const relationSlugs = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (item && typeof item === 'object' && 'slug' in item ? String(item.slug) : null))
    .filter((slug): slug is string => Boolean(slug))
}

export const filterCases = (cases: Case[], filters: CaseFilterState): Case[] => {
  const needle = filters.query.toLowerCase()

  return cases.filter((caseItem) => {
    if (filters.category && !relationSlugs(caseItem.categories).includes(filters.category)) {
      return false
    }
    if (filters.service && !relationSlugs(caseItem.services).includes(filters.service)) {
      return false
    }
    if (!needle) return true

    const haystack = [
      caseItem.title,
      caseItem.client,
      caseItem.shortDescription,
      caseItem.shortResult ?? '',
      ...(caseItem.tags ?? []).map((tag) => tag.label),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(needle)
  })
}

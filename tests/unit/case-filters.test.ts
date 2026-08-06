import { describe, expect, it } from 'vitest'

import { filterCases, parseFilters, serialiseFilters } from '@/lib/case-filters'
import type { Case } from '@/payload-types'

const makeCase = (overrides: Partial<Case>): Case =>
  ({
    id: 1,
    title: 'Платформа',
    slug: 'platforma',
    client: 'Клиент',
    year: 2025,
    shortDescription: 'Описание проекта',
    cover: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as Case

const cases = [
  makeCase({
    id: 1,
    title: 'Логистика',
    client: 'Северный путь',
    categories: [{ id: 1, slug: 'product', title: 'Продукты' }],
    services: [{ id: 1, slug: 'web-development', title: 'Разработка' }],
    tags: [{ id: '1', label: 'Дашборд' }],
  } as Partial<Case>),
  makeCase({
    id: 2,
    title: 'Магазин',
    client: 'Тихий Склад',
    categories: [{ id: 2, slug: 'ecommerce', title: 'E-commerce' }],
    services: [{ id: 2, slug: 'ux-ui', title: 'Дизайн' }],
  } as Partial<Case>),
]

describe('parseFilters', () => {
  it('читает параметры из URLSearchParams', () => {
    const params = new URLSearchParams('category=ecommerce&service=ux-ui&q=магазин')
    expect(parseFilters(params)).toEqual({
      category: 'ecommerce',
      service: 'ux-ui',
      query: 'магазин',
    })
  })

  it('значение all трактует как отсутствие фильтра', () => {
    expect(parseFilters(new URLSearchParams('category=all')).category).toBeNull()
  })

  it('возвращает пустое состояние без параметров', () => {
    expect(parseFilters(new URLSearchParams(''))).toEqual({
      category: null,
      service: null,
      query: '',
    })
  })

  it('ограничивает длину поискового запроса', () => {
    const params = new URLSearchParams(`q=${'а'.repeat(200)}`)
    expect(parseFilters(params).query.length).toBe(80)
  })
})

describe('serialiseFilters', () => {
  it('собирает query string только из заданных значений', () => {
    expect(serialiseFilters({ category: 'product', service: null, query: '' })).toBe(
      '?category=product',
    )
  })

  it('возвращает пустую строку, когда фильтров нет', () => {
    expect(serialiseFilters({ category: null, service: null, query: '' })).toBe('')
  })

  it('делает обход parse → serialise устойчивым', () => {
    const source = '?category=ecommerce&service=ux-ui&q=%D1%82%D0%B5%D1%81%D1%82'
    const parsed = parseFilters(new URLSearchParams(source))
    expect(parseFilters(new URLSearchParams(serialiseFilters(parsed)))).toEqual(parsed)
  })
})

describe('filterCases', () => {
  it('без фильтров возвращает всё', () => {
    expect(filterCases(cases, { category: null, service: null, query: '' })).toHaveLength(2)
  })

  it('фильтрует по категории', () => {
    const result = filterCases(cases, { category: 'ecommerce', service: null, query: '' })
    expect(result.map((c) => c.id)).toEqual([2])
  })

  it('фильтрует по услуге', () => {
    const result = filterCases(cases, { category: null, service: 'web-development', query: '' })
    expect(result.map((c) => c.id)).toEqual([1])
  })

  it('ищет по названию, клиенту и тегам без учёта регистра', () => {
    expect(filterCases(cases, { category: null, service: null, query: 'ЛОГИСТ' })).toHaveLength(1)
    expect(filterCases(cases, { category: null, service: null, query: 'склад' })).toHaveLength(1)
    expect(filterCases(cases, { category: null, service: null, query: 'дашборд' })).toHaveLength(1)
  })

  it('комбинирует фильтры по И', () => {
    const result = filterCases(cases, {
      category: 'ecommerce',
      service: 'web-development',
      query: '',
    })
    expect(result).toHaveLength(0)
  })
})

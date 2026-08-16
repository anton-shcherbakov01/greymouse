import { describe, expect, it } from 'vitest'

import { sortServices } from '@/lib/services'
import type { Service } from '@/payload-types'

const service = (id: number, sortOrder?: number, title = `Услуга ${id}`): Service =>
  ({ id, title, slug: `s-${id}`, sortOrder }) as Service

describe('sortServices', () => {
  it('сортирует по полю «Порядок»', () => {
    const sorted = sortServices([service(1, 30), service(2, 10), service(3, 20)])
    expect(sorted.map((item) => item.id)).toEqual([2, 3, 1])
  })

  it('при равном порядке сортирует по названию по-русски', () => {
    const sorted = sortServices([
      service(1, 10, 'Ядро'),
      service(2, 10, 'Аудит'),
      service(3, 10, 'Ёмкость'),
    ])
    expect(sorted.map((item) => item.title)).toEqual(['Аудит', 'Ёмкость', 'Ядро'])
  })

  it('услуги без порядка уходят в конец к значению по умолчанию', () => {
    const sorted = sortServices([service(1), service(2, 5)])
    expect(sorted.map((item) => item.id)).toEqual([2, 1])
  })

  it('не изменяет исходный массив', () => {
    const input = [service(1, 30), service(2, 10)]
    sortServices(input)
    expect(input.map((item) => item.id)).toEqual([1, 2])
  })

  it('на пустом списке возвращает пустой массив', () => {
    expect(sortServices([])).toEqual([])
  })
})

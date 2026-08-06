import { describe, expect, it } from 'vitest'

import { groupServicesByStage, STAGE_LABELS, STAGE_ORDER } from '@/lib/services'
import type { Service } from '@/payload-types'

const service = (id: number, stage: Service['stage']): Service =>
  ({ id, stage, title: `Услуга ${id}`, slug: `s-${id}` }) as Service

describe('groupServicesByStage', () => {
  it('сохраняет порядок этапов жизненного цикла', () => {
    const grouped = groupServicesByStage([
      service(1, 'growth'),
      service(2, 'research'),
      service(3, 'development'),
    ])
    expect(grouped.map(([stage]) => stage)).toEqual(['research', 'development', 'growth'])
  })

  it('не возвращает пустые этапы', () => {
    const grouped = groupServicesByStage([service(1, 'design')])
    expect(grouped).toHaveLength(1)
    expect(grouped[0]?.[0]).toBe('design')
  })

  it('на пустом списке возвращает пустой массив', () => {
    expect(groupServicesByStage([])).toEqual([])
  })

  it('для каждого этапа есть человекочитаемая подпись', () => {
    STAGE_ORDER.forEach((stage) => {
      expect(STAGE_LABELS[stage]).toBeTruthy()
    })
  })
})

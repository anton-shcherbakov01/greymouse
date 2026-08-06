import { describe, expect, it } from 'vitest'

import { FrameCostMonitor, lowerTier, QUALITY, raiseTier } from '@/features/hero-scene/quality'

const feed = (monitor: FrameCostMonitor, cost: number, frames: number) => {
  const verdicts: Array<'lower' | 'raise' | null> = []
  for (let i = 0; i < frames; i += 1) verdicts.push(monitor.push(cost))
  return verdicts.filter(Boolean)
}

describe('уровни качества сцены', () => {
  it('чем выше уровень, тем больше частиц и выше потолок DPR', () => {
    expect(QUALITY.low.particles).toBeLessThan(QUALITY.medium.particles)
    expect(QUALITY.medium.particles).toBeLessThan(QUALITY.high.particles)
    expect(QUALITY.low.maxDpr).toBeLessThan(QUALITY.high.maxDpr)
  })

  it('усы есть на всех уровнях — это узнаваемая деталь сцены', () => {
    expect(QUALITY.low.whiskersPerSide).toBeGreaterThan(0)
  })

  it('на низком уровне отключены сетка, контуры и пыль', () => {
    expect(QUALITY.low.grid).toBe(false)
    expect(QUALITY.low.contours).toBe(false)
    expect(QUALITY.low.dust).toBe(false)
  })

  it('переходы по ступеням не выходят за границы', () => {
    expect(lowerTier('high')).toBe('medium')
    expect(lowerTier('low')).toBe('low')
    expect(raiseTier('low', 'high')).toBe('medium')
    expect(raiseTier('high', 'high')).toBe('high')
  })

  it('повышение не поднимается выше стартового уровня', () => {
    // Потолок — уровень, определённый при запуске: адаптация может вернуть
    // качество назад, но не сделать сцену тяжелее, чем задумано для устройства.
    expect(raiseTier('low', 'low')).toBe('low')
    expect(raiseTier('medium', 'medium')).toBe('medium')
  })
})

describe('FrameCostMonitor', () => {
  it('молчит, пока окно не набрано', () => {
    const monitor = new FrameCostMonitor(90)
    expect(feed(monitor, 40, 89)).toEqual([])
  })

  it('требует понижения на дорогих кадрах', () => {
    const monitor = new FrameCostMonitor(90)
    expect(feed(monitor, 40, 90)).toEqual(['lower'])
  })

  it('на дешёвых кадрах повышает только после двух спокойных окон', () => {
    const monitor = new FrameCostMonitor(90)
    expect(feed(monitor, 5, 90)).toEqual([])
    expect(feed(monitor, 5, 90)).toEqual(['raise'])
  })

  it('дорогое окно сбрасывает накопленное спокойствие', () => {
    const monitor = new FrameCostMonitor(90)
    feed(monitor, 5, 90) // одно спокойное окно
    expect(feed(monitor, 40, 90)).toEqual(['lower'])
    // Спокойный счётчик обнулён: следующего окна для повышения уже мало.
    expect(feed(monitor, 5, 90)).toEqual([])
  })

  it('на средней нагрузке не трогает качество', () => {
    const monitor = new FrameCostMonitor(90)
    expect(feed(monitor, 16, 270)).toEqual([])
  })
})

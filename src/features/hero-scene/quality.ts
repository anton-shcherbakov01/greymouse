import type { QualityTier } from './types'

export type QualityPreset = {
  /** Подразделение икосаэдра ядра. 6 — это 20 480 треугольников. */
  subdivision: number
  particles: number
  /** Линий-«усов» на каждую сторону. */
  whiskersPerSide: number
  grid: boolean
  /** Контурные изолинии на поверхности ядра. */
  contours: boolean
  /** Пылинки на фоне. */
  dust: boolean
  maxDpr: number
  antialias: boolean
}

export const QUALITY: Record<QualityTier, QualityPreset> = {
  low: {
    subdivision: 4,
    particles: 220,
    whiskersPerSide: 2,
    grid: false,
    contours: false,
    dust: false,
    maxDpr: 1.25,
    antialias: false,
  },
  medium: {
    subdivision: 5,
    particles: 520,
    whiskersPerSide: 3,
    grid: true,
    contours: true,
    dust: false,
    maxDpr: 1.5,
    antialias: true,
  },
  high: {
    subdivision: 6,
    particles: 900,
    whiskersPerSide: 3,
    grid: true,
    contours: true,
    dust: true,
    maxDpr: 1.75,
    antialias: true,
  },
}

const ORDER: QualityTier[] = ['low', 'medium', 'high']

/**
 * Стартовый уровень. Число ядер, тип указателя и ширина экрана — только
 * сигналы: ни один из них не говорит о GPU напрямую. Поэтому дальше уровень
 * уточняется по фактической стоимости кадра (`FrameCostMonitor`).
 */
export const detectQuality = (): QualityTier => {
  if (typeof window === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768

  if (typeof memory === 'number' && memory <= 2) return 'low'
  if (coarse || narrow) return 'low'
  if (cores <= 4) return 'low'
  if (cores <= 8) return 'medium'
  return 'high'
}

export const lowerTier = (tier: QualityTier): QualityTier =>
  ORDER[Math.max(0, ORDER.indexOf(tier) - 1)] ?? 'low'

export const raiseTier = (tier: QualityTier, ceiling: QualityTier): QualityTier => {
  const next = ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(tier) + 1)] ?? tier
  return ORDER.indexOf(next) > ORDER.indexOf(ceiling) ? ceiling : next
}

type CostVerdict = 'lower' | 'raise' | null

/**
 * Наблюдение за стоимостью кадра.
 *
 * Понижение важнее повышения, поэтому пороги несимметричны: дороже 24 мс —
 * ступень вниз почти сразу, дешевле 10 мс — вверх только после двух спокойных
 * окон подряд и не выше стартового уровня. Так сцена не начинает «дышать»
 * качеством туда-сюда на границе.
 */
export class FrameCostMonitor {
  private samples: number[] = []
  private calmWindows = 0

  constructor(
    private readonly windowSize = 90,
    private readonly expensiveMs = 24,
    private readonly cheapMs = 10,
  ) {}

  push(costMs: number): CostVerdict {
    this.samples.push(costMs)
    if (this.samples.length < this.windowSize) return null

    const average = this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length
    this.samples = []

    if (average > this.expensiveMs) {
      this.calmWindows = 0
      return 'lower'
    }
    if (average < this.cheapMs) {
      this.calmWindows += 1
      if (this.calmWindows >= 2) {
        this.calmWindows = 0
        return 'raise'
      }
      return null
    }
    this.calmWindows = 0
    return null
  }
}

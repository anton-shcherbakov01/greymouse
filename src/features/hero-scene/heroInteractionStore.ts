import type { HeroCtaTarget } from './types'

/**
 * Связь между кнопками первого экрана и сценой.
 *
 * Намеренно не React-контекст и не состояние компонента: значение читает
 * игровой цикл шестьдесят раз в секунду, а перерисовывать дерево из-за
 * наведения на кнопку не нужно. Стор модульный — он существует ровно в одном
 * экземпляре, как и первый экран.
 *
 * Альтернатива через `document.querySelector` в сцене была бы хрупкой: она
 * завязала бы шейдеры на разметку.
 */

let current: HeroCtaTarget = null
const listeners = new Set<(target: HeroCtaTarget) => void>()

export const setHeroCtaTarget = (target: HeroCtaTarget) => {
  if (current === target) return
  current = target
  listeners.forEach((listener) => listener(current))
}

export const getHeroCtaTarget = (): HeroCtaTarget => current

export const subscribeHeroCta = (listener: (target: HeroCtaTarget) => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

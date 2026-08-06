'use client'

import { ButtonLink } from '@/components/ui/Button'
import { setHeroCtaTarget } from '@/features/hero-scene/heroInteractionStore'
import type { HeroCtaTarget } from '@/features/hero-scene/types'

type Cta = { label: string; href: string } | null

type HeroCtaGroupProps = {
  primary: Cta
  secondary: Cta
}

/**
 * Кнопки первого экрана. Клиентский компонент нужен ровно за одним: сообщить
 * сцене, на какую из кнопок сейчас наведено.
 *
 * Значение уходит в модульный стор, а не в React-состояние: сцена читает его в
 * игровом цикле, и перерисовывать дерево из-за наведения незачем. Альтернатива
 * — искать кнопки из сцены через `querySelector` — привязала бы шейдеры
 * к разметке.
 *
 * Фокус с клавиатуры обрабатывается наравне с курсором: реакция сцены должна
 * быть доступна и без мыши.
 */
export const HeroCtaGroup = ({ primary, secondary }: HeroCtaGroupProps) => {
  const bind = (target: HeroCtaTarget) => ({
    onPointerEnter: () => setHeroCtaTarget(target),
    onPointerLeave: () => setHeroCtaTarget(null),
    onFocus: () => setHeroCtaTarget(target),
    onBlur: () => setHeroCtaTarget(null),
  })

  return (
    <div className="mt-9 flex flex-wrap gap-3">
      {primary && (
        <ButtonLink href={primary.href} variant="signal" size="lg" {...bind('cases')}>
          {primary.label}
        </ButtonLink>
      )}
      {secondary && (
        <ButtonLink href={secondary.href} variant="outline" size="lg" {...bind('contact')}>
          {secondary.label}
        </ButtonLink>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Задержка внутри группы, шаг задаётся токеном --stagger. */
  index?: number
  as?: ElementType
  className?: string
  id?: string
  /** Добавляет брендовую сигнальную линию поверх блока. */
  sweep?: boolean
}

/**
 * Появление блока при входе во вьюпорт.
 * Анимация выполняется CSS-переходом, JS только один раз ставит атрибут.
 * При prefers-reduced-motion наблюдатель не создаётся вовсе.
 */
export const Reveal = ({ children, index = 0, as, className, id, sweep = false }: RevealProps) => {
  const ref = useRef<HTMLElement>(null)
  const Component = (as ?? 'div') as ElementType

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      node.dataset.revealed = 'true'
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).dataset.revealed = 'true'
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Component
      ref={ref}
      id={id}
      data-reveal=""
      className={[sweep ? 'gm-signal-sweep' : '', className].filter(Boolean).join(' ')}
      style={{ '--reveal-delay': `${index * 60}ms` } as React.CSSProperties}
    >
      {children}
    </Component>
  )
}

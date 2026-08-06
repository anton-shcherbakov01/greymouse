'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

type NavItem = { id: string; label: string; href: string }

type MobileMenuProps = {
  items: NavItem[]
  cta: { label: string; href: string } | null
}

/**
 * Мобильное меню как модальный диалог: фокус запирается внутри панели,
 * Escape закрывает, при закрытии фокус возвращается на кнопку.
 */
export const MobileMenu = ({ items, cta }: MobileMenuProps) => {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [renderedPathname, setRenderedPathname] = useState(pathname)

  // Смена маршрута закрывает меню. Корректировка состояния во время рендера
  // дешевле эффекта: лишнего кадра с открытой панелью не возникает.
  if (renderedPathname !== pathname) {
    setRenderedPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      cancelAnimationFrame(raf)
      previouslyFocused?.focus?.()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] md:hidden"
      >
        <span className="relative block h-3 w-4.5" aria-hidden="true">
          <span
            className="absolute left-0 block h-px w-full bg-current transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]"
            style={{ top: open ? '50%' : 0, transform: open ? 'rotate(45deg)' : 'none' }}
          />
          <span
            className="absolute left-0 block h-px w-full bg-current transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]"
            style={{ bottom: open ? '50%' : 0, transform: open ? 'rotate(-45deg)' : 'none' }}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[var(--header-height)] bottom-0 border-t border-[var(--border)] bg-[var(--bg)] md:hidden"
            style={{ zIndex: 'var(--z-menu)' }}
          >
            <nav aria-label="Мобильная навигация" className="gm-container py-8">
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block border-b border-[var(--border)] py-4 text-[1.75rem] tracking-[var(--tracking-tight)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {cta && (
                <Link
                  href={cta.href}
                  className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-6 font-medium text-[var(--accent-fg)]"
                >
                  {cta.label}
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

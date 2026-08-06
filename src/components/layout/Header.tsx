import Link from 'next/link'

import { Wordmark } from '@/components/brand/Wordmark'
import { getNavigation } from '@/lib/queries'

import { MobileMenu } from './MobileMenu'

export const Header = async () => {
  const nav = await getNavigation()
  const items = (nav.header ?? []).map((item) => ({
    label: item.label,
    href: item.href,
    id: String(item.id ?? item.href),
  }))
  const cta = nav.headerCta?.enabled
    ? { label: nav.headerCta.label ?? 'Обсудить проект', href: nav.headerCta.href ?? '/contact' }
    : null

  return (
    <header
      className="sticky top-0 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md"
      style={{ zIndex: 'var(--z-header)' }}
    >
      <div className="gm-container flex h-[var(--header-height)] items-center justify-between gap-6">
        <Link href="/" aria-label="Серая Мышь — на главную" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Основная навигация" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="text-[0.9375rem] text-[var(--fg-muted)] transition-colors duration-[var(--dur-quick)] hover:text-[var(--fg)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {cta && (
            <Link
              href={cta.href}
              className="hidden h-9 items-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 text-[0.875rem] transition-colors duration-[var(--dur-quick)] hover:border-[var(--accent)] md:inline-flex"
            >
              {cta.label}
            </Link>
          )}
          <MobileMenu items={items} cta={cta} />
        </div>
      </div>
    </header>
  )
}

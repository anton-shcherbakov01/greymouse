import Link from 'next/link'

import { Wordmark } from '@/components/brand/Wordmark'
import { SITE_DOMAIN_DISPLAY } from '@/lib/site'
import { getNavigation, getSiteSettings } from '@/lib/queries'

export const Footer = async () => {
  const [nav, settings] = await Promise.all([getNavigation(), getSiteSettings()])
  const year = new Date().getFullYear()
  const groups = nav.footerGroups ?? []
  const socials = settings.socialLinks ?? []
  const legal = settings.legalLinks ?? []

  return (
    <footer className="gm-dark border-t border-[var(--border)] bg-[var(--bg)] text-[var(--fg)]">
      <div className="gm-container py-[var(--space-block)]">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          <div>
            <Wordmark logo={settings.logo} />
            {settings.footerText && (
              <p className="mt-4 max-w-sm text-[0.9375rem] text-[var(--fg-muted)]">
                {settings.footerText}
              </p>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="mt-6 inline-block text-[1.125rem] tracking-[var(--tracking-tight)] underline decoration-[var(--accent)] underline-offset-4"
              >
                {settings.email}
              </a>
            )}
          </div>

          {groups.map((group) => (
            <nav key={String(group.id ?? group.title)} aria-label={group.title}>
              <h2 className="gm-eyebrow">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {(group.links ?? []).map((link) => (
                  <li key={String(link.id ?? link.href)}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-[var(--fg-muted)] transition-colors duration-[var(--dur-quick)] hover:text-[var(--fg)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {socials.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((item) => (
              <li key={String(item.id ?? item.url)}>
                <a
                  href={item.url}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="text-[0.875rem] text-[var(--fg-muted)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--fg)] hover:decoration-[var(--accent)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <hr className="gm-rule my-8" />

        <div className="flex flex-col gap-4 text-[0.8125rem] text-[var(--fg-subtle)] md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {settings.legalName || settings.siteName || 'Серая Мышь'} ·{' '}
            {SITE_DOMAIN_DISPLAY}
          </p>
          {legal.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legal.map((item) => (
                <li key={String(item.id ?? item.url)}>
                  <Link href={item.url} className="transition-colors hover:text-[var(--fg)]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}

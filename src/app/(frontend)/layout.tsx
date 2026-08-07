import type { Metadata, Viewport } from 'next'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Analytics } from '@/components/layout/Analytics'
import { MouseTrailCursor } from '@/components/layout/MouseTrailCursor'
import { fontVariables } from '@/lib/fonts'
import { accentStyleSheet, deriveAccentPalette } from '@/lib/accent'
import { getSiteSettings } from '@/lib/queries'
import { absoluteUrl, SITE_URL } from '@/lib/site'

import '@/styles/globals.css'

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  const name = settings.siteName || 'Серая Мышь'
  const description =
    settings.seo?.description ||
    settings.positioning ||
    'Digital-студия «Серая Мышь»: проектируем и разрабатываем цифровые продукты.'

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.seo?.title || `${name} — digital-студия`,
      template: `%s — ${name}`,
    },
    description,
    applicationName: name,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: name,
      title: settings.seo?.title || `${name} — digital-студия`,
      description,
      url: absoluteUrl('/'),
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.seo?.title || name,
      description,
    },
    robots: {
      index: !settings.seo?.noindex,
      follow: !settings.seo?.noindex,
    },
    icons: {
      icon: [
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0c0e' },
    { media: '(prefers-color-scheme: light)', color: '#f4f4f2' },
  ],
  width: 'device-width',
  initialScale: 1,
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const settings = await getSiteSettings()
  const metrikaId =
    settings.analytics?.yandexMetrikaId || process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || ''

  /*
    Акцент из настроек подставляется переопределением базовых токенов прямо
    в документе. Сборка от него не зависит: цвет меняется в админке и
    применяется после ревалидации страницы, а не после деплоя.
  */
  const accent = deriveAccentPalette(settings.accentColor)

  return (
    <html lang="ru" className={fontVariables}>
      <head>
        <style>{accentStyleSheet(accent)}</style>
      </head>
      <body className="gm-dark min-h-dvh" data-accent={accent.signal}>
        <a className="gm-skip-link" href="#main">
          Перейти к содержимому
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <Analytics metrikaId={metrikaId} />
        <MouseTrailCursor />
      </body>
    </html>
  )
}

export default RootLayout

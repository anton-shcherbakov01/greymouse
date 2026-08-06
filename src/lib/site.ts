/**
 * Единая точка правды по адресу сайта.
 *
 * Основной домен — IDN (сераямышь.рф). В canonical, sitemap и OG нужен
 * punycode-вариант: он валиден для всех парсеров и краулеров, тогда как
 * unicode-форма в HTML-атрибутах обрабатывается непредсказуемо.
 */

import { punycodeToUnicode } from './idn'

const FALLBACK_URL = 'http://localhost:3000'

const normalise = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return FALLBACK_URL
  try {
    // `new URL` сам переводит юникодный хост в punycode.
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return `${url.protocol}//${url.host}`
  } catch {
    return FALLBACK_URL
  }
}

export const SITE_URL = normalise(process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL)

/** Человекочитаемый домен для показа пользователю (unicode-форма). */
export const SITE_DOMAIN_DISPLAY = (() => {
  try {
    const { host, hostname } = new URL(SITE_URL)
    const unicode = punycodeToUnicode(hostname)
    // Порт (если он есть) остаётся от host: в hostname его нет.
    return host === hostname ? unicode : host.replace(hostname, unicode)
  } catch {
    return 'localhost'
  }
})()

export const absoluteUrl = (path = '/'): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

export const isProductionSite = !SITE_URL.includes('localhost')

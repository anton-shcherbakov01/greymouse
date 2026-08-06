import { Inter, JetBrains_Mono, Onest } from 'next/font/google'

/**
 * Шрифты самохостятся Next во время сборки: внешних запросов в рантайме нет.
 * Кириллица подключена явно; `display: swap` + метрики фоллбэка убирают
 * сдвиг вёрстки при подмене шрифта.
 */

export const displayFont = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-onest',
  display: 'swap',
  adjustFontFallback: true,
})

export const bodyFont = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: true,
})

export const monoFont = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const fontVariables = [displayFont.variable, bodyFont.variable, monoFont.variable].join(' ')

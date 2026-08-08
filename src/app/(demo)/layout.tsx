import type { CSSProperties, ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'

import { deriveAccentPalette } from '@/lib/accent'
import { getSiteSettings } from '@/lib/queries'

import './analytics-demo.css'

export const metadata: Metadata = {
  title: 'Grey Mouse Analytics — интерактивное демо',
  description: 'Рабочее демо управленческой аналитики продаж от digital-студии «Серая Мышь».',
  robots: { index: false, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
}

const DemoLayout = async ({ children }: { children: ReactNode }) => {
  const settings = await getSiteSettings()
  const accent = deriveAccentPalette(settings.accentColor)
  const brandVariables = {
    '--gm-dashboard-brand': accent.signalDim,
    '--gm-dashboard-brand-bright': accent.signal,
    '--gm-dashboard-brand-fg': accent.accentFg,
  } as CSSProperties

  return (
    <html lang="ru" suppressHydrationWarning style={brandVariables}>
      <body>{children}</body>
    </html>
  )
}

export default DemoLayout

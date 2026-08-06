import Image from 'next/image'

import { ButtonLink } from '@/components/ui/Button'
import { HeroScene } from '@/features/hero-scene'
import type { SiteSetting } from '@/payload-types'

/**
 * Первый экран.
 *
 * Принципиально: заголовок, подзаголовок и кнопки — обычный серверный HTML.
 * Они видны до загрузки сцены, при её отказе и при отключённом JavaScript.
 * Это прямой вывод из разбора dna.inc, где контент закрыт интро-оверлеем.
 *
 * Постер тоже отрисовывается сервером и грузится с высоким приоритетом:
 * когда он лежал внутри клиентского компонента, LCP ждал загрузки бандла.
 */
export const Hero = ({ settings }: { settings: SiteSetting }) => {
  const primary = settings.primaryCta
  const secondary = settings.secondaryCta

  return (
    <section className="gm-dark relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[var(--bg)] pb-[clamp(3rem,7vh,6rem)]">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/hero-poster.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={70}
          className="object-cover"
        />
        <HeroScene />
        {/* Градиент гарантирует контраст текста при любом состоянии сцены. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--gm-ink) 60%, transparent) 0%, color-mix(in srgb, var(--gm-ink) 18%, transparent) 32%, color-mix(in srgb, var(--gm-ink) 72%, transparent) 72%, color-mix(in srgb, var(--gm-ink) 96%, transparent) 100%)',
          }}
        />
      </div>

      <div className="gm-container relative">
        <p className="gm-eyebrow">Digital-студия</p>

        <h1 className="gm-heading-hero mt-4 max-w-[14ch]">{settings.heroHeading}</h1>

        <p className="mt-6 max-w-[30ch] text-[clamp(1.125rem,2.2vw,1.75rem)] leading-[1.25] tracking-[var(--tracking-tight)] text-[var(--fg)]">
          {settings.heroSubheading}
        </p>

        {settings.heroNote && (
          <p className="mt-4 max-w-[46ch] text-[0.9375rem] text-[var(--fg-muted)]">
            {settings.heroNote}
          </p>
        )}

        <div className="mt-9 flex flex-wrap gap-3">
          {primary?.label && primary?.href && (
            <ButtonLink href={primary.href} variant="signal" size="lg">
              {primary.label}
            </ButtonLink>
          )}
          {secondary?.label && secondary?.href && (
            <ButtonLink href={secondary.href} variant="outline" size="lg">
              {secondary.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  )
}

import { Reveal } from '@/components/ui/Reveal'
import type { SiteSetting } from '@/payload-types'

export const Positioning = ({ settings }: { settings: SiteSetting }) => {
  if (!settings.positioning) return null
  const principles = settings.principles ?? []

  return (
    <section className="gm-light gm-section">
      <div className="gm-container">
        <div className="grid gap-[var(--space-stack)] md:grid-cols-12 md:gap-[var(--grid-gap)]">
          <Reveal as="div" className="md:col-span-2">
            <p className="gm-eyebrow">Как работаем</p>
          </Reveal>

          <Reveal as="div" index={1} className="md:col-span-10">
            <h2 className="gm-heading-2 max-w-[20ch] text-balance">Мыши работают тихо.</h2>
            <p className="gm-lede mt-6">{settings.positioning}</p>
          </Reveal>
        </div>

        {principles.length > 0 && (
          <ul className="mt-[var(--space-block)] grid gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle, index) => (
              <Reveal
                as="li"
                key={String(principle.id ?? principle.title)}
                index={index}
                sweep
                className="border-t border-[var(--border)] pt-5"
              >
                <h3 className="text-[1.0625rem] font-medium tracking-[var(--tracking-tight)]">
                  {principle.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] text-[var(--fg-muted)]">{principle.text}</p>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

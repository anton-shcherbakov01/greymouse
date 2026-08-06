import { Reveal } from '@/components/ui/Reveal'
import type { SiteSetting } from '@/payload-types'

export const Positioning = ({ settings }: { settings: SiteSetting }) => {
  if (!settings.positioning) return null
  const principles = settings.principles ?? []

  return (
    <section className="gm-light gm-section">
      <div className="gm-container">
        {/* Асимметрия «крупное утверждение слева + плотный текст справа»
            — приём, снятый со страницы услуг lightbase. */}
        <div className="grid gap-[var(--space-stack)] md:grid-cols-12 md:gap-[var(--grid-gap)]">
          <Reveal as="div" className="md:col-span-2">
            {/* Надзаголовок и есть заголовок секции: иначе h1 → h3 идёт с пропуском уровня. */}
            <h2 className="gm-eyebrow">Кто мы</h2>
          </Reveal>

          <Reveal as="div" index={1} className="md:col-span-10">
            <p className="gm-heading-2 max-w-[22ch] text-balance">{settings.positioning}</p>
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

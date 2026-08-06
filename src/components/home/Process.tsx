import { Reveal } from '@/components/ui/Reveal'
import type { SiteSetting } from '@/payload-types'

export const Process = ({ settings }: { settings: SiteSetting }) => {
  const steps = settings.processSteps ?? []
  if (steps.length === 0) return null

  return (
    <section className="gm-dark gm-section">
      <div className="gm-container">
        <p className="gm-eyebrow">Как работаем</p>
        <h2 className="gm-heading-1 mt-3 max-w-[16ch]">Процесс без сюрпризов</h2>

        <ol className="mt-[var(--space-block)] grid gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal
              as="li"
              key={String(step.id ?? step.title)}
              index={index}
              sweep
              className="border-t border-[var(--border)] pt-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[0.8125rem] text-[var(--accent)] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step.duration && (
                  <span className="font-mono text-[0.75rem] text-[var(--fg-subtle)]">
                    {step.duration}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-[1.0625rem] font-medium tracking-[var(--tracking-tight)]">
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] text-[var(--fg-muted)]">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

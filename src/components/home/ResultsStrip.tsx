import { Reveal } from '@/components/ui/Reveal'
import type { Case } from '@/payload-types'

type Metric = { value: string; label: string; source?: string | null; caseTitle: string }

/**
 * Секция измеримых результатов рендерится **только** если в CMS есть реальные
 * метрики опубликованных кейсов. Никаких заготовленных цифр в коде нет.
 */
export const ResultsStrip = ({ cases }: { cases: Case[] }) => {
  const metrics: Metric[] = cases.flatMap((caseItem) =>
    (caseItem.metrics ?? []).slice(0, 2).map((metric) => ({
      value: metric.value,
      label: metric.label,
      source: metric.source,
      caseTitle: caseItem.title,
    })),
  )

  if (metrics.length === 0) return null

  return (
    <section className="gm-light gm-section">
      <div className="gm-container">
        <p className="gm-eyebrow">Результаты</p>
        <h2 className="gm-heading-2 mt-3 max-w-[20ch]">Что изменилось у клиентов</h2>

        <ul className="mt-[var(--space-block)] grid gap-x-[var(--grid-gap)] gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.slice(0, 8).map((metric, index) => (
            <Reveal
              as="li"
              key={`${metric.caseTitle}-${metric.label}`}
              index={index}
              className="border-t border-[var(--border)] pt-5"
            >
              <p className="text-[clamp(2rem,3.5vw,3rem)] leading-none tracking-[var(--tracking-display)] tabular-nums">
                {metric.value}
              </p>
              <p className="mt-3 text-[0.9375rem]">{metric.label}</p>
              <p className="mt-1 font-mono text-[0.6875rem] text-[var(--fg-subtle)]">
                {metric.caseTitle}
                {metric.source ? ` · ${metric.source}` : ''}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

import Link from 'next/link'

import { ServiceIcon } from '@/components/ui/ServiceIcon'
import { Reveal } from '@/components/ui/Reveal'
import { STAGE_LABELS, groupServicesByStage } from '@/lib/services'
import type { Service } from '@/payload-types'

export const ServicesOverview = ({ services }: { services: Service[] }) => {
  if (services.length === 0) return null
  const grouped = groupServicesByStage(services)

  return (
    <section className="gm-light gm-section">
      <div className="gm-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="gm-eyebrow">Что делаем</p>
            <h2 className="gm-heading-1 mt-3">Услуги</h2>
          </div>
          <Link
            href="/services"
            className="text-[0.9375rem] underline decoration-[var(--accent)] underline-offset-4"
          >
            Подробно об услугах
          </Link>
        </div>

        <ol className="mt-[var(--space-block)] flex flex-col">
          {grouped.map(([stage, items], stageIndex) => (
            <Reveal
              as="li"
              key={stage}
              index={stageIndex}
              className="border-t border-[var(--border)] py-8 last:border-b"
            >
              <div className="grid gap-4 md:grid-cols-12 md:gap-[var(--grid-gap)]">
                <div className="flex items-start gap-4 md:col-span-4">
                  <span className="font-mono text-[0.8125rem] text-[var(--fg-subtle)] tabular-nums">
                    {String(stageIndex + 1).padStart(2, '0')}
                  </span>
                  <h3 className="gm-heading-3">{STAGE_LABELS[stage]}</h3>
                </div>

                <ul className="md:col-span-8 md:grid md:grid-cols-2 md:gap-x-[var(--grid-gap)]">
                  {items.map((service) => (
                    <li key={service.id} className="py-2">
                      <Link
                        href={`/services#${service.slug}`}
                        className="group flex items-start gap-3"
                      >
                        <ServiceIcon
                          name={service.icon}
                          className="mt-1 shrink-0 text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--accent)]"
                        />
                        <span>
                          <span className="font-medium">{service.title}</span>
                          <span className="mt-0.5 block text-[0.875rem] text-[var(--fg-muted)]">
                            {service.promise}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

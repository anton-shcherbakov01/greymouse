import Link from 'next/link'

import { ServiceCard } from '@/components/services/ServiceCard'
import { Reveal } from '@/components/ui/Reveal'
import { sortServices } from '@/lib/services'
import type { Service } from '@/payload-types'

export const ServicesOverview = ({ services }: { services: Service[] }) => {
  if (services.length === 0) return null
  const ordered = sortServices(services)

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

        {/*
          Сетка по три в ряд: все услуги видны одним взглядом. Разбивка по
          этапам давала по одному пункту в секции — казалось, что услуга одна.
        */}
        <ul className="mt-[var(--space-block)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((service, index) => (
            <Reveal as="li" key={service.id} index={index} className="h-full">
              <ServiceCard
                service={service}
                index={index}
                href={`/services#${service.slug}`}
                action="Смотреть"
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

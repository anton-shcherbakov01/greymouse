import type { Metadata } from 'next'
import Link from 'next/link'

import { hasRichTextContent, RichText } from '@/components/blocks/RichText'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ServiceIcon } from '@/components/ui/ServiceIcon'
import { sortServices } from '@/lib/services'
import { getPublishedServices, getSiteSettings } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'
import type { Service } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Услуги',
  description:
    'Что делает студия «Серая Мышь»: исследование, дизайн, разработка, запуск и развитие продукта.',
  alternates: { canonical: absoluteUrl('/services') },
}

const ServicesPage = async () => {
  const [services, settings] = await Promise.all([getPublishedServices(), getSiteSettings()])
  const ordered = sortServices(services)

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Главная', path: '/' },
          { name: 'Услуги', path: '/services' },
        ]}
      />

      <section className="gm-dark gm-section">
        <div className="gm-container">
          <p className="gm-eyebrow">Услуги</p>
          <div className="mt-4 grid gap-6 md:grid-cols-12 md:gap-[var(--grid-gap)]">
            <h1 className="gm-heading-1 md:col-span-6">Что мы делаем</h1>
            <p className="gm-lede md:col-span-6 md:self-end">
              Ниже — всё, чем занимаемся. Услуги можно брать целиком или подключаться к одной
              задаче.
            </p>
          </div>
        </div>
      </section>

      {ordered.length === 0 ? (
        <section className="gm-light gm-section">
          <div className="gm-container">
            <p className="gm-heading-3">Услуги пока не заполнены</p>
            <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">
              Добавьте услуги в админке — они появятся здесь автоматически.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/*
            Сетка-обзор: все услуги видны сразу, по три в ряд. Прежняя разбивка
            по этапам давала секции на одну карточку, и наличие остальных
            пунктов было неочевидно. Карточки ведут к полному описанию ниже.
          */}
          <section className="gm-light gm-section">
            <div className="gm-container">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ordered.map((service, index) => (
                  <ServiceCard key={service.id} service={service} index={index} />
                ))}
              </div>
            </div>
          </section>

          <section className="gm-dark gm-section">
            <div className="gm-container">
              <h2 className="gm-heading-2">Подробно</h2>
              <div className="mt-[var(--space-block)] flex flex-col gap-[var(--space-block)]">
                {ordered.map((service, index) => (
                  <ServiceEntry key={service.id} service={service} index={index} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="gm-dark gm-section">
        <div className="gm-container border-t border-[var(--border)] pt-10">
          <h2 className="gm-heading-2 max-w-[16ch]">
            {settings.contactHeading || 'Расскажите про задачу'}
          </h2>
          <div className="mt-8">
            <ButtonLink href="/contact" variant="signal" size="lg">
              Обсудить проект
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}

/** Компактная карточка для сетки-обзора: знак, название, обещание, ссылка вниз. */
const ServiceCard = ({ service, index }: { service: Service; index: number }) => (
  <Reveal as="div" index={index} className="h-full">
    <Link
      href={`#${service.slug}`}
      className="group flex h-full flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] p-6 transition-colors duration-[var(--dur-quick)] hover:border-[var(--accent)]"
    >
      <ServiceIcon name={service.icon} className="shrink-0 text-[var(--accent)]" />
      <span className="mt-4 block text-[1.25rem] font-medium tracking-[var(--tracking-tight)]">
        {service.title}
      </span>
      <span className="mt-3 block text-[0.9375rem] text-[var(--fg-muted)]">{service.promise}</span>
      <span className="mt-auto block pt-5 text-[0.8125rem] text-[var(--fg-subtle)] transition-colors duration-[var(--dur-quick)] group-hover:text-[var(--accent)]">
        Подробнее ↓
      </span>
    </Link>
  </Reveal>
)

const ServiceEntry = ({ service, index }: { service: Service; index: number }) => {
  const relatedCases = (service.relatedCases ?? []).filter(
    (item): item is Extract<typeof item, object> => typeof item === 'object' && item !== null,
  )

  return (
    <Reveal
      as="article"
      id={service.slug}
      index={index}
      className="scroll-mt-[calc(var(--header-height)+2rem)] border-t border-[var(--border)] pt-8"
    >
      <div className="grid gap-8 md:grid-cols-12 md:gap-[var(--grid-gap)]">
        <div className="md:col-span-5">
          <div className="flex items-start gap-3">
            <ServiceIcon name={service.icon} className="mt-1.5 shrink-0 text-[var(--accent)]" />
            <h3 className="gm-heading-3">{service.title}</h3>
          </div>
          <p className="mt-4 text-[1.0625rem] text-[var(--fg)]">{service.promise}</p>
          {service.shortDescription && (
            <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">
              {service.shortDescription}
            </p>
          )}
        </div>

        <div className="md:col-span-7">
          {hasRichTextContent(service.fullDescription) && (
            <RichText data={service.fullDescription} className="mb-8" />
          )}

          <div className="grid gap-8 sm:grid-cols-2">
            <ServiceList
              title="С чем приходят"
              items={(service.clientProblems ?? []).map((i) => i.text)}
            />
            <ServiceList title="Состав работ" items={(service.scope ?? []).map((i) => i.text)} />
          </div>

          {(service.deliverables ?? []).length > 0 && (
            <div className="mt-8">
              <h4 className="gm-eyebrow">Что получаете</h4>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(service.deliverables ?? []).map((item, itemIndex) => (
                  <li
                    key={String(item.id ?? itemIndex)}
                    className="rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-[0.8125rem]"
                    title={item.note ?? undefined}
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relatedCases.length > 0 && (
            <div className="mt-8">
              <h4 className="gm-eyebrow">Кейсы</h4>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {relatedCases.map((relatedCase) => (
                  <li key={relatedCase.id}>
                    <Link
                      href={`/cases/${relatedCase.slug}`}
                      className="text-[0.9375rem] underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
                    >
                      {relatedCase.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.ctaLabel && service.ctaHref && (
            <div className="mt-8">
              <ButtonLink href={service.ctaHref} variant="outline">
                {service.ctaLabel}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  )
}

const ServiceList = ({ title, items }: { title: string; items: string[] }) => {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className="gm-eyebrow">{title}</h4>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.9375rem] text-[var(--fg-muted)]">
            <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-[var(--accent)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ServicesPage

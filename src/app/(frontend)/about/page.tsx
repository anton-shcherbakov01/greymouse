import type { Metadata } from 'next'

import { Founders } from '@/components/home/Founders'
import { Process } from '@/components/home/Process'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { sortServices } from '@/lib/services'
import { getPublishedServices, getSiteSettings, getTeam } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'О студии',
  description: 'Как устроена студия «Серая Мышь»: принципы работы, компетенции и люди.',
  alternates: { canonical: absoluteUrl('/about') },
}

const AboutPage = async () => {
  const [settings, team, services] = await Promise.all([
    getSiteSettings(),
    getTeam(),
    getPublishedServices(),
  ])
  const principles = settings.principles ?? []
  const competencies = sortServices(services)

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Главная', path: '/' },
          { name: 'О студии', path: '/about' },
        ]}
      />

      <section className="gm-dark gm-section">
        <div className="gm-container">
          <p className="gm-eyebrow">О студии</p>
          <h1 className="gm-heading-1 mt-4 max-w-[16ch]">Тихо, внимательно и до результата</h1>
          {settings.positioning && <p className="gm-lede mt-8">{settings.positioning}</p>}
        </div>
      </section>

      {principles.length > 0 && (
        <section className="gm-light gm-section">
          <div className="gm-container">
            <h2 className="gm-heading-2 max-w-[16ch]">Как мы работаем</h2>
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
          </div>
        </section>
      )}

      <Founders people={team} heading="Основатели" eyebrow="Люди" extended />

      {competencies.length > 0 && (
        <section className="gm-dark gm-section">
          <div className="gm-container">
            <h2 className="gm-heading-2 max-w-[16ch]">Компетенции</h2>
            <dl className="mt-[var(--space-block)] flex flex-col">
              {competencies.map((service, index) => (
                <Reveal
                  as="div"
                  key={service.id}
                  index={index}
                  className="grid gap-3 border-t border-[var(--border)] py-6 last:border-b md:grid-cols-12 md:gap-[var(--grid-gap)]"
                >
                  <dt className="gm-heading-3 md:col-span-4">{service.title}</dt>
                  <dd className="text-[0.9375rem] text-[var(--fg-muted)] md:col-span-8">
                    {service.promise}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      <Process settings={settings} />

      <section className="gm-light gm-section">
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

export default AboutPage

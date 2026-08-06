import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CaseBlocks } from '@/components/blocks/CaseBlocks'
import { hasRichTextContent, RichText } from '@/components/blocks/RichText'
import { BreadcrumbSchema, CaseSchema } from '@/components/seo/StructuredData'
import { ButtonLink } from '@/components/ui/Button'
import { MediaImage, resolveMedia } from '@/components/ui/MediaImage'
import { Reveal } from '@/components/ui/Reveal'
import { getCaseBySlug, getPublishedCases } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'
import type { Case } from '@/payload-types'

type PageProps = { params: Promise<{ slug: string }> }

export const generateStaticParams = async () => {
  const cases = await getPublishedCases()
  return cases.map((caseItem) => ({ slug: caseItem.slug }))
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params
  const caseItem = await getCaseBySlug(slug)
  if (!caseItem) return { title: 'Кейс не найден' }

  const seoImage = resolveMedia(caseItem.seo?.image) ?? resolveMedia(caseItem.cover)
  const description = caseItem.seo?.description || caseItem.shortDescription
  const url = absoluteUrl(`/cases/${caseItem.slug}`)

  return {
    title: caseItem.seo?.title || caseItem.title,
    description,
    alternates: { canonical: url },
    robots: caseItem.seo?.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title: caseItem.seo?.title || caseItem.title,
      description,
      url,
      images: seoImage?.url ? [{ url: seoImage.url, alt: seoImage.alt ?? caseItem.title }] : undefined,
    },
  }
}

const CasePage = async ({ params }: PageProps) => {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()
  const caseItem = await getCaseBySlug(slug, isDraft)

  if (!caseItem) notFound()

  const hero = resolveMedia(caseItem.heroMedia) ?? resolveMedia(caseItem.cover)
  const services = relationTitles(caseItem.services)
  const nextCase = await resolveNextCase(caseItem)

  return (
    <>
      <CaseSchema caseItem={caseItem} />
      <BreadcrumbSchema
        items={[
          { name: 'Главная', path: '/' },
          { name: 'Кейсы', path: '/cases' },
          { name: caseItem.title, path: `/cases/${caseItem.slug}` },
        ]}
      />

      {isDraft && (
        <div className="bg-[var(--gm-signal)] px-4 py-2 text-center text-[0.8125rem] font-medium text-[var(--gm-ink)]">
          Предпросмотр черновика. Эта версия не опубликована.{' '}
          <a href="/preview/exit" className="underline">
            Выйти из предпросмотра
          </a>
        </div>
      )}

      <article className="gm-dark bg-[var(--bg)]">
        <header className="gm-container pt-[var(--space-block)] pb-[var(--space-stack)]">
          <nav aria-label="Хлебные крошки" className="gm-eyebrow">
            <Link href="/cases" className="hover:text-[var(--fg)]">
              Кейсы
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{caseItem.client}</span>
          </nav>

          <h1 className="gm-heading-1 mt-5 max-w-[18ch]">{caseItem.title}</h1>
          <p className="gm-lede mt-6">{caseItem.shortDescription}</p>

          <dl className="mt-10 grid gap-x-[var(--grid-gap)] gap-y-6 border-t border-[var(--border)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Клиент" value={caseItem.client} />
            <MetaItem label="Год" value={String(caseItem.year)} />
            {services.length > 0 && <MetaItem label="Услуги" value={services.join(', ')} />}
            {caseItem.externalUrl && (
              <div>
                <dt className="gm-eyebrow">Проект</dt>
                <dd className="mt-2 text-[0.9375rem]">
                  <a
                    href={caseItem.externalUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                    className="underline decoration-[var(--accent)] underline-offset-4"
                  >
                    Открыть
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </header>

        {hero && (
          <div className="mt-[var(--space-stack)]">
            <MediaImage media={hero} aspect="16 / 9" sizes="100vw" priority />
          </div>
        )}

        <div className="py-[var(--space-section)]">
          <div className="flex flex-col gap-[var(--space-block)]">
            <NarrativeSection title="Задача" content={caseItem.challenge} />
            <NarrativeSection title="Контекст" content={caseItem.context} />
            <NarrativeSection title="Решение" content={caseItem.solution} />
            <NarrativeSection title="Процесс" content={caseItem.process} />

            <CaseBlocks blocks={caseItem.contentBlocks} />

            <NarrativeSection title="Результат" content={caseItem.results} />

            {(caseItem.metrics ?? []).length > 0 && (
              <Reveal className="gm-container">
                <h2 className="gm-heading-3 mb-8">Измеримые показатели</h2>
                <ul className="grid gap-x-[var(--grid-gap)] gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {(caseItem.metrics ?? []).map((metric, index) => (
                    <li
                      key={String(metric.id ?? index)}
                      className="border-t border-[var(--border)] pt-5"
                    >
                      <p className="text-[clamp(2rem,3.5vw,3rem)] leading-none tracking-[var(--tracking-display)] tabular-nums">
                        {metric.value}
                      </p>
                      <p className="mt-3 text-[0.9375rem]">{metric.label}</p>
                      {metric.source && (
                        <p className="mt-1 font-mono text-[0.6875rem] text-[var(--fg-subtle)]">
                          {metric.source}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {caseItem.testimonial?.quote && (
              <Reveal className="gm-container">
                <blockquote className="mx-auto max-w-[40ch] border-l-2 border-[var(--accent)] pl-6">
                  <p className="gm-heading-3 text-balance">«{caseItem.testimonial.quote}»</p>
                  {(caseItem.testimonial.author || caseItem.testimonial.role) && (
                    <footer className="mt-4 text-[0.875rem] text-[var(--fg-muted)]">
                      {caseItem.testimonial.author}
                      {caseItem.testimonial.role ? `, ${caseItem.testimonial.role}` : ''}
                    </footer>
                  )}
                </blockquote>
              </Reveal>
            )}

            {(caseItem.projectTeam ?? []).length > 0 && (
              <Reveal className="gm-container">
                <h2 className="gm-heading-3 mb-6">Команда проекта</h2>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(caseItem.projectTeam ?? []).map((member, index) => {
                    const person = member.person
                    const name =
                      person && typeof person === 'object' ? person.name : member.externalName
                    if (!name) return null
                    return (
                      <li
                        key={String(member.id ?? index)}
                        className="border-t border-[var(--border)] pt-4"
                      >
                        <p className="text-[0.9375rem] font-medium">{name}</p>
                        <p className="gm-eyebrow mt-1">{member.role}</p>
                      </li>
                    )
                  })}
                </ul>
              </Reveal>
            )}
          </div>
        </div>

        <div className="gm-container pb-[var(--space-section)]">
          <div className="border-t border-[var(--border)] pt-10">
            {nextCase ? (
              <Link href={`/cases/${nextCase.slug}`} className="group block">
                <p className="gm-eyebrow">Следующий проект</p>
                <h2 className="gm-heading-1 mt-3 transition-colors group-hover:text-[var(--accent)]">
                  {nextCase.title}
                </h2>
              </Link>
            ) : (
              <p className="gm-eyebrow">Это последний опубликованный кейс</p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="signal" size="lg">
                Обсудить проект
              </ButtonLink>
              <ButtonLink href="/cases" variant="outline" size="lg">
                Все кейсы
              </ButtonLink>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}

const MetaItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="gm-eyebrow">{label}</dt>
    <dd className="mt-2 text-[0.9375rem]">{value}</dd>
  </div>
)

const NarrativeSection = ({ title, content }: { title: string; content: unknown }) => {
  if (!hasRichTextContent(content)) return null

  return (
    <Reveal className="gm-container">
      <div className="grid gap-6 md:grid-cols-12 md:gap-[var(--grid-gap)]">
        <h2 className="gm-eyebrow md:col-span-3 md:pt-2">{title}</h2>
        <div className="md:col-span-9">
          <RichText data={content} />
        </div>
      </div>
    </Reveal>
  )
}

const relationTitles = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (item && typeof item === 'object' && 'title' in item ? String(item.title) : null))
    .filter((title): title is string => Boolean(title))
}

/** Явно выбранный связанный кейс, иначе следующий по порядку сортировки. */
const resolveNextCase = async (current: Case): Promise<Case | null> => {
  if (current.relatedCase && typeof current.relatedCase === 'object') {
    return current.relatedCase
  }

  const cases = await getPublishedCases()
  const index = cases.findIndex((item) => item.id === current.id)
  if (index === -1 || cases.length < 2) return null
  return cases[(index + 1) % cases.length] ?? null
}

export default CasePage

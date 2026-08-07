import Link from 'next/link'

import { MediaImage } from '@/components/ui/MediaImage'
import type { Case } from '@/payload-types'

type CaseCardProps = {
  caseItem: Case
  /** Крупная карточка занимает всю ширину колонки на десктопе. */
  large?: boolean
  priority?: boolean
  /**
   * Уровень заголовка карточки. На странице кейсов список идёт сразу после h1,
   * поэтому там нужен h2; внутри секций с собственным h2 — h3.
   */
  headingLevel?: 2 | 3
}

export const CaseCard = ({
  caseItem,
  large = false,
  priority = false,
  headingLevel = 3,
}: CaseCardProps) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const tags = (caseItem.tags ?? []).map((tag) => tag.label).filter(Boolean)

  return (
    <article className="group">
      {/* aria-label не задаём: видимого текста карточки достаточно,
          а несовпадение подписи и содержимого ломает доступное имя ссылки. */}
      <Link href={`/cases/${caseItem.slug}`} className="block focus-visible:outline-offset-6">
        <div className="gm-case-burrow">
          <MediaImage
            media={caseItem.cover}
            aspect={large ? '16 / 10' : '4 / 3'}
            sizes={
              large
                ? '(max-width: 768px) 100vw, (max-width: 1440px) 66vw, 900px'
                : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px'
            }
            priority={priority}
            className="gm-case-burrow__image"
          />
          <span className="gm-case-burrow__panel gm-case-burrow__panel--top" aria-hidden="true" />
          <span
            className="gm-case-burrow__panel gm-case-burrow__panel--bottom"
            aria-hidden="true"
          />
          <span className="gm-case-burrow__label gm-eyebrow" aria-hidden="true">
            {caseItem.client} / открыть кейс
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="gm-eyebrow">
            {caseItem.client} · {caseItem.year}
          </div>
          {caseItem.shortResult && (
            <span className="rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1 font-mono text-[0.75rem] text-[var(--fg-muted)] transition-colors duration-[var(--dur-quick)] group-hover:border-[var(--accent)] group-hover:text-[var(--fg)]">
              {caseItem.shortResult}
            </span>
          )}
        </div>

        <Heading
          className={`mt-2 tracking-[var(--tracking-display)] ${large ? 'gm-heading-2' : 'gm-heading-3'}`}
        >
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-[var(--dur-base)] ease-[var(--ease-out)] group-hover:bg-[length:100%_1px]">
            {caseItem.title}
          </span>
        </Heading>

        <p className="mt-2 max-w-prose text-[0.9375rem] text-[var(--fg-muted)]">
          {caseItem.shortDescription}
        </p>

        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Теги проекта">
            {tags.map((tag) => (
              <li
                key={tag}
                className="font-mono text-[0.6875rem] tracking-[0.06em] text-[var(--fg-subtle)] uppercase"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </article>
  )
}

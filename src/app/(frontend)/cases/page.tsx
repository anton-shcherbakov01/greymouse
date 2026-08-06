import type { Metadata } from 'next'

import { CaseCard } from '@/components/cases/CaseCard'
import { CaseFilterBar } from '@/components/cases/CaseFilterBar'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { filterCases, parseFilters } from '@/lib/case-filters'
import { getCategories, getPublishedCases, getPublishedServices } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Кейсы',
  description:
    'Проекты студии «Серая Мышь»: что было до, что сделали и что изменилось после запуска.',
  alternates: { canonical: absoluteUrl('/cases') },
  openGraph: {
    title: 'Кейсы — Серая Мышь',
    description: 'Проекты студии: задача, решение и измеримый результат.',
    url: absoluteUrl('/cases'),
  },
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Фильтрация выполняется на сервере по параметрам адреса.
 *
 * Клиентский вариант (useSearchParams внутри Suspense) вызывал bailout из SSR:
 * список подставлялся уже после гидратации и давал сдвиг вёрстки CLS ≈ 0.3.
 * Серверный рендер решает это и заодно делает фильтры работающими без JS.
 */
const CasesPage = async ({ searchParams }: PageProps) => {
  const rawParams = await searchParams
  const normalised = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  )
  const filters = parseFilters(normalised)

  const [cases, categories, services] = await Promise.all([
    getPublishedCases(),
    getCategories(),
    getPublishedServices(),
  ])

  const visible = filterCases(cases, filters)
  // Ключ меняется вместе с фильтром — React пересоздаёт список,
  // и CSS-анимация появления проигрывается заново.
  const listKey = `${filters.category ?? ''}|${filters.service ?? ''}|${filters.query}`

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Главная', path: '/' },
          { name: 'Кейсы', path: '/cases' },
        ]}
      />

      <section className="gm-dark gm-section">
        <div className="gm-container">
          <p className="gm-eyebrow">Работы</p>
          <div className="mt-4 grid gap-6 md:grid-cols-12 md:gap-[var(--grid-gap)]">
            <h1 className="gm-heading-1 md:col-span-7">Что мы сделали</h1>
            <p className="gm-lede md:col-span-5 md:self-end">
              Каждый кейс — про конкретную задачу и про то, что изменилось после запуска.
              Цифры приводим только там, где их действительно измеряли.
            </p>
          </div>

          <div className="mt-[var(--space-block)]">
            {cases.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] px-6 py-16 text-center">
                <p className="gm-heading-3">Кейсы скоро появятся</p>
                <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">
                  Опубликуйте первый кейс в админке — он появится здесь автоматически.
                </p>
              </div>
            ) : (
              <>
                <CaseFilterBar
                  filters={filters}
                  categories={categories.map(({ id, title, slug }) => ({ id, title, slug }))}
                  services={services.map(({ id, title, slug }) => ({ id, title, slug }))}
                />

                <p
                  aria-live="polite"
                  className="mt-5 font-mono text-[0.75rem] text-[var(--fg-subtle)]"
                >
                  {visible.length === 0
                    ? 'Ничего не найдено'
                    : `Показано: ${visible.length} из ${cases.length}`}
                </p>

                {visible.length === 0 ? (
                  <div className="mt-10 border border-dashed border-[var(--border)] px-6 py-16 text-center">
                    <p className="gm-heading-3">Под эти условия кейсов нет</p>
                    <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">
                      Попробуйте снять один из фильтров или очистить поиск.
                    </p>
                  </div>
                ) : (
                  <ul
                    key={listKey}
                    className="gm-case-grid mt-10 grid gap-x-[var(--grid-gap)] gap-y-14 md:grid-cols-2"
                  >
                    {visible.map((caseItem, index) => (
                      <li key={caseItem.id} style={{ '--i': index } as React.CSSProperties}>
                        <CaseCard caseItem={caseItem} priority={index < 2} headingLevel={2} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default CasesPage

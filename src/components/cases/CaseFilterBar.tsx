import Link from 'next/link'

import { serialiseFilters, type CaseFilterState } from '@/lib/case-filters'
import type { Category, Service } from '@/payload-types'

import { CaseSearchField } from './CaseSearchField'

type Option = { value: string; label: string }

type CaseFilterBarProps = {
  filters: CaseFilterState
  categories: Pick<Category, 'id' | 'title' | 'slug'>[]
  services: Pick<Service, 'id' | 'title' | 'slug'>[]
}

/**
 * Панель фильтров рендерится сервером, а сами фильтры — обычные ссылки.
 *
 * Это даёт три вещи разом: работу без JavaScript, нативную клавиатурную
 * навигацию и отсутствие сдвига вёрстки (клиентский вариант с useSearchParams
 * вызывал bailout из SSR и давал CLS ≈ 0.3).
 */
export const CaseFilterBar = ({ filters, categories, services }: CaseFilterBarProps) => (
  <div className="border-y border-[var(--border)] py-6">
    <div className="flex flex-col gap-5">
      <FilterRow
        label="Категории"
        paramKey="category"
        filters={filters}
        active={filters.category}
        options={categories.map((item) => ({ value: item.slug, label: item.title }))}
      />
      <FilterRow
        label="Услуги"
        paramKey="service"
        filters={filters}
        active={filters.service}
        options={services.map((item) => ({ value: item.slug, label: item.title }))}
      />

      <div className="flex flex-wrap items-center gap-4">
        <CaseSearchField filters={filters} />
        {(filters.category || filters.service || filters.query) && (
          <Link
            href="/cases"
            scroll={false}
            className="text-[0.875rem] text-[var(--fg-muted)] underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--fg)] hover:decoration-[var(--accent)]"
          >
            Сбросить
          </Link>
        )}
      </div>
    </div>
  </div>
)

const FilterRow = ({
  label,
  paramKey,
  options,
  active,
  filters,
}: {
  label: string
  paramKey: 'category' | 'service'
  options: Option[]
  active: string | null
  filters: CaseFilterState
}) => {
  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <span className="gm-eyebrow w-24 shrink-0">{label}</span>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Chip href={`/cases${serialiseFilters({ ...filters, [paramKey]: null })}`} active={active === null}>
            Все
          </Chip>
        </li>
        {options.map((option) => {
          const isActive = active === option.value
          const next = serialiseFilters({
            ...filters,
            [paramKey]: isActive ? null : option.value,
          })
          return (
            <li key={option.value}>
              <Chip href={`/cases${next}`} active={isActive}>
                {option.label}
              </Chip>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Chip = ({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) => (
  <Link
    href={href}
    scroll={false}
    aria-current={active ? 'true' : undefined}
    className={`inline-block rounded-[var(--radius-pill)] border px-3.5 py-1.5 text-[0.8125rem] transition-colors duration-[var(--dur-quick)] ${
      active
        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
        : 'border-[var(--border)] text-[var(--fg-muted)] hover:border-[var(--fg-subtle)] hover:text-[var(--fg)]'
    }`}
  >
    {children}
  </Link>
)

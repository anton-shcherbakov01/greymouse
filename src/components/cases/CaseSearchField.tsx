'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

import { serialiseFilters, type CaseFilterState } from '@/lib/case-filters'

/**
 * Единственная интерактивная часть панели фильтров.
 * Всё остальное — обычные ссылки, поэтому фильтрация работает и без JS.
 */
export const CaseSearchField = ({ filters }: { filters: CaseFilterState }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchId = useId()
  const [query, setQuery] = useState(filters.query)
  const [renderedQuery, setRenderedQuery] = useState(filters.query)

  // Внешнее изменение адреса («назад», сброс) подхватывается полем.
  if (renderedQuery !== filters.query) {
    setRenderedQuery(filters.query)
    setQuery(filters.query)
  }

  // Ввод не должен создавать запись в истории на каждый символ.
  useEffect(() => {
    if (query === filters.query) return
    const timer = setTimeout(() => {
      router.replace(`${pathname}${serialiseFilters({ ...filters, query })}`, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [query, filters, pathname, router])

  return (
    <div className="flex min-w-[16rem] flex-1 items-center gap-2 border-b border-[var(--border)] pb-2 focus-within:border-[var(--accent)]">
      <label htmlFor={searchId} className="gm-eyebrow shrink-0">
        Поиск
      </label>
      <input
        id={searchId}
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Название, клиент, тег"
        className="w-full bg-transparent py-1 text-[0.9375rem] outline-none placeholder:text-[var(--fg-subtle)]"
      />
    </div>
  )
}

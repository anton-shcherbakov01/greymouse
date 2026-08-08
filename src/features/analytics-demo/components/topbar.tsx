'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Menu,
  Moon,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react'

export interface TopbarOption {
  value: string
  label: string
}

export interface TopbarFilterState {
  period: string
  compare: 'previous' | 'none'
  team: string
  manager: string
}

export function Topbar({
  title,
  subtitle,
  company,
  loading,
  dark,
  onRefresh,
  onTheme,
  onMenu,
  menuOpen,
  filters,
  periodOptions = [],
  teamOptions = [],
  managerOptions = [],
  comparisonLabel = 'прошлый период',
  lastSync = '09:42',
  onFilterChange,
}: {
  title: string
  subtitle: string
  company?: string
  loading: boolean
  dark: boolean
  onRefresh: () => void
  onTheme: () => void
  onMenu: () => void
  menuOpen: boolean
  filters: TopbarFilterState
  periodOptions: TopbarOption[]
  teamOptions: TopbarOption[]
  managerOptions: TopbarOption[]
  comparisonLabel?: string
  lastSync?: string
  onFilterChange: (key: keyof TopbarFilterState, value: string) => void
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterSheetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!filtersOpen) return
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusableSelector =
      "button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
    const focusable = () =>
      Array.from(filterSheetRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
    const frame = window.requestAnimationFrame(() => focusable()[0]?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setFiltersOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [filtersOpen])

  return (
    <>
      <header className="topbar">
        <div className="topbar-title">
          <button
            className="icon-button mobile-menu"
            onClick={onMenu}
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
          >
            <Menu size={19} />
          </button>
          <div>
            <div className="title-line">
              <h1>{title}</h1>
              {company ? <span className="company-label">{company}</span> : null}
            </div>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="topbar-controls">
          <label className="select-control date-control">
            <span className="sr-only">Период отчёта</span>
            <CalendarDays size={15} aria-hidden="true" />
            <select
              value={filters.period}
              onChange={(event) => onFilterChange('period', event.target.value)}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className="select-control select-control--compare">
            <span className="sr-only">Период сравнения</span>
            <select
              value={filters.compare}
              onChange={(event) => onFilterChange('compare', event.target.value)}
            >
              <option value="previous">Сравнить: {comparisonLabel.toLowerCase()}</option>
              <option value="none">Без сравнения</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className="select-control select-control--team">
            <span className="sr-only">Подразделение</span>
            <select
              value={filters.team}
              onChange={(event) => onFilterChange('team', event.target.value)}
            >
              {teamOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className="select-control select-control--manager">
            <span className="sr-only">Менеджер</span>
            <select
              value={filters.manager}
              onChange={(event) => onFilterChange('manager', event.target.value)}
            >
              <option value="all">Все менеджеры</option>
              {managerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <button
            className="control-button mobile-filter-trigger"
            onClick={() => setFiltersOpen(true)}
            aria-label="Открыть глобальные фильтры"
            aria-expanded={filtersOpen}
            aria-controls="mobile-global-filters"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>Фильтры</span>
          </button>
          <button
            className="icon-button"
            onClick={onTheme}
            aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="refresh-button"
            onClick={onRefresh}
            disabled={loading}
            title={`Последняя синхронизация: ${lastSync}`}
          >
            <RefreshCw
              size={15}
              className={loading ? 'is-spinning' : undefined}
              aria-hidden="true"
            />
            <span>Обновить</span>
          </button>
          <span className="last-sync" aria-label={`Последняя синхронизация ${lastSync}`}>
            {lastSync}
          </span>
        </div>
      </header>

      <div
        className={`mobile-filter-layer ${filtersOpen ? 'is-open' : ''}`}
        aria-hidden={!filtersOpen}
        inert={!filtersOpen ? true : undefined}
      >
        <button
          className="mobile-filter-backdrop"
          onClick={() => setFiltersOpen(false)}
          aria-label="Закрыть фильтры"
          tabIndex={filtersOpen ? 0 : -1}
        />
        <section
          ref={filterSheetRef}
          id="mobile-global-filters"
          className="mobile-filter-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
        >
          <header>
            <div>
              <span>Глобальные параметры</span>
              <h2 id="mobile-filter-title">Фильтры отчёта</h2>
            </div>
            <button
              className="icon-button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Закрыть фильтры"
            >
              <X size={18} />
            </button>
          </header>
          <div className="mobile-filter-grid">
            <label className="mobile-filter-field">
              <span>Период</span>
              <span className="select-control date-control">
                <CalendarDays size={15} aria-hidden="true" />
                <select
                  value={filters.period}
                  onChange={(event) => onFilterChange('period', event.target.value)}
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>
            <label className="mobile-filter-field">
              <span>Сравнение</span>
              <span className="select-control">
                <select
                  value={filters.compare}
                  onChange={(event) => onFilterChange('compare', event.target.value)}
                >
                  <option value="previous">Сравнить: {comparisonLabel.toLowerCase()}</option>
                  <option value="none">Без сравнения</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>
            <label className="mobile-filter-field">
              <span>Команда</span>
              <span className="select-control">
                <select
                  value={filters.team}
                  onChange={(event) => onFilterChange('team', event.target.value)}
                >
                  {teamOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>
            <label className="mobile-filter-field">
              <span>Менеджер</span>
              <span className="select-control">
                <select
                  value={filters.manager}
                  onChange={(event) => onFilterChange('manager', event.target.value)}
                >
                  <option value="all">Все менеджеры</option>
                  {managerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </label>
          </div>
        </section>
      </div>
    </>
  )
}

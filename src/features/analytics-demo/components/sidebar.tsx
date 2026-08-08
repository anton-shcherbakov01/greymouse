'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CircleAlert,
  Database,
  Funnel,
  LayoutDashboard,
  Settings2,
  UsersRound,
  X,
} from 'lucide-react'
import Image from 'next/image'
import type { DashboardView } from '@/features/analytics-demo/lib/dashboard/data'
import { classNames } from '@/features/analytics-demo/lib/dashboard/format'

const items: Array<{
  id: DashboardView
  label: string
  icon: typeof LayoutDashboard
  demo: boolean
}> = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard, demo: true },
  { id: 'sales', label: 'Продажи', icon: ChartNoAxesCombined, demo: false },
  { id: 'funnel', label: 'Воронка', icon: Funnel, demo: true },
  { id: 'managers', label: 'Менеджеры', icon: UsersRound, demo: true },
  { id: 'deals', label: 'Сделки', icon: BriefcaseBusiness, demo: true },
  { id: 'clients', label: 'Клиенты', icon: Building2, demo: false },
  { id: 'problems', label: 'Проблемы', icon: CircleAlert, demo: false },
  { id: 'data', label: 'Данные', icon: Database, demo: false },
  { id: 'settings', label: 'Настройки', icon: Settings2, demo: false },
]

export function Sidebar({
  active,
  onNavigate,
  demo,
  open,
  onClose,
  company = 'Вектор Трейд',
  lastSync = '09:42',
  problemCount = 0,
}: {
  active: DashboardView
  onNavigate: (view: DashboardView) => void
  demo: boolean
  open: boolean
  onClose: () => void
  company?: string
  lastSync?: string
  problemCount?: number
}) {
  const [mobile, setMobile] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const visibleItems = demo ? items.filter((item) => item.demo) : items
  const initials =
    company
      .replace(/^(ООО|АО|ПАО|ЗАО)\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('ru-RU') || 'GM'

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1120px)')
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!mobile || !open) return
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const selector = "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
    const focusable = () =>
      Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(selector) ?? [])
    const frame = window.requestAnimationFrame(() => focusable()[0]?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [mobile, onClose, open])

  return (
    <>
      <button
        className={classNames('sidebar-backdrop', open && 'is-visible')}
        aria-label="Закрыть меню"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={sidebarRef}
        id="app-sidebar"
        className={classNames('sidebar', open && 'is-open')}
        aria-label="Боковая навигация"
        aria-hidden={mobile && !open ? true : undefined}
        inert={mobile && !open ? true : undefined}
      >
        <div className="brand">
          <Image
            className="brand-logo"
            src="/brand/logo.png"
            width={526}
            height={98}
            alt="Серая Мышь — digital-студия"
            priority
          />
          <span className="brand-product">Analytics lab</span>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Закрыть меню">
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Основная навигация">
          <p className="side-nav-label">Рабочее пространство</p>
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={classNames('side-nav-item', active === item.id && 'is-active')}
                aria-current={active === item.id ? 'page' : undefined}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.id === 'deals' && demo ? 'Сделки под риском' : item.label}</span>
                {item.id === 'problems' && problemCount > 0 ? (
                  <span className="nav-count">{problemCount}</span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="data-health">
            <span className="health-dot" />
            <div>
              <strong>Данные актуальны</strong>
              <span>Синхронизация {lastSync}</span>
            </div>
          </div>
          <div className="workspace-chip">
            <span className="avatar avatar--dark">{initials}</span>
            <div>
              <strong>{company}</strong>
              <span>Отдел продаж</span>
            </div>
            <BarChart3 size={15} aria-hidden="true" />
          </div>
        </div>
      </aside>
    </>
  )
}

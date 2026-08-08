'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { DrawerSelection } from '@/features/analytics-demo/components/detail-drawer'
import { Sidebar } from '@/features/analytics-demo/components/sidebar'
import { Topbar } from '@/features/analytics-demo/components/topbar'
import { OverviewView } from '@/features/analytics-demo/components/views/overview-view'
import type { DashboardView } from '@/features/analytics-demo/lib/dashboard/data'
import {
  buildDemoDashboard,
  demoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/model'
import { formatNumberRu } from '@/features/analytics-demo/lib/dashboard/format'
import {
  DEFAULT_WORKSPACE_SETTINGS,
  loadWorkspaceSettings,
  saveWorkspaceSettings,
  WORKSPACE_SETTINGS_EVENT,
  type WorkspaceSettings,
} from '@/features/analytics-demo/lib/dashboard/settings'
import {
  buildImportedDashboard,
  getImportedDashboardFilterOptions,
  type ImportedTeamFilter,
} from '@/features/analytics-demo/lib/import/dashboard'
import {
  clearImportedRows,
  IMPORT_STORAGE_EVENT,
  loadImportedRows,
} from '@/features/analytics-demo/lib/import/storage'
import type { StoredImportSnapshot } from '@/features/analytics-demo/lib/import/types'

const ViewLoading = () => (
  <div className="view-loading" role="status" aria-label="Загрузка раздела">
    <span />
    <span />
    <span />
    <span />
  </div>
)

const SalesView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/sales-view').then(
      (module) => module.SalesView,
    ),
  { loading: ViewLoading },
)
const FunnelView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/funnel-view').then(
      (module) => module.FunnelView,
    ),
  { loading: ViewLoading },
)
const ManagersView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/managers-view').then(
      (module) => module.ManagersView,
    ),
  { loading: ViewLoading },
)
const DealsView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/deals-view').then(
      (module) => module.DealsView,
    ),
  { loading: ViewLoading },
)
const ClientsView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/clients-view').then(
      (module) => module.ClientsView,
    ),
  { loading: ViewLoading },
)
const ProblemsView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/problems-view').then(
      (module) => module.ProblemsView,
    ),
  { loading: ViewLoading },
)
const DataImport = dynamic(
  () =>
    import('@/features/analytics-demo/components/data-import').then((module) => module.DataImport),
  { loading: ViewLoading },
)
const SettingsView = dynamic(
  () =>
    import('@/features/analytics-demo/components/views/settings-view').then(
      (module) => module.SettingsView,
    ),
  { loading: ViewLoading },
)
const DetailDrawer = dynamic(() =>
  import('@/features/analytics-demo/components/detail-drawer').then(
    (module) => module.DetailDrawer,
  ),
)

const allViews: DashboardView[] = [
  'overview',
  'sales',
  'funnel',
  'managers',
  'deals',
  'clients',
  'problems',
  'data',
  'settings',
]
const demoViews: DashboardView[] = ['overview', 'managers', 'funnel', 'deals']

const viewMeta: Record<DashboardView, { title: string; subtitle: string }> = {
  overview: { title: 'Пульт собственника', subtitle: 'Продажи' },
  sales: { title: 'Продажи', subtitle: 'Выручка, источники и потерянный потенциал' },
  funnel: { title: 'Воронка', subtitle: 'Конверсия и скорость движения сделок' },
  managers: { title: 'Менеджеры', subtitle: 'Результат, качество pipeline и Sales Score' },
  deals: { title: 'Сделки под риском', subtitle: 'Деньги, которые требуют действия сегодня' },
  clients: { title: 'Клиенты', subtitle: 'Выручка, повторные продажи и концентрация' },
  problems: { title: 'Проблемы', subtitle: 'Приоритеты по влиянию на выручку и срочности' },
  data: { title: 'Загрузить данные', subtitle: 'CSV / XLSX · проверка, сопоставление и импорт' },
  settings: { title: 'Настройки', subtitle: 'Рабочее пространство, правила и источники' },
}

export function DashboardApp({
  demo = false,
  defaultCompany = 'Вектор Трейд',
}: {
  demo?: boolean
  defaultCompany?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const allowedViews = demo ? demoViews : allViews
  const requestedView = searchParams.get('view') as DashboardView | null
  const initialView =
    requestedView && allowedViews.includes(requestedView) ? requestedView : 'overview'
  const view = initialView
  const [dark, setDark] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState('09:42')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drawer, setDrawer] = useState<DrawerSelection>(null)
  const [importedSnapshot, setImportedSnapshot] = useState<StoredImportSnapshot | null>(null)
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>(
    DEFAULT_WORKSPACE_SETTINGS,
  )
  const periodParam = searchParams.get('period')
  const compare = searchParams.get('compare') === 'none' ? 'none' : 'previous'
  const teamParam = searchParams.get('team') ?? 'all'
  const managerParam = searchParams.get('manager') ?? 'all'
  const importedFilterOptions = useMemo(
    () => (importedSnapshot && !demo ? getImportedDashboardFilterOptions(importedSnapshot) : null),
    [demo, importedSnapshot],
  )
  const importedPeriod = periodParam === 'previous' ? 'previous' : 'latest'
  const importedTeam = importedFilterOptions?.teams.some((option) => option.value === teamParam)
    ? (teamParam as ImportedTeamFilter)
    : 'all'
  const importedManager = importedFilterOptions?.managers.includes(managerParam)
    ? managerParam
    : 'all'
  const demoPeriod = demoDashboardModel.options.periods.some(
    (option) => option.value === periodParam,
  )
    ? (periodParam as string)
    : demoDashboardModel.periodKey
  const demoTeam = demoDashboardModel.options.teams.some((option) => option.value === teamParam)
    ? teamParam
    : 'all'
  const demoManager = demoDashboardModel.options.managers.some(
    (option) => option.value === managerParam,
  )
    ? managerParam
    : 'all'
  const demoModel = useMemo(
    () =>
      buildDemoDashboard({
        period: demoPeriod,
        compare: compare === 'none' ? false : undefined,
        team: demoTeam,
        manager: demoManager === 'all' ? null : demoManager,
      }),
    [compare, demoManager, demoPeriod, demoTeam],
  )
  const importedModel = useMemo(
    () =>
      importedSnapshot && !demo
        ? buildImportedDashboard(importedSnapshot, {
            period: importedPeriod,
            compare: compare !== 'none',
            team: importedTeam,
            manager: importedManager,
          })
        : null,
    [compare, demo, importedManager, importedPeriod, importedSnapshot, importedTeam],
  )

  const company = useMemo(() => {
    if (!demo) return workspaceSettings.company
    const value = searchParams.get('company')?.trim()
    return value ? value.slice(0, 42) : defaultCompany.slice(0, 42)
  }, [defaultCompany, demo, searchParams, workspaceSettings.company])

  useEffect(() => {
    const stored = window.localStorage.getItem('grey-mouse-theme')
    const nextDark = stored === 'dark'
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light'
    const timer = window.setTimeout(() => setDark(nextDark), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!workspaceSettings.systemTheme) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme = query.matches ? 'dark' : 'light'
      setDark(query.matches)
    }
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [workspaceSettings.systemTheme])

  useEffect(() => {
    const timer = window.setTimeout(() => setWorkspaceSettings(loadWorkspaceSettings()), 0)
    const onSettings = (event: Event) =>
      setWorkspaceSettings((event as CustomEvent<WorkspaceSettings>).detail)
    window.addEventListener(WORKSPACE_SETTINGS_EVENT, onSettings)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(WORKSPACE_SETTINGS_EVENT, onSettings)
    }
  }, [])

  useEffect(() => {
    if (demo) return
    const timer = window.setTimeout(() => setImportedSnapshot(loadImportedRows()), 0)
    const onImported = (event: Event) =>
      setImportedSnapshot((event as CustomEvent<StoredImportSnapshot>).detail)
    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith('grey-mouse.analytics.imported-deals'))
        setImportedSnapshot(loadImportedRows())
    }
    window.addEventListener(IMPORT_STORAGE_EVENT, onImported)
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(IMPORT_STORAGE_EVENT, onImported)
      window.removeEventListener('storage', onStorage)
    }
  }, [demo])

  const activePeriod = importedModel ? importedPeriod : demoPeriod
  const activeTeam = importedModel ? importedTeam : demoTeam
  const activeManager = importedModel ? importedManager : demoManager
  const periodOptions = importedFilterOptions
    ? importedFilterOptions.periods
    : demoModel.options.periods
  const teamOptions = importedFilterOptions
    ? importedFilterOptions.teams.map(({ value, label }) => ({ value, label }))
    : demoModel.options.teams
  const managerOptions = importedFilterOptions
    ? importedFilterOptions.managers.map((manager) => ({ value: manager, label: manager }))
    : demoModel.options.managers
  const activePeriodLabel = importedModel?.periodLabel ?? demoModel.periodLabel
  const comparisonLabel = importedModel
    ? new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(
          new Date(importedModel.currentStart).setUTCMonth(
            new Date(importedModel.currentStart).getUTCMonth() - 1,
          ),
        ),
      )
    : (demoModel.comparisonLabel ?? 'прошлый период')

  const navigate = useCallback(
    (nextView: DashboardView) => {
      if (!allowedViews.includes(nextView)) return
      setDrawer(null)
      const params = new URLSearchParams(searchParams.toString())
      if (nextView === 'overview') params.delete('view')
      else params.set('view', nextView)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [allowedViews, pathname, router, searchParams],
  )

  const changeFilter = useCallback(
    (key: 'period' | 'compare' | 'team' | 'manager', value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      if (key === 'team') params.delete('manager')
      setDrawer(null)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const toggleTheme = () => {
    if (workspaceSettings.systemTheme) {
      const nextSettings = { ...workspaceSettings, systemTheme: false }
      setWorkspaceSettings(nextSettings)
      saveWorkspaceSettings(nextSettings)
    }
    setDark((current) => {
      const next = !current
      document.documentElement.dataset.theme = next ? 'dark' : 'light'
      window.localStorage.setItem('grey-mouse-theme', next ? 'dark' : 'light')
      return next
    })
  }

  const refresh = () => {
    if (loading) return
    setLoading(true)
    window.setTimeout(() => {
      setImportedSnapshot(loadImportedRows())
      setLastSync(
        new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: workspaceSettings.timezone === 'ekb' ? 'Asia/Yekaterinburg' : 'Europe/Moscow',
        }).format(new Date()),
      )
      setLoading(false)
    }, 780)
  }

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const closeDrawer = useCallback(() => setDrawer(null), [])

  const renderView = () => {
    switch (view) {
      case 'sales':
        return (
          <SalesView
            imported={importedModel}
            model={demoModel}
            onOpenDeals={() => navigate('deals')}
          />
        )
      case 'funnel':
        return <FunnelView imported={importedModel} model={demoModel} />
      case 'managers':
        return (
          <ManagersView
            imported={importedModel}
            model={demoModel}
            onOpenManager={(id) => setDrawer({ type: 'manager', id })}
          />
        )
      case 'deals':
        return (
          <DealsView
            imported={importedModel}
            model={demoModel}
            onOpenDeal={(id) => setDrawer({ type: 'deal', id })}
          />
        )
      case 'clients':
        return (
          <ClientsView
            imported={importedModel}
            model={demoModel}
            onOpenClient={(id) => setDrawer({ type: 'client', id })}
          />
        )
      case 'problems':
        return <ProblemsView imported={importedModel} model={demoModel} onNavigate={navigate} />
      case 'data':
        return <DataImport />
      case 'settings':
        return <SettingsView />
      default:
        return (
          <OverviewView
            imported={importedModel}
            model={demoModel}
            onResetImported={() => {
              clearImportedRows()
              setImportedSnapshot(null)
            }}
            onNavigate={navigate}
            onOpenManager={(id) => setDrawer({ type: 'manager', id })}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        onNavigate={navigate}
        demo={demo}
        open={sidebarOpen}
        onClose={closeSidebar}
        company={company}
        lastSync={lastSync}
        problemCount={
          workspaceSettings.riskMonitoring
            ? (importedModel?.problems.length ?? demoModel.problems.length)
            : 0
        }
      />
      <div className="app-main">
        <Topbar
          title={viewMeta[view].title}
          subtitle={
            view === 'overview'
              ? `Продажи · ${activePeriodLabel} · ${formatNumberRu(importedModel?.rowCount ?? demoModel.currentDealCount)} сделок`
              : view === 'data' || view === 'settings' || view === 'problems'
                ? viewMeta[view].subtitle
                : `${viewMeta[view].subtitle} · ${activePeriodLabel}`
          }
          company={demo ? company : undefined}
          loading={loading}
          dark={dark}
          onRefresh={refresh}
          onTheme={toggleTheme}
          onMenu={() => setSidebarOpen(true)}
          menuOpen={sidebarOpen}
          filters={{ period: activePeriod, compare, team: activeTeam, manager: activeManager }}
          periodOptions={periodOptions}
          teamOptions={teamOptions}
          managerOptions={managerOptions}
          comparisonLabel={comparisonLabel}
          lastSync={lastSync}
          onFilterChange={changeFilter}
        />
        <div className={`loading-overlay ${loading ? 'is-visible' : ''}`} aria-hidden={!loading}>
          <div className="loading-line" />
        </div>
        <main className="content">
          <div className="content-inner">
            <div className="view-enter" key={view}>
              {renderView()}
            </div>
            {demo ? (
              <footer className="demo-footer">
                <strong>Grey Mouse Analytics</strong>
                <span>Управленческая аналитика продаж</span>
              </footer>
            ) : null}
          </div>
        </main>
      </div>
      {drawer ? (
        <DetailDrawer
          selection={drawer}
          imported={importedModel}
          model={demoModel}
          onClose={closeDrawer}
        />
      ) : null}
    </div>
  )
}

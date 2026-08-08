'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { ManagerTrend } from '@/features/analytics-demo/components/charts'
import { EmptyState, Panel, PanelHeader, Score } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import {
  classNames,
  formatPercent,
  formatRub,
} from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

type SortKey = 'score' | 'revenue' | 'planRate' | 'winRate' | 'stale'

export function ManagersView({
  onOpenManager,
  imported,
  model = demoDashboardModel,
}: {
  onOpenManager: (id: string) => void
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('score')
  const [ascending, setAscending] = useState(false)

  const activeManagers = imported?.managers ?? model.managerRows
  const rows = useMemo(() => {
    return activeManagers
      .filter((manager) => manager.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a[sort] - b[sort]) * (ascending ? 1 : -1))
  }, [activeManagers, ascending, search, sort])
  const sortedScores = activeManagers.map((manager) => manager.score).sort((a, b) => a - b)
  const medianScore = imported
    ? sortedScores.length
      ? sortedScores[Math.floor(sortedScores.length / 2)]
      : 0
    : model.managerSummary.medianScore
  const averageScore = activeManagers.length
    ? activeManagers.reduce((sum, manager) => sum + manager.score, 0) / activeManagers.length
    : 0
  const leader = [...activeManagers].sort((a, b) => b.score - a.score)[0]
  const averageWinRate = activeManagers.length
    ? activeManagers.reduce((sum, manager) => sum + manager.winRate, 0) / activeManagers.length
    : 0
  const averageRevenue = activeManagers.length
    ? activeManagers.reduce((sum, manager) => sum + manager.revenue, 0) / activeManagers.length
    : 0
  const averageStale = activeManagers.length
    ? activeManagers.reduce((sum, manager) => sum + manager.stale, 0) / activeManagers.length
    : 0

  return (
    <div className="view-stack">
      <section className="summary-line" aria-label="Сводка по команде">
        <div>
          <span>Команда</span>
          <strong>{activeManagers.length} менеджеров</strong>
          <small>
            {imported
              ? 'из импортированного файла'
              : `${model.managerSummary.active} активны в справочнике`}
          </small>
        </div>
        <div>
          <span>Медиана Sales Score</span>
          <strong>{medianScore}</strong>
          <small>
            {imported ? 'без компонента плана' : `за ${model.periodLabel.toLowerCase()}`}
          </small>
        </div>
        <div>
          <span>Выполнение плана</span>
          <strong>
            {imported ? 'Не задан' : formatPercent(model.managerSummary.planAchievement * 100)}
          </strong>
          <small>
            {imported
              ? 'поле плана отсутствует'
              : `${model.managerSummary.abovePace} выше текущего темпа`}
          </small>
        </div>
        <div>
          <span>Разрыв лидера и команды</span>
          <strong>
            {imported
              ? leader
                ? Math.max(0, Math.round(leader.score - averageScore))
                : 0
              : model.managerSummary.leaderGap}{' '}
            п.
          </strong>
          <small className="warning-text">по текущему score</small>
        </div>
      </section>

      <Panel>
        <PanelHeader
          eyebrow="Эффективность команды"
          title="Рейтинг менеджеров"
          description={
            imported
              ? 'Score рассчитан по выручке, win rate и гигиене активной воронки; план не загружен'
              : 'Sales Score объединяет план, конверсию, скорость и качество pipeline'
          }
          action={
            <div className="table-tools">
              <label className="search-field">
                <Search size={15} />
                <span className="sr-only">Найти менеджера</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Найти менеджера"
                />
              </label>
              <label className="compact-select">
                <SlidersHorizontal size={14} />
                <span className="sr-only">Сортировка</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                  <option value="score">По Sales Score</option>
                  <option value="revenue">По выручке</option>
                  <option value="planRate">По плану</option>
                  <option value="winRate">По win rate</option>
                  <option value="stale">По просроченным</option>
                </select>
              </label>
              <button
                className="icon-button"
                onClick={() => setAscending((value) => !value)}
                aria-label="Изменить направление сортировки"
              >
                {ascending ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </button>
            </div>
          }
        />

        <div className="table-scroll">
          <table className="data-table manager-table">
            <thead>
              <tr>
                <th>Менеджер</th>
                <th>Score</th>
                <th>Выручка</th>
                <th>План</th>
                <th>Pipeline</th>
                <th>Сделки</th>
                <th>Win rate</th>
                <th>Ср. чек</th>
                <th>Цикл</th>
                <th>Просрочено</th>
                <th>Динамика</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((manager, index) => (
                <tr key={manager.id}>
                  <td>
                    <button
                      className="table-row-button"
                      onClick={() => onOpenManager(manager.id)}
                      aria-label={`Открыть карточку менеджера ${manager.name}`}
                    >
                      <span className="person-cell">
                        <span className={classNames('avatar', index === 0 && 'avatar--dark')}>
                          {manager.initials}
                        </span>
                        <span>
                          <strong>{manager.name}</strong>
                          <span>
                            {index === 0
                              ? 'Лидер месяца'
                              : index === rows.length - 1
                                ? 'Требует внимания'
                                : 'Менеджер'}
                          </span>
                        </span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <Score value={manager.score} />
                  </td>
                  <td>
                    <strong>{formatRub(manager.revenue, true)}</strong>
                  </td>
                  <td>
                    {imported ? (
                      <div className="plan-cell">
                        <strong>—</strong>
                        <span>Не задан</span>
                        <i>
                          <em style={{ width: '0%' }} />
                        </i>
                      </div>
                    ) : (
                      <div className="plan-cell">
                        <strong
                          className={
                            manager.planRate >= 100
                              ? 'positive-text'
                              : manager.planRate < 70
                                ? 'negative-text'
                                : undefined
                          }
                        >
                          {manager.planRate}%
                        </strong>
                        <span>{formatRub(manager.plan, true)}</span>
                        <i>
                          <em style={{ width: `${Math.min(manager.planRate, 100)}%` }} />
                        </i>
                      </div>
                    )}
                  </td>
                  <td>{formatRub(manager.pipeline, true)}</td>
                  <td>{manager.deals}</td>
                  <td>{formatPercent(manager.winRate)}</td>
                  <td>{formatRub(manager.average, true)}</td>
                  <td>{manager.cycle === null ? '—' : `${manager.cycle} дн.`}</td>
                  <td>
                    <span className={manager.stale >= 7 ? 'negative-text strong-text' : undefined}>
                      {manager.stale}
                    </span>
                  </td>
                  <td>
                    <ManagerTrend values={manager.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="Менеджеры не найдены"
            text={
              imported
                ? 'В загруженном наборе нет строк, подходящих под поиск.'
                : 'Измените строку поиска.'
            }
          />
        ) : null}
      </Panel>

      {leader ? (
        <div className="compare-strip">
          <div>
            <span className="avatar avatar--dark">{leader.initials}</span>
            <div>
              <small>{leader.name}</small>
              <strong>{leader.score}</strong>
            </div>
          </div>
          <span className="compare-vs">vs</span>
          <div>
            <span className="avatar avatar--group">
              <UsersRound size={15} />
            </span>
            <div>
              <small>Среднее отдела</small>
              <strong>{Math.round(averageScore)}</strong>
            </div>
          </div>
          <div className="compare-metrics">
            <span>
              Выручка{' '}
              <strong>
                {averageRevenue
                  ? `${leader.revenue >= averageRevenue ? '+' : ''}${Math.round(((leader.revenue - averageRevenue) / averageRevenue) * 100)}%`
                  : '—'}
              </strong>
            </span>
            <span>
              Win rate{' '}
              <strong>
                {leader.winRate - averageWinRate >= 0 ? '+' : ''}
                {(leader.winRate - averageWinRate).toFixed(1)} п.п.
              </strong>
            </span>
            <span>
              Просрочено{' '}
              <strong>
                {leader.stale - averageStale >= 0 ? '+' : ''}
                {(leader.stale - averageStale).toFixed(1)}
              </strong>
            </span>
          </div>
          <button className="secondary-button" onClick={() => onOpenManager(leader.id)}>
            Открыть сравнение
          </button>
        </div>
      ) : null}
    </div>
  )
}

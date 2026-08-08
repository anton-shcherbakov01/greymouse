'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Filter, Search, ShieldAlert } from 'lucide-react'
import { Panel, PanelHeader, RiskBadge } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DemoDashboardModel,
  type RiskLevel,
} from '@/features/analytics-demo/lib/dashboard/data'
import { classNames, formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

export function DealsView({
  onOpenDeal,
  imported,
  model = demoDashboardModel,
}: {
  onOpenDeal: (id: string) => void
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
}) {
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState<'all' | RiskLevel>('all')
  const [manager, setManager] = useState('all')
  const [stage, setStage] = useState('all')
  const [minAmount, setMinAmount] = useState('0')
  const [inactivityDays, setInactivityDays] = useState('0')
  const [sortKey, setSortKey] = useState<'score' | 'amount' | 'inactivity' | 'probability'>('score')
  const [ascending, setAscending] = useState(false)

  const activeDeals = imported?.riskDeals ?? model.riskDeals
  const activeBreakdown = imported?.moneyAtRisk ?? model.moneyAtRisk
  const totalAtRisk = activeBreakdown.reduce((sum, item) => sum + item.amount, 0)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return activeDeals
      .filter((deal) => {
        const matchesSearch =
          !query || `${deal.client} ${deal.deal} ${deal.id}`.toLowerCase().includes(query)
        return (
          matchesSearch &&
          (risk === 'all' || deal.level === risk) &&
          (manager === 'all' || deal.manager === manager) &&
          (stage === 'all' || deal.stage === stage) &&
          deal.amount >= Number(minAmount) &&
          deal.inactivity >= Number(inactivityDays)
        )
      })
      .sort((left, right) => (left[sortKey] - right[sortKey]) * (ascending ? 1 : -1))
  }, [activeDeals, ascending, inactivityDays, manager, minAmount, risk, search, sortKey, stage])

  const clearFilters = () => {
    setSearch('')
    setRisk('all')
    setManager('all')
    setStage('all')
    setMinAmount('0')
    setInactivityDays('0')
    setSortKey('score')
    setAscending(false)
  }

  return (
    <div className="view-stack">
      <div className="deal-risk-hero">
        <div className="risk-hero-main">
          <span className="risk-hero-icon">
            <ShieldAlert size={22} />
          </span>
          <div>
            <p>Деньги под риском</p>
            <strong>{formatRub(totalAtRisk)}</strong>
            <span>
              {imported
                ? `${imported.pipeline ? ((totalAtRisk / imported.pipeline) * 100).toFixed(1) : '0'}% активной воронки · ${activeDeals.length} сделок`
                : `${(model.riskSummary.pipelineShare * 100).toFixed(1).replace('.', ',')}% активной воронки · ${model.riskSummary.count} сделок`}
            </span>
          </div>
        </div>
        <div className="risk-hero-breakdown">
          {activeBreakdown.map((item) => (
            <div key={item.label}>
              <i className={`risk-dot risk-dot--${item.tone}`} />
              <span>{item.label}</span>
              <strong>{formatRub(item.amount, true)}</strong>
            </div>
          ))}
          {imported && activeBreakdown.length === 0 ? (
            <div>
              <span>Рисковые сигналы по загруженным сделкам не найдены</span>
            </div>
          ) : null}
        </div>
      </div>

      <Panel>
        <PanelHeader
          eyebrow="Deal risk center"
          title="Все сделки без движения"
          description={
            imported
              ? 'Риск по активности, вероятности и возрасту сделки'
              : `Полный список: ${model.riskSummary.count} активных сделок без обновления более 7 дней`
          }
        />
        <div className="filter-bar">
          <label className="search-field search-field--wide">
            <Search size={15} />
            <span className="sr-only">Поиск сделки</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Клиент, сделка или ID"
            />
          </label>
          <label className="filter-select">
            <span>Риск</span>
            <select
              value={risk}
              onChange={(event) => setRisk(event.target.value as 'all' | RiskLevel)}
            >
              <option value="all">Любой</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-select">
            <span>Менеджер</span>
            <select value={manager} onChange={(event) => setManager(event.target.value)}>
              <option value="all">Все</option>
              {Array.from(new Set(activeDeals.map((deal) => deal.manager))).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-select">
            <span>Этап</span>
            <select value={stage} onChange={(event) => setStage(event.target.value)}>
              <option value="all">Все</option>
              {Array.from(new Set(activeDeals.map((deal) => deal.stage))).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-select">
            <span>Сумма от</span>
            <select value={minAmount} onChange={(event) => setMinAmount(event.target.value)}>
              <option value="0">Любая</option>
              <option value="500000">500 тыс. ₽</option>
              <option value="750000">750 тыс. ₽</option>
              <option value="1000000">1 млн ₽</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-select">
            <span>Нет активности</span>
            <select
              value={inactivityDays}
              onChange={(event) => setInactivityDays(event.target.value)}
            >
              <option value="0">Любой срок</option>
              <option value="7">7+ дней</option>
              <option value="14">14+ дней</option>
              <option value="21">21+ день</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-select">
            <span>Сортировка</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
            >
              <option value="score">Risk score</option>
              <option value="amount">Сумма</option>
              <option value="inactivity">Неактивность</option>
              <option value="probability">Вероятность</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <button
            className="icon-button filter-direction"
            onClick={() => setAscending((value) => !value)}
            aria-label={ascending ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'}
            title={ascending ? 'По возрастанию' : 'По убыванию'}
          >
            {ascending ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </button>
          <button className="filter-reset" onClick={clearFilters}>
            <Filter size={14} />
            Сбросить
          </button>
        </div>

        <div className="result-meta">
          <span>
            Найдено: <strong>{filtered.length}</strong>
          </span>
          <span>
            Сумма:{' '}
            <strong>
              {formatRub(
                filtered.reduce((sum, deal) => sum + deal.amount, 0),
                true,
              )}
            </strong>
          </span>
          <span>
            {imported ? `Источник: ${imported.sourceName}` : `Пересчитано: ${model.updatedLabel}`}
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table risk-table">
            <thead>
              <tr>
                <th>Клиент / сделка</th>
                <th>Менеджер</th>
                <th>Этап</th>
                <th>Сумма</th>
                <th>Вероятность</th>
                <th>{imported ? 'Возраст сделки' : 'Дней на этапе'}</th>
                <th>Последняя активность</th>
                <th>Risk score</th>
                <th>Причина риска</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <button
                      className="table-row-button"
                      onClick={() => onOpenDeal(deal.id)}
                      aria-label={`Открыть сделку ${deal.deal}`}
                    >
                      <span className="deal-cell">
                        <strong>{deal.client}</strong>
                        <span>
                          {deal.deal} · {deal.id}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td>{deal.manager}</td>
                  <td>
                    <span className="stage-badge">{deal.stage}</span>
                  </td>
                  <td>
                    <strong>{formatRub(deal.amount, true)}</strong>
                  </td>
                  <td>{deal.probability}%</td>
                  <td>
                    <span className={deal.days >= 15 ? 'negative-text strong-text' : undefined}>
                      {deal.days}
                    </span>
                  </td>
                  <td>
                    <div className="activity-cell">
                      <strong>{deal.lastActivity}</strong>
                      <span>{deal.inactivity} дн. назад</span>
                    </div>
                  </td>
                  <td>
                    <div className="risk-score-cell">
                      <strong>{deal.score}</strong>
                      <RiskBadge level={deal.level} />
                    </div>
                  </td>
                  <td>
                    <p
                      className={classNames(
                        'risk-reason',
                        deal.level === 'high' && 'risk-reason--high',
                      )}
                    >
                      {deal.reason}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <div className="table-empty">
            <ShieldAlert size={22} />
            <strong>Нет сделок по выбранным условиям</strong>
            <button className="text-link" onClick={clearFilters}>
              Сбросить фильтры
            </button>
          </div>
        ) : null}
      </Panel>
    </div>
  )
}

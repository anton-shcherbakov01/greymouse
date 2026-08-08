'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { ParetoChart } from '@/features/analytics-demo/components/charts'
import { EmptyState, Panel, PanelHeader } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import { formatNumberRu, formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

export function ClientsView({
  onOpenClient,
  imported,
  model = demoDashboardModel,
}: {
  onOpenClient: (id: string) => void
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
}) {
  const [search, setSearch] = useState('')
  const [abc, setAbc] = useState('all')
  const [sortKey, setSortKey] = useState<
    'revenue' | 'share' | 'deals' | 'average' | 'repeat' | 'lifetime' | 'name'
  >('revenue')
  const [ascending, setAscending] = useState(false)
  const activeClients = imported?.clients ?? model.clients
  const visible = useMemo(
    () =>
      activeClients
        .filter(
          (client) =>
            (!search ||
              `${client.name} ${client.industry}`.toLowerCase().includes(search.toLowerCase())) &&
            (abc === 'all' || client.abc === abc),
        )
        .sort((left, right) => {
          const comparison =
            sortKey === 'name'
              ? left.name.localeCompare(right.name, 'ru')
              : left[sortKey] - right[sortKey]
          return comparison * (ascending ? 1 : -1)
        }),
    [abc, activeClients, ascending, search, sortKey],
  )
  const topFiveShare = activeClients.slice(0, 5).reduce((sum, client) => sum + client.share, 0)
  const topTwoShare = activeClients.slice(0, 2).reduce((sum, client) => sum + client.share, 0)
  const hhi = imported?.hhi ?? model.clientSummary.hhi
  const concentrationLabel =
    hhi < 1_000 ? 'Низкий риск' : hhi < 1_800 ? 'Умеренный риск' : 'Высокий риск'
  const totalLifetime = activeClients.reduce((sum, client) => sum + client.lifetime, 0)
  const paidDeals = activeClients.reduce((sum, client) => sum + client.deals, 0)
  const totalRevenue = activeClients.reduce((sum, client) => sum + client.revenue, 0)
  const repeatClientRate = activeClients.length
    ? (activeClients.filter((client) => client.repeat > 0).length / activeClients.length) * 100
    : 0
  const abcSummary = (['A', 'B', 'C'] as const).map((segment) => ({
    segment,
    clients: activeClients.filter((client) => client.abc === segment),
    share: activeClients
      .filter((client) => client.abc === segment)
      .reduce((sum, client) => sum + client.share, 0),
  }))

  return (
    <div className="view-stack">
      <section className="client-insight-banner">
        <div>
          <span>Концентрация выручки</span>
          <strong>Топ-5 клиентов формируют {topFiveShare.toFixed(0)}% выручки</strong>
          <p>
            Два крупнейших клиента дают {topTwoShare.toFixed(0)}% оборота анализируемого набора.
          </p>
        </div>
        <div className="concentration-meter">
          <span style={{ width: `${Math.min(topFiveShare, 100)}%` }} />
          <i style={{ left: `${Math.min(topFiveShare, 96)}%` }}>{topFiveShare.toFixed(0)}%</i>
          <small>0</small>
          <small>100%</small>
        </div>
        <div className="concentration-status">
          <AlertTriangle size={16} />
          <span>
            <strong>{concentrationLabel}</strong>HHI {formatNumberRu(hhi)} · ориентир &lt; 1 000
          </span>
        </div>
      </section>

      <div className="two-column-grid two-column-grid--balanced">
        <Panel>
          <PanelHeader
            eyebrow="Pareto / ABC"
            title="Кто формирует выручку"
            description={
              imported
                ? `Накопленная доля по ${activeClients.length} клиентам`
                : 'Накопленная доля по топ-10 клиентам'
            }
          />
          {activeClients.length ? (
            <ParetoChart
              data={activeClients.map((client) => ({
                name: client.name,
                revenue: client.revenue,
                share: client.share,
              }))}
            />
          ) : (
            <EmptyState
              title="Нет клиентов"
              text="В импортированном наборе нет строк для клиентского анализа."
            />
          )}
          <div className="abc-legend">
            {abcSummary.map((item) => (
              <span key={item.segment}>
                <i className={`abc-${item.segment.toLowerCase()}`} />
                {item.segment} · {item.clients.length} клиентов · {item.share.toFixed(0)}%
              </span>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader eyebrow="Портфель" title="Качество клиентской базы" />
          <div className="portfolio-metrics">
            <div>
              <span>Клиенты в наборе</span>
              <strong>{imported ? activeClients.length : model.clientSummary.activeClients}</strong>
              <small>
                {imported
                  ? 'уникальных названий'
                  : !model.comparisonLabel
                    ? 'без сравнения'
                    : `${model.clientSummary.activeClients - model.clientSummary.previousActiveClients >= 0 ? '+' : '−'}${Math.abs(model.clientSummary.activeClients - model.clientSummary.previousActiveClients)} к сравнению`}
              </small>
            </div>
            <div>
              <span>Repeat rate</span>
              <strong>
                {imported
                  ? repeatClientRate.toFixed(1)
                  : (model.clientSummary.repeatRate * 100).toFixed(1).replace('.', ',')}
                %
              </strong>
              <small>
                {imported
                  ? 'с повторными оплатами'
                  : !model.comparisonLabel
                    ? 'без сравнения'
                    : `${(model.clientSummary.repeatRate - model.clientSummary.previousRepeatRate) * 100 >= 0 ? '+' : '−'}${Math.abs(
                        (model.clientSummary.repeatRate - model.clientSummary.previousRepeatRate) *
                          100,
                      )
                        .toFixed(1)
                        .replace('.', ',')} п.п.`}
              </small>
            </div>
            <div>
              <span>Lifetime revenue</span>
              <strong>
                {formatRub(imported ? totalLifetime : model.clientSummary.lifetimeRevenue, true)}
              </strong>
              <small>по доступной истории</small>
            </div>
            <div>
              <span>Средний чек</span>
              <strong>
                {formatRub(
                  imported
                    ? paidDeals
                      ? totalRevenue / paidDeals
                      : 0
                    : model.clientSummary.averageTicket,
                  true,
                )}
              </strong>
              <small>
                {imported
                  ? `${paidDeals} оплат за период`
                  : model.clientSummary.averageTicketChange === null
                    ? 'без сравнения'
                    : `${model.clientSummary.averageTicketChange >= 0 ? '+' : '−'}${Math.abs(
                        model.clientSummary.averageTicketChange * 100,
                      )
                        .toFixed(1)
                        .replace('.', ',')}%`}
              </small>
            </div>
          </div>
          <div className="portfolio-note">
            <span>Наблюдение</span>
            <p>
              {imported
                ? `${activeClients.filter((client) => client.repeat > 0).length} клиентов имеют более одной оплаты в доступной истории.`
                : model.clientSummary.averageTicketChange === null
                  ? `Топ-3 клиента формируют ${(model.clientSummary.top3Share * 100).toFixed(0)}% выручки; сравнение среднего чека отключено.`
                  : `Топ-3 клиента формируют ${(model.clientSummary.top3Share * 100).toFixed(0)}% выручки; средний чек изменился на ${model.clientSummary.averageTicketChange >= 0 ? '+' : '−'}${Math.abs(model.clientSummary.averageTicketChange * 100).toFixed(0)}%.`}
            </p>
            <button className="text-link" onClick={() => setAbc('A')}>
              Показать сегмент A<ChevronRight size={14} />
            </button>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          eyebrow="Выручка · сделки · удержание"
          title={imported ? 'Клиенты импортированного набора' : 'Топ-10 клиентов'}
          action={
            <div className="table-tools">
              <label className="search-field">
                <Search size={15} />
                <span className="sr-only">Найти клиента</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Найти клиента"
                />
              </label>
              <div className="segmented">
                <button
                  className={abc === 'all' ? 'is-active' : undefined}
                  onClick={() => setAbc('all')}
                >
                  Все
                </button>
                {['A', 'B', 'C'].map((value) => (
                  <button
                    key={value}
                    className={abc === value ? 'is-active' : undefined}
                    onClick={() => setAbc(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <label className="compact-select">
                <SlidersHorizontal size={14} />
                <span className="sr-only">Сортировка клиентов</span>
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
                >
                  <option value="revenue">По выручке</option>
                  <option value="share">По доле</option>
                  <option value="deals">По сделкам</option>
                  <option value="average">По среднему чеку</option>
                  <option value="repeat">По repeat rate</option>
                  <option value="lifetime">По lifetime</option>
                  <option value="name">По названию</option>
                </select>
              </label>
              <button
                className="icon-button"
                onClick={() => setAscending((value) => !value)}
                aria-label={ascending ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'}
              >
                {ascending ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              </button>
            </div>
          }
        />
        <div className="table-scroll">
          <table className="data-table client-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Клиент</th>
                <th>ABC</th>
                <th>Выручка</th>
                <th>Доля</th>
                <th>Сделки</th>
                <th>Ср. чек</th>
                <th>Последняя покупка</th>
                <th>Repeat rate</th>
                <th>Lifetime revenue</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((client, index) => (
                <tr key={client.id}>
                  <td className="muted-cell">{String(index + 1).padStart(2, '0')}</td>
                  <td>
                    <button
                      className="table-row-button"
                      onClick={() => onOpenClient(client.id)}
                      aria-label={`Открыть карточку клиента ${client.name}`}
                    >
                      <span className="deal-cell">
                        <strong>{client.name}</strong>
                        <span>{client.industry}</span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className={`abc-badge abc-badge--${client.abc.toLowerCase()}`}>
                      {client.abc}
                    </span>
                  </td>
                  <td>
                    <strong>{formatRub(client.revenue, true)}</strong>
                  </td>
                  <td>{client.share.toFixed(1)}%</td>
                  <td>{client.deals}</td>
                  <td>{formatRub(client.average, true)}</td>
                  <td>{client.last}</td>
                  <td>{client.repeat.toFixed(1)}%</td>
                  <td>{formatRub(client.lifetime, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="Клиенты не найдены" text="Измените поиск или ABC-фильтр." />
        ) : null}
      </Panel>
    </div>
  )
}

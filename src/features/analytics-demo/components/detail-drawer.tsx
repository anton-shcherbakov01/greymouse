'use client'

import { useEffect, useRef } from 'react'
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, X } from 'lucide-react'
import { ManagerTrend } from '@/features/analytics-demo/components/charts'
import { EmptyState, RiskBadge, Score } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import { classNames, formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

export type DrawerSelection = { type: 'manager' | 'deal' | 'client'; id: string } | null

export function DetailDrawer({
  selection,
  onClose,
  imported,
  model = demoDashboardModel,
}: {
  selection: DrawerSelection
  onClose: () => void
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
}) {
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!selection) return
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const selector =
      "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    const focusable = () =>
      Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(selector) ?? [])
    const frame = window.requestAnimationFrame(() => focusable()[0]?.focus())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      if (elements.length === 0) {
        event.preventDefault()
        drawerRef.current?.focus()
        return
      }
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
    window.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      previousFocus?.focus()
    }
  }, [onClose, selection])

  return (
    <div className={classNames('drawer-layer', selection && 'is-open')} aria-hidden={!selection}>
      <button className="drawer-backdrop" onClick={onClose} aria-label="Закрыть карточку" />
      <aside
        ref={drawerRef}
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Детальная информация"
        tabIndex={-1}
      >
        <button className="drawer-close icon-button" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
        {selection?.type === 'manager' ? (
          <ManagerDetail id={selection.id} imported={imported} model={model} />
        ) : null}
        {selection?.type === 'deal' ? (
          <DealDetail id={selection.id} imported={imported} model={model} />
        ) : null}
        {selection?.type === 'client' ? (
          <ClientDetail id={selection.id} imported={imported} model={model} />
        ) : null}
      </aside>
    </div>
  )
}

function monthLabels(asOf?: string) {
  if (!asOf) return ['Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг']
  const date = new Date(asOf)
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 6 + index, 1)))
      .replace('.', ''),
  )
}

function signed(value: number, suffix: string): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1).replace('.', ',')}${suffix}`
}

const IMPORT_STAGE_LABELS = {
  new: 'Новый лид',
  qualification: 'Квалификация',
  proposal: 'КП',
  invoice: 'Счёт',
  won: 'Оплата',
  lost: 'Проиграна',
} as const

function ManagerDetail({
  id,
  imported,
  model,
}: {
  id: string
  imported?: ImportedDashboardModel | null
  model: DemoDashboardModel
}) {
  const manager = imported
    ? imported.managers.find((item) => item.id === id)
    : (model.managerRows.find((item) => item.id === id) ?? model.managerRows[0])
  if (!manager)
    return (
      <div className="drawer-content">
        <EmptyState
          title="Менеджер не найден"
          text="Карточка отсутствует в текущем импортированном наборе."
        />
      </div>
    )
  const detail = imported ? null : model.managerDetails[manager.id]
  const managerRowsFromImport = imported?.rows.filter((row) => row.manager === manager.name) ?? []
  const managerClients = imported
    ? [...new Set(managerRowsFromImport.map((row) => row.client))]
        .map((name) => ({
          name,
          revenue: managerRowsFromImport
            .filter((row) => row.client === name && row.stage === 'won')
            .reduce((sum, row) => sum + row.amount, 0),
          industry:
            managerRowsFromImport.find((row) => row.client === name)?.region ?? 'Сегмент не указан',
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
    : (detail?.topClients ?? [])
  const importAsOf = new Date(imported?.asOf ?? model.asOf).getTime()
  const importedRecentDeals = [...managerRowsFromImport]
    .sort(
      (left, right) =>
        new Date(right.last_activity ?? right.closed_at ?? right.created_at).getTime() -
        new Date(left.last_activity ?? left.closed_at ?? left.created_at).getTime(),
    )
    .slice(0, 5)
    .map((deal) => ({
      id: deal.deal_id,
      client: deal.client,
      product: deal.product ?? `Сделка ${deal.deal_id}`,
      stage: IMPORT_STAGE_LABELS[deal.stage],
      amount: deal.amount,
      lastActivity: new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      })
        .format(new Date(deal.last_activity ?? deal.closed_at ?? deal.created_at))
        .replace('.', ''),
    }))
  const importedStaleDeals = managerRowsFromImport
    .filter((deal) => !['won', 'lost'].includes(deal.stage))
    .map((deal) => ({
      id: deal.deal_id,
      client: deal.client,
      product: deal.product ?? `Сделка ${deal.deal_id}`,
      stage: IMPORT_STAGE_LABELS[deal.stage],
      amount: deal.amount,
      inactivity: Math.max(
        0,
        Math.floor(
          (importAsOf - new Date(deal.last_activity ?? deal.created_at).getTime()) / 86_400_000,
        ),
      ),
    }))
    .filter((deal) => deal.inactivity >= 7)
    .sort((left, right) => right.inactivity - left.inactivity)
    .slice(0, 5)
  const recentDeals = imported ? importedRecentDeals : (detail?.recentDeals ?? [])
  const staleDeals = imported ? importedStaleDeals : (detail?.staleDeals ?? [])
  const teamWinRate =
    imported && imported.managers.length
      ? imported.managers.reduce((sum, item) => sum + item.winRate, 0) / imported.managers.length
      : model.managerSummary.departmentWinRate
  const teamScore =
    imported && imported.managers.length
      ? imported.managers.reduce((sum, item) => sum + item.score, 0) / imported.managers.length
      : model.managerSummary.averageScore
  const labels = monthLabels(imported?.asOf ?? model.asOf)
  const revenueChange = !imported && 'revenueChange' in manager ? manager.revenueChange : null
  const demoComparisons = detail?.comparisons
  return (
    <div className="drawer-content">
      <header className="drawer-person-header">
        <span className="avatar avatar--xl avatar--dark">{manager.initials}</span>
        <div>
          <p>Карточка менеджера</p>
          <h2>{manager.name}</h2>
          <span>
            {imported ? `Источник: ${imported.sourceName}` : 'Менеджер по ключевым клиентам'}
          </span>
        </div>
        <Score value={manager.score} />
      </header>
      <div className="drawer-kpis">
        <div>
          <span>Выручка</span>
          <strong>{formatRub(manager.revenue, true)}</strong>
          <small>
            {imported
              ? imported.periodLabel
              : revenueChange === null
                ? model.periodLabel
                : `${signed(revenueChange * 100, '%')} к сравнению`}
          </small>
        </div>
        <div>
          <span>План</span>
          <strong>{imported ? 'Не задан' : `${manager.planRate}%`}</strong>
          <small>{imported ? 'нет в импорте' : formatRub(manager.plan, true)}</small>
        </div>
        <div>
          <span>Win rate</span>
          <strong>{manager.winRate.toFixed(1)}%</strong>
          <small>{signed(manager.winRate - teamWinRate, ' п.п.')} к команде</small>
        </div>
        <div>
          <span>Pipeline</span>
          <strong>{formatRub(manager.pipeline, true)}</strong>
          <small>{manager.stale} сделок без движения</small>
        </div>
      </div>
      <section className="drawer-section">
        <header>
          <div>
            <span>Динамика</span>
            <h3>Продажи за 7 месяцев</h3>
          </div>
          <small>{imported ? 'по доступной истории' : model.periodLabel}</small>
        </header>
        <div className="drawer-chart">
          <ManagerTrend values={manager.trend} />
        </div>
        <div className="drawer-axis">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Воронка менеджера</span>
            <h3>{imported ? 'Текущие стадии' : 'Когортный путь к оплате'}</h3>
          </div>
        </header>
        <div className="drawer-funnel">
          {(imported
            ? imported.funnelStages.map((stage) => ({
                ...stage,
                count: managerRowsFromImport.filter((row) => row.stage === stage.id).length,
              }))
            : (detail?.funnel ?? [])
          ).map((stage) => {
            const max = imported ? Math.max(1, managerRowsFromImport.length) : 100
            return (
              <div key={stage.id}>
                <span>{stage.label}</span>
                <i>
                  <em
                    style={{
                      width: `${imported ? Math.max(4, (stage.count / max) * 100) : stage.width}%`,
                    }}
                  />
                </i>
                <strong>{stage.count}</strong>
              </div>
            )
          })}
        </div>
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Сравнение с отделом</span>
            <h3>{manager.name} относительно команды</h3>
          </div>
        </header>
        <div className="compare-list">
          {imported ? (
            <>
              <div>
                <span>Sales Score</span>
                <i>
                  <em style={{ width: `${manager.score}%` }} />
                </i>
                <strong>{signed(manager.score - teamScore, ' п.')}</strong>
              </div>
              <div>
                <span>Win rate</span>
                <i>
                  <em style={{ width: `${Math.min(manager.winRate * 2, 100)}%` }} />
                </i>
                <strong>{signed(manager.winRate - teamWinRate, ' п.п.')}</strong>
              </div>
              <div>
                <span>Средний цикл</span>
                <i>
                  <em
                    style={{
                      width: manager.cycle === null ? '0%' : `${Math.min(manager.cycle, 100)}%`,
                    }}
                  />
                </i>
                <strong>{manager.cycle === null ? '—' : `${manager.cycle} дн.`}</strong>
              </div>
              <div>
                <span>Без движения</span>
                <i>
                  <em style={{ width: `${Math.min(manager.stale * 10, 100)}%` }} />
                </i>
                <strong>{manager.stale}</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span>Выполнение плана</span>
                <i>
                  <em style={{ width: `${Math.min(manager.planRate, 100)}%` }} />
                </i>
                <strong>{signed(demoComparisons?.planPoints ?? 0, ' п.п.')}</strong>
              </div>
              <div>
                <span>Win rate</span>
                <i>
                  <em style={{ width: `${Math.min(manager.winRate * 2, 100)}%` }} />
                </i>
                <strong>{signed(demoComparisons?.winRatePoints ?? 0, ' п.п.')}</strong>
              </div>
              <div>
                <span>Средний цикл</span>
                <i>
                  <em
                    style={{
                      width: manager.cycle === null ? '0%' : `${Math.min(manager.cycle, 100)}%`,
                    }}
                  />
                </i>
                <strong>{signed(demoComparisons?.cycleDays ?? 0, ' дн.')}</strong>
              </div>
              <div>
                <span>Гигиена CRM</span>
                <i>
                  <em
                    style={{ width: `${'hygieneScore' in manager ? manager.hygieneScore : 0}%` }}
                  />
                </i>
                <strong>{signed(demoComparisons?.hygienePoints ?? 0, ' п.')}</strong>
              </div>
            </>
          )}
        </div>
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Крупнейшие клиенты</span>
            <h3>Топ-3 по выручке</h3>
          </div>
        </header>
        <div className="drawer-list">
          {managerClients.map((client) => (
            <div className="drawer-list-row" key={client.name}>
              <span>
                <strong>{client.name}</strong>
                <small>{client.industry}</small>
              </span>
              <em>{formatRub(client.revenue, true)}</em>
              <ArrowUpRight size={14} />
            </div>
          ))}
        </div>
        {managerClients.length === 0 ? (
          <EmptyState
            title="Нет оплат"
            text="У менеджера нет выигранных сделок в доступной истории."
          />
        ) : null}
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Последняя активность</span>
            <h3>Последние сделки</h3>
          </div>
          <small>{recentDeals.length} записей</small>
        </header>
        <div className="drawer-list">
          {recentDeals.map((deal) => (
            <div className="drawer-list-row" key={deal.id}>
              <span>
                <strong>{deal.client}</strong>
                <small>
                  {deal.product} · {deal.stage} · {deal.lastActivity}
                </small>
              </span>
              <em>{formatRub(deal.amount, true)}</em>
              <ArrowUpRight size={14} />
            </div>
          ))}
        </div>
        {recentDeals.length === 0 ? (
          <EmptyState title="Нет сделок" text="В доступном периоде у менеджера нет сделок." />
        ) : null}
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Контроль pipeline</span>
            <h3>Зависшие сделки</h3>
          </div>
          <small>7+ дней без активности</small>
        </header>
        <div className="drawer-list">
          {staleDeals.map((deal) => (
            <div className="drawer-list-row drawer-list-row--risk" key={deal.id}>
              <span>
                <strong>{deal.client}</strong>
                <small>
                  {deal.product} · {deal.stage} · {deal.inactivity} дней без движения
                </small>
              </span>
              <em>{formatRub(deal.amount, true)}</em>
              <Clock3 size={14} />
            </div>
          ))}
        </div>
        {staleDeals.length === 0 ? (
          <EmptyState
            title="Зависших сделок нет"
            text="Все активные сделки менеджера обновлялись за последние 7 дней."
          />
        ) : null}
      </section>
    </div>
  )
}

function DealDetail({
  id,
  imported,
  model,
}: {
  id: string
  imported?: ImportedDashboardModel | null
  model: DemoDashboardModel
}) {
  const deal = imported
    ? imported.riskDeals.find((item) => item.id === id)
    : (model.riskDeals.find((item) => item.id === id) ?? model.riskDeals[0])
  if (!deal)
    return (
      <div className="drawer-content">
        <EmptyState
          title="Сделка не найдена"
          text="Карточка отсутствует в текущем импортированном наборе."
        />
      </div>
    )
  const raw = imported?.rows.find((row) => row.deal_id === id)
  const importedEvents = raw
    ? [
        { title: 'Последняя активность', date: deal.lastActivity, detail: raw.manager },
        {
          title: 'Сделка создана',
          date: new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(raw.created_at)),
          detail: raw.source ?? 'Источник не указан',
        },
        ...(raw.closed_at
          ? [
              {
                title: 'Сделка закрыта',
                date: new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(raw.closed_at)),
                detail: raw.stage === 'won' ? 'Оплата' : 'Проиграна',
              },
            ]
          : []),
      ]
    : []
  return (
    <div className="drawer-content">
      <header className="drawer-title-header">
        <p>Сделка · {deal.id}</p>
        <h2>{deal.deal}</h2>
        <span>{deal.client}</span>
        <RiskBadge level={deal.level} />
      </header>
      <div className="drawer-kpis drawer-kpis--three">
        <div>
          <span>Сумма</span>
          <strong>{formatRub(deal.amount, true)}</strong>
        </div>
        <div>
          <span>Вероятность</span>
          <strong>{deal.probability}%</strong>
        </div>
        <div>
          <span>Risk score</span>
          <strong className="negative-text">{deal.score}</strong>
        </div>
      </div>
      <div className="risk-explanation">
        <span>
          <Clock3 size={18} />
        </span>
        <div>
          <small>Причина риска</small>
          <strong>{deal.reason}</strong>
          <p>
            {imported
              ? `Последняя активность была ${deal.inactivity} дней назад. Возраст сделки — ${deal.days} дней; история смены стадий не импортирована.`
              : `Последняя активность была ${deal.inactivity} дней назад; на этапе «${deal.stage}» сделка находится ${deal.days} дней.`}
          </p>
        </div>
      </div>
      <section className="drawer-section">
        <header>
          <div>
            <span>Текущий статус</span>
            <h3>Этап сделки</h3>
          </div>
        </header>
        <div className="deal-timeline">
          {['Новый лид', 'Квалификация', 'КП', 'Счёт', 'Оплата'].map((stage, index) => {
            const activeIndex = ['Новый лид', 'Квалификация', 'КП', 'Счёт', 'Оплата'].indexOf(
              deal.stage,
            )
            return (
              <div
                className={classNames(
                  index < activeIndex && 'is-done',
                  index === activeIndex && 'is-current',
                )}
                key={stage}
              >
                <i>{index < activeIndex ? <CheckCircle2 size={14} /> : index + 1}</i>
                <span>{stage}</span>
              </div>
            )
          })}
        </div>
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Активность</span>
            <h3>Последние события</h3>
          </div>
        </header>
        {imported ? (
          <div className="activity-timeline">
            {importedEvents.map((event, index) => (
              <div key={`${event.title}-${index}`}>
                <i>
                  <CalendarClock size={14} />
                </i>
                <span>
                  <strong>{event.title}</strong>
                  <small>
                    {event.date} · {event.detail}
                  </small>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="activity-timeline">
            <div>
              <i>
                <CalendarClock size={14} />
              </i>
              <span>
                <strong>Последняя активность</strong>
                <small>
                  {deal.lastActivity} · {deal.manager}
                </small>
              </span>
            </div>
            <div>
              <i>
                <Clock3 size={14} />
              </i>
              <span>
                <strong>Время на текущем этапе</strong>
                <small>
                  {deal.days} дней · {deal.stage}
                </small>
              </span>
            </div>
            <div>
              <i>
                <Clock3 size={14} />
              </i>
              <span>
                <strong>Risk score пересчитан</strong>
                <small>
                  {model.updatedLabel} · {deal.score} из 100
                </small>
              </span>
            </div>
          </div>
        )}
      </section>
      <div className="drawer-actions">
        <span className="quiet-tag">
          {imported ? `ID: ${deal.id}` : 'CRM-действия появятся после подключения источника'}
        </span>
      </div>
    </div>
  )
}

function ClientDetail({
  id,
  imported,
  model,
}: {
  id: string
  imported?: ImportedDashboardModel | null
  model: DemoDashboardModel
}) {
  const client = imported
    ? imported.clients.find((item) => item.id === id)
    : (model.clients.find((item) => item.id === id) ?? model.clients[0])
  if (!client)
    return (
      <div className="drawer-content">
        <EmptyState
          title="Клиент не найден"
          text="Карточка отсутствует в текущем импортированном наборе."
        />
      </div>
    )
  const clientDeals =
    imported?.rows
      .filter((row) => row.client === client.name)
      .sort(
        (a, b) =>
          new Date(b.last_activity ?? b.closed_at ?? b.created_at).getTime() -
          new Date(a.last_activity ?? a.closed_at ?? a.created_at).getTime(),
      )
      .slice(0, 3) ?? []
  const labels = monthLabels(imported?.asOf ?? model.asOf)
  const demoClientDeals = model.riskDeals.filter((deal) => deal.clientId === client.id).slice(0, 3)
  return (
    <div className="drawer-content">
      <header className="drawer-title-header">
        <p>Карточка клиента</p>
        <h2>{client.name}</h2>
        <span>
          {client.industry} · ABC-класс {client.abc}
        </span>
        <span className={`abc-badge abc-badge--${client.abc.toLowerCase()}`}>{client.abc}</span>
      </header>
      <div className="drawer-kpis">
        <div>
          <span>Выручка периода</span>
          <strong>{formatRub(client.revenue, true)}</strong>
          <small>{client.share.toFixed(1)}% оборота</small>
        </div>
        <div>
          <span>Lifetime revenue</span>
          <strong>{formatRub(client.lifetime, true)}</strong>
          <small>{imported ? 'по доступной истории' : 'за 24 месяца'}</small>
        </div>
        <div>
          <span>Средний чек</span>
          <strong>{formatRub(client.average, true)}</strong>
          <small>{client.deals} оплат за период</small>
        </div>
        <div>
          <span>Repeat rate</span>
          <strong>{client.repeat.toFixed(1)}%</strong>
          <small>последняя: {client.last}</small>
        </div>
      </div>
      <section className="drawer-section">
        <header>
          <div>
            <span>История отношений</span>
            <h3>Выручка за 7 месяцев</h3>
          </div>
          <small>{imported ? 'по доступной истории' : model.periodLabel}</small>
        </header>
        <div className="drawer-chart">
          <ManagerTrend values={client.trend} />
        </div>
        <div className="drawer-axis">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
      <section className="drawer-section">
        <header>
          <div>
            <span>Сделки</span>
            <h3>{imported ? 'Последняя активность' : 'Под риском без движения'}</h3>
          </div>
        </header>
        <div className="drawer-list">
          {imported
            ? clientDeals.map((deal) => (
                <div className="drawer-list-row" key={deal.deal_id}>
                  <span>
                    <strong>{deal.product ?? `Сделка ${deal.deal_id}`}</strong>
                    <small>
                      {
                        (
                          {
                            new: 'Новый лид',
                            qualification: 'Квалификация',
                            proposal: 'КП',
                            invoice: 'Счёт',
                            won: 'Оплата',
                            lost: 'Проиграна',
                          } as const
                        )[deal.stage]
                      }{' '}
                      · {deal.manager}
                    </small>
                  </span>
                  <em>{formatRub(deal.amount, true)}</em>
                  <ArrowUpRight size={14} />
                </div>
              ))
            : demoClientDeals.map((deal) => (
                <div className="drawer-list-row" key={deal.id}>
                  <span>
                    <strong>{deal.deal}</strong>
                    <small>
                      {deal.stage} · {deal.manager}
                    </small>
                  </span>
                  <em>{formatRub(deal.amount, true)}</em>
                  <ArrowUpRight size={14} />
                </div>
              ))}
        </div>
        {(imported ? clientDeals.length === 0 : demoClientDeals.length === 0) ? (
          <EmptyState
            title="Нет сделок"
            text={
              imported
                ? 'Для клиента нет строк в текущем наборе.'
                : 'У клиента нет активных сделок без движения более 7 дней.'
            }
          />
        ) : null}
      </section>
    </div>
  )
}

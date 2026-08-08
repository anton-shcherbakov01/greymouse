'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeRussianRuble,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { LostReasonsChart, SourceRevenueChart } from '@/features/analytics-demo/components/charts'
import { EmptyState, Panel, PanelHeader } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import { formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

export function SalesView({
  imported,
  model = demoDashboardModel,
  onOpenDeals,
}: {
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
  onOpenDeals?: () => void
}) {
  const [sourceSort, setSourceSort] = useState<
    'revenue' | 'conversion' | 'leads' | 'sales' | 'average'
  >('revenue')
  const [sourceAscending, setSourceAscending] = useState(false)
  const sourceRows = imported?.sources ?? model.sources
  const activeSources = useMemo(
    () =>
      [...sourceRows].sort(
        (left, right) => (left[sourceSort] - right[sourceSort]) * (sourceAscending ? 1 : -1),
      ),
    [sourceAscending, sourceRows, sourceSort],
  )
  const activeLostReasons = imported?.lostReasons ?? model.lostReasons
  const lostTotal = activeLostReasons.reduce((sum, reason) => sum + reason.amount, 0)
  const bestSource = imported
    ? [...activeSources].sort((a, b) => b.conversion - a.conversion || b.revenue - a.revenue)[0]
    : model.salesSummary.bestSource
  const weakestSource = imported
    ? [...activeSources].sort((a, b) => a.conversion - b.conversion || b.leads - a.leads)[0]
    : model.salesSummary.weakSource
  const maxSourceRevenue = Math.max(1, ...activeSources.map((source) => source.revenue))
  const salesRevenue = imported?.revenue ?? model.salesSummary.revenue
  const change = imported
    ? imported.previousRevenue
      ? ((imported.revenue - imported.previousRevenue) / imported.previousRevenue) * 100
      : null
    : model.salesSummary.revenueChange === null
      ? null
      : model.salesSummary.revenueChange * 100
  return (
    <div className="view-stack">
      <section className="summary-line summary-line--five">
        <div>
          <span>Выручка</span>
          <strong>{formatRub(salesRevenue, true)}</strong>
          <small
            className={
              change === null ? undefined : change >= 0 ? 'positive-text' : 'negative-text'
            }
          >
            {change === null ? (
              'нет базы сравнения'
            ) : (
              <>
                {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{' '}
                {change >= 0 ? '+' : ''}
                {change.toFixed(1).replace('.', ',')}%
              </>
            )}
          </small>
        </div>
        <div>
          <span>План</span>
          <strong>
            {imported
              ? 'Не задан'
              : `${(model.salesSummary.planAchievement * 100).toFixed(1).replace('.', ',')}%`}
          </strong>
          <small>
            {imported
              ? 'нет поля плана'
              : `${formatRub(model.salesSummary.revenue, true)} из ${formatRub(model.salesSummary.plan, true)}`}
          </small>
        </div>
        <div>
          <span>Прогноз</span>
          <strong>{formatRub(imported?.forecast ?? model.salesSummary.forecast, true)}</strong>
          <small
            className={
              !imported && model.salesSummary.forecastGap < 0 ? 'negative-text' : undefined
            }
          >
            {imported ? (
              'по темпу периода'
            ) : (
              <>
                {model.salesSummary.forecastGap < 0 ? (
                  <TrendingDown size={12} />
                ) : (
                  <TrendingUp size={12} />
                )}{' '}
                {model.salesSummary.forecastGap >= 0 ? '+' : '−'}
                {formatRub(Math.abs(model.salesSummary.forecastGap), true)}
              </>
            )}
          </small>
        </div>
        <div>
          <span>Новые продажи</span>
          <strong>{formatRub(imported?.newRevenue ?? model.salesSummary.newRevenue, true)}</strong>
          <small>
            {salesRevenue
              ? (((imported?.newRevenue ?? model.salesSummary.newRevenue) / salesRevenue) * 100)
                  .toFixed(1)
                  .replace('.', ',')
              : '0'}
            % выручки
          </small>
        </div>
        <div>
          <span>Повторные</span>
          <strong>
            {formatRub(imported?.repeatRevenue ?? model.salesSummary.repeatRevenue, true)}
          </strong>
          <small>
            {imported
              ? 'клиенты с прошлой оплатой'
              : model.salesSummary.repeatRevenueChange === null
                ? 'нет базы сравнения'
                : `${model.salesSummary.repeatRevenueChange >= 0 ? '+' : '−'}${Math.abs(
                    model.salesSummary.repeatRevenueChange * 100,
                  )
                    .toFixed(1)
                    .replace('.', ',')}%`}
          </small>
        </div>
      </section>

      <div className="two-column-grid two-column-grid--sales">
        <Panel>
          <PanelHeader
            eyebrow="Каналы привлечения"
            title="Источники продаж"
            description="Выручка и результативность по источникам"
          />
          {activeSources.length ? (
            <SourceRevenueChart data={activeSources} />
          ) : (
            <EmptyState
              title="Нет данных по источникам"
              text="Поле «Источник» не заполнено для сделок выбранного периода."
            />
          )}
        </Panel>
        <Panel className="source-insight-panel">
          <PanelHeader eyebrow="Качество источников" title="Не все лиды одинаково ценны" />
          <div className="source-insight-feature">
            <span>
              <Target size={18} />
            </span>
            <div>
              <small>Лучшая конверсия</small>
              <strong>{bestSource?.source ?? 'Нет данных'}</strong>
              <p>
                {bestSource
                  ? `${bestSource.conversion.toFixed(1)}% · чек ${formatRub(bestSource.average, true)}`
                  : 'Источники не заполнены'}
              </p>
            </div>
          </div>
          <div className="source-insight-feature source-insight-feature--risk">
            <span>
              <TrendingDown size={18} />
            </span>
            <div>
              <small>Требует проверки</small>
              <strong>{weakestSource?.source ?? 'Нет данных'}</strong>
              <p>
                {weakestSource
                  ? `${weakestSource.leads} сделок · ${weakestSource.conversion.toFixed(1)}% конверсия`
                  : 'Недостаточно данных'}
              </p>
            </div>
          </div>
          {onOpenDeals ? (
            <button className="secondary-button secondary-button--full" onClick={onOpenDeals}>
              Открыть сделки под риском
              <ArrowRight size={14} />
            </button>
          ) : null}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          eyebrow="Лиды · продажи · выручка"
          title="Эффективность каналов"
          action={
            <div className="table-tools">
              <label className="compact-select">
                <SlidersHorizontal size={14} />
                <span className="sr-only">Сортировка источников</span>
                <select
                  value={sourceSort}
                  onChange={(event) => setSourceSort(event.target.value as typeof sourceSort)}
                >
                  <option value="revenue">По выручке</option>
                  <option value="conversion">По конверсии</option>
                  <option value="leads">По лидам</option>
                  <option value="sales">По продажам</option>
                  <option value="average">По среднему чеку</option>
                </select>
              </label>
              <button
                className="icon-button"
                onClick={() => setSourceAscending((value) => !value)}
                aria-label={
                  sourceAscending ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'
                }
              >
                {sourceAscending ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              </button>
            </div>
          }
        />
        <div className="table-scroll">
          <table className="data-table source-table">
            <thead>
              <tr>
                <th>Источник</th>
                <th>Лиды</th>
                <th>Продажи</th>
                <th>Конверсия</th>
                <th>Выручка</th>
                <th>Средний чек</th>
                <th>Вклад</th>
              </tr>
            </thead>
            <tbody>
              {activeSources.map((source) => (
                <tr key={source.source}>
                  <td>
                    <strong>{source.source}</strong>
                  </td>
                  <td>{source.leads}</td>
                  <td>{source.sales}</td>
                  <td>
                    <span
                      className={
                        source.conversion < 10
                          ? 'negative-text strong-text'
                          : source.conversion > 25
                            ? 'positive-text strong-text'
                            : undefined
                      }
                    >
                      {source.conversion.toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <strong>{formatRub(source.revenue, true)}</strong>
                  </td>
                  <td>{formatRub(source.average, true)}</td>
                  <td>
                    <div className="share-bar">
                      <i>
                        <span style={{ width: `${(source.revenue / maxSourceRevenue) * 100}%` }} />
                      </i>
                      <small>
                        {salesRevenue ? ((source.revenue / salesRevenue) * 100).toFixed(1) : '0'}%
                      </small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeSources.length === 0 ? (
          <EmptyState
            title="Источники не найдены"
            text="Добавьте поле source при следующем импорте."
          />
        ) : null}
      </Panel>

      <div className="two-column-grid two-column-grid--balanced">
        <Panel>
          <PanelHeader
            eyebrow="Потерянные продажи"
            title={`${formatRub(lostTotal, true)} потенциальной выручки`}
            description={`${imported?.lostCount ?? model.salesSummary.lostCount} проигранных сделок за период`}
          />
          {activeLostReasons.length ? (
            <LostReasonsChart data={activeLostReasons} />
          ) : (
            <EmptyState
              title="Нет проигранных сделок"
              text="В выбранном периоде нет строк со стадией «Проиграна»."
            />
          )}
        </Panel>
        <Panel>
          <PanelHeader eyebrow="Интерпретация" title="Почему мы теряем" />
          <div className="loss-summary">
            <span className="loss-summary-icon">
              <BadgeRussianRuble size={19} />
            </span>
            <div>
              <strong>
                {imported
                  ? (activeLostReasons[0]?.reason ?? 'Причины не зафиксированы')
                  : `${(model.salesSummary.manageableLossShare * 100).toFixed(0)}% потерь в зоне влияния`}
              </strong>
              <p>
                {imported
                  ? activeLostReasons[0]
                    ? `Крупнейшая категория потерь: ${formatRub(activeLostReasons[0].amount, true)} и ${activeLostReasons[0].deals} сделок.`
                    : 'Нет данных для интерпретации потерь выбранного периода.'
                  : `Цена и сроки составляют ${formatRub(model.salesSummary.manageableLossAmount, true)} потенциальной выручки.`}
              </p>
            </div>
          </div>
          <div className="reason-list">
            {activeLostReasons.slice(0, 4).map((reason, index) => (
              <div key={reason.reason}>
                <span>0{index + 1}</span>
                <strong>{reason.reason}</strong>
                <em>{reason.deals} сделок</em>
                <small>{formatRub(reason.amount, true)}</small>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

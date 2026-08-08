'use client'

import { useState } from 'react'
import { ArrowRight, ChevronRight, CircleAlert, TrendingDown, TrendingUp } from 'lucide-react'
import { MiniTrend, RevenueChart } from '@/features/analytics-demo/components/charts'
import {
  EmptyState,
  MetricDefinition,
  Panel,
  PanelHeader,
} from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DashboardView,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import {
  classNames,
  formatNumberRu,
  formatRub,
} from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import/dashboard'

export function OverviewView({
  onNavigate,
  onOpenManager,
  imported,
  onResetImported,
  model = demoDashboardModel,
}: {
  onNavigate: (view: DashboardView) => void
  onOpenManager: (managerId: string) => void
  imported?: ImportedDashboardModel | null
  onResetImported?: () => void
  model?: DemoDashboardModel
}) {
  const [chartMode, setChartMode] = useState<'day' | 'week' | 'month'>('day')
  const insights = (imported?.insights ?? model.overviewInsights).slice(0, 4)
  const activeKpis = imported?.kpis ?? model.kpis
  const activeRevenueSeries = imported?.revenueSeries ?? model.revenueSeries
  const activeFunnelStages = imported?.funnelStages ?? model.funnelStages
  const activeMoneyAtRisk = imported?.moneyAtRisk ?? model.moneyAtRisk
  const hasPreviousPeriod = activeRevenueSeries.some((point) => point.previous !== null)
  const riskTotal = activeMoneyAtRisk.reduce((sum, item) => sum + item.amount, 0)
  const weakestFunnelStage = activeFunnelStages
    .slice(0, -1)
    .filter((stage) => stage.conversion !== null)
    .sort((a, b) => (a.conversion ?? 100) - (b.conversion ?? 100))[0]

  return (
    <div className="view-stack">
      {imported ? (
        <section className="import-data-banner" aria-label="Активный импортированный набор данных">
          <span className="health-dot" />
          <div>
            <strong>Обзор рассчитан по «{imported.sourceName}»</strong>
            <small>
              {formatNumberRu(imported.rowCount)} сделок · период{' '}
              {imported.periodLabel.toLowerCase()}
            </small>
          </div>
          {onResetImported ? (
            <button className="text-link" onClick={onResetImported}>
              Вернуть demo dataset
            </button>
          ) : null}
        </section>
      ) : null}
      <section className="kpi-strip" aria-label="Ключевые показатели">
        {activeKpis.map((kpi) => (
          <article className="kpi-cell" key={kpi.id}>
            <div className="kpi-topline">
              {kpi.info ? (
                <MetricDefinition label={kpi.label} definition={kpi.info} />
              ) : (
                <span className="kpi-label">{kpi.label}</span>
              )}
              {kpi.spark ? (
                <MiniTrend values={kpi.spark} negative={kpi.tone === 'negative'} />
              ) : null}
            </div>
            <strong className="kpi-value">{kpi.value}</strong>
            <div className="kpi-context">
              <span className={classNames('delta', `delta--${kpi.tone}`)}>
                {kpi.tone === 'positive' ? (
                  <TrendingUp size={12} />
                ) : kpi.tone === 'negative' ? (
                  <TrendingDown size={12} />
                ) : null}
                {kpi.delta}
              </span>
              <span>{kpi.context}</span>
            </div>
            {kpi.progress ? (
              <div className="kpi-progress">
                <span style={{ width: `${kpi.progress}%` }} />
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <div className="overview-grid">
        <Panel className="revenue-panel">
          <PanelHeader
            eyebrow="Факт · план · прогноз"
            title="Выручка и прогноз"
            description="Накопительный итог, млн ₽"
            action={
              <div className="segmented" role="group" aria-label="Группировка графика">
                {(['day', 'week', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={chartMode === mode ? 'is-active' : undefined}
                    onClick={() => setChartMode(mode)}
                  >
                    {{ day: 'День', week: 'Неделя', month: 'Месяц' }[mode]}
                  </button>
                ))}
              </div>
            }
          />
          <div className="chart-legend" aria-label="Легенда">
            <span>
              <i className="legend-line legend-line--actual" />
              Факт
            </span>
            <span>
              <i className="legend-line legend-line--plan" />
              План
            </span>
            <span>
              <i className="legend-line legend-line--forecast" />
              Прогноз
            </span>
            <span>
              <i className="legend-line legend-line--previous" />
              {hasPreviousPeriod
                ? imported
                  ? 'Предыдущий период'
                  : (model.comparisonLabel ?? 'Предыдущий период')
                : 'Без сравнения'}
            </span>
            <span className="chart-status">
              <i />
              {imported?.chartStatus ?? model.chartStatus}
            </span>
          </div>
          <RevenueChart
            data={activeRevenueSeries}
            mode={chartMode}
            monthLabel={imported?.monthShort ? `${imported.monthShort}.` : model.periodShort}
          />
        </Panel>

        <Panel className="insights-panel">
          <PanelHeader
            eyebrow="Автоматическая интерпретация"
            title="Что происходит"
            description="Главное, что требует решения сегодня"
          />
          <div className="insight-list">
            {insights.map((insight, index) => (
              <article
                className={classNames('insight-item', `insight-item--${insight.tone}`)}
                key={insight.id}
              >
                <div className="insight-index">0{index + 1}</div>
                <div className="insight-content">
                  <span className="insight-eyebrow">{insight.eyebrow}</span>
                  <h3>{insight.title}</h3>
                  <p>{insight.text}</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      insight.category === 'managers' && insight.entityIds[0]
                        ? onOpenManager(insight.entityIds[0])
                        : onNavigate(insight.target)
                    }
                  >
                    {insight.action}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="insight-meta">
            <span className="health-dot" />
            {imported
              ? `Пересчитано по ${formatNumberRu(imported.rowCount)} сделкам · ${imported.sourceName}`
              : `Пересчитано по ${formatNumberRu(model.recordCount)} сделкам · ${model.updatedLabel}`}
          </div>
        </Panel>
      </div>

      <div className="overview-bottom-grid">
        <Panel className="funnel-overview">
          <PanelHeader
            eyebrow="Активная воронка"
            title="Путь к оплате"
            description="Конверсия между этапами и скорость движения"
            action={
              <button className="text-link" onClick={() => onNavigate('funnel')}>
                Вся воронка
                <ChevronRight size={14} />
              </button>
            }
          />
          <div className="funnel-table funnel-table--compact">
            <div className="funnel-head">
              <span>Этап</span>
              <span>Сделки</span>
              <span>Сумма</span>
              <span>В следующий</span>
              <span>Ср. время</span>
            </div>
            {activeFunnelStages.map((stage, index) => (
              <div
                className={classNames(
                  'funnel-row',
                  (imported
                    ? stage.id === weakestFunnelStage?.id
                    : stage.id === model.funnelSummary.problemStageId) && 'is-problem',
                )}
                key={stage.id}
              >
                <div className="funnel-stage-name">
                  <span className="stage-number">{index + 1}</span>
                  <strong>{stage.label}</strong>
                </div>
                <span>{stage.count}</span>
                <span>{formatRub(stage.amount, true)}</span>
                <span
                  className={
                    (
                      imported
                        ? stage.id === weakestFunnelStage?.id
                        : stage.id === model.funnelSummary.problemStageId
                    )
                      ? 'text-danger'
                      : undefined
                  }
                >
                  {stage.conversion === null
                    ? '—'
                    : `${stage.conversion.toFixed(imported ? 1 : 0)}%`}
                </span>
                <span>{stage.days === null ? '—' : `${stage.days} дн.`}</span>
                <div className="funnel-track">
                  <span style={{ width: `${stage.width}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button className="funnel-alert" onClick={() => onNavigate('funnel')}>
            <CircleAlert size={16} />
            <span>
              {imported ? (
                <>
                  <strong>Snapshot текущих стадий</strong>История переходов не импортирована
                </>
              ) : (
                <>
                  <strong>
                    {model.funnelSummary.problemFrom} → {model.funnelSummary.problemTo}:{' '}
                    {(model.funnelSummary.problemRate * 100).toFixed(0)}%
                  </strong>
                  {model.comparisonLabel
                    ? `Изменение: ${model.funnelSummary.problemDeltaPoints > 0 ? '+' : model.funnelSummary.problemDeltaPoints < 0 ? '−' : ''}${Math.abs(model.funnelSummary.problemDeltaPoints).toFixed(0)} п.п.`
                    : 'Сравнение периодов отключено'}
                </>
              )}
            </span>
            <ChevronRight size={16} />
          </button>
        </Panel>

        <Panel className="money-risk-panel">
          <PanelHeader
            eyebrow="Риск активной выручки"
            title="Деньги под риском"
            action={
              <button className="text-link" onClick={() => onNavigate('deals')}>
                К сделкам
                <ChevronRight size={14} />
              </button>
            }
          />
          <div className="risk-total">
            <strong>{formatRub(riskTotal)}</strong>
            <span>
              {imported
                ? `${imported.pipeline ? ((riskTotal / imported.pipeline) * 100).toFixed(1) : '0'}% активного pipeline`
                : `${(model.riskSummary.pipelineShare * 100).toFixed(1).replace('.', ',')}% активного pipeline · ${model.riskSummary.count} сделок`}
            </span>
          </div>
          <div className="risk-stacked" aria-label="Распределение денег под риском">
            {activeMoneyAtRisk.map((item) => (
              <span
                key={item.label}
                className={`risk-segment risk-segment--${item.tone}`}
                style={{ width: `${item.share}%` }}
              />
            ))}
          </div>
          <div className="risk-breakdown">
            {activeMoneyAtRisk.map((item) => (
              <button key={item.label} onClick={() => onNavigate('deals')}>
                <i className={`risk-dot risk-dot--${item.tone}`} />
                <span>{item.label}</span>
                <strong>{formatRub(item.amount, true)}</strong>
                <em>{item.share}%</em>
              </button>
            ))}
          </div>
          {imported && activeMoneyAtRisk.length === 0 ? (
            <EmptyState
              title="Рисковые сделки не найдены"
              text="Текущие правила не обнаружили просрочку, низкую вероятность или чрезмерный возраст активных сделок."
            />
          ) : null}
          <p className="risk-note">
            <TrendingDown size={15} />{' '}
            {imported
              ? `${imported.staleCount} сделок на ${formatRub(imported.staleAmount, true)} не обновлялись более 7 дней.`
              : `${formatRub(model.riskSummary.recoverableWeighted, true)} — взвешенный потенциал ${model.riskSummary.priorityCount} приоритетных сделок.`}
          </p>
        </Panel>
      </div>
    </div>
  )
}

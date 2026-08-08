'use client'

import { ArrowDownRight, ArrowRight, Clock3, CircleAlert, MoveDown } from 'lucide-react'
import { EmptyState, Panel, PanelHeader } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import { classNames, formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

export function FunnelView({
  imported,
  model = demoDashboardModel,
}: {
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
}) {
  const stages = imported?.funnelStages ?? model.funnelStages
  const transitions = stages.slice(0, -1).map((stage, index) => ({
    from: stage,
    to: stages[index + 1],
    conversion: stage.conversion,
  }))
  const weakest = transitions
    .filter((item) => item.conversion !== null)
    .sort((a, b) => (a.conversion ?? 100) - (b.conversion ?? 100))[0]
  const won = stages.find((stage) => stage.id === 'won')?.count ?? 0
  const snapshotLosses = transitions.map(({ from, to }) => {
    const value = Math.max(0, from.amount - to.amount)
    return {
      label: `${from.label} → ${to.label}`,
      value,
      rate: from.amount ? (value / from.amount) * 100 : 0,
      risk: weakest?.from.id === from.id,
    }
  })
  const problemId = imported ? weakest?.from.id : model.funnelSummary.problemStageId
  const stageLosses = imported ? snapshotLosses : model.funnelLosses
  return (
    <div className="view-stack">
      <section className="summary-line summary-line--five">
        <div>
          <span>{imported ? 'Сделок в наборе' : 'Лиды'}</span>
          <strong>{imported?.rowCount ?? model.funnelSummary.leads}</strong>
          <small>
            {imported
              ? 'после валидации'
              : model.funnelSummary.leadsChange === null
                ? 'без сравнения'
                : `${model.funnelSummary.leadsChange >= 0 ? '+' : '−'}${Math.abs(
                    model.funnelSummary.leadsChange * 100,
                  )
                    .toFixed(1)
                    .replace('.', ',')}% к сравнению`}
          </small>
        </div>
        <div>
          <span>Оплаты</span>
          <strong>{won}</strong>
          <small>
            {imported
              ? `за ${imported.periodLabel.toLowerCase()}`
              : `${(model.funnelSummary.endToEndConversion * 100).toFixed(1).replace('.', ',')}% от лидов`}
          </small>
        </div>
        <div>
          <span>Pipeline</span>
          <strong>{formatRub(imported?.pipeline ?? model.funnelSummary.pipeline, true)}</strong>
          <small>
            {formatRub(imported?.weightedPipeline ?? model.funnelSummary.weightedPipeline, true)}{' '}
            weighted
          </small>
        </div>
        <div>
          <span>Средний цикл</span>
          <strong>
            {imported
              ? 'Нет данных'
              : `${model.funnelSummary.averageCycleDays.toFixed(1).replace('.', ',')} дня`}
          </strong>
          <small
            className={
              imported || !model.comparisonLabel
                ? undefined
                : model.funnelSummary.averageCycleDays >
                    model.funnelSummary.previousAverageCycleDays
                  ? 'warning-text'
                  : 'positive-text'
            }
          >
            {imported
              ? 'нет истории смены стадий'
              : !model.comparisonLabel
                ? 'без сравнения'
                : `${model.funnelSummary.averageCycleDays - model.funnelSummary.previousAverageCycleDays >= 0 ? '+' : '−'}${Math.abs(
                    model.funnelSummary.averageCycleDays -
                      model.funnelSummary.previousAverageCycleDays,
                  )
                    .toFixed(1)
                    .replace('.', ',')} дня`}
          </small>
        </div>
        <div>
          <span>Главный отвал</span>
          <strong>
            {weakest ? `${weakest.from.label} → ${weakest.to.label}` : 'Недостаточно данных'}
          </strong>
          <small className="negative-text">
            {weakest?.conversion === null || weakest?.conversion === undefined
              ? '—'
              : `${(100 - weakest.conversion).toFixed(0)}% не перешли`}
          </small>
        </div>
      </section>

      <Panel className="funnel-workbench">
        <PanelHeader
          eyebrow={
            imported
              ? 'Снимок текущих стадий'
              : `Сквозная конверсия ${(model.funnelSummary.endToEndConversion * 100).toFixed(1).replace('.', ',')}%`
          }
          title="Воронка продаж"
          description={
            imported
              ? `${imported.periodLabel} · источник «${imported.sourceName}»`
              : `${model.periodLabel}${model.comparisonLabel ? ` · сравнение: ${model.comparisonLabel.toLowerCase()}` : ''}`
          }
          action={
            <div className="quiet-tag">
              <Clock3 size={14} />{' '}
              {imported
                ? 'История переходов не загружена'
                : `Средний цикл: ${model.funnelSummary.averageCycleDays.toFixed(1).replace('.', ',')} дня`}
            </div>
          }
        />
        <div className="funnel-flow" aria-label="Этапы воронки продаж">
          {stages.map((stage, index) => (
            <div className="funnel-flow-step" key={stage.id}>
              <article
                className={classNames('funnel-stage-card', stage.id === problemId && 'is-problem')}
              >
                <div className="funnel-stage-top">
                  <span>0{index + 1}</span>
                  <em
                    className={
                      stage.delta !== null && stage.delta < 0 ? 'negative-text' : 'positive-text'
                    }
                  >
                    {stage.delta === null
                      ? imported
                        ? 'snapshot'
                        : '—'
                      : `${stage.delta > 0 ? '+' : ''}${stage.delta} п.п.`}
                  </em>
                </div>
                <h3>{stage.label}</h3>
                <strong>
                  {stage.count} <small>сделок</small>
                </strong>
                <p>{formatRub(stage.amount, true)}</p>
                <div className="stage-time">
                  <Clock3 size={13} />{' '}
                  {stage.days === null ? 'время не импортировано' : `${stage.days} дн. от создания`}
                </div>
                <div className="stage-volume">
                  <span style={{ width: `${stage.width}%` }} />
                </div>
              </article>
              {index < stages.length - 1 ? (
                <div
                  className={classNames(
                    'funnel-transition',
                    stage.id === problemId && 'is-problem',
                  )}
                >
                  <ArrowRight size={17} />
                  <strong>
                    {stage.conversion === null
                      ? '—'
                      : `${stage.conversion.toFixed(imported ? 1 : 0)}%`}
                  </strong>
                  <span>
                    {imported
                      ? 'snapshot-proxy'
                      : stage.delta === null
                        ? 'в следующий этап'
                        : `${stage.delta > 0 ? '+' : ''}${stage.delta} п.п.`}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="funnel-diagnosis">
          <CircleAlert size={20} />
          {imported ? (
            <div>
              <span>Ограничение расчёта</span>
              <strong>
                {weakest
                  ? `Минимальный snapshot-proxy: «${weakest.from.label} → ${weakest.to.label}»`
                  : 'Недостаточно сделок для сравнения переходов'}
              </strong>
              <p>
                Файл содержит только текущую стадию сделки. Для когортной конверсии и времени этапов
                нужна история смены стадий.
              </p>
            </div>
          ) : (
            <div>
              <span>Главная точка потери</span>
              <strong>
                На переходе «{model.funnelSummary.problemFrom} → {model.funnelSummary.problemTo}» до
                следующего этапа доходит {(model.funnelSummary.problemRate * 100).toFixed(0)}%
                сделок
              </strong>
              <p>
                Из {formatRub(model.funnelSummary.problemFromAmount, true)} до следующего этапа
                доходит {formatRub(model.funnelSummary.problemToAmount, true)}.
                {model.comparisonLabel
                  ? ` Конверсия изменилась на ${model.funnelSummary.problemDeltaPoints.toFixed(0)} п.п.`
                  : ' Сравнение периодов отключено.'}
              </p>
            </div>
          )}
          <span className="quiet-tag">
            {imported
              ? `${stages.reduce((sum, stage) => sum + stage.count, 0)} сделок в срезе`
              : `${model.funnelSummary.problemLostDeals} сделок не перешли`}
          </span>
        </div>
      </Panel>

      <div className="two-column-grid">
        <Panel>
          <PanelHeader
            eyebrow="Потери"
            title="Где выпадают деньги"
            description={
              imported
                ? 'Разница сумм на текущих стадиях; snapshot-proxy, не когортная потеря'
                : 'Сумма, не перешедшая на следующий этап'
            }
          />
          <div className="loss-waterfall">
            {stageLosses.map((item) => (
              <div className={classNames('loss-row', item.risk && 'is-risk')} key={item.label}>
                <span>{item.label}</span>
                <strong>{formatRub(item.value, true)}</strong>
                <em>{item.rate.toFixed(imported ? 1 : 0)}% суммы</em>
                <i>
                  <span style={{ width: `${item.rate}%` }} />
                </i>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            eyebrow="Скорость"
            title="Время до этапа"
            description={
              imported
                ? 'Для расчёта нужны даты входа и выхода с каждой стадии'
                : model.comparisonLabel
                  ? `Средние дни от создания сделки · сравнение: ${model.comparisonLabel.toLowerCase()}`
                  : 'Средние дни от создания сделки · без сравнения'
            }
          />
          {imported ? (
            <EmptyState
              title="Нет истории смены стадий"
              text="В импортируемом формате есть текущий этап, но нет дат входа и выхода. Время на этапах не рассчитывается, чтобы не подменять данные demo-оценками."
            />
          ) : (
            <div className="stage-time-list">
              {model.funnelTimes.map((item) => {
                const slow =
                  item.current !== null &&
                  item.previous !== null &&
                  item.current > item.previous * 1.25
                return (
                  <div className={classNames('stage-time-row', slow && 'is-slow')} key={item.id}>
                    <span>{item.label}</span>
                    <strong>{item.current === null ? '—' : `${item.current} дн.`}</strong>
                    <small>
                      {item.previous === null
                        ? 'нет сравнения'
                        : `сравнение ${item.previous.toFixed(1).replace('.', ',')} дн.`}
                    </small>
                    <i>
                      <em
                        style={{
                          width: `${Math.min(((item.current ?? 0) / Math.max(...model.funnelTimes.map((row) => row.current ?? 0), 1)) * 100, 100)}%`,
                        }}
                      />
                    </i>
                    {slow ? <ArrowDownRight size={15} /> : <MoveDown size={15} />}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

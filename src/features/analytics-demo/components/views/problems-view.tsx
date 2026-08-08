'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RotateCcw,
  Trash2,
  TrendingDown,
  UserRoundX,
} from 'lucide-react'
import { EmptyState, Panel, PanelHeader } from '@/features/analytics-demo/components/ui'
import {
  demoDashboardModel,
  type DashboardView,
  type DemoDashboardModel,
} from '@/features/analytics-demo/lib/dashboard/data'
import {
  loadProblemActions,
  saveProblemActions,
  updateProblemAction,
  type ProblemAction,
} from '@/features/analytics-demo/lib/dashboard/actions'
import { formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import type { ImportedDashboardModel } from '@/features/analytics-demo/lib/import'

export function ProblemsView({
  onNavigate,
  imported,
  model = demoDashboardModel,
}: {
  onNavigate: (view: DashboardView) => void
  imported?: ImportedDashboardModel | null
  model?: DemoDashboardModel
}) {
  const [actions, setActions] = useState<ProblemAction[]>([])
  const activeIssues =
    imported?.problems.map((issue) => ({
      ...issue,
      icon:
        issue.kind === 'stale'
          ? Clock3
          : issue.kind === 'manager'
            ? UserRoundX
            : issue.kind === 'funnel'
              ? CircleAlert
              : TrendingDown,
    })) ??
    model.problems.map((issue) => ({
      ...issue,
      icon:
        issue.category === 'pipeline'
          ? Clock3
          : issue.category === 'managers'
            ? UserRoundX
            : issue.category === 'funnel'
              ? CircleAlert
              : TrendingDown,
    }))
  const criticalCount = activeIssues.filter((issue) => issue.tone === 'critical').length
  const warningCount = activeIssues.filter((issue) => issue.tone === 'warning').length
  const impact = imported
    ? imported.problems.reduce((sum, issue) => sum + issue.impact, 0)
    : model.riskSummary.amount + Math.abs(model.salesSummary.forecastGap)
  const actionByIssue = useMemo(
    () => new Map(actions.map((action) => [action.issueId, action])),
    [actions],
  )
  const resolvedCount = actions.filter((action) => action.status === 'resolved').length

  useEffect(() => {
    const timer = window.setTimeout(() => setActions(loadProblemActions()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const setStatus = (issue: (typeof activeIssues)[number], status: ProblemAction['status']) => {
    setActions((current) => {
      const next = updateProblemAction(
        current,
        { id: issue.id, title: issue.title, target: issue.target },
        status,
        new Date().toISOString(),
      )
      saveProblemActions(next)
      return next
    })
  }

  const actionDate = (value: string) =>
    new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))

  return (
    <div className="view-stack">
      <section className="attention-hero">
        <div>
          <span>Фокус собственника</span>
          <strong>{activeIssues.length} ситуаций требуют решения</strong>
          <p>
            {activeIssues.length
              ? `Денежный контекст прогноза и сделок без движения: ${formatRub(impact, true)}.`
              : 'Критичные сигналы по загруженному набору не обнаружены.'}
          </p>
        </div>
        <div>
          <strong>{criticalCount}</strong>
          <span>критичных</span>
        </div>
        <div>
          <strong>{warningCount}</strong>
          <span>важных</span>
        </div>
        <div>
          <strong>{resolvedCount}</strong>
          <span>решено локально</span>
        </div>
      </section>
      <Panel>
        <PanelHeader
          eyebrow="Приоритеты на сегодня"
          title="Центр внимания"
          description="Проблемы отсортированы по влиянию на деньги и срочности"
        />
        <div className="issue-list">
          {activeIssues.map((issue) => {
            const Icon = issue.icon
            const action = actionByIssue.get(issue.id)
            return (
              <article className={`issue-item issue-item--${issue.tone}`} key={issue.id}>
                <span className="issue-priority">{issue.priority}</span>
                <span className="issue-icon">
                  <Icon size={18} />
                </span>
                <div className="issue-copy">
                  <h3>{issue.title}</h3>
                  <p>{issue.text}</p>
                  {action ? (
                    <span className={`action-status action-status--${action.status}`}>
                      {action.status === 'resolved' ? 'Решено' : 'В работе'}
                    </span>
                  ) : null}
                </div>
                <div className="issue-meta">
                  <span>Ответственный</span>
                  <strong>{issue.owner}</strong>
                </div>
                <div className="issue-meta">
                  <span>Срок</span>
                  <strong>{issue.due}</strong>
                </div>
                <div className="issue-actions">
                  <button className="secondary-button" onClick={() => onNavigate(issue.target)}>
                    Разобрать
                    <ArrowRight size={14} />
                  </button>
                  {action?.status === 'resolved' ? (
                    <button
                      className="icon-button"
                      onClick={() => setStatus(issue, 'in_progress')}
                      aria-label={`Вернуть в работу: ${issue.title}`}
                      title="Вернуть в работу"
                    >
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button
                      className="icon-button"
                      onClick={() => setStatus(issue, action ? 'resolved' : 'in_progress')}
                      aria-label={
                        action ? `Завершить: ${issue.title}` : `Взять в работу: ${issue.title}`
                      }
                      title={action ? 'Завершить' : 'Взять в работу'}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </article>
            )
          })}
          {activeIssues.length === 0 ? (
            <EmptyState
              title="Проблем не обнаружено"
              text="По текущим правилам риска загруженный набор не содержит ситуаций, требующих эскалации."
            />
          ) : null}
        </div>
      </Panel>
      <Panel>
        <PanelHeader
          eyebrow="История решений"
          title="Что уже взято в работу"
          action={
            actions.length ? (
              <button
                className="text-link"
                onClick={() => {
                  setActions([])
                  saveProblemActions([])
                }}
              >
                <Trash2 size={14} />
                Очистить журнал
              </button>
            ) : undefined
          }
        />
        {actions.length ? (
          <div className="action-journal">
            {actions.map((action) => (
              <div key={action.issueId}>
                <span className={`action-status action-status--${action.status}`}>
                  {action.status === 'resolved' ? 'Решено' : 'В работе'}
                </span>
                <div>
                  <strong>{action.title}</strong>
                  <small>
                    {action.status === 'resolved' ? 'Завершено' : 'Обновлено'} ·{' '}
                    {actionDate(action.updatedAt)}
                  </small>
                </div>
                <button
                  className="text-link"
                  onClick={() => onNavigate(action.target as DashboardView)}
                >
                  Открыть
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Действий пока нет"
            text="Возьмите проблему в работу — решение сохранится локально и появится в журнале."
          />
        )}
      </Panel>
    </div>
  )
}

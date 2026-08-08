import { CircleHelp } from 'lucide-react'
import { classNames } from '@/features/analytics-demo/lib/dashboard/format'

export function Panel({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <section className={classNames('panel', className)} aria-label={ariaLabel}>
      {children}
    </section>
  )
}

export function PanelHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string
  eyebrow?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="panel-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="panel-description">{description}</p> : null}
      </div>
      {action ? <div className="panel-action">{action}</div> : null}
    </header>
  )
}

export function MetricDefinition({ label, definition }: { label: string; definition: string }) {
  return (
    <span className="metric-label-with-help">
      {label}
      <span className="tooltip-anchor" tabIndex={0} aria-label={`${label}: ${definition}`}>
        <CircleHelp size={13} strokeWidth={1.8} aria-hidden="true" />
        <span className="tooltip-content" role="tooltip">
          {definition}
        </span>
      </span>
    </span>
  )
}

export function Score({ value }: { value: number }) {
  const tone = value >= 80 ? 'good' : value >= 60 ? 'warning' : 'bad'
  return (
    <span
      className={classNames('score', `score--${tone}`)}
      aria-label={`Sales Score ${value} из 100`}
    >
      <span>{value}</span>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" />
        <circle cx="18" cy="18" r="15.5" pathLength="100" strokeDasharray={`${value} 100`} />
      </svg>
    </span>
  )
}

export function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const labels = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }
  return <span className={classNames('status', `status--${level}`)}>{labels[level]}</span>
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

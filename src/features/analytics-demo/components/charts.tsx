'use client'

import { useState } from 'react'
import { formatRub } from '@/features/analytics-demo/lib/dashboard/format'
import { area as d3Area, curveMonotoneX, line as d3Line } from 'd3-shape'

type RevenuePoint = {
  day: number
  label: string
  actual: number | null
  previous: number | null
  plan: number | null
  forecast: number | null
}

const toPath = (points: Array<{ x: number; y: number }>) =>
  d3Line<{ x: number; y: number }>()
    .x((point) => point.x)
    .y((point) => point.y)
    .curve(curveMonotoneX)(points) ?? ''

export function RevenueChart({
  data,
  mode,
  monthLabel = 'авг.',
}: {
  data: RevenuePoint[]
  mode: 'day' | 'week' | 'month'
  monthLabel?: string
}) {
  const [hovered, setHovered] = useState<RevenuePoint | null>(null)
  const width = 900
  const height = 340
  const margin = { top: 16, right: 24, bottom: 37, left: 68 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const maxValue = Math.max(
    1,
    ...data
      .flatMap((point) => [point.actual, point.previous, point.plan, point.forecast])
      .filter((value): value is number => value !== null),
  )
  const domainMax = Math.max(1_000_000, Math.ceil((maxValue * 1.12) / 1_000_000) * 1_000_000)
  const x = (day: number) => margin.left + ((day - 1) / Math.max(data.length - 1, 1)) * plotWidth
  const y = (value: number) => margin.top + plotHeight - (value / domainMax) * plotHeight
  const chartData = data.filter((point, index) => {
    if (mode === 'day') return true
    if (index === 0 || index === data.length - 1) return true
    if (mode === 'week') return point.day % 7 === 0
    return false
  })
  const seriesPoints = (
    key: keyof Pick<RevenuePoint, 'actual' | 'previous' | 'plan' | 'forecast'>,
  ) =>
    chartData
      .filter((point) => point[key] !== null)
      .map((point) => ({ x: x(point.day), y: y(point[key] as number), point }))
  const actual = seriesPoints('actual')
  const previous = seriesPoints('previous')
  const plan = seriesPoints('plan')
  const forecast = seriesPoints('forecast')
  const ticks =
    mode === 'day'
      ? [1, 5, 10, 15, 20, 25, data.length]
      : mode === 'week'
        ? [1, 8, 15, 22, data.length]
        : [1, data.length]
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
  const areaPath =
    d3Area<(typeof actual)[number]>()
      .x((point) => point.x)
      .y0(margin.top + plotHeight)
      .y1((point) => point.y)
      .curve(curveMonotoneX)(actual) ?? ''

  return (
    <div
      className="chart-wrap chart-wrap--large"
      role="group"
      aria-label="График накопленной выручки, плана, прогноза и прошлого периода"
    >
      <svg
        className="chart-svg revenue-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHovered(null)}
      >
        <title>Выручка и прогноз</title>
        <desc>
          Фактическая накопленная выручка сопоставлена с планом, прогнозом и прошлым периодом.
        </desc>
        <defs>
          <linearGradient id="actual-area-svg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const tickY = margin.top + plotHeight - tick * plotHeight
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={tickY}
                y2={tickY}
                className="chart-grid-line"
              />
              <text
                x={margin.left - 10}
                y={tickY + 4}
                textAnchor="end"
                className="chart-axis-label"
              >
                {Math.round((domainMax * tick) / 1_000_000)} млн
              </text>
            </g>
          )
        })}
        {ticks
          .filter((tick, index, values) => values.indexOf(tick) === index)
          .map((tick) => (
            <text
              key={tick}
              x={x(tick)}
              y={height - 10}
              textAnchor={tick === 1 ? 'start' : tick === data.length ? 'end' : 'middle'}
              className="chart-axis-label"
            >
              {tick} {monthLabel}
            </text>
          ))}
        {areaPath ? <path d={areaPath} fill="url(#actual-area-svg)" /> : null}
        {previous.length ? (
          <path d={toPath(previous)} className="chart-line chart-line--previous" />
        ) : null}
        {plan.length ? <path d={toPath(plan)} className="chart-line chart-line--plan" /> : null}
        {actual.length ? (
          <path d={toPath(actual)} className="chart-line chart-line--actual" />
        ) : null}
        {forecast.length ? (
          <path d={toPath(forecast)} className="chart-line chart-line--forecast" />
        ) : null}
        {actual.map(({ x: cx, y: cy, point }, index) => (
          <circle
            key={point.day}
            cx={cx}
            cy={cy}
            r={index === actual.length - 1 ? 5 : 3.5}
            className="chart-point chart-point--actual chart-point--interactive"
            tabIndex={0}
            role="button"
            aria-label={`${point.label}: факт ${formatRub(point.actual ?? 0)}`}
            onMouseEnter={() => setHovered(point)}
            onFocus={() => setHovered(point)}
            onBlur={() => setHovered(null)}
          >
            <title>{`${point.label}: ${formatRub(point.actual ?? 0)}`}</title>
          </circle>
        ))}
        {actual.length ? (
          <line
            x1={actual.at(-1)?.x}
            x2={actual.at(-1)?.x}
            y1={margin.top}
            y2={margin.top + plotHeight}
            className="chart-today-line"
          />
        ) : null}
      </svg>
      {hovered ? (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hovered.day) / width) * 100))}%`,
            top: `${Math.max(24, (y(hovered.actual ?? 0) / height) * 100)}%`,
          }}
          role="status"
        >
          <strong>{hovered.label}</strong>
          <span>
            <i className="legend-line legend-line--actual" />
            Факт <b>{formatRub(hovered.actual ?? 0, true)}</b>
          </span>
          {hovered.plan !== null ? (
            <span>
              <i className="legend-line legend-line--plan" />
              План <b>{formatRub(hovered.plan, true)}</b>
            </span>
          ) : null}
          {hovered.forecast !== null ? (
            <span>
              <i className="legend-line legend-line--forecast" />
              Прогноз <b>{formatRub(hovered.forecast, true)}</b>
            </span>
          ) : null}
          {hovered.previous !== null ? (
            <span>
              <i className="legend-line legend-line--previous" />
              Прошлый период <b>{formatRub(hovered.previous, true)}</b>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function MiniTrend({ values, negative = false }: { values: number[]; negative?: boolean }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points = values.map((value, index) => ({
    x: (index / Math.max(values.length - 1, 1)) * 90 + 1,
    y: 26 - ((value - min) / Math.max(max - min, 1)) * 22,
  }))
  return (
    <svg className="mini-trend" viewBox="0 0 92 28" role="img" aria-label="Динамика показателя">
      <path
        d={toPath(points)}
        fill="none"
        stroke={negative ? 'var(--danger)' : 'var(--chart-primary)'}
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function ManagerTrend({ values }: { values: number[] }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points = values.map((value, index) => ({
    x: 2 + (index / Math.max(values.length - 1, 1)) * 176,
    y: 55 - ((value - min) / Math.max(max - min, 1)) * 49,
  }))
  const area =
    d3Area<(typeof points)[number]>()
      .x((point) => point.x)
      .y0(58)
      .y1((point) => point.y)
      .curve(curveMonotoneX)(points) ?? ''
  return (
    <div className="manager-spark" aria-label="Динамика менеджера">
      <svg className="chart-svg" viewBox="0 0 180 60" preserveAspectRatio="xMidYMid meet">
        <path d={area} fill="var(--brand-soft)" />
        <path d={toPath(points)} className="chart-line chart-line--actual" />
      </svg>
    </div>
  )
}

export function SourceRevenueChart({
  data,
}: {
  data: Array<{ source: string; revenue: number; conversion: number }>
}) {
  const width = 900
  const height = 270
  const labelWidth = 154
  const right = 86
  const top = 9
  const rowHeight = 41
  const max = Math.max(...data.map((item) => item.revenue), 1)
  return (
    <div
      className="chart-wrap chart-wrap--medium"
      role="img"
      aria-label="Выручка и конверсия по источникам"
    >
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title>Источники продаж</title>
        {data.map((item, index) => {
          const rowY = top + index * rowHeight
          const barWidth = ((width - labelWidth - right) * item.revenue) / max
          return (
            <g key={item.source}>
              <text x={2} y={rowY + 17} className="chart-category-label">
                {item.source}
              </text>
              <rect
                x={labelWidth}
                y={rowY + 4}
                width={width - labelWidth - right}
                height="19"
                rx="3"
                className="chart-bar-track"
              />
              <rect
                x={labelWidth}
                y={rowY + 4}
                width={barWidth}
                height="19"
                rx="3"
                className="chart-bar-primary"
              >
                <title>{`${item.source}: ${formatRub(item.revenue)} · конверсия ${item.conversion}%`}</title>
              </rect>
              <text x={width - 2} y={rowY + 17} textAnchor="end" className="chart-value-label">
                {formatRub(item.revenue, true)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function ParetoChart({
  data,
}: {
  data: Array<{ name: string; revenue: number; share: number }>
}) {
  const width = 900
  const height = 270
  const margin = { top: 18, right: 20, bottom: 46, left: 48 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const max = Math.max(...data.map((item) => item.revenue), 1)
  const items = data.reduce<
    Array<{ name: string; revenue: number; share: number; cumulative: number }>
  >(
    (result, item) => [
      ...result,
      { ...item, cumulative: (result.at(-1)?.cumulative ?? 0) + item.share },
    ],
    [],
  )
  const slot = plotWidth / Math.max(items.length, 1)
  const linePoints = items.map((item, index) => ({
    x: margin.left + index * slot + slot / 2,
    y: margin.top + plotHeight - (item.cumulative / 100) * plotHeight,
  }))
  return (
    <div
      className="chart-wrap chart-wrap--medium"
      role="img"
      aria-label="Парето-анализ выручки по клиентам"
    >
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title>Парето-анализ клиентов</title>
        {[0, 0.5, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={margin.top + plotHeight - tick * plotHeight}
              y2={margin.top + plotHeight - tick * plotHeight}
              className="chart-grid-line"
            />
            <text
              x={margin.left - 8}
              y={margin.top + plotHeight - tick * plotHeight + 4}
              textAnchor="end"
              className="chart-axis-label"
            >
              {Math.round((max * tick) / 1_000_000)} млн
            </text>
          </g>
        ))}
        {items.map((item, index) => {
          const barHeight = (item.revenue / max) * plotHeight
          const barX = margin.left + index * slot + slot * 0.18
          return (
            <g key={item.name}>
              <rect
                x={barX}
                y={margin.top + plotHeight - barHeight}
                width={slot * 0.64}
                height={barHeight}
                rx="3"
                className={index < 5 ? 'chart-bar-primary' : 'chart-bar-muted'}
              >
                <title>{`${item.name}: ${formatRub(item.revenue)} · накопленно ${item.cumulative.toFixed(1)}%`}</title>
              </rect>
              <text
                x={barX + slot * 0.32}
                y={height - 18}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {item.name
                  .replace(/^(ООО|АО|ПАО|ЗАО)\s*[«"]?/i, '')
                  .replace(/[»"]$/, '')
                  .slice(0, 8)}
              </text>
            </g>
          )
        })}
        <path d={toPath(linePoints)} className="chart-line chart-line--forecast" />
        {linePoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            className="chart-point chart-point--forecast"
          />
        ))}
      </svg>
    </div>
  )
}

export function LostReasonsChart({ data }: { data: Array<{ reason: string; amount: number }> }) {
  const width = 800
  const height = 230
  const margin = { top: 14, right: 16, bottom: 44, left: 48 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const max = Math.max(...data.map((item) => item.amount), 1)
  const slot = plotWidth / Math.max(data.length, 1)
  return (
    <div
      className="chart-wrap chart-wrap--small"
      role="img"
      aria-label="Потерянная выручка по причинам"
    >
      <svg
        className="chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title>Причины потерянных продаж</title>
        {[0, 0.5, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={margin.top + plotHeight - tick * plotHeight}
              y2={margin.top + plotHeight - tick * plotHeight}
              className="chart-grid-line"
            />
            <text
              x={margin.left - 8}
              y={margin.top + plotHeight - tick * plotHeight + 4}
              textAnchor="end"
              className="chart-axis-label"
            >
              {Math.round((max * tick) / 1_000_000)} млн
            </text>
          </g>
        ))}
        {data.map((item, index) => {
          const barHeight = (item.amount / max) * plotHeight
          const barX = margin.left + index * slot + slot * 0.2
          return (
            <g key={item.reason}>
              <rect
                x={barX}
                y={margin.top + plotHeight - barHeight}
                width={slot * 0.6}
                height={barHeight}
                rx="3"
                className="chart-bar-danger"
              >
                <title>{`${item.reason}: ${formatRub(item.amount)}`}</title>
              </rect>
              <text
                x={barX + slot * 0.3}
                y={height - 17}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {item.reason.slice(0, 10)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

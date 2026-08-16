import type { DashboardView, RiskLevel } from '../dashboard/data'
import { formatPercent, formatRub } from '../dashboard/format'
import type { NormalizedDealStage, NormalizedImportRow, StoredImportSnapshot } from './types'

const ACTIVE_STAGES = new Set<NormalizedDealStage>(['new', 'qualification', 'proposal', 'invoice'])
const STAGE_PROBABILITY: Record<NormalizedDealStage, number> = {
  new: 0.08,
  qualification: 0.2,
  proposal: 0.42,
  invoice: 0.68,
  won: 1,
  lost: 0,
}
const STAGE_LABELS: Record<NormalizedDealStage, string> = {
  new: 'Новый лид',
  qualification: 'Квалификация',
  proposal: 'КП',
  invoice: 'Счёт',
  won: 'Оплата',
  lost: 'Проиграна',
}
const FUNNEL_ORDER: NormalizedDealStage[] = ['new', 'qualification', 'proposal', 'invoice', 'won']

export interface ImportedFunnelStage {
  id: NormalizedDealStage
  label: string
  count: number
  amount: number
  conversion: number | null
  days: null
  delta: null
  width: number
}

export interface ImportedManagerRow {
  id: string
  name: string
  initials: string
  revenue: number
  plan: 0
  planRate: 0
  hasPlan: false
  pipeline: number
  deals: number
  winRate: number
  average: number
  cycle: number | null
  stale: number
  score: number
  trend: number[]
}

export interface ImportedRiskDeal {
  id: string
  client: string
  deal: string
  manager: string
  stage: string
  stageId: NormalizedDealStage
  amount: number
  probability: number
  days: number
  inactivity: number
  lastActivity: string
  score: number
  level: RiskLevel
  reason: string
}

export interface ImportedClientRow {
  id: string
  name: string
  industry: string
  revenue: number
  deals: number
  average: number
  last: string
  repeat: number
  lifetime: number
  share: number
  abc: 'A' | 'B' | 'C'
  trend: number[]
}

export interface ImportedSourceRow {
  source: string
  leads: number
  sales: number
  conversion: number
  revenue: number
  average: number
}

export interface ImportedLostReason {
  reason: string
  amount: number
  deals: number
}

export interface ImportedProblem {
  id: string
  priority: 'P1' | 'P2'
  title: string
  text: string
  owner: string
  due: string
  target: DashboardView
  kind: 'stale' | 'funnel' | 'manager' | 'clients'
  tone: 'critical' | 'warning'
  impact: number
}

export type ImportedPeriodFilter = 'latest' | 'previous'
export type ImportedTeamFilter = 'all' | 'key' | 'growth'

export interface ImportedDashboardFilters {
  period?: ImportedPeriodFilter
  compare?: boolean
  manager?: string
  team?: ImportedTeamFilter
}

export interface ImportedDashboardFilterOptions {
  periods: Array<{ value: ImportedPeriodFilter; label: string }>
  managers: string[]
  teams: Array<{ value: ImportedTeamFilter; label: string; managers: string[] }>
}

export interface ImportedDashboardModel {
  sourceName: string
  importedAt: string
  rowCount: number
  rows: NormalizedImportRow[]
  asOf: string
  currentStart: string
  periodLabel: string
  monthShort: string
  kpis: Array<{
    id: string
    label: string
    value: string
    delta: string
    context: string
    tone: 'positive' | 'negative' | 'neutral'
    spark?: number[]
    progress?: number
    info?: string
  }>
  revenueSeries: Array<{
    day: number
    label: string
    actual: number | null
    previous: number | null
    plan: number | null
    forecast: number | null
  }>
  chartStatus: string
  insights: Array<{
    id: string
    eyebrow: string
    title: string
    text: string
    action: string
    target: DashboardView
    tone: 'critical' | 'warning' | 'positive' | 'neutral'
    category: string
    entityIds: string[]
  }>
  funnelStages: ImportedFunnelStage[]
  managers: ImportedManagerRow[]
  riskDeals: ImportedRiskDeal[]
  moneyAtRisk: Array<{
    label: string
    amount: number
    share: number
    tone: 'critical' | 'warning' | 'muted' | 'neutral'
  }>
  clients: ImportedClientRow[]
  sources: ImportedSourceRow[]
  lostReasons: ImportedLostReason[]
  problems: ImportedProblem[]
  revenue: number
  previousRevenue: number
  forecast: number
  pipeline: number
  weightedPipeline: number
  newRevenue: number
  repeatRevenue: number
  lostTotal: number
  lostCount: number
  staleAmount: number
  staleCount: number
  topClientShare: number
  hhi: number
}

function monthBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return { start, end }
}

function inBounds(date: Date, start: Date, end: Date) {
  const time = date.getTime()
  return time >= start.getTime() && time < end.getTime()
}

function rowDate(row: NormalizedImportRow) {
  return new Date(row.closed_at ?? row.created_at)
}

function revenueFor(rows: NormalizedImportRow[], start: Date, end: Date) {
  return rows
    .filter((row) => row.stage === 'won' && inBounds(rowDate(row), start, end))
    .reduce((sum, row) => sum + row.amount, 0)
}

function safeChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null
}

function compactName(name: string) {
  return name.replace(/^(ООО|АО|ПАО|ЗАО)\s*[«"]?/i, '').replace(/[»"]$/, '')
}

function safeId(prefix: string, value: string, index: number) {
  const slug = value
    .toLocaleLowerCase('ru-RU')
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${prefix}-${slug || index + 1}`
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('ru-RU') || '—'
  )
}

function daysBetween(later: Date, earlier: Date) {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 86_400_000))
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

function displayDate(value: string | null, fallback: string) {
  const date = new Date(value ?? fallback)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
}

function monthlyRevenue(
  rows: NormalizedImportRow[],
  asOf: Date,
  predicate: (row: NormalizedImportRow) => boolean = () => true,
) {
  return Array.from({ length: 7 }, (_, index) => {
    const month = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 6 + index, 1))
    const { start, end } = monthBounds(month)
    return rows
      .filter((row) => predicate(row) && row.stage === 'won' && inBounds(rowDate(row), start, end))
      .reduce((sum, row) => sum + row.amount, 0)
  })
}

function latestDate(rows: NormalizedImportRow[], fallback: string) {
  const dates = rows
    .flatMap(
      (row) => [row.created_at, row.closed_at, row.last_activity].filter(Boolean) as string[],
    )
    .map((value) => new Date(value))
    .filter((date) => Number.isFinite(date.getTime()))
  return dates.length
    ? new Date(Math.max(...dates.map((date) => date.getTime())))
    : new Date(fallback)
}

export function getImportedDashboardFilterOptions(
  snapshot: StoredImportSnapshot,
): ImportedDashboardFilterOptions {
  const managers = [...new Set(snapshot.rows.map((row) => row.manager))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  )
  const split = Math.max(1, Math.ceil(managers.length / 2))
  const asOf = latestDate(snapshot.rows, snapshot.importedAt)
  const previous = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 1, 1))
  const label = (date: Date) => {
    const value = new Intl.DateTimeFormat('ru-RU', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  return {
    periods: [
      { value: 'latest', label: label(asOf) },
      { value: 'previous', label: label(previous) },
    ],
    managers,
    teams: [
      { value: 'all', label: 'Вся команда', managers },
      { value: 'key', label: 'Основная команда', managers: managers.slice(0, split) },
      { value: 'growth', label: 'Команда роста', managers: managers.slice(split) },
    ],
  }
}

function buildFunnel(rows: NormalizedImportRow[], wonCurrent: NormalizedImportRow[]) {
  const stageRows = new Map<NormalizedDealStage, NormalizedImportRow[]>()
  FUNNEL_ORDER.forEach((stage) =>
    stageRows.set(stage, stage === 'won' ? wonCurrent : rows.filter((row) => row.stage === stage)),
  )
  const maxCount = Math.max(1, ...FUNNEL_ORDER.map((stage) => stageRows.get(stage)?.length ?? 0))
  return FUNNEL_ORDER.map((stage, index): ImportedFunnelStage => {
    const currentRows = stageRows.get(stage) ?? []
    const nextRows = stageRows.get(FUNNEL_ORDER[index + 1]) ?? []
    const denominator = currentRows.length + nextRows.length
    return {
      id: stage,
      label: STAGE_LABELS[stage],
      count: currentRows.length,
      amount: currentRows.reduce((sum, row) => sum + row.amount, 0),
      conversion:
        index < FUNNEL_ORDER.length - 1 && denominator
          ? (nextRows.length / denominator) * 100
          : null,
      days: null,
      delta: null,
      width: Math.max(8, (currentRows.length / maxCount) * 100),
    }
  })
}

function buildRiskDeals(rows: NormalizedImportRow[], asOf: Date): ImportedRiskDeal[] {
  return rows
    .filter((row) => ACTIVE_STAGES.has(row.stage))
    .map((row) => {
      const inactivity = daysBetween(asOf, new Date(row.last_activity ?? row.created_at))
      const age = daysBetween(asOf, new Date(row.created_at))
      const probability = Math.round((row.probability ?? STAGE_PROBABILITY[row.stage]) * 100)
      const score = Math.min(
        99,
        Math.round(
          20 +
            Math.min(inactivity, 30) * 1.35 +
            (100 - probability) * 0.35 +
            Math.min(age, 60) * 0.22,
        ),
      )
      const level: RiskLevel = score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low'
      const reason =
        inactivity > 14
          ? `Нет активности ${inactivity} дней`
          : probability < 30
            ? `Вероятность закрытия ${probability}%`
            : age > 21
              ? `Сделка открыта ${age} дней`
              : 'Требуется контроль следующего шага'
      return {
        id: row.deal_id,
        client: row.client,
        deal: row.product ?? `Сделка ${row.deal_id}`,
        manager: row.manager,
        stage: STAGE_LABELS[row.stage],
        stageId: row.stage,
        amount: row.amount,
        probability,
        days: age,
        inactivity,
        lastActivity: displayDate(row.last_activity, row.created_at),
        score,
        level,
        reason,
      }
    })
    .filter((deal) => deal.inactivity > 7 || deal.probability < 40 || deal.days > 21)
    .sort((a, b) => b.score - a.score || b.amount - a.amount)
}

function buildManagers(
  rows: NormalizedImportRow[],
  asOf: Date,
  currentStart: Date,
  currentEnd: Date,
): ImportedManagerRow[] {
  const names = [...new Set(rows.map((row) => row.manager))]
  const interim = names.map((name, index) => {
    const managerRows = rows.filter((row) => row.manager === name)
    const wins = managerRows.filter(
      (row) => row.stage === 'won' && inBounds(rowDate(row), currentStart, currentEnd),
    )
    const allWins = managerRows.filter((row) => row.stage === 'won')
    const resolved = managerRows.filter((row) => row.stage === 'won' || row.stage === 'lost')
    const open = managerRows.filter((row) => ACTIVE_STAGES.has(row.stage))
    const stale = open.filter(
      (row) => daysBetween(asOf, new Date(row.last_activity ?? row.created_at)) > 7,
    ).length
    const cycles = managerRows
      .filter((row) => row.closed_at)
      .map((row) => daysBetween(new Date(row.closed_at as string), new Date(row.created_at)))
    return {
      id: safeId('import-manager', name, index),
      name,
      initials: initials(name),
      revenue: wins.reduce((sum, row) => sum + row.amount, 0),
      plan: 0 as const,
      planRate: 0 as const,
      hasPlan: false as const,
      pipeline: open.reduce((sum, row) => sum + row.amount, 0),
      deals: managerRows.length,
      winRate: resolved.length ? (allWins.length / resolved.length) * 100 : 0,
      average: wins.length ? wins.reduce((sum, row) => sum + row.amount, 0) / wins.length : 0,
      cycle: median(cycles),
      stale,
      score: 0,
      trend: monthlyRevenue(rows, asOf, (row) => row.manager === name),
    }
  })
  const maxRevenue = Math.max(1, ...interim.map((manager) => manager.revenue))
  return interim
    .map((manager) => ({
      ...manager,
      score: Math.round(
        Math.min(
          100,
          (manager.revenue / maxRevenue) * 40 +
            Math.min(manager.winRate, 50) * 0.6 +
            (manager.deals ? 15 : 0) +
            (1 - manager.stale / Math.max(manager.deals, 1)) * 15,
        ),
      ),
    }))
    .sort((a, b) => b.score - a.score)
}

function buildClients(
  rows: NormalizedImportRow[],
  asOf: Date,
  currentStart: Date,
  currentEnd: Date,
): ImportedClientRow[] {
  const names = [...new Set(rows.map((row) => row.client))]
  const interim = names
    .map((name, index) => {
      const clientRows = rows.filter((row) => row.client === name)
      const allWins = clientRows.filter((row) => row.stage === 'won')
      const wins = allWins.filter((row) => inBounds(rowDate(row), currentStart, currentEnd))
      const revenue = wins.reduce((sum, row) => sum + row.amount, 0)
      const lifetime = allWins.reduce((sum, row) => sum + row.amount, 0)
      const latest = [...clientRows].sort((a, b) => rowDate(b).getTime() - rowDate(a).getTime())[0]
      const segments = clientRows
        .map((row) => row.region ?? row.product)
        .filter(Boolean) as string[]
      return {
        id: safeId('import-client', name, index),
        name,
        industry: segments[0] ?? 'Сегмент не указан',
        revenue,
        deals: wins.length,
        average: wins.length ? revenue / wins.length : 0,
        last: latest
          ? displayDate(latest.closed_at ?? latest.last_activity, latest.created_at)
          : '—',
        repeat: allWins.length ? Math.max(0, ((allWins.length - 1) / allWins.length) * 100) : 0,
        lifetime,
        share: 0,
        abc: 'C' as const,
        trend: monthlyRevenue(rows, asOf, (row) => row.client === name),
      }
    })
    .sort((a, b) => b.revenue - a.revenue || b.lifetime - a.lifetime)
  const basisTotal = interim.reduce((sum, client) => sum + client.revenue, 0)
  let cumulative = 0
  return interim.map((client) => {
    const share = basisTotal ? (client.revenue / basisTotal) * 100 : 0
    const abc = share === 0 ? 'C' : cumulative < 80 ? 'A' : cumulative < 95 ? 'B' : 'C'
    cumulative += share
    return { ...client, share, abc }
  })
}

function buildSources(
  rows: NormalizedImportRow[],
  currentStart: Date,
  currentEnd: Date,
): ImportedSourceRow[] {
  const periodRows = rows.filter(
    (row) =>
      inBounds(new Date(row.created_at), currentStart, currentEnd) ||
      (row.closed_at && inBounds(new Date(row.closed_at), currentStart, currentEnd)),
  )
  const names = [...new Set(periodRows.map((row) => row.source ?? 'Не указан'))]
  return names
    .map((source) => {
      const sourceRows = periodRows.filter((row) => (row.source ?? 'Не указан') === source)
      const wins = sourceRows.filter(
        (row) => row.stage === 'won' && inBounds(rowDate(row), currentStart, currentEnd),
      )
      const revenue = wins.reduce((sum, row) => sum + row.amount, 0)
      return {
        source,
        leads: sourceRows.length,
        sales: wins.length,
        conversion: sourceRows.length ? (wins.length / sourceRows.length) * 100 : 0,
        revenue,
        average: wins.length ? revenue / wins.length : 0,
      }
    })
    .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads)
}

function buildLostReasons(
  rows: NormalizedImportRow[],
  currentStart: Date,
  currentEnd: Date,
): ImportedLostReason[] {
  const lost = rows.filter(
    (row) => row.stage === 'lost' && inBounds(rowDate(row), currentStart, currentEnd),
  )
  const reasons = [...new Set(lost.map((row) => row.loss_reason ?? 'Причина не указана'))]
  return reasons
    .map((reason) => {
      const reasonRows = lost.filter((row) => (row.loss_reason ?? 'Причина не указана') === reason)
      return {
        reason,
        deals: reasonRows.length,
        amount: reasonRows.reduce((sum, row) => sum + row.amount, 0),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export function buildImportedDashboard(
  snapshot: StoredImportSnapshot,
  filters: ImportedDashboardFilters = {},
): ImportedDashboardModel {
  const compareEnabled = filters.compare !== false
  const options = getImportedDashboardFilterOptions(snapshot)
  const team =
    options.teams.find((item) => item.value === (filters.team ?? 'all')) ?? options.teams[0]
  const selectedManager = filters.manager && filters.manager !== 'all' ? filters.manager : null
  const scopedRows = snapshot.rows.filter(
    (row) =>
      team.managers.includes(row.manager) && (!selectedManager || row.manager === selectedManager),
  )
  const latestAsOf = latestDate(snapshot.rows, snapshot.importedAt)
  const asOf =
    filters.period === 'previous'
      ? new Date(
          Date.UTC(latestAsOf.getUTCFullYear(), latestAsOf.getUTCMonth(), 0, 23, 59, 59, 999),
        )
      : latestAsOf
  const current = monthBounds(asOf)
  const rows = scopedRows.filter(
    (row) => new Date(row.created_at).getTime() < current.end.getTime(),
  )
  const previousEnd = current.start
  const previousStart = new Date(
    Date.UTC(previousEnd.getUTCFullYear(), previousEnd.getUTCMonth() - 1, 1),
  )
  const wonCurrent = rows.filter(
    (row) => row.stage === 'won' && inBounds(rowDate(row), current.start, current.end),
  )
  const revenue = wonCurrent.reduce((sum, row) => sum + row.amount, 0)
  const previousRevenue = revenueFor(rows, previousStart, previousEnd)
  const revenueChange = compareEnabled ? safeChange(revenue, previousRevenue) : null
  const openRows = rows.filter((row) => ACTIVE_STAGES.has(row.stage))
  const pipeline = openRows.reduce((sum, row) => sum + row.amount, 0)
  const weightedPipeline = openRows.reduce(
    (sum, row) => sum + row.amount * (row.probability ?? STAGE_PROBABILITY[row.stage]),
    0,
  )
  const resolvedRows = rows.filter((row) => row.stage === 'won' || row.stage === 'lost')
  const conversion = resolvedRows.length
    ? (rows.filter((row) => row.stage === 'won').length / resolvedRows.length) * 100
    : 0
  const average = wonCurrent.length ? revenue / wonCurrent.length : 0
  const daysInMonth = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 0),
  ).getUTCDate()
  const elapsedDay = Math.max(asOf.getUTCDate(), 1)
  const forecast = Math.round((revenue / elapsedDay) * daysInMonth)
  const monthName = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(asOf)
  const monthShort = new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: 'UTC' })
    .format(asOf)
    .replace('.', '')

  const currentDaily = Array.from({ length: daysInMonth }, () => 0)
  const previousDaily = Array.from({ length: daysInMonth }, () => 0)
  wonCurrent.forEach((row) => {
    currentDaily[rowDate(row).getUTCDate() - 1] += row.amount
  })
  rows
    .filter((row) => row.stage === 'won' && inBounds(rowDate(row), previousStart, previousEnd))
    .forEach((row) => {
      const dayIndex = Math.min(rowDate(row).getUTCDate(), daysInMonth) - 1
      previousDaily[dayIndex] += row.amount
    })
  let actualTotal = 0
  let previousTotal = 0
  const revenueSeries = Array.from({ length: daysInMonth }, (_, index) => {
    actualTotal += currentDaily[index]
    previousTotal += previousDaily[index]
    const day = index + 1
    return {
      day,
      label: `${day} ${monthShort}`,
      actual: day <= elapsedDay ? actualTotal : null,
      previous: compareEnabled ? previousTotal : null,
      plan: null,
      forecast:
        day >= elapsedDay
          ? Math.round(
              revenue +
                ((day - elapsedDay) / Math.max(daysInMonth - elapsedDay, 1)) * (forecast - revenue),
            )
          : null,
    }
  })

  const riskDeals = buildRiskDeals(rows, asOf)
  const staleRows = openRows.filter(
    (row) => daysBetween(asOf, new Date(row.last_activity ?? row.created_at)) > 7,
  )
  const staleAmount = staleRows.reduce((sum, row) => sum + row.amount, 0)
  const riskBuckets = [
    {
      label: 'Нет активности >14 дней',
      tone: 'critical' as const,
      rows: riskDeals.filter((deal) => deal.inactivity > 14),
    },
    {
      label: 'Нет активности 8–14 дней',
      tone: 'warning' as const,
      rows: riskDeals.filter((deal) => deal.inactivity >= 8 && deal.inactivity <= 14),
    },
    {
      label: 'Низкая вероятность',
      tone: 'muted' as const,
      rows: riskDeals.filter((deal) => deal.inactivity < 8 && deal.probability < 40),
    },
    {
      label: 'Долгий цикл',
      tone: 'neutral' as const,
      rows: riskDeals.filter(
        (deal) => deal.inactivity < 8 && deal.probability >= 40 && deal.days > 21,
      ),
    },
  ]
  const riskTotal = riskBuckets.reduce(
    (total, bucket) => total + bucket.rows.reduce((sum, deal) => sum + deal.amount, 0),
    0,
  )
  const moneyAtRisk = riskBuckets
    .map((bucket) => ({
      label: bucket.label,
      tone: bucket.tone,
      amount: bucket.rows.reduce((sum, deal) => sum + deal.amount, 0),
      share: riskTotal
        ? (bucket.rows.reduce((sum, deal) => sum + deal.amount, 0) / riskTotal) * 100
        : 0,
    }))
    .filter((bucket) => bucket.amount > 0)
  const clients = buildClients(rows, asOf, current.start, current.end)
  const topClients = clients.filter((client) => client.revenue > 0).slice(0, 3)
  const topClientShare = topClients.reduce((sum, client) => sum + client.share, 0)
  const hhi = Math.round(clients.reduce((sum, client) => sum + client.share ** 2, 0))
  const funnelStages = buildFunnel(rows, wonCurrent)
  const proposal = funnelStages.find((stage) => stage.id === 'proposal')?.count ?? 0
  const invoice = funnelStages.find((stage) => stage.id === 'invoice')?.count ?? 0
  const proposalConversion = proposal + invoice > 0 ? (invoice / (proposal + invoice)) * 100 : 0
  const managers = buildManagers(rows, asOf, current.start, current.end)
  const sources = buildSources(rows, current.start, current.end)
  const lostReasons = buildLostReasons(rows, current.start, current.end)
  const lostTotal = lostReasons.reduce((sum, reason) => sum + reason.amount, 0)
  const lostCount = lostReasons.reduce((sum, reason) => sum + reason.deals, 0)
  const priorClients = new Set(
    rows
      .filter((row) => row.stage === 'won' && rowDate(row) < current.start)
      .map((row) => row.client),
  )
  const repeatRevenue = wonCurrent
    .filter((row) => priorClients.has(row.client))
    .reduce((sum, row) => sum + row.amount, 0)
  const newRevenue = revenue - repeatRevenue
  const revenueTrend = monthlyRevenue(rows, asOf)

  const insights: ImportedDashboardModel['insights'] = []
  if (staleRows.length)
    insights.push({
      id: 'import-stale',
      eyebrow: 'Потенциал',
      title: `${formatRub(staleAmount, true)} без движения`,
      text: `${staleRows.length} активных сделок не обновлялись более 7 дней. Проверьте следующий шаг и контакт с ЛПР.`,
      action: 'Открыть сделки',
      target: 'deals',
      tone: staleAmount > pipeline * 0.2 ? 'critical' : 'warning',
      category: 'pipeline',
      entityIds: staleRows.map((row) => row.deal_id),
    })
  if (proposal > 0)
    insights.push({
      id: 'import-funnel',
      eyebrow: 'Воронка',
      title: `После КП проходит ${formatPercent(proposalConversion)}`,
      text: `В файле ${proposal} сделок на этапе КП и ${invoice} на этапе счёта. Это snapshot-proxy по текущим стадиям, а не когортная конверсия.`,
      action: 'Открыть воронку',
      target: 'funnel',
      tone: proposalConversion < 35 ? 'critical' : 'neutral',
      category: 'funnel',
      entityIds: [],
    })
  if (topClients.length)
    insights.push({
      id: 'import-clients',
      eyebrow: 'Клиенты',
      title: `Топ-3 дают ${formatPercent(topClientShare, 0)} выручки`,
      text: `${topClients.map((client) => compactName(client.name)).join(', ')} формируют основную часть продаж выбранного месяца.`,
      action: 'Открыть клиентов',
      target: 'clients',
      tone: topClientShare > 50 ? 'warning' : 'neutral',
      category: 'clients',
      entityIds: topClients.map((client) => client.id),
    })
  insights.push({
    id: 'import-quality',
    eyebrow: 'Данные',
    title: `${rows.length} сделок в текущем срезе`,
    text: `Источник «${snapshot.sourceName}»: импортировано ${snapshot.stats.importedRows}, пропущено ${snapshot.stats.skippedRows}, ошибок ${snapshot.stats.errorRows}, дублей ${snapshot.stats.duplicateRows}.`,
    action: 'Проверить данные',
    target: 'data',
    tone: snapshot.stats.errorRows ? 'warning' : 'positive',
    category: 'sales',
    entityIds: [],
  })

  const problems: ImportedProblem[] = []
  if (staleRows.length)
    problems.push({
      id: 'stale',
      priority: staleAmount > pipeline * 0.2 ? 'P1' : 'P2',
      title: `${staleRows.length} сделок без движения`,
      text: `${formatRub(staleAmount, true)} не обновлялись более 7 дней.`,
      owner: 'Команда продаж',
      due: 'Сегодня',
      target: 'deals',
      kind: 'stale',
      tone: staleAmount > pipeline * 0.2 ? 'critical' : 'warning',
      impact: staleAmount,
    })
  if (proposal > 0 && proposalConversion < 40)
    problems.push({
      id: 'funnel',
      priority: proposalConversion < 25 ? 'P1' : 'P2',
      title: 'Низкий переход КП → Счёт',
      text: `${formatPercent(proposalConversion)} по снимку текущих стадий (${proposal} КП, ${invoice} счетов).`,
      owner: 'Команда продаж',
      due: 'На этой неделе',
      target: 'funnel',
      kind: 'funnel',
      tone: proposalConversion < 25 ? 'critical' : 'warning',
      impact: funnelStages.find((stage) => stage.id === 'proposal')?.amount ?? 0,
    })
  const averageWinRate = managers.length
    ? managers.reduce((sum, manager) => sum + manager.winRate, 0) / managers.length
    : 0
  const weakestManager = [...managers].sort((a, b) => a.winRate - b.winRate)[0]
  if (managers.length > 1 && weakestManager && weakestManager.winRate < averageWinRate * 0.7)
    problems.push({
      id: 'manager',
      priority: 'P2',
      title: `${weakestManager.name}: низкий win rate`,
      text: `${formatPercent(weakestManager.winRate)} против ${formatPercent(averageWinRate)} в среднем по команде.`,
      owner: 'Руководитель продаж',
      due: 'На этой неделе',
      target: 'managers',
      kind: 'manager',
      tone: 'warning',
      impact: weakestManager.pipeline,
    })
  if (topClientShare > 50)
    problems.push({
      id: 'clients',
      priority: topClientShare > 70 ? 'P1' : 'P2',
      title: 'Высокая концентрация клиентов',
      text: `Топ-3 формируют ${formatPercent(topClientShare, 0)} выручки анализируемого периода.`,
      owner: 'Коммерческий директор',
      due: 'До конца месяца',
      target: 'clients',
      kind: 'clients',
      tone: topClientShare > 70 ? 'critical' : 'warning',
      impact: topClients.reduce((sum, client) => sum + client.revenue, 0),
    })

  return {
    sourceName: snapshot.sourceName,
    importedAt: snapshot.importedAt,
    rowCount: rows.length,
    rows,
    asOf: asOf.toISOString(),
    currentStart: current.start.toISOString(),
    periodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    monthShort,
    kpis: [
      {
        id: 'revenue',
        label: 'Выручка',
        value: formatRub(revenue),
        delta: compareEnabled
          ? revenueChange === null
            ? 'Новый период'
            : `${revenueChange >= 0 ? '+' : ''}${formatPercent(revenueChange)}`
          : 'Без сравнения',
        context: compareEnabled ? 'к прошлому месяцу' : 'выбранный период',
        tone:
          revenueChange !== null && revenueChange < 0
            ? 'negative'
            : revenueChange === null
              ? 'neutral'
              : 'positive',
        spark: revenueTrend,
      },
      {
        id: 'plan',
        label: 'План',
        value: 'Не задан',
        delta: '—',
        context: 'нет поля плана в импорте',
        tone: 'neutral',
      },
      {
        id: 'forecast',
        label: 'Прогноз месяца',
        value: formatRub(forecast),
        delta: formatRub(forecast - revenue, true),
        context: 'ожидается до конца',
        tone: 'neutral',
        spark: [...revenueTrend.slice(1), forecast],
      },
      {
        id: 'pipeline',
        label: 'Сделки в работе',
        value: formatRub(pipeline),
        delta: formatRub(weightedPipeline, true),
        context: 'с учётом шансов',
        tone: 'neutral',
        info: 'Сумма активных сделок, умноженная на импортированную или стадийную вероятность закрытия.',
      },
      {
        id: 'conversion',
        label: 'Доля побед',
        value: formatPercent(conversion),
        delta: `${resolvedRows.length}`,
        context: 'завершённых сделок',
        tone: 'neutral',
      },
      {
        id: 'average',
        label: 'Средний чек',
        value: formatRub(average),
        delta: `${wonCurrent.length}`,
        context: 'оплат за период',
        tone: 'neutral',
      },
    ],
    revenueSeries,
    chartStatus: `Прогноз ${formatRub(forecast, true)} · план не задан`,
    insights: insights.slice(0, 4),
    funnelStages,
    managers,
    riskDeals,
    moneyAtRisk,
    clients,
    sources,
    lostReasons,
    problems,
    revenue,
    previousRevenue: compareEnabled ? previousRevenue : 0,
    forecast,
    pipeline,
    weightedPipeline,
    newRevenue,
    repeatRevenue,
    lostTotal,
    lostCount,
    staleAmount,
    staleCount: staleRows.length,
    topClientShare,
    hhi,
  }
}

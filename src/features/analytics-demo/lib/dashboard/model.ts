import {
  DEMO_AS_OF,
  FUNNEL_STAGES,
  demoDataset,
  type Client,
  type Deal,
  type DealSource,
  type FunnelStage,
  type Manager,
  type SalesDataset,
  type SalesPlan,
} from '../data'
import { generateInsights, type InsightCategory } from '../insights'
import {
  addUtcMonths,
  calculateActivePipeline,
  calculateAverageTicket,
  calculateConcentration,
  calculateConversion,
  calculateFunnel,
  calculateRevenue,
  calculateSalesCycleDays,
  calculateStageConversion,
  calculateWeightedPipeline,
  comparePeriods,
  daysInUtcMonth,
  detectStaleDeals,
  findDepartmentPlan,
  forecastMonthRevenue,
  isActiveDeal,
  isInPeriod,
  monthKey,
  monthPeriod,
  type DealRiskAssessment,
  type DatePeriod,
} from '../metrics'
import { scoreManagers } from '../scoring'
import { formatNumberRu, formatPercent, formatRub } from './format'

export type DashboardView =
  | 'overview'
  | 'sales'
  | 'funnel'
  | 'managers'
  | 'deals'
  | 'clients'
  | 'problems'
  | 'data'
  | 'settings'

export type RiskLevel = 'high' | 'medium' | 'low'

export interface DemoDashboardFilters {
  /** Calendar month (`YYYY-MM`) or an explicit half-open date interval. */
  period?: string | DatePeriod
  /** Defaults to the preceding month. `false` disables comparison series/deltas. */
  compare?: string | DatePeriod | false
  /** `all`, `new`, `key`, or an exact manager team name. */
  team?: string
  /** Stable manager id. The short suffix (for example `ivanov`) is accepted too. */
  manager?: string | null
}

export interface DashboardKpi {
  id: string
  label: string
  value: string
  delta: string
  context: string
  tone: 'positive' | 'negative' | 'neutral'
  spark?: number[]
  progress?: number
  info?: string
}

export interface DashboardRevenuePoint {
  day: number
  label: string
  actual: number | null
  previous: number | null
  plan: number | null
  forecast: number | null
}

export interface DashboardFunnelStage {
  id: FunnelStage
  label: string
  count: number
  amount: number
  /** Conversion to the next stage, in percent. */
  conversion: number | null
  /** Average calendar days from deal creation until this stage. */
  days: number | null
  /** Change in outgoing conversion versus the comparison period, in p.p. */
  delta: number | null
  width: number
  problem: boolean
}

export interface DashboardManagerRow {
  id: string
  name: string
  initials: string
  role: Manager['role']
  revenue: number
  plan: number
  planRate: number
  hasPlan: boolean
  pipeline: number
  weightedPipeline: number
  deals: number
  wonDeals: number
  winRate: number
  average: number
  cycle: number | null
  stale: number
  staleAmount: number
  score: number
  trend: number[]
  revenueChange: number | null
  hygieneScore: number
}

export interface DashboardRiskDeal {
  id: string
  clientId: string
  client: string
  deal: string
  managerId: string
  manager: string
  stage: string
  stageId: Deal['stage']
  amount: number
  probability: number
  days: number
  inactivity: number
  lastActivity: string
  score: number
  level: RiskLevel
  reason: string
}

export interface DashboardRiskBucket {
  label: string
  amount: number
  share: number
  tone: 'critical' | 'warning' | 'muted' | 'neutral'
  count: number
}

export interface DashboardClientRow {
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

export interface DashboardSourceRow {
  id: DealSource
  source: string
  leads: number
  sales: number
  conversion: number
  revenue: number
  average: number
  leadShare: number
  saleShare: number
  revenueShare: number
}

export interface DashboardLostReason {
  id: NonNullable<Deal['lossReason']>
  reason: string
  amount: number
  deals: number
  share: number
}

export interface DashboardInsight {
  id: string
  eyebrow: string
  title: string
  text: string
  action: string
  target: DashboardView
  tone: 'critical' | 'warning' | 'positive' | 'neutral'
  category: InsightCategory
  entityIds: string[]
}

export interface DashboardProblem extends DashboardInsight {
  priority: 'P1' | 'P2'
  owner: string
  due: string
  impact: number
}

export interface ManagerDetailModel {
  manager: DashboardManagerRow
  funnel: Array<{ id: FunnelStage; label: string; count: number; width: number }>
  topClients: Array<{ id: string; name: string; industry: string; revenue: number }>
  recentDeals: Array<{
    id: string
    client: string
    product: string
    stage: string
    amount: number
    lastActivity: string
  }>
  staleDeals: Array<{
    id: string
    client: string
    product: string
    stage: string
    amount: number
    inactivity: number
  }>
  comparisons: {
    planPoints: number
    winRatePoints: number
    cycleDays: number
    hygienePoints: number
  }
}

export interface DemoDashboardModel {
  filters: Required<Omit<DemoDashboardFilters, 'period' | 'compare' | 'manager'>> & {
    period: DatePeriod
    compare: DatePeriod | false
    manager: string | null
  }
  company: SalesDataset['company']
  asOf: string
  periodKey: string
  periodLabel: string
  periodShort: string
  comparisonLabel: string | null
  updatedLabel: string
  recordCount: number
  currentDealCount: number
  options: {
    periods: Array<{ value: string; label: string }>
    teams: Array<{ value: string; label: string }>
    managers: Array<{ value: string; label: string }>
  }
  kpis: DashboardKpi[]
  revenueSeries: DashboardRevenuePoint[]
  chartStatus: string
  overviewInsights: DashboardInsight[]
  funnelStages: DashboardFunnelStage[]
  funnelSummary: {
    leads: number
    leadsChange: number | null
    won: number
    endToEndConversion: number
    pipeline: number
    weightedPipeline: number
    averageCycleDays: number
    previousAverageCycleDays: number
    problemStageId: FunnelStage | null
    problemFrom: string
    problemTo: string
    problemRate: number
    problemPreviousRate: number
    problemDeltaPoints: number
    problemLostDeals: number
    problemFromAmount: number
    problemToAmount: number
    problemLostAmount: number
    problemLostAmountShare: number
  }
  funnelLosses: Array<{
    id: string
    label: string
    value: number
    rate: number
    risk: boolean
  }>
  funnelTimes: Array<{
    id: FunnelStage
    label: string
    current: number | null
    previous: number | null
  }>
  managerRows: DashboardManagerRow[]
  managerSummary: {
    total: number
    active: number
    medianScore: number
    averageScore: number
    planAchievement: number
    abovePace: number
    leaderId: string | null
    leaderGap: number
    departmentWinRate: number
    departmentCycleDays: number
    departmentHygiene: number
  }
  managerDetails: Record<string, ManagerDetailModel>
  riskDeals: DashboardRiskDeal[]
  moneyAtRisk: DashboardRiskBucket[]
  riskSummary: {
    amount: number
    count: number
    pipelineShare: number
    recoverableWeighted: number
    priorityCount: number
  }
  clients: DashboardClientRow[]
  clientSummary: {
    activeClients: number
    previousActiveClients: number
    repeatRate: number
    previousRepeatRate: number
    lifetimeRevenue: number
    averageTicket: number
    averageTicketChange: number | null
    top3Share: number
    top5Share: number
    hhi: number
    concentrationLabel: string
    abc: Record<'A' | 'B' | 'C', { clients: number; share: number }>
  }
  sources: DashboardSourceRow[]
  lostReasons: DashboardLostReason[]
  salesSummary: {
    revenue: number
    previousRevenue: number
    revenueChange: number | null
    plan: number
    planAchievement: number
    forecast: number
    forecastGap: number
    forecastGapRatio: number
    newRevenue: number
    repeatRevenue: number
    repeatRevenueChange: number | null
    lostTotal: number
    lostCount: number
    manageableLossAmount: number
    manageableLossShare: number
    bestSource: DashboardSourceRow | null
    weakSource: DashboardSourceRow | null
  }
  problems: DashboardProblem[]
  problemSummary: { critical: number; warning: number }
}

const STAGE_LABELS: Record<FunnelStage, string> = {
  new: 'Новый лид',
  qualification: 'Квалификация',
  proposal: 'КП',
  invoice: 'Счёт',
  won: 'Оплата',
}

const SOURCE_LABELS: Record<DealSource, string> = {
  website: 'Сайт',
  referral: 'Рекомендации',
  outbound: 'Холодные продажи',
  exhibition: 'Выставки',
  repeat: 'Повторные клиенты',
  partner: 'Партнёры',
}

const LOSS_REASON_LABELS: Record<NonNullable<Deal['lossReason']>, string> = {
  price: 'Цена',
  no_budget: 'Нет бюджета',
  competitor: 'Конкурент',
  no_response: 'Нет ответа',
  timing: 'Сроки',
  product_fit: 'Не подходит продукт',
}

const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  forecast: 'Прогноз',
  pipeline: 'Потенциал',
  funnel: 'Воронка',
  managers: 'Команда',
  clients: 'Клиенты',
  sources: 'Источники',
  sales: 'Продажи',
}

const PROBLEM_META: Record<InsightCategory, { owner: string; due: string }> = {
  forecast: { owner: 'Руководитель продаж', due: 'Сегодня' },
  pipeline: { owner: 'Команда продаж', due: 'Сегодня' },
  funnel: { owner: 'Команда продаж', due: 'На этой неделе' },
  managers: { owner: 'Руководитель продаж', due: 'На этой неделе' },
  clients: { owner: 'Коммерческий директор', due: 'До конца месяца' },
  sources: { owner: 'Маркетинг и продажи', due: 'На этой неделе' },
  sales: { owner: 'Руководитель продаж', due: 'На этой неделе' },
}

function round(value: number, digits = 1): number {
  const multiplier = 10 ** digits
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function datePeriodFromMonth(period: string): DatePeriod {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new RangeError(`Dashboard period must be YYYY-MM, received: ${period}`)
  }
  return monthPeriod(`${period}-01T00:00:00.000Z`)
}

function resolvePeriod(value: string | DatePeriod | undefined, fallback: string): DatePeriod {
  if (!value) return monthPeriod(fallback)
  return typeof value === 'string' ? datePeriodFromMonth(value) : value
}

function previousCalendarPeriod(period: DatePeriod): DatePeriod {
  return monthPeriod(addUtcMonths(period.start, -1))
}

function endOfPeriod(period: DatePeriod): string {
  return new Date(new Date(period.end).getTime() - 1).toISOString()
}

function formatMonth(value: string, style: 'long' | 'short' = 'long'): string {
  const label = new Intl.DateTimeFormat('ru-RU', {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
    timeZone: 'UTC',
  })
    .format(new Date(value))
    .replace('.', '')
  return style === 'long' ? label.charAt(0).toUpperCase() + label.slice(1) : label
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(new Date(value))
    .replace('.', '')
}

function formatSignedPercent(change: number | null, digits = 1): string {
  if (change === null) return '—'
  const value = change * 100
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumberRu(Math.abs(value), digits)}%`
}

function formatSignedPoints(change: number, digits = 1): string {
  return `${change > 0 ? '+' : change < 0 ? '−' : ''}${formatNumberRu(Math.abs(change), digits)} п.п.`
}

function formatSignedMoney(value: number): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatRub(Math.abs(value), true)}`
}

function managerMatches(manager: Manager, requested: string): boolean {
  return manager.id === requested || manager.id.endsWith(`-${requested}`)
}

function scopePlans(
  plans: readonly SalesPlan[],
  managers: readonly Manager[],
  allManagers: readonly Manager[],
): SalesPlan[] {
  if (managers.length === allManagers.length) return plans.map((plan) => ({ ...plan }))
  const ids = new Set(managers.map((manager) => manager.id))
  const managerPlans = plans.filter(
    (plan) => plan.scope === 'manager' && plan.managerId && ids.has(plan.managerId),
  )
  const periods = [...new Set(managerPlans.map((plan) => plan.period))]
  return [
    ...managerPlans.map((plan) => ({ ...plan })),
    ...periods.map((period): SalesPlan => ({
      id: `plan-${period}-filtered-department`,
      period,
      amount: managerPlans
        .filter((plan) => plan.period === period)
        .reduce((sum, plan) => sum + plan.amount, 0),
      currency: 'RUB',
      scope: 'department',
      managerId: null,
    })),
  ]
}

function monthlyRevenueTrend(deals: readonly Deal[], period: DatePeriod, months = 7): number[] {
  return Array.from({ length: months }, (_, index) => {
    const month = addUtcMonths(period.start, index - months + 1)
    return calculateRevenue(deals, monthPeriod(month))
  })
}

function currentPeriodDeals(deals: readonly Deal[], period: DatePeriod): Deal[] {
  return deals.filter((deal) => isInPeriod(deal.createdAt, period))
}

function closedInPeriod(deals: readonly Deal[], period: DatePeriod): Deal[] {
  return deals.filter((deal) => deal.closedAt !== null && isInPeriod(deal.closedAt, period))
}

function wonInPeriod(deals: readonly Deal[], period: DatePeriod): Deal[] {
  return deals.filter(
    (deal) => deal.stage === 'won' && deal.closedAt && isInPeriod(deal.closedAt, period),
  )
}

function cumulativeRevenueSeries(
  deals: readonly Deal[],
  currentPeriod: DatePeriod,
  comparePeriod: DatePeriod | false,
  asOf: string,
  plan: number,
  forecast: number,
): DashboardRevenuePoint[] {
  const periodDate = new Date(currentPeriod.start)
  const days = daysInUtcMonth(periodDate)
  const partial = new Date(asOf).getTime() < new Date(currentPeriod.end).getTime()
  const elapsedDay = partial ? new Date(asOf).getUTCDate() : days
  const currentDaily = Array.from({ length: days }, () => 0)
  const previousDaily = Array.from({ length: days }, () => 0)
  wonInPeriod(deals, currentPeriod).forEach((deal) => {
    const day = new Date(deal.closedAt as string).getUTCDate()
    if (day <= days) currentDaily[day - 1] += deal.amount
  })
  if (comparePeriod) {
    wonInPeriod(deals, comparePeriod).forEach((deal) => {
      const day = Math.min(new Date(deal.closedAt as string).getUTCDate(), days)
      previousDaily[day - 1] += deal.amount
    })
  }
  let actual = 0
  let previous = 0
  const monthShort = formatMonth(currentPeriod.start, 'short')
  const recognized = calculateRevenue(deals, currentPeriod)
  return Array.from({ length: days }, (_, index) => {
    actual += currentDaily[index]
    previous += previousDaily[index]
    const day = index + 1
    const projection =
      partial && day >= elapsedDay
        ? Math.round(
            recognized +
              ((day - elapsedDay) / Math.max(days - elapsedDay, 1)) * (forecast - recognized),
          )
        : null
    return {
      day,
      label: `${day} ${monthShort}`,
      actual: day <= elapsedDay ? actual : null,
      previous: comparePeriod ? previous : null,
      plan: plan > 0 ? Math.round((plan * day) / days) : null,
      forecast: projection,
    }
  })
}

function assessmentReason(assessment: DealRiskAssessment): string {
  const reasons: string[] = []
  if (assessment.reasons.includes('inactive')) {
    reasons.push(`Нет активности ${assessment.daysInactive} дней`)
  }
  if (assessment.reasons.includes('stage_overdue')) {
    reasons.push(`этап «${STAGE_LABELS[assessment.stage]}» дольше нормы`)
  }
  if (assessment.reasons.includes('low_probability')) {
    reasons.push(`вероятность ${Math.round(assessment.deal.probability * 100)}%`)
  }
  if (assessment.reasons.includes('high_value') && reasons.length === 0) {
    reasons.push('крупная сумма требует контроля')
  }
  return reasons.join(' · ') || 'Требуется контроль следующего шага'
}

function riskBucketKey(assessment: DealRiskAssessment): 0 | 1 | 2 | 3 {
  if (assessment.daysInactive > 14) return 0
  if (assessment.reasons.includes('stage_overdue')) return 1
  if (assessment.reasons.includes('low_probability')) return 2
  return 3
}

function sourceRows(deals: readonly Deal[], period: DatePeriod): DashboardSourceRow[] {
  const current = currentPeriodDeals(deals, period)
  const wins = current.filter((deal) => deal.stage === 'won')
  return (Object.keys(SOURCE_LABELS) as DealSource[])
    .map((source): DashboardSourceRow => {
      const leads = current.filter((deal) => deal.source === source)
      const sales = wins.filter((deal) => deal.source === source)
      const revenue = sales.reduce((sum, deal) => sum + deal.amount, 0)
      return {
        id: source,
        source: SOURCE_LABELS[source],
        leads: leads.length,
        sales: sales.length,
        conversion: leads.length ? round((sales.length / leads.length) * 100) : 0,
        revenue,
        average: sales.length ? revenue / sales.length : 0,
        leadShare: current.length ? leads.length / current.length : 0,
        saleShare: wins.length ? sales.length / wins.length : 0,
        revenueShare: wins.length ? revenue / wins.reduce((sum, deal) => sum + deal.amount, 0) : 0,
      }
    })
    .sort((left, right) => right.revenue - left.revenue || right.leads - left.leads)
}

function lostReasonRows(deals: readonly Deal[], period: DatePeriod): DashboardLostReason[] {
  const lost = closedInPeriod(deals, period).filter((deal) => deal.stage === 'lost')
  const total = lost.reduce((sum, deal) => sum + deal.amount, 0)
  return (Object.keys(LOSS_REASON_LABELS) as Array<NonNullable<Deal['lossReason']>>)
    .map((reason): DashboardLostReason => {
      const reasonDeals = lost.filter((deal) => deal.lossReason === reason)
      const amount = reasonDeals.reduce((sum, deal) => sum + deal.amount, 0)
      return {
        id: reason,
        reason: LOSS_REASON_LABELS[reason],
        amount,
        deals: reasonDeals.length,
        share: total ? amount / total : 0,
      }
    })
    .filter((reason) => reason.deals > 0)
    .sort((left, right) => right.amount - left.amount)
}

function clientRows(
  deals: readonly Deal[],
  clients: readonly Client[],
  period: DatePeriod,
): { rows: DashboardClientRow[]; concentration: ReturnType<typeof calculateConcentration> } {
  const concentration = calculateConcentration(deals, period, 5)
  const metadata = new Map(clients.map((client) => [client.id, client]))
  const rows = concentration.entries.slice(0, 10).map((entry): DashboardClientRow => {
    const currentWins = wonInPeriod(deals, period).filter(
      (deal) => deal.clientId === entry.clientId,
    )
    const lifetimeWins = deals.filter(
      (deal) => deal.clientId === entry.clientId && deal.stage === 'won',
    )
    const latest = [...lifetimeWins]
      .filter((deal) => deal.closedAt)
      .sort(
        (left, right) =>
          new Date(right.closedAt as string).getTime() -
          new Date(left.closedAt as string).getTime(),
      )[0]
    const client = metadata.get(entry.clientId)
    return {
      id: entry.clientId,
      name: entry.clientName,
      industry: client?.industry ?? 'Сегмент не указан',
      revenue: entry.revenue,
      deals: currentWins.length,
      average: currentWins.length ? entry.revenue / currentWins.length : 0,
      last: latest?.closedAt ? displayDate(latest.closedAt) : '—',
      repeat: lifetimeWins.length
        ? round(((lifetimeWins.length - 1) / lifetimeWins.length) * 100)
        : 0,
      lifetime: lifetimeWins.reduce((sum, deal) => sum + deal.amount, 0),
      share: round(entry.share * 100),
      abc: entry.abcClass,
      trend: monthlyRevenueTrend(
        deals.filter((deal) => deal.clientId === entry.clientId),
        period,
      ),
    }
  })
  return { rows, concentration }
}

export function buildDemoDashboard(
  filters: DemoDashboardFilters = {},
  dataset: SalesDataset = demoDataset,
): DemoDashboardModel {
  const currentPeriod = resolvePeriod(filters.period, DEMO_AS_OF)
  const defaultCompare = previousCalendarPeriod(currentPeriod)
  const comparePeriod =
    filters.compare === false ? false : resolvePeriod(filters.compare, defaultCompare.start)
  const selectedPeriodIsCurrent = monthKey(currentPeriod.start) === monthKey(DEMO_AS_OF)
  const effectiveAsOf = selectedPeriodIsCurrent ? DEMO_AS_OF : endOfPeriod(currentPeriod)
  const requestedManager = filters.manager?.trim() || null
  const selectedManager = requestedManager
    ? (dataset.managers.find((manager) => managerMatches(manager, requestedManager)) ?? null)
    : null
  const team = filters.team?.trim() || 'all'
  const teamManagers = selectedManager
    ? [selectedManager]
    : team !== 'all' && team !== 'new' && team !== 'key'
      ? dataset.managers.filter((manager) => manager.team === team)
      : dataset.managers
  const managerIds = new Set(teamManagers.map((manager) => manager.id))
  const strategicClientIds = new Set(
    dataset.clients.filter((client) => client.segment === 'strategic').map((client) => client.id),
  )
  const scopedDeals = dataset.deals.filter((deal) => {
    if (new Date(deal.createdAt).getTime() > new Date(effectiveAsOf).getTime()) return false
    if (!managerIds.has(deal.managerId)) return false
    if (team === 'new' && deal.source === 'repeat') return false
    if (team === 'key' && !strategicClientIds.has(deal.clientId)) return false
    return true
  })
  const scopedClients = dataset.clients.filter((client) =>
    scopedDeals.some((deal) => deal.clientId === client.id),
  )
  // The demo dataset has plans by department/manager, not by acquisition or
  // client segment. Showing the full department plan for a segment would be a
  // false comparison, so segmented views explicitly expose “plan not set”.
  const scopedPlans =
    team === 'new' || team === 'key'
      ? []
      : scopePlans(dataset.salesPlans, teamManagers, dataset.managers)
  const plan = findDepartmentPlan(scopedPlans, monthKey(currentPeriod.start))?.amount ?? 0
  const revenue = calculateRevenue(scopedDeals, currentPeriod)
  const previousRevenue = comparePeriod ? calculateRevenue(scopedDeals, comparePeriod) : 0
  const revenueComparison = comparePeriods(revenue, previousRevenue)
  const periodFinished =
    new Date(effectiveAsOf).getTime() >= new Date(currentPeriod.end).getTime() - 1
  const forecast = periodFinished ? revenue : forecastMonthRevenue(revenue, effectiveAsOf)
  const forecastGap = forecast - plan
  const forecastGapRatio = plan ? forecastGap / plan : 0
  const currentClosed = closedInPeriod(scopedDeals, currentPeriod)
  const previousClosed = comparePeriod ? closedInPeriod(scopedDeals, comparePeriod) : []
  const conversion = calculateConversion(currentClosed, undefined, 'closed')
  const previousConversion = calculateConversion(previousClosed, undefined, 'closed')
  const averageTicket = calculateAverageTicket(scopedDeals, currentPeriod)
  const previousAverageTicket = comparePeriod
    ? calculateAverageTicket(scopedDeals, comparePeriod)
    : 0
  const averageComparison = comparePeriods(averageTicket, previousAverageTicket)
  const currentDeals = currentPeriodDeals(scopedDeals, currentPeriod)
  const activeDeals = scopedDeals.filter(
    (deal) =>
      isActiveDeal(deal) && new Date(deal.createdAt).getTime() <= new Date(effectiveAsOf).getTime(),
  )
  const activePipeline = calculateActivePipeline(activeDeals)
  const weightedPipeline = calculateWeightedPipeline(activeDeals)
  const revenueTrend = monthlyRevenueTrend(scopedDeals, currentPeriod, 9)

  const funnelMetrics = calculateFunnel(scopedDeals, currentPeriod)
  const previousFunnelMetrics = comparePeriod ? calculateFunnel(scopedDeals, comparePeriod) : []
  const transitions = FUNNEL_STAGES.slice(0, -1).map((from, index) => {
    const to = FUNNEL_STAGES[index + 1]
    const current = calculateStageConversion(scopedDeals, from, to, currentPeriod)
    const previous = comparePeriod
      ? calculateStageConversion(scopedDeals, from, to, comparePeriod)
      : null
    return {
      from,
      to,
      current,
      previous,
      deltaPoints: previous ? (current.rate - previous.rate) * 100 : 0,
    }
  })
  const problemTransition =
    [...transitions]
      .filter((transition) => transition.current.fromCount > 0)
      .sort(
        (left, right) =>
          left.deltaPoints - right.deltaPoints || left.current.rate - right.current.rate,
      )[0] ?? null
  const problemFromMetric = problemTransition
    ? funnelMetrics.find((stage) => stage.stage === problemTransition.from)
    : null
  const problemToMetric = problemTransition
    ? funnelMetrics.find((stage) => stage.stage === problemTransition.to)
    : null
  const funnelStages = funnelMetrics.map((stage, index): DashboardFunnelStage => {
    const transition = transitions[index]
    return {
      id: stage.stage,
      label: STAGE_LABELS[stage.stage],
      count: stage.count,
      amount: stage.amount,
      conversion: transition ? round(transition.current.rate * 100) : null,
      days: stage.averageDaysToStage === null ? null : round(stage.averageDaysToStage),
      delta: transition && transition.previous ? round(transition.deltaPoints) : null,
      width: funnelMetrics[0]?.count
        ? Math.max(8, round((stage.count / funnelMetrics[0].count) * 100))
        : 0,
      problem: problemTransition?.from === stage.stage,
    }
  })
  const funnelLosses = transitions.map((transition) => {
    const from = funnelMetrics.find((stage) => stage.stage === transition.from)
    const to = funnelMetrics.find((stage) => stage.stage === transition.to)
    const value = Math.max(0, (from?.amount ?? 0) - (to?.amount ?? 0))
    return {
      id: `${transition.from}-${transition.to}`,
      label: `${STAGE_LABELS[transition.from]} → ${STAGE_LABELS[transition.to]}`,
      value,
      rate: from?.amount ? (value / from.amount) * 100 : 0,
      risk: problemTransition?.from === transition.from,
    }
  })
  const averageCycleDays = calculateSalesCycleDays(currentClosed)
  const previousAverageCycleDays = calculateSalesCycleDays(previousClosed)

  const performance = scoreManagers({
    deals: scopedDeals,
    managers: teamManagers,
    plans: scopedPlans,
    currentPeriod,
    previousPeriod: comparePeriod || defaultCompare,
    currentPlanPeriod: monthKey(currentPeriod.start),
    asOf: effectiveAsOf,
  })
  const managerRows = performance.map((item): DashboardManagerRow => ({
    id: item.manager.id,
    name: item.manager.name,
    initials: item.manager.initials,
    role: item.manager.role,
    revenue: item.revenue,
    plan: item.plan,
    planRate: round(item.planAchievement * 100),
    hasPlan: item.plan > 0,
    pipeline: item.pipeline,
    weightedPipeline: item.weightedPipeline,
    deals: currentDeals.filter((deal) => deal.managerId === item.manager.id).length,
    wonDeals: item.wonDeals,
    winRate: round(item.winRate * 100),
    average: item.averageTicket,
    cycle: item.closedDeals ? item.averageCycleDays : null,
    stale: item.staleDeals,
    staleAmount: item.stalePipelineAmount,
    score: item.salesScore.score,
    trend: monthlyRevenueTrend(
      scopedDeals.filter((deal) => deal.managerId === item.manager.id),
      currentPeriod,
    ),
    revenueChange: comparePeriod ? item.revenueChange : null,
    hygieneScore: item.salesScore.breakdown.hygiene,
  }))
  const averageScore = managerRows.length
    ? managerRows.reduce((sum, manager) => sum + manager.score, 0) / managerRows.length
    : 0
  const departmentHygiene = managerRows.length
    ? managerRows.reduce((sum, manager) => sum + manager.hygieneScore, 0) / managerRows.length
    : 0
  const elapsedShare = selectedPeriodIsCurrent
    ? new Date(effectiveAsOf).getUTCDate() / daysInUtcMonth(effectiveAsOf)
    : 1
  const managerSummary: DemoDashboardModel['managerSummary'] = {
    total: managerRows.length,
    active: teamManagers.filter((manager) => manager.active).length,
    medianScore: round(median(managerRows.map((manager) => manager.score)), 0),
    averageScore: round(averageScore, 0),
    planAchievement: plan ? revenue / plan : 0,
    abovePace: managerRows.filter(
      (manager) => manager.hasPlan && manager.planRate / 100 >= elapsedShare,
    ).length,
    leaderId: managerRows[0]?.id ?? null,
    leaderGap: managerRows[0] ? round(managerRows[0].score - averageScore, 0) : 0,
    departmentWinRate: conversion * 100,
    departmentCycleDays: averageCycleDays,
    departmentHygiene,
  }
  const clientMetadata = new Map(dataset.clients.map((client) => [client.id, client]))
  const managerDetails = Object.fromEntries(
    managerRows.map((manager): [string, ManagerDetailModel] => {
      const managerDeals = scopedDeals.filter((deal) => deal.managerId === manager.id)
      const managerFunnel = calculateFunnel(managerDeals, currentPeriod)
      const managerWon = wonInPeriod(managerDeals, currentPeriod)
      const managerRecentDeals = [...managerDeals]
        .sort(
          (left, right) =>
            new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime(),
        )
        .slice(0, 5)
        .map((deal) => ({
          id: deal.id,
          client: deal.clientName,
          product: deal.product,
          stage: deal.stage === 'lost' ? 'Проиграна' : STAGE_LABELS[deal.stage],
          amount: deal.amount,
          lastActivity: displayDate(deal.lastActivityAt),
        }))
      const managerStaleDeals = detectStaleDeals(managerDeals.filter(isActiveDeal), effectiveAsOf, {
        inactivityDays: 7,
      })
        .sort((left, right) => right.score - left.score)
        .slice(0, 5)
        .map((assessment) => ({
          id: assessment.deal.id,
          client: assessment.deal.clientName,
          product: assessment.deal.product,
          stage: STAGE_LABELS[assessment.stage],
          amount: assessment.deal.amount,
          inactivity: assessment.daysInactive,
        }))
      const byClient = new Map<string, number>()
      managerWon.forEach((deal) => {
        byClient.set(deal.clientId, (byClient.get(deal.clientId) ?? 0) + deal.amount)
      })
      const topClients = [...byClient.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([clientId, clientRevenue]) => {
          const client = clientMetadata.get(clientId)
          return {
            id: clientId,
            name: client?.name ?? clientId,
            industry: client?.industry ?? 'Сегмент не указан',
            revenue: clientRevenue,
          }
        })
      return [
        manager.id,
        {
          manager,
          funnel: managerFunnel.map((stage) => ({
            id: stage.stage,
            label: STAGE_LABELS[stage.stage],
            count: stage.count,
            width: managerFunnel[0]?.count
              ? Math.max(8, (stage.count / managerFunnel[0].count) * 100)
              : 0,
          })),
          topClients,
          recentDeals: managerRecentDeals,
          staleDeals: managerStaleDeals,
          comparisons: {
            planPoints: manager.planRate - managerSummary.planAchievement * 100,
            winRatePoints: manager.winRate - managerSummary.departmentWinRate,
            cycleDays: (manager.cycle ?? 0) - managerSummary.departmentCycleDays,
            hygienePoints: manager.hygieneScore - managerSummary.departmentHygiene,
          },
        },
      ]
    }),
  )

  const staleAssessments = detectStaleDeals(activeDeals, effectiveAsOf, {
    inactivityDays: 7,
  })
  const riskDeals = staleAssessments.map((assessment): DashboardRiskDeal => ({
    id: assessment.deal.id,
    clientId: assessment.deal.clientId,
    client: assessment.deal.clientName,
    deal: assessment.deal.product,
    managerId: assessment.deal.managerId,
    manager: assessment.deal.managerName,
    stage: STAGE_LABELS[assessment.stage],
    stageId: assessment.stage,
    amount: assessment.deal.amount,
    probability: Math.round(assessment.deal.probability * 100),
    days: assessment.daysOnStage,
    inactivity: assessment.daysInactive,
    lastActivity: displayDate(assessment.deal.lastActivityAt),
    score: assessment.score,
    level: assessment.level,
    reason: assessmentReason(assessment),
  }))
  const riskTotal = riskDeals.reduce((sum, deal) => sum + deal.amount, 0)
  const bucketDefinitions = [
    { label: 'Нет активности >14 дней', tone: 'critical' as const },
    { label: 'Просрочен текущий этап', tone: 'warning' as const },
    { label: 'Низкая вероятность', tone: 'muted' as const },
    { label: 'Нет активности 8–14 дней', tone: 'neutral' as const },
  ]
  const moneyAtRisk = bucketDefinitions
    .map((definition, index): DashboardRiskBucket => {
      const rows = staleAssessments.filter((assessment) => riskBucketKey(assessment) === index)
      const amount = rows.reduce((sum, assessment) => sum + assessment.deal.amount, 0)
      return {
        ...definition,
        amount,
        count: rows.length,
        share: riskTotal ? round((amount / riskTotal) * 100) : 0,
      }
    })
    .filter((bucket) => bucket.count > 0)
  const priorityDeals = riskDeals.slice(0, 5)
  const riskSummary: DemoDashboardModel['riskSummary'] = {
    amount: riskTotal,
    count: riskDeals.length,
    pipelineShare: activePipeline ? riskTotal / activePipeline : 0,
    recoverableWeighted: priorityDeals.reduce(
      (sum, deal) => sum + deal.amount * (deal.probability / 100),
      0,
    ),
    priorityCount: priorityDeals.length,
  }

  const { rows: clients, concentration } = clientRows(scopedDeals, scopedClients, currentPeriod)
  const currentWon = wonInPeriod(scopedDeals, currentPeriod)
  const previousWon = comparePeriod ? wonInPeriod(scopedDeals, comparePeriod) : []
  const repeatRate = currentWon.length
    ? currentWon.filter((deal) => deal.source === 'repeat').length / currentWon.length
    : 0
  const previousRepeatRate = previousWon.length
    ? previousWon.filter((deal) => deal.source === 'repeat').length / previousWon.length
    : 0
  const currentClientIds = new Set(currentDeals.map((deal) => deal.clientId))
  const previousClientIds = new Set(
    comparePeriod
      ? currentPeriodDeals(scopedDeals, comparePeriod).map((deal) => deal.clientId)
      : [],
  )
  const lifetimeRevenue = scopedDeals
    .filter((deal) => currentClientIds.has(deal.clientId) && deal.stage === 'won')
    .reduce((sum, deal) => sum + deal.amount, 0)
  const abc = concentration.entries.reduce<DemoDashboardModel['clientSummary']['abc']>(
    (result, entry) => {
      result[entry.abcClass].clients += 1
      result[entry.abcClass].share += entry.share
      return result
    },
    {
      A: { clients: 0, share: 0 },
      B: { clients: 0, share: 0 },
      C: { clients: 0, share: 0 },
    },
  )
  ;(Object.keys(abc) as Array<keyof typeof abc>).forEach((key) => {
    abc[key].share = round(abc[key].share * 100)
  })
  const top3Share = concentration.entries.slice(0, 3).reduce((sum, entry) => sum + entry.share, 0)
  const top5Share = concentration.entries.slice(0, 5).reduce((sum, entry) => sum + entry.share, 0)
  const clientSummary: DemoDashboardModel['clientSummary'] = {
    activeClients: currentClientIds.size,
    previousActiveClients: previousClientIds.size,
    repeatRate,
    previousRepeatRate,
    lifetimeRevenue,
    averageTicket,
    averageTicketChange: comparePeriod ? averageComparison.relativeChange : null,
    top3Share,
    top5Share,
    hhi: concentration.hhi,
    concentrationLabel:
      concentration.hhi < 1_000
        ? 'Низкая концентрация'
        : concentration.hhi < 1_800
          ? 'Умеренная концентрация'
          : 'Высокая концентрация',
    abc,
  }

  const sources = sourceRows(scopedDeals, currentPeriod)
  const previousSources = comparePeriod ? sourceRows(scopedDeals, comparePeriod) : []
  const repeatRevenue = sources.find((source) => source.id === 'repeat')?.revenue ?? 0
  const previousRepeatRevenue =
    previousSources.find((source) => source.id === 'repeat')?.revenue ?? 0
  const lostReasons = lostReasonRows(scopedDeals, currentPeriod)
  const lostTotal = lostReasons.reduce((sum, reason) => sum + reason.amount, 0)
  const lostCount = lostReasons.reduce((sum, reason) => sum + reason.deals, 0)
  const manageableLossAmount = lostReasons
    .filter((reason) => reason.id === 'price' || reason.id === 'timing')
    .reduce((sum, reason) => sum + reason.amount, 0)
  const weakSource =
    [...sources]
      .filter((source) => source.leads > 0)
      .sort(
        (left, right) => right.leadShare - right.saleShare - (left.leadShare - left.saleShare),
      )[0] ?? null
  const bestSource =
    [...sources]
      .filter((source) => source.sales > 0)
      .sort(
        (left, right) => right.conversion - left.conversion || right.average - left.average,
      )[0] ?? null
  const salesSummary: DemoDashboardModel['salesSummary'] = {
    revenue,
    previousRevenue,
    revenueChange: comparePeriod ? revenueComparison.relativeChange : null,
    plan,
    planAchievement: plan ? revenue / plan : 0,
    forecast,
    forecastGap,
    forecastGapRatio,
    newRevenue: revenue - repeatRevenue,
    repeatRevenue,
    repeatRevenueChange: comparePeriod
      ? comparePeriods(repeatRevenue, previousRepeatRevenue).relativeChange
      : null,
    lostTotal,
    lostCount,
    manageableLossAmount,
    manageableLossShare: lostTotal ? manageableLossAmount / lostTotal : 0,
    bestSource,
    weakSource,
  }

  const insightInput = {
    deals: scopedDeals,
    managers: teamManagers,
    clients: scopedClients,
    salesPlans: scopedPlans,
    currentPeriod,
    previousPeriod: comparePeriod || null,
    asOf: effectiveAsOf,
  }
  const engineInsights = generateInsights(insightInput)
  const overviewInsights = engineInsights.map((insight): DashboardInsight => ({
    id: insight.id,
    eyebrow: INSIGHT_CATEGORY_LABELS[insight.category],
    title: insight.title,
    text: insight.summary,
    action: insight.action.label,
    target: insight.action.view as DashboardView,
    tone: insight.severity,
    category: insight.category,
    entityIds: insight.entityIds,
  }))
  const problems = engineInsights.slice(0, 4).map((insight): DashboardProblem => ({
    id: insight.id,
    eyebrow: INSIGHT_CATEGORY_LABELS[insight.category],
    title: insight.title,
    text: insight.summary,
    action: insight.action.label,
    target: insight.action.view as DashboardView,
    tone: insight.severity,
    category: insight.category,
    entityIds: insight.entityIds,
    priority: insight.severity === 'critical' ? 'P1' : 'P2',
    owner: PROBLEM_META[insight.category].owner,
    due: PROBLEM_META[insight.category].due,
    impact: insight.impact,
  }))

  const revenueTone: DashboardKpi['tone'] =
    revenueComparison.relativeChange === null
      ? 'neutral'
      : revenueComparison.relativeChange >= 0
        ? 'positive'
        : 'negative'
  const averageTone: DashboardKpi['tone'] =
    averageComparison.relativeChange === null
      ? 'neutral'
      : averageComparison.relativeChange >= 0
        ? 'positive'
        : 'negative'
  const conversionDeltaPoints = (conversion - previousConversion) * 100
  const comparisonContext = comparePeriod
    ? `к ${formatMonth(comparePeriod.start, 'short')}`
    : 'без сравнения'
  const kpis: DashboardKpi[] = [
    {
      id: 'revenue',
      label: 'Выручка',
      value: formatRub(revenue),
      delta: comparePeriod ? formatSignedPercent(revenueComparison.relativeChange) : '—',
      context: comparisonContext,
      tone: comparePeriod ? revenueTone : 'neutral',
      spark: revenueTrend,
    },
    {
      id: 'plan',
      label: 'План',
      value: plan ? formatRub(plan) : 'Не задан',
      delta: plan ? formatPercent((revenue / plan) * 100) : '—',
      context: plan ? 'выполнено' : 'нет плана',
      tone: 'neutral',
      progress: plan ? Math.min((revenue / plan) * 100, 100) : undefined,
    },
    {
      id: 'forecast',
      label: 'Прогноз месяца',
      value: formatRub(forecast),
      delta: plan ? formatSignedMoney(forecastGap) : '—',
      context: plan ? (forecastGap < 0 ? 'до плана' : 'сверх плана') : 'план не задан',
      tone: plan ? (forecastGap >= 0 ? 'positive' : 'negative') : 'neutral',
      spark: [...revenueTrend.slice(1), forecast],
    },
    {
      id: 'pipeline',
      label: 'Сделки в работе',
      value: formatRub(activePipeline),
      delta: formatRub(weightedPipeline, true),
      context: 'с учётом шансов',
      tone: 'neutral',
      info: 'Сумма всех сделок, которые сейчас в работе. Вторая цифра — то же самое, но с поправкой на то, какие из них реально дойдут до оплаты.',
    },
    {
      id: 'conversion',
      label: 'Доля побед',
      value: formatPercent(conversion * 100),
      delta: comparePeriod ? formatSignedPoints(conversionDeltaPoints) : '—',
      context: comparisonContext,
      tone: !comparePeriod ? 'neutral' : conversionDeltaPoints >= 0 ? 'positive' : 'negative',
    },
    {
      id: 'average',
      label: 'Средний чек',
      value: formatRub(averageTicket),
      delta: comparePeriod ? formatSignedPercent(averageComparison.relativeChange) : '—',
      context: comparisonContext,
      tone: comparePeriod ? averageTone : 'neutral',
      spark: monthlyRevenueTrend(scopedDeals, currentPeriod, 9).map((monthRevenue, index) => {
        const month = addUtcMonths(currentPeriod.start, index - 8)
        const wins = wonInPeriod(scopedDeals, monthPeriod(month)).length
        return wins ? monthRevenue / wins : 0
      }),
    },
  ]
  const chartStatus = plan
    ? `${forecastGap < 0 ? 'Ниже' : 'Выше'} плана на ${formatPercent(Math.abs(forecastGapRatio) * 100)}`
    : `Прогноз ${formatRub(forecast, true)} · план не задан`
  const periods = Array.from({ length: dataset.metadata.historyMonths }, (_, index) => {
    const date = addUtcMonths(dataset.metadata.historyStart, index)
    return { value: monthKey(date), label: formatMonth(date.toISOString()) }
  }).reverse()

  return {
    filters: {
      period: currentPeriod,
      compare: comparePeriod,
      team,
      manager: selectedManager?.id ?? null,
    },
    company: dataset.company,
    asOf: effectiveAsOf,
    periodKey: monthKey(currentPeriod.start),
    periodLabel: formatMonth(currentPeriod.start),
    periodShort: formatMonth(currentPeriod.start, 'short'),
    comparisonLabel: comparePeriod ? formatMonth(comparePeriod.start) : null,
    updatedLabel: new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: dataset.company.timezone,
    })
      .format(new Date(effectiveAsOf))
      .replace('.', ''),
    recordCount: scopedDeals.length,
    currentDealCount: currentDeals.length,
    options: {
      periods,
      teams: [
        { value: 'all', label: 'Весь отдел' },
        { value: 'new', label: 'Новые продажи' },
        { value: 'key', label: 'Ключевые клиенты' },
      ],
      managers: dataset.managers.map((manager) => ({
        value: manager.id,
        label: manager.name,
      })),
    },
    kpis,
    revenueSeries: cumulativeRevenueSeries(
      scopedDeals,
      currentPeriod,
      comparePeriod,
      effectiveAsOf,
      plan,
      forecast,
    ),
    chartStatus,
    overviewInsights,
    funnelStages,
    funnelSummary: {
      leads: funnelMetrics[0]?.count ?? 0,
      leadsChange:
        comparePeriod && previousFunnelMetrics[0]?.count
          ? (funnelMetrics[0].count - previousFunnelMetrics[0].count) /
            previousFunnelMetrics[0].count
          : null,
      won: funnelMetrics.at(-1)?.count ?? 0,
      endToEndConversion: funnelMetrics[0]?.count
        ? (funnelMetrics.at(-1)?.count ?? 0) / funnelMetrics[0].count
        : 0,
      pipeline: activePipeline,
      weightedPipeline,
      averageCycleDays,
      previousAverageCycleDays,
      problemStageId: problemTransition?.from ?? null,
      problemFrom: problemTransition ? STAGE_LABELS[problemTransition.from] : '—',
      problemTo: problemTransition ? STAGE_LABELS[problemTransition.to] : '—',
      problemRate: problemTransition?.current.rate ?? 0,
      problemPreviousRate: problemTransition?.previous?.rate ?? 0,
      problemDeltaPoints: problemTransition?.deltaPoints ?? 0,
      problemLostDeals: problemTransition
        ? problemTransition.current.fromCount - problemTransition.current.toCount
        : 0,
      problemFromAmount: problemFromMetric?.amount ?? 0,
      problemToAmount: problemToMetric?.amount ?? 0,
      problemLostAmount: Math.max(
        0,
        (problemFromMetric?.amount ?? 0) - (problemToMetric?.amount ?? 0),
      ),
      problemLostAmountShare: problemFromMetric?.amount
        ? Math.max(0, problemFromMetric.amount - (problemToMetric?.amount ?? 0)) /
          problemFromMetric.amount
        : 0,
    },
    funnelLosses,
    funnelTimes: funnelMetrics.map((stage) => ({
      id: stage.stage,
      label: STAGE_LABELS[stage.stage],
      current: stage.averageDaysToStage === null ? null : round(stage.averageDaysToStage),
      previous: (() => {
        const value = previousFunnelMetrics.find(
          (item) => item.stage === stage.stage,
        )?.averageDaysToStage
        return value === null || value === undefined ? null : round(value)
      })(),
    })),
    managerRows,
    managerSummary,
    managerDetails,
    riskDeals,
    moneyAtRisk,
    riskSummary,
    clients,
    clientSummary,
    sources,
    lostReasons,
    salesSummary,
    problems,
    problemSummary: {
      critical: problems.filter((problem) => problem.priority === 'P1').length,
      warning: problems.filter((problem) => problem.priority === 'P2').length,
    },
  }
}

export const demoDashboardModel = buildDemoDashboard()

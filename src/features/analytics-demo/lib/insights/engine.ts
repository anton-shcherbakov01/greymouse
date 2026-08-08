import { FUNNEL_STAGES, type DealSource } from '../data/types'
import {
  calculateAverageTicket,
  calculateConcentration,
  calculateConversion,
  calculateRevenue,
  calculateStageConversion,
  comparePeriods,
  detectStaleDeals,
  findDepartmentPlan,
  forecastMonthRevenue,
  isInPeriod,
  monthKey,
  safePercent,
} from '../metrics'
import type { Insight, InsightEngineInput, InsightSeverity } from './types'

const SOURCE_LABELS: Record<DealSource, string> = {
  website: '\u0421\u0430\u0439\u0442',
  referral: '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u0438',
  outbound:
    '\u0425\u043e\u043b\u043e\u0434\u043d\u044b\u0435 \u043f\u0440\u043e\u0434\u0430\u0436\u0438',
  exhibition: '\u0412\u044b\u0441\u0442\u0430\u0432\u043a\u0438',
  repeat:
    '\u041f\u043e\u0432\u0442\u043e\u0440\u043d\u044b\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u044b',
  partner: '\u041f\u0430\u0440\u0442\u043d\u0451\u0440\u044b',
}

const STAGE_LABELS = {
  new: '\u041d\u043e\u0432\u044b\u0439 \u043b\u0438\u0434',
  qualification: '\u041a\u0432\u0430\u043b\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f',
  proposal: '\u041a\u041f',
  invoice: '\u0421\u0447\u0451\u0442',
  won: '\u041e\u043f\u043b\u0430\u0442\u0430',
} as const

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 4,
  warning: 3,
  positive: 2,
  neutral: 1,
}

function formatCompactMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} \u043c\u043b\u043d ₽`
  }
  return `${Math.round(amount / 1_000)} \u0442\u044b\u0441. ₽`
}

function currentCreatedDeals(input: InsightEngineInput) {
  return input.deals.filter((deal) => isInPeriod(deal.createdAt, input.currentPeriod))
}

function planForecastInsight(input: InsightEngineInput): Insight | null {
  const plan = findDepartmentPlan(input.salesPlans, monthKey(input.asOf))
  if (!plan) return null
  const revenue = calculateRevenue(input.deals, input.currentPeriod)
  const forecast = forecastMonthRevenue(revenue, input.asOf)
  const gap = forecast - plan.amount
  const gapRatio = plan.amount === 0 ? 0 : gap / plan.amount
  if (gapRatio >= -0.01) return null
  return {
    id: 'forecast-plan-gap',
    ruleId: 'forecast.plan-gap',
    ruleVersion: 1,
    category: 'forecast',
    severity: gapRatio <= -0.05 ? 'critical' : 'warning',
    title: '\u041f\u043b\u0430\u043d \u043f\u043e\u0434 \u0440\u0438\u0441\u043a\u043e\u043c',
    summary: `\u041f\u0440\u0438 \u0442\u0435\u043a\u0443\u0449\u0435\u043c \u0442\u0435\u043c\u043f\u0435 \u043c\u0435\u0441\u044f\u0446 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0441\u044f \u043d\u0430 ${formatCompactMoney(Math.abs(gap))} \u043d\u0438\u0436\u0435 \u043f\u043b\u0430\u043d\u0430 — \u0440\u0430\u0437\u0440\u044b\u0432 \u043e\u043a\u043e\u043b\u043e ${Math.round(Math.abs(gapRatio) * 100)}%.`,
    confidence: 0.78,
    impact: Math.abs(gap),
    evidence: [
      { metric: 'forecast_revenue', value: forecast, unit: 'RUB' },
      { metric: 'sales_plan', value: plan.amount, unit: 'RUB' },
      { metric: 'forecast_gap', value: gap, unit: 'RUB' },
    ],
    entityIds: [],
    action: {
      label:
        '\u0420\u0430\u0437\u043e\u0431\u0440\u0430\u0442\u044c \u043f\u0440\u043e\u0433\u043d\u043e\u0437',
      view: 'sales',
    },
  }
}

function stalePipelineInsight(input: InsightEngineInput): Insight | null {
  const stale = detectStaleDeals(input.deals, input.asOf, { inactivityDays: 7 })
  if (stale.length === 0) return null
  const amount = stale.reduce((sum, item) => sum + item.deal.amount, 0)
  return {
    id: 'pipeline-stale-deals',
    ruleId: 'pipeline.stale-deals',
    ruleVersion: 1,
    category: 'pipeline',
    severity: amount >= 3_000_000 ? 'critical' : 'warning',
    title: `${formatCompactMoney(amount)} \u0431\u0435\u0437 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u044f`,
    summary: `${stale.length} \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0441\u0434\u0435\u043b\u043e\u043a \u043d\u0435 \u043e\u0431\u043d\u043e\u0432\u043b\u044f\u043b\u0438\u0441\u044c \u0431\u043e\u043b\u0435\u0435 7 \u0434\u043d\u0435\u0439. \u0418\u0445 \u0441\u0442\u043e\u0438\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u0434\u043e \u043a\u043e\u043d\u0446\u0430 \u0434\u043d\u044f.`,
    confidence: 0.98,
    impact: amount,
    evidence: [
      { metric: 'stale_deals', value: stale.length, unit: 'count' },
      { metric: 'stale_pipeline_amount', value: amount, unit: 'RUB' },
    ],
    entityIds: stale.map((item) => item.deal.id),
    action: {
      label: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0441\u0434\u0435\u043b\u043a\u0438',
      view: 'deals',
      filter: { inactivityDays: 7 },
    },
  }
}

function managerConversionInsight(input: InsightEngineInput): Insight | null {
  const current = input.deals.filter(
    (deal) => deal.closedAt && isInPeriod(deal.closedAt, input.currentPeriod),
  )
  const departmentRate = calculateConversion(current)
  const candidates = input.managers
    .map((manager) => {
      const deals = current.filter((deal) => deal.managerId === manager.id)
      return {
        manager,
        sample: deals.length,
        rate: calculateConversion(deals),
      }
    })
    .filter((item) => item.sample >= 10 && item.rate > 0)
    .sort((left, right) => left.rate - right.rate)
  const weakest = candidates[0]
  if (!weakest) return null
  const multiplier = departmentRate / weakest.rate
  if (multiplier < 1.5) return null
  return {
    id: `manager-low-conversion-${weakest.manager.id}`,
    ruleId: 'managers.low-conversion',
    ruleVersion: 1,
    category: 'managers',
    severity: multiplier >= 2 ? 'critical' : 'warning',
    title: `\u041d\u0438\u0437\u043a\u0430\u044f \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044f: ${weakest.manager.name}`,
    summary: `${weakest.manager.name} \u0438\u043c\u0435\u0435\u0442 \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044e \u0432 \u043e\u043f\u043b\u0430\u0442\u0443 \u0432 ${multiplier.toFixed(1).replace('.', ',')} \u0440\u0430\u0437\u0430 \u043d\u0438\u0436\u0435 \u0441\u0440\u0435\u0434\u043d\u0435\u0433\u043e \u043f\u043e \u043e\u0442\u0434\u0435\u043b\u0443.`,
    confidence: weakest.sample >= 25 ? 0.92 : 0.75,
    impact: multiplier,
    evidence: [
      { metric: 'manager_conversion', value: weakest.rate, unit: 'ratio' },
      { metric: 'department_conversion', value: departmentRate, unit: 'ratio' },
      { metric: 'conversion_gap_multiplier', value: multiplier, unit: 'multiplier' },
    ],
    entityIds: [weakest.manager.id],
    action: {
      label:
        '\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043c\u0435\u043d\u0435\u0434\u0436\u0435\u0440\u0430',
      view: 'managers',
      filter: { managerId: weakest.manager.id },
    },
  }
}

function funnelDropInsight(input: InsightEngineInput): Insight | null {
  const previousPeriod = input.previousPeriod
  if (!previousPeriod) return null
  const transitions = FUNNEL_STAGES.slice(0, -1).map((from, index) => {
    const to = FUNNEL_STAGES[index + 1]
    const current = calculateStageConversion(input.deals, from, to, input.currentPeriod)
    const previous = calculateStageConversion(input.deals, from, to, previousPeriod)
    return {
      from,
      to,
      current: current.rate,
      previous: previous.rate,
      deltaPoints: (current.rate - previous.rate) * 100,
      sample: current.fromCount,
    }
  })
  const worst = transitions
    .filter((transition) => transition.sample >= 20)
    .sort((left, right) => left.deltaPoints - right.deltaPoints)[0]
  if (!worst || worst.deltaPoints > -5) return null
  return {
    id: `funnel-drop-${worst.from}-${worst.to}`,
    ruleId: 'funnel.transition-drop',
    ruleVersion: 1,
    category: 'funnel',
    severity: worst.deltaPoints <= -10 ? 'critical' : 'warning',
    title: `\u041f\u0440\u043e\u0432\u0430\u043b: ${STAGE_LABELS[worst.from]} → ${STAGE_LABELS[worst.to]}`,
    summary: `\u041a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044f «${STAGE_LABELS[worst.from]} → ${STAGE_LABELS[worst.to]}» \u0441\u043d\u0438\u0437\u0438\u043b\u0430\u0441\u044c \u0441 ${safePercent(worst.previous)}% \u0434\u043e ${safePercent(worst.current)}% — \u043d\u0430 ${Math.abs(Math.round(worst.deltaPoints))} \u043f.\u043f.`,
    confidence: 0.94,
    impact: Math.abs(worst.deltaPoints),
    evidence: [
      {
        metric: `${worst.from}_to_${worst.to}`,
        value: worst.current,
        previousValue: worst.previous,
        unit: 'ratio',
      },
      { metric: 'conversion_delta', value: worst.deltaPoints, unit: 'percentage_points' },
    ],
    entityIds: [],
    action: {
      label:
        '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0432\u043e\u0440\u043e\u043d\u043a\u0443',
      view: 'funnel',
    },
  }
}

function concentrationInsight(input: InsightEngineInput): Insight | null {
  const result = calculateConcentration(input.deals, input.currentPeriod, 3)
  if (result.totalRevenue === 0 || result.topNShare < 0.3) return null
  return {
    id: 'clients-top3-concentration',
    ruleId: 'clients.revenue-concentration',
    ruleVersion: 1,
    category: 'clients',
    severity: result.topNShare >= 0.45 ? 'critical' : 'warning',
    title:
      '\u0412\u044b\u0440\u0443\u0447\u043a\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043e\u0442 \u043a\u0440\u0443\u043f\u043d\u044b\u0445 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432',
    summary: `\u0422\u043e\u043f-3 \u043a\u043b\u0438\u0435\u043d\u0442\u0430 \u0444\u043e\u0440\u043c\u0438\u0440\u0443\u044e\u0442 ${Math.round(result.topNShare * 100)}% \u043c\u0435\u0441\u044f\u0447\u043d\u043e\u0439 \u0432\u044b\u0440\u0443\u0447\u043a\u0438.`,
    confidence: 0.99,
    impact: result.topNRevenue,
    evidence: [
      { metric: 'top3_revenue_share', value: result.topNShare, unit: 'ratio' },
      { metric: 'top3_revenue', value: result.topNRevenue, unit: 'RUB' },
    ],
    entityIds: result.entries.slice(0, 3).map((entry) => entry.clientId),
    action: {
      label:
        '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432',
      view: 'clients',
    },
  }
}

function sourceEfficiencyInsight(input: InsightEngineInput): Insight | null {
  const deals = currentCreatedDeals(input)
  const won = deals.filter((deal) => deal.stage === 'won')
  if (deals.length === 0 || won.length === 0) return null
  const sources = Object.keys(SOURCE_LABELS) as DealSource[]
  const weakest = sources
    .map((source) => {
      const leadCount = deals.filter((deal) => deal.source === source).length
      const saleCount = won.filter((deal) => deal.source === source).length
      return {
        source,
        leadCount,
        saleCount,
        leadShare: leadCount / deals.length,
        saleShare: saleCount / won.length,
      }
    })
    .filter((item) => item.leadShare >= 0.1 && item.saleShare <= item.leadShare * 0.4)
    .sort((left, right) => right.leadShare - right.saleShare - (left.leadShare - left.saleShare))[0]
  if (!weakest) return null
  return {
    id: `source-efficiency-${weakest.source}`,
    ruleId: 'sources.lead-sales-mismatch',
    ruleVersion: 1,
    category: 'sources',
    severity: 'warning',
    title: `\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a \u043d\u0435 \u043a\u043e\u043d\u0432\u0435\u0440\u0442\u0438\u0440\u0443\u0435\u0442: ${SOURCE_LABELS[weakest.source]}`,
    summary: `\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a «${SOURCE_LABELS[weakest.source]}» \u0434\u0430\u043b ${Math.round(weakest.leadShare * 100)}% \u043b\u0438\u0434\u043e\u0432, \u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e ${Math.round(weakest.saleShare * 100)}% \u043f\u0440\u043e\u0434\u0430\u0436.`,
    confidence: 0.9,
    impact: weakest.leadShare - weakest.saleShare,
    evidence: [
      { metric: 'source_lead_share', value: weakest.leadShare, unit: 'ratio' },
      { metric: 'source_sales_share', value: weakest.saleShare, unit: 'ratio' },
      { metric: 'source_leads', value: weakest.leadCount, unit: 'count' },
      { metric: 'source_sales', value: weakest.saleCount, unit: 'count' },
    ],
    entityIds: [],
    action: {
      label:
        '\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435 \u043e\u0431 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u0435',
      view: 'sales',
      filter: { source: weakest.source },
    },
  }
}

function averageTicketInsight(input: InsightEngineInput): Insight | null {
  const previousPeriod = input.previousPeriod
  if (!previousPeriod) return null
  const current = calculateAverageTicket(input.deals, input.currentPeriod)
  const previous = calculateAverageTicket(input.deals, previousPeriod)
  const comparison = comparePeriods(current, previous)
  if (comparison.relativeChange === null || Math.abs(comparison.relativeChange) < 0.08) {
    return null
  }
  const growing = comparison.relativeChange > 0
  return {
    id: 'sales-average-ticket-change',
    ruleId: 'sales.average-ticket-change',
    ruleVersion: 1,
    category: 'sales',
    severity: growing ? 'positive' : 'warning',
    title: growing
      ? '\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0447\u0435\u043a \u0440\u0430\u0441\u0442\u0451\u0442'
      : '\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0447\u0435\u043a \u0441\u043d\u0438\u0437\u0438\u043b\u0441\u044f',
    summary: `\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0447\u0435\u043a ${growing ? '\u0443\u0432\u0435\u043b\u0438\u0447\u0438\u043b\u0441\u044f' : '\u0441\u043d\u0438\u0437\u0438\u043b\u0441\u044f'} \u043d\u0430 ${Math.round(Math.abs(comparison.relativeChange) * 100)}% \u043a \u043f\u0440\u043e\u0448\u043b\u043e\u043c\u0443 \u043f\u0435\u0440\u0438\u043e\u0434\u0443.`,
    confidence: 0.96,
    impact: Math.abs(comparison.absoluteChange),
    evidence: [
      {
        metric: 'average_ticket',
        value: current,
        previousValue: previous,
        unit: 'RUB',
      },
    ],
    entityIds: [],
    action: {
      label:
        '\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435 \u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u0445',
      view: 'sales',
    },
  }
}

/** Algorithmic executive summary. No claim or numeric value is hardcoded. */
export function generateInsights(input: InsightEngineInput): Insight[] {
  const insights = [
    planForecastInsight(input),
    stalePipelineInsight(input),
    managerConversionInsight(input),
    funnelDropInsight(input),
    concentrationInsight(input),
    sourceEfficiencyInsight(input),
    averageTicketInsight(input),
  ].filter((insight): insight is Insight => insight !== null)

  return insights.sort(
    (left, right) =>
      SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity] ||
      right.impact - left.impact ||
      left.ruleId.localeCompare(right.ruleId),
  )
}

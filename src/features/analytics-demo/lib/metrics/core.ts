import { ACTIVE_PIPELINE_STAGES, type Deal, type SalesPlan } from '../data/types'
import {
  daysInUtcMonth,
  differenceInCalendarDays,
  isInPeriod,
  round,
  startOfUtcMonth,
  toDate,
} from './date'
import type { DatePeriod, PeriodComparison, PercentagePointComparison } from './types'

export const isWonDeal = (deal: Deal): boolean => deal.stage === 'won'
export const isLostDeal = (deal: Deal): boolean => deal.stage === 'lost'
export const isClosedDeal = (deal: Deal): boolean => isWonDeal(deal) || isLostDeal(deal)
export const isActiveDeal = (deal: Deal): boolean =>
  ACTIVE_PIPELINE_STAGES.includes(deal.stage as (typeof ACTIVE_PIPELINE_STAGES)[number])

export function dealsCreatedInPeriod(deals: readonly Deal[], period: DatePeriod): Deal[] {
  return deals.filter((deal) => isInPeriod(deal.createdAt, period))
}

export function dealsClosedInPeriod(deals: readonly Deal[], period: DatePeriod): Deal[] {
  return deals.filter((deal) => deal.closedAt !== null && isInPeriod(deal.closedAt, period))
}

/** Recognized revenue: won deal amounts by close date. */
export function calculateRevenue(deals: readonly Deal[], period?: DatePeriod): number {
  return deals.reduce((sum, deal) => {
    if (!isWonDeal(deal)) return sum
    if (period && (!deal.closedAt || !isInPeriod(deal.closedAt, period))) return sum
    return sum + deal.amount
  }, 0)
}

/** Sales conversion (win rate) among terminal deals. Returns a 0..1 ratio. */
export function calculateConversion(
  deals: readonly Deal[],
  period?: DatePeriod,
  cohort: 'created' | 'closed' = 'created',
): number {
  const scoped = period
    ? deals.filter((deal) => {
        const date = cohort === 'closed' ? deal.closedAt : deal.createdAt
        return date !== null && isInPeriod(date, period)
      })
    : [...deals]
  const closed = scoped.filter(isClosedDeal)
  if (closed.length === 0) return 0
  return closed.filter(isWonDeal).length / closed.length
}

export function calculateAverageTicket(deals: readonly Deal[], period?: DatePeriod): number {
  const won = deals.filter(
    (deal) =>
      isWonDeal(deal) && (!period || (deal.closedAt !== null && isInPeriod(deal.closedAt, period))),
  )
  return won.length === 0 ? 0 : calculateRevenue(won) / won.length
}

/** Ratio where 1 = 100% plan achievement. */
export function calculatePlanAchievement(actualRevenue: number, plan: number | SalesPlan): number {
  const target = typeof plan === 'number' ? plan : plan.amount
  if (target <= 0) return 0
  return actualRevenue / target
}

export function calculateActivePipeline(deals: readonly Deal[]): number {
  return deals.reduce((sum, deal) => sum + (isActiveDeal(deal) ? deal.amount : 0), 0)
}

/** Active deal amount multiplied by its explicit close probability. */
export function calculateWeightedPipeline(deals: readonly Deal[]): number {
  return deals.reduce(
    (sum, deal) =>
      sum + (isActiveDeal(deal) ? deal.amount * Math.min(1, Math.max(0, deal.probability)) : 0),
    0,
  )
}

export function calculateSalesCycleDays(deals: readonly Deal[]): number {
  const closed = deals.filter((deal) => deal.closedAt !== null)
  if (closed.length === 0) return 0
  return (
    closed.reduce(
      (sum, deal) => sum + differenceInCalendarDays(deal.closedAt as string, deal.createdAt),
      0,
    ) / closed.length
  )
}

export function comparePeriods(current: number, previous: number): PeriodComparison {
  const absoluteChange = current - previous
  const relativeChange = previous === 0 ? null : absoluteChange / Math.abs(previous)
  return {
    current,
    previous,
    absoluteChange,
    relativeChange,
    relativeChangePercent: relativeChange === null ? null : relativeChange * 100,
  }
}

export function comparePercentagePoints(
  currentRatio: number,
  previousRatio: number,
): PercentagePointComparison {
  return {
    ...comparePeriods(currentRatio, previousRatio),
    percentagePointChange: (currentRatio - previousRatio) * 100,
  }
}

/** Simple run-rate forecast for a partial calendar month. */
export function forecastMonthRevenue(recognizedRevenue: number, asOf: string | Date): number {
  const date = toDate(asOf)
  const elapsedDays = Math.max(1, differenceInCalendarDays(date, startOfUtcMonth(date)) + 1)
  return (recognizedRevenue / elapsedDays) * daysInUtcMonth(date)
}

export function findDepartmentPlan(
  plans: readonly SalesPlan[],
  period: string,
): SalesPlan | undefined {
  return plans.find((plan) => plan.period === period && plan.scope === 'department')
}

export function safePercent(value: number, digits = 1): number {
  return round(value * 100, digits)
}

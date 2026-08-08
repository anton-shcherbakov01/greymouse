import { FUNNEL_STAGES, type Deal, type FunnelStage } from '../data/types'
import { differenceInCalendarDays, isInPeriod } from './date'
import type { DatePeriod, FunnelStageMetric, FunnelTransitionMetric } from './types'

const STAGE_INDEX = new Map<FunnelStage, number>(
  FUNNEL_STAGES.map((stage, index) => [stage, index]),
)

function terminalReachedIndex(deal: Deal): number {
  if (deal.stage === 'won') return FUNNEL_STAGES.length - 1
  const stage = deal.stage === 'lost' ? (deal.lostAtStage ?? 'new') : deal.stage
  return STAGE_INDEX.get(stage) ?? 0
}

/**
 * Uses explicit stage history when present. For imported snapshot-only deals, the
 * ordered funnel fallback assumes every earlier stage was reached.
 */
export function dealReachedStage(deal: Deal, stage: FunnelStage): boolean {
  if (deal.stageHistory?.some((event) => event.stage === stage)) return true
  return terminalReachedIndex(deal) >= (STAGE_INDEX.get(stage) ?? 0)
}

export function calculateStageConversion(
  deals: readonly Deal[],
  from: FunnelStage,
  to: FunnelStage,
  period?: DatePeriod,
): FunnelTransitionMetric {
  const fromIndex = STAGE_INDEX.get(from) ?? 0
  const toIndex = STAGE_INDEX.get(to) ?? 0
  if (toIndex <= fromIndex) {
    throw new RangeError(`Target stage ${to} must follow ${from}`)
  }
  const cohort = period ? deals.filter((deal) => isInPeriod(deal.createdAt, period)) : [...deals]
  const fromDeals = cohort.filter((deal) => dealReachedStage(deal, from))
  const toCount = fromDeals.filter((deal) => dealReachedStage(deal, to)).length
  return {
    from,
    to,
    fromCount: fromDeals.length,
    toCount,
    rate: fromDeals.length === 0 ? 0 : toCount / fromDeals.length,
  }
}

function averageDaysToStage(deals: readonly Deal[], stage: FunnelStage): number | null {
  const durations = deals.flatMap((deal) => {
    const event = deal.stageHistory?.find((item) => item.stage === stage)
    return event ? [differenceInCalendarDays(event.enteredAt, deal.createdAt)] : []
  })
  if (durations.length === 0) return null
  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
}

export function calculateFunnel(deals: readonly Deal[], period?: DatePeriod): FunnelStageMetric[] {
  const cohort = period ? deals.filter((deal) => isInPeriod(deal.createdAt, period)) : [...deals]

  return FUNNEL_STAGES.map((stage, index) => {
    const reached = cohort.filter((deal) => dealReachedStage(deal, stage))
    const previousStage = index > 0 ? FUNNEL_STAGES[index - 1] : null
    const previousCount = previousStage
      ? cohort.filter((deal) => dealReachedStage(deal, previousStage)).length
      : null
    return {
      stage,
      count: reached.length,
      amount: reached.reduce((sum, deal) => sum + deal.amount, 0),
      conversionFromPrevious:
        previousCount === null ? null : previousCount === 0 ? 0 : reached.length / previousCount,
      averageDaysToStage: averageDaysToStage(reached, stage),
    }
  })
}

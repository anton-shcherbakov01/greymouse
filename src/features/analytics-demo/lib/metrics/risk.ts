import type { ActivePipelineStage, Deal } from '../data/types'
import { differenceInCalendarDays, clamp } from './date'
import { isActiveDeal } from './core'
import type { DealRiskAssessment, DealRiskReason } from './types'

export const DEFAULT_STAGE_LIMIT_DAYS: Record<ActivePipelineStage, number> = {
  new: 3,
  qualification: 7,
  proposal: 10,
  invoice: 7,
}

export interface RiskOptions {
  inactivityDays?: number
  highValueThreshold?: number
  stageLimits?: Partial<Record<ActivePipelineStage, number>>
}

/** Strictly more than the threshold, matching “no activity for >7 days”. */
export function isStaleDeal(deal: Deal, asOf: string | Date, inactivityDays = 7): boolean {
  return (
    isActiveDeal(deal) &&
    differenceInCalendarDays(asOf, deal.lastActivityAt || deal.createdAt) > inactivityDays
  )
}

export function assessDealRisk(
  deal: Deal,
  asOf: string | Date,
  options: RiskOptions = {},
): DealRiskAssessment | null {
  if (!isActiveDeal(deal)) return null
  const stage = deal.stage as ActivePipelineStage
  const inactivityDays = options.inactivityDays ?? 7
  const highValueThreshold = options.highValueThreshold ?? 750_000
  const stageLimit = {
    ...DEFAULT_STAGE_LIMIT_DAYS,
    ...options.stageLimits,
  }[stage]
  const daysInactive = Math.max(
    0,
    differenceInCalendarDays(asOf, deal.lastActivityAt || deal.createdAt),
  )
  const daysOnStage = Math.max(
    0,
    differenceInCalendarDays(asOf, deal.stageEnteredAt || deal.createdAt),
  )
  const reasons: DealRiskReason[] = []
  let score = 0

  if (daysInactive > inactivityDays) {
    reasons.push('inactive')
    score += clamp(22 + (daysInactive - inactivityDays) * 3, 22, 45)
  }
  if (daysOnStage > stageLimit) {
    reasons.push('stage_overdue')
    score += clamp(15 + (daysOnStage - stageLimit) * 2, 15, 35)
  }
  if (deal.probability < 0.25) {
    reasons.push('low_probability')
    score += 12
  }
  if (deal.amount >= highValueThreshold) {
    reasons.push('high_value')
    score += 10
  }
  score = Math.round(clamp(score, 0, 100))

  return {
    deal,
    daysInactive,
    daysOnStage,
    score,
    level: score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low',
    reasons,
    stage,
  }
}

export function detectStaleDeals(
  deals: readonly Deal[],
  asOf: string | Date,
  options: RiskOptions = {},
): DealRiskAssessment[] {
  return deals
    .filter((deal) => isStaleDeal(deal, asOf, options.inactivityDays ?? 7))
    .map((deal) => assessDealRisk(deal, asOf, options))
    .filter((assessment): assessment is DealRiskAssessment => assessment !== null)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.deal.amount - left.deal.amount ||
        left.deal.id.localeCompare(right.deal.id),
    )
}

export function calculateMoneyAtRisk(
  deals: readonly Deal[],
  asOf: string | Date,
  options: RiskOptions = {},
): number {
  return deals.reduce((sum, deal) => {
    const risk = assessDealRisk(deal, asOf, options)
    return sum + (risk && risk.level !== 'low' ? deal.amount : 0)
  }, 0)
}

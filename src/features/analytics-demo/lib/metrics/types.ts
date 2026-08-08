import type { ActivePipelineStage, Deal, FunnelStage } from '../data/types'

export interface DatePeriod {
  /** Inclusive ISO boundary. */
  start: string
  /** Exclusive ISO boundary. */
  end: string
}

export interface PeriodComparison {
  current: number
  previous: number
  absoluteChange: number
  /** Null when the previous value is zero and relative change is undefined. */
  relativeChange: number | null
  relativeChangePercent: number | null
}

export interface PercentagePointComparison extends PeriodComparison {
  percentagePointChange: number
}

export interface FunnelStageMetric {
  stage: FunnelStage
  count: number
  amount: number
  conversionFromPrevious: number | null
  averageDaysToStage: number | null
}

export interface FunnelTransitionMetric {
  from: FunnelStage
  to: FunnelStage
  fromCount: number
  toCount: number
  rate: number
}

export type DealRiskReason = 'inactive' | 'stage_overdue' | 'low_probability' | 'high_value'

export interface DealRiskAssessment {
  deal: Deal
  daysInactive: number
  daysOnStage: number
  score: number
  level: 'low' | 'medium' | 'high'
  reasons: DealRiskReason[]
  stage: ActivePipelineStage
}

export interface ConcentrationEntry {
  clientId: string
  clientName: string
  revenue: number
  share: number
  rank: number
  cumulativeShare: number
  abcClass: 'A' | 'B' | 'C'
}

export interface ConcentrationResult {
  totalRevenue: number
  uniqueClients: number
  topN: number
  topNRevenue: number
  topNShare: number
  /** Herfindahl-Hirschman index on a 0..10,000 scale. */
  hhi: number
  entries: ConcentrationEntry[]
}

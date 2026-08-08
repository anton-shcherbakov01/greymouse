import type { Client, Deal, Manager, SalesPlan } from '../data/types'
import type { DatePeriod } from '../metrics'

export type InsightSeverity = 'critical' | 'warning' | 'positive' | 'neutral'
export type InsightCategory =
  'forecast' | 'pipeline' | 'funnel' | 'managers' | 'clients' | 'sources' | 'sales'

export interface InsightEvidence {
  metric: string
  value: number
  previousValue?: number
  unit: 'RUB' | 'count' | 'ratio' | 'percentage_points' | 'multiplier'
}

export interface InsightAction {
  label: string
  view: 'sales' | 'funnel' | 'managers' | 'deals' | 'clients'
  filter?: Record<string, string | number>
}

export interface Insight {
  id: string
  ruleId: string
  ruleVersion: 1
  category: InsightCategory
  severity: InsightSeverity
  title: string
  summary: string
  confidence: number
  impact: number
  evidence: InsightEvidence[]
  entityIds: string[]
  action: InsightAction
}

export interface InsightEngineInput {
  deals: readonly Deal[]
  managers: readonly Manager[]
  clients: readonly Client[]
  salesPlans: readonly SalesPlan[]
  currentPeriod: DatePeriod
  /** Null disables rules that require a period-over-period comparison. */
  previousPeriod: DatePeriod | null
  asOf: string
}

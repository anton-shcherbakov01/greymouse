import type { Deal, Manager, SalesPlan } from '../data/types'
import {
  calculateActivePipeline,
  calculateAverageTicket,
  calculateConversion,
  calculatePlanAchievement,
  calculateRevenue,
  calculateSalesCycleDays,
  calculateWeightedPipeline,
  comparePeriods,
  detectStaleDeals,
} from '../metrics'
import { clamp, isInPeriod, round } from '../metrics/date'
import type { DatePeriod } from '../metrics/types'

export interface SalesScoreInput {
  planAchievement: number
  winRate: number
  departmentWinRate: number
  weightedPipelineCoverage: number
  cycleDays: number
  departmentCycleDays: number
  stalePipelineShare: number
}

export interface SalesScoreBreakdown {
  plan: number
  winRate: number
  pipelineCoverage: number
  cycleEfficiency: number
  hygiene: number
}

export interface SalesScoreResult {
  score: number
  version: 'sales-score-v1'
  breakdown: SalesScoreBreakdown
}

const SCORE_WEIGHTS: Record<keyof SalesScoreBreakdown, number> = {
  plan: 0.4,
  winRate: 0.25,
  pipelineCoverage: 0.15,
  cycleEfficiency: 0.1,
  hygiene: 0.1,
}

/** Explainable 0..100 score. Each component is independently capped. */
export function calculateSalesScore(input: SalesScoreInput): SalesScoreResult {
  const breakdown: SalesScoreBreakdown = {
    plan: round(clamp(input.planAchievement, 0, 1) * 100, 2),
    winRate: round(
      clamp(
        input.departmentWinRate > 0
          ? input.winRate / input.departmentWinRate
          : input.winRate > 0
            ? 1
            : 0,
        0,
        1,
      ) * 100,
      2,
    ),
    pipelineCoverage: round(clamp(input.weightedPipelineCoverage, 0, 1) * 100, 2),
    cycleEfficiency: round(
      clamp(
        input.cycleDays > 0 && input.departmentCycleDays > 0
          ? input.departmentCycleDays / input.cycleDays
          : 0,
        0,
        1,
      ) * 100,
      2,
    ),
    hygiene: round(clamp(1 - input.stalePipelineShare, 0, 1) * 100, 2),
  }
  const score = Object.entries(breakdown).reduce(
    (sum, [key, value]) => sum + value * SCORE_WEIGHTS[key as keyof SalesScoreBreakdown],
    0,
  )
  return { score: Math.round(clamp(score, 0, 100)), version: 'sales-score-v1', breakdown }
}

export interface ManagerPerformance {
  manager: Manager
  revenue: number
  plan: number
  planAchievement: number
  pipeline: number
  weightedPipeline: number
  wonDeals: number
  closedDeals: number
  winRate: number
  averageTicket: number
  averageCycleDays: number
  staleDeals: number
  stalePipelineAmount: number
  revenueChange: number | null
  salesScore: SalesScoreResult
}

export interface ScoreManagersInput {
  deals: readonly Deal[]
  managers: readonly Manager[]
  plans: readonly SalesPlan[]
  currentPeriod: DatePeriod
  previousPeriod: DatePeriod
  currentPlanPeriod: string
  asOf: string
}

export function scoreManagers(input: ScoreManagersInput): ManagerPerformance[] {
  const currentClosed = input.deals.filter(
    (deal) => deal.closedAt && isInPeriod(deal.closedAt, input.currentPeriod),
  )
  const departmentWinRate = calculateConversion(currentClosed, undefined, 'closed')
  const departmentCycleDays = calculateSalesCycleDays(currentClosed)

  return input.managers
    .map((manager): ManagerPerformance => {
      const managerDeals = input.deals.filter((deal) => deal.managerId === manager.id)
      const currentManagerDeals = managerDeals.filter(
        (deal) => deal.closedAt && isInPeriod(deal.closedAt, input.currentPeriod),
      )
      const activeManagerDeals = managerDeals.filter((deal) =>
        ['new', 'qualification', 'proposal', 'invoice'].includes(deal.stage),
      )
      const revenue = calculateRevenue(managerDeals, input.currentPeriod)
      const previousRevenue = calculateRevenue(managerDeals, input.previousPeriod)
      const plan =
        input.plans.find(
          (item) =>
            item.period === input.currentPlanPeriod &&
            item.scope === 'manager' &&
            item.managerId === manager.id,
        )?.amount ?? 0
      const pipeline = calculateActivePipeline(activeManagerDeals)
      const weightedPipeline = calculateWeightedPipeline(activeManagerDeals)
      const stale = detectStaleDeals(activeManagerDeals, input.asOf)
      const stalePipelineAmount = stale.reduce((sum, assessment) => sum + assessment.deal.amount, 0)
      const winRate = calculateConversion(currentManagerDeals, undefined, 'closed')
      const averageCycleDays = calculateSalesCycleDays(currentManagerDeals)
      const remainingPlan = Math.max(0, plan - revenue)
      const salesScore = calculateSalesScore({
        planAchievement: calculatePlanAchievement(revenue, plan),
        winRate,
        departmentWinRate,
        weightedPipelineCoverage: remainingPlan === 0 ? 1 : weightedPipeline / remainingPlan,
        cycleDays: averageCycleDays,
        departmentCycleDays,
        stalePipelineShare: pipeline === 0 ? 1 : stalePipelineAmount / pipeline,
      })

      return {
        manager,
        revenue,
        plan,
        planAchievement: calculatePlanAchievement(revenue, plan),
        pipeline,
        weightedPipeline,
        wonDeals: currentManagerDeals.filter((deal) => deal.stage === 'won').length,
        closedDeals: currentManagerDeals.filter((deal) => ['won', 'lost'].includes(deal.stage))
          .length,
        winRate,
        averageTicket: calculateAverageTicket(managerDeals, input.currentPeriod),
        averageCycleDays,
        staleDeals: stale.length,
        stalePipelineAmount,
        revenueChange: comparePeriods(revenue, previousRevenue).relativeChange,
        salesScore,
      }
    })
    .sort(
      (left, right) =>
        right.salesScore.score - left.salesScore.score ||
        right.revenue - left.revenue ||
        left.manager.id.localeCompare(right.manager.id),
    )
    .map((item) => ({
      ...item,
      averageCycleDays: round(item.averageCycleDays, 1),
    }))
}

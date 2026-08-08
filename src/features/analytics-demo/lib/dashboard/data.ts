/**
 * Compatibility facade for the UI. Every demo export below is an alias of the
 * same model built from `demoDataset`; no display metric is maintained twice.
 */
export * from './model'

import { demoDashboardModel } from './model'

export const kpis = demoDashboardModel.kpis
export const revenueSeries = demoDashboardModel.revenueSeries
export const funnelStages = demoDashboardModel.funnelStages
export const managerRows = demoDashboardModel.managerRows
export const riskDeals = demoDashboardModel.riskDeals
export const clients = demoDashboardModel.clients
export const sources = demoDashboardModel.sources
export const lostReasons = demoDashboardModel.lostReasons
export const moneyAtRisk = demoDashboardModel.moneyAtRisk
export const overviewInsights = demoDashboardModel.overviewInsights

export const funnelSummary = demoDashboardModel.funnelSummary
export const funnelLosses = demoDashboardModel.funnelLosses
export const funnelTimes = demoDashboardModel.funnelTimes
export const managerSummary = demoDashboardModel.managerSummary
export const managerDetails = demoDashboardModel.managerDetails
export const riskSummary = demoDashboardModel.riskSummary
export const clientSummary = demoDashboardModel.clientSummary
export const salesSummary = demoDashboardModel.salesSummary
export const problems = demoDashboardModel.problems
export const problemSummary = demoDashboardModel.problemSummary

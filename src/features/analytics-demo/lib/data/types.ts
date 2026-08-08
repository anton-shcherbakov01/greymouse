export const ACTIVE_PIPELINE_STAGES = ['new', 'qualification', 'proposal', 'invoice'] as const

export const FUNNEL_STAGES = [...ACTIVE_PIPELINE_STAGES, 'won'] as const

export type ActivePipelineStage = (typeof ACTIVE_PIPELINE_STAGES)[number]
export type FunnelStage = (typeof FUNNEL_STAGES)[number]
export type DealStage = ActivePipelineStage | 'won' | 'lost'

export interface DealStageEvent {
  stage: DealStage
  enteredAt: string
  exitedAt: string | null
}

export const DEAL_SOURCES = [
  'website',
  'referral',
  'outbound',
  'exhibition',
  'repeat',
  'partner',
] as const

export type DealSource = (typeof DEAL_SOURCES)[number]

export const LOSS_REASONS = [
  'price',
  'no_budget',
  'competitor',
  'no_response',
  'timing',
  'product_fit',
] as const

export type LossReason = (typeof LOSS_REASONS)[number]

export const PRODUCTS = [
  '\u041a\u043e\u043c\u043f\u0440\u0435\u0441\u0441\u043e\u0440\u043d\u043e\u0435 \u043e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u0435',
  '\u041d\u0430\u0441\u043e\u0441\u043d\u044b\u0435 \u0441\u0438\u0441\u0442\u0435\u043c\u044b',
  '\u0421\u0442\u0430\u043d\u043e\u0447\u043d\u0430\u044f \u043e\u0441\u043d\u0430\u0441\u0442\u043a\u0430',
  '\u041f\u0440\u043e\u043c\u044b\u0448\u043b\u0435\u043d\u043d\u0430\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u043a\u0430',
  '\u0421\u0435\u0440\u0432\u0438\u0441 \u0438 \u0437\u0430\u043f\u0447\u0430\u0441\u0442\u0438',
] as const

export type Product = (typeof PRODUCTS)[number]

export const REGIONS = [
  '\u041c\u043e\u0441\u043a\u0432\u0430 \u0438 \u041c\u041e',
  '\u0421\u0435\u0432\u0435\u0440\u043e-\u0417\u0430\u043f\u0430\u0434',
  '\u0426\u0435\u043d\u0442\u0440',
  '\u041f\u043e\u0432\u043e\u043b\u0436\u044c\u0435',
  '\u0423\u0440\u0430\u043b',
  '\u0421\u0438\u0431\u0438\u0440\u044c',
] as const

export type Region = (typeof REGIONS)[number]

/** Serializable CRM deal used by the data layer and pure metric functions. */
export interface Deal {
  id: string
  createdAt: string
  closedAt: string | null
  lastActivityAt: string
  /** When the deal entered its current stage (or its terminal stage). */
  stageEnteredAt: string
  clientId: string
  clientName: string
  managerId: string
  managerName: string
  stage: DealStage
  /** Potential deal value in RUB. */
  amount: number
  /** Close probability from 0 to 1. Terminal deals use 1 or 0. */
  probability: number
  source: DealSource
  lossReason: LossReason | null
  /** Last funnel stage reached before a loss. */
  lostAtStage: ActivePipelineStage | null
  /** Optional in imported snapshots; demo data contains complete ordered history. */
  stageHistory?: DealStageEvent[]
  product: Product
  region: Region
}

export interface Manager {
  id: string
  name: string
  initials: string
  role: 'manager' | 'team_lead'
  team: string
  startedAt: string
  active: boolean
  /** Stable allocation used when the department plan is split by manager. */
  planWeight: number
}

export type ClientSegment = 'strategic' | 'growth' | 'standard'

export interface Client {
  id: string
  name: string
  industry: string
  region: Region
  segment: ClientSegment
  createdAt: string
  accountManagerId: string
}

export interface SalesPlan {
  id: string
  /** Calendar month in YYYY-MM format. */
  period: string
  amount: number
  currency: 'RUB'
  scope: 'department' | 'manager'
  /** Null for the department-wide plan. */
  managerId: string | null
}

export interface CompanyProfile {
  id: string
  name: string
  legalName: string
  business: string
  currency: 'RUB'
  timezone: string
}

export interface SyntheticDatasetMetadata {
  seed: number
  generatedAt: string
  asOf: string
  historyStart: string
  historyEnd: string
  historyMonths: number
  scenario: string
}

export interface SalesDataset {
  company: CompanyProfile
  managers: Manager[]
  clients: Client[]
  deals: Deal[]
  salesPlans: SalesPlan[]
  metadata: SyntheticDatasetMetadata
}

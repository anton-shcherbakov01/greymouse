export type RawCell = string | number | boolean | Date | null | undefined

export type RawDataRow = Record<string, RawCell>

export const REQUIRED_IMPORT_FIELDS = [
  'deal_id',
  'created_at',
  'manager',
  'client',
  'stage',
  'amount',
] as const

export const OPTIONAL_IMPORT_FIELDS = [
  'last_activity',
  'closed_at',
  'source',
  'loss_reason',
  'probability',
  'product',
  'region',
] as const

export const IMPORT_FIELDS = [...REQUIRED_IMPORT_FIELDS, ...OPTIONAL_IMPORT_FIELDS] as const

export type ImportField = (typeof IMPORT_FIELDS)[number]
export type ColumnMapping = Record<string, ImportField | ''>

export interface ImportFieldDefinition {
  key: ImportField
  label: string
  description: string
  required: boolean
  aliases: readonly string[]
}

export interface ParsedSalesFile {
  fileName: string
  fileType: 'csv' | 'xlsx'
  sheetName: string | null
  headers: string[]
  rows: RawDataRow[]
  warnings: string[]
}

export const NORMALIZED_DEAL_STAGES = [
  'new',
  'qualification',
  'proposal',
  'invoice',
  'won',
  'lost',
] as const

export type NormalizedDealStage = (typeof NORMALIZED_DEAL_STAGES)[number]

/** Stable, CRM-agnostic representation persisted after a successful import. */
export interface NormalizedImportRow {
  deal_id: string
  created_at: string
  manager: string
  client: string
  stage: NormalizedDealStage
  amount: number
  last_activity: string | null
  closed_at: string | null
  source: string | null
  loss_reason: string | null
  probability: number | null
  product: string | null
  region: string | null
}

export type ImportIssueCode =
  | 'missing_required_mapping'
  | 'duplicate_mapping'
  | 'missing_value'
  | 'invalid_amount'
  | 'invalid_date'
  | 'invalid_stage'
  | 'invalid_probability'
  | 'duplicate_deal'

export interface ImportIssue {
  row: number | null
  field: ImportField | null
  code: ImportIssueCode
  severity: 'error' | 'warning'
  message: string
}

export interface ImportStats {
  totalRows: number
  importedRows: number
  skippedRows: number
  errorRows: number
  duplicateRows: number
  missingAmountRows: number
  warningRows: number
}

export interface ImportValidationResult {
  canImport: boolean
  rows: NormalizedImportRow[]
  issues: ImportIssue[]
  missingRequiredFields: ImportField[]
  duplicateMappedFields: ImportField[]
  stats: ImportStats
}

export interface StoredImportSnapshot {
  version: 1
  importedAt: string
  sourceName: string
  rows: NormalizedImportRow[]
  stats: ImportStats
}

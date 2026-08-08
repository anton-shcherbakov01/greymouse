import {
  NORMALIZED_DEAL_STAGES,
  type ImportStats,
  type NormalizedImportRow,
  type StoredImportSnapshot,
} from './types'

export const IMPORT_STORAGE_KEY = 'grey-mouse.analytics.imported-deals.v1'
export const IMPORT_STORAGE_EVENT = 'grey-mouse:data-imported'
const MAX_SNAPSHOT_CHARACTERS = 2_250_000

export function saveImportedRows(input: {
  sourceName: string
  rows: NormalizedImportRow[]
  stats: ImportStats
}): StoredImportSnapshot {
  if (typeof window === 'undefined') {
    throw new Error('Сохранение импорта доступно только в браузере.')
  }
  const snapshot: StoredImportSnapshot = {
    version: 1,
    importedAt: new Date().toISOString(),
    sourceName: input.sourceName,
    rows: input.rows,
    stats: input.stats,
  }
  const serialized = JSON.stringify(snapshot)
  if (serialized.length > MAX_SNAPSHOT_CHARACTERS) {
    throw new Error(
      'Набор данных слишком большой для локального хранения. Сократите период выгрузки или число строк.',
    )
  }
  try {
    window.localStorage.setItem(IMPORT_STORAGE_KEY, serialized)
  } catch {
    throw new Error(
      'Не хватило места в локальном хранилище браузера. Удалите старые данные или загрузите меньший файл.',
    )
  }
  window.dispatchEvent(
    new CustomEvent<StoredImportSnapshot>(IMPORT_STORAGE_EVENT, { detail: snapshot }),
  )
  return snapshot
}

export function loadImportedRows(): StoredImportSnapshot | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(IMPORT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredImportSnapshot>
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.rows) ||
      !parsed.stats ||
      !parsed.rows.every(isNormalizedImportRow)
    )
      return null
    return parsed as StoredImportSnapshot
  } catch {
    return null
  }
}

function isNormalizedImportRow(value: unknown): value is NormalizedImportRow {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<NormalizedImportRow>
  return (
    typeof row.deal_id === 'string' &&
    typeof row.created_at === 'string' &&
    typeof row.manager === 'string' &&
    typeof row.client === 'string' &&
    typeof row.amount === 'number' &&
    Number.isFinite(row.amount) &&
    NORMALIZED_DEAL_STAGES.some((stage) => stage === row.stage)
  )
}

export function clearImportedRows(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(IMPORT_STORAGE_KEY)
}

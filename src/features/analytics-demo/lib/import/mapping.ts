import { IMPORT_FIELD_DEFINITIONS } from './schema'
import { REQUIRED_IMPORT_FIELDS, type ColumnMapping, type ImportField } from './types'

export function normalizeColumnHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .normalize('NFKD')
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function aliasScore(header: string, alias: string): number {
  if (!header || !alias) return 0
  if (header === alias) return 1

  const headerTokens = header.split(' ')
  const aliasTokens = alias.split(' ')
  const headerSet = new Set(headerTokens)
  const aliasSet = new Set(aliasTokens)
  const shared = aliasTokens.filter((token) => headerSet.has(token)).length

  if (aliasTokens.every((token) => headerSet.has(token))) {
    return Math.max(0.78, 0.94 - (headerTokens.length - aliasTokens.length) * 0.035)
  }

  if (headerTokens.every((token) => aliasSet.has(token))) {
    return Math.max(0.76, 0.88 - (aliasTokens.length - headerTokens.length) * 0.035)
  }

  if (
    Math.min(header.length, alias.length) >= 5 &&
    (header.includes(alias) || alias.includes(header))
  ) {
    return 0.82
  }

  const union = new Set([...headerTokens, ...aliasTokens]).size
  const jaccard = union ? shared / union : 0
  return jaccard >= 0.66 ? jaccard * 0.78 : 0
}

interface MappingCandidate {
  header: string
  field: ImportField
  score: number
}

function isRequiredField(field: ImportField): boolean {
  return REQUIRED_IMPORT_FIELDS.some((requiredField) => requiredField === field)
}

/** Suggests a one-to-one mapping from Russian or English CRM column names. */
export function autoMapColumns(headers: readonly string[]): ColumnMapping {
  const mapping: ColumnMapping = Object.fromEntries(headers.map((header) => [header, '']))
  const candidates: MappingCandidate[] = []

  for (const header of headers) {
    const normalizedHeader = normalizeColumnHeader(header)
    for (const definition of IMPORT_FIELD_DEFINITIONS) {
      const aliases = [definition.key, ...definition.aliases]
      const score = Math.max(
        ...aliases.map((alias) => aliasScore(normalizedHeader, normalizeColumnHeader(alias))),
      )
      if (score >= 0.7) candidates.push({ header, field: definition.key, score })
    }
  }

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    const leftRequired = isRequiredField(left.field)
    const rightRequired = isRequiredField(right.field)
    return Number(rightRequired) - Number(leftRequired)
  })

  const assignedHeaders = new Set<string>()
  const assignedFields = new Set<ImportField>()
  for (const candidate of candidates) {
    if (assignedHeaders.has(candidate.header) || assignedFields.has(candidate.field)) continue
    mapping[candidate.header] = candidate.field
    assignedHeaders.add(candidate.header)
    assignedFields.add(candidate.field)
  }

  return mapping
}

export function invertColumnMapping(mapping: ColumnMapping): Partial<Record<ImportField, string>> {
  const result: Partial<Record<ImportField, string>> = {}
  for (const [header, field] of Object.entries(mapping)) {
    if (field && !result[field]) result[field] = header
  }
  return result
}

export function getMappingCoverage(mapping: ColumnMapping): {
  missingRequiredFields: ImportField[]
  duplicateMappedFields: ImportField[]
} {
  const counts = new Map<ImportField, number>()
  for (const field of Object.values(mapping)) {
    if (field) counts.set(field, (counts.get(field) ?? 0) + 1)
  }

  return {
    missingRequiredFields: REQUIRED_IMPORT_FIELDS.filter((field) => !counts.has(field)),
    duplicateMappedFields: [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([field]) => field),
  }
}

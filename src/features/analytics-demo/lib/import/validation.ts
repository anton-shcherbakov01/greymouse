import { IMPORT_FIELD_BY_KEY } from './schema'
import { getMappingCoverage, invertColumnMapping } from './mapping'
import type {
  ColumnMapping,
  ImportField,
  ImportIssue,
  ImportValidationResult,
  NormalizedDealStage,
  NormalizedImportRow,
  RawCell,
  RawDataRow,
} from './types'

/** CRM exports without an explicit offset are interpreted in the product's Europe/Moscow timezone. */
const DEFAULT_CRM_TIMEZONE_OFFSET_MINUTES = 180

function isBlank(value: RawCell): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

function toText(value: RawCell): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  return String(value ?? '').trim()
}

function parseLocaleNumber(value: RawCell): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  let text = value.trim()
  if (!text) return null
  const negativeByParentheses = /^\(.*\)$/.test(text)
  text = text
    .replace(/[\s\u00A0\u202F]/g, '')
    .replace(/[₽$€£]/g, '')
    .replace(/(?:руб(?:лей|ля|ль)?|р\.?|rub|rur)/gi, '')
    .replace(/[’']/g, '')

  if (!/[0-9]/.test(text) || /[^0-9.,+-]/.test(text)) return null

  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')
  const separator = lastComma > lastDot ? ',' : lastDot >= 0 ? '.' : null

  if (separator) {
    const appearances = text.split(separator).length - 1
    const fractionLength = text.length - text.lastIndexOf(separator) - 1
    const otherSeparator = separator === ',' ? '.' : ','
    const likelyDecimal = fractionLength > 0 && fractionLength <= 2 && appearances === 1

    if (likelyDecimal) {
      text = text.replaceAll(otherSeparator, '').replace(separator, '.')
    } else {
      text = text.replace(/[.,]/g, '')
    }
  }

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return null
  return negativeByParentheses ? -Math.abs(parsed) : parsed
}

export function normalizeAmount(value: RawCell): number | null {
  const parsed = parseLocaleNumber(value)
  return parsed !== null && parsed >= 0 ? parsed : null
}

export function normalizeProbability(value: RawCell): number | null {
  if (isBlank(value)) return null
  const hasPercentSign = typeof value === 'string' && value.includes('%')
  const source = typeof value === 'string' ? value.replace('%', '') : value
  const parsed = parseLocaleNumber(source)
  if (parsed === null || parsed < 0) return null
  const normalized = hasPercentSign || parsed > 1 ? parsed / 100 : parsed
  return normalized >= 0 && normalized <= 1 ? normalized : null
}

function excelSerialToDate(value: number): Date | null {
  if (value < 1 || value > 2_958_465) return null
  const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeDate(value: RawCell): string | null {
  if (isBlank(value)) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  if (typeof value === 'number') return excelSerialToDate(value)?.toISOString() ?? null

  const text = toText(value)
  if (/^\d+(?:[.,]\d+)?$/.test(text)) {
    return excelSerialToDate(Number(text.replace(',', '.')))?.toISOString() ?? null
  }

  const localDate = text.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})(?:[ T](\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?)?$/,
  )
  if (localDate) {
    const [, dayText, monthText, rawYear, rawHourText, minuteText = '0', secondText = '0'] =
      localDate
    const yearNumber = Number(rawYear)
    const year = yearNumber < 100 ? 2000 + yearNumber : yearNumber
    const day = Number(dayText)
    const month = Number(monthText)
    const hour = Number(rawHourText ?? '0')
    const minute = Number(minuteText)
    const second = Number(secondText)
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    const valid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day &&
      hour <= 23 &&
      minute <= 59 &&
      second <= 59
    if (!valid) return null
    const timezoneOffset = rawHourText ? DEFAULT_CRM_TIMEZONE_OFFSET_MINUTES * 60_000 : 0
    return new Date(date.getTime() - timezoneOffset).toISOString()
  }

  const isoDate = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:\s*(Z|[+-]\d{2}:?\d{2}))?)?$/,
  )
  if (!isoDate) return null

  const [
    ,
    yearText,
    monthText,
    dayText,
    rawHourText,
    minuteText = '0',
    secondText = '0',
    msText = '0',
    zone,
  ] = isoDate
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(rawHourText ?? '0')
  const minute = Number(minuteText)
  const second = Number(secondText)
  const millisecond = Number(msText.padEnd(3, '0'))
  const calendarCheck = new Date(Date.UTC(year, month - 1, day))
  const valid =
    calendarCheck.getUTCFullYear() === year &&
    calendarCheck.getUTCMonth() === month - 1 &&
    calendarCheck.getUTCDate() === day &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59
  if (!valid) return null

  if (!zone) {
    const timezoneOffset = rawHourText ? DEFAULT_CRM_TIMEZONE_OFFSET_MINUTES * 60_000 : 0
    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - timezoneOffset,
    ).toISOString()
  }
  const zonedText = `${yearText}-${monthText}-${dayText}T${rawHourText}:${minuteText}:${String(second).padStart(2, '0')}.${String(millisecond).padStart(3, '0')}${zone}`
  const parsed = new Date(zonedText)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeStage(value: RawCell): NormalizedDealStage | null {
  const text = toText(value)
  const key = text.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ')
  const aliases: Record<string, NormalizedDealStage> = {
    новый: 'new',
    новая: 'new',
    'новый лид': 'new',
    'новая сделка': 'new',
    'не обработан': 'new',
    new: 'new',
    lead: 'new',
    квалификация: 'qualification',
    'первичный контакт': 'qualification',
    'в работе': 'qualification',
    переговоры: 'qualification',
    'назначена встреча': 'qualification',
    qualification: 'qualification',
    кп: 'proposal',
    'коммерческое предложение': 'proposal',
    'коммерческое предложение отправлено': 'proposal',
    предложение: 'proposal',
    proposal: 'proposal',
    счет: 'invoice',
    'выставлен счет': 'invoice',
    'счет выставлен': 'invoice',
    invoice: 'invoice',
    оплата: 'won',
    оплачено: 'won',
    продажа: 'won',
    успех: 'won',
    'закрыта успешно': 'won',
    'успешно закрыта': 'won',
    'успешно реализовано': 'won',
    успешная: 'won',
    won: 'won',
    проиграна: 'lost',
    проигрыш: 'lost',
    отказ: 'lost',
    неуспех: 'lost',
    'закрыта неуспешно': 'lost',
    'закрыта и не реализована': 'lost',
    lost: 'lost',
  }
  return aliases[key] ?? null
}

function mappedValue(
  row: RawDataRow,
  inverseMapping: Partial<Record<ImportField, string>>,
  field: ImportField,
): RawCell {
  const source = inverseMapping[field]
  return source ? row[source] : undefined
}

export function validateAndNormalizeRows(
  sourceRows: readonly RawDataRow[],
  mapping: ColumnMapping,
): ImportValidationResult {
  const coverage = getMappingCoverage(mapping)
  const mappingIssues: ImportIssue[] = [
    ...coverage.missingRequiredFields.map<ImportIssue>((field) => ({
      row: null,
      field,
      code: 'missing_required_mapping',
      severity: 'error',
      message: `Не сопоставлено обязательное поле «${IMPORT_FIELD_BY_KEY[field].label}».`,
    })),
    ...coverage.duplicateMappedFields.map<ImportIssue>((field) => ({
      row: null,
      field,
      code: 'duplicate_mapping',
      severity: 'error',
      message: `Поле «${IMPORT_FIELD_BY_KEY[field].label}» выбрано для нескольких столбцов.`,
    })),
  ]

  if (mappingIssues.length > 0) {
    return {
      canImport: false,
      rows: [],
      issues: mappingIssues,
      ...coverage,
      stats: {
        totalRows: sourceRows.length,
        importedRows: 0,
        skippedRows: sourceRows.length,
        errorRows: sourceRows.length,
        duplicateRows: 0,
        missingAmountRows: 0,
        warningRows: 0,
      },
    }
  }

  const inverse = invertColumnMapping(mapping)
  const normalizedRows: NormalizedImportRow[] = []
  const issues: ImportIssue[] = []
  const seenDealIds = new Set<string>()
  let errorRows = 0
  let duplicateRows = 0
  let missingAmountRows = 0
  let warningRows = 0

  sourceRows.forEach((sourceRow, index) => {
    const rowNumber = index + 2
    const rowIssues: ImportIssue[] = []
    const issue = (
      field: ImportField,
      code: ImportIssue['code'],
      message: string,
      severity: ImportIssue['severity'] = 'error',
    ) => rowIssues.push({ row: rowNumber, field, code, message, severity })

    const dealIdValue = mappedValue(sourceRow, inverse, 'deal_id')
    const createdAtValue = mappedValue(sourceRow, inverse, 'created_at')
    const managerValue = mappedValue(sourceRow, inverse, 'manager')
    const clientValue = mappedValue(sourceRow, inverse, 'client')
    const stageValue = mappedValue(sourceRow, inverse, 'stage')
    const amountValue = mappedValue(sourceRow, inverse, 'amount')

    const dealId = toText(dealIdValue)
    const manager = toText(managerValue)
    const client = toText(clientValue)
    const stageText = toText(stageValue)
    const stage = normalizeStage(stageValue)

    if (!dealId) issue('deal_id', 'missing_value', 'Не указан ID сделки.')
    if (!manager) issue('manager', 'missing_value', 'Не указан менеджер.')
    if (!client) issue('client', 'missing_value', 'Не указан клиент.')
    if (!stageText) {
      issue('stage', 'missing_value', 'Не указан этап сделки.')
    } else if (!stage) {
      issue(
        'stage',
        'invalid_stage',
        `Неизвестный этап «${stageText}». Используйте: новый лид, квалификация, КП, счёт, оплата или проиграна.`,
      )
    }

    const createdAt = normalizeDate(createdAtValue)
    if (!createdAt) {
      issue(
        'created_at',
        isBlank(createdAtValue) ? 'missing_value' : 'invalid_date',
        isBlank(createdAtValue)
          ? 'Не указана дата создания.'
          : 'Не удалось распознать дату создания.',
      )
    }

    if (isBlank(amountValue)) missingAmountRows += 1
    const amount = normalizeAmount(amountValue)
    if (amount === null) {
      issue(
        'amount',
        isBlank(amountValue) ? 'missing_value' : 'invalid_amount',
        isBlank(amountValue)
          ? 'Не указана сумма сделки.'
          : 'Сумма должна быть неотрицательным числом.',
      )
    }

    const lastActivityValue = mappedValue(sourceRow, inverse, 'last_activity')
    const closedAtValue = mappedValue(sourceRow, inverse, 'closed_at')
    const probabilityValue = mappedValue(sourceRow, inverse, 'probability')
    const lastActivity = normalizeDate(lastActivityValue)
    const closedAt = normalizeDate(closedAtValue)
    const probability = normalizeProbability(probabilityValue)

    if (!isBlank(lastActivityValue) && !lastActivity) {
      issue('last_activity', 'invalid_date', 'Не удалось распознать дату последней активности.')
    }
    if (!isBlank(closedAtValue) && !closedAt) {
      issue('closed_at', 'invalid_date', 'Не удалось распознать дату закрытия.')
    }
    if (!isBlank(probabilityValue) && probability === null) {
      issue(
        'probability',
        'invalid_probability',
        'Вероятность должна быть в диапазоне от 0 до 100%.',
      )
    }

    const hasDataError = rowIssues.some((rowIssue) => rowIssue.severity === 'error')
    const normalizedDealId = dealId.toLocaleLowerCase('ru-RU')
    const duplicate = Boolean(dealId) && !hasDataError && seenDealIds.has(normalizedDealId)
    if (dealId && !hasDataError && !duplicate) seenDealIds.add(normalizedDealId)
    if (duplicate) {
      duplicateRows += 1
      issue(
        'deal_id',
        'duplicate_deal',
        `Повторный ID сделки «${dealId}» — строка пропущена.`,
        'warning',
      )
    }

    const hasError = rowIssues.some((rowIssue) => rowIssue.severity === 'error')
    const hasWarning = rowIssues.some((rowIssue) => rowIssue.severity === 'warning')
    if (hasError) errorRows += 1
    if (hasWarning) warningRows += 1
    issues.push(...rowIssues)

    if (!hasError && !duplicate && createdAt && amount !== null && stage) {
      normalizedRows.push({
        deal_id: dealId,
        created_at: createdAt,
        manager,
        client,
        stage,
        amount,
        last_activity: lastActivity,
        closed_at: closedAt,
        source: isBlank(mappedValue(sourceRow, inverse, 'source'))
          ? null
          : toText(mappedValue(sourceRow, inverse, 'source')),
        loss_reason: isBlank(mappedValue(sourceRow, inverse, 'loss_reason'))
          ? null
          : toText(mappedValue(sourceRow, inverse, 'loss_reason')),
        probability,
        product: isBlank(mappedValue(sourceRow, inverse, 'product'))
          ? null
          : toText(mappedValue(sourceRow, inverse, 'product')),
        region: isBlank(mappedValue(sourceRow, inverse, 'region'))
          ? null
          : toText(mappedValue(sourceRow, inverse, 'region')),
      })
    }
  })

  return {
    canImport: normalizedRows.length > 0,
    rows: normalizedRows,
    issues,
    ...coverage,
    stats: {
      totalRows: sourceRows.length,
      importedRows: normalizedRows.length,
      skippedRows: sourceRows.length - normalizedRows.length,
      errorRows,
      duplicateRows,
      missingAmountRows,
      warningRows,
    },
  }
}

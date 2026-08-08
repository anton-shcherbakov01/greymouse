import type { ParsedSalesFile, RawCell, RawDataRow } from './types'

const SUPPORTED_EXTENSIONS = ['csv', 'xlsx'] as const

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLocaleLowerCase('en-US') ?? ''
}

function cellIsBlank(value: RawCell): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

function makeUniqueHeaders(cells: readonly RawCell[]): string[] {
  const usedNames = new Set<string>()
  return cells.map((cell, index) => {
    const base =
      String(cell ?? '')
        .replace(/^\uFEFF/, '')
        .trim() || `Столбец ${index + 1}`
    let candidate = base
    let occurrence = 2
    while (usedNames.has(candidate.toLocaleLowerCase('ru-RU'))) {
      candidate = `${base} (${occurrence})`
      occurrence += 1
    }
    usedNames.add(candidate.toLocaleLowerCase('ru-RU'))
    return candidate
  })
}

async function decodeCsv(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(buffer)
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(buffer)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1251').decode(buffer)
  }
}

export function tabularRowsToRecords(rows: readonly RawCell[][]): {
  headers: string[]
  rows: RawDataRow[]
} {
  const firstNonEmptyRow = rows.findIndex((row) => row.some((cell) => !cellIsBlank(cell)))
  if (firstNonEmptyRow === -1) return { headers: [], rows: [] }

  const dataRows = rows.slice(firstNonEmptyRow + 1)
  const maxWidth = Math.max(rows[firstNonEmptyRow].length, ...dataRows.map((row) => row.length), 0)
  const headerCells = Array.from(
    { length: maxWidth },
    (_, index) => rows[firstNonEmptyRow][index] ?? '',
  )
  const headers = makeUniqueHeaders(headerCells)
  const records = dataRows
    .filter((row) => row.some((cell) => !cellIsBlank(cell)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))

  return { headers, rows: records }
}

async function parseCsv(file: File): Promise<ParsedSalesFile> {
  const { default: Papa } = await import('papaparse')
  const contents = await decodeCsv(file)
  const parsed = Papa.parse<string[]>(contents, {
    delimiter: '',
    skipEmptyLines: 'greedy',
  })
  const structuralErrors = parsed.errors.filter((error) => error.type === 'Quotes')
  if (structuralErrors.length > 0) {
    throw new Error(`CSV повреждён: ${structuralErrors[0].message}`)
  }
  const converted = tabularRowsToRecords(parsed.data)
  return {
    fileName: file.name,
    fileType: 'csv',
    sheetName: null,
    ...converted,
    warnings: parsed.errors.map((error) =>
      typeof error.row === 'number' ? `Строка ${error.row + 1}: ${error.message}` : error.message,
    ),
  }
}

async function parseXlsx(file: File): Promise<ParsedSalesFile> {
  const { default: readExcelFile } = await import('read-excel-file/universal')
  const contents = await file.arrayBuffer()
  const workbook = await readExcelFile(contents)
  const firstSheet = workbook[0]
  if (!firstSheet) throw new Error('В книге нет листов с данными.')

  const grid: RawCell[][] = firstSheet.data.map((row) =>
    row.map((cell) => {
      if (
        cell === null ||
        typeof cell === 'string' ||
        typeof cell === 'number' ||
        typeof cell === 'boolean' ||
        cell instanceof Date
      ) {
        return cell
      }
      return String(cell)
    }),
  )
  const converted = tabularRowsToRecords(grid)
  return {
    fileName: file.name,
    fileType: 'xlsx',
    sheetName: firstSheet.sheet,
    ...converted,
    warnings:
      workbook.length > 1
        ? [`Импортирован первый лист «${firstSheet.sheet}». Остальные листы не изменены.`]
        : [],
  }
}

export async function parseSalesFile(file: File): Promise<ParsedSalesFile> {
  const extension = extensionOf(file.name)
  if (!SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
    throw new Error('Поддерживаются только файлы CSV и XLSX.')
  }
  if (file.size === 0) throw new Error('Файл пуст.')

  const result = extension === 'csv' ? await parseCsv(file) : await parseXlsx(file)
  if (result.headers.length === 0) throw new Error('Не удалось найти строку с заголовками.')
  if (result.rows.length === 0) throw new Error('В файле нет строк данных.')
  return result
}

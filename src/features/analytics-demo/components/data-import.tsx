'use client'

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  AlertCircle,
  Check,
  ChevronRight,
  FileSpreadsheet,
  LoaderCircle,
  RotateCcw,
  Upload,
} from 'lucide-react'
import { formatNumberRu } from '@/features/analytics-demo/lib/dashboard/format'
import {
  IMPORT_FIELD_BY_KEY,
  IMPORT_FIELD_DEFINITIONS,
  OPTIONAL_IMPORT_FIELDS,
  autoMapColumns,
  createDemoImportFile,
  parseSalesFile,
  saveImportedRows,
  validateAndNormalizeRows,
  type ColumnMapping,
  type ImportField,
  type ParsedSalesFile,
  type StoredImportSnapshot,
} from '@/features/analytics-demo/lib/import'
import './data-import.css'

const MAX_FILE_SIZE = 4 * 1024 * 1024

function formatInteger(value: number): string {
  return formatNumberRu(value)
}

function formatFileSize(value: number): string {
  if (value < 1024) return `${value} Б`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} КБ`
  return `${(value / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`
}

function formatCell(value: unknown): string {
  if (value instanceof Date) return value.toLocaleDateString('ru-RU')
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function DataImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)
  const [parsedFile, setParsedFile] = useState<ParsedSalesFile | null>(null)
  const [sourceSize, setSourceSize] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedImport, setSavedImport] = useState<StoredImportSnapshot | null>(null)

  const validation = useMemo(
    () => (parsedFile ? validateAndNormalizeRows(parsedFile.rows, mapping) : null),
    [mapping, parsedFile],
  )

  const selectedFields = useMemo(
    () => new Set(Object.values(mapping).filter((field): field is ImportField => Boolean(field))),
    [mapping],
  )

  const missingOptional = OPTIONAL_IMPORT_FIELDS.filter((field) => !selectedFields.has(field))

  async function readFile(file: File) {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setError(null)
    setSavedImport(null)
    if (file.size > MAX_FILE_SIZE) {
      setError('Файл больше 4 МБ. Разделите выгрузку на несколько частей.')
      setBusy(false)
      return
    }
    setBusy(true)
    try {
      const parsed = await parseSalesFile(file)
      if (requestId !== requestIdRef.current) return
      setParsedFile(parsed)
      setSourceSize(file.size)
      setMapping(autoMapColumns(parsed.headers))
    } catch (cause) {
      if (requestId !== requestIdRef.current) return
      setParsedFile(null)
      setMapping({})
      setError(cause instanceof Error ? cause.message : 'Не удалось прочитать файл.')
    } finally {
      if (requestId === requestIdRef.current) setBusy(false)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void readFile(file)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (busy) return
    const file = event.dataTransfer.files?.[0]
    if (file) void readFile(file)
  }

  function updateMapping(header: string, field: string) {
    setSavedImport(null)
    setMapping((current) => ({ ...current, [header]: field as ImportField | '' }))
  }

  function resetImport() {
    requestIdRef.current += 1
    setParsedFile(null)
    setMapping({})
    setSavedImport(null)
    setError(null)
    setSourceSize(0)
  }

  function commitImport() {
    if (!parsedFile || !validation?.canImport) return
    setError(null)
    try {
      const snapshot = saveImportedRows({
        sourceName: parsedFile.fileName,
        rows: validation.rows,
        stats: validation.stats,
      })
      setSavedImport(snapshot)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Браузер не смог сохранить данные. Проверьте доступное место и настройки приватности.',
      )
    }
  }

  return (
    <section className="data-import" aria-labelledby="data-import-title">
      <header className="data-import__header">
        <div>
          <p className="data-import__eyebrow">Источник данных</p>
          <h2 id="data-import-title">Загрузить данные</h2>
          <p className="data-import__lead">
            Импортируйте сделки из CRM-выгрузки. Данные проверяются локально и не покидают браузер.
          </p>
        </div>
        {parsedFile ? (
          <button className="data-import__quiet-button" type="button" onClick={resetImport}>
            <RotateCcw size={15} aria-hidden="true" />
            Другой файл
          </button>
        ) : null}
      </header>

      <input
        ref={inputRef}
        className="data-import__file-input"
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleInputChange}
        aria-label="Выбрать CSV или XLSX файл"
      />

      {!parsedFile ? (
        <div
          className={`data-import__dropzone${dragging ? ' data-import__dropzone--active' : ''}`}
          aria-busy={busy}
          aria-disabled={busy}
          onDragEnter={(event) => {
            event.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className="data-import__drop-icon" aria-hidden="true">
            {busy ? (
              <LoaderCircle className="data-import__spinner" size={25} />
            ) : (
              <Upload size={25} />
            )}
          </span>
          <h3 role="status" aria-live="polite">
            {busy ? 'Читаем файл…' : 'Перетащите выгрузку сюда'}
          </h3>
          <p>CSV или XLSX · до 4 МБ · итоговый объём ограничен хранилищем браузера</p>
          <div className="data-import__drop-actions">
            <button
              className="data-import__primary-button"
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Выбрать файл
            </button>
            <button
              className="data-import__secondary-button"
              type="button"
              disabled={busy}
              onClick={() => void readFile(createDemoImportFile())}
            >
              Загрузить пример
            </button>
          </div>
        </div>
      ) : (
        <div className="data-import__workflow">
          <div className="data-import__file-summary">
            <span className="data-import__file-icon" aria-hidden="true">
              <FileSpreadsheet size={19} />
            </span>
            <div>
              <strong>{parsedFile.fileName}</strong>
              <span>
                {parsedFile.fileType.toUpperCase()} · {formatFileSize(sourceSize)} ·{' '}
                {formatInteger(parsedFile.rows.length)} строк
                {parsedFile.sheetName ? ` · лист «${parsedFile.sheetName}»` : ''}
              </span>
            </div>
            <span className="data-import__file-ready">
              <Check size={13} aria-hidden="true" /> Файл прочитан
            </span>
          </div>

          {parsedFile.warnings.length > 0 ? (
            <div className="data-import__notice data-import__notice--warning" role="status">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{parsedFile.warnings.slice(0, 2).join(' ')}</span>
            </div>
          ) : null}

          <section className="data-import__step" aria-labelledby="preview-title">
            <div className="data-import__step-heading">
              <span className="data-import__step-number">1</span>
              <div>
                <h3 id="preview-title">Проверьте структуру</h3>
                <p>Первые пять строк из файла — исходные значения ещё не изменены.</p>
              </div>
            </div>
            <div className="data-import__table-shell">
              <table className="data-import__preview-table">
                <thead>
                  <tr>
                    <th aria-label="Номер строки">#</th>
                    {parsedFile.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedFile.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>{rowIndex + 2}</td>
                      {parsedFile.headers.map((header) => (
                        <td key={header} title={formatCell(row[header])}>
                          {formatCell(row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="data-import__step" aria-labelledby="mapping-title">
            <div className="data-import__step-heading">
              <span className="data-import__step-number">2</span>
              <div>
                <h3 id="mapping-title">Сопоставьте столбцы</h3>
                <p>Мы предложили соответствия автоматически. Обязательные поля отмечены точкой.</p>
              </div>
            </div>

            <div className="data-import__mapping-head" aria-hidden="true">
              <span>Столбец в файле</span>
              <span>Поле Grey Mouse</span>
            </div>
            <div className="data-import__mapping-list">
              {parsedFile.headers.map((header) => {
                const currentField = mapping[header] ?? ''
                return (
                  <label className="data-import__mapping-row" key={header}>
                    <span className="data-import__source-column" title={header}>
                      {header}
                    </span>
                    <ChevronRight size={15} aria-hidden="true" />
                    <span className="data-import__select-shell">
                      {currentField && IMPORT_FIELD_BY_KEY[currentField].required ? (
                        <span
                          className="data-import__required-dot"
                          aria-label="Обязательное поле"
                        />
                      ) : null}
                      <select
                        value={currentField}
                        onChange={(event) => updateMapping(header, event.target.value)}
                        aria-label={`Поле системы для столбца ${header}`}
                      >
                        <option value="">Не импортировать</option>
                        {IMPORT_FIELD_DEFINITIONS.map((definition) => (
                          <option
                            key={definition.key}
                            value={definition.key}
                            disabled={
                              selectedFields.has(definition.key) && currentField !== definition.key
                            }
                          >
                            {definition.label}
                            {definition.required ? ' · обязательно' : ''}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="data-import__coverage" aria-live="polite">
              {validation && validation.missingRequiredFields.length === 0 ? (
                <span className="data-import__coverage-ok">
                  <Check size={14} aria-hidden="true" /> Все обязательные поля сопоставлены
                </span>
              ) : (
                <span className="data-import__coverage-error">
                  <AlertCircle size={14} aria-hidden="true" />
                  Не хватает:{' '}
                  {validation?.missingRequiredFields
                    .map((field) => IMPORT_FIELD_BY_KEY[field].label)
                    .join(', ')}
                </span>
              )}
              {missingOptional.length > 0 ? (
                <span>
                  Необязательные не найдены:{' '}
                  {missingOptional.map((field) => IMPORT_FIELD_BY_KEY[field].label).join(', ')}
                </span>
              ) : null}
            </div>
          </section>

          {validation ? (
            <section className="data-import__step" aria-labelledby="validation-title">
              <div className="data-import__step-heading">
                <span className="data-import__step-number">3</span>
                <div>
                  <h3 id="validation-title">Результат проверки</h3>
                  <p>Ошибочные строки и повторные ID не попадут в импорт.</p>
                </div>
              </div>

              <div className="data-import__stats">
                <div>
                  <span>Готово к загрузке</span>
                  <strong>{formatInteger(validation.stats.importedRows)}</strong>
                </div>
                <div>
                  <span>Строки с ошибками</span>
                  <strong>{formatInteger(validation.stats.errorRows)}</strong>
                </div>
                <div>
                  <span>Дубликаты</span>
                  <strong>{formatInteger(validation.stats.duplicateRows)}</strong>
                </div>
                <div>
                  <span>Пропущенные суммы</span>
                  <strong>{formatInteger(validation.stats.missingAmountRows)}</strong>
                </div>
              </div>

              {validation.issues.length > 0 ? (
                <details className="data-import__issues">
                  <summary>Показать замечания ({formatInteger(validation.issues.length)})</summary>
                  <ul>
                    {validation.issues.slice(0, 12).map((issue, index) => (
                      <li key={`${issue.row}-${issue.code}-${index}`}>
                        <span
                          className={`data-import__issue-mark data-import__issue-mark--${issue.severity}`}
                          aria-hidden="true"
                        />
                        <span>
                          {issue.row ? `Строка ${issue.row}: ` : ''}
                          {issue.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {validation.issues.length > 12 ? (
                    <p>И ещё {formatInteger(validation.issues.length - 12)} замечаний.</p>
                  ) : null}
                </details>
              ) : (
                <div className="data-import__notice data-import__notice--success">
                  <Check size={16} aria-hidden="true" /> Все строки прошли проверку.
                </div>
              )}

              {savedImport ? (
                <div className="data-import__success" role="status">
                  <span className="data-import__success-icon" aria-hidden="true">
                    <Check size={20} />
                  </span>
                  <div>
                    <strong>Данные загружены</strong>
                    <p>
                      Сохранено {formatInteger(savedImport.stats.importedRows)} сделок. Ошибки:{' '}
                      {formatInteger(savedImport.stats.errorRows)} · дубликаты:{' '}
                      {formatInteger(savedImport.stats.duplicateRows)}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="data-import__commit-row">
                  <p>После загрузки новый набор заменит предыдущий локальный импорт.</p>
                  <button
                    className="data-import__primary-button"
                    type="button"
                    disabled={!validation.canImport}
                    onClick={commitImport}
                  >
                    Импортировать {formatInteger(validation.stats.importedRows)} сделок
                  </button>
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="data-import__notice data-import__notice--error" role="alert">
          <AlertCircle size={16} aria-hidden="true" /> {error}
        </div>
      ) : null}
    </section>
  )
}

export default DataImport

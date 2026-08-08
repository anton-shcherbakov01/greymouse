import type { DatePeriod } from './types'

const DAY_MS = 86_400_000

export function toDate(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date: ${String(value)}`)
  }
  return date
}

export function startOfUtcDay(value: string | Date): Date {
  const date = toDate(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function startOfUtcMonth(value: string | Date): Date {
  const date = toDate(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function addUtcMonths(value: string | Date, months: number): Date {
  const date = startOfUtcMonth(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

export function addUtcDays(value: string | Date, days: number): Date {
  const date = toDate(value)
  return new Date(date.getTime() + days * DAY_MS)
}

export function differenceInCalendarDays(later: string | Date, earlier: string | Date): number {
  return Math.floor((startOfUtcDay(later).getTime() - startOfUtcDay(earlier).getTime()) / DAY_MS)
}

export function daysInUtcMonth(value: string | Date): number {
  const date = toDate(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
}

export function monthKey(value: string | Date): string {
  const date = toDate(value)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function monthPeriod(value: string | Date): DatePeriod {
  const start = startOfUtcMonth(value)
  const end = addUtcMonths(start, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Period boundaries are start-inclusive and end-exclusive. */
export function isInPeriod(value: string | Date, period: DatePeriod): boolean {
  const time = toDate(value).getTime()
  return time >= toDate(period.start).getTime() && time < toDate(period.end).getTime()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function round(value: number, digits = 2): number {
  const power = 10 ** digits
  return Math.round((value + Number.EPSILON) * power) / power
}

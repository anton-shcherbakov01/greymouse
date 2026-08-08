const groupThousands = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')

export const formatNumberRu = (value: number, digits = 0) => {
  const rounded = value.toFixed(digits)
  const [integer, decimal] = rounded.split('.')
  const sign = integer.startsWith('-') ? '-' : ''
  const grouped = groupThousands(integer.replace('-', ''))
  return decimal ? `${sign}${grouped},${decimal}` : `${sign}${grouped}`
}

export const formatRub = (value: number, compact = false) => {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      const scaled = value / 1_000_000
      return `${formatNumberRu(scaled, Number.isInteger(scaled) ? 0 : 1)} млн ₽`
    }
    if (Math.abs(value) >= 1_000) {
      return `${formatNumberRu(Math.round(value / 1_000))} тыс. ₽`
    }
  }

  return `${formatNumberRu(Math.round(value))} ₽`
}

export const formatPercent = (value: number, digits = 1) => `${formatNumberRu(value, digits)}%`

export const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

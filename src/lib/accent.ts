/**
 * Акцентный цвет сайта задаётся в админке одним значением, а в дизайн-системе
 * их три: сам цвет, приглушённый вариант для светлых секций и цвет текста
 * поверх акцента.
 *
 * Выводить их автоматически, а не просить редактора подобрать вручную, —
 * единственный способ не получить нечитаемую кнопку: контраст текста на
 * заливке никто в админке не проверит.
 */

export const DEFAULT_ACCENT = '#c9f24a'

export type AccentPalette = {
  /** Акцент на тёмных секциях. */
  signal: string
  /** Приглушённый вариант: на светлом фоне яркий акцент даёт мало контраста. */
  signalDim: string
  /** Цвет текста и иконок поверх заливки акцентом. */
  accentFg: string
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Приводит `c9f24a`, `#C9F24A` и `#cf4` к виду `#c9f24a`. Иначе `null`. */
export const normaliseHex = (value: string | null | undefined): string | null => {
  if (!value) return null
  const match = HEX.exec(value.trim())
  if (!match) return null

  const digits = match[1]!.toLowerCase()
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((char) => char + char)
          .join('')
      : digits
  return `#${full}`
}

const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

const toHex = (rgb: [number, number, number]): string =>
  `#${rgb
    .map((value) =>
      Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

/** Относительная яркость по WCAG — по ней выбирается цвет текста на заливке. */
export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrastRatio = (a: string, b: string): number => {
  const light = Math.max(relativeLuminance(a), relativeLuminance(b))
  const dark = Math.min(relativeLuminance(a), relativeLuminance(b))
  return (light + 0.05) / (dark + 0.05)
}

const INK = '#0b0c0e'
const WHITE = '#f7f8fa'

export const deriveAccentPalette = (raw: string | null | undefined): AccentPalette => {
  const signal = normaliseHex(raw) ?? DEFAULT_ACCENT

  // Приглушённый вариант: тот же тон на 18 % темнее.
  const signalDim = toHex(
    toRgb(signal).map((channel) => channel * 0.82) as [number, number, number],
  )

  // Текст поверх заливки — то из двух, что даёт больший контраст.
  const accentFg = contrastRatio(signal, INK) >= contrastRatio(signal, WHITE) ? INK : WHITE

  return { signal, signalDim, accentFg }
}

/**
 * CSS для подстановки в документ. Переопределяются именно базовые токены,
 * а не семантические роли: `.gm-light` и `.gm-dark` ссылаются на них через
 * `var()` и подхватят новое значение сами.
 *
 * Селекторы намеренно продублированы (`:root:root`). Порядок подключения
 * стилей не гарантирован: при равной специфичности файл токенов оказывался
 * ниже этого блока и выигрывал — кнопки оставались прежнего цвета, хотя
 * переменная в документе была новой. Удвоенный селектор снимает зависимость
 * от порядка, не прибегая к `!important`.
 */
export const accentStyleSheet = (palette: AccentPalette): string =>
  `:root:root{--gm-signal:${palette.signal};--gm-signal-dim:${palette.signalDim};` +
  `--accent-fg:${palette.accentFg};}` +
  `.gm-light.gm-light{--accent-fg:${palette.accentFg};}` +
  `.gm-dark.gm-dark{--accent-fg:${palette.accentFg};}`

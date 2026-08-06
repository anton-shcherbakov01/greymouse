/**
 * Обратный перевод punycode → unicode (RFC 3492).
 *
 * Нужен ровно для одного: показать посетителю `сераямышь.рф`, а не
 * `xn--80ajwod0cujx.xn--p1ai`. В обратную сторону переводит сам `URL`
 * (`new URL('https://сераямышь.рф').host` уже даёт punycode), а вот
 * встроенного toUnicode в стандартной библиотеке нет: модуль `punycode`
 * в Node объявлен устаревшим, в браузере его нет вовсе.
 *
 * Реализация — прямая транскрипция алгоритма из RFC 3492, раздел 6.2.
 */

const BASE = 36
const T_MIN = 1
const T_MAX = 26
const SKEW = 38
const DAMP = 700
const INITIAL_BIAS = 72
const INITIAL_N = 128
const DELIMITER = '-'
const PREFIX = 'xn--'

/**
 * Символ кода → его цифровое значение в системе счисления с основанием 36.
 *
 * Границы проверяются с двух сторон: в эталонной реализации из RFC вычитание
 * идёт в беззнаковой арифметике и отрицательный результат сам выпадает из
 * диапазона, а в JS `0x21 - 0x30 < 0x0a` истинно — и метка вроде `xn--!!!`
 * разобралась бы как валидная.
 */
const basicToDigit = (code: number): number => {
  if (code >= 0x30 && code <= 0x39) return code - 0x16 // 0–9  → 26–35
  if (code >= 0x41 && code <= 0x5a) return code - 0x41 // A–Z  → 0–25
  if (code >= 0x61 && code <= 0x7a) return code - 0x61 // a–z  → 0–25
  return BASE // недопустимый символ
}

const adapt = (delta: number, numPoints: number, firstTime: boolean): number => {
  let value = firstTime ? Math.floor(delta / DAMP) : delta >> 1
  value += Math.floor(value / numPoints)

  let k = 0
  while (value > ((BASE - T_MIN) * T_MAX) >> 1) {
    value = Math.floor(value / (BASE - T_MIN))
    k += BASE
  }

  return k + Math.floor(((BASE - T_MIN + 1) * value) / (value + SKEW))
}

/** Декодирует одну метку без префикса `xn--`. Бросает исключение на мусоре. */
const decodeLabel = (input: string): string => {
  const output: number[] = []

  // Базовые (ASCII) символы идут до последнего дефиса, если он есть.
  const delimiter = input.lastIndexOf(DELIMITER)
  for (let index = 0; index < delimiter; index += 1) {
    const code = input.charCodeAt(index)
    if (code >= 0x80) throw new Error('в punycode-метке недопустимый символ')
    output.push(code)
  }

  let n = INITIAL_N
  let bias = INITIAL_BIAS
  let i = 0

  for (let index = delimiter > -1 ? delimiter + 1 : 0; index < input.length; ) {
    const previousI = i

    for (let weight = 1, k = BASE; ; k += BASE) {
      if (index >= input.length) throw new Error('punycode-метка оборвана')

      const digit = basicToDigit(input.charCodeAt(index))
      index += 1
      if (digit >= BASE) throw new Error('в punycode-метке недопустимая цифра')

      i += digit * weight

      const threshold = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias
      if (digit < threshold) break

      weight *= BASE - threshold
    }

    const length = output.length + 1
    bias = adapt(i - previousI, length, previousI === 0)
    n += Math.floor(i / length)
    i %= length

    if (n > 0x10ffff) throw new Error('punycode-метка даёт недопустимый символ')

    output.splice(i, 0, n)
    i += 1
  }

  // Пустой результат даёт `xn--` без содержимого: ошибок при разборе нет,
  // но и меткой это не является.
  if (output.length === 0) throw new Error('пустая punycode-метка')

  return String.fromCodePoint(...output)
}

/**
 * Переводит хост в unicode-форму. Метки без префикса `xn--` остаются как есть,
 * неразбираемые — тоже: показать punycode некрасиво, но безопаснее, чем упасть
 * при отрисовке страницы.
 */
export const punycodeToUnicode = (host: string): string =>
  host
    .split('.')
    .map((label) => {
      if (!label.toLowerCase().startsWith(PREFIX)) return label
      try {
        return decodeLabel(label.slice(PREFIX.length))
      } catch {
        return label
      }
    })
    .join('.')

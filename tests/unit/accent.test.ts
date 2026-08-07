import { describe, expect, it } from 'vitest'

import {
  accentStyleSheet,
  DEFAULT_ACCENT,
  deriveAccentPalette,
  normaliseHex,
  relativeLuminance,
} from '@/lib/accent'

describe('normaliseHex', () => {
  it.each([
    ['#c9f24a', '#c9f24a'],
    ['c9f24a', '#c9f24a'],
    ['#C9F24A', '#c9f24a'],
    ['  #cf4  ', '#ccff44'],
  ])('приводит %s к %s', (input, expected) => {
    expect(normaliseHex(input)).toBe(expected)
  })

  it.each(['', '   ', 'зелёный', '#12345', 'rgb(1,2,3)', null, undefined])(
    'отвергает %s',
    (input) => {
      expect(normaliseHex(input)).toBeNull()
    },
  )
})

describe('deriveAccentPalette', () => {
  it('возвращает цвет по умолчанию, когда значение не задано или испорчено', () => {
    expect(deriveAccentPalette(null).signal).toBe(DEFAULT_ACCENT)
    expect(deriveAccentPalette('не цвет').signal).toBe(DEFAULT_ACCENT)
  })

  it('приглушённый оттенок темнее основного', () => {
    const { signal, signalDim } = deriveAccentPalette('#c9f24a')
    expect(relativeLuminance(signalDim)).toBeLessThan(relativeLuminance(signal))
  })

  it('на светлом акценте текст кнопки чернильный', () => {
    expect(deriveAccentPalette('#c9f24a').accentFg).toBe('#0b0c0e')
    expect(deriveAccentPalette('#ffffff').accentFg).toBe('#0b0c0e')
  })

  it('на тёмном акценте текст кнопки светлый', () => {
    // Ради этого случая цвет текста и считается автоматически: редактор,
    // выбрав тёмно-синий, получил бы нечитаемую кнопку.
    expect(deriveAccentPalette('#1a2b6d').accentFg).toBe('#f7f8fa')
    expect(deriveAccentPalette('#000000').accentFg).toBe('#f7f8fa')
  })

  it('нормализует короткую запись', () => {
    expect(deriveAccentPalette('cf4').signal).toBe('#ccff44')
  })
})

describe('accentStyleSheet', () => {
  it('переопределяет базовые токены, а не семантические роли', () => {
    const css = accentStyleSheet(deriveAccentPalette('#ff8800'))
    expect(css).toContain('--gm-signal:#ff8800')
    // Удвоенный селектор: иначе файл токенов выигрывает по порядку подключения.
    expect(css).toContain(':root:root')
    expect(css).toContain('--gm-signal-dim:')
    expect(css).toContain('--accent-fg:')
    // `--accent` вычисляется из `--gm-signal` в токенах — переопределять его
    // здесь нельзя, иначе светлая и тёмная схемы получат один и тот же оттенок.
    expect(css).not.toContain('--accent:')
  })
})

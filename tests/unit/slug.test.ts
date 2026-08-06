import { describe, expect, it } from 'vitest'

import { slugify } from '@/fields/slug'

describe('slugify', () => {
  it('транслитерирует кириллицу в латиницу', () => {
    expect(slugify('Серая Мышь')).toBe('seraya-mysh')
    expect(slugify('Платформа для логистики')).toBe('platforma-dlya-logistiki')
  })

  it('обрабатывает ё, ъ и ь', () => {
    expect(slugify('Ёжик')).toBe('ezhik')
    expect(slugify('Подъезд')).toBe('podezd')
    expect(slugify('День')).toBe('den')
  })

  it('схлопывает разделители и обрезает края', () => {
    expect(slugify('  Кейс —— 2025!  ')).toBe('keys-2025')
    expect(slugify('a///b')).toBe('a-b')
  })

  it('сохраняет уже латинские slug без изменений', () => {
    expect(slugify('demo-logistics-platform')).toBe('demo-logistics-platform')
  })

  it('ограничивает длину', () => {
    expect(slugify('а'.repeat(200)).length).toBeLessThanOrEqual(96)
  })

  it('возвращает пустую строку для текста без букв и цифр', () => {
    expect(slugify('—— !!! ——')).toBe('')
  })
})

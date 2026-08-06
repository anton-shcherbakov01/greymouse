import { describe, expect, it } from 'vitest'

import { punycodeToUnicode } from '@/lib/idn'

/**
 * Проверка `сераямышь.рф` здесь не для красоты: punycode этого домена один раз
 * уже был выписан вручную и оказался неверным — сертификат запрашивался для
 * несуществующего имени. Тест сверяет обе стороны перевода с тем, что даёт
 * встроенный `URL`, поэтому опечатка в константе больше не пройдёт незаметно.
 */

const STUDIO_UNICODE = 'сераямышь.рф'
const STUDIO_PUNYCODE = 'xn--80ajwod0cujx.xn--p1ai'

describe('punycodeToUnicode', () => {
  it('переводит домен студии обратно в юникод', () => {
    expect(punycodeToUnicode(STUDIO_PUNYCODE)).toBe(STUDIO_UNICODE)
  })

  it('согласован с punycode, который строит сам URL', () => {
    expect(new URL(`https://${STUDIO_UNICODE}`).hostname).toBe(STUDIO_PUNYCODE)
    expect(punycodeToUnicode(new URL(`https://${STUDIO_UNICODE}`).hostname)).toBe(STUDIO_UNICODE)
  })

  it('переводит поддомены, не трогая ASCII-метки', () => {
    expect(punycodeToUnicode(`www.${STUDIO_PUNYCODE}`)).toBe(`www.${STUDIO_UNICODE}`)
  })

  it.each([
    ['xn--d1acufc.xn--p1ai', 'домен.рф'],
    ['xn--80aswg.xn--p1ai', 'сайт.рф'],
    ['xn--mgbh0fb.xn--kgbechtv', 'مثال.إختبار'],
    ['xn--fsqu00a.xn--0zwm56d', '例子.测试'],
  ])('декодирует %s', (punycode, unicode) => {
    expect(punycodeToUnicode(punycode)).toBe(unicode)
    // Сверяем с независимой реализацией — той, что внутри URL.
    expect(new URL(`https://${unicode}`).hostname).toBe(punycode)
  })

  it('оставляет как есть домены без punycode', () => {
    expect(punycodeToUnicode('example.com')).toBe('example.com')
    expect(punycodeToUnicode('localhost')).toBe('localhost')
  })

  it('не падает на неразбираемой метке, а возвращает её без изменений', () => {
    expect(punycodeToUnicode('xn--!!!.рф')).toBe('xn--!!!.рф')
    expect(punycodeToUnicode('xn--.com')).toBe('xn--.com')
  })
})

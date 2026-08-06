import { describe, expect, it } from 'vitest'

import { contactSchema } from '@/lib/contact-schema'

const valid = {
  name: 'Анна',
  contact: 'anna@example.com',
  company: '',
  budget: '',
  message: 'Нужен новый сайт для сервиса записи. Расскажите, как вы работаете и сколько это стоит.',
  consent: true,
  website: '',
  renderedAt: Date.now(),
}

describe('contactSchema', () => {
  it('принимает корректную заявку', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('принимает ник в Telegram вместо email', () => {
    expect(contactSchema.safeParse({ ...valid, contact: '@studio_mouse' }).success).toBe(true)
  })

  it('отклоняет некорректный контакт', () => {
    const result = contactSchema.safeParse({ ...valid, contact: 'нет' })
    expect(result.success).toBe(false)
  })

  it('требует содержательное сообщение', () => {
    const result = contactSchema.safeParse({ ...valid, message: 'привет' })
    expect(result.success).toBe(false)
  })

  it('требует согласия на обработку данных', () => {
    expect(contactSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
  })

  it('отклоняет заполненную ловушку для ботов', () => {
    expect(contactSchema.safeParse({ ...valid, website: 'http://spam.example' }).success).toBe(false)
  })

  it('обрезает пробелы вокруг значений', () => {
    const result = contactSchema.safeParse({ ...valid, name: '  Анна  ' })
    expect(result.success && result.data.name).toBe('Анна')
  })
})

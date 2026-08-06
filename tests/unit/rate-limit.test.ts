import { afterEach, describe, expect, it } from 'vitest'

import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

afterEach(() => resetRateLimit())

describe('checkRateLimit', () => {
  it('пропускает запросы в пределах лимита', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit('ip-1', { limit: 5 }).allowed).toBe(true)
    }
  })

  it('блокирует запрос сверх лимита и сообщает время ожидания', () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit('ip-2', { limit: 3 })
    const result = checkRateLimit('ip-2', { limit: 3 })
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('считает лимиты по каждому ключу отдельно', () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit('ip-3', { limit: 3 })
    expect(checkRateLimit('ip-4', { limit: 3 }).allowed).toBe(true)
  })

  it('сбрасывает счётчик после окончания окна', async () => {
    checkRateLimit('ip-5', { limit: 1, windowMs: 20 })
    expect(checkRateLimit('ip-5', { limit: 1, windowMs: 20 }).allowed).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 40))
    expect(checkRateLimit('ip-5', { limit: 1, windowMs: 20 }).allowed).toBe(true)
  })
})

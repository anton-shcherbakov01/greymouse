import { describe, expect, it } from 'vitest'

import { toImageSrc } from '@/lib/media-url'

describe('toImageSrc', () => {
  it('оставляет относительные пути как есть', () => {
    expect(toImageSrc('/api/media/file/cover.webp')).toBe('/api/media/file/cover.webp')
  })

  it('срезает собственный origin, чтобы оптимизатор не ходил в себя по сети', () => {
    expect(toImageSrc('http://localhost:3000/api/media/file/cover.webp')).toBe(
      '/api/media/file/cover.webp',
    )
    expect(toImageSrc('http://127.0.0.1:3000/api/media/file/cover.webp')).toBe(
      '/api/media/file/cover.webp',
    )
  })

  it('сохраняет query-параметры', () => {
    expect(toImageSrc('http://localhost:3000/api/media/file/cover.webp?v=2')).toBe(
      '/api/media/file/cover.webp?v=2',
    )
  })

  it('не трогает адреса внешнего хранилища', () => {
    const remote = 'https://cdn.example.com/media/cover.webp'
    expect(toImageSrc(remote)).toBe(remote)
  })

  it('возвращает исходную строку при некорректном URL', () => {
    expect(toImageSrc('http://[::bad')).toBe('http://[::bad')
  })
})

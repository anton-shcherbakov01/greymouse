import NextImage from 'next/image'

import { toImageSrc } from '@/lib/media-url'
import type { Media } from '@/payload-types'

type MediaLike = number | Media | null | undefined

export const resolveMedia = (value: MediaLike): Media | null =>
  value && typeof value === 'object' ? value : null

type MediaImageProps = {
  media: MediaLike
  /** Обязателен: значение уходит в атрибут sizes и определяет выбор ресайза. */
  sizes: string
  className?: string
  priority?: boolean
  /** Соотношение сторон контейнера. Фиксируется, чтобы исключить layout shift. */
  aspect?: string
  fit?: 'cover' | 'contain'
  /** Перебивает alt из CMS — например, для портретов команды. */
  altOverride?: string
}

/**
 * Единая точка вывода изображений из CMS.
 * Всегда задаёт размеры и aspect-ratio, поэтому CLS равен нулю.
 */
export const MediaImage = ({
  media,
  sizes,
  className,
  priority = false,
  aspect = '4 / 3',
  fit = 'cover',
  altOverride,
}: MediaImageProps) => {
  const resolved = resolveMedia(media)

  if (!resolved?.url) {
    return (
      <div
        className={['bg-[var(--bg-raised)]', className].filter(Boolean).join(' ')}
        style={{ aspectRatio: aspect }}
        aria-hidden="true"
      />
    )
  }

  const alt = altOverride ?? (resolved.decorative ? '' : (resolved.alt ?? ''))

  return (
    <div
      className={['relative overflow-hidden bg-[var(--bg-raised)]', className].filter(Boolean).join(' ')}
      style={{ aspectRatio: aspect }}
    >
      <NextImage
        src={toImageSrc(resolved.url)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={fit === 'cover' ? 'object-cover' : 'object-contain'}
        style={
          resolved.focalX != null && resolved.focalY != null
            ? { objectPosition: `${resolved.focalX}% ${resolved.focalY}%` }
            : undefined
        }
      />
    </div>
  )
}

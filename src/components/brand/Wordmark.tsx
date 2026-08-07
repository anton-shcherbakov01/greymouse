import Image from 'next/image'

import { toImageSrc } from '@/lib/media-url'
import type { Media } from '@/payload-types'

import bundledOnDark from '../../../public/brand/logo.png'
import bundledOnLight from '../../../public/brand/logo-light.png'

type WordmarkProps = {
  className?: string
  size?: 'default' | 'presentation'
  /**
   * Поверхность, на которой стоит логотип. Надпись в фирменном начертании
   * белая, поэтому на светлой секции нужен вариант с чернильной надписью.
   * Шапка и подвал тёмные — отсюда значение по умолчанию.
   */
  tone?: 'on-dark' | 'on-light'
  /** Логотип из настроек сайта. Пусто — используется файл из репозитория. */
  logo?: Media | number | null
  /** Только знак, без надписи — для компактных мест. */
  markOnly?: boolean
}

/**
 * Логотип студии. Растровый файл, а не SVG: исходник пришёл изображением,
 * с мягкими тенями и градиентом — векторизация исказила бы знак.
 *
 * Размеры встроенного файла известны из импорта, поэтому место под логотип
 * резервируется до загрузки и вёрстка не прыгает. Для логотипа из CMS размеры
 * приходят вместе с документом — Payload сохраняет их при загрузке.
 */
export const Wordmark = ({
  className,
  size = 'default',
  tone = 'on-dark',
  logo,
  markOnly = false,
}: WordmarkProps) => {
  const height = markOnly ? 'max-h-7' : size === 'presentation' ? 'max-h-16 md:max-h-20' : 'max-h-9'
  const responsiveSizes = size === 'presentation' ? '(max-width: 768px) 280px, 420px' : '220px'
  const alt = 'Серая Мышь — digital-студия'

  const uploaded = typeof logo === 'object' && logo !== null ? logo : null

  if (uploaded?.url) {
    return (
      <span className={`inline-flex items-center ${className ?? ''}`}>
        <Image
          src={toImageSrc(uploaded.url)}
          alt={uploaded.alt || alt}
          width={uploaded.width ?? 900}
          height={uploaded.height ?? 170}
          priority
          sizes={responsiveSizes}
          className={`h-auto w-auto ${height}`}
          style={{ width: 'auto' }}
        />
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center ${className ?? ''}`}>
      <Image
        src={tone === 'on-light' ? bundledOnLight : bundledOnDark}
        alt={alt}
        priority
        sizes={responsiveSizes}
        className={`h-auto w-auto ${height}`}
        style={{ width: 'auto' }}
      />
    </span>
  )
}

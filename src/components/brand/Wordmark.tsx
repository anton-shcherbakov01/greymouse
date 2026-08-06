import Image from 'next/image'

import logo from '../../../public/brand/logo.png'

type WordmarkProps = {
  className?: string
  /**
   * Только знак, без названия — для компактных мест. Логотип неразделим
   * (мышь и плашка с названием нарисованы вместе), поэтому здесь показывается
   * тот же файл, просто мельче.
   */
  markOnly?: boolean
}

/**
 * Логотип студии. Растровый файл, а не SVG: исходник пришёл изображением,
 * с градиентами и мягкими тенями — их векторизация исказила бы знак.
 *
 * Размеры берутся из самого файла (импорт даёт width/height), поэтому место
 * под логотип резервируется до загрузки и вёрстка не прыгает.
 */
export const Wordmark = ({ className, markOnly = false }: WordmarkProps) => (
  <span className={`inline-flex items-center ${className ?? ''}`}>
    <Image
      src={logo}
      alt="Серая Мышь — digital-студия"
      priority
      sizes="220px"
      className={`h-auto w-auto ${markOnly ? 'max-h-7' : 'max-h-9'}`}
      style={{ width: 'auto' }}
    />
  </span>
)

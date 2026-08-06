'use client'

import dynamic from 'next/dynamic'

/**
 * Сцена не участвует в SSR и не входит в основной бандл страницы.
 * До её загрузки виден постер, отрендеренный из этой же сцены.
 */
export const HeroScene = dynamic(() => import('./HeroCanvas').then((module) => module.HeroCanvas), {
  ssr: false,
  loading: () => null,
})

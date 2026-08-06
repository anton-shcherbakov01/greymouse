import { SITE_URL } from './site'

/**
 * Ссылка предпросмотра из админки. Секрет проверяется маршрутом
 * `/api/preview`, который включает draft mode и уводит на публичную страницу.
 */
export const getPreviewUrl = (collection: 'cases', slug: string): string => {
  const params = new URLSearchParams({
    collection,
    slug,
    secret: process.env.PREVIEW_SECRET ?? '',
  })
  return `${SITE_URL}/preview?${params.toString()}`
}

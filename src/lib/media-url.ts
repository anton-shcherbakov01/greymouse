import { SITE_URL } from './site'

/**
 * Приводит URL медиа к относительному пути, если файл лежит на нашем же хосте.
 *
 * Payload подставляет к `url` абсолютный адрес (из `serverURL` или из origin
 * запроса). Оптимизатор изображений Next 16 отказывается забирать такой адрес,
 * когда хост резолвится в приватный IP (защита от SSRF), а в production это
 * лишний сетевой поход приложения в самого себя.
 *
 * URL внешнего хранилища (S3/CDN) остаётся абсолютным и обрабатывается
 * `remotePatterns` из `next.config.mjs`.
 */
export const toImageSrc = (rawUrl: string): string => {
  if (!rawUrl.startsWith('http')) return rawUrl

  try {
    const url = new URL(rawUrl)
    const siteHost = new URL(SITE_URL).host
    const isOwnHost =
      url.host === siteHost || url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    return isOwnHost ? `${url.pathname}${url.search}` : rawUrl
  } catch {
    return rawUrl
  }
}

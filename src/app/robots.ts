import type { MetadataRoute } from 'next'

import { absoluteUrl, isProductionSite } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isProductionSite
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/preview'] }]
      : // Не-production окружения не должны попадать в индекс.
        [{ userAgent: '*', disallow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}

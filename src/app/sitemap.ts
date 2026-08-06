import type { MetadataRoute } from 'next'

import { getPublishedCases } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const cases = await getPublishedCases()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/cases'), changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/services'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/about'), changeFrequency: 'yearly', priority: 0.6 },
    { url: absoluteUrl('/contact'), changeFrequency: 'yearly', priority: 0.6 },
  ]

  const caseRoutes: MetadataRoute.Sitemap = cases
    // Кейс, помеченный noindex, не должен попадать в карту сайта.
    .filter((caseItem) => !caseItem.seo?.noindex)
    .map((caseItem) => ({
      url: absoluteUrl(`/cases/${caseItem.slug}`),
      lastModified: new Date(caseItem.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  return [...staticRoutes, ...caseRoutes]
}

export default sitemap

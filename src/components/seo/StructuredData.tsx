import type { Case, SiteSetting } from '@/payload-types'

import { resolveMedia } from '@/components/ui/MediaImage'
import { absoluteUrl, SITE_URL } from '@/lib/site'

const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script
    type="application/ld+json"
    // Данные формируются на сервере из CMS; пользовательский ввод сюда не попадает.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
)

export const OrganizationSchema = ({ settings }: { settings: SiteSetting }) => {
  const sameAs = (settings.socialLinks ?? []).map((link) => link.url).filter(Boolean)

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#organization`,
        name: settings.siteName || 'Серая Мышь',
        url: SITE_URL,
        description:
          settings.organizationDescription || settings.positioning || settings.heroSubheading,
        ...(settings.email ? { email: settings.email } : {}),
        ...(settings.phone ? { telephone: settings.phone } : {}),
        ...(settings.city
          ? { address: { '@type': 'PostalAddress', addressLocality: settings.city } }
          : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
        areaServed: 'RU',
        knowsLanguage: ['ru'],
      }}
    />
  )
}

export const CaseSchema = ({ caseItem }: { caseItem: Case }) => {
  const cover = resolveMedia(caseItem.cover)

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: caseItem.title,
        url: absoluteUrl(`/cases/${caseItem.slug}`),
        description: caseItem.shortDescription,
        ...(cover?.url ? { image: absoluteUrl(cover.url) } : {}),
        ...(caseItem.publishedAt ? { datePublished: caseItem.publishedAt } : {}),
        dateModified: caseItem.updatedAt,
        creator: { '@id': `${SITE_URL}/#organization` },
        ...(caseItem.client ? { about: caseItem.client } : {}),
      }}
    />
  )
}

export const BreadcrumbSchema = ({
  items,
}: {
  items: Array<{ name: string; path: string }>
}) => (
  <JsonLd
    data={{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      })),
    }}
  />
)

import type { Metadata } from 'next'

import { ContactCta } from '@/components/home/ContactCta'
import { FeaturedCases } from '@/components/home/FeaturedCases'
import { Founders } from '@/components/home/Founders'
import { Hero } from '@/components/home/Hero'
import { Positioning } from '@/components/home/Positioning'
import { Process } from '@/components/home/Process'
import { ResultsStrip } from '@/components/home/ResultsStrip'
import { ServicesOverview } from '@/components/home/ServicesOverview'
import { OrganizationSchema } from '@/components/seo/StructuredData'
import {
  getFeaturedCases,
  getPublishedServices,
  getSiteSettings,
  getTeam,
} from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return {
    alternates: { canonical: absoluteUrl('/') },
    title: {
      absolute: settings.seo?.title || `${settings.siteName} — тихо делаем заметные цифровые продукты`,
    },
  }
}

const HomePage = async () => {
  const [settings, featured, services, team] = await Promise.all([
    getSiteSettings(),
    getFeaturedCases(3),
    getPublishedServices(),
    getTeam(),
  ])

  return (
    <>
      <OrganizationSchema settings={settings} />
      <Hero settings={settings} />
      <Positioning settings={settings} />
      <FeaturedCases cases={featured} />
      <ServicesOverview services={services} />
      <Process settings={settings} />
      <ResultsStrip cases={featured} />
      <Founders people={team} />
      <ContactCta settings={settings} />
    </>
  )
}

export default HomePage

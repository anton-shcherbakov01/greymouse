import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { DashboardApp } from '@/features/analytics-demo/components/dashboard-app'
import { getSiteSettings } from '@/lib/queries'

const AnalyticsDemoPage = async () => {
  const settings = await getSiteSettings()
  const showcase = settings.demoShowcase

  if (showcase?.enabled === false) notFound()

  return (
    <Suspense fallback={<div className="app-loading" aria-label="Загрузка демо" />}>
      <DashboardApp demo defaultCompany={showcase?.companyName || 'Вектор Трейд'} />
    </Suspense>
  )
}

export default AnalyticsDemoPage

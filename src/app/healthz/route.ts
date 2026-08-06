import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/** Проверка живости для контейнера: приложение поднялось и база отвечает. */
export const GET = async () => {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'cases', overrideAccess: true })
    return NextResponse.json({ status: 'ok', database: 'ok' })
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unreachable' }, { status: 503 })
  }
}

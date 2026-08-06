import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/**
 * Включение предпросмотра черновика.
 *
 * Двойная проверка: секрет из окружения **и** активная сессия редактора —
 * утёкшая ссылка сама по себе не открывает доступ к неопубликованному контенту.
 *
 * Токен из куки Payload принимает только у «браузерных» запросов: при заданном
 * `csrf` в конфиге нужен либо разрешённый `Origin`, либо заголовок
 * `Sec-Fetch-Site`. Обычная навигация из админки это условие выполняет,
 * сторонний HTTP-клиент — нет. Это защита от CSRF, а не ограничение.
 */
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const collection = searchParams.get('collection')

  const expected = process.env.PREVIEW_SECRET
  if (!expected || secret !== expected) {
    return new NextResponse('Недействительная ссылка предпросмотра', { status: 401 })
  }
  if (collection !== 'cases' || !slug) {
    return new NextResponse('Некорректные параметры предпросмотра', { status: 400 })
  }

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return new NextResponse('Требуется вход в админку', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()

  return NextResponse.redirect(new URL(`/cases/${slug}`, request.url))
}

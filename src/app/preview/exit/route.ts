import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export const GET = async (request: NextRequest) => {
  const draft = await draftMode()
  draft.disable()
  return NextResponse.redirect(new URL('/cases', request.url))
}

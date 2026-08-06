import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { CACHE_TAGS } from '@/lib/queries'

/**
 * Сброс кеша после правок в CMS. Без этого опубликованный кейс появлялся бы
 * на сайте только по истечении revalidate-окна.
 *
 * `revalidateTag`/`revalidatePath` доступны только в рантайме Next; при запуске
 * из CLI-скриптов (seed, миграции) вызов молча пропускается.
 */
const safeRevalidate = (fn: () => void) => {
  try {
    fn()
  } catch {
    // Вне контекста Next-запроса ревалидация не нужна.
  }
}

export const revalidateCases: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate(() => {
    revalidateTag(CACHE_TAGS.cases, { expire: 0 })
    revalidatePath('/')
    revalidatePath('/cases')
    if (doc?.slug) revalidatePath(`/cases/${doc.slug}`)
    revalidatePath('/sitemap.xml')
  })
  return doc
}

export const revalidateCasesAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  safeRevalidate(() => {
    revalidateTag(CACHE_TAGS.cases, { expire: 0 })
    revalidatePath('/cases')
    revalidatePath('/sitemap.xml')
  })
  return doc
}

export const makeCollectionRevalidator =
  (tag: string, paths: string[]): CollectionAfterChangeHook =>
  ({ doc }) => {
    safeRevalidate(() => {
      revalidateTag(tag, { expire: 0 })
      paths.forEach((path) => revalidatePath(path))
    })
    return doc
  }

export const makeGlobalRevalidator =
  (tag: string, paths: string[]): GlobalAfterChangeHook =>
  ({ doc }) => {
    safeRevalidate(() => {
      revalidateTag(tag, { expire: 0 })
      paths.forEach((path) => revalidatePath(path))
    })
    return doc
  }

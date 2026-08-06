import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

type MaybeUser = User | null | undefined

const isActive = (user: MaybeUser): user is User => Boolean(user && user.active !== false)

export const isAdmin: Access = ({ req }) => {
  const user = req.user as MaybeUser
  return isActive(user) && user.role === 'admin'
}

export const isAdminField: FieldAccess = ({ req }) => {
  const user = req.user as MaybeUser
  return isActive(user) && user.role === 'admin'
}

/** Редактор и администратор — обычный рабочий доступ к контенту. */
export const isEditor: Access = ({ req }) => {
  const user = req.user as MaybeUser
  return isActive(user) && (user.role === 'admin' || user.role === 'editor')
}

export const isAdminOrSelf: Access = ({ req }) => {
  const user = req.user as MaybeUser
  if (!isActive(user)) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}

/**
 * Публичное чтение только опубликованных документов.
 * Авторизованный редактор видит и черновики — это же условие обслуживает preview.
 */
export const publishedOrEditor: Access = ({ req }) => {
  const user = req.user as MaybeUser
  if (isActive(user) && (user.role === 'admin' || user.role === 'editor')) return true
  return {
    _status: { equals: 'published' },
  }
}

/** Коллекции без версий: флаг `published` вместо `_status`. */
export const publishedFlagOrEditor: Access = ({ req }) => {
  const user = req.user as MaybeUser
  if (isActive(user) && (user.role === 'admin' || user.role === 'editor')) return true
  return {
    published: { equals: true },
  }
}

/** Медиа читается публично: файлы отдаются по прямым URL. */
export const anyone: Access = () => true

/** Никто через API — только серверный `overrideAccess`. */
export const nobody: Access = () => false

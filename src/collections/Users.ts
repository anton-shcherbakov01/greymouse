import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, isAdminOrSelf } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'active'],
    group: 'Система',
  },
  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    // В админку пускаем только активных admin/editor.
    admin: ({ req: { user } }) =>
      Boolean(user && user.active !== false && (user.role === 'admin' || user.role === 'editor')),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Роль',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор', value: 'editor' },
      ],
      access: {
        // Роль повышает себе только администратор.
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        description:
          'Редактор управляет контентом. Администратор дополнительно управляет пользователями и настройками сайта.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Доступ разрешён',
      defaultValue: true,
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        description: 'Снимите галочку, чтобы закрыть вход, не удаляя учётную запись.',
      },
    },
  ],
}

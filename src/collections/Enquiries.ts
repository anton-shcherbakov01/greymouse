import type { CollectionConfig } from 'payload'

import { isAdmin, isEditor, nobody } from '@/access'

/**
 * Заявки с формы контактов. Создание идёт только серверным экшеном
 * с `overrideAccess`, публичного create через REST/GraphQL нет.
 */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'contact', 'status', 'createdAt'],
    group: 'Обращения',
    description: 'Заявки с формы на сайте. Создаются автоматически, вручную не заводятся.',
  },
  access: {
    read: isEditor,
    create: nobody,
    update: isEditor,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', label: 'Имя', required: true },
    { name: 'contact', type: 'text', label: 'Email или Telegram', required: true },
    { name: 'company', type: 'text', label: 'Компания' },
    { name: 'budget', type: 'text', label: 'Бюджет' },
    { name: 'message', type: 'textarea', label: 'Сообщение', required: true },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'В работе', value: 'in-progress' },
        { label: 'Закрыта', value: 'closed' },
        { label: 'Спам', value: 'spam' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'consent',
      type: 'checkbox',
      label: 'Согласие на обработку данных получено',
      defaultValue: false,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'meta',
      type: 'group',
      label: 'Служебное',
      admin: { position: 'sidebar', readOnly: true },
      fields: [
        { name: 'sourcePage', type: 'text', label: 'Страница' },
        { name: 'userAgent', type: 'text', label: 'User-Agent' },
      ],
    },
  ],
}

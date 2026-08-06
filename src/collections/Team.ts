import type { CollectionConfig } from 'payload'

import { isEditor, publishedFlagOrEditor } from '@/access'
import { makeCollectionRevalidator } from '@/hooks/revalidate'
import { slugField } from '@/fields/slug'

export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Человек', plural: 'Команда' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'sortOrder', 'published'],
    group: 'Контент',
    description:
      'Основатели и команда. Имя, роль, биография и фотография редактируются здесь — в коде они не зашиты.',
  },
  access: {
    read: publishedFlagOrEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    afterChange: [makeCollectionRevalidator('team', ['/', '/about'])],
  },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'name', type: 'text', label: 'Имя и фамилия', required: true },
    slugField({ sourceField: 'name' }),
    {
      name: 'role',
      type: 'text',
      label: 'Роль',
      required: true,
      admin: { description: 'Например: «Сооснователь, дизайн» — укажите реальную роль человека.' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фотография',
      admin: {
        description:
          'Портрет 4:5 (вертикальный). Alt-текст задаётся у самого файла в разделе «Медиа».',
      },
    },
    {
      name: 'shortBio',
      type: 'textarea',
      label: 'Короткий текст',
      maxLength: 260,
      admin: { description: 'Одно-два предложения под карточкой. Человеческим языком.' },
    },
    {
      name: 'extendedBio',
      type: 'richText',
      label: 'Развёрнутая биография',
      admin: { description: 'Показывается на странице «О студии». Необязательно.' },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: 'Цитата',
      maxLength: 300,
    },
    {
      name: 'links',
      type: 'array',
      label: 'Ссылки',
      labels: { singular: 'Ссылка', plural: 'Ссылки' },
      maxRows: 5,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Название',
          required: true,
          admin: { description: 'Например: Telegram, GitHub, Behance.' },
        },
        { name: 'url', type: 'text', label: 'URL', required: true },
      ],
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Порядок',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Меньше — раньше в списке.' },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Показывать на сайте',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}

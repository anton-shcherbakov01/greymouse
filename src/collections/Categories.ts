import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { makeCollectionRevalidator } from '@/hooks/revalidate'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категория', plural: 'Категории' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'sortOrder'],
    group: 'Контент',
    description: 'Категории для фильтра на странице кейсов.',
  },
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    afterChange: [makeCollectionRevalidator('categories', ['/cases'])],
  },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true },
    slugField(),
    { name: 'description', type: 'textarea', label: 'Описание', maxLength: 240 },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Порядок',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Меньше — выше в списке фильтров.' },
    },
  ],
}

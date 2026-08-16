import type { CollectionConfig } from 'payload'

import { isEditor, publishedFlagOrEditor } from '@/access'
import { seoField } from '@/fields/seo'
import { makeCollectionRevalidator } from '@/hooks/revalidate'
import { slugField } from '@/fields/slug'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Услуга', plural: 'Услуги' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sortOrder', 'published'],
    group: 'Контент',
    description: 'Услуги студии, сгруппированные по этапам жизненного цикла проекта.',
  },
  access: {
    read: publishedFlagOrEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    afterChange: [makeCollectionRevalidator('services', ['/', '/services', '/about'])],
  },
  defaultSort: 'sortOrder',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            { name: 'title', type: 'text', label: 'Название', required: true },
            {
              name: 'promise',
              type: 'textarea',
              label: 'Обещание результата',
              required: true,
              maxLength: 220,
              admin: {
                description: 'Одна фраза о том, что клиент получает. Без общих слов.',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Краткое описание',
              maxLength: 400,
            },
            {
              name: 'fullDescription',
              type: 'richText',
              label: 'Подробное описание',
            },
          ],
        },
        {
          label: 'Содержание',
          fields: [
            {
              name: 'clientProblems',
              type: 'array',
              label: 'Задачи клиента',
              labels: { singular: 'Задача', plural: 'Задачи' },
              admin: { description: 'С какими запросами приходят. Формулируйте словами клиента.' },
              fields: [{ name: 'text', type: 'text', label: 'Задача', required: true }],
            },
            {
              name: 'scope',
              type: 'array',
              label: 'Состав работ',
              labels: { singular: 'Работа', plural: 'Работы' },
              fields: [{ name: 'text', type: 'text', label: 'Работа', required: true }],
            },
            {
              name: 'deliverables',
              type: 'array',
              label: 'Что получает клиент',
              labels: { singular: 'Результат', plural: 'Результаты' },
              fields: [
                { name: 'text', type: 'text', label: 'Результат', required: true },
                { name: 'note', type: 'text', label: 'Уточнение' },
              ],
            },
          ],
        },
        {
          label: 'Связи и CTA',
          fields: [
            {
              name: 'relatedCases',
              type: 'relationship',
              relationTo: 'cases',
              hasMany: true,
              label: 'Связанные кейсы',
              admin: { description: 'Показываются в блоке услуги. Черновики не выводятся.' },
            },
            {
              name: 'ctaLabel',
              type: 'text',
              label: 'Текст кнопки',
              defaultValue: 'Обсудить проект',
            },
            {
              name: 'ctaHref',
              type: 'text',
              label: 'Ссылка кнопки',
              defaultValue: '/contact',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField()],
        },
      ],
    },
    slugField(),
    {
      name: 'icon',
      type: 'select',
      label: 'Знак',
      defaultValue: 'signal',
      options: [
        { label: 'Сигнал', value: 'signal' },
        { label: 'Сетка', value: 'grid' },
        { label: 'Слои', value: 'layers' },
        { label: 'Траектория', value: 'path' },
        { label: 'Ядро', value: 'core' },
      ],
      admin: { position: 'sidebar', description: 'Схематичный знак в карточке услуги.' },
    },
    {
      name: 'visual',
      type: 'upload',
      relationTo: 'media',
      label: 'Изображение',
      admin: { position: 'sidebar', description: 'Необязательно. Заменяет знак в карточке.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Порядок',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Меньше — выше внутри этапа.' },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Опубликована',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}

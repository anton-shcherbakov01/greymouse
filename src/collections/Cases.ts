import type { CollectionConfig } from 'payload'

import { isEditor, publishedOrEditor } from '@/access'
import { caseContentBlocks } from '@/blocks'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { revalidateCases, revalidateCasesAfterDelete } from '@/hooks/revalidate'
import { getPreviewUrl } from '@/lib/preview'

const currentYear = new Date().getFullYear()

export const Cases: CollectionConfig = {
  slug: 'cases',
  labels: { singular: 'Кейс', plural: 'Кейсы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'year', 'featured', 'sortOrder', '_status'],
    group: 'Контент',
    description: 'Проекты студии. Черновики не видны на сайте, но открываются в предпросмотре.',
    preview: (doc) => getPreviewUrl('cases', String(doc?.slug ?? '')),
    livePreview: {
      url: ({ data }) => getPreviewUrl('cases', String(data?.slug ?? '')),
      breakpoints: [
        { label: 'Мобильный', name: 'mobile', width: 390, height: 844 },
        { label: 'Планшет', name: 'tablet', width: 768, height: 1024 },
        { label: 'Десктоп', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  access: {
    read: publishedOrEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: {
    afterChange: [revalidateCases],
    afterDelete: [revalidateCasesAfterDelete],
  },
  versions: {
    /*
      Автосохранение намеренно выключено: с ним Payload убирает кнопку
      «Сохранить черновик», а редактору нужен явный контроль над тем,
      что уже сохранено, а что ещё правится. История версий сохраняется.
    */
    drafts: true,
    maxPerDoc: 20,
  },
  defaultSort: ['sortOrder', '-publishedAt'],
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Обзор',
          fields: [
            { name: 'title', type: 'text', label: 'Название проекта', required: true },
            {
              name: 'client',
              type: 'text',
              label: 'Клиент',
              required: true,
              admin: { description: 'Указывайте название клиента только с его согласия.' },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Краткое описание',
              required: true,
              maxLength: 280,
              admin: { description: 'Одно-два предложения для карточки и поиска.' },
            },
            {
              name: 'shortResult',
              type: 'text',
              label: 'Результат одной строкой',
              maxLength: 140,
              admin: { description: 'Показывается в карточке кейса. Необязательно.' },
            },
            {
              name: 'cover',
              type: 'upload',
              relationTo: 'media',
              label: 'Обложка',
              required: true,
              admin: { description: 'Соотношение 4:3. Используется в списке кейсов и в OG.' },
            },
            {
              name: 'heroMedia',
              type: 'upload',
              relationTo: 'media',
              label: 'Изображение на странице кейса',
              admin: { description: 'Если пусто, используется обложка.' },
            },
            {
              name: 'tags',
              type: 'array',
              label: 'Теги',
              labels: { singular: 'Тег', plural: 'Теги' },
              maxRows: 8,
              fields: [{ name: 'label', type: 'text', label: 'Тег', required: true }],
            },
          ],
        },
        {
          label: 'Рассказ',
          fields: [
            {
              name: 'challenge',
              type: 'richText',
              label: 'Задача',
              admin: { description: 'С чем пришёл клиент. Необязательно — пустой блок не выводится.' },
            },
            {
              name: 'context',
              type: 'richText',
              label: 'Контекст',
              admin: { description: 'Ограничения, рынок, состояние продукта до работы.' },
            },
            {
              name: 'solution',
              type: 'richText',
              label: 'Решение',
            },
            {
              name: 'process',
              type: 'richText',
              label: 'Процесс',
            },
            {
              name: 'results',
              type: 'richText',
              label: 'Результат',
            },
            {
              name: 'contentBlocks',
              type: 'blocks',
              label: 'Блоки страницы',
              labels: { singular: 'Блок', plural: 'Блоки' },
              blocks: caseContentBlocks,
              admin: {
                description:
                  'Свободная часть страницы: изображения, галереи, видео, показатели. Порядок задаётся перетаскиванием.',
              },
            },
          ],
        },
        {
          label: 'Результаты и команда',
          fields: [
            {
              name: 'metrics',
              type: 'array',
              label: 'Измеримые показатели',
              labels: { singular: 'Показатель', plural: 'Показатели' },
              maxRows: 6,
              admin: {
                description:
                  'Заполняйте только реальными измеренными данными с указанием источника. Пустой список ничего не выводит.',
              },
              fields: [
                { name: 'value', type: 'text', label: 'Значение', required: true },
                { name: 'label', type: 'text', label: 'Что измеряли', required: true },
                { name: 'source', type: 'text', label: 'Как измеряли' },
              ],
            },
            {
              name: 'testimonial',
              type: 'group',
              label: 'Отзыв',
              admin: { description: 'Публикуйте только настоящие отзывы с согласия автора.' },
              fields: [
                { name: 'quote', type: 'textarea', label: 'Текст', maxLength: 420 },
                { name: 'author', type: 'text', label: 'Автор' },
                { name: 'role', type: 'text', label: 'Должность и компания' },
                { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фото автора' },
              ],
            },
            {
              name: 'projectTeam',
              type: 'array',
              label: 'Команда проекта',
              labels: { singular: 'Участник', plural: 'Участники' },
              fields: [
                {
                  name: 'person',
                  type: 'relationship',
                  relationTo: 'team',
                  label: 'Человек',
                },
                {
                  name: 'externalName',
                  type: 'text',
                  label: 'Имя (если не из команды)',
                },
                { name: 'role', type: 'text', label: 'Роль в проекте', required: true },
              ],
            },
            {
              name: 'relatedCase',
              type: 'relationship',
              relationTo: 'cases',
              label: 'Связанный кейс',
              admin: {
                description:
                  'Что показать в конце страницы. Если не выбрано, подставляется следующий по порядку.',
              },
            },
            {
              name: 'externalUrl',
              type: 'text',
              label: 'Ссылка на проект',
              admin: { description: 'Публичный адрес продукта, если он открыт.' },
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
      name: 'year',
      type: 'number',
      label: 'Год',
      required: true,
      defaultValue: currentYear,
      min: 2000,
      max: currentYear + 1,
      admin: { position: 'sidebar' },
    },
    {
      name: 'services',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      label: 'Услуги',
      admin: { position: 'sidebar', description: 'Используется фильтром на странице кейсов.' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Категории',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Избранный кейс',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Избранные кейсы показываются на главной.' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Порядок',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Ручная сортировка: меньше — выше в списке. При равных значениях сортировка по дате.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData?._status === 'published' && !value) return new Date().toISOString()
            return value
          },
        ],
      },
    },
  ],
}

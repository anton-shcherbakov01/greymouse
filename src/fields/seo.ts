import type { Field } from 'payload'

/**
 * Компактная SEO-группа вместо плагина: нужны всего три поля,
 * а превью сниппета описывается через `admin.description`.
 */
export const seoField = (): Field => ({
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: {
    description:
      'Если поля пустые, используются название и краткое описание материала, а также OG-изображение по умолчанию из настроек сайта.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      maxLength: 70,
      admin: { description: 'До 70 символов. Показывается во вкладке браузера и в выдаче.' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      maxLength: 180,
      admin: { description: 'До 180 символов. Текст сниппета в поисковой выдаче.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'OG-изображение',
      admin: { description: 'Оптимальный размер 1200 × 630. Показывается при репосте ссылки.' },
    },
    {
      name: 'noindex',
      type: 'checkbox',
      label: 'Запретить индексацию',
      defaultValue: false,
    },
  ],
})

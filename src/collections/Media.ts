import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиа' },
  admin: {
    group: 'Контент',
    defaultColumns: ['filename', 'alt', 'mimeType', 'updatedAt'],
    description: 'Изображения и видео сайта. Для каждого изображения обязателен alt.',
  },
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  upload: {
    /*
      Явный каталог для локального хранилища: без него Payload кладёт файлы
      в `media/` рядом с конфигом, и они попадают в репозиторий.
      В production включается S3 и этот путь не используется.
    */
    staticDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/media'),
    mimeTypes: ALLOWED_MIME,
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 768, height: 576, position: 'centre' },
      { name: 'portrait', width: 800, height: 1000, position: 'centre' },
      { name: 'wide', width: 1600, height: undefined },
      { name: 'hero', width: 2400, height: undefined },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt-текст',
      admin: {
        description:
          'Что изображено. Для декоративных изображений оставьте пустым и отметьте «Декоративное».',
      },
      validate: (value: unknown, { data }: { data: Partial<{ decorative?: boolean; mimeType?: string }> }) => {
        const isImage = (data?.mimeType ?? '').startsWith('image/')
        if (!isImage) return true
        if (data?.decorative) return true
        if (typeof value === 'string' && value.trim().length > 0) return true
        return 'Заполните alt-текст или отметьте изображение как декоративное'
      },
    },
    {
      name: 'decorative',
      type: 'checkbox',
      label: 'Декоративное изображение',
      defaultValue: false,
      admin: {
        description: 'Скринридер пропустит такое изображение (alt=""). Только для фона и текстур.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
      admin: { description: 'Видимая подпись под изображением в галереях. Необязательно.' },
    },
    {
      name: 'credit',
      type: 'text',
      label: 'Источник / правообладатель',
      admin: {
        position: 'sidebar',
        description: 'Например: «Фото: Иван Иванов» или условия лицензии.',
      },
    },
  ],
}

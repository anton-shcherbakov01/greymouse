import type { Block } from 'payload'

/**
 * Небольшая типизированная система блоков для детальных страниц кейсов.
 * Универсального page builder намеренно нет: каждый блок покрывает конкретный
 * повторяющийся сценарий рассказа о проекте.
 */

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Текст', plural: 'Текст' },
  interfaceName: 'RichTextBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Надзаголовок',
      admin: { description: 'Короткая метка над текстом. Необязательно.' },
    },
    { name: 'heading', type: 'text', label: 'Заголовок' },
    { name: 'content', type: 'richText', label: 'Текст', required: true },
    {
      name: 'width',
      type: 'select',
      label: 'Ширина',
      defaultValue: 'narrow',
      options: [
        { label: 'Узкая колонка', value: 'narrow' },
        { label: 'Полная ширина', value: 'wide' },
      ],
    },
  ],
}

export const FullWidthImageBlock: Block = {
  slug: 'fullWidthImage',
  labels: { singular: 'Изображение во всю ширину', plural: 'Изображения во всю ширину' },
  interfaceName: 'FullWidthImageBlock',
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение', required: true },
    { name: 'caption', type: 'text', label: 'Подпись' },
    {
      name: 'bleed',
      type: 'checkbox',
      label: 'До краёв экрана',
      defaultValue: true,
    },
  ],
}

export const ImagePairBlock: Block = {
  slug: 'imagePair',
  labels: { singular: 'Пара изображений', plural: 'Пары изображений' },
  interfaceName: 'ImagePairBlock',
  fields: [
    { name: 'left', type: 'upload', relationTo: 'media', label: 'Слева', required: true },
    { name: 'right', type: 'upload', relationTo: 'media', label: 'Справа', required: true },
    { name: 'caption', type: 'text', label: 'Общая подпись' },
    {
      name: 'ratio',
      type: 'select',
      label: 'Пропорции',
      defaultValue: 'equal',
      options: [
        { label: '1 : 1', value: 'equal' },
        { label: 'Шире слева', value: 'left' },
        { label: 'Шире справа', value: 'right' },
      ],
    },
  ],
}

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'Галерея', plural: 'Галереи' },
  interfaceName: 'GalleryBlock',
  fields: [
    { name: 'heading', type: 'text', label: 'Заголовок' },
    {
      name: 'items',
      type: 'array',
      label: 'Изображения',
      minRows: 2,
      labels: { singular: 'Изображение', plural: 'Изображения' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Файл', required: true },
        { name: 'caption', type: 'text', label: 'Подпись' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Колонок',
      defaultValue: '2',
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
      ],
    },
  ],
}

export const VideoBlock: Block = {
  slug: 'video',
  labels: { singular: 'Видео', plural: 'Видео' },
  interfaceName: 'VideoBlock',
  fields: [
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      label: 'Файл видео',
      required: true,
      filterOptions: { mimeType: { contains: 'video' } },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      label: 'Постер',
      required: true,
      admin: { description: 'Обязателен: показывается до загрузки видео и предотвращает сдвиг вёрстки.' },
    },
    { name: 'caption', type: 'text', label: 'Подпись' },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Автовоспроизведение без звука',
      defaultValue: false,
      admin: {
        description:
          'Видео зациклится без звука и остановится вне экрана. При prefers-reduced-motion автозапуск отключается.',
      },
    },
  ],
}

export const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Цитата', plural: 'Цитаты' },
  interfaceName: 'QuoteBlock',
  fields: [
    { name: 'quote', type: 'textarea', label: 'Текст цитаты', required: true, maxLength: 420 },
    { name: 'author', type: 'text', label: 'Автор' },
    { name: 'authorRole', type: 'text', label: 'Должность и компания' },
  ],
}

export const MetricGridBlock: Block = {
  slug: 'metricGrid',
  labels: { singular: 'Показатели', plural: 'Показатели' },
  interfaceName: 'MetricGridBlock',
  admin: {
    // Прямое предупреждение в интерфейсе: цифры должны быть настоящими.
    group: 'Результат',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Заголовок',
      admin: { description: 'Например: «Что изменилось».' },
    },
    {
      name: 'metrics',
      type: 'array',
      label: 'Показатели',
      minRows: 1,
      maxRows: 6,
      labels: { singular: 'Показатель', plural: 'Показатели' },
      admin: {
        description:
          'Указывайте только измеренные значения и обязательно поясняйте методику. Блок без реальных данных лучше не добавлять.',
      },
      fields: [
        { name: 'value', type: 'text', label: 'Значение', required: true },
        { name: 'label', type: 'text', label: 'Что измеряли', required: true },
        {
          name: 'source',
          type: 'text',
          label: 'Как измеряли',
          admin: { description: 'Источник и период. Например: «Яндекс Метрика, 3 месяца после запуска».' },
        },
      ],
    },
  ],
}

export const TextMediaBlock: Block = {
  slug: 'textMedia',
  labels: { singular: 'Текст с изображением', plural: 'Текст с изображением' },
  interfaceName: 'TextMediaBlock',
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Надзаголовок' },
    { name: 'heading', type: 'text', label: 'Заголовок' },
    { name: 'content', type: 'richText', label: 'Текст', required: true },
    { name: 'media', type: 'upload', relationTo: 'media', label: 'Изображение', required: true },
    {
      name: 'mediaPosition',
      type: 'select',
      label: 'Изображение',
      defaultValue: 'right',
      options: [
        { label: 'Справа', value: 'right' },
        { label: 'Слева', value: 'left' },
      ],
    },
  ],
}

export const StickyTextBlock: Block = {
  slug: 'stickyText',
  labels: { singular: 'Прилипающий текст', plural: 'Прилипающие тексты' },
  interfaceName: 'StickyTextBlock',
  fields: [
    { name: 'heading', type: 'text', label: 'Заголовок', required: true },
    { name: 'intro', type: 'textarea', label: 'Вступление', maxLength: 400 },
    {
      name: 'steps',
      type: 'array',
      label: 'Шаги',
      minRows: 2,
      labels: { singular: 'Шаг', plural: 'Шаги' },
      fields: [
        { name: 'title', type: 'text', label: 'Название', required: true },
        { name: 'text', type: 'textarea', label: 'Описание', required: true },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение' },
      ],
    },
  ],
}

export const NextCaseBlock: Block = {
  slug: 'nextCase',
  labels: { singular: 'Следующий кейс', plural: 'Следующие кейсы' },
  interfaceName: 'NextCaseBlock',
  fields: [
    {
      name: 'case',
      type: 'relationship',
      relationTo: 'cases',
      label: 'Кейс',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      label: 'Подпись над кейсом',
      defaultValue: 'Следующий проект',
    },
  ],
}

export const caseContentBlocks = [
  RichTextBlock,
  FullWidthImageBlock,
  ImagePairBlock,
  GalleryBlock,
  VideoBlock,
  QuoteBlock,
  MetricGridBlock,
  TextMediaBlock,
  StickyTextBlock,
  NextCaseBlock,
]

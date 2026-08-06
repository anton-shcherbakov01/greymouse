import type { GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { makeGlobalRevalidator } from '@/hooks/revalidate'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Навигация',
  admin: {
    group: 'Настройки',
    description: 'Пункты меню в шапке и футере. Меняются без правки кода.',
  },
  access: {
    read: anyone,
    update: isEditor,
  },
  hooks: {
    afterChange: [makeGlobalRevalidator('navigation', ['/'])],
  },
  fields: [
    {
      name: 'header',
      type: 'array',
      label: 'Шапка',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      maxRows: 6,
      defaultValue: [
        { label: 'Кейсы', href: '/cases' },
        { label: 'Услуги', href: '/services' },
        { label: 'О студии', href: '/about' },
        { label: 'Контакты', href: '/contact' },
      ],
      fields: [
        { name: 'label', type: 'text', label: 'Название', required: true },
        { name: 'href', type: 'text', label: 'Ссылка', required: true },
      ],
    },
    {
      name: 'headerCta',
      type: 'group',
      label: 'Кнопка в шапке',
      fields: [
        { name: 'label', type: 'text', label: 'Текст', defaultValue: 'Обсудить проект' },
        { name: 'href', type: 'text', label: 'Ссылка', defaultValue: '/contact' },
        { name: 'enabled', type: 'checkbox', label: 'Показывать', defaultValue: true },
      ],
    },
    {
      name: 'footerGroups',
      type: 'array',
      label: 'Футер',
      labels: { singular: 'Группа', plural: 'Группы' },
      maxRows: 4,
      defaultValue: [
        {
          title: 'Студия',
          links: [
            { label: 'Кейсы', href: '/cases' },
            { label: 'Услуги', href: '/services' },
            { label: 'О студии', href: '/about' },
          ],
        },
        {
          title: 'Связь',
          links: [{ label: 'Контакты', href: '/contact' }],
        },
      ],
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок группы', required: true },
        {
          name: 'links',
          type: 'array',
          label: 'Ссылки',
          labels: { singular: 'Ссылка', plural: 'Ссылки' },
          fields: [
            { name: 'label', type: 'text', label: 'Название', required: true },
            { name: 'href', type: 'text', label: 'Ссылка', required: true },
          ],
        },
      ],
    },
  ],
}

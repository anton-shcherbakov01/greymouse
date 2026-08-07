import type { GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { makeGlobalRevalidator } from '@/hooks/revalidate'
import { seoField } from '@/fields/seo'
import { DEFAULT_ACCENT, normaliseHex } from '@/lib/accent'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: {
    group: 'Настройки',
    description: 'Оформление, тексты первого экрана, контакты, футер и SEO по умолчанию.',
  },
  access: {
    read: anyone,
    update: isEditor,
  },
  hooks: {
    afterChange: [makeGlobalRevalidator('site-settings', ['/', '/about', '/contact', '/services'])],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Оформление',
          description: 'Логотип и акцентный цвет. Меняются без пересборки сайта.',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Логотип',
              admin: {
                description:
                  'PNG или SVG с прозрачным фоном. Шапка и подвал тёмные — надпись на логотипе должна быть светлой. Пусто — используется логотип из репозитория.',
              },
            },
            {
              name: 'accentColor',
              type: 'text',
              label: 'Акцентный цвет',
              defaultValue: DEFAULT_ACCENT,
              admin: {
                description:
                  'HEX, например #c9f24a. Приглушённый оттенок для светлых секций и цвет текста на кнопках считаются автоматически.',
                placeholder: DEFAULT_ACCENT,
              },
              validate: (value: string | null | undefined) => {
                if (!value) return true
                return normaliseHex(value) ? true : 'Ожидается HEX-цвет: #c9f24a, c9f24a или #cf4.'
              },
            },
          ],
        },
        {
          label: 'Первый экран',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              label: 'Название студии',
              required: true,
              defaultValue: 'Серая Мышь',
            },
            {
              name: 'heroHeading',
              type: 'text',
              label: 'Заголовок',
              required: true,
              defaultValue: 'Серая Мышь',
            },
            {
              name: 'heroSubheading',
              type: 'textarea',
              label: 'Подзаголовок',
              required: true,
              maxLength: 220,
              defaultValue: 'Тихо делаем заметные цифровые продукты.',
            },
            {
              name: 'heroNote',
              type: 'text',
              label: 'Строка под подзаголовком',
              maxLength: 160,
              admin: { description: 'Короткое уточнение. Необязательно.' },
            },
            {
              name: 'primaryCta',
              type: 'group',
              label: 'Основная кнопка',
              fields: [
                { name: 'label', type: 'text', label: 'Текст', defaultValue: 'Смотреть кейсы' },
                { name: 'href', type: 'text', label: 'Ссылка', defaultValue: '/cases' },
              ],
            },
            {
              name: 'secondaryCta',
              type: 'group',
              label: 'Вторая кнопка',
              fields: [
                { name: 'label', type: 'text', label: 'Текст', defaultValue: 'Обсудить проект' },
                { name: 'href', type: 'text', label: 'Ссылка', defaultValue: '/contact' },
              ],
            },
          ],
        },
        {
          label: 'О студии',
          fields: [
            {
              name: 'positioning',
              type: 'textarea',
              label: 'Позиционирование',
              maxLength: 600,
              defaultValue:
                'Небольшая студия, которая делает продукты внимательно и без лишнего шума: разбираемся в задаче, проектируем, пишем код и остаёмся рядом после запуска.',
            },
            {
              name: 'principles',
              type: 'array',
              label: 'Принципы работы',
              labels: { singular: 'Принцип', plural: 'Принципы' },
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', label: 'Название', required: true },
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Описание',
                  required: true,
                  maxLength: 320,
                },
              ],
            },
            {
              name: 'processSteps',
              type: 'array',
              label: 'Как работаем',
              labels: { singular: 'Шаг', plural: 'Шаги' },
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', label: 'Шаг', required: true },
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Описание',
                  required: true,
                  maxLength: 320,
                },
                {
                  name: 'duration',
                  type: 'text',
                  label: 'Срок',
                  admin: { description: 'Например: «1–2 недели».' },
                },
              ],
            },
          ],
        },
        {
          label: 'Контакты',
          fields: [
            {
              name: 'contactHeading',
              type: 'text',
              label: 'Заголовок блока контактов',
              defaultValue: 'Расскажите про задачу',
            },
            {
              name: 'contactText',
              type: 'textarea',
              label: 'Текст блока контактов',
              maxLength: 400,
              defaultValue:
                'Напишите пару предложений о продукте и о том, что нужно сделать. Ответим в течение рабочего дня.',
            },
            {
              name: 'email',
              type: 'email',
              label: 'Email',
              admin: { description: 'Пусто — блок email не показывается.' },
            },
            {
              name: 'telegram',
              type: 'text',
              label: 'Telegram',
              defaultValue: 'https://t.me/AAntonShch',
              admin: {
                description: 'Полный URL, например https://t.me/username. Пусто — не показывается.',
              },
            },
            {
              name: 'phone',
              type: 'text',
              label: 'Телефон',
              admin: { description: 'Пусто — не показывается.' },
            },
            {
              name: 'city',
              type: 'text',
              label: 'Город',
            },
            {
              name: 'socialLinks',
              type: 'array',
              label: 'Соцсети и площадки',
              labels: { singular: 'Ссылка', plural: 'Ссылки' },
              fields: [
                { name: 'label', type: 'text', label: 'Название', required: true },
                { name: 'url', type: 'text', label: 'URL', required: true },
              ],
            },
          ],
        },
        {
          label: 'Футер и право',
          fields: [
            {
              name: 'footerText',
              type: 'textarea',
              label: 'Текст в футере',
              maxLength: 300,
            },
            {
              name: 'legalName',
              type: 'text',
              label: 'Юридическое наименование',
              admin: { description: 'Показывается в футере рядом с годом. Необязательно.' },
            },
            {
              name: 'legalLinks',
              type: 'array',
              label: 'Правовые ссылки',
              labels: { singular: 'Ссылка', plural: 'Ссылки' },
              fields: [
                { name: 'label', type: 'text', label: 'Название', required: true },
                { name: 'url', type: 'text', label: 'URL', required: true },
              ],
            },
            {
              name: 'consentText',
              type: 'textarea',
              label: 'Текст согласия в форме',
              maxLength: 400,
              defaultValue:
                'Отправляя форму, вы соглашаетесь на обработку персональных данных для ответа на обращение.',
            },
          ],
        },
        {
          label: 'SEO и аналитика',
          fields: [
            seoField(),
            {
              name: 'organizationDescription',
              type: 'textarea',
              label: 'Описание организации для Schema.org',
              maxLength: 320,
            },
            {
              name: 'analytics',
              type: 'group',
              label: 'Аналитика',
              admin: {
                description:
                  'Идентификаторы можно задать здесь или переменными окружения. Пустые значения — скрипты не подключаются.',
              },
              fields: [{ name: 'yandexMetrikaId', type: 'text', label: 'Яндекс Метрика ID' }],
            },
          ],
        },
      ],
    },
  ],
}

import type { Field, FieldHook } from 'payload'

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

/**
 * Транслитерация нужна, чтобы slug оставался человекочитаемым латиницей:
 * кириллица в URL кодируется percent-encoding и плохо читается в выдаче.
 */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .split('')
    .map((char) => (char in CYRILLIC_MAP ? CYRILLIC_MAP[char] : char))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

const formatSlug =
  (sourceField: string): FieldHook =>
  ({ data, operation, originalDoc, value }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)

    const shouldDerive = operation === 'create' || !originalDoc?.slug
    if (!shouldDerive) return value

    const source = data?.[sourceField] ?? originalDoc?.[sourceField]
    return typeof source === 'string' && source.length > 0 ? slugify(source) : value
  }

type SlugFieldOptions = {
  sourceField?: string
  description?: string
}

export const slugField = ({
  sourceField = 'title',
  description = 'Часть адреса страницы. Заполняется автоматически из названия, можно изменить вручную.',
}: SlugFieldOptions = {}): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  label: 'Slug (адрес)',
  admin: {
    position: 'sidebar',
    description,
  },
  hooks: {
    beforeValidate: [formatSlug(sourceField)],
  },
  validate: (value: unknown) => {
    if (typeof value !== 'string' || value.length === 0) return 'Укажите slug'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return 'Только строчные латинские буквы, цифры и дефис'
    }
    return true
  },
})

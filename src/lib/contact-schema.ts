import { z } from 'zod'

/**
 * Схема заявки. Используется и клиентом (мгновенная подсказка), и сервером
 * (единственная реальная проверка — клиенту доверять нельзя).
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Укажите имя')
    .max(120, 'Слишком длинное имя'),
  contact: z
    .string()
    .trim()
    .min(3, 'Укажите email или Telegram')
    .max(160, 'Слишком длинное значение')
    .refine(
      (value) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value) || /^@?[\w.]{3,}$/.test(value),
      'Укажите корректный email или ник в Telegram',
    ),
  company: z.string().trim().max(160, 'Слишком длинное название').optional().or(z.literal('')),
  budget: z.string().trim().max(80).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, 'Расскажите про задачу хотя бы парой предложений')
    .max(4000, 'Сообщение слишком длинное'),
  consent: z.literal(true, { message: 'Без согласия мы не можем обработать заявку' }),
  // Ловушка для ботов: поле скрыто и должно остаться пустым.
  website: z.string().max(0, 'Заявка отклонена').optional().or(z.literal('')),
  // Метка времени отрисовки формы: мгновенная отправка — почти наверняка бот.
  renderedAt: z.coerce.number().int().nonnegative(),
})

export type ContactInput = z.input<typeof contactSchema>
export type ContactValues = z.output<typeof contactSchema>

export type ContactFieldName = 'name' | 'contact' | 'company' | 'budget' | 'message' | 'consent'

export type ContactActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors: Partial<Record<ContactFieldName, string>>
}

export const INITIAL_CONTACT_STATE: ContactActionState = {
  status: 'idle',
  message: '',
  fieldErrors: {},
}

/** Минимальное время заполнения формы человеком. */
export const MIN_FILL_MS = 2500

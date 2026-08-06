'use server'

import { headers } from 'next/headers'

import {
  contactSchema,
  MIN_FILL_MS,
  type ContactActionState,
  type ContactFieldName,
} from '@/lib/contact-schema'
import { getPayloadClient } from '@/lib/payload'
import { checkRateLimit } from '@/lib/rate-limit'

const GENERIC_ERROR = 'Не удалось отправить заявку. Попробуйте ещё раз или напишите на почту.'

/**
 * Порог частоты вынесен в окружение: студии может понадобиться его смягчить,
 * а прогон E2E не должен упираться в лимит предыдущего запуска.
 */
const RATE_LIMIT = Number(process.env.CONTACT_RATE_LIMIT ?? 5)
const RATE_WINDOW_MS = Number(process.env.CONTACT_RATE_WINDOW_MS ?? 10 * 60 * 1000)

export const submitEnquiry = async (
  _previous: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> => {
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  const { allowed, retryAfterSeconds } = checkRateLimit(`enquiry:${ip}`, {
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  })
  if (!allowed) {
    return {
      status: 'error',
      message: `Слишком много попыток. Повторите через ${Math.ceil(retryAfterSeconds / 60)} мин.`,
      fieldErrors: {},
    }
  }

  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    contact: formData.get('contact'),
    company: formData.get('company'),
    budget: formData.get('budget'),
    message: formData.get('message'),
    consent: formData.get('consent') === 'on' ? true : formData.get('consent'),
    website: formData.get('website'),
    renderedAt: formData.get('renderedAt'),
  })

  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactFieldName, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      // Honeypot и метку времени пользователю не показываем.
      if (field === 'website' || field === 'renderedAt') {
        return { status: 'error', message: GENERIC_ERROR, fieldErrors: {} }
      }
      if (typeof field === 'string' && !(field in fieldErrors)) {
        fieldErrors[field as ContactFieldName] = issue.message
      }
    }
    return { status: 'error', message: 'Проверьте отмеченные поля.', fieldErrors }
  }

  const values = parsed.data

  if (Date.now() - values.renderedAt < MIN_FILL_MS) {
    return { status: 'error', message: GENERIC_ERROR, fieldErrors: {} }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'enquiries',
      // Публичного доступа на создание нет — заявку создаёт только этот экшен.
      overrideAccess: true,
      data: {
        name: values.name,
        contact: values.contact,
        company: values.company || undefined,
        budget: values.budget || undefined,
        message: values.message,
        consent: true,
        status: 'new',
        meta: {
          sourcePage: headerList.get('referer') ?? undefined,
          userAgent: headerList.get('user-agent')?.slice(0, 250) ?? undefined,
        },
      },
    })

    await notifyByEmail(values.name, values.contact, values.message)

    return {
      status: 'success',
      message: 'Заявка отправлена. Ответим в течение рабочего дня.',
      fieldErrors: {},
    }
  } catch (error) {
    console.error('enquiry submit failed', error)
    return { status: 'error', message: GENERIC_ERROR, fieldErrors: {} }
  }
}

/** Письмо отправляется только если настроены и SMTP, и адрес получателя. */
const notifyByEmail = async (name: string, contact: string, message: string) => {
  const to = process.env.CONTACT_NOTIFY_EMAIL
  if (!to || !process.env.SMTP_HOST) return

  try {
    const payload = await getPayloadClient()
    await payload.sendEmail({
      to,
      subject: `Заявка с сайта: ${name}`,
      text: `Имя: ${name}\nКонтакт: ${contact}\n\n${message}`,
    })
  } catch (error) {
    // Заявка уже сохранена — сбой почты не должен ломать ответ пользователю.
    console.error('enquiry email failed', error)
  }
}

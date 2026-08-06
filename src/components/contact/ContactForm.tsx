'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { useFormStatus } from 'react-dom'

import { submitEnquiry } from '@/app/(frontend)/contact/actions'
import { Button } from '@/components/ui/Button'
import { INITIAL_CONTACT_STATE, type ContactFieldName } from '@/lib/contact-schema'

export const ContactForm = ({ consentText }: { consentText: string }) => {
  const [state, formAction] = useActionState(submitEnquiry, INITIAL_CONTACT_STATE)
  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const renderedAtRef = useRef<HTMLInputElement>(null)

  /*
    Метка времени отрисовки формы проставляется на клиенте прямо в поле:
    на сервере она закешировалась бы вместе со страницей, а состояние React
    здесь дало бы расхождение при гидратации.
  */
  useEffect(() => {
    if (renderedAtRef.current) renderedAtRef.current.value = String(Date.now())
  }, [])

  useEffect(() => {
    if (state.status === 'idle') return
    statusRef.current?.focus()
    if (state.status === 'success') formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-6">
      <input ref={renderedAtRef} type="hidden" name="renderedAt" defaultValue="0" />

      {/* Ловушка для ботов: скрыта визуально и от скринридеров, но заполняется автоматикой. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="website">Не заполняйте это поле</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field
        name="name"
        label="Как к вам обращаться"
        autoComplete="name"
        required
        error={state.fieldErrors.name}
      />
      <Field
        name="contact"
        label="Email или Telegram"
        autoComplete="email"
        required
        error={state.fieldErrors.contact}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="company" label="Компания" autoComplete="organization" error={state.fieldErrors.company} />
        <Field name="budget" label="Ориентир по бюджету" error={state.fieldErrors.budget} />
      </div>
      <Field
        name="message"
        label="Что нужно сделать"
        multiline
        required
        error={state.fieldErrors.message}
        hint="Пары предложений о продукте и задаче достаточно."
      />

      <ConsentField text={consentText} error={state.fieldErrors.consent} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        <p
          ref={statusRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className={`text-[0.875rem] outline-none ${
            state.status === 'error' ? 'text-[var(--gm-danger)]' : 'text-[var(--accent)]'
          }`}
        >
          {state.message}
        </p>
      </div>
    </form>
  )
}

const SubmitButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
      {pending ? 'Отправляем…' : 'Отправить заявку'}
    </Button>
  )
}

type FieldProps = {
  name: ContactFieldName
  label: string
  error?: string
  hint?: string
  required?: boolean
  multiline?: boolean
  autoComplete?: string
}

const Field = ({
  name,
  label,
  error,
  hint,
  required = false,
  multiline = false,
  autoComplete,
}: FieldProps) => {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  const shared = {
    id,
    name,
    required,
    autoComplete,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy || undefined,
    className:
      'w-full border-b border-[var(--border)] bg-transparent py-2.5 text-[1.0625rem] outline-none transition-colors duration-[var(--dur-quick)] focus:border-[var(--accent)] aria-[invalid=true]:border-[var(--gm-danger)]',
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="gm-eyebrow">
        {label}
        {required && <span className="text-[var(--accent)]"> *</span>}
      </label>
      {multiline ? <textarea rows={5} {...shared} /> : <input type="text" {...shared} />}
      {hint && (
        <p id={hintId} className="text-[0.8125rem] text-[var(--fg-subtle)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[0.8125rem] text-[var(--gm-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

const ConsentField = ({ text, error }: { text: string; error?: string }) => {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name="consent"
          type="checkbox"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--gm-signal)]"
        />
        <label htmlFor={id} className="text-[0.875rem] text-[var(--fg-muted)]">
          {text}
        </label>
      </div>
      {error && (
        <p id={errorId} className="text-[0.8125rem] text-[var(--gm-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

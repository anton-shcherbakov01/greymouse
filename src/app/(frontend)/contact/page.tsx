import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact/ContactForm'
import { TelegramBurrow } from '@/components/contact/TelegramBurrow'
import { BreadcrumbSchema } from '@/components/seo/StructuredData'
import { getSiteSettings } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Контакты',
  description: 'Напишите студии «Серая Мышь»: расскажите про продукт и задачу.',
  alternates: { canonical: absoluteUrl('/contact') },
}

const ContactPage = async () => {
  const settings = await getSiteSettings()

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Главная', path: '/' },
          { name: 'Контакты', path: '/contact' },
        ]}
      />

      <section className="gm-dark gm-section">
        <div className="gm-container">
          <p className="gm-eyebrow">Контакты</p>
          <h1 className="gm-heading-1 mt-4 max-w-[16ch]">
            {settings.contactHeading || 'Расскажите про задачу'}
          </h1>
          {settings.contactText && <p className="gm-lede mt-6">{settings.contactText}</p>}

          <div className="mt-[var(--space-block)] grid gap-[var(--space-block)] md:grid-cols-12 md:gap-[var(--grid-gap)]">
            <div className="md:col-span-6">
              <ContactForm
                consentText={
                  settings.consentText ||
                  'Отправляя форму, вы соглашаетесь на обработку персональных данных для ответа на обращение.'
                }
              />
            </div>

            <aside className="md:col-span-5 md:col-start-8">
              <h2 className="gm-eyebrow">Напрямую</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {settings.email && (
                  <li>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-[1.0625rem] underline decoration-[var(--accent)] underline-offset-4"
                    >
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings.telegram && (
                  <li className="pt-2">
                    <TelegramBurrow href={settings.telegram} />
                  </li>
                )}
                {settings.phone && (
                  <li>
                    <a
                      href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`}
                      className="text-[0.9375rem] text-[var(--fg-muted)]"
                    >
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.city && (
                  <li className="text-[0.9375rem] text-[var(--fg-subtle)]">{settings.city}</li>
                )}
              </ul>

              {!settings.email && !settings.telegram && !settings.phone && (
                <p className="mt-4 text-[0.875rem] text-[var(--fg-subtle)]">
                  Контакты пока не заполнены в CMS — используйте форму.
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

export default ContactPage

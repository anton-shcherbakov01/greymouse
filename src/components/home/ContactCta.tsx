import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import type { SiteSetting } from '@/payload-types'

export const ContactCta = ({ settings }: { settings: SiteSetting }) => (
  <section className="gm-dark gm-section">
    <div className="gm-container">
      <Reveal sweep className="border-t border-[var(--border)] pt-10">
        <div className="grid gap-8 md:grid-cols-12 md:gap-[var(--grid-gap)]">
          <div className="md:col-span-7">
            <h2 className="gm-heading-1 max-w-[14ch]">
              {settings.contactHeading || 'Расскажите про задачу'}
            </h2>
            {settings.contactText && (
              <p className="gm-lede mt-5">{settings.contactText}</p>
            )}
          </div>

          <div className="flex flex-col items-start gap-4 md:col-span-5 md:items-end md:justify-end">
            <ButtonLink href="/contact" variant="signal" size="lg">
              Обсудить проект
            </ButtonLink>
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="text-[1.0625rem] underline decoration-[var(--accent)] underline-offset-4"
              >
                {settings.email}
              </a>
            )}
            {settings.telegram && (
              <a
                href={settings.telegram}
                rel="noreferrer noopener"
                target="_blank"
                className="text-[0.9375rem] text-[var(--fg-muted)] underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
              >
                Telegram
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  </section>
)

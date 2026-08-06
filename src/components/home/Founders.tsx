import { MediaImage } from '@/components/ui/MediaImage'
import { Reveal } from '@/components/ui/Reveal'
import type { Team } from '@/payload-types'

type FoundersProps = {
  people: Team[]
  heading?: string
  eyebrow?: string
  /** На «О студии» показываем развёрнутый вариант с цитатой и ссылками. */
  extended?: boolean
}

export const Founders = ({
  people,
  heading = 'Кто это делает',
  eyebrow = 'Команда',
  extended = false,
}: FoundersProps) => {
  if (people.length === 0) return null

  return (
    <section className="gm-light gm-section">
      <div className="gm-container">
        <p className="gm-eyebrow">{eyebrow}</p>
        <h2 className="gm-heading-1 mt-3">{heading}</h2>

        <ul className="mt-[var(--space-block)] grid gap-x-[var(--grid-gap)] gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person, index) => (
            <Reveal as="li" key={person.id} index={index} className="group">
              <MediaImage
                media={person.photo}
                aspect="4 / 5"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                altOverride={`${person.name} — ${person.role}`}
                className="grayscale transition-[filter,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-[1.01] group-hover:grayscale-0 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />

              <h3 className="mt-5 text-[1.25rem] font-medium tracking-[var(--tracking-tight)]">
                {person.name}
              </h3>
              <p className="gm-eyebrow mt-1">{person.role}</p>

              {person.shortBio && (
                <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">{person.shortBio}</p>
              )}

              {extended && person.quote && (
                <blockquote className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-[0.9375rem] italic">
                  {person.quote}
                </blockquote>
              )}

              {extended && (person.links ?? []).length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                  {(person.links ?? []).map((link) => (
                    <li key={String(link.id ?? link.url)}>
                      <a
                        href={link.url}
                        rel="noreferrer noopener"
                        target="_blank"
                        className="font-mono text-[0.75rem] tracking-[0.05em] text-[var(--fg-muted)] uppercase underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

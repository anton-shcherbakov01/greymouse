import { CaseCard } from '@/components/cases/CaseCard'
import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import type { Case } from '@/payload-types'

export const FeaturedCases = ({ cases }: { cases: Case[] }) => {
  if (cases.length === 0) return null

  const [lead, ...rest] = cases

  return (
    <section className="gm-dark gm-section">
      <div className="gm-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="gm-eyebrow">Но следы остаются</p>
            <h2 className="gm-heading-1 mt-3">Кейсы</h2>
          </div>
          <ButtonLink href="/cases" variant="outline">
            Все кейсы
          </ButtonLink>
        </div>

        <div className="mt-[var(--space-block)] grid gap-x-[var(--grid-gap)] gap-y-14">
          {lead && (
            <Reveal>
              <CaseCard caseItem={lead} large />
            </Reveal>
          )}

          {rest.length > 0 && (
            <div className="grid gap-x-[var(--grid-gap)] gap-y-14 md:grid-cols-2">
              {rest.map((caseItem, index) => (
                <Reveal key={caseItem.id} index={index}>
                  <CaseCard caseItem={caseItem} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

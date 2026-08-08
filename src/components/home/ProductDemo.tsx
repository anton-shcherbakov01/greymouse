import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import type { SiteSetting } from '@/payload-types'

export const ProductDemo = ({ settings }: { settings: SiteSetting }) => {
  const showcase = settings.demoShowcase
  if (showcase?.enabled === false) return null

  const company = showcase?.companyName?.trim() || 'Вектор Трейд'
  const demoHref = `/demo/analytics?company=${encodeURIComponent(company)}`
  const previewHref = `${demoHref}&embed=1`

  return (
    <section className="gm-dark gm-section overflow-hidden" aria-labelledby="product-demo-title">
      <div className="gm-container">
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-[var(--grid-gap)]">
          <Reveal as="div" className="md:col-span-8">
            <p className="gm-eyebrow">{showcase?.eyebrow || 'Продуктовая лаборатория'}</p>
            <h2 id="product-demo-title" className="gm-heading-1 mt-3 max-w-[15ch]">
              {showcase?.title || 'Не картинка, а рабочий продукт.'}
            </h2>
          </Reveal>

          <Reveal as="div" index={1} className="md:col-span-4 md:pb-1">
            <p className="text-[1rem] leading-relaxed text-[var(--fg-muted)]">
              {showcase?.description ||
                'Интерактивный пульт собственника: выручка, воронка, команда и сделки под риском. Можно открыть и проверить прямо здесь.'}
            </p>
            <ButtonLink href={demoHref} className="mt-6" size="lg">
              {showcase?.ctaLabel || 'Открыть на весь экран'}
              <span aria-hidden="true">↗</span>
            </ButtonLink>
          </Reveal>
        </div>

        <Reveal as="div" index={2} className="mt-[var(--space-block)]">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[#101214] shadow-[0_32px_100px_rgba(0,0,0,0.38)]">
            <div className="flex h-11 items-center justify-between border-b border-white/10 px-4 text-[0.6875rem] text-white/45">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-[var(--accent)]" />
              </div>
              <span className="font-mono uppercase tracking-[0.14em]">Grey Mouse Analytics</span>
              <span className="hidden sm:inline">live demo</span>
            </div>
            <iframe
              className="block h-[640px] w-full bg-[#f2f3f2] sm:h-[700px] lg:h-[760px]"
              src={previewHref}
              title="Интерактивное демо Grey Mouse Analytics"
              loading="lazy"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.75rem] text-[var(--fg-subtle)]">
            <span>{showcase?.note || 'Демо-данные · интерфейс интерактивный'}</span>
            <span>Нажимайте на графики, фильтры и строки таблиц</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

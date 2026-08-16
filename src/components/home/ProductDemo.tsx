import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import type { SiteSetting } from '@/payload-types'

export const ProductDemo = ({ settings }: { settings: SiteSetting }) => {
  const showcase = settings.demoShowcase
  if (showcase?.enabled === false) return null

  const company = showcase?.companyName?.trim() || 'Вектор Трейд'
  const demoHref = `/demo/analytics?company=${encodeURIComponent(company)}`
  const previewHref = `${demoHref}&embed=1`

  /*
    Список «кому нужно» редактируется в админке как обычный текст: одна строка —
    один пункт. Массив полей ради пяти коротких фраз усложнил бы и админку,
    и схему базы.
  */
  const audience = (showcase?.audience ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <section className="gm-dark gm-section overflow-hidden" aria-labelledby="product-demo-title">
      <div className="gm-container">
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-[var(--grid-gap)]">
          <Reveal as="div" className="md:col-span-8">
            <p className="gm-eyebrow">{showcase?.eyebrow || 'Наш продукт'}</p>
            <h2 id="product-demo-title" className="gm-heading-1 mt-3 max-w-[15ch]">
              {showcase?.title || 'Не картинка, а рабочий продукт.'}
            </h2>
          </Reveal>

          <Reveal as="div" index={1} className="md:col-span-4 md:pb-1">
            <p className="text-[1rem] leading-relaxed text-[var(--fg-muted)]">
              {showcase?.description ||
                'Показывает, сколько заработали, где застряли сделки, кто из менеджеров тянет и какие клиенты вот-вот уйдут. Открывается прямо здесь — можно потыкать.'}
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
            <span>{showcase?.note || 'Данные вымышленные · всё можно нажимать'}</span>
            <span>Нажимайте на графики, фильтры и строки таблиц</span>
          </div>
        </Reveal>

        {audience.length > 0 && (
          <Reveal as="div" index={3} className="mt-[var(--space-block)]">
            <div className="grid gap-6 border-t border-[var(--border)] pt-8 md:grid-cols-12 md:gap-[var(--grid-gap)]">
              <h3 className="gm-heading-3 md:col-span-4">
                {showcase?.audienceTitle || 'Кому это нужно'}
              </h3>
              <ul className="flex flex-wrap gap-2 md:col-span-8">
                {audience.map((item) => (
                  <li
                    key={item}
                    className="rounded-[var(--radius-pill)] border border-[var(--border)] px-4 py-2 text-[0.9375rem] text-[var(--fg-muted)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

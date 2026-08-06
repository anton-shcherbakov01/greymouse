import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Страница не найдена',
  robots: { index: false, follow: false },
}

const NotFound = () => (
  <section className="gm-dark gm-section flex min-h-[70svh] items-center">
    <div className="gm-container">
      <p className="gm-eyebrow">Ошибка 404</p>
      <h1 className="gm-heading-1 mt-4 max-w-[16ch]">Такой страницы нет</h1>
      <p className="gm-lede mt-6">
        Возможно, кейс сняли с публикации или в адресе опечатка.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/" variant="signal" size="lg">
          На главную
        </ButtonLink>
        <ButtonLink href="/cases" variant="outline" size="lg">
          Смотреть кейсы
        </ButtonLink>
      </div>
    </div>
  </section>
)

export default NotFound

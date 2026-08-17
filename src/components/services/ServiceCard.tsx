import Link from 'next/link'

import { ServiceIcon } from '@/components/ui/ServiceIcon'
import type { Service } from '@/payload-types'

type ServiceCardProps = {
  service: Service
  index: number
  href: string
  /** Подпись действия внизу карточки. */
  action?: string
}

/**
 * Карточка услуги для сетки.
 *
 * Верхняя часть — не фотография: у услуг нет изображений, а стоковые картинки
 * противоречили бы всему остальному оформлению. Вместо них схематичная панель
 * из знака услуги, номера и тонкой сетки — она даёт карточке вес и не
 * притворяется тем, чего нет.
 */
export const ServiceCard = ({ service, index, href, action = 'Подробнее' }: ServiceCardProps) => {
  const scope = (service.scope ?? [])
    .map((item) => item.text)
    .filter(Boolean)
    .slice(0, 3)

  return (
    <Link href={href} className="gm-service-card group">
      <span className="gm-service-card__panel" aria-hidden="true">
        <span className="gm-service-card__grid" />
        <ServiceIcon name={service.icon} className="gm-service-card__icon" />
        <span className="gm-service-card__index">{String(index + 1).padStart(2, '0')}</span>
      </span>

      <span className="gm-service-card__body">
        <span className="gm-service-card__title">{service.title}</span>
        <span className="gm-service-card__promise">{service.promise}</span>

        {scope.length > 0 && (
          <span className="gm-service-card__scope">
            {scope.map((item) => (
              <span key={item} className="gm-service-card__scope-item">
                {item}
              </span>
            ))}
          </span>
        )}

        <span className="gm-service-card__action">
          {action}
          <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  )
}

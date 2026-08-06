import type { Service } from '@/payload-types'

export type ServiceStage = NonNullable<Service['stage']>

export const STAGE_ORDER: ServiceStage[] = ['research', 'design', 'development', 'growth', 'ai']

export const STAGE_LABELS: Record<ServiceStage, string> = {
  research: 'Исследование и стратегия',
  design: 'UX/UI и дизайн',
  development: 'Разработка',
  growth: 'Запуск и развитие',
  ai: 'AI и автоматизация',
}

/**
 * Группировка услуг по этапам жизненного цикла проекта.
 * Пустые этапы не возвращаются — пустых секций на странице быть не должно.
 */
export const groupServicesByStage = (services: Service[]): Array<[ServiceStage, Service[]]> =>
  STAGE_ORDER.map(
    (stage) => [stage, services.filter((service) => service.stage === stage)] as const,
  ).filter((entry): entry is [ServiceStage, Service[]] => entry[1].length > 0)

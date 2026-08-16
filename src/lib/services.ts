import type { Service } from '@/payload-types'

/**
 * Порядок услуг на сайте.
 *
 * Раньше услуги группировались по этапам жизненного цикла продукта, и каждый
 * этап становился отдельной секцией. На практике этапов оказывалось больше,
 * чем услуг: секция на одну карточку читалась как «здесь всё», и наличие
 * остальных пунктов было неочевидно. Теперь порядок задаётся только полем
 * «Порядок» в админке, а на странице услуги стоят сеткой — видно все сразу.
 */
export const sortServices = (services: Service[]): Service[] =>
  [...services].sort((a, b) => {
    const orderA = a.sortOrder ?? 100
    const orderB = b.sortOrder ?? 100
    if (orderA !== orderB) return orderA - orderB
    return (a.title ?? '').localeCompare(b.title ?? '', 'ru')
  })

/**
 * Адреса получателей заявок. Задаются переменной `CONTACT_NOTIFY_EMAIL`, можно
 * перечислить несколько через запятую или точку с запятой — пока у студии нет
 * своего ящика, письма идут на личные, а потом список меняется без правки кода.
 *
 * Эти адреса нигде не показываются на сайте: публичный контакт — отдельное поле
 * «Email» в настройках сайта.
 */
export const parseNotifyRecipients = (raw: string | undefined): string[] => {
  if (!raw) return []
  const seen = new Set<string>()
  return raw
    .split(/[,;]/)
    .map((value) => value.trim())
    .filter((value) => {
      if (!value.includes('@')) return false
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

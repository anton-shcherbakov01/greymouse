/**
 * «Норка» для Telegram: тёмный арочный проём, из которого при наведении
 * выходит значок. Тот же приём, что у карточек кейсов, — снаружи тихо,
 * внутри есть что найти.
 *
 * Всё держится на CSS: серверный компонент, без JavaScript. На устройствах без
 * наведения (телефон, планшет) значок и подпись видны сразу — правило вынесено
 * в `globals.css` под `@media (hover: hover)`, иначе на тапе норка осталась бы
 * пустой.
 */

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? 'h-7 w-7'}>
    <path
      fill="currentColor"
      d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6L18.4 7c.4-.3-.1-.5-.6-.2L7.4 13.3l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.2 1.6Z"
    />
  </svg>
)

export const TelegramBurrow = ({ href }: { href: string }) => (
  <a
    href={href}
    rel="noreferrer noopener"
    target="_blank"
    className="gm-burrow group"
    aria-label="Написать в Telegram"
  >
    <span className="gm-burrow__mouth" aria-hidden="true" />
    <span className="gm-burrow__icon">
      <TelegramIcon />
    </span>
    <span className="gm-burrow__label">Telegram</span>
  </a>
)

export { TelegramIcon }

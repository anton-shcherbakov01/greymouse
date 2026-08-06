type WordmarkProps = {
  className?: string
  /** Только знак, без названия — для компактных мест. */
  markOnly?: boolean
}

/**
 * Знак студии: графитовый овал с сигнальной чертой внутри —
 * силуэт-намёк, а не буквальная мышь.
 */
export const Wordmark = ({ className, markOnly = false }: WordmarkProps) => (
  <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <circle cx="9" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <circle cx="19" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path
        d="M4.5 18.5c0-4.2 4.25-6.5 9.5-6.5s9.5 2.3 9.5 6.5c0 3.6-4.25 5.5-9.5 5.5s-9.5-1.9-9.5-5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M9.5 18.5h9" stroke="var(--gm-signal)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    {!markOnly && (
      <span
        className="font-display text-[0.95rem] font-medium tracking-[-0.01em] whitespace-nowrap"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Серая Мышь
      </span>
    )}
  </span>
)

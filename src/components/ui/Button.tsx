import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'signal' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium leading-none transition-[transform,background-color,color,border-color] duration-[var(--dur-quick)] ease-[var(--ease-out)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  signal:
    'bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--gm-signal)] hover:-translate-y-0.5',
  outline:
    'border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] hover:-translate-y-0.5',
  ghost: 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[0.9375rem] rounded-[var(--radius-md)]',
  lg: 'h-13 px-7 text-base rounded-[var(--radius-md)]',
}

type CommonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

const composeClassName = ({ variant = 'signal', size = 'md', className }: CommonProps) =>
  [base, variants[variant], sizes[size], className].filter(Boolean).join(' ')

export const Button = ({
  variant,
  size,
  className,
  children,
  ...rest
}: CommonProps & Omit<ComponentProps<'button'>, 'className' | 'children'>) => (
  <button className={composeClassName({ variant, size, className, children })} {...rest}>
    {children}
  </button>
)

export const ButtonLink = ({
  variant,
  size,
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    'className' | 'children' | 'href'
  >) => {
  const isExternal = /^https?:\/\//.test(href)
  const classes = composeClassName({ variant, size, className, children })

  if (isExternal) {
    return (
      <a className={classes} href={href} rel="noreferrer noopener" target="_blank">
        {children}
      </a>
    )
  }

  return (
    <Link className={classes} href={href} {...rest}>
      {children}
    </Link>
  )
}

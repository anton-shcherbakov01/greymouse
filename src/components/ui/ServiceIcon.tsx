import type { Service } from '@/payload-types'

type IconName = NonNullable<Service['icon']>

const PATHS: Record<IconName, React.ReactNode> = {
  signal: (
    <>
      <path d="M2 12h3l2.5-7 4 14 2.5-7H18" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="6" height="6" />
      <rect x="11" y="3" width="6" height="6" />
      <rect x="3" y="11" width="6" height="6" />
      <rect x="11" y="11" width="6" height="6" />
    </>
  ),
  layers: (
    <>
      <path d="M10 2 2.5 6 10 10l7.5-4L10 2Z" />
      <path d="M2.5 10.5 10 14.5l7.5-4" />
      <path d="M2.5 14.5 10 18.5l7.5-4" />
    </>
  ),
  path: (
    <>
      <path d="M3 16c4 0 4-12 8-12s6 6 6 12" />
      <circle cx="3" cy="16" r="1.6" />
      <circle cx="17" cy="16" r="1.6" />
    </>
  ),
  core: (
    <>
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3" />
    </>
  ),
}

export const ServiceIcon = ({
  name,
  className,
}: {
  name?: IconName | null
  className?: string
}) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {PATHS[name ?? 'signal']}
  </svg>
)

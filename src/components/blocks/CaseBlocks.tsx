import Link from 'next/link'

import { MediaImage, resolveMedia } from '@/components/ui/MediaImage'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/blocks/RichText'
import type { Case } from '@/payload-types'

import { CaseVideo } from './CaseVideo'

type Block = NonNullable<Case['contentBlocks']>[number]

/**
 * Рендер свободных блоков страницы кейса.
 * Каждый блок сам решает, отрисовываться ли: пустое поле в CMS
 * не должно превращаться в пустой блок на странице.
 */
export const CaseBlocks = ({ blocks }: { blocks?: Case['contentBlocks'] }) => {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="flex flex-col gap-[var(--space-block)]">
      {blocks.map((block, index) => (
        <BlockRenderer key={String(block.id ?? index)} block={block} index={index} />
      ))}
    </div>
  )
}

const BlockRenderer = ({ block, index }: { block: Block; index: number }) => {
  switch (block.blockType) {
    case 'richText':
      return (
        <Reveal className="gm-container" index={index}>
          {block.eyebrow && <p className="gm-eyebrow">{block.eyebrow}</p>}
          {block.heading && <h2 className="gm-heading-2 mt-3 mb-6">{block.heading}</h2>}
          <RichText
            data={block.content}
            className={block.width === 'wide' ? 'max-w-none' : undefined}
          />
        </Reveal>
      )

    case 'fullWidthImage': {
      const caption = block.caption
      return (
        <Reveal index={index} className={block.bleed ? '' : 'gm-container'}>
          <figure>
            <MediaImage
              media={block.image}
              aspect="16 / 9"
              sizes={block.bleed ? '100vw' : '(max-width: 1440px) 100vw, 1440px'}
            />
            {caption && <Caption>{caption}</Caption>}
          </figure>
        </Reveal>
      )
    }

    case 'imagePair': {
      const columns =
        block.ratio === 'left'
          ? 'md:grid-cols-[1.6fr_1fr]'
          : block.ratio === 'right'
            ? 'md:grid-cols-[1fr_1.6fr]'
            : 'md:grid-cols-2'
      return (
        <Reveal index={index} className="gm-container">
          <figure>
            <div className={`grid gap-[var(--grid-gap)] ${columns}`}>
              <MediaImage media={block.left} aspect="4 / 3" sizes="(max-width: 768px) 100vw, 45vw" />
              <MediaImage
                media={block.right}
                aspect="4 / 3"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
            {block.caption && <Caption>{block.caption}</Caption>}
          </figure>
        </Reveal>
      )
    }

    case 'gallery': {
      const items = block.items ?? []
      if (items.length === 0) return null
      return (
        <Reveal index={index} className="gm-container">
          {block.heading && <h2 className="gm-heading-3 mb-6">{block.heading}</h2>}
          <ul
            className={`grid gap-[var(--grid-gap)] ${
              block.columns === '3' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'
            }`}
          >
            {items.map((item, itemIndex) => (
              <li key={String(item.id ?? itemIndex)}>
                <figure>
                  <MediaImage
                    media={item.image}
                    aspect="4 / 3"
                    sizes={
                      block.columns === '3'
                        ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        : '(max-width: 640px) 100vw, 50vw'
                    }
                  />
                  {item.caption && <Caption>{item.caption}</Caption>}
                </figure>
              </li>
            ))}
          </ul>
        </Reveal>
      )
    }

    case 'video': {
      const video = resolveMedia(block.video)
      const poster = resolveMedia(block.poster)
      if (!video?.url || !poster?.url) return null
      return (
        <Reveal index={index} className="gm-container">
          <figure>
            <CaseVideo
              src={video.url}
              poster={poster.url}
              autoplay={Boolean(block.autoplay)}
              width={poster.width ?? 1600}
              height={poster.height ?? 900}
            />
            {block.caption && <Caption>{block.caption}</Caption>}
          </figure>
        </Reveal>
      )
    }

    case 'quote':
      return (
        <Reveal index={index} className="gm-container">
          <blockquote className="mx-auto max-w-[38ch] border-l-2 border-[var(--accent)] pl-6">
            <p className="gm-heading-3 text-balance">«{block.quote}»</p>
            {(block.author || block.authorRole) && (
              <footer className="mt-4 text-[0.875rem] text-[var(--fg-muted)]">
                {block.author}
                {block.authorRole ? `, ${block.authorRole}` : ''}
              </footer>
            )}
          </blockquote>
        </Reveal>
      )

    case 'metricGrid': {
      const metrics = block.metrics ?? []
      if (metrics.length === 0) return null
      return (
        <Reveal index={index} className="gm-container">
          {block.heading && <h2 className="gm-heading-3 mb-8">{block.heading}</h2>}
          <ul className="grid gap-x-[var(--grid-gap)] gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, metricIndex) => (
              <li
                key={String(metric.id ?? metricIndex)}
                className="border-t border-[var(--border)] pt-5"
              >
                <p className="text-[clamp(2rem,3.5vw,3rem)] leading-none tracking-[var(--tracking-display)] tabular-nums">
                  {metric.value}
                </p>
                <p className="mt-3 text-[0.9375rem]">{metric.label}</p>
                {metric.source && (
                  <p className="mt-1 font-mono text-[0.6875rem] text-[var(--fg-subtle)]">
                    {metric.source}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      )
    }

    case 'textMedia':
      return (
        <Reveal index={index} className="gm-container">
          <div
            className={`grid items-center gap-[var(--grid-gap)] md:grid-cols-2 ${
              block.mediaPosition === 'left' ? 'md:[&>*:first-child]:order-2' : ''
            }`}
          >
            <div>
              {block.eyebrow && <p className="gm-eyebrow">{block.eyebrow}</p>}
              {block.heading && <h2 className="gm-heading-3 mt-3 mb-5">{block.heading}</h2>}
              <RichText data={block.content} />
            </div>
            <MediaImage media={block.media} aspect="4 / 3" sizes="(max-width: 768px) 100vw, 45vw" />
          </div>
        </Reveal>
      )

    case 'stickyText': {
      const steps = block.steps ?? []
      if (steps.length === 0) return null
      return (
        <div className="gm-container" key={String(block.id)}>
          <div className="grid gap-10 md:grid-cols-12 md:gap-[var(--grid-gap)]">
            {/* Липкая колонка — нативный position: sticky, без JS. */}
            <div className="md:col-span-4">
              <div className="md:sticky md:top-[calc(var(--header-height)+2rem)]">
                <h2 className="gm-heading-2">{block.heading}</h2>
                {block.intro && (
                  <p className="mt-4 text-[0.9375rem] text-[var(--fg-muted)]">{block.intro}</p>
                )}
              </div>
            </div>

            <ol className="md:col-span-8">
              {steps.map((step, stepIndex) => (
                <Reveal
                  as="li"
                  key={String(step.id ?? stepIndex)}
                  index={stepIndex}
                  className="border-t border-[var(--border)] py-8 last:border-b"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[0.8125rem] text-[var(--accent)] tabular-nums">
                      {String(stepIndex + 1).padStart(2, '0')}
                    </span>
                    <h3 className="gm-heading-3">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">{step.text}</p>
                  {step.image && (
                    <MediaImage
                      media={step.image}
                      aspect="16 / 9"
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="mt-6"
                    />
                  )}
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      )
    }

    case 'nextCase': {
      const next = block.case
      if (!next || typeof next !== 'object') return null
      return (
        <Reveal index={index} className="gm-container">
          <Link href={`/cases/${next.slug}`} className="group block border-t border-[var(--border)] pt-8">
            <p className="gm-eyebrow">{block.label || 'Следующий проект'}</p>
            <h2 className="gm-heading-1 mt-3 group-hover:text-[var(--accent)]">{next.title}</h2>
          </Link>
        </Reveal>
      )
    }

    default:
      return null
  }
}

const Caption = ({ children }: { children: React.ReactNode }) => (
  <figcaption className="gm-container mt-3 font-mono text-[0.75rem] text-[var(--fg-subtle)]">
    {children}
  </figcaption>
)

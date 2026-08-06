import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type RichTextProps = {
  data: unknown
  className?: string
}

/**
 * Обёртка над рендерером Lexical.
 * Санитизация не нужна на выходе: Payload хранит структурированный AST,
 * а не сырой HTML, и рендерер строит React-узлы, а не dangerouslySetInnerHTML.
 */
export const RichText = ({ data, className }: RichTextProps) => {
  if (!data || typeof data !== 'object') return null

  return (
    <LexicalRichText
      data={data as SerializedEditorState}
      className={['gm-prose', className].filter(Boolean).join(' ')}
    />
  )
}

/** Есть ли в поле реальный текст — чтобы не рендерить пустые секции. */
export const hasRichTextContent = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false
  const root = (data as { root?: { children?: unknown[] } }).root
  if (!root?.children || root.children.length === 0) return false

  const collectText = (nodes: unknown[]): string =>
    nodes
      .map((node) => {
        if (!node || typeof node !== 'object') return ''
        const typed = node as { text?: string; children?: unknown[]; type?: string }
        if (typed.type === 'upload' || typed.type === 'horizontalrule') return 'x'
        if (typeof typed.text === 'string') return typed.text
        return Array.isArray(typed.children) ? collectText(typed.children) : ''
      })
      .join('')

  return collectText(root.children).trim().length > 0
}

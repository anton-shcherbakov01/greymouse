'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], select, summary'
/*
  Над обычным текстом системная каретка полезнее точки: по ней видно, что текст
  можно выделить. Поэтому здесь не только поля ввода, но и абзацы, заголовки и
  списки — над ними точка прячется, а CSS возвращает `cursor: text`.
*/
const TEXT_SELECTOR =
  'input, textarea, [contenteditable="true"], p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, dd, dt, td, th, label'

/**
 * Небольшая сигнальная точка с серым хвостом — десктопная часть айдентики.
 * На touch-устройствах и при reduced motion остаётся системный указатель.
 */
export const MouseTrailCursor = () => {
  const dotRef = useRef<HTMLSpanElement>(null)
  const tailRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    const dot = dotRef.current
    const tail = tailRef.current
    if (!dot || !tail) return

    document.body.classList.add('gm-custom-cursor')

    let targetX = -100
    let targetY = -100
    let tailX = -100
    let tailY = -100
    let length = 0
    let angle = 0
    let frame = 0

    /*
      Хвост крепится к самой точке и растёт назад по направлению движения:
      раньше он рисовался в отстающей позиции и «отрывался» от точки, из-за
      чего казался болтающимся отдельно.

      Длина и угол сглаживаются отдельно от позиции. Угол пересчитывается
      только при заметном смещении: на почти остановившемся курсоре atan2
      скачет от шума и хвост дёргается.
    */
    const draw = () => {
      tailX += (targetX - tailX) * 0.16
      tailY += (targetY - tailY) * 0.16

      const dx = targetX - tailX
      const dy = targetY - tailY
      const distance = Math.hypot(dx, dy)

      if (distance > 0.6) {
        // Направление «назад»: от точки к отстающей позиции.
        const next = Math.atan2(-dy, -dx) * (180 / Math.PI)
        const delta = ((next - angle + 540) % 360) - 180
        angle += delta * 0.35
      }

      length += (Math.min(34, distance * 1.6) - length) * 0.2

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      tail.style.width = `${length.toFixed(2)}px`
      tail.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) rotate(${angle.toFixed(2)}deg)`
      frame = requestAnimationFrame(draw)
    }

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      dot.dataset.visible = 'true'
      tail.dataset.visible = 'true'
    }
    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      // Интерактивное важнее текстового: у ссылки внутри абзаца должна быть
      // точка, а не каретка.
      const isInteractive = Boolean(target?.closest(INTERACTIVE_SELECTOR))
      const isText = !isInteractive && Boolean(target?.closest(TEXT_SELECTOR))
      dot.dataset.hidden = String(isText)
      tail.dataset.hidden = String(isText)
      dot.dataset.interactive = String(isInteractive)
    }
    const onLeave = () => {
      dot.dataset.visible = 'false'
      tail.dataset.visible = 'false'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.body.classList.remove('gm-custom-cursor')
    }
  }, [])

  return (
    <>
      <span ref={tailRef} className="gm-cursor-tail" aria-hidden="true" />
      <span ref={dotRef} className="gm-cursor-dot" aria-hidden="true" />
    </>
  )
}

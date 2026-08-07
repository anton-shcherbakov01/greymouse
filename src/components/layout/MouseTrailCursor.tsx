'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, summary'
const TEXT_SELECTOR = 'input, textarea, [contenteditable="true"]'

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
    let frame = 0

    const draw = () => {
      tailX += (targetX - tailX) * 0.18
      tailY += (targetY - tailY) * 0.18
      const dx = targetX - tailX
      const dy = targetY - tailY
      const length = Math.min(30, Math.max(12, Math.hypot(dx, dy) * 1.8))
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      tail.style.width = `${length}px`
      tail.style.transform = `translate3d(${tailX}px, ${tailY}px, 0) rotate(${angle}deg)`
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
      const isText = Boolean(target?.closest(TEXT_SELECTOR))
      dot.dataset.hidden = String(isText)
      tail.dataset.hidden = String(isText)
      dot.dataset.interactive = String(Boolean(target?.closest(INTERACTIVE_SELECTOR)) && !isText)
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

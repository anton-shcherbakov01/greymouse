'use client'

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], select, summary'
const FIELD_SELECTOR = 'input, textarea, [contenteditable="true"]'

/** Число звеньев хвоста. Больше — плавнее изгиб и дороже кадр. */
const JOINTS = 12
/** Насколько быстро каждое звено догоняет предыдущее. */
const FOLLOW = 0.42

/**
 * Небольшая сигнальная точка с гибким хвостом — десктопная часть айдентики.
 * На touch-устройствах и при reduced motion остаётся системный указатель.
 *
 * Хвост — цепочка звеньев: каждое догоняет предыдущее, поэтому на повороте он
 * изгибается, а не остаётся отрезком. Рисуется одним SVG-путём по средним
 * точкам — так линия получается гладкой без изломов на стыках.
 */
export const MouseTrailCursor = () => {
  const dotRef = useRef<HTMLSpanElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    const dot = dotRef.current
    const path = pathRef.current
    if (!dot || !path) return

    const root = document.documentElement
    document.body.classList.add('gm-custom-cursor')

    let pointerX = -100
    let pointerY = -100
    let visible = false
    let overText = false
    let frame = 0

    const joints = Array.from({ length: JOINTS }, () => ({ x: -100, y: -100 }))

    /**
     * Точное определение текста под курсором.
     *
     * Правило `cursor: text` на абзацах и заголовках не годится: блок занимает
     * всю ширину колонки, и каретка появлялась в пустоте справа от короткого
     * заголовка. Здесь проверяется, что точка попала именно в прямоугольник
     * строки текстового узла.
     */
    const isOverText = (x: number, y: number): boolean => {
      const doc = document as Document & {
        caretRangeFromPoint?: (x: number, y: number) => Range | null
      }
      const node = doc.caretRangeFromPoint?.(x, y)?.startContainer
      if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false

      const range = document.createRange()
      range.selectNodeContents(node)
      return Array.from(range.getClientRects()).some(
        (rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom,
      )
    }

    const setOverText = (next: boolean) => {
      if (next === overText) return
      overText = next
      root.classList.toggle('gm-cursor-over-text', next)
      dot.dataset.hidden = String(next)
      path.dataset.hidden = String(next)
    }

    const draw = () => {
      const head = joints[0]!
      head.x += (pointerX - head.x) * 0.55
      head.y += (pointerY - head.y) * 0.55

      for (let i = 1; i < joints.length; i += 1) {
        const previous = joints[i - 1]!
        const current = joints[i]!
        current.x += (previous.x - current.x) * FOLLOW
        current.y += (previous.y - current.y) * FOLLOW
      }

      // Путь по средним точкам: каждое звено становится опорной точкой
      // квадратичной кривой, стыки получаются без изломов.
      let d = `M ${head.x.toFixed(1)} ${head.y.toFixed(1)}`
      for (let i = 1; i < joints.length - 1; i += 1) {
        const current = joints[i]!
        const next = joints[i + 1]!
        d += ` Q ${current.x.toFixed(1)} ${current.y.toFixed(1)} ${((current.x + next.x) / 2).toFixed(1)} ${((current.y + next.y) / 2).toFixed(1)}`
      }

      path.setAttribute('d', d)
      dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
      frame = requestAnimationFrame(draw)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointerX = event.clientX
      pointerY = event.clientY

      if (!visible) {
        visible = true
        // Хвост при первом появлении собирается в точке, иначе он прилетает
        // через весь экран из стартовой позиции.
        joints.forEach((joint) => {
          joint.x = pointerX
          joint.y = pointerY
        })
        dot.dataset.visible = 'true'
        path.dataset.visible = 'true'
      }

      const target = event.target instanceof Element ? event.target : null
      const interactive = Boolean(target?.closest(INTERACTIVE_SELECTOR))
      dot.dataset.interactive = String(interactive)
      setOverText(
        !interactive &&
          (Boolean(target?.closest(FIELD_SELECTOR)) || isOverText(pointerX, pointerY)),
      )
    }

    const onLeave = () => {
      visible = false
      dot.dataset.visible = 'false'
      path.dataset.visible = 'false'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('mouseleave', onLeave)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      root.removeEventListener('mouseleave', onLeave)
      root.classList.remove('gm-cursor-over-text')
      document.body.classList.remove('gm-custom-cursor')
    }
  }, [])

  return (
    <>
      <svg className="gm-cursor-trail" aria-hidden="true">
        <path ref={pathRef} data-visible="false" />
      </svg>
      <span ref={dotRef} className="gm-cursor-dot" aria-hidden="true" />
    </>
  )
}

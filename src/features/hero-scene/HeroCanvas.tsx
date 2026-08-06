'use client'

import { useEffect, useRef, useState } from 'react'

import type { GreySignalScene } from './GreySignalScene'

/**
 * Обёртка сцены. Отвечает за то, чего не должна знать сама сцена:
 * когда её запускать, когда останавливать и когда не запускать вовсе.
 *
 * Компонент рисует только canvas. Постер и градиент отрисованы сервером
 * в `Hero`, поэтому первый экран выглядит законченным ещё до загрузки бандла.
 * Canvas декоративен (`aria-hidden` + `role="presentation"`): вся смысловая
 * информация лежит в обычном HTML.
 */
export const HeroCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Компонент грузится только на клиенте (ssr: false), поэтому поддержку
  // WebGL и класс устройства можно проверить прямо в инициализаторе.
  const [skip] = useState(() => !supportsWebgl() || isLowEndDevice())
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || skip) return

    let cancelled = false
    let scene: GreySignalScene | null = null
    const cleanups: Array<() => void> = []

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const load = async () => {
      try {
        const { GreySignalScene: SceneClass } = await import('./GreySignalScene')
        if (cancelled) return

        scene = new SceneClass({ canvas, reducedMotion })
        scene.onContextLostCallback = () => setVisible(false)

        const applySize = () => {
          const rect = container.getBoundingClientRect()
          scene?.resize(rect.width, rect.height)
        }
        applySize()

        const resizeObserver = new ResizeObserver(applySize)
        resizeObserver.observe(container)
        cleanups.push(() => resizeObserver.disconnect())

        if (reducedMotion) {
          scene.renderStatic()
          setVisible(true)
          return
        }

        // Пауза, когда сцена вне вьюпорта.
        const visibility = new IntersectionObserver(
          ([entry]) => {
            if (!entry) return
            if (entry.isIntersecting && !document.hidden) scene?.start()
            else scene?.stop()
          },
          { threshold: 0 },
        )
        visibility.observe(container)
        cleanups.push(() => visibility.disconnect())

        // Пауза, когда вкладка скрыта.
        const onVisibilityChange = () => {
          if (document.hidden) scene?.stop()
          else if (isInViewport(container)) scene?.start()
        }
        document.addEventListener('visibilitychange', onVisibilityChange)
        cleanups.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))

        const onPointerMove = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return
          const x = (event.clientX / window.innerWidth) * 2 - 1
          const y = -((event.clientY / window.innerHeight) * 2 - 1)
          scene?.setPointer(x, y)
        }
        window.addEventListener('pointermove', onPointerMove, { passive: true })
        cleanups.push(() => window.removeEventListener('pointermove', onPointerMove))

        let scrollTicking = false
        const onScroll = () => {
          if (scrollTicking) return
          scrollTicking = true
          requestAnimationFrame(() => {
            const rect = container.getBoundingClientRect()
            const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1)
            scene?.setScrollProgress(progress)
            scrollTicking = false
          })
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        cleanups.push(() => window.removeEventListener('scroll', onScroll))

        scene.start()
        setVisible(true)
      } catch {
        if (!cancelled) setVisible(false)
      }
    }

    /*
      Сцена запускается строго после события load и следующего простоя:
      разбор и компиляция three.js на слабом процессоре занимают сотни
      миллисекунд и не должны попадать в измерение LCP.
    */
    const useIdleCallback = 'requestIdleCallback' in window
    let idleHandle = 0
    const scheduleLoad = () => {
      idleHandle = useIdleCallback
        ? window.requestIdleCallback(() => void load(), { timeout: 2500 })
        : window.setTimeout(() => void load(), 400)
    }

    if (document.readyState === 'complete') {
      scheduleLoad()
    } else {
      window.addEventListener('load', scheduleLoad, { once: true })
      cleanups.push(() => window.removeEventListener('load', scheduleLoad))
    }

    return () => {
      cancelled = true
      if (useIdleCallback) window.cancelIdleCallback(idleHandle)
      else window.clearTimeout(idleHandle)
      cleanups.forEach((fn) => fn())
      scene?.dispose()
    }
  }, [skip])

  if (skip) return null

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <canvas
        ref={canvasRef}
        role="presentation"
        className="absolute inset-0 h-full w-full transition-opacity duration-700 ease-[var(--ease-out)] motion-reduce:transition-none"
        style={{ opacity: visible ? 1 : 0 }}
      />
    </div>
  )
}

const supportsWebgl = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Порог, ниже которого сцена не запускается вовсе — остаётся постер.
 *
 * На touch-устройствах планка выше: там нет наведения курсора (то есть теряется
 * половина смысла сцены), зато есть цена в виде разбора three.js и постоянной
 * работы GPU. Поэтому на телефонах сцена включается только на достаточно
 * мощных устройствах, а на остальных виден постер — он отрисован из этой же
 * сцены и несёт тот же образ.
 */
const isLowEndDevice = (): boolean => {
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const isTouch = window.matchMedia('(pointer: coarse)').matches

  if (typeof memory === 'number' && memory <= 2) return true
  if (isTouch) return cores < 6 || (typeof memory === 'number' && memory < 4)
  return cores <= 2
}

const isInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight
}

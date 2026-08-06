'use client'

import { useEffect, useRef } from 'react'

type CaseVideoProps = {
  src: string
  poster: string
  autoplay: boolean
  width: number
  height: number
}

/**
 * Видео с постером и без автозапуска за пределами экрана.
 * При prefers-reduced-motion автозапуск не включается вовсе — остаётся
 * постер и обычные элементы управления.
 */
export const CaseVideo = ({ src, poster, autoplay, width, height }: CaseVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  /*
    Режим автозапуска включается императивно уже после монтирования: решение
    зависит от prefers-reduced-motion, который на сервере неизвестен. Разметка
    при этом отдаётся с обычными элементами управления, поэтому без JS видео
    остаётся управляемым.
  */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !autoplay) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    video.muted = true
    video.loop = true
    video.controls = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) void video.play().catch(() => undefined)
        else video.pause()
      },
      { threshold: 0.25 },
    )

    observer.observe(video)
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [autoplay])

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      width={width}
      height={height}
      controls
      playsInline
      preload="none"
      className="h-auto w-full bg-[var(--bg-raised)]"
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  )
}

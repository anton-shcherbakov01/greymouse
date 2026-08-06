import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineSegments,
  ShaderMaterial,
  Vector2,
  type Object3D,
} from 'three'

import { linesFragmentShader, linesVertexShader } from '../shaders/lines'
import type { HeroFrame, HeroObject } from '../types'

type LinesOptions = {
  color: Color
  accent: Color
  opacity: number
  /** Насколько сильно линия изгибается к указателю. */
  bendScale: number
  /** Насколько сильно линия уводит вниз при прокрутке. */
  flowScale: number
  pulseSpeed: number
  pulseStrength: number
}

type Polyline = { points: [number, number, number][]; line: number; side: number }

/**
 * Общий объект для линий сцены. Из него собираются три разные вещи —
 * «цифровые усы», хвост-траектория и сигнальная сетка, — потому что материал
 * и логика у них одни и те же, различаются только геометрия и параметры.
 */
export class SignalLines implements HeroObject {
  private readonly segments: LineSegments<BufferGeometry, ShaderMaterial>
  private readonly baseOpacity: number
  /** Сетка живёт импульсами: её видимость задаётся отдельно. */
  private pulseDriven = false

  constructor(parent: Object3D, polylines: Polyline[], options: LinesOptions) {
    this.baseOpacity = options.opacity

    const material = new ShaderMaterial({
      vertexShader: linesVertexShader,
      fragmentShader: linesFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uInteraction: { value: 0 },
        uScroll: { value: 0 },
        uCases: { value: 0 },
        uContact: { value: 0 },
        uReducedMotion: { value: 0 },
        uOpacity: { value: options.opacity },
        uBendScale: { value: options.bendScale },
        uFlowScale: { value: options.flowScale },
        uPulseSpeed: { value: options.pulseSpeed },
        uPulseStrength: { value: options.pulseStrength },
        uPointer: { value: new Vector2() },
        uColor: { value: options.color },
        uAccent: { value: options.accent },
      },
    })

    this.segments = new LineSegments(buildGeometry(polylines), material)
    parent.add(this.segments)
  }

  /** Сетка видна только импульсами — режим включается явно при создании. */
  asPulseDriven() {
    this.pulseDriven = true
    return this
  }

  update(frame: HeroFrame) {
    const { uniforms } = this.segments.material
    uniforms.uTime.value = frame.time
    uniforms.uReveal.value = frame.reveal
    uniforms.uInteraction.value = frame.interaction
    uniforms.uScroll.value = frame.scroll
    uniforms.uCases.value = frame.cases
    uniforms.uContact.value = frame.contact
    uniforms.uReducedMotion.value = frame.reducedMotion ? 1 : 0
    uniforms.uPointer.value.set(frame.pointer.x, frame.pointer.y)
    uniforms.uOpacity.value = this.pulseDriven
      ? this.baseOpacity * frame.gridPulse
      : this.baseOpacity
  }

  dispose() {
    this.segments.geometry.dispose()
    this.segments.material.dispose()
    this.segments.removeFromParent()
  }
}

/** Ломаные превращаются в пары вершин: `LineSegments` рисует отрезками. */
const buildGeometry = (polylines: Polyline[]): BufferGeometry => {
  const positions: number[] = []
  const ts: number[] = []
  const lines: number[] = []
  const sides: number[] = []

  for (const polyline of polylines) {
    const { points } = polyline
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i]
      const b = points[i + 1]
      if (!a || !b) continue
      positions.push(...a, ...b)
      ts.push(i / (points.length - 1), (i + 1) / (points.length - 1))
      lines.push(polyline.line, polyline.line)
      sides.push(polyline.side, polyline.side)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('aT', new BufferAttribute(new Float32Array(ts), 1))
  geometry.setAttribute('aLine', new BufferAttribute(new Float32Array(lines), 1))
  geometry.setAttribute('aSide', new BufferAttribute(new Float32Array(sides), 1))
  return geometry
}

/**
 * «Цифровые усы»: по несколько тонких линий с каждой стороны. Они начинаются
 * у объекта и уходят в стороны, слегка провисая — это опознаваемая деталь
 * сцены, поэтому она остаётся даже на низком уровне качества и на мобильных.
 */
export const buildWhiskers = (perSide: number): Polyline[] => {
  const result: Polyline[] = []
  const segments = 24

  for (const side of [-1, 1]) {
    for (let index = 0; index < perSide; index += 1) {
      const lift = 0.28 - index * 0.26
      const reach = 1.1 + index * 0.3
      const points: [number, number, number][] = []

      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments
        points.push([
          side * (0.9 + t * reach),
          lift + Math.sin(t * Math.PI * 0.85) * 0.3 - t * t * 0.55,
          Math.cos(t * Math.PI * 0.6) * 0.35 - 0.15,
        ])
      }

      result.push({ points, line: index + (side > 0 ? 0 : perSide), side })
    }
  }

  return result
}

/**
 * Хвост-траектория: одна длинная кривая позади объекта. Ассоциация возникает
 * из-за длины и изгиба, а не из-за того, что она к чему-то прикреплена.
 */
export const buildTrail = (): Polyline[] => {
  const segments = 60
  const points: [number, number, number][] = []

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    points.push([
      -0.55 - t * 2.1 + Math.sin(t * 2.6) * 0.42,
      -0.28 - t * 0.75 + Math.sin(t * 4.1) * 0.14,
      -0.45 - t * 2.0,
    ])
  }

  return [{ points, line: 0, side: 0 }]
}

/**
 * Сигнальная сетка: концентрические дуги в плоскости за объектом. Появляется
 * импульсами — на первом наведении, при движении указателя после паузы и на
 * переходе к следующей секции.
 */
export const buildGrid = (): Polyline[] => {
  const result: Polyline[] = []
  const segments = 40

  for (let ring = 0; ring < 4; ring += 1) {
    const radius = 1.9 + ring * 0.85
    const points: [number, number, number][] = []
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments
      const angle = (-0.15 + t * 1.3) * Math.PI
      points.push([Math.cos(angle) * radius, Math.sin(angle) * radius * 0.55, -1.6 - ring * 0.3])
    }
    result.push({ points, line: ring, side: 0 })
  }

  // Несколько радиальных отрезков — сетка должна читаться как структура.
  for (let spoke = 0; spoke < 5; spoke += 1) {
    const angle = (-0.1 + (spoke / 4) * 1.2) * Math.PI
    const points: [number, number, number][] = []
    for (let i = 0; i <= 8; i += 1) {
      const radius = 1.9 + (i / 8) * 2.55
      points.push([Math.cos(angle) * radius, Math.sin(angle) * radius * 0.55, -1.6 - (i / 8) * 0.9])
    }
    result.push({ points, line: spoke + 4, side: 0 })
  }

  return result
}

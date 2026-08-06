import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  Vector3,
  type Object3D,
} from 'three'

import { particlesFragmentShader, particlesVertexShader } from '../shaders/particles'
import type { HeroFrame, HeroObject } from '../types'

type ParticlesOptions = {
  count: number
  color: Color
  accent: Color
}

/** Доли частиц по ролям: свободные, дуги-«уши», боковые линии, хвост. */
const ROLE_SHARE = { free: 0.62, ears: 0.1, sides: 0.12, trail: 0.16 }

/**
 * Облако частиц вокруг ядра.
 *
 * Один `Points` на всё облако: инстансинг здесь не нужен и был бы дороже —
 * точки и так рисуются одним вызовом. Роли частиц зашиты в атрибут, поэтому
 * структуры (дуги сверху, боковые линии, хвост) не требуют отдельных объектов.
 */
export class SignalParticles implements HeroObject {
  private readonly points: Points<BufferGeometry, ShaderMaterial>
  private readonly baseSize: number

  constructor(parent: Object3D, options: ParticlesOptions) {
    const geometry = buildGeometry(options.count)
    this.baseSize = 9.5

    const material = new ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.baseSize },
        uPixelRatio: { value: 1 },
        uReveal: { value: 0 },
        uInteraction: { value: 0 },
        uScroll: { value: 0 },
        uCases: { value: 0 },
        uContact: { value: 0 },
        uSignalPhase: { value: -1 },
        uReducedMotion: { value: 0 },
        uPointerWorld: { value: new Vector3(0, 0, 1) },
        uColor: { value: options.color },
        uAccent: { value: options.accent },
      },
    })

    this.points = new Points(geometry, material)
    parent.add(this.points)
  }

  update(frame: HeroFrame) {
    const { uniforms } = this.points.material
    uniforms.uTime.value = frame.time
    uniforms.uReveal.value = frame.reveal
    uniforms.uInteraction.value = frame.interaction
    uniforms.uScroll.value = frame.scroll
    uniforms.uCases.value = frame.cases
    uniforms.uContact.value = frame.contact
    uniforms.uSignalPhase.value = frame.signalPhase
    uniforms.uReducedMotion.value = frame.reducedMotion ? 1 : 0
    uniforms.uPointerWorld.value.copy(frame.pointerWorld)
  }

  setPixelRatio(dpr: number) {
    this.points.material.uniforms.uPixelRatio.value = dpr
  }

  /** Понижение качества уменьшает точки: overdraw дороже их количества. */
  scaleSize(factor: number) {
    this.points.material.uniforms.uSize.value = this.baseSize * factor
  }

  dispose() {
    this.points.geometry.dispose()
    this.points.material.dispose()
    this.points.removeFromParent()
  }
}

const buildGeometry = (count: number): BufferGeometry => {
  const positions = new Float32Array(count * 3)
  const axes = new Float32Array(count * 3)
  const scatter = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const speeds = new Float32Array(count)
  const phases = new Float32Array(count)
  const roles = new Float32Array(count)

  const freeUntil = Math.floor(count * ROLE_SHARE.free)
  const earsUntil = freeUntil + Math.floor(count * ROLE_SHARE.ears)
  const sidesUntil = earsUntil + Math.floor(count * ROLE_SHARE.sides)

  for (let i = 0; i < count; i += 1) {
    let x: number
    let y: number
    let z: number
    let role: number

    if (i < freeUntil) {
      // Свободные частицы: равномерно по сплюснутой оболочке вокруг ядра.
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.5 + Math.random() * 1.45
      x = radius * Math.sin(phi) * Math.cos(theta)
      y = radius * Math.cos(phi) * 0.72
      z = radius * Math.sin(phi) * Math.sin(theta)
      role = 0
    } else if (i < earsUntil) {
      // Две короткие дуги над объектом. Намёк держится на их симметрии.
      const side = i % 2 === 0 ? 1 : -1
      const t = Math.random()
      const angle = (0.32 + t * 0.5) * Math.PI
      x = side * Math.sin(angle) * 0.85
      y = 1.05 + Math.cos(angle) * 0.42 + Math.random() * 0.08
      z = (Math.random() - 0.5) * 0.3
      role = 1
    } else if (i < sidesUntil) {
      // Боковые линии — продолжение «усов» из линий, но точками.
      const side = i % 2 === 0 ? 1 : -1
      const t = Math.random()
      x = side * (1.25 + t * 1.9)
      y = 0.1 + Math.sin(t * Math.PI) * 0.3 - t * 0.35
      z = (Math.random() - 0.5) * 0.45
      role = 2
    } else {
      // Хвост: длинная кривая, уходящая назад и вниз.
      const t = Math.random()
      x = -0.5 - t * 2.6 + Math.sin(t * 3.4) * 0.35
      y = -0.35 - t * 0.85
      z = -0.4 - t * 1.9
      role = 3
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    // Ось орбиты: у структурных частиц почти вертикальная — они не должны
    // разъезжаться, иначе структура распадётся за несколько секунд.
    const structured = role > 0
    const ax = structured ? (Math.random() - 0.5) * 0.2 : Math.random() - 0.5
    const ay = structured ? 1 : Math.random() - 0.5
    const az = structured ? (Math.random() - 0.5) * 0.2 : Math.random() - 0.5
    const length = Math.hypot(ax, ay, az) || 1
    axes[i * 3] = ax / length
    axes[i * 3 + 1] = ay / length
    axes[i * 3 + 2] = az / length

    scatter[i * 3] = (Math.random() - 0.5) * 2
    scatter[i * 3 + 1] = (Math.random() - 0.5) * 2
    scatter[i * 3 + 2] = (Math.random() - 0.5) * 2

    scales[i] = structured ? 0.4 + Math.random() * 0.4 : 0.3 + Math.random() * 0.85
    speeds[i] = (structured ? 0.012 : 0.045) * (0.6 + Math.random() * 0.8)
    phases[i] = Math.random() * Math.PI * 2
    roles[i] = role
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aAxis', new BufferAttribute(axes, 3))
  geometry.setAttribute('aScatter', new BufferAttribute(scatter, 3))
  geometry.setAttribute('aScale', new BufferAttribute(scales, 1))
  geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aRole', new BufferAttribute(roles, 1))
  return geometry
}

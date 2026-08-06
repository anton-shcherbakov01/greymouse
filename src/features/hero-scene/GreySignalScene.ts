import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'

import {
  massFragmentShader,
  massVertexShader,
  particlesFragmentShader,
  particlesVertexShader,
} from './shaders'

export type QualityTier = 'low' | 'medium' | 'high'

type SceneOptions = {
  canvas: HTMLCanvasElement
  reducedMotion: boolean
}

/*
  Детализация геометрии влияет на плавность силуэта сильнее, чем на стоимость
  кадра: основная нагрузка — фрагментный шейдер и DPR. Поэтому даже на низком
  уровне сетка остаётся достаточно плотной, а экономим на DPR и частицах.
*/
const QUALITY: Record<QualityTier, { subdivision: number; particles: number; maxDpr: number }> = {
  low: { subdivision: 5, particles: 260, maxDpr: 1.25 },
  medium: { subdivision: 5, particles: 620, maxDpr: 1.5 },
  high: { subdivision: 6, particles: 1100, maxDpr: 1.75 },
}

const COLOR_DEEP = new Color('#101216')
const COLOR_LIFT = new Color('#aab2c0')
const COLOR_SIGNAL = new Color('#c9f24a')
const COLOR_PARTICLE = new Color('#7d8492')

/**
 * Сцена Grey Signal.
 *
 * Класс намеренно не знает про React: он управляет только WebGL и своим циклом
 * рендера. Жизненный цикл (пауза вне вьюпорта, скрытая вкладка, потеря контекста)
 * — тоже его ответственность, чтобы вызывающий код оставался тривиальным.
 */
export class GreySignalScene {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera: PerspectiveCamera
  private mass: Mesh<IcosahedronGeometry, ShaderMaterial>
  private particles: Points<BufferGeometry, ShaderMaterial>
  private whiskers: LineSegments<BufferGeometry, LineBasicMaterial>
  private canvas: HTMLCanvasElement

  private frameId: number | null = null
  private running = false
  private disposed = false
  private reducedMotion: boolean

  private clockStart = performance.now()
  private pointer = { x: 0, y: 0 }
  private pointerTarget = { x: 0, y: 0 }
  private scrollProgress = 0
  private quality: QualityTier
  private maxDpr: number
  private lastFrameTimes: number[] = []
  private downgraded = false
  /** Смещение массы вправо, чтобы не спорить с текстом первого экрана. */
  private layoutOffsetX = 0
  private layoutOffsetY = 0

  constructor({ canvas, reducedMotion }: SceneOptions) {
    this.canvas = canvas
    this.reducedMotion = reducedMotion
    this.quality = detectQuality()
    this.maxDpr = QUALITY[this.quality].maxDpr

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: this.quality !== 'low',
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })
    this.renderer.setClearColor(0x000000, 0)

    this.camera = new PerspectiveCamera(38, 1, 0.1, 60)
    this.camera.position.set(0, 0.15, 6.2)

    const { subdivision, particles } = QUALITY[this.quality]

    this.mass = new Mesh(
      new IcosahedronGeometry(1.55, subdivision),
      new ShaderMaterial({
        vertexShader: massVertexShader,
        fragmentShader: massFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: 0.16 },
          uSquash: { value: 1 },
          uSignalPhase: { value: 0 },
          uSignalStrength: { value: 1 },
          uColorDeep: { value: COLOR_DEEP },
          uColorLift: { value: COLOR_LIFT },
          uSignalColor: { value: COLOR_SIGNAL },
          uCameraPosition: { value: new Vector3() },
        },
      }),
    )
    this.scene.add(this.mass)

    this.particles = new Points(buildParticleGeometry(particles), new ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 9 },
        uPixelRatio: { value: 1 },
        uSignalPhase: { value: 0 },
        uColor: { value: COLOR_PARTICLE },
        uSignalColor: { value: COLOR_SIGNAL },
      },
    }))
    this.scene.add(this.particles)

    this.whiskers = new LineSegments(
      buildWhiskerGeometry(),
      new LineBasicMaterial({ color: COLOR_LIFT, transparent: true, opacity: 0.28 }),
    )
    this.scene.add(this.whiskers)

    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)
  }

  resize(width: number, height: number) {
    if (this.disposed || width === 0 || height === 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    // На узких экранах объект отодвигается, иначе он вылезает за края.
    this.camera.position.z = width < 640 ? 8.6 : width < 1024 ? 7.4 : 6.2
    // Текст первого экрана прижат влево-вниз, поэтому объект уходит вправо-вверх.
    this.layoutOffsetX = width < 768 ? 0 : width < 1280 ? 0.75 : 1.15
    this.layoutOffsetY = width < 768 ? 1.15 : 0.35
    this.camera.updateProjectionMatrix()
    this.particles.material.uniforms.uPixelRatio.value = dpr
  }

  setPointer(x: number, y: number) {
    this.pointerTarget.x = x
    this.pointerTarget.y = y
  }

  setScrollProgress(progress: number) {
    this.scrollProgress = Math.min(Math.max(progress, 0), 1)
  }

  start() {
    if (this.running || this.disposed) return
    this.running = true
    this.clockStart = performance.now() - 1
    this.loop()
  }

  stop() {
    this.running = false
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  /** Один кадр — используется при prefers-reduced-motion и для постера. */
  renderStatic() {
    if (this.disposed) return
    this.update(2.4)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    this.mass.geometry.dispose()
    this.mass.material.dispose()
    this.particles.geometry.dispose()
    this.particles.material.dispose()
    this.whiskers.geometry.dispose()
    this.whiskers.material.dispose()
    this.renderer.dispose()
  }

  onContextLostCallback: (() => void) | null = null

  private onContextLost = (event: Event) => {
    event.preventDefault()
    this.stop()
    this.onContextLostCallback?.()
  }

  private onContextRestored = () => {
    if (!this.disposed && !this.reducedMotion) this.start()
  }

  private loop = () => {
    if (!this.running || this.disposed) return
    const frameStart = performance.now()
    const elapsed = (frameStart - this.clockStart) / 1000

    this.update(elapsed)
    this.renderer.render(this.scene, this.camera)
    this.trackPerformance(performance.now() - frameStart)

    this.frameId = requestAnimationFrame(this.loop)
  }

  private update(elapsed: number) {
    const { uniforms: massUniforms } = this.mass.material
    const { uniforms: particleUniforms } = this.particles.material

    // Демпфирование: объект догоняет курсор, а не дёргается за ним.
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.045
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.045

    const scroll = this.scrollProgress
    const idle = this.reducedMotion ? 0 : elapsed

    massUniforms.uTime.value = idle
    // Фаза держится в пределах силуэта, иначе сигнал большую часть времени не виден.
    massUniforms.uSignalPhase.value = this.reducedMotion ? -0.15 : ((idle * 0.26) % 1.7) - 0.85
    massUniforms.uAmplitude.value = 0.16 + this.pointer.y * 0.025
    massUniforms.uSignalStrength.value = 1 - scroll * 0.7
    massUniforms.uCameraPosition.value.copy(this.camera.position)

    particleUniforms.uTime.value = idle
    particleUniforms.uSignalPhase.value = massUniforms.uSignalPhase.value

    const rotationY = this.pointer.x * 0.32 + (this.reducedMotion ? 0.3 : idle * 0.045)
    const rotationX = this.pointer.y * 0.2

    this.mass.rotation.set(rotationX, rotationY, 0)
    this.particles.rotation.set(rotationX * 0.6, rotationY * 0.7, 0)
    this.whiskers.rotation.set(rotationX, rotationY, 0)

    // Scroll-driven: объект уходит вглубь и растворяется к следующей секции.
    const depth = scroll * 3.4
    this.mass.position.set(
      this.layoutOffsetX + this.pointer.x * 0.22,
      this.layoutOffsetY - scroll * 0.9 + this.pointer.y * 0.12,
      -depth,
    )
    this.particles.position.copy(this.mass.position)
    this.whiskers.position.copy(this.mass.position)

    const fade = 1 - scroll
    this.mass.scale.setScalar(1 - scroll * 0.18)
    this.particles.material.uniforms.uSize.value = 9 * Math.max(fade, 0.15)
    this.whiskers.material.opacity = 0.28 * fade
  }

  /**
   * Если кадры стабильно дороже 22 мс, качество понижается один раз.
   * Это дешевле, чем угадывать GPU по строке рендерера.
   */
  private trackPerformance(frameCost: number) {
    if (this.downgraded || this.quality === 'low') return
    this.lastFrameTimes.push(frameCost)
    if (this.lastFrameTimes.length < 90) return

    const average = this.lastFrameTimes.reduce((sum, value) => sum + value, 0) / this.lastFrameTimes.length
    this.lastFrameTimes = []

    if (average > 22) {
      this.downgraded = true
      this.maxDpr = QUALITY.low.maxDpr
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxDpr))
      this.particles.material.uniforms.uSize.value *= 0.8
    }
  }
}

const detectQuality = (): QualityTier => {
  if (typeof window === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  if (narrow || coarse || cores <= 4) return 'low'
  if (cores <= 8) return 'medium'
  return 'high'
}

const buildParticleGeometry = (count: number): BufferGeometry => {
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const seeds = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    // Равномерное распределение по сферической оболочке вокруг массы.
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const radius = 1.85 + Math.random() * 1.5

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.82
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    scales[i] = 0.35 + Math.random() * 0.9
    seeds[i] = Math.random()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aScale', new BufferAttribute(scales, 1))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  return geometry
}

/** Тонкие линии-«усы»: две дуги, уходящие в стороны от массы. */
const buildWhiskerGeometry = (): BufferGeometry => {
  const points: number[] = []
  const segments = 40

  for (const direction of [-1, 1]) {
    for (let arc = 0; arc < 2; arc += 1) {
      const lift = 0.16 + arc * 0.34
      let previous: [number, number, number] | null = null
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments
        const x = direction * (1.5 + t * 2.5)
        const y = lift + Math.sin(t * Math.PI) * (0.55 - arc * 0.18) - t * 0.5
        const z = Math.cos(t * Math.PI * 0.8) * 0.5
        const current: [number, number, number] = [x, y, z]
        if (previous) points.push(...previous, ...current)
        previous = current
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  return geometry
}

import { Color, Object3D, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three'

import { getHeroCtaTarget } from './heroInteractionStore'
import { GreySignalCore } from './objects/GreySignalCore'
import { HeroBackdrop } from './objects/HeroBackdrop'
import { buildGrid, buildTrail, buildWhiskers, SignalLines } from './objects/SignalLines'
import { SignalParticles } from './objects/SignalParticles'
import { detectQuality, FrameCostMonitor, lowerTier, QUALITY, raiseTier } from './quality'
import type { HeroFrame, HeroObject, QualityTier } from './types'

export type { QualityTier } from './types'

type SceneOptions = {
  canvas: HTMLCanvasElement
  reducedMotion: boolean
}

const COLOR_DEEP = new Color('#0e1014')
const COLOR_LIFT = new Color('#a8b0be')
const COLOR_PARTICLE = new Color('#8a91a0')
const COLOR_ACCENT = new Color('#c9f24a')
const COLOR_GLOW = new Color('#2a3242')

/** Длительность вступления. Верхняя граница диапазона из концепции. */
const INTRO_SECONDS = 2.2

/** Экспоненциальное сглаживание, независимое от частоты кадров. */
const damp = (current: number, target: number, lambda: number, delta: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * delta))

/**
 * Сцена Grey Signal.
 *
 * Оркестратор: владеет рендерером, камерой и состоянием кадра, раздаёт это
 * состояние объектам. Сами объекты про React, DOM и события ничего не знают —
 * ровно как и раньше, эта граница себя оправдала.
 */
export class GreySignalScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  /*
    Всё содержимое композиции лежит в одной группе, и сдвигается именно она,
    а не камера. Камера смотрит в начало координат: если двигать её, `lookAt`
    возвращает объект в центр кадра — при первой попытке композиция из-за
    этого не менялась вовсе.
  */
  private readonly world = new Object3D()
  private readonly camera: PerspectiveCamera
  private readonly canvas: HTMLCanvasElement

  private readonly core: GreySignalCore
  private readonly particles: SignalParticles
  private readonly whiskers: SignalLines
  private readonly trail: SignalLines
  private readonly grid: SignalLines | null
  private readonly backdrop: HeroBackdrop
  private readonly objects: HeroObject[]

  private frameId: number | null = null
  private running = false
  private disposed = false

  private readonly reducedMotion: boolean
  private quality: QualityTier
  private readonly qualityCeiling: QualityTier
  private maxDpr: number
  private readonly costMonitor = new FrameCostMonitor()

  private lastFrameAt = performance.now()
  private startedAt = performance.now()

  /** Цели интерактивных величин; в кадре к ним подтягиваются текущие. */
  private readonly target = { pointerX: 0, pointerY: 0, scroll: 0, cases: 0, contact: 0 }
  private pointerMovedAt = -Infinity
  private lastGridPulseAt = -Infinity
  private compact = false
  /** Опорное положение камеры для текущей раскладки; от него идёт параллакс. */
  private readonly baseCamera = new Vector3(0, 0.1, 6.2)

  private readonly frame: HeroFrame = {
    time: 0,
    delta: 0,
    reveal: 0,
    pointer: { x: 0, y: 0 },
    pointerWorld: new Vector3(0, 0, 1),
    interaction: 0,
    scroll: 0,
    cases: 0,
    contact: 0,
    gridPulse: 0,
    signalPhase: -1,
    reducedMotion: false,
    compact: false,
  }

  /** Вызывается при потере контекста WebGL — обёртка прячет canvas. */
  onContextLostCallback: (() => void) | null = null

  constructor({ canvas, reducedMotion }: SceneOptions) {
    this.canvas = canvas
    this.reducedMotion = reducedMotion
    this.frame.reducedMotion = reducedMotion
    this.quality = detectQuality()
    this.qualityCeiling = this.quality

    const preset = QUALITY[this.quality]
    this.maxDpr = preset.maxDpr

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: preset.antialias,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })
    this.renderer.setClearColor(0x000000, 0)

    this.camera = new PerspectiveCamera(36, 1, 0.1, 60)
    this.camera.position.set(0, 0.1, 6.2)

    this.scene.add(this.world)

    // Фон вне группы мира: он привязан к кадру камеры, а не к объекту.
    this.backdrop = new HeroBackdrop(this.scene, { glow: COLOR_GLOW, accent: COLOR_ACCENT })
    this.core = new GreySignalCore(this.world, {
      subdivision: preset.subdivision,
      contours: preset.contours,
      colorDeep: COLOR_DEEP,
      colorLift: COLOR_LIFT,
      accent: COLOR_ACCENT,
    })
    this.particles = new SignalParticles(this.world, {
      count: preset.particles,
      color: COLOR_PARTICLE,
      accent: COLOR_ACCENT,
    })
    this.whiskers = new SignalLines(this.world, buildWhiskers(preset.whiskersPerSide), {
      color: COLOR_LIFT,
      accent: COLOR_ACCENT,
      opacity: 0.24,
      bendScale: 0.34,
      flowScale: 0.9,
      pulseSpeed: 0.11,
      pulseStrength: 0.85,
    })
    this.trail = new SignalLines(this.world, buildTrail(), {
      color: COLOR_LIFT,
      accent: COLOR_ACCENT,
      opacity: 0.22,
      bendScale: 0.16,
      flowScale: 1.3,
      pulseSpeed: 0.07,
      pulseStrength: 0.6,
    })
    this.grid = preset.grid
      ? new SignalLines(this.world, buildGrid(), {
          color: COLOR_LIFT,
          accent: COLOR_ACCENT,
          opacity: 0.42,
          bendScale: 0.06,
          flowScale: 0.4,
          pulseSpeed: 0.25,
          pulseStrength: 0.5,
        }).asPulseDriven()
      : null

    this.objects = [this.backdrop, this.core, this.particles, this.whiskers, this.trail]
    if (this.grid) this.objects.push(this.grid)

    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)
  }

  resize(width: number, height: number) {
    if (this.disposed || width === 0 || height === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(width, height, false)
    this.particles.setPixelRatio(dpr)

    this.compact = width < 768
    this.frame.compact = this.compact

    this.camera.aspect = width / height
    /*
      Композиция, а не масштабирование десктопной сцены: на узком экране объект
      мельче и поднят над текстом, на широком — смещён вправо, где заголовку
      он не мешает. Смещается камера, а не объект: так световое пятно фона и
      перспектива остаются согласованными.
    */
    if (this.compact) {
      /*
        Телефон: объект поднят над текстом и заметно уменьшен. Масштаб считать
        от десктопного нельзя — кадр узкий, и объект, занимающий там треть
        высоты, перекрывал всю ширину экрана.
      */
      this.baseCamera.set(0, 0, 8.6)
      this.world.position.set(0, 1.75, 0)
      this.world.scale.setScalar(0.58)
    } else if (width < 1280) {
      this.baseCamera.set(0, 0, 6.9)
      this.world.position.set(1.15, 0.75, 0)
      this.world.scale.setScalar(0.9)
    } else {
      this.baseCamera.set(0, 0, 6.5)
      this.world.position.set(1.85, 0.6, 0)
      this.world.scale.setScalar(1)
    }
    this.camera.position.copy(this.baseCamera)

    this.camera.updateProjectionMatrix()
    this.backdrop.fitToCamera(this.camera.fov, this.camera.aspect, this.camera.position.z)

    // Световое пятно ставится под объект — из геометрии кадра, а не на глаз.
    const halfHeight = Math.tan((this.camera.fov * Math.PI) / 360) * this.baseCamera.z
    const halfWidth = halfHeight * this.camera.aspect
    this.backdrop.setGlowCenter(
      0.5 + this.world.position.x / (2 * halfWidth),
      0.5 + this.world.position.y / (2 * halfHeight),
    )
  }

  setPointer(x: number, y: number) {
    if (this.compact) return
    this.target.pointerX = x
    this.target.pointerY = y
    this.pointerMovedAt = performance.now()

    // Импульс сетки при возобновлении движения после паузы — редкое событие.
    if (performance.now() - this.lastGridPulseAt > 9000) this.pulseGrid()
  }

  setScrollProgress(progress: number) {
    this.target.scroll = Math.min(Math.max(progress, 0), 1)
  }

  /** Сетка вспыхивает и гаснет за ~1.2 с. */
  pulseGrid() {
    this.frame.gridPulse = 1
    this.lastGridPulseAt = performance.now()
  }

  start() {
    if (this.running || this.disposed) return
    this.running = true
    this.lastFrameAt = performance.now()
    this.loop()
  }

  stop() {
    this.running = false
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  /**
   * Один кадр собранной композиции — для `prefers-reduced-motion`.
   * Вступление не проигрывается: пользователь просил не двигать интерфейс.
   */
  renderStatic() {
    if (this.disposed) return
    this.frame.time = 6
    this.frame.reveal = 1
    this.frame.delta = 0
    this.frame.signalPhase = -0.2
    this.updateObjects()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    this.objects.forEach((object) => object.dispose())
    this.renderer.dispose()
  }

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

    const now = performance.now()
    // Ограничение сверху: после скрытой вкладки или лага один кадр не должен
    // прокручивать анимацию на секунды вперёд.
    const delta = Math.min((now - this.lastFrameAt) / 1000, 0.05)
    this.lastFrameAt = now

    this.advance(delta, now)
    this.updateObjects()
    this.renderer.render(this.scene, this.camera)
    this.applyCostVerdict(performance.now() - now)

    this.frameId = requestAnimationFrame(this.loop)
  }

  /** Продвижение состояния кадра: все величины демпфируются, а не переключаются. */
  private advance(delta: number, now: number) {
    const frame = this.frame
    frame.delta = delta
    frame.time += delta

    const introProgress = Math.min((now - this.startedAt) / 1000 / INTRO_SECONDS, 1)
    // Плавное начало и конец: easeInOutCubic.
    const eased =
      introProgress < 0.5 ? 4 * introProgress ** 3 : 1 - Math.pow(-2 * introProgress + 2, 3) / 2
    frame.reveal = this.reducedMotion ? 1 : eased

    // Один импульс в момент завершения сборки.
    if (introProgress >= 1 && this.lastGridPulseAt === -Infinity) this.pulseGrid()

    const cta = getHeroCtaTarget()
    this.target.cases = cta === 'cases' ? 1 : 0
    this.target.contact = cta === 'contact' ? 1 : 0

    frame.pointer.x = damp(frame.pointer.x, this.target.pointerX, 3.2, delta)
    frame.pointer.y = damp(frame.pointer.y, this.target.pointerY, 3.2, delta)
    frame.scroll = damp(frame.scroll, this.target.scroll, 8, delta)
    frame.cases = damp(frame.cases, this.target.cases, 5, delta)
    frame.contact = damp(frame.contact, this.target.contact, 5, delta)

    // Свежесть движения указателя: 1 сразу после движения, ноль через ~0.6 с.
    const sincePointer = (now - this.pointerMovedAt) / 1000
    const interactionTarget = this.reducedMotion ? 0 : Math.max(0, 1 - sincePointer / 0.6)
    frame.interaction = damp(frame.interaction, interactionTarget, 6, delta)

    frame.gridPulse = Math.max(0, frame.gridPulse - delta / 1.2)

    /*
      Направление на указатель в пространстве сцены. Считается через камеру,
      поэтому локальная волна на поверхности появляется именно там, куда
      указывает курсор, а не там, где это совпало по координатам экрана.
    */
    frame.pointerWorld
      .set(frame.pointer.x, frame.pointer.y, 0.85)
      .unproject(this.camera)
      .normalize()

    // Сигнал проходит по объекту редко: раз в ~9 секунд, плюс при наведении.
    const period = 9
    const phase = ((frame.time % period) / period) * 2.6 - 1.3
    frame.signalPhase = this.reducedMotion ? -0.2 : phase

    /*
      Дрейф камеры и параллакс — от опорного положения, заданного раскладкой.
      Амплитуда мала: это воздух вокруг объекта, а не движение камеры.
      При прокрутке камера приближается к объекту, а не отъезжает: так переход
      к следующей секции ощущается как проход сквозь, а не как отступление.
    */
    const drift = this.reducedMotion ? 0 : Math.sin(frame.time * 0.12) * 0.06
    const parallax = this.compact || this.reducedMotion ? 0 : 0.14
    this.camera.position.set(
      this.baseCamera.x + frame.pointer.x * parallax + drift,
      this.baseCamera.y + frame.pointer.y * parallax * 0.55,
      this.baseCamera.z - frame.scroll * 1.15,
    )
    this.camera.lookAt(
      frame.pointer.x * 0.1,
      0.05 + frame.pointer.y * 0.06 - frame.scroll * 0.55,
      0,
    )

    this.core.setCameraPosition(this.camera.position)
  }

  private updateObjects() {
    for (const object of this.objects) object.update(this.frame)
  }

  /**
   * Реакция на фактическую стоимость кадра. Понижение ступени пересобирает не
   * геометрию, а только то, что можно поменять на лету: DPR, размер частиц и
   * сглаживание. Пересоздавать меш ядра ради подразделения дороже, чем
   * оставить его как есть.
   */
  private applyCostVerdict(costMs: number) {
    const verdict = this.costMonitor.push(costMs)
    if (!verdict) return

    const next =
      verdict === 'lower' ? lowerTier(this.quality) : raiseTier(this.quality, this.qualityCeiling)
    if (next === this.quality) return

    this.quality = next
    this.maxDpr = QUALITY[next].maxDpr
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)
    this.renderer.setPixelRatio(dpr)
    this.particles.setPixelRatio(dpr)
    this.particles.scaleSize(next === 'low' ? 0.8 : 1)
  }
}

import { Color, IcosahedronGeometry, Mesh, Object3D, ShaderMaterial, Vector3 } from 'three'

import { coreFragmentShader, coreVertexShader } from '../shaders/core'
import type { HeroFrame, HeroObject } from '../types'

type CoreOptions = {
  subdivision: number
  contours: boolean
  colorDeep: Color
  colorLift: Color
  accent: Color
}

const RADIUS = 1.0

/**
 * Металлическое ядро — центр композиции.
 *
 * Меш живёт в собственной группе: смещение и поворот применяются к ней, а не
 * к мешу, чтобы шейдер работал с формой в её собственных координатах и волна
 * от указателя не «уезжала» вместе с объектом.
 */
export class GreySignalCore implements HeroObject {
  readonly group = new Object3D()
  private readonly mesh: Mesh<IcosahedronGeometry, ShaderMaterial>
  private readonly rotation = { x: 0, y: 0 }

  constructor(parent: Object3D, options: CoreOptions) {
    const geometry = new IcosahedronGeometry(RADIUS, options.subdivision)

    /*
      Шаг численной нормали привязан к плотности сетки: на редкой сетке крупный
      шаг усредняет форму и поверхность выглядит гранёной — так было в прошлой
      версии. Значения подобраны на глаз по подразделениям 4…6.
    */
    const normalEps = options.subdivision >= 6 ? 0.008 : options.subdivision === 5 ? 0.012 : 0.02

    const material = new ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0.065 },
        uReveal: { value: 0 },
        uInteraction: { value: 0 },
        uScroll: { value: 0 },
        uCases: { value: 0 },
        uContact: { value: 0 },
        uSignalPhase: { value: -1 },
        uNormalEps: { value: normalEps },
        uContours: { value: options.contours ? 1 : 0 },
        uReducedMotion: { value: 0 },
        uPointerWorld: { value: new Vector3(0, 0, 1) },
        uCameraPosition: { value: new Vector3() },
        uColorDeep: { value: options.colorDeep },
        uColorLift: { value: options.colorLift },
        uAccent: { value: options.accent },
      },
    })

    this.mesh = new Mesh(geometry, material)
    this.group.add(this.mesh)
    parent.add(this.group)
  }

  update(frame: HeroFrame) {
    const { uniforms } = this.mesh.material

    uniforms.uTime.value = frame.time
    uniforms.uReveal.value = frame.reveal
    uniforms.uInteraction.value = frame.interaction
    uniforms.uScroll.value = frame.scroll
    uniforms.uCases.value = frame.cases
    uniforms.uContact.value = frame.contact
    uniforms.uSignalPhase.value = frame.signalPhase
    uniforms.uReducedMotion.value = frame.reducedMotion ? 1 : 0
    uniforms.uPointerWorld.value.copy(frame.pointerWorld)
    // Амплитуда чуть растёт при взаимодействии — объект «оживает» под курсором.
    uniforms.uAmplitude.value = (frame.reducedMotion ? 0.045 : 0.065) + frame.interaction * 0.01

    /*
      Поворот к указателю — не привязка, а цель для демпфера. Амплитуда мала
      намеренно: объект должен реагировать, а не отслеживать курсор.
      Собственного постоянного вращения нет — только очень медленный дрейф.
    */
    const drift = frame.reducedMotion ? 0.22 : Math.sin(frame.time * 0.06) * 0.16
    this.rotation.y += (frame.pointer.x * 0.26 + drift - this.rotation.y) * 0.05
    this.rotation.x += (frame.pointer.y * 0.16 - this.rotation.x) * 0.05
    this.group.rotation.set(this.rotation.x, this.rotation.y, 0)

    // Наведение на кейсы слегка уводит объект вниз, к секции, куда ведёт кнопка.
    this.group.position.y = -frame.cases * 0.18 - frame.scroll * 0.35
    this.group.scale.setScalar(1 + frame.contact * 0.03 - frame.scroll * 0.06)
  }

  setCameraPosition(position: Vector3) {
    this.mesh.material.uniforms.uCameraPosition.value.copy(position)
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.group.removeFromParent()
  }
}

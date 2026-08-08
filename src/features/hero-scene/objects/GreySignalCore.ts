import {
  Color,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  Vector3,
} from 'three'

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
  private readonly geometry: IcosahedronGeometry
  private readonly detailGeometry = new IcosahedronGeometry(1, 2)
  private readonly material: ShaderMaterial
  private readonly detailMaterials: MeshBasicMaterial[]
  private readonly rotation = { x: 0, y: 0 }

  constructor(parent: Object3D, options: CoreOptions) {
    // Пять объёмов дают силуэт дешевле, чем пять копий прежней сверхплотной сетки.
    const coreSubdivision = Math.max(3, options.subdivision - 2)
    this.geometry = new IcosahedronGeometry(RADIUS, coreSubdivision)

    /*
      Шаг численной нормали привязан к плотности сетки: на редкой сетке крупный
      шаг усредняет форму и поверхность выглядит гранёной — так было в прошлой
      версии. Значения подобраны на глаз по подразделениям 4…6.
    */
    const normalEps = coreSubdivision >= 4 ? 0.014 : 0.022

    this.material = new ShaderMaterial({
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

    const addPart = (
      position: [number, number, number],
      scale: [number, number, number],
      rotationZ = 0,
    ) => {
      const mesh = new Mesh(this.geometry, this.material)
      mesh.position.set(...position)
      mesh.scale.set(...scale)
      mesh.rotation.z = rotationZ
      this.group.add(mesh)
      return mesh
    }

    /*
      Силуэт собирается из нескольких мягких объёмов. В отличие от прежнего
      единственного «камня» он читается как мышь ещё в почти полной темноте:
      корпус, голова, вытянутая морда и два уха образуют узнаваемый профиль.
    */
    addPart([-0.28, -0.14, 0], [1.18, 0.72, 0.78])
    addPart([0.68, 0.08, 0.04], [0.7, 0.56, 0.6])
    addPart([1.16, -0.02, 0.04], [0.46, 0.3, 0.38], -0.08)
    addPart([0.65, 0.63, -0.55], [0.25, 0.29, 0.13], -0.16)
    addPart([0.65, 0.67, 0.26], [0.29, 0.33, 0.15], -0.11)

    const eyeMaterial = new MeshBasicMaterial({
      color: new Color('#08090b'),
      transparent: true,
      opacity: 0,
    })
    const noseMaterial = new MeshBasicMaterial({
      color: options.accent,
      transparent: true,
      opacity: 0,
    })
    this.detailMaterials = [eyeMaterial, noseMaterial]

    const addEye = (x: number, z: number) => {
      const eye = new Mesh(this.detailGeometry, eyeMaterial)
      eye.position.set(x, 0.22, z)
      eye.scale.setScalar(0.065)
      this.group.add(eye)
    }

    addEye(1.1, 0.42)
    addEye(1.1, -0.12)

    const nose = new Mesh(this.detailGeometry, noseMaterial)
    nose.position.set(1.57, -0.02, 0.08)
    nose.scale.setScalar(0.075)
    this.group.add(nose)

    parent.add(this.group)
  }

  update(frame: HeroFrame) {
    const { uniforms } = this.material

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
    const detailOpacity = Math.min(1, frame.reveal * 1.35) * (0.78 + frame.interaction * 0.22)
    for (const material of this.detailMaterials) material.opacity = detailOpacity

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
    this.material.uniforms.uCameraPosition.value.copy(position)
  }

  dispose() {
    this.geometry.dispose()
    this.detailGeometry.dispose()
    this.material.dispose()
    this.detailMaterials.forEach((material) => material.dispose())
    this.group.removeFromParent()
  }
}

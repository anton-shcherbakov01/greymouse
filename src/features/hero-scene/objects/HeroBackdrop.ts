import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector2, type Scene } from 'three'

import { backdropFragmentShader, backdropVertexShader } from '../shaders/backdrop'
import type { HeroFrame, HeroObject } from '../types'

type BackdropOptions = {
  glow: Color
  accent: Color
}

/**
 * Задний план: световое пятно за объектом и виньетка.
 *
 * Плоскость стоит достаточно далеко и достаточно большая, чтобы перекрывать
 * кадр при любом соотношении сторон. Аддитивное смешивание поверх прозрачного
 * фона — секция под canvas уже тёмная, рисовать её заново незачем.
 */
export class HeroBackdrop implements HeroObject {
  private readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>

  constructor(scene: Scene, options: BackdropOptions) {
    const material = new ShaderMaterial({
      vertexShader: backdropVertexShader,
      fragmentShader: backdropFragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uScroll: { value: 0 },
        uContact: { value: 0 },
        uInteraction: { value: 0 },
        uAspect: { value: 1 },
        uCenter: { value: new Vector2(0.5, 0.5) },
        uGlow: { value: options.glow },
        uAccent: { value: options.accent },
      },
    })

    this.mesh = new Mesh(new PlaneGeometry(1, 1), material)
    this.mesh.position.z = -6
    this.mesh.renderOrder = -1
    scene.add(this.mesh)
  }

  /**
   * Плоскость подгоняется под кадр камеры на своей глубине, а не под окно:
   * иначе при изменении угла обзора по краям появлялись бы полосы.
   */
  fitToCamera(fovDegrees: number, aspect: number, cameraZ: number) {
    const distance = cameraZ - this.mesh.position.z
    const height = 2 * Math.tan((fovDegrees * Math.PI) / 360) * distance
    this.mesh.scale.set(height * aspect * 1.15, height * 1.15, 1)
    this.mesh.material.uniforms.uAspect.value = aspect
  }

  /** Центр светового пятна следует за объектом, а не за окном. */
  setGlowCenter(x: number, y: number) {
    this.mesh.material.uniforms.uCenter.value.set(x, y)
  }

  update(frame: HeroFrame) {
    const { uniforms } = this.mesh.material
    uniforms.uTime.value = frame.time
    uniforms.uReveal.value = frame.reveal
    uniforms.uScroll.value = frame.scroll
    uniforms.uContact.value = frame.contact
    uniforms.uInteraction.value = frame.interaction
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    this.mesh.removeFromParent()
  }
}

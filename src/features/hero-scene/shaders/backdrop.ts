/**
 * Фон сцены: световое пятно за объектом, туман к краям и дизеринг.
 *
 * Плоскость на заднем плане, а не пустая прозрачность: без неё объект висел
 * в чёрной пустоте. Дизеринг обязателен — градиент такой протяжённости на
 * 8 битах на канал даёт видимые кольца.
 */

export const backdropVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`

export const backdropFragmentShader = /* glsl */ `
precision mediump float;

varying vec2 vUv;

uniform vec3  uGlow;
uniform vec3  uAccent;
uniform vec2  uCenter;
uniform float uTime;
uniform float uReveal;
uniform float uScroll;
uniform float uContact;
uniform float uInteraction;
uniform float uAspect;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv - uCenter;
  uv.x *= uAspect;

  float dist = length(uv);

  // Основное световое пятно за объектом.
  float glow = exp(-dist * dist * 3.2);
  // Второе, шире и слабее — оно и создаёт ощущение глубины, а не плоского пятна.
  float halo = exp(-dist * dist * 0.55) * 0.35;

  float breathe = 1.0 + sin(uTime * 0.22) * 0.08;
  float intensity = (glow * 0.85 + halo) * breathe * uReveal;
  intensity *= 1.0 - uScroll * 0.75;

  vec3 color = uGlow * intensity;
  // При наведении на контакты пятно чуть теплеет.
  // Очень слабо: пятно на весь кадр, и заметный акцент здесь красит экран.
  color += uAccent * intensity * uContact * 0.05;
  color += uGlow * glow * uInteraction * 0.12;

  // Виньетка по краям кадра.
  float vignette = smoothstep(1.25, 0.25, length(vUv - 0.5) * 1.6);
  color *= vignette;

  // Дизеринг: без него градиент распадается на кольца.
  color += (hash12(vUv * 1024.0) - 0.5) * 0.012;

  gl_FragColor = vec4(color, clamp(intensity * 1.15, 0.0, 1.0));
}
`

/**
 * Облако сигнальных частиц.
 *
 * Движение задано орбитами, а не шумом: у каждой частицы своя ось, скорость и
 * фаза, положение считается поворотом вокруг оси. Это дешевле трёх вызовов
 * шума на вершину и, главное, читается как управляемое движение данных,
 * а не как броуновский шум.
 *
 * Роли (`aRole`) распределяют частицы по структурам композиции:
 *   0 — свободная орбита вокруг ядра;
 *   1 — две короткие дуги сверху;
 *   2 — боковые линии;
 *   3 — длинная траектория позади объекта.
 */

export const particlesVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uReveal;
uniform float uInteraction;
uniform float uScroll;
uniform float uCases;
uniform float uContact;
uniform float uSignalPhase;
uniform float uReducedMotion;
uniform vec3  uPointerWorld;

attribute vec3  aAxis;
attribute vec3  aScatter;
attribute float aScale;
attribute float aSpeed;
attribute float aPhase;
attribute float aRole;

varying float vAlpha;
varying float vSignal;
varying float vAccent;

/** Поворот вокруг произвольной оси — формула Родрига. */
vec3 rotateAxis(vec3 p, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

void main() {
  float motion = 1.0 - uReducedMotion;
  vec3 p = rotateAxis(position, normalize(aAxis), uTime * aSpeed * motion + aPhase);

  // Свободные частицы иногда подходят к поверхности и снова отдаляются.
  float breathe = 1.0 + sin(uTime * 0.35 * motion + aPhase * 3.1) * 0.09;
  p *= mix(1.0, breathe, step(aRole, 0.5));

  // Вступление: частицы приходят из объёма к своим местам.
  p += aScatter * pow(1.0 - uReveal, 2.0) * 3.2;

  // Отталкивание от указателя: ближние частицы расступаются и возвращаются.
  float proximity = exp(-pow((1.0 - dot(normalize(p), uPointerWorld)) * 2.2, 2.0));
  p += normalize(p) * proximity * uInteraction * 0.42;

  /*
    Наведение на «Смотреть кейсы»: частицы вытягиваются в направленный поток
    вниз — к секции, куда ведёт кнопка. Прокрутка делает то же самое, поэтому
    оба веса складываются в одну величину.
  */
  float flow = max(uCases * 0.75, uScroll);
  p.y -= flow * (1.4 + aPhase * 0.9);
  p.x *= 1.0 - flow * 0.35;
  p.z *= 1.0 - flow * 0.35;

  // Наведение на «Обсудить проект»: частицы подтягиваются ближе к центру.
  p *= 1.0 - uContact * 0.16;

  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * aScale * uPixelRatio * (7.0 / max(-mvPosition.z, 0.2));

  // Сигнальная линия проходит и по частицам — сцена читается как одно целое.
  float band = p.y * 0.62 - uSignalPhase;
  vSignal = exp(-band * band * 26.0);

  // Частицы структур (уши, усы, хвост) чуть ярче свободных.
  vAccent = step(0.5, aRole) * 0.35 + uCases * 0.3;

  float depthFade = smoothstep(11.0, 2.5, -mvPosition.z);
  float revealFade = smoothstep(0.0, 0.35, uReveal);
  float scrollFade = 1.0 - smoothstep(0.55, 1.0, uScroll);
  vAlpha = depthFade * revealFade * scrollFade * (0.30 + aScale * 0.42);
}
`

export const particlesFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uAccent;

varying float vAlpha;
varying float vSignal;
varying float vAccent;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  if (d > 0.25) discard;

  float falloff = smoothstep(0.25, 0.0, d);
  float accent = clamp(smoothstep(0.45, 1.0, vSignal) + vAccent, 0.0, 0.9);
  vec3 color = mix(uColor, uAccent, accent);

  gl_FragColor = vec4(color, falloff * vAlpha);
}
`

/**
 * Шейдер для всех линий сцены: «цифровых усов», хвоста-траектории и сигнальной
 * сетки. Материал один, различаются только параметры — иначе пришлось бы
 * держать три почти одинаковых шейдера.
 *
 * Толщина линий в WebGL всегда 1 пиксель (`lineWidth` игнорируется почти
 * везде), и это здесь скорее плюс: линии должны быть тонкими и не походить на
 * неоновые трубки.
 */

export const linesVertexShader = /* glsl */ `
uniform float uTime;
uniform float uReveal;
uniform float uInteraction;
uniform float uScroll;
uniform float uCases;
uniform float uContact;
uniform float uReducedMotion;
uniform float uBendScale;
uniform float uFlowScale;
uniform vec2  uPointer;

/** Положение вдоль линии, 0…1. */
attribute float aT;
/** Номер линии — разводит фазы импульсов. */
attribute float aLine;
/** Направление изгиба: −1 или 1 по X, 0 для сетки. */
attribute float aSide;

varying float vT;
varying float vLine;

void main() {
  vec3 p = position;
  float motion = 1.0 - uReducedMotion;

  /*
    Изгиб к указателю. Амплитуда растёт вдоль линии: у основания линия
    закреплена, к концу свободна — так изгиб выглядит как движение усов, а не
    как сдвиг всей фигуры.
  */
  float grip = pow(aT, 1.6);
  p.y += uPointer.y * grip * uBendScale * motion;
  p.x += uPointer.x * grip * uBendScale * 0.55 * motion * abs(aSide);

  // Медленное собственное колебание, чтобы линии не выглядели нарисованными.
  p.y += sin(uTime * 0.4 + aLine * 1.7 + aT * 2.4) * 0.035 * grip * motion;

  /*
    Наведение на интерактивный элемент выпрямляет линии на долю секунды —
    они становятся направляющими. При прокрутке тот же механизм уводит их вниз,
    к следующей секции.
  */
  float straighten = max(uCases, uContact);
  p.y = mix(p.y, position.y * (1.0 - straighten * 0.55), straighten * 0.7);
  p.y -= uScroll * uFlowScale * (0.6 + aT);

  // Вступление: линии прорастают от основания к концу.
  float grow = smoothstep(aT * 0.85, aT * 0.85 + 0.2, uReveal);
  p = mix(position * 0.2, p, grow);

  vT = aT;
  vLine = aLine;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
}
`

export const linesFragmentShader = /* glsl */ `
/*
  Именно highp, а не mediump: часть uniform-переменных объявлена и в вершинном
  шейдере, где точность по умолчанию высокая. При расхождении GLSL отказывается
  линковать программу — «Precisions of uniform 'uTime' differ».
*/
precision highp float;

uniform vec3  uColor;
uniform vec3  uAccent;
uniform float uTime;
uniform float uOpacity;
uniform float uReveal;
uniform float uScroll;
uniform float uPulseSpeed;
uniform float uPulseStrength;
uniform float uInteraction;
uniform float uReducedMotion;

varying float vT;
varying float vLine;

void main() {
  // Линия гаснет к концу — так она не обрывается в пустоте.
  float fade = smoothstep(1.0, 0.35, vT) * smoothstep(0.0, 0.08, vT);

  /*
    Бегущий импульс. Фазы линий разведены по номеру, скорость низкая:
    импульс должен восприниматься как редкий проход сигнала, а не как бегущая
    строка.
  */
  float head = fract(uTime * uPulseSpeed + vLine * 0.37);
  float pulse = exp(-pow((vT - head) * 9.0, 2.0)) * uPulseStrength;
  pulse *= 1.0 - uReducedMotion;

  vec3 color = mix(uColor, uAccent, clamp(pulse * 1.6, 0.0, 0.75));
  float alpha = uOpacity * fade * uReveal * (1.0 - smoothstep(0.6, 1.0, uScroll));
  alpha *= 1.0 + pulse * 2.2 + uInteraction * 0.35;

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`

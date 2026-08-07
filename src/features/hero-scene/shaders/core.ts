import { SIMPLEX_3D } from './noise'

/**
 * Ядро сцены — «живой металл».
 *
 * Узнаваемый силуэт теперь собирается несколькими объёмами в GreySignalCore,
 * а шейдер отвечает за общую живую поверхность и локальную волну от указателя.
 */

const SHAPE = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uReveal;
uniform float uInteraction;
uniform float uContact;
uniform float uReducedMotion;
uniform vec3  uPointerWorld;

/** Возвращает смещённую точку; поле шума отдаётся наружу для контуров. */
vec3 shapePosition(vec3 basePosition, out float field) {
  vec3 dir = normalize(basePosition);
  float slow = uTime * 0.075 * (1.0 - uReducedMotion * 0.85);

  // Доменное искажение: одна низкая октава задаёт крупную пластику.
  vec3 warp = vec3(
    snoise(dir * 0.70 + vec3(slow, 0.0, 0.0)),
    snoise(dir * 0.70 + vec3(0.0, slow, 11.3)),
    snoise(dir * 0.70 + vec3(4.7, 0.0, slow))
  );

  float base = snoise(dir * 1.15 + warp * 0.38);
  // Вторая октава слабая: нужна фактура металла, а не каменная корка.
  float detail = snoise(dir * 2.9 + warp * 0.2) * 0.18;
  field = base * 0.5 + 0.5;

  // Дыхание: очень медленное изменение амплитуды, период около 19 секунд.
  float breath = 1.0 + sin(uTime * 0.33) * 0.12 * (1.0 - uReducedMotion);

  // Локальная волна: гауссиана вокруг направления на указатель.
  float toPointer = dot(dir, uPointerWorld);
  float wave = exp(-pow((1.0 - toPointer) * 2.6, 2.0)) * uInteraction * 0.085;

  float offset = (base + detail) * uAmplitude * breath + wave;

  // Вступление: точки стартуют разбросанными и стягиваются к форме.
  float scatter = pow(1.0 - uReveal, 2.0);
  offset += snoise(dir * 2.2 + vec3(19.4)) * scatter * 1.35;

  vec3 displaced = basePosition * (1.0 + offset);
  // Лёгкое раскрытие при наведении на контакты.
  displaced.y *= 1.0 + uContact * 0.045;
  displaced.z *= 1.06;
  return displaced;
}
`

export const coreVertexShader = /* glsl */ `
${SIMPLEX_3D}
${SHAPE}

uniform float uSignalPhase;
uniform float uNormalEps;

varying vec3  vNormalW;
varying vec3  vPositionW;
varying vec3  vLocal;
varying float vField;
varying float vSignal;

void main() {
  float field;
  vec3 displaced = shapePosition(position, field);

  /*
    Нормаль пересчитывается численно: аналитическая производная доменно
    искажённого шума заметно дороже, а на глаз разница не видна. Шаг завязан на
    подразделение сетки — при слишком крупном шаге поверхность выглядела
    гранёной, это была одна из претензий к прошлой версии.
  */
  float radius = length(position);
  vec3 dir = position / radius;
  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, dir));
  vec3 bitangent = cross(dir, tangent);

  float ignored;
  vec3 pA = shapePosition(normalize(dir + tangent * uNormalEps) * radius, ignored);
  vec3 pB = shapePosition(normalize(dir + bitangent * uNormalEps) * radius, ignored);
  vec3 recomputed = normalize(cross(pA - displaced, pB - displaced));
  if (dot(recomputed, dir) < 0.0) recomputed = -recomputed;

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * recomputed);
  vPositionW = worldPosition.xyz;
  vLocal = displaced;
  vField = field;

  /*
    Бегущая сигнальная линия: узкая, проходит снизу вверх. У полюсов она
    гасится — там поверхность почти горизонтальна, и полоса постоянной высоты
    расплывалась в зелёное пятно на всю нижнюю часть объекта.
  */
  float band = displaced.y * 0.62 - uSignalPhase;
  float poles = 1.0 - pow(abs(normalize(displaced).y), 2.5);
  vSignal = exp(-band * band * 260.0) * poles;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

export const coreFragmentShader = /* glsl */ `
precision highp float;

varying vec3  vNormalW;
varying vec3  vPositionW;
varying vec3  vLocal;
varying float vField;
varying float vSignal;

uniform vec3  uColorDeep;
uniform vec3  uColorLift;
uniform vec3  uAccent;
uniform vec3  uCameraPosition;
uniform float uTime;
uniform float uReveal;
uniform float uInteraction;
uniform float uScroll;
uniform float uCases;
uniform float uContact;
uniform float uContours;
uniform float uReducedMotion;

/*
  Дешёвый хеш для порога растворения. Полноценный шум здесь не нужен: важна
  только мелкая нерегулярность края, а лишний вызов snoise во фрагментном
  шейдере стоит заметно дороже.
*/
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 normal = normalize(vNormalW);
  vec3 viewDir = normalize(uCameraPosition - vPositionW);

  // Ключевой свет сверху-слева, слабая заливка справа, ободок сзади.
  vec3 keyDir  = normalize(vec3(-0.5, 0.82, 0.55));
  vec3 fillDir = normalize(vec3(0.85, -0.25, 0.3));
  vec3 rimDir  = normalize(vec3(0.15, 0.35, -0.9));

  float key  = max(dot(normal, keyDir), 0.0);
  float fill = max(dot(normal, fillDir), 0.0);
  float rim  = pow(max(dot(normal, rimDir), 0.0), 2.2);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);

  // Два блика: широкий матовый и узкий металлический. Матовый преобладает —
  // объект не должен выглядеть отполированным.
  vec3 half1 = normalize(keyDir + viewDir);
  float soft = pow(max(dot(normal, half1), 0.0), 12.0) * 0.22;
  float sharp = pow(max(dot(normal, half1), 0.0), 90.0) * 0.35;

  vec3 color = mix(uColorDeep, uColorLift, key * 0.72 + fill * 0.2);
  color += vec3(0.82, 0.86, 0.93) * (soft + sharp);
  color += uColorLift * rim * 0.28;
  color += uColorLift * fresnel * 0.32;

  /*
    Контурные линии — изолинии того же поля, что задаёт форму. Дают ощущение
    просканированной поверхности; держатся на грани заметности, иначе объект
    превращается в топографическую карту.
  */
  if (uContours > 0.5) {
    float rings = abs(fract(vField * 7.0 - uTime * 0.03) - 0.5);
    float line = smoothstep(0.045, 0.0, rings);
    color += uColorLift * line * 0.10;
  }

  /*
    Сигнал. Узкая линия плюс её слабое свечение; акцент подмешивается в
    основном по касательным граням, чтобы объект оставался графитовым.
  */
  float signalStrength = (1.0 - uScroll * 0.6) * mix(0.6, 1.0, uReveal);
  float signal = smoothstep(0.35, 1.0, vSignal) * signalStrength;
  color = mix(color, uAccent, clamp(signal * (0.14 + fresnel * 0.55), 0.0, 0.22));
  color += uAccent * signal * 0.07;

  /*
    Наведение на «Обсудить проект»: ядро раскрывается — тёплый свет изнутри.
    Первая версия подмешивала акцент втрое сильнее, и на наведение зеленел весь
    первый экран. Сцена должна становиться теплее, а не менять цвет.
  */
  float inner = smoothstep(0.45, 0.0, fresnel);
  color += uAccent * inner * uContact * 0.045;
  color += vec3(0.05, 0.045, 0.03) * uContact;

  // Наведение на «Смотреть кейсы»: импульс проходит по объекту сверху вниз.
  float sweep = exp(-pow((vLocal.y * 0.6 + 0.6 - fract(uTime * 0.5) * 1.6) * 5.0, 2.0));
  color += uAccent * sweep * uCases * 0.18;

  // Движение курсора немного добавляет света — реакция должна ощущаться.
  color *= 1.0 + uInteraction * 0.09;

  // Низ приглушается: под объектом лежит заголовок первого экрана. Глубину
  // затемнения пришлось убавить — на постере низ объекта уходил в чёрное пятно.
  color *= smoothstep(-1.4, 0.6, vLocal.y) * 0.3 + 0.7;

  /*
    Растворение при прокрутке. Порог по тому же полю: объект не гаснет целиком,
    а рассыпается — и это визуально стыкуется с частицами, которые в этот
    момент вытягиваются вниз.
  */
  float dissolve = smoothstep(0.12, 0.92, uScroll);
  float threshold = vField * 0.72 + hash13(vLocal * 5.0) * 0.28;
  if (dissolve > 0.001 && threshold < dissolve) discard;
  float edge = smoothstep(dissolve, dissolve + 0.12, threshold);

  float alpha = mix(0.0, 1.0, smoothstep(0.0, 0.45, uReveal)) * edge;
  // Край растворения слегка подсвечивается акцентом.
  color += uAccent * (1.0 - edge) * dissolve * 0.5;

  gl_FragColor = vec4(color, alpha);
}
`

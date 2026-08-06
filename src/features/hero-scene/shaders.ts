/**
 * GLSL для сцены Grey Signal.
 *
 * Геометрия строится программно: икосаэдр смещается доменно-искажённым
 * симплекс-шумом. Освещение считается вручную (две направленные лампы + rim),
 * это дешевле полноценного PBR и даёт точный контроль над «сигналом» —
 * узкой полосой акцентного цвета, проходящей сквозь массу.
 */

// Классический 3D-симплекс-шум (реализация Ashima Arts, public domain).
const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

const DISPLACEMENT = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uSquash;

/*
  Форма объекта. Доменное искажение даёт «пластичную» массу, а uSquash
  слегка приплюскивает силуэт по вертикали и разводит две доли вверху —
  тот самый едва читаемый намёк на два «уха».
*/
vec3 shapePosition(vec3 basePosition) {
  vec3 p = basePosition;
  vec3 dir = normalize(p);
  float slow = uTime * 0.1;

  // Низкочастотное доменное искажение задаёт крупную пластику массы.
  vec3 warp = vec3(
    snoise(dir * 0.75 + vec3(slow, 0.0, 0.0)),
    snoise(dir * 0.75 + vec3(0.0, slow, 11.3)),
    snoise(dir * 0.75 + vec3(4.7, 0.0, slow))
  );

  float base = snoise(dir * 1.25 + warp * 0.4);
  // Вторая октава заметно слабее: нужна фактура, а не каменная корка.
  float detail = snoise(dir * 2.6 + warp * 0.25) * 0.22;

  // Две доли вверху — намёк на силуэт, а не мультяшные уши.
  float lobes = smoothstep(0.24, 0.98, dir.y) * pow(abs(dir.x), 1.5) * 0.42;

  float offset = (base + detail) * uAmplitude + lobes * uSquash;
  vec3 displaced = p * (1.0 + offset);
  displaced.y *= 1.0 - uSquash * 0.12;
  return displaced;
}
`

export const massVertexShader = /* glsl */ `
${SIMPLEX_3D}
${DISPLACEMENT}

varying vec3 vNormalW;
varying vec3 vPositionW;
varying float vSignal;
varying float vHeight;

uniform float uSignalPhase;

void main() {
  vec3 displaced = shapePosition(position);

  /*
    Нормаль пересчитывается численно: берём две точки рядом на исходной сфере,
    смещаем их тем же полем и строим нормаль по векторному произведению.
    Аналитическая производная доменно-искажённого шума дороже, а разница
    на глаз незаметна.
  */
  float radius = length(position);
  vec3 dir = position / radius;
  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, dir));
  vec3 bitangent = cross(dir, tangent);

  float eps = 0.02;
  vec3 pA = shapePosition(normalize(dir + tangent * eps) * radius);
  vec3 pB = shapePosition(normalize(dir + bitangent * eps) * radius);
  vec3 recomputed = normalize(cross(pA - displaced, pB - displaced));
  if (dot(recomputed, dir) < 0.0) recomputed = -recomputed;

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * recomputed);
  vPositionW = worldPosition.xyz;
  vHeight = displaced.y;

  // Сигнал — узкая полоса, идущая снизу вверх сквозь объект.
  float band = displaced.y * 0.5 - uSignalPhase;
  vSignal = exp(-band * band * 60.0);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

export const massFragmentShader = /* glsl */ `
precision highp float;

varying vec3 vNormalW;
varying vec3 vPositionW;
varying float vSignal;
varying float vHeight;

uniform vec3 uColorDeep;
uniform vec3 uColorLift;
uniform vec3 uSignalColor;
uniform vec3 uCameraPosition;
uniform float uSignalStrength;

void main() {
  vec3 normal = normalize(vNormalW);
  vec3 viewDir = normalize(uCameraPosition - vPositionW);

  vec3 keyDir = normalize(vec3(-0.55, 0.85, 0.6));
  vec3 fillDir = normalize(vec3(0.9, -0.2, 0.35));

  float key = max(dot(normal, keyDir), 0.0);
  float fill = max(dot(normal, fillDir), 0.0);

  // Металлический блик через модель Блинна — Фонга: дешевле полного PBR.
  vec3 halfVec = normalize(keyDir + viewDir);
  float spec = pow(max(dot(normal, halfVec), 0.0), 42.0);

  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.4);

  vec3 color = mix(uColorDeep, uColorLift, key * 0.86 + fill * 0.24);
  color += vec3(0.85, 0.88, 0.94) * spec * 0.6;
  color += uColorLift * fresnel * 0.5;

  /*
    Сигнальная полоса подсвечивает массу изнутри узкой линией.
    Максимум подмешивания намеренно низкий: объект должен остаться графитовым,
    а акцент — читаться как сигнал, а не как заливка.
  */
  /*
    Хвост гауссианы на почти чёрной поверхности читается как заливка, поэтому
    он обрезается: остаётся узкая линия, а не зелёная половина объекта.
  */
  float signal = smoothstep(0.62, 1.0, vSignal) * uSignalStrength;
  color = mix(color, uSignalColor, clamp(signal * (0.34 + fresnel * 0.9), 0.0, 0.58));
  // Тонкое свечение вокруг линии — сигнал должен «светиться», а не красить массу.
  color += uSignalColor * signal * 0.22;

  // Лёгкое затемнение низа сохраняет читаемость текста поверх сцены.
  color *= smoothstep(-2.1, 0.4, vHeight) * 0.4 + 0.6;

  gl_FragColor = vec4(color, 1.0);
}
`

export const particlesVertexShader = /* glsl */ `
${SIMPLEX_3D}

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uSignalPhase;

attribute float aScale;
attribute float aSeed;

varying float vAlpha;
varying float vSignal;

void main() {
  vec3 p = position;
  float t = uTime * 0.07 + aSeed * 6.2831;

  // Частицы медленно дрейфуют вокруг массы, не разлетаясь.
  p += vec3(
    snoise(p * 0.55 + vec3(t, 0.0, 0.0)),
    snoise(p * 0.55 + vec3(0.0, t, 3.1)),
    snoise(p * 0.55 + vec3(7.7, 0.0, t))
  ) * 0.22;

  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * aScale * uPixelRatio * (7.0 / -mvPosition.z);

  float band = p.y * 0.5 - uSignalPhase;
  vSignal = exp(-band * band * 36.0);
  vAlpha = smoothstep(9.0, 2.5, -mvPosition.z) * (0.35 + aScale * 0.45);
}
`

export const particlesFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uSignalColor;

varying float vAlpha;
varying float vSignal;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  if (d > 0.25) discard;
  float falloff = smoothstep(0.25, 0.0, d);
  vec3 color = mix(uColor, uSignalColor, clamp(smoothstep(0.4, 1.0, vSignal), 0.0, 0.85));
  gl_FragColor = vec4(color, falloff * vAlpha);
}
`

// Генерация собственных брендовых ассетов из дизайн-токенов.
// Ничего не скачивается: все файлы рисуются кодом.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const INK = '#0b0c0e'
const GRAPHITE = '#16181c'
const SIGNAL = '#c9f24a'
const SILVER = '#a8adb7'

const PUBLIC_DIR = path.resolve('public')
const SEED_DIR = path.resolve('src/seed-assets')

const markSvg = (size, background) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
  ${background ? `<rect width="28" height="28" fill="${background}"/>` : ''}
  <g fill="none" stroke="${SILVER}" stroke-width="1.4">
    <circle cx="9" cy="9" r="3.6" opacity="0.55"/>
    <circle cx="19" cy="9" r="3.6" opacity="0.55"/>
    <path d="M4.5 18.5c0-4.2 4.25-6.5 9.5-6.5s9.5 2.3 9.5 6.5c0 3.6-4.25 5.5-9.5 5.5s-9.5-1.9-9.5-5.5Z"/>
  </g>
  <path d="M9.5 18.5h9" stroke="${SIGNAL}" stroke-width="1.8" stroke-linecap="round"/>
</svg>`

/** OG-изображение по умолчанию: фирменный градиент + знак + название. */
const ogSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="72%" cy="28%" r="62%">
      <stop offset="0%" stop-color="#2b3038"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(80 78) scale(1.9)" fill="none" stroke="${SILVER}" stroke-width="1.4">
    <circle cx="9" cy="9" r="3.6" opacity="0.55"/>
    <circle cx="19" cy="9" r="3.6" opacity="0.55"/>
    <path d="M4.5 18.5c0-4.2 4.25-6.5 9.5-6.5s9.5 2.3 9.5 6.5c0 3.6-4.25 5.5-9.5 5.5s-9.5-1.9-9.5-5.5Z"/>
    <path d="M9.5 18.5h9" stroke="${SIGNAL}" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <text x="80" y="360" fill="#ffffff" font-family="Onest, Inter, sans-serif" font-size="92" font-weight="500" letter-spacing="-3">Серая Мышь</text>
  <text x="80" y="428" fill="${SILVER}" font-family="Inter, sans-serif" font-size="34">Тихо делаем заметные цифровые продукты.</text>
  <rect x="80" y="486" width="120" height="3" fill="${SIGNAL}"/>
</svg>`

/**
 * Обложки демонстрационных кейсов. Абстрактная графика из фирменных токенов —
 * ни одно изображение не заимствовано.
 */
const demoCoverSvg = (index, title) => {
  const angle = 18 + index * 27
  const seedX = 220 + index * 130
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
  <defs>
    <linearGradient id="bg${index}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GRAPHITE}"/>
      <stop offset="100%" stop-color="${INK}"/>
    </linearGradient>
    <radialGradient id="halo${index}" cx="${30 + index * 12}%" cy="${28 + index * 9}%" r="55%">
      <stop offset="0%" stop-color="#3a4049" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3a4049" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="1200" fill="url(#bg${index})"/>
  <rect width="1600" height="1200" fill="url(#halo${index})"/>
  <g stroke="${SILVER}" stroke-opacity="0.16" stroke-width="1">
    ${Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${i * 90}" x2="1600" y2="${i * 90 - 220}"/>`).join('')}
  </g>
  <g transform="rotate(${angle} 800 600)">
    <ellipse cx="800" cy="600" rx="${300 + index * 26}" ry="${186 + index * 14}" fill="none" stroke="${SILVER}" stroke-opacity="0.5" stroke-width="2"/>
    <ellipse cx="800" cy="600" rx="${210 + index * 20}" ry="${120 + index * 10}" fill="none" stroke="${SILVER}" stroke-opacity="0.28" stroke-width="1.5"/>
    <path d="M${seedX} 600 H${seedX + 460}" stroke="${SIGNAL}" stroke-width="6" stroke-linecap="round"/>
  </g>
  <text x="90" y="1110" fill="${SILVER}" font-family="JetBrains Mono, monospace" font-size="30" letter-spacing="4">${title}</text>
</svg>`
}

const run = async () => {
  await mkdir(PUBLIC_DIR, { recursive: true })
  await mkdir(SEED_DIR, { recursive: true })

  await writeFile(path.join(PUBLIC_DIR, 'favicon.svg'), markSvg(32, INK).trim())
  await writeFile(path.join(PUBLIC_DIR, 'icon.svg'), markSvg(512, INK).trim())

  await sharp(Buffer.from(markSvg(180, INK)))
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-icon.png'))

  await sharp(Buffer.from(ogSvg()))
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, 'og-default.jpg'))

  const demoTitles = [
    'DEMO / ПЛАТФОРМА',
    'DEMO / СЕРВИС',
    'DEMO / ПРИЛОЖЕНИЕ',
    'DEMO / САЙТ',
    'DEMO / ПАНЕЛЬ',
  ]
  for (const [index, title] of demoTitles.entries()) {
    await sharp(Buffer.from(demoCoverSvg(index, title)))
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(path.join(SEED_DIR, `demo-cover-${index + 1}.jpg`))
  }

  console.log('brand assets written to public/ and src/seed-assets/')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

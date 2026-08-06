/**
 * Снимает постер первого экрана из самой сцены.
 *
 * Постер отрисовывается сервером до загрузки бандла и остаётся единственным
 * изображением там, где сцена не запускается (нет WebGL, слабое устройство).
 * Поэтому он обязан показывать ту же композицию — иначе при загрузке кадр
 * заметно «переключается», а на слабых устройствах виден вообще другой объект.
 *
 * Снимается только canvas, без текста: текст рисует HTML поверх.
 *
 *   node scripts/hero-poster.mjs            # сайт на http://127.0.0.1:3000
 *   SITE_URL=... node scripts/hero-poster.mjs
 */
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const BASE = process.env.SITE_URL || 'http://127.0.0.1:3000'
const OUT = process.env.OUT || 'public/hero-poster.jpg'
const EXECUTABLE = process.env.CHROMIUM_PATH

const browser = await chromium.launch({
  ...(EXECUTABLE ? { executablePath: EXECUTABLE } : {}),
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()
await page.goto(BASE, { waitUntil: 'load' })

// Сцене нужно время: она стартует после `load` и следующего простоя, затем
// проигрывает вступление. Снимаем уже в спокойном состоянии.
await page.waitForSelector('canvas', { timeout: 20000 })

/*
  Скриншот элемента снимает всю область кадра под ним, а не только сам элемент:
  без этого в постер попадали и текст первого экрана, и предыдущая версия
  постера, лежащая под canvas. Слои помечены в Hero.tsx.
*/
await page.addStyleTag({
  content: `
    header, [data-hero-copy], [data-hero-poster], [data-hero-overlay] {
      visibility: hidden !important;
    }
  `,
})

await page.waitForTimeout(9000)

const canvas = page.locator('canvas').first()
const shot = await canvas.screenshot({ omitBackground: true })

await browser.close()

/*
  Canvas прозрачный, а постер лежит на тёмном фоне секции — подкладываем тот же
  цвет, иначе JPEG подставит белый. Затем лёгкое размытие: постер виден доли
  секунды, зато без него на нём читались бы фасетки геометрии.
*/
await sharp({
  create: { width: 1600, height: 900, channels: 4, background: '#0b0c0e' },
})
  .composite([{ input: await sharp(shot).blur(0.6).toBuffer() }])
  .jpeg({ quality: 72, progressive: true })
  .toFile(OUT)

console.log(`Постер сохранён: ${OUT}`)

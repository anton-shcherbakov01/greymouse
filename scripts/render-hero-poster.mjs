// Рендер постера первого экрана из настоящей сцены Grey Signal.
//
// Постер показывается, пока сцена грузится, при prefers-reduced-motion и при
// отсутствии WebGL. Он снимается с работающего dev-сервера, поэтому это
// действительно тот же объект, а не отдельная нарисованная картинка.
import { chromium } from '@playwright/test'
import path from 'node:path'
import sharp from 'sharp'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

const BASE = process.env.SITE_URL || 'http://127.0.0.1:3000'
const OUTPUT = path.resolve('public/hero-poster.jpg')

const run = async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'gm-poster-'))
  const rawPath = path.join(workDir, 'raw.png')

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
  })
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 })
  // Даём сцене собраться и выйти на характерное состояние.
  await page.waitForSelector('canvas', { timeout: 30000 })
  await page.waitForTimeout(9000)

  // Текст, кнопки и шапка прячутся: в постер должна попасть только сцена.
  await page.addStyleTag({
    content: `header, .gm-container, .gm-skip-link, img { visibility: hidden !important; }`,
  })
  await page.waitForTimeout(400)

  const canvas = page.locator('canvas').first()
  await canvas.screenshot({ path: rawPath })

  await ctx.close()
  await browser.close()

  await sharp(rawPath)
    .resize(1920, 1080, { fit: 'cover' })
    .jpeg({ quality: 72, mozjpeg: true, progressive: true })
    .toFile(OUTPUT)

  await rm(workDir, { recursive: true, force: true })
  console.log(`hero poster written to ${OUTPUT}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

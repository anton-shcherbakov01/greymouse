// Углублённый разбор dna.inc — основного визуального ориентира.
// Отдельный прогон: нужны длительное ожидание, разбор состояния первого экрана,
// canvas/WebGL, поведение курсора и скролла.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const URL_ = 'https://www.dna.inc/'
const DIR = path.resolve('research/references/dna-inc')
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  proxy: process.env.RESEARCH_PROXY ? { server: process.env.RESEARCH_PROXY } : undefined,
  args: [
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    ...(process.env.RESEARCH_PROXY ? ['--ssl-version-max=tls1.2'] : []),
  ],
})

const report = {}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(URL_, { waitUntil: 'load', timeout: 90000 })

// Ждём дольше: у сайта есть вступительная сцена.
for (const wait of [1000, 3000, 6000, 10000]) {
  await page.waitForTimeout(wait === 1000 ? 1000 : 2000)
  await page.screenshot({ path: path.join(DIR, `intro-${wait}ms.png`) })
}

report.introState = await page.evaluate(() => {
  const overlays = Array.from(document.querySelectorAll('body > *, main > *'))
    .slice(0, 25)
    .map((el) => {
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        tag: el.tagName,
        cls: String(el.className).slice(0, 70),
        pos: s.position,
        z: s.zIndex,
        bg: s.backgroundColor,
        opacity: s.opacity,
        visibility: s.visibility,
        transform: s.transform.slice(0, 50),
        rect: [Math.round(r.width), Math.round(r.height)],
      }
    })
  const canvas = document.querySelector('canvas')
  const canvasInfo = canvas
    ? (() => {
        const r = canvas.getBoundingClientRect()
        const s = getComputedStyle(canvas)
        const parent = canvas.parentElement
        const ps = parent ? getComputedStyle(parent) : null
        return {
          rect: [Math.round(r.width), Math.round(r.height)],
          attrW: canvas.width,
          attrH: canvas.height,
          display: s.display,
          opacity: s.opacity,
          position: s.position,
          parentTag: parent?.tagName,
          parentCls: String(parent?.className).slice(0, 80),
          parentRect: parent
            ? [
                Math.round(parent.getBoundingClientRect().width),
                Math.round(parent.getBoundingClientRect().height),
              ]
            : null,
          parentPosition: ps?.position,
          parentHeight: ps?.height,
        }
      })()
    : null

  const firstScreenText = Array.from(document.querySelectorAll('h1,h2,h3,p,a,button'))
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight && r.height > 0
    })
    .slice(0, 20)
    .map((el) => {
      const s = getComputedStyle(el)
      return {
        tag: el.tagName,
        text: (el.textContent || '').trim().slice(0, 70),
        opacity: s.opacity,
        color: s.color,
        size: s.fontSize,
        clip: s.clipPath.slice(0, 40),
        transform: s.transform.slice(0, 40),
      }
    })

  return { overlays, canvasInfo, firstScreenText, bodyClass: document.body.className, htmlClass: document.documentElement.className }
})

// Проверяем реакцию на движение курсора рядом со сценой
await page.mouse.move(400, 400)
await page.waitForTimeout(600)
await page.mouse.move(1100, 620, { steps: 20 })
await page.waitForTimeout(900)
await page.screenshot({ path: path.join(DIR, 'hero-pointer.png') })

// Скролл небольшими шагами: фиксируем трансформацию сцены
for (const y of [200, 500, 900, 1500]) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y)
  await page.waitForTimeout(1400)
  await page.screenshot({ path: path.join(DIR, `scroll-${y}.png`) })
}

report.afterScroll = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  const r = canvas?.getBoundingClientRect()
  return {
    scrollY: window.scrollY,
    canvasRect: r ? [Math.round(r.width), Math.round(r.height), Math.round(r.top)] : null,
    canvasStyle: canvas ? getComputedStyle(canvas).transform.slice(0, 60) : null,
  }
})

// Мобильный первый экран с длительным ожиданием
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const mpage = await mctx.newPage()
await mpage.goto(URL_, { waitUntil: 'load', timeout: 90000 })
await mpage.waitForTimeout(8000)
await mpage.screenshot({ path: path.join(DIR, 'mobile-hero-long.png') })
report.mobileCanvas = await mpage.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return null
  const r = c.getBoundingClientRect()
  return { rect: [Math.round(r.width), Math.round(r.height)], attr: [c.width, c.height] }
})
await mctx.close()

// Поведение без WebGL: подменяем getContext
const nowebgl = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await nowebgl.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (typeof type === 'string' && type.includes('webgl')) return null
    return original.call(this, type, ...rest)
  }
})
const wpage = await nowebgl.newPage()
try {
  await wpage.goto(URL_, { waitUntil: 'load', timeout: 60000 })
  await wpage.waitForTimeout(9000)
  await wpage.screenshot({ path: path.join(DIR, 'no-webgl.png') })
  report.noWebglText = await wpage.evaluate(() => document.body.innerText.trim().slice(0, 300))
} catch (e) {
  report.noWebglError = e.message.slice(0, 150)
}
await nowebgl.close()

await ctx.close()
await browser.close()
await writeFile(path.join(DIR, 'deep-dive.json'), JSON.stringify(report, null, 2))
console.log('dna deep dive done')
console.log(JSON.stringify(report.introState?.canvasInfo, null, 1))

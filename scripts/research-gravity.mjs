// Отдельный прогон для gravity.nl: сайт принимает только TLS 1.3, который
// Chromium не может согласовать через прокси песочницы. Используем
// TLS-терминирующий релей (scripts/tls-terminating-relay.mjs).
// Проверка сертификата gravity.nl выполняется в Node внутри релея.
import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SITE = { id: 'gravity', url: 'https://gravity.nl/' }
const OUT = path.resolve('research/references')
const PROXY = process.env.MITM_PROXY || 'http://127.0.0.1:33130'

const { collectSignals, autoScroll } = await import('./research-shared.mjs')

const dir = path.join(OUT, SITE.id)
await mkdir(dir, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  proxy: { server: PROXY },
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})

const entry = { url: SITE.url, errors: [], researchNote: 'TLS-терминирующий релей (см. docs/reference-research.md)' }

const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const page = await ctx.newPage()
const consoleErrors = []
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)))

try {
  const resp = await page.goto(SITE.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  entry.status = resp?.status()
  entry.headers = resp?.headers()
  await page.waitForTimeout(4500)
  await page.screenshot({ path: path.join(dir, 'desktop-hero.png') })
  entry.desktopSignalsAtLoad = await collectSignals(page)

  try {
    const card = page.locator('a[href*="case"], a[href*="work"], article a, li a').first()
    if (await card.count()) {
      await card.hover({ timeout: 4000 })
      await page.waitForTimeout(900)
      await page.screenshot({ path: path.join(dir, 'desktop-hover.png') })
    }
  } catch (e) {
    entry.errors.push(`hover: ${e.message.slice(0, 120)}`)
  }

  await autoScroll(page)
  await page.screenshot({ path: path.join(dir, 'desktop-fullpage.png'), fullPage: true })
  entry.desktopSignalsAfterScroll = await collectSignals(page)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(dir, 'desktop-mid.png') })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(dir, 'desktop-lower.png') })
  entry.consoleErrors = consoleErrors.slice(0, 10)
} catch (e) {
  entry.errors.push(`desktop: ${e.message.slice(0, 200)}`)
}
await ctx.close()

const mctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
const mpage = await mctx.newPage()
try {
  await mpage.goto(SITE.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await mpage.waitForTimeout(4000)
  await mpage.screenshot({ path: path.join(dir, 'mobile-hero.png') })
  entry.mobileSignals = await collectSignals(mpage)
  try {
    const burger = mpage.locator('header button, button[aria-label*="enu" i]').first()
    if (await burger.count()) {
      await burger.click({ timeout: 4000 })
      await mpage.waitForTimeout(1200)
      await mpage.screenshot({ path: path.join(dir, 'mobile-menu.png') })
    }
  } catch (e) {
    entry.errors.push(`mobile-menu: ${e.message.slice(0, 120)}`)
  }
  await autoScroll(mpage, 500, 25)
  await mpage.screenshot({ path: path.join(dir, 'mobile-fullpage.png'), fullPage: true })
} catch (e) {
  entry.errors.push(`mobile: ${e.message.slice(0, 200)}`)
}
await mctx.close()

const rctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
})
const rpage = await rctx.newPage()
try {
  await rpage.goto(SITE.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await rpage.waitForTimeout(3000)
  await rpage.screenshot({ path: path.join(dir, 'desktop-reduced-motion.png') })
} catch (e) {
  entry.errors.push(`reduced-motion: ${e.message.slice(0, 150)}`)
}
await rctx.close()

const njctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1440, height: 900 },
  javaScriptEnabled: false,
})
const njpage = await njctx.newPage()
try {
  await njpage.goto(SITE.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await njpage.waitForTimeout(2500)
  await njpage.screenshot({ path: path.join(dir, 'desktop-nojs.png') })
  entry.noJsTextLength = (await njpage.evaluate(() => document.body.innerText.trim().length)) || 0
  entry.noJsH1 = await njpage.evaluate(
    () => document.querySelector('h1')?.textContent?.trim().slice(0, 120) || null,
  )
} catch (e) {
  entry.errors.push(`nojs: ${e.message.slice(0, 150)}`)
}
await njctx.close()
await browser.close()

const signalsPath = path.join(OUT, 'signals.json')
const all = JSON.parse(await readFile(signalsPath, 'utf8'))
all[SITE.id] = entry
await writeFile(signalsPath, JSON.stringify(all, null, 2))
console.log(`gravity done: status=${entry.status} errors=${entry.errors.length}`)

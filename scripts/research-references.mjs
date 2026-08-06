// Внутренний исследовательский скрипт: снимает скриншоты и технические признаки
// с референсных сайтов. Результат используется только в research/ и docs/.
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = path.resolve('research/references')

const SITES = [
  { id: 'dna-inc', url: 'https://www.dna.inc/' },
  { id: 'gravity', url: 'https://gravity.nl/' },
  { id: 'duodeka', url: 'https://www.duodeka.com/' },
  { id: 'lightbase', url: 'https://lightbase.nl/diensten' },
  { id: 'bravoure', url: 'https://bravoure.nl/en' },
  { id: 'yummygum', url: 'https://www.yummygum.com/cases' },
  { id: 'globalorange', url: 'https://www.globalorange.nl/cases/' },
]

const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }

async function autoScroll(page, step = 600, maxSteps = 40) {
  for (let i = 0; i < maxSteps; i += 1) {
    const done = await page.evaluate((s) => {
      const before = window.scrollY
      window.scrollBy(0, s)
      return window.scrollY === before
    }, step)
    await page.waitForTimeout(350)
    if (done) break
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(600)
}

async function collectSignals(page) {
  return page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map((s) => s.src)
    const links = Array.from(document.querySelectorAll('link[href]')).map(
      (l) => `${l.rel}:${l.href}`,
    )
    const metas = Array.from(document.querySelectorAll('meta[name],meta[property]')).map(
      (m) => `${m.getAttribute('name') || m.getAttribute('property')}=${m.getAttribute('content')}`,
    )
    const canvases = Array.from(document.querySelectorAll('canvas')).map((c) => {
      const r = c.getBoundingClientRect()
      let ctxKind = 'unknown'
      try {
        // Проба контекста неразрушающая: если WebGL уже занят, getContext вернёт его же.
        if (c.getContext('webgl2')) ctxKind = 'webgl2'
        else if (c.getContext('webgl')) ctxKind = 'webgl'
      } catch {
        ctxKind = 'locked'
      }
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        cls: c.className,
        parent: c.parentElement?.tagName,
        ctxKind,
      }
    })
    const cs = getComputedStyle(document.body)
    const rootStyle = getComputedStyle(document.documentElement)
    const cssVars = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules)
        } catch {
          return []
        }
      })
      .filter((r) => r.selectorText === ':root' || r.selectorText === 'html')
      .flatMap((r) => Array.from(r.style).filter((p) => p.startsWith('--')))
      .slice(0, 80)

    const headings = Array.from(document.querySelectorAll('h1,h2')).slice(0, 12).map((h) => {
      const s = getComputedStyle(h)
      return {
        tag: h.tagName,
        text: (h.textContent || '').trim().slice(0, 90),
        size: s.fontSize,
        weight: s.fontWeight,
        family: s.fontFamily.split(',')[0],
        tracking: s.letterSpacing,
        lh: s.lineHeight,
      }
    })

    const globals = [
      'gsap',
      'ScrollTrigger',
      'THREE',
      'Lenis',
      'lenis',
      '__NEXT_DATA__',
      '__NUXT__',
      'Webflow',
      'Barba',
      'Swiper',
      'Alpine',
      '__remixContext',
      '__sveltekit',
    ].filter((k) => k in window)

    const anims = Array.from(document.querySelectorAll('*'))
      .slice(0, 4000)
      .reduce(
        (acc, el) => {
          const s = getComputedStyle(el)
          if (s.transitionDuration !== '0s') acc.transitions.add(`${s.transitionDuration}|${s.transitionTimingFunction}`)
          if (s.animationName !== 'none') acc.animations.add(`${s.animationName}|${s.animationDuration}`)
          if (s.position === 'sticky') acc.sticky += 1
          if (s.mixBlendMode !== 'normal') acc.blend += 1
          return acc
        },
        { transitions: new Set(), animations: new Set(), sticky: 0, blend: 0 },
      )

    return {
      title: document.title,
      lang: document.documentElement.lang,
      bodyBg: cs.backgroundColor,
      bodyColor: cs.color,
      bodyFont: cs.fontFamily,
      rootFontSize: rootStyle.fontSize,
      scriptCount: scripts.length,
      scripts: scripts.slice(0, 60),
      preloads: links.filter((l) => l.startsWith('preload') || l.startsWith('modulepreload')).slice(0, 30),
      fonts: links.filter((l) => /\.(woff2?|ttf)/i.test(l)).slice(0, 20),
      metas: metas.slice(0, 40),
      canvases,
      cssVars,
      headings,
      globals,
      transitions: Array.from(anims.transitions).slice(0, 25),
      animations: Array.from(anims.animations).slice(0, 25),
      stickyCount: anims.sticky,
      blendCount: anims.blend,
      domNodes: document.querySelectorAll('*').length,
      navHtml: (document.querySelector('header,nav')?.outerHTML || '').slice(0, 1500),
    }
  })
}

async function run() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    // Chromium не читает HTTPS_PROXY из окружения — прокси задаётся явно.
    // RESEARCH_PROXY указывает на локальный CONNECT-релей (scripts/proxy-relay.mjs).
    proxy: process.env.RESEARCH_PROXY ? { server: process.env.RESEARCH_PROXY } : undefined,
    args: [
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--no-sandbox',
      // Через MITM-прокси песочницы TLS 1.3 handshake браузера сбрасывается;
      // проверка сертификата при этом остаётся включённой.
      ...(process.env.RESEARCH_PROXY ? ['--ssl-version-max=tls1.2'] : []),
    ],
  })
  const report = {}

  for (const site of SITES) {
    const dir = path.join(OUT, site.id)
    await mkdir(dir, { recursive: true })
    const entry = { url: site.url, errors: [] }
    console.log(`\n=== ${site.id} :: ${site.url}`)

    const ctx = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1, locale: 'en-US' })
    const page = await ctx.newPage()
    const requests = []
    const consoleErrors = []
    page.on('request', (r) => requests.push({ url: r.url(), type: r.resourceType() }))
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)))

    try {
      const resp = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      entry.status = resp?.status()
      entry.headers = resp?.headers()
      await page.waitForTimeout(4500)
      await page.screenshot({ path: path.join(dir, 'desktop-hero.png') })
      entry.desktopSignalsAtLoad = await collectSignals(page)

      // hover по первой карточке/ссылке — фиксируем изменение стилей
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

      // середина страницы — секции услуг/кейсов
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35))
      await page.waitForTimeout(1200)
      await page.screenshot({ path: path.join(dir, 'desktop-mid.png') })
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75))
      await page.waitForTimeout(1200)
      await page.screenshot({ path: path.join(dir, 'desktop-lower.png') })

      entry.consoleErrors = consoleErrors.slice(0, 10)
      entry.requestSummary = requests.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1
        return acc
      }, {})
      entry.jsRequests = requests.filter((r) => r.type === 'script').map((r) => r.url).slice(0, 40)
      entry.fontRequests = requests.filter((r) => r.type === 'font').map((r) => r.url).slice(0, 20)
    } catch (e) {
      entry.errors.push(`desktop: ${e.message.slice(0, 200)}`)
    }
    await ctx.close()

    // mobile
    const mctx = await browser.newContext({
      viewport: MOBILE,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    const mpage = await mctx.newPage()
    try {
      await mpage.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await mpage.waitForTimeout(4000)
      await mpage.screenshot({ path: path.join(dir, 'mobile-hero.png') })
      entry.mobileSignals = await collectSignals(mpage)
      // попытка открыть мобильное меню
      try {
        const burger = mpage
          .locator(
            'button[aria-label*="enu" i], button[class*="burger" i], button[class*="menu" i], [role="button"][class*="menu" i], header button',
          )
          .first()
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

    // reduced motion + no-JS проверка
    const rctx = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' })
    const rpage = await rctx.newPage()
    try {
      await rpage.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await rpage.waitForTimeout(3000)
      await rpage.screenshot({ path: path.join(dir, 'desktop-reduced-motion.png') })
    } catch (e) {
      entry.errors.push(`reduced-motion: ${e.message.slice(0, 150)}`)
    }
    await rctx.close()

    const njctx = await browser.newContext({ viewport: DESKTOP, javaScriptEnabled: false })
    const njpage = await njctx.newPage()
    try {
      await njpage.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
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

    report[site.id] = entry
    console.log(`   done: status=${entry.status} errors=${entry.errors.length}`)
  }

  await browser.close()
  await writeFile(path.join(OUT, 'signals.json'), JSON.stringify(report, null, 2))
  console.log('\nWROTE research/references/signals.json')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

// Общие утилиты исследовательских прогонов (скриншоты и сбор технических признаков).
export async function autoScroll(page, step = 600, maxSteps = 40) {
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

export async function collectSignals(page) {
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


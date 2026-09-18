import { test, expect, type Page } from '@playwright/test'

async function load(page: Page) {
  await page.goto('./')
  await expect(page.getByLabel('Sonuç özeti')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

async function scrollTo(page: Page, top: number) {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top)
}

async function sidebarBox(page: Page) {
  return page.locator('aside').evaluate(element => {
    const box = element.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, height: box.height }
  })
}

test.use({ reducedMotion: 'reduce' })

test('long sidebar scrolls to its end, then sticks and adapts to content and viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await load(page)
  const initial = await sidebarBox(page)
  expect(initial.height).toBeGreaterThan(900)
  await scrollTo(page, 300)
  await expect.poll(async () => (await sidebarBox(page)).top).toBeCloseTo(initial.top - 300, 0)

  const pinAfter = initial.bottom - 900 + 12
  await scrollTo(page, pinAfter + 100)
  await expect.poll(async () => (await sidebarBox(page)).bottom).toBeCloseTo(888, 0)
  await scrollTo(page, pinAfter + 400)
  await expect.poll(async () => (await sidebarBox(page)).bottom).toBeCloseTo(888, 0)
  await expect.poll(() => page.locator('header').first().evaluate(e => e.getBoundingClientRect().top)).toBe(0)

  await page.setViewportSize({ width: 1440, height: 760 })
  await expect.poll(async () => (await sidebarBox(page)).bottom).toBeCloseTo(748, 0)
  await scrollTo(page, 0)
  const summary = page.locator('aside summary').filter({ hasText: 'Keşif kaynağı' })
  await summary.click()
  await expect.poll(async () => (await sidebarBox(page)).height).toBeGreaterThan(initial.height)
  const expanded = await sidebarBox(page)
  await scrollTo(page, expanded.height + 100)
  await expect.poll(async () => (await sidebarBox(page)).bottom).toBeCloseTo(748, 0)

  await page.setViewportSize({ width: 1440, height: 3000 })
  await scrollTo(page, 100)
  await expect.poll(async () => (await sidebarBox(page)).top).toBeCloseTo(77, 0)
})

test('pointer focus has no stray outline, borders remain, keyboard focus stays visible', async ({ page, browserName }) => {
  // Safari on macOS uses Option+Tab to include links and buttons in keyboard navigation.
  const tabKey = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await page.setViewportSize({ width: 1440, height: 900 })
  await load(page)
  const heading = page.getByRole('heading', { name: 'r25 · Kapsam ve ilişki tamamlama', exact: true })
  const card = heading.locator('xpath=ancestor::section[1]')
  const border = await card.evaluate(e => getComputedStyle(e).borderTopWidth)
  expect(parseFloat(border)).toBeGreaterThan(0)
  await heading.click()
  await expect(page.locator('main')).toBeFocused()
  await expect(page.locator('main')).toHaveCSS('outline-style', 'none')
  await expect(card).toHaveCSS('border-top-width', border)

  const opener = page.getByRole('button', { name: 'Sırala B2B önceliği' })
  await opener.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true }).click()
  await expect(opener).toHaveCSS('outline-style', 'none')
  await expect(opener).toHaveCSS('border-top-width', '2px')
  const summary = page.locator('aside summary').first()
  await summary.click()
  await expect(summary).toHaveCSS('outline-style', 'none')

  await page.reload()
  await expect(page.getByLabel('Sonuç özeti')).toBeVisible()
  await page.keyboard.press(tabKey)
  await expect(page.getByRole('link', { name: 'Ana içeriğe geç' })).toBeFocused()
  await expect(page.getByRole('link', { name: 'Ana içeriğe geç' })).toHaveCSS('outline-width', '4px')
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await expect(page.locator('main')).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press(tabKey)
  await expect(page.getByRole('searchbox')).toBeFocused()
  await page.keyboard.press(tabKey)
  await expect(opener).toBeFocused()
  await expect(opener).toHaveCSS('outline-style', 'solid')
  await expect(opener).toHaveCSS('outline-width', '4px')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await expect(opener).toHaveCSS('outline-style', 'solid')
})

test('mobile sidebar remains independently scrollable with reachable final filters', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/istoc-b2b-backlog/')
  await expect(page.getByLabel('Sonuç özeti')).toBeVisible()
  await page.getByRole('button', { name: 'Menüyü aç', exact: true }).tap()
  const sidebar = page.locator('aside')
  await expect(sidebar).toHaveCSS('position', 'fixed')
  await sidebar.evaluate(e => { e.scrollTop = e.scrollHeight })
  await expect(sidebar.getByLabel('Kaldırılanları göster')).toBeInViewport()
  const before = await sidebarBox(page)
  expect(before.top).toBeGreaterThanOrEqual(64)
  expect(before.bottom).toBeLessThanOrEqual(780)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})

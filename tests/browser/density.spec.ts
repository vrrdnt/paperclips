import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function load(page: Page, density = 'auto', frozen = true) {
  await page.addInitScript(({ save, density, frozen }) => {
    if (frozen) {
      Date.now = () => 1789200000000;
      Math.random = () => .5;
      window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    }
    if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', save);
    if (!localStorage.getItem('paperclips.density')) localStorage.setItem('paperclips.density', density);
  }, { save: readFileSync('dev-saves/06-phase3-space.json', 'utf8'), density, frozen });
  await page.goto('/');
  await expect(page.locator('.app-body')).toBeVisible();
}

async function choose(page: Page, value: string) {
  await page.locator('[data-header-actions]').click();
  await page.getByRole('combobox', { name: 'Interface density', exact: true }).selectOption(value);
  await expect(page.locator('#header-actions')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-header-actions]')).toBeFocused();
}

test('keyboard selection persists, applies on first render, and preserves game and mounted panels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page);
  await page.getByRole('tab', { name: 'Fleet', exact: true }).click();
  await page.locator('.app-body').evaluate(el => el.setAttribute('data-mount-witness', 'retained'));
  const before = await page.evaluate(async () => {
    const runtime = '/src/game/runtime.ts', codec = '/src/game/saveCodec.ts';
    return (await import(codec)).serializeSave((await import(runtime)).game.state, 123);
  });
  await page.locator('[data-header-actions]').focus();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
  const select = page.getByRole('combobox', { name: 'Interface density', exact: true });
  await expect(select).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(select).toHaveValue('compact');
  await expect(page.locator('#header-actions')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-header-actions]')).toBeFocused();
  await expect(page.locator('[data-mount-witness="retained"]')).toHaveCount(1);
  await expect(page.getByRole('tab', { name: 'Fleet', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(async () => {
    const runtime = '/src/game/runtime.ts', codec = '/src/game/saveCodec.ts';
    return (await import(codec)).serializeSave((await import(runtime)).game.state, 123);
  })).toBe(before);
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.getElementById('root')?.childElementCount) {
        document.documentElement.dataset.firstRenderDensity = document.documentElement.dataset.density;
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-first-render-density', 'compact');
  await page.locator('[data-header-actions]').click();
  await expect(select).toHaveValue('compact');
});

test('imports and resets retain density, while exports contain no presentation preference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page, 'compact');
  await page.getByRole('tab', { name: 'Fleet', exact: true }).click();
  await page.locator('[data-header-actions]').click();
  await page.getByRole('button', { name: 'Import save', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 330 });
  await page.getByRole('textbox', { name: 'Save string', exact: true }).fill(Buffer.from(readFileSync('dev-saves/03-phase1-late.json', 'utf8')).toString('base64'));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await expect(page.getByRole('tab', { name: 'Production' })).toHaveAttribute('aria-selected', 'true');
  const exported = await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    return JSON.parse(atob((await import(path)).game.export()));
  });
  expect(exported.version).toBe(1);
  expect(exported.state).not.toHaveProperty('density');
  await page.setViewportSize({ width: 390, height: 700 });
  await page.locator('[data-header-actions]').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Make Paperclip', exact: true })).toBeVisible();
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  expect(await page.evaluate(() => localStorage.getItem('paperclips.density'))).toBe('compact');
});

test('blocked preference storage remains usable without disturbing game storage', async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { if (key === 'paperclips.density') throw new Error('blocked'); return get.call(this, key); };
    Storage.prototype.setItem = function(key, value) { if (key === 'paperclips.density') throw new Error('blocked'); set.call(this, key, value); };
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'auto');
  await choose(page, 'compact');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await page.getByRole('button', { name: 'Make Paperclip', exact: true }).click();
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state.clips)).toBe(1);
});

test('unknown preference restores Auto', async ({ page }) => {
  await load(page, 'invalid-density');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'auto');
});

test('changing density retains a section scroll position through rotation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await load(page);
  await page.getByRole('tab', { name: 'Fleet', exact: true }).click();
  await page.evaluate(() => scrollTo(0, 250));
  await choose(page, 'compact');
  const compactScroll = await page.evaluate(() => scrollY);
  expect(compactScroll).toBeGreaterThan(0);
  await page.getByRole('tab', { name: 'Computing', exact: true }).click();
  await page.getByRole('tab', { name: 'Fleet', exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(compactScroll);
  await page.setViewportSize({ width: 800, height: 1280 });
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(page.getByRole('tab', { name: 'Fleet', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(compactScroll);
});

test('changing density cancels a held allocation without purchasing again', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const epoch = new Date('2026-09-13T00:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await load(page, 'auto', false);
  await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    (await import(path)).game.act((state: { probeTrust: number }) => { state.probeTrust = 100; });
  });
  await page.getByRole('tab', { name: 'Fleet', exact: true }).click();
  const button = page.getByRole('button', { name: 'Increase Speed', exact: true });
  await button.scrollIntoViewIfNeeded();
  const readSpeed = () => page.evaluate(async () => { const path = '/src/game/runtime.ts'; return (await import(path)).game.state.probeSpeed; });
  const before = await readSpeed();
  const pointer = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: 10, clientY: 10 };
  await button.dispatchEvent('pointerdown', pointer);
  await page.clock.runFor(700);
  expect(await readSpeed()).toBe(before + 1);
  await choose(page, 'compact');
  await page.clock.runFor(1500);
  await button.dispatchEvent('pointerup', pointer);
  await button.dispatchEvent('click');
  expect(await readSpeed()).toBe(before + 1);
});

for (const [width, height, touch] of [[1280, 800, true], [800, 1280, true], [1024, 768, true], [640, 800, true], [1440, 900, false], [1280, 720, false]] as const) {
  test(`density comparison at ${width}x${height}, ${touch ? 'touch' : 'mouse'}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    await load(page);
    const sizes = await page.locator('.stat-label:visible').evaluateAll(elements => elements.map(el => getComputedStyle(el).fontSize));
    const originalHeight = (await page.locator('.app-body').boundingBox())!.height;
    for (const density of ['compact', 'comfortable', 'auto']) {
      await choose(page, density);
      expect(await page.locator('.stat-label:visible').evaluateAll(elements => elements.map(el => getComputedStyle(el).fontSize))).toEqual(sizes);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (density === 'compact') expect((await page.locator('.app-body').boundingBox())!.height).toBeLessThan(originalHeight);
      if (touch || density === 'comfortable') {
        const min = density === 'compact' ? 40 : 48;
        const tooSmall = await page.locator('.app-body button:visible, .app-body select:visible').evaluateAll((els, min) => els.filter(el => {
          const r = el.getBoundingClientRect(); return r.width < min || r.height < min;
        }).map(el => el.textContent), min);
        expect(tooSmall).toEqual([]);
      }
    }
    await context.close();
  });
}

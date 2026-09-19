import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const epoch = new Date('2026-09-20T00:00:00Z');
async function state(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    return structuredClone((await import(path)).game.state);
  });
}
async function visibility(page: Page, value: 'hidden' | 'visible') {
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
}
async function load(page: Page, project: number, mode: 'twa' | 'pwa' | 'browser', initiallyHidden = false) {
  await page.clock.install({ time: epoch }); await page.clock.pauseAt(epoch);
  const fixture = JSON.parse(readFileSync('dev-saves/03-phase1-late.json', 'utf8'));
  if (project) fixture.projectFlags[project] = 1;
  await page.addInitScript(({ fixture, mode, initiallyHidden }) => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) Chrome/140.0 Mobile Safari/537.36' });
    if (mode === 'twa') Object.defineProperty(document, 'referrer', { value: 'android-app://ps.papercli.app/' });
    if (mode === 'pwa') {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = query => {
        const result = matchMedia(query);
        if (query.includes('display-mode')) Object.defineProperty(result, 'matches', { value: true });
        return result;
      };
    }
    if (initiallyHidden) Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    localStorage.setItem('upc_v2', JSON.stringify({ format: 'paperclips', version: 1,
      savedAt: Date.now() - (initiallyHidden ? 120000 : 0), state: fixture }));
  }, { fixture, mode, initiallyHidden });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
}

for (const [project, minutes] of [[0, 0], [220, 5], [221, 10], [222, 15]]) {
  test(`Android app backgrounding uses the ${minutes}-minute tier once`, async ({ page }) => {
    await load(page, project, 'twa');
    await page.clock.runFor(500);
    const before = await state(page);
    await visibility(page, 'hidden');
    await page.clock.runFor(1000);
    expect(await state(page)).toEqual(before);
    await page.clock.setSystemTime(new Date(epoch.getTime() + 20 * 60000 + 500));
    await visibility(page, 'visible');
    expect((await state(page)).ticks).toBe(before.ticks + minutes * 6000);
    await visibility(page, 'visible');
    expect((await state(page)).ticks).toBe(before.ticks + minutes * 6000);
    await page.clock.runFor(50);
    expect((await state(page)).ticks).toBe(before.ticks + minutes * 6000 + 5);
  });
}

test('an Android browser tab continues while hidden without an offline project', async ({ page }) => {
  await load(page, 0, 'browser');
  const before = await state(page);
  await visibility(page, 'hidden');
  await page.clock.setSystemTime(new Date(epoch.getTime() + 59950));
  await page.clock.runFor(50);
  expect((await state(page)).ticks).toBe(before.ticks + 6000);
});

test('an installed Android PWA pauses and reconciles on return', async ({ page }) => {
  await load(page, 220, 'pwa');
  const before = await state(page);
  await visibility(page, 'hidden');
  await page.clock.runFor(1000);
  expect(await state(page)).toEqual(before);
  await page.clock.setSystemTime(new Date(epoch.getTime() + 20 * 60000));
  await visibility(page, 'visible');
  expect((await state(page)).ticks).toBe(before.ticks + 30000);
});

test('an Android app opened hidden preserves the closed interval until foregrounded', async ({ page }) => {
  await load(page, 220, 'twa', true);
  const before = await state(page);
  await page.clock.runFor(60000);
  expect(await state(page)).toEqual(before);
  await visibility(page, 'visible');
  expect((await state(page)).ticks).toBe(before.ticks + 18000);
});

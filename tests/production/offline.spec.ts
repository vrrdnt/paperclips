import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('the built PWA reconciles a month once, capped by its purchased project', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = JSON.parse(readFileSync('dev-saves/03-phase1-late.json', 'utf8'));
  state.projectFlags[220] = 1;
  await page.addInitScript(state => {
    Date.now = () => 1789776000000;
    if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', JSON.stringify({
      format: 'paperclips', version: 1, savedAt: Date.now() - 30 * 86400000, state,
    }));
  }, state);
  await page.goto('/');
  await expect(page.getByText('Central coordination restored.', { exact: true })).toBeVisible();
  const returned = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!));
  expect(returned.state.ticks).toBe(state.ticks + 30000);
  expect(returned.state.clips).toBeGreaterThan(state.clips);
  expect(returned.savedAt).toBe(1789776000000);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
  await page.locator('.header-save-btn').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state.ticks)).toBe(returned.state.ticks);
  expect(errors).toEqual([]);
});

test('the built app retains progress and reloads without a network', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const makeClip = page.getByRole('button', { name: 'Make Paperclip', exact: true });
  await makeClip.click();
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Game saved', exact: true })).toBeVisible();
  // Activation follows successful app-shell precaching, including built JS/CSS.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(makeClip).toBeVisible();
  await expect(page.locator('.header-clip-number')).toHaveText('1');
  await makeClip.click();
  await expect(page.locator('.header-clip-number')).toHaveText('2');
  expect(errors).toEqual([]);
});

test('the built app retires old catch-up debt and pauses background production', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-13T00:00:00Z'));
  const original = JSON.parse(readFileSync('dev-saves/03-phase1-late.json', 'utf8'));
  await page.addInitScript(state => {
    localStorage.setItem('upc_v2', JSON.stringify({
      format: 'paperclips', version: 1, savedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      state: { ...state, randomState: 123, catchUpTicksRemaining: 817200000 },
    }));
  }, original);
  await page.goto('/');
  const save = page.locator('.header-save-btn');
  await save.click();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state);
  expect(restored.clips).toBe(original.clips);
  expect(restored.ticks).toBe(original.ticks);
  expect(restored.randomState).toBe(123);
  expect(restored).not.toHaveProperty('catchUpTicksRemaining');
  await expect(page.getByLabel('Catching up idle progress')).toHaveCount(0);
  await page.clock.runFor(500);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const paused = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state);
  expect(paused.ticks).toBe(restored.ticks + 50);
  expect(paused.clips).toBeGreaterThan(restored.clips);
  await page.clock.runFor(3000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await save.click();
  const returned = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state);
  expect(returned).toEqual(paused);
  await page.clock.runFor(50);
  await save.click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state.ticks)).toBe(paused.ticks + 5);
  expect(errors).toEqual([]);
});

test('the built mobile PWA keeps sections and log usable offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const fixture = readFileSync('dev-saves/06-phase3-space.json', 'utf8');
  await page.addInitScript(save => {
    if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', save);
  }, fixture);
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByRole('tab', { name: 'Fleet' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Fleet' })).toBeVisible();
  await page.getByRole('button', { name: 'Full history' }).click();
  await page.goBack();
  await expect(page.getByRole('dialog', { name: 'Log history' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Fleet' })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.header-save-btn').click();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!));
  expect(save.state).not.toHaveProperty('selectedSection');
  expect(save.state).not.toHaveProperty('logExpanded');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Production' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Computing' }).click();
  await expect(page.getByText('Quantum Computing', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Full history' }).click();
  await expect(page.getByRole('dialog', { name: 'Log history' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Full history' })).toBeFocused();
});

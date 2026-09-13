import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function liveState(page: Page) {
  return page.evaluate(async () => {
    const modulePath = '/src/game/runtime.ts';
    const { game } = await import(modulePath);
    return structuredClone(game.state);
  });
}

async function visibility(page: Page, state: 'visible' | 'hidden') {
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-13T00:00:00Z'));
  const state = JSON.parse(readFileSync('dev-saves/03-phase1-late.json', 'utf8'));
  await page.addInitScript(save => {
    if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', JSON.stringify(save));
  }, state);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
});

test('visible AFK play runs at 1x, hidden timers pause, and return resumes immediately', async ({ page }) => {
  const start = await liveState(page);
  await page.clock.runFor(1000);
  const active = await liveState(page);
  expect(active.ticks).toBe(start.ticks + 100);
  expect(active.clips).toBeGreaterThan(start.clips);
  await visibility(page, 'hidden');
  const paused = await liveState(page);
  await page.clock.runFor(3000);
  expect(await liveState(page)).toEqual(paused);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state);
  expect(saved.clips).toBe(paused.clips);
  expect(saved.ticks).toBe(paused.ticks);
  await visibility(page, 'visible');
  await visibility(page, 'visible');
  expect(await liveState(page)).toEqual(paused);
  await page.clock.runFor(50);
  expect((await liveState(page)).ticks).toBe(paused.ticks + 5);
  await expect(page.getByLabel('Catching up idle progress')).toHaveCount(0);
});

test('a long callback gap without visibility events is discarded', async ({ page }) => {
  const before = await liveState(page);
  await page.clock.setSystemTime(new Date('2026-10-13T00:00:00Z'));
  await page.clock.runFor(50);
  expect(await liveState(page)).toEqual(before);
  await page.clock.runFor(50);
  expect((await liveState(page)).ticks).toBe(before.ticks + 5);
});

for (const [pauseEvent, resumeEvent, target] of [
  ['freeze', 'resume', 'document'],
  ['pagehide', 'pageshow', 'window'],
] as const) {
  test(`${pauseEvent}/${resumeEvent} saves and pauses until a visible return`, async ({ page }) => {
    await page.clock.runFor(50);
    const before = await liveState(page);
    await page.evaluate(({ pauseEvent, target }) => {
      (target === 'document' ? document : window).dispatchEvent(new Event(pauseEvent));
    }, { pauseEvent, target });
    await page.clock.runFor(500);
    expect(await liveState(page)).toEqual(before);
    await visibility(page, 'hidden');
    await page.evaluate(({ resumeEvent, target }) => {
      (target === 'document' ? document : window).dispatchEvent(new Event(resumeEvent));
    }, { resumeEvent, target });
    await page.clock.runFor(500);
    expect(await liveState(page)).toEqual(before);
    await visibility(page, 'visible');
    await page.clock.runFor(50);
    expect((await liveState(page)).ticks).toBe(before.ticks + 5);
  });
}

test('a page initially loaded in the background waits until visible', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  });
  await page.reload();
  const before = await liveState(page);
  await page.clock.runFor(3000);
  expect(await liveState(page)).toEqual(before);
  await visibility(page, 'visible');
  await page.clock.runFor(50);
  expect((await liveState(page)).ticks).toBe(before.ticks + 5);
});

test('a months-old save with pending debt opens without catch-up and explains the policy', async ({ page }) => {
  const before = await liveState(page);
  await page.addInitScript(state => {
    localStorage.setItem('upc_v2', JSON.stringify({
      format: 'paperclips', version: 1, savedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      state: { ...state, catchUpTicksRemaining: 817200000 },
    }));
  }, before);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
  const after = await liveState(page);
  for (const key of ['clips', 'funds', 'ticks', 'randomState']) expect(after[key]).toBe(before[key]);
  expect(after).not.toHaveProperty('catchUpTicksRemaining');
  await expect(page.getByLabel('Catching up idle progress')).toHaveCount(0);
  await page.getByRole('button', { name: 'More actions' }).click();
  await expect(page.getByRole('note')).toHaveText('Progress pauses while the game is in the background or closed.');
});

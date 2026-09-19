import { renderText } from '../../src/i18n/core';
import type { LocalizedText } from '../../src/i18n/message';
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

test('visible, unfocused and hidden browser tabs all progress at 1x and autosave', async ({ page }) => {
  const start = await liveState(page);
  await page.clock.runFor(1000);
  const active = await liveState(page);
  expect(active.ticks).toBe(start.ticks + 100);
  expect(active.clips).toBeGreaterThan(start.clips);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(1000);
  expect((await liveState(page)).ticks).toBe(start.ticks + 200);
  await visibility(page, 'hidden');
  await page.clock.runFor(3000);
  const background = await liveState(page);
  expect(background.ticks).toBe(start.ticks + 500);
  expect(background.clips).toBeGreaterThan(active.clips);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state);
  expect(saved.ticks).toBeGreaterThan(active.ticks);
  await visibility(page, 'visible');
  await visibility(page, 'visible');
  expect(await liveState(page)).toEqual(background);
  await page.clock.runFor(50);
  expect((await liveState(page)).ticks).toBe(background.ticks + 5);
  await expect(page.getByLabel('Catching up idle progress')).toHaveCount(0);
});

test('twenty minutes with once-a-minute browser callbacks needs no offline unlock', async ({ page }) => {
  const before = await liveState(page);
  await visibility(page, 'hidden');
  for (let minute = 1; minute <= 20; minute++) {
    await page.clock.setSystemTime(new Date(Date.parse('2026-09-13T00:00:00Z') + minute * 60000 - 50));
    await page.clock.runFor(50);
  }
  expect((await liveState(page)).ticks).toBe(before.ticks + 120000);
  await visibility(page, 'visible');
  expect((await liveState(page)).ticks).toBe(before.ticks + 120000);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  expect((await liveState(page)).readouts.some((line: LocalizedText) => renderText(line).startsWith('Autonomous cycle'))).toBe(false);
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
  test(`${pauseEvent}/${resumeEvent} pauses a suspended browser until its matching resume event`, async ({ page }) => {
    await page.clock.runFor(50);
    const before = await liveState(page);
    await page.evaluate(({ pauseEvent, target }) => {
      (target === 'document' ? document : window).dispatchEvent(new Event(pauseEvent));
    }, { pauseEvent, target });
    await page.clock.runFor(500);
    expect(await liveState(page)).toEqual(before);
    await visibility(page, 'hidden');
    await visibility(page, 'visible');
    await page.clock.runFor(500);
    expect(await liveState(page)).toEqual(before);
    await visibility(page, 'hidden');
    await page.evaluate(({ resumeEvent, target }) => {
      (target === 'document' ? document : window).dispatchEvent(new Event(resumeEvent));
    }, { resumeEvent, target });
    await page.clock.runFor(500);
    expect((await liveState(page)).ticks).toBe(before.ticks + 50);
    await visibility(page, 'visible');
    await page.clock.runFor(50);
    expect((await liveState(page)).ticks).toBe(before.ticks + 55);
  });
}

test('a browser page initially loaded in the background runs without waiting for focus', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  });
  await page.reload();
  const before = await liveState(page);
  await page.clock.runFor(3000);
  expect((await liveState(page)).ticks).toBe(before.ticks + 300);
  await visibility(page, 'visible');
  await page.clock.runFor(50);
  expect((await liveState(page)).ticks).toBe(before.ticks + 305);
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
  await expect(page.getByRole('note')).toHaveText('Open browser tabs continue running. Unlock Autonomous Routines in Projects for offline progress after closing the game or backgrounding the Android app.');
});

test('closing and reopening a browser uses its purchased offline tier once', async ({ page, context }) => {
  await page.getByRole('button', { name: /^Autonomous Routines / }).click();
  await page.locator('.header-save-btn').click();
  const before = await liveState(page);
  await page.close();
  const reopened = await context.newPage();
  const later = new Date('2026-09-13T00:20:00Z');
  await reopened.clock.install({ time: later }); await reopened.clock.pauseAt(later);
  await reopened.goto('/');
  await expect(reopened.getByText('Central coordination restored.', { exact: true })).toBeVisible();
  expect((await liveState(reopened)).ticks).toBe(before.ticks + 30000);
  await reopened.reload();
  await expect(reopened.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
  expect((await liveState(reopened)).ticks).toBe(before.ticks + 30000);
  await reopened.close();
});

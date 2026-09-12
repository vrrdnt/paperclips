import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function loadStage(page: Page, name: string, overrides: Record<string, unknown> = {}) {
  const state = { ...JSON.parse(readFileSync(`dev-saves/${name}`, 'utf8')), ...overrides };
  await page.addInitScript(save => {
    Date.now = () => 1789200000000;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify(save));
    localStorage.setItem('upc_v2_saved_at', String(Date.now()));
  }, state);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
}

async function liveState(page: Page) {
  return page.evaluate(async () => {
    const modulePath = '/src/game/runtime.ts';
    const { game } = await import(modulePath);
    return structuredClone(game.state);
  });
}

test('manual production updates immediately and survives an actual reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Make Paperclip', exact: true }).click();
  expect((await liveState(page)).clips).toBe(1);
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Make Paperclip', exact: true })).toBeVisible();
  expect((await liveState(page)).clips).toBe(1);
});

test('two project click events cannot repeat an upgrade or overspend', async ({ page }) => {
  await loadStage(page, '01-phase1-start.json', { projectFlags: {}, operations: 750, standardOps: 750 });
  const button = page.getByRole('button', { name: /^Improved AutoClippers / });
  await expect(button).toBeEnabled();
  const before = (await liveState(page)).clipperBoost;
  await button.evaluate(element => { (element as HTMLButtonElement).click(); (element as HTMLButtonElement).click(); });
  const after = await liveState(page);
  expect(after.clipperBoost).toBe(before + 0.25);
  expect(after.operations).toBe(0);
  await expect(button).toHaveCount(0);
});

test('invalid imports leave current progress intact and show an error', async ({ page }) => {
  await loadStage(page, '03-phase1-late.json');
  const before = (await liveState(page)).clips;
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Import save' }).click();
  await page.getByPlaceholder('Paste save string here…').fill('e30=');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByText('Missing or invalid clips.', { exact: true })).toBeVisible();
  expect((await liveState(page)).clips).toBe(before);
});

test('legacy save import replaces the stage and resets the displayed strategy', async ({ page }) => {
  await loadStage(page, '03-phase1-late.json');
  const oldSave = JSON.parse(readFileSync('dev-saves/02-phase1-strategy.json', 'utf8'));
  oldSave.selectedStrategy = 'B100';
  const encoded = Buffer.from(JSON.stringify(oldSave)).toString('base64');
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Import save' }).click();
  await page.getByPlaceholder('Paste save string here…').fill(encoded);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('.strat-select:not(.investment-risk-select)')).toHaveValue('B100');
  expect((await liveState(page)).clips).toBe(oldSave.clips);
});

test('final wire is clickable and the final credits become reachable', async ({ page }) => {
  const ending = JSON.parse(readFileSync('dev-saves/07-phase3-endgame.json', 'utf8'));
  await loadStage(page, '07-phase3-endgame.json', {
    dismantle: 7, wire: 100, nanoWire: 100, processors: 0, memory: 0,
    factoryLevel: 0, harvesterLevel: 0, wireDroneLevel: 0, finalClips: 0, probeCount: 0, drifterCount: 0,
    endTimer4: 1000, endTimer6: 0,
    projectFlags: { ...ending.projectFlags, 213: 1, 214: 1, 215: 1, 216: 1 },
  });
  const button = page.getByRole('button', { name: 'Make Paperclip', exact: true });
  await expect(button).toBeVisible();
  await button.evaluate(element => { for (let i = 0; i < 100; i++) (element as HTMLButtonElement).click(); });
  await expect(button).toBeDisabled();
  const state = await liveState(page);
  expect(state.wire).toBe(0);
  expect(state.finalClips).toBe(100);
  await page.evaluate(async () => {
    const runtimePath = '/src/game/runtime.ts', loopPath = '/src/game/loop.ts';
    const { game } = await import(runtimePath);
    const { tick } = await import(loopPath);
    for (let i = 0; i < 1000; i++) tick(game.state);
    // Notify the mounted application's subscription (also works after Vite HMR).
    window.dispatchEvent(new Event('pageshow'));
  });
  expect((await liveState(page)).endTimer6).toBe(1000);
  await expect(page.getByText('© 2017 Everybody House Games', { exact: true })).toBeVisible();
});

test('Save reports failure instead of claiming success when storage is full', async ({ page }) => {
  await loadStage(page, '01-phase1-start.json');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  const dialog = page.waitForEvent('dialog');
  const clicked = page.getByRole('button', { name: 'Save game', exact: true }).click();
  const alert = await dialog;
  expect(alert.message()).toContain('could not be saved');
  await alert.dismiss();
  await clicked;
  await expect(page.getByRole('button', { name: 'Game saved', exact: true })).toHaveCount(0);
});

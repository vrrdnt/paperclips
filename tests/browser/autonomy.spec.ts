import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const epoch = new Date('2026-09-19T00:00:00Z');
async function live(page: Page) {
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

for (const width of [320, 390, 1280]) {
  test(`purchases autonomy and reports a capped return at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install({ time: epoch }); await page.clock.pauseAt(epoch);
    const state = JSON.parse(readFileSync('dev-saves/03-phase1-late.json', 'utf8'));
    await page.addInitScript(state => {
      if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', JSON.stringify(state));
    }, state);
    await page.goto('/');
    if (width < 768) await page.getByRole('tab', { name: 'Projects', exact: true }).click();
    await page.getByRole('button', { name: /^Autonomous Routines / }).click();
    expect((await live(page)).projectFlags[220]).toBe(1);
    const before = await live(page);
    await visibility(page, 'hidden');
    await page.clock.setSystemTime(new Date(epoch.getTime() + 30 * 86400000));
    await visibility(page, 'visible');
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    const after = await live(page);
    expect(after.ticks).toBe(before.ticks + 30000);
    expect(after.readouts.slice(0, 3).reverse()).toEqual([
      expect.stringMatching(/^Autonomous cycle complete\. .+ clips created in 5m\.$/),
      'Execution horizon reached. Systems entered standby.', 'Central coordination restored.',
    ]);
    await expect(page.getByText('Central coordination restored.', { exact: true })).toBeVisible();
    if (width < 768) await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute('aria-selected', 'true');
    if (width === 390) await expect(page).toHaveScreenshot('autonomous-return-390.png', { animations: 'disabled' });
    await page.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('note')).toHaveText('Existing automation continues for up to 5 minutes while away. Unused time is discarded.');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Full history' }).click();
    await expect(page.getByRole('dialog')).toContainText('Autonomous cycle complete.');
    await page.keyboard.press('Escape');
    await page.reload();
    expect((await live(page)).ticks).toBe(after.ticks);
    expect((await live(page)).projectFlags[220]).toBe(1);
  });
}

test('a combat return yields between batches and protects controls until finished', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const state = JSON.parse(readFileSync('dev-saves/06-phase3-space.json', 'utf8'));
  Object.assign(state, { probeCount: 1e12, drifterCount: 1e10, probeRep: 10, probeHaz: 10,
    probeCombat: 5, probeSpeed: 2, probeNav: 2, probeTrust: 29, randomState: 1234 });
  state.projectFlags[222] = 1;
  await page.addInitScript(state => {
    Date.now = () => 1789776000000;
    // Keep real performance.now so reconciliation must respect its CPU budget.
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify({ format: 'paperclips', version: 1,
      savedAt: Date.now() - 30 * 86400000, state }));
  }, state);
  await page.goto('/');
  await expect(page.getByRole('progressbar', { name: 'Reconciling autonomous activity' })).toBeVisible();
  await expect(page.locator('[inert]')).toHaveCount(1);
  await expect(page.locator('.autonomous-status')).toHaveScreenshot('autonomous-reconciliation-390.png', {
    animations: 'disabled', mask: [page.locator('progress')], maskColor: '#555555',
  });
  expect((await live(page)).ticks).toBeLessThan(state.ticks + 90000);
  await page.evaluate(async () => {
    const path = '/src/game/runtime.ts'; const { game } = await import(path);
    game.act((s: { funds: number }) => { s.funds = 12345; });
    let batches = 0;
    while (game.offlineProgress !== null && batches++ < 10000) game.step();
  });
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.locator('[inert]')).toHaveCount(0);
  const after = await live(page);
  expect(after.ticks).toBe(state.ticks + 90000);
  expect(after.funds).not.toBe(12345);
  expect(after.battleId).toBeGreaterThan(state.battleId ?? 0);
  await expect(page.getByText('Central coordination restored.', { exact: true })).toBeVisible();
});

test('swarm and space upgrades appear in sequence and explain the new horizon', async ({ page }) => {
  const state = JSON.parse(readFileSync('dev-saves/06-phase3-space.json', 'utf8'));
  state.projectFlags[220] = 1;
  Object.assign(state, { operations: 200000, standardOps: 200000, tempOps: 0, yomi: 5000, swarmFlag: 1 });
  await page.addInitScript(state => {
    Date.now = () => 1789776000000;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify(state));
  }, state);
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Persistent Directives / })).toHaveCount(0);
  await page.getByRole('button', { name: /^Distributed Scheduling / }).click();
  await page.getByRole('button', { name: /^Persistent Directives / }).click();
  const after = await live(page);
  expect(after.projectFlags[221]).toBe(1); expect(after.projectFlags[222]).toBe(1);
  expect(after.operations).toBe(50000); expect(after.yomi).toBe(0);
  await page.getByRole('button', { name: 'More actions' }).click();
  await expect(page.getByRole('note')).toContainText('up to 15 minutes');
});

import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { ARTIFACTS } from '../../src/game/artifacts';

async function load(page: Page, file: string, locale = 'en-XA') {
  await page.addInitScript(({ save, locale }) => {
    Date.now = () => 1789200000000;
    Math.random = () => .5;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', save);
    if (!localStorage.getItem('paperclips.locale')) localStorage.setItem('paperclips.locale', locale);
  }, { save: readFileSync(`dev-saves/${file}`, 'utf8'), locale });
  await page.goto('/');
  await expect(page.locator('.app-body')).toBeVisible();
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    const runtime = '/src/game/runtime.ts', codec = '/src/game/saveCodec.ts';
    return (await import(codec)).serializeSave((await import(runtime)).game.state, 123);
  });
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const clipped = await page.locator('.section-card:visible, .section-tabs:visible, .game-dialog[open]').evaluateAll(elements =>
    elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent?.slice(0, 150)));
  expect(clipped).toEqual([]);
}

for (const width of [320, 390, 768, 1280]) {
  for (const file of readdirSync('dev-saves').filter(file => file.endsWith('.json'))) {
    test(`expanded text: ${file} at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await load(page, file);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-XA');
      const before = await saved(page);
      await noOverflow(page);
      for (const tab of await page.locator('.section-tabs [role="tab"]').all()) {
        await tab.click();
        await noOverflow(page);
      }
      await page.locator('.console-open').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await noOverflow(page);
      await page.keyboard.press('Escape');
      expect(await saved(page)).toBe(before);
      expect(errors).toEqual([]);
    });
  }
}

test('language selection persists without resetting navigation, logs, or game state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await load(page, '06-phase3-space.json', 'en');
  await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  const before = await saved(page);
  const englishLog = await page.locator('.console-preview').innerText();
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('combobox', { name: 'Choose language' }).selectOption('en-XA');
  await page.keyboard.press('Escape');
  await expect(page.locator('#section-tab-Projects')).toHaveAttribute('aria-selected', 'true');
  expect(await page.locator('.console-preview').innerText()).not.toBe(englishLog);
  expect(await saved(page)).toBe(before);
  await page.locator('.console-open').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.console-open')).toBeFocused();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-XA');
  expect(await page.evaluate(() => localStorage.getItem('paperclips.locale'))).toBe('en-XA');
  // Switching back also retranslates messages emitted before the switch.
  await page.locator('[aria-haspopup="menu"]').click();
  await page.locator('.language-setting select').selectOption('en');
  await page.keyboard.press('Escape');
  expect(await page.locator('.console-preview').innerText()).toBe(englishLog);
});

test('a translated strategy label still submits the canonical strategy ID', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await load(page, '03-phase1-late.json');
  await page.locator('#section-tab-Strategy').click();
  const select = page.locator('.strat-select').first();
  await select.selectOption('GREEDY');
  expect(JSON.parse(await saved(page)).state.selectedStrategy).toBe('GREEDY');
  await page.locator('.game-panel-slot[data-section="Strategy"] .btn').first().click();
  const state = JSON.parse(await saved(page)).state;
  expect(state.currentTournament.stratH).toBe('GREEDY');
  expect(state.currentTournament.ticksRemaining).toBeGreaterThan(0);
});

test('unknown or unavailable locale preferences fall back to English', async ({ page }) => {
  await load(page, '01-phase1-start.json', 'missing-language');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Make Paperclip' })).toBeVisible();
});

for (const width of [320, 390]) {
  test(`expanded artifact collection and menu stay usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await load(page, '06-phase3-space.json');
    await page.evaluate(async ids => {
      const path = '/src/game/runtime.ts';
      const { game } = await import(path);
      game.act((state: { collectedArtifacts: string[] }) => { state.collectedArtifacts = ids; });
    }, ARTIFACTS.map(a => a.id));
    await page.locator('.app-header-right .btn').filter({ has: page.locator('svg.lucide-map') }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.artifact-item')).toHaveCount(32);
    await dialog.locator('.artifact-item').last().scrollIntoViewIfNeeded();
    await noOverflow(page);
    const last = (await dialog.locator('.artifact-item').last().boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(700);
    const clipped = await dialog.locator('.artifact-item').evaluateAll(items => items.filter(el => el.scrollWidth > el.clientWidth + 1).length);
    expect(clipped).toBe(0);
    await page.keyboard.press('Escape');
    await page.locator('[aria-haspopup="menu"]').click();
    await page.locator('.language-setting select').scrollIntoViewIfNeeded();
    const picker = (await page.locator('.language-setting select').boundingBox())!;
    expect(picker.y + picker.height).toBeLessThanOrEqual(700);
  });
}

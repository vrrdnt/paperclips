import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { ARTIFACTS } from '../../src/game/artifacts';

async function load(page: Page, file = '03-phase1-late.json', collection = false) {
  const state = JSON.parse(readFileSync(`dev-saves/${file}`, 'utf8'));
  if (collection) Object.assign(state, { prestigeU: 3, prestigeS: 2,
    collectedArtifacts: ARTIFACTS.map(a => a.id), activeArtifacts: ARTIFACTS.slice(0, 4).map(a => a.id),
    completedMapCells: Array.from({ length: 100 }, (_, i) => `${i % 10 + 1}:${Math.floor(i / 10) + 1}`),
  });
  await page.addInitScript(state => {
    Date.now = () => 1789200000000;
    Math.random = () => .5;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify(state));
  }, state);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
}

async function withinViewport(page: Page, element: Locator) {
  const rect = (await element.boundingBox())!;
  const viewport = await page.evaluate(() => ({ height: visualViewport!.height, width: visualViewport!.width, top: visualViewport!.offsetTop }));
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.y).toBeGreaterThanOrEqual(viewport.top);
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + viewport.top + 1);
}

test.describe('artifact visibility', () => {
  test.use({ hasTouch: true, isMobile: true });
  for (const [width, height] of [[320, 568], [390, 700], [600, 800], [768, 1024], [844, 390], [1280, 720]]) {
    test(`the entire collection and map remain reachable at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await load(page, '03-phase1-late.json', true);
      await page.getByRole('button', { name: 'Artifact map', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Artifact map' });
      const close = dialog.getByRole('button', { name: 'Close', exact: true });
      await withinViewport(page, dialog);
      await withinViewport(page, close);
      await expect(dialog.getByRole('tab', { name: 'Artifacts (32)', exact: true })).toHaveAttribute('aria-selected', 'true');
      const rows = dialog.locator('.artifact-item');
      await expect(rows).toHaveCount(32);
      await rows.last().scrollIntoViewIfNeeded();
      await withinViewport(page, rows.last());
      await withinViewport(page, close);
      expect(await dialog.evaluate(el => el.scrollTop)).toBe(0);
      expect(await rows.last().evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const filter = dialog.getByRole('searchbox', { name: 'Filter artifacts' });
      await filter.fill('quark');
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText('Quark-Gluon Plasma Heart');
      await filter.fill('no such artifact');
      await expect(dialog.getByText('No matching artifacts.')).toBeVisible();
      await filter.fill('');
      await dialog.getByRole('tab', { name: 'Artifacts (32)', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(dialog.getByRole('tab', { name: 'World map', exact: true })).toBeFocused();
      const lastSquare = dialog.getByRole('button', { name: /^World 10, Simulation 10/ });
      await lastSquare.scrollIntoViewIfNeeded();
      await withinViewport(page, lastSquare);
      const square = (await lastSquare.boundingBox())!;
      expect(square.width).toBeGreaterThanOrEqual(48);
      expect(square.height).toBeGreaterThanOrEqual(48);
      await withinViewport(page, close);
      await close.click();
      await expect(page.getByRole('button', { name: 'Artifact map', exact: true })).toBeFocused();
    });
  }
});

test('four complete late-business projects fit at 390x700 with readable descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page);
  await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  const cards = page.locator('.project-reveal:visible');
  await expect(cards).toHaveCount(4);
  const nav = (await page.getByRole('tablist', { name: 'Game sections' }).boundingBox())!;
  expect((await cards.last().boundingBox())!.y + (await cards.last().boundingBox())!.height).toBeLessThan(nav.y);
  expect(await cards.locator('.project-btn-desc').evaluateAll(els => els.every(el => parseFloat(getComputedStyle(el).fontSize) >= 14 && el.scrollWidth <= el.clientWidth))).toBe(true);
});

for (const file of readdirSync('dev-saves').filter(file => file.endsWith('.json'))) {
  test(`all sections keep their final controls above phone navigation: ${file}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await load(page, file);
    for (const section of await page.getByRole('tab').allTextContents()) {
      await page.getByRole('tab', { name: section, exact: true }).click();
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const last = page.locator('.app-body .section-card:visible').last();
      const nav = (await page.getByRole('tablist', { name: 'Game sections' }).boundingBox())!;
      const rect = (await last.boundingBox())!;
      expect(rect.y + rect.height).toBeLessThanOrEqual(nav.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

for (const [width, height] of [[320, 568], [700, 320]]) {
  test(`log, changelog, menu and save overlays fit at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await load(page);
    await page.getByRole('button', { name: 'Full history' }).click();
    await withinViewport(page, page.getByRole('dialog'));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'More actions' }).click();
    await withinViewport(page, page.getByRole('menu'));
    await page.getByRole('menuitem', { name: 'Changelog', exact: true }).click();
    const changelog = page.getByRole('dialog', { name: 'Changelog' });
    await withinViewport(page, changelog);
    const lastChange = changelog.locator('.changelog-entry li').last();
    await lastChange.scrollIntoViewIfNeeded();
    await withinViewport(page, lastChange);
    await withinViewport(page, changelog.getByRole('button', { name: 'Close changelog' }));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Import save', exact: true }).click();
    await page.setViewportSize({ width, height: 260 });
    const dialog = page.getByRole('dialog', { name: 'Import Save' });
    await withinViewport(page, dialog);
    await page.getByRole('textbox', { name: 'Save string' }).fill('invalid save');
    const importButton = dialog.getByRole('button', { name: 'Import', exact: true });
    await importButton.scrollIntoViewIfNeeded();
    await withinViewport(page, importButton);
    await importButton.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Unavailable'); } } });
      document.execCommand = () => false;
    });
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Export save', exact: true }).click();
    const exportDialog = page.getByRole('dialog', { name: 'Export Save' });
    await withinViewport(page, exportDialog);
    const copy = exportDialog.getByRole('button', { name: 'Copy', exact: true });
    await copy.scrollIntoViewIfNeeded();
    await withinViewport(page, copy);
  });
}

import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Freeze gameplay, not the rendered interface, to compare the existing design.
for (const width of [1280, 390]) {
  for (const file of readdirSync('dev-saves').filter(name => name.endsWith('.json'))) {
    test(`${file} at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(({ save }) => {
        Date.now = () => 1789200000000;
        Math.random = () => 0.5;
        window.setInterval = (() => 0) as unknown as typeof window.setInterval;
        localStorage.setItem('upc_v2', save);
        localStorage.setItem('upc_v2_saved_at', String(Date.now()));
      }, { save: readFileSync(join('dev-saves', file), 'utf8') });
      await page.goto('/');
      await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
      await expect(page).toHaveScreenshot(`${file.replace('.json', '')}-${width}.png`, {
        fullPage: true, animations: 'disabled',
      });
      expect(errors).toEqual([]);
    });
  }
}

test.describe('touch section views', () => {
  test.use({ hasTouch: true, isMobile: true });
  for (const [file, section, width] of [
    ['03-phase1-late.json', 'Strategy', 390],
    ['05-phase2-swarm.json', 'Production', 390],
    ['06-phase3-space.json', 'Computing', 390],
    ['06-phase3-space.json', 'Projects', 390],
    ['06-phase3-space.json', 'Fleet', 390],
    ['06-phase3-space.json', 'Fleet', 320],
    ['07-phase3-endgame.json', 'Projects', 390],
  ] as const) {
    test(`${file} ${section} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(save => {
        Date.now = () => 1789200000000;
        Math.random = () => .5;
        window.setInterval = (() => 0) as unknown as typeof window.setInterval;
        localStorage.setItem('upc_v2', save);
      }, readFileSync(join('dev-saves', file), 'utf8'));
      await page.goto('/');
      await page.getByRole('tab', { name: section, exact: true }).click();
      await expect(page).toHaveScreenshot(`${file.replace('.json', '')}-${section.toLowerCase()}-${width}.png`, {
        fullPage: true, animations: 'disabled',
      });
      if (section === 'Computing') {
        await page.getByRole('button', { name: 'Full history' }).click();
        await expect(page).toHaveScreenshot('log-sheet-390.png', { animations: 'disabled' });
      }
    });
  }
});

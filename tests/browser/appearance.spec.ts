import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

for (const [swarm, file] of [['drone', '05-phase2-swarm.json'], ['probe', '06-phase3-space.json']] as const) {
  for (const position of [40, 100, 160]) {
    test(`${swarm} balance track at ${position} on touch`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      await context.addInitScript(save => {
        Date.now = () => 1789200000000;
        window.setInterval = (() => 0) as unknown as typeof window.setInterval;
        localStorage.setItem('upc_v2', JSON.stringify(save));
      }, { ...JSON.parse(readFileSync(`dev-saves/${file}`, 'utf8')), sliderPos: position });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('tab', { name: 'Computing', exact: true }).click();
      await expect(page.locator('.swarm-balance')).toHaveScreenshot(`${swarm}-balance-${position}-390.png`);
      await context.close();
    });
  }
}

test('the phone log shows one previous line and a two-line latest entry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const save = JSON.parse(readFileSync('dev-saves/01-phase1-start.json', 'utf8'));
  await page.addInitScript(save => {
    Date.now = () => 1789200000000;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify(save));
  }, save);
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    const { game } = await import(path);
    game.state.readouts = [
      'Processor added, operations (or creativity) per sec increased',
      'Memory added, max operations increased',
      'This older line is outside the preview',
    ];
    game.publish();
  });
  await expect(page.locator('.console-preview .console-line').last()).toContainText('Processor added');
  await expect(page.locator('.console-open')).toHaveScreenshot('log-three-visual-lines-390.png');
});

for (const density of ['compact', 'comfortable']) {
  for (const [name, width, height, touch, file, section] of [
    ['phone-projects', 390, 844, true, '03-phase1-late.json', 'Projects'],
    ['tablet-landscape', 1280, 800, true, '06-phase3-space.json', null],
    ['tablet-portrait', 800, 1280, true, '06-phase3-space.json', null],
    ['tablet-4x3', 1024, 768, true, '05-phase2-swarm.json', null],
    ['desktop', 1440, 900, false, '06-phase3-space.json', null],
  ] as const) {
    test(`density ${density}: ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
      await context.addInitScript(({ save, density }) => {
        Date.now = () => 1789200000000;
        Math.random = () => .5;
        window.setInterval = (() => 0) as unknown as typeof window.setInterval;
        localStorage.setItem('upc_v2', save);
        localStorage.setItem('paperclips.density', density);
      }, { save: readFileSync(join('dev-saves', file), 'utf8'), density });
      const page = await context.newPage();
      await page.goto('/');
      if (section) await page.getByRole('tab', { name: section, exact: true }).click();
      await expect(page).toHaveScreenshot(`density-${density}-${name}.png`, { animations: 'disabled' });
      await context.close();
    });
  }
}

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

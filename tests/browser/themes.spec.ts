import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { GameState } from '../../src/game/state';
import { THEMES } from '../../src/browser/theme';

async function load(page: Page, theme = 'graphite', file = '06-phase3-space.json') {
  await page.addInitScript(({ save, theme }) => {
    Date.now = () => 1789200000000;
    Math.random = () => .5;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    if (!localStorage.getItem('upc_v2')) localStorage.setItem('upc_v2', save);
    if (!localStorage.getItem('paperclips.theme')) localStorage.setItem('paperclips.theme', theme);
    const observer = new MutationObserver(() => {
      if (document.getElementById('root')?.childElementCount) {
        document.documentElement.dataset.firstRenderTheme = document.documentElement.dataset.theme;
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }, { save: readFileSync(`dev-saves/${file}`, 'utf8'), theme });
  await page.goto('/');
  await expect(page.locator('.app-body')).toBeVisible();
}

async function choose(page: Page, theme: string) {
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption(theme);
  await expect(page.locator('#header-actions')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-header-actions]')).toBeFocused();
}

const saveState = (page: Page) => page.evaluate(async () => {
  const runtime = '/src/game/runtime.ts', codec = '/src/game/saveCodec.ts';
  return (await import(codec)).serializeSave((await import(runtime)).game.state, 123);
});

test('keyboard switching retains game, mounted panels, selected tab, and first-render preference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page);
  await page.getByRole('tab', { name: 'Fleet', exact: true }).click();
  await page.locator('.app-body').evaluate(el => el.setAttribute('data-mount-witness', 'retained'));
  const before = await saveState(page);
  await page.locator('[data-header-actions]').focus();
  await page.keyboard.press('Enter');
  const select = page.getByRole('combobox', { name: 'Theme', exact: true });
  for (let i = 0; i < 10 && !await select.evaluate(el => el === document.activeElement); i++) await page.keyboard.press('Tab');
  await expect(select).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(select).toHaveValue('paper');
  await expect(page.locator('#header-actions')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-header-actions]')).toBeFocused();
  for (const theme of THEMES) {
    await choose(page, theme);
    expect(await saveState(page)).toBe(before);
    await expect(page.locator('[data-mount-witness="retained"]')).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'Fleet', exact: true })).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => localStorage.getItem('paperclips.theme'))).toBe(theme);
    expect(await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content')))
      .toBe(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--panel2').trim()));
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme === 'paper' ? 'light' : 'dark');
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-first-render-theme', 'blueprint');
});

test('imports, resets, and prestige preserve themes and exports omit them', async ({ page }) => {
  await load(page, 'amber');
  await page.locator('[data-header-actions]').click();
  await page.getByRole('button', { name: 'Import save', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save string', exact: true }).fill(Buffer.from(readFileSync('dev-saves/03-phase1-late.json', 'utf8')).toString('base64'));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'amber');
  await page.locator('[data-header-actions]').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset game', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'amber');
  const exported = await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    const { game } = await import(path);
    game.act((state: { resetFlag: number }) => { state.resetFlag = 1; });
    return JSON.parse(atob(game.export()));
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'amber');
  expect(exported.state).not.toHaveProperty('theme');
  expect(await page.evaluate(() => localStorage.getItem('paperclips.theme'))).toBe('amber');
});

test('missing, unknown, or blocked preferences fall back and switching still works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite');
  await load(page, 'not-a-theme');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite');
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key) { if (key === 'paperclips.theme') throw new Error('blocked'); return get.call(this, key); };
    Storage.prototype.setItem = function(key, value) { if (key === 'paperclips.theme') throw new Error('blocked'); set.call(this, key, value); };
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite');
  await choose(page, 'phosphor');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'phosphor');
});

test('the combat canvas recolors live without remounting or changing battles', async ({ page }) => {
  await load(page);
  await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    (await import(path)).game.act((state: GameState) => {
      state.battleFlag = 1;
      state.battles = [{
        id: 1, name: 'Theme test', scale: 1, unitSize: 1,
        initialClipProbes: 1, initialDrifterProbes: 1, clipProbes: 1, drifterProbes: 1,
        territory: 0, leftShips: 1, rightShips: 1, timer: 0, battleClock: 0, masterClock: 0,
        endDelay: 0, over: false, result: null, honor: 0, honorApplied: false,
        probeShips: [{ x: 20, y: 20, vx: 0, vy: 0, gx: 0, gy: 0, framesDead: 0, alive: true, side: 'probe' }],
        drifterShips: [{ x: 80, y: 20, vx: 0, vy: 0, gx: 0, gy: 0, framesDead: 0, alive: true, side: 'drifter' }],
      }];
    });
  });
  const canvas = page.locator('.combat-canvas');
  await canvas.evaluate(el => el.setAttribute('data-canvas-witness', 'retained'));
  const original = await saveState(page);
  const pixel = () => canvas.evaluate(el => [...(el as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 1, 1).data]);
  expect(await pixel()).toEqual([37, 37, 37, 255]);
  await choose(page, 'paper');
  await expect.poll(pixel).toEqual([232, 226, 213, 255]);
  const ships = await canvas.evaluate(el => {
    const ctx = (el as HTMLCanvasElement).getContext('2d')!;
    return [[...ctx.getImageData(40, 40, 1, 1).data], [...ctx.getImageData(160, 40, 1, 1).data]];
  });
  expect(ships).toEqual([[36, 78, 110, 255], [155, 51, 53, 255]]);
  await expect(page.locator('[data-canvas-witness="retained"]')).toHaveCount(1);
  expect(await saveState(page)).toBe(original);
});

for (const theme of THEMES) {
  test(`${theme}: swarm balance labels stay readable in every position`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page, theme);
    await page.getByRole('tab', { name: 'Computing', exact: true }).click();
    const slider = page.getByRole('slider', { name: 'Swarm work vs think balance' });
    for (const position of [40, 100, 160]) {
      await slider.fill(String(position));
      const ratios = await page.locator('.swarm-balance-labels > span').evaluateAll(labels => {
        function luminance(color: string) {
          const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number)
            .map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
          return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        }
        return labels.map(label => {
          const text = luminance(getComputedStyle(label).color);
          const panel = luminance(getComputedStyle(label.closest('.section-card')!).backgroundColor);
          return (Math.max(text, panel) + .05) / (Math.min(text, panel) + .05);
        });
      });
      for (const ratio of ratios) expect(ratio, `${theme} focus ${position}`).toBeGreaterThanOrEqual(4.5);
    }
    await expect(page.locator('.swarm-balance')).toHaveScreenshot(`${theme}-swarm-390.png`);
  });

  for (const width of [320, 1280]) {
    for (const file of ['03-phase1-late.json', '05-phase2-swarm.json', '06-phase3-space.json']) {
      test(`${theme}: ${file} at ${width}px across densities`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width, height: 900 });
        await load(page, theme, file);
        for (const density of ['auto', 'compact', 'comfortable']) {
          await page.locator('[data-header-actions]').click();
          await page.getByRole('combobox', { name: 'Interface density', exact: true }).selectOption(density);
          const select = page.getByRole('combobox', { name: 'Theme', exact: true });
          await select.scrollIntoViewIfNeeded();
          const box = (await select.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          await page.keyboard.press('Escape');
          const tabs = page.getByRole('tab');
          if (width === 320) for (const tab of await tabs.all()) {
            await tab.click();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          const clipped = await page.locator('.section-card:visible, .section-tabs:visible').evaluateAll(elements =>
            elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent?.slice(0, 80)));
          expect(clipped).toEqual([]);
        }
        expect(errors).toEqual([]);
      });
    }
  }

  test(`${theme}: artifacts, dialogs, and semantic contrast`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await load(page, theme);
    await page.evaluate(async () => {
      const runtime = '/src/game/runtime.ts', artifacts = '/src/game/artifacts.ts';
      const ids = (await import(artifacts)).ARTIFACTS.map((artifact: { id: string }) => artifact.id);
      (await import(runtime)).game.act((state: { collectedArtifacts: string[] }) => { state.collectedArtifacts = ids; });
    });
    await page.getByRole('button', { name: 'Artifact map', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Artifact map', exact: true })).toBeVisible();
    const artifactsDialog = page.getByRole('dialog', { name: 'Artifact map', exact: true });
    await expect(artifactsDialog.locator('.artifact-item')).toHaveCount(32);
    await page.getByRole('searchbox', { name: 'Filter artifacts' }).fill('quark');
    await expect(artifactsDialog.locator('.artifact-item')).toHaveCount(1);
    await artifactsDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Full history', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Log history', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    const ratios = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      function luminance(token: string) {
        const raw = style.getPropertyValue(token).trim().slice(1);
        const hex = raw.length === 3 ? [...raw].map(c => c + c).join('') : raw;
        const rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
          .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      }
      return ['--text', '--text-dim', '--text-muted', '--danger', '--success'].map(token => {
        const a = luminance(token), b = luminance('--panel');
        return { token, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      });
    });
    for (const { token, ratio } of ratios) expect(ratio, `${theme} ${token}`).toBeGreaterThanOrEqual(4.5);
  });

  if (theme !== 'graphite') for (const width of [390, 1280]) {
    test(`${theme}: visual baseline at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await load(page, theme, width === 390 ? '03-phase1-late.json' : '06-phase3-space.json');
      await expect(page).toHaveScreenshot(`${theme}-${width}.png`, { fullPage: true, animations: 'disabled' });
    });
  }
}


test('translated theme controls and terminal fonts fit narrow menus and sections', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await load(page);
  await page.evaluate(async () => { const path = '/src/i18n/index.ts'; (await import(path)).setLocale('en-XA'); });
  for (const theme of THEMES) {
    await page.locator('[data-header-actions]').click();
    const select = page.locator('.theme-setting select');
    await select.selectOption(theme);
    await select.scrollIntoViewIfNeeded();
    await expect(select.locator('option')).toHaveCount(5);
    expect(await page.locator('.theme-setting label, .theme-setting').first().textContent()).toContain('[');
    expect(await page.locator('#header-actions').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      const clipped = await page.locator('.section-card:visible, .section-tabs:visible').evaluateAll(elements =>
        elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent?.slice(0, 80)));
      expect(clipped).toEqual([]);
    }
  }
});

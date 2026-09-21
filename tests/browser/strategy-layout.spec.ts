import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { THEMES } from '../../src/browser/theme';

async function load(page: Page, theme: string, locale = 'en') {
  await page.addInitScript(({ save, theme, locale }) => {
    Date.now = () => 1789200000000;
    Math.random = () => .5;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', save);
    localStorage.setItem('paperclips.theme', theme);
    localStorage.setItem('paperclips.locale', locale);
  }, { save: readFileSync('dev-saves/03-phase1-late.json', 'utf8'), theme, locale });
  await page.goto('/');
  if (await page.locator('#section-tab-Strategy').isVisible()) await page.locator('#section-tab-Strategy').click();
  await page.evaluate(async () => {
    const runtime = '/src/game/runtime.ts', actions = '/src/game/actions.ts';
    const { game } = await import(runtime);
    game.act((await import(actions)).runTourney, 'RANDOM');
  });
  await expect(page.locator('.payoff-grid')).toBeVisible();
}

async function choices(page: Page, names: string[]) {
  await page.evaluate(async names => {
    const runtime = '/src/game/runtime.ts';
    const { game } = await import(runtime);
    game.state.currentTournament.choiceNames = names;
    game.publish();
  }, names);
}

async function intactWords(page: Page) {
  const split = await page.locator('.payoff-grid th').evaluateAll(headings => headings.flatMap(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const texts: Node[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    return texts.flatMap(text => [...text.textContent!.matchAll(/\S+/g)].flatMap(match => {
      const range = document.createRange();
      range.setStart(text, match.index!);
      range.setEnd(text, match.index! + match[0].length);
      const rows = new Set([...range.getClientRects()].map(rect => Math.round(rect.top)));
      return rows.size > 1 ? [match[0]] : [];
    }));
  }));
  expect(split).toEqual([]);
}

for (const theme of THEMES) {
  for (const width of [320, 390, 768, 1000, 1280]) {
    test(`payoff labels remain intact: ${theme} at ${width}px across densities`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await load(page, theme);
      for (const density of ['auto', 'compact', 'comfortable']) {
        await page.evaluate(async density => {
          const path = '/src/browser/density.ts';
          (await import(path)).setDensity(density);
        }, density);
        for (const pair of [['lead', 'follow'], ['discrete', 'continuous'], ['raise_price', 'lower_price'], ['cooperate', 'defect']]) {
          await choices(page, pair);
          await intactWords(page);
          const bounds = await page.locator('.payoff-grid-scroll').evaluate(el => ({ content: el.scrollWidth, viewport: el.clientWidth }));
          expect(bounds.content).toBeLessThanOrEqual(bounds.viewport + 1);
          await expect(page.locator('.payoff-grid tbody td')).toHaveCount(4);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}

test('long translated payoff labels stay intact and the matrix can scroll with the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await load(page, 'phosphor', 'en-XA');
  await choices(page, ['discrete', 'continuous']);
  await intactWords(page);
  const matrix = page.locator('.payoff-grid-scroll');
  expect(await matrix.evaluate(el => el.scrollWidth)).toBeGreaterThan(await matrix.evaluate(el => el.clientWidth));
  await matrix.focus();
  await page.keyboard.press('ArrowRight');
  await expect(matrix).toHaveCSS('outline-style', 'solid');
  await expect.poll(() => matrix.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const [theme, width, a, b] of [
  ['blueprint', 390, 'lead', 'follow'],
  ['phosphor', 320, 'discrete', 'continuous'],
  ['paper', 1000, 'raise_price', 'lower_price'],
] as const) {
  test(`payoff layout screenshot: ${theme} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await load(page, theme);
    await choices(page, [a, b]);
    const panel = page.locator('.section-card').filter({ has: page.locator('.payoff-grid') });
    await expect(panel).toHaveScreenshot(`${theme}-payoff-${width}.png`);
  });
}

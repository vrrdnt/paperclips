import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function load(page: Page, file: string, density = 'auto') {
  const save = { ...JSON.parse(readFileSync(`dev-saves/${file}`, 'utf8')), sliderPos: 80 };
  await page.addInitScript(({ save, density }) => {
    Date.now = () => 1789200000000;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify(save));
    localStorage.setItem('paperclips.density', density);
  }, { save, density });
  await page.goto('/');
  const computing = page.getByRole('tab', { name: 'Computing', exact: true });
  if (await computing.isVisible()) await computing.click();
}

async function balance(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    return (await import(path)).game.state.sliderPos;
  });
}

for (const density of ['auto', 'compact', 'comfortable']) {
  for (const [device, width, height, touch] of [
    ['phone', 320, 700, true], ['tablet', 1000, 768, true], ['desktop', 1280, 900, false],
  ] as const) {
    for (const [swarm, file] of [
      ['Drone', '05-phase2-swarm.json'], ['Probe', '06-phase3-space.json'],
    ] as const) {
      test(`${swarm} focus stays a keyboard-accessible slider: ${density} ${device}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
        const page = await context.newPage();
        await load(page, file, density);
        const control = page.getByRole('slider', { name: 'Swarm work vs think balance' });
        await expect(page.getByText(`${swarm} focus`, { exact: true })).toBeVisible();
        await expect(control).toHaveValue('80');
        await expect(page.locator('.swarm-balance .slider-mobile-control')).toHaveCount(0);
        const box = await control.boundingBox();
        if (touch || density === 'comfortable') expect(box!.height).toBeGreaterThanOrEqual(density === 'compact' ? 40 : 48);
        await control.focus();
        await page.keyboard.press('ArrowRight');
        await expect(control).toHaveCSS('outline-style', 'solid');
        await expect(control).toHaveValue('81');
        expect(await balance(page)).toBe(81);
        await page.keyboard.press('Home');
        await expect(control).toHaveValue('0');
        expect(await balance(page)).toBe(0);
        await expect(page.locator('.swarm-balance')).toHaveAttribute('data-focus', 'work');
        await page.keyboard.press('End');
        await expect(control).toHaveValue('200');
        expect(await balance(page)).toBe(200);
        await expect(page.locator('.swarm-balance')).toHaveAttribute('data-focus', 'think');
        await control.fill('100');
        expect(await balance(page)).toBe(100);
        await expect(page.locator('.swarm-balance')).toHaveAttribute('data-focus', 'balanced');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await context.close();
      });
    }
  }
}

test('touch dragging, cancellation, section changes, and rotation retain the balance', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await load(page, '06-phase3-space.json');
  const control = page.getByRole('slider', { name: 'Swarm work vs think balance' });
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const start = { x: box.x + 10 + (box.width - 20) * .4, y: box.y + box.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let i = 1; i <= 5; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + i * (box.width - 20) * .08, y: start.y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const dragged = await balance(page);
  expect(dragged).toBeGreaterThanOrEqual(155);
  expect(dragged).toBeLessThanOrEqual(165);
  await expect(control).toHaveValue(String(dragged));
  await expect(page.locator('.swarm-balance')).toHaveAttribute('data-focus', 'think');
  await page.getByRole('tab', { name: 'Production', exact: true }).click();
  await page.getByRole('tab', { name: 'Computing', exact: true }).click();
  await expect(control).toHaveValue(String(dragged));
  await page.setViewportSize({ width: 844, height: 390 });
  await control.scrollIntoViewIfNeeded();
  await expect(control).toHaveValue(String(dragged));
  const rotated = (await control.boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rotated.x + rotated.width / 2, y: rotated.y + rotated.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    const { game } = await import(path);
    game.state.sliderPos = 40;
    game.publish();
  });
  await expect(control).toHaveValue('40');
  await expect(page.locator('.swarm-balance')).toHaveAttribute('data-focus', 'work');
  await context.close();
});

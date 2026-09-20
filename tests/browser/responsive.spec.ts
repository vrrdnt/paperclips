import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

for (const density of ['auto', 'compact', 'comfortable'] as const) {
  test.describe(density, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(value => localStorage.setItem('paperclips.density', value), density);
    });

const stages = readdirSync('dev-saves').filter(file => file.endsWith('.json'));
async function load(page: Page, file = '06-phase3-space.json', overrides: Record<string, unknown> = {}, frozen = true) {
  const save = { ...JSON.parse(readFileSync(`dev-saves/${file}`, 'utf8')), ...overrides };
  await page.addInitScript(({ save, frozen, density }) => {
    localStorage.setItem('paperclips.density', density);
    if (frozen) {
      Date.now = () => 1789200000000;
      Math.random = () => .5;
      window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    }
    localStorage.setItem('upc_v2', JSON.stringify(save));
  }, { save, frozen, density });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save game', exact: true })).toBeVisible();
}
async function state(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    return structuredClone((await import(path)).game.state);
  });
}
async function change(page: Page, values: Record<string, unknown>) {
  await page.evaluate(async values => {
    const path = '/src/game/runtime.ts';
    const { game } = await import(path);
    Object.assign(game.state, values);
    game.publish();
  }, values);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const clipped = await page.locator('.section-card:visible').evaluateAll(cards => cards.filter(card => card.scrollWidth > card.clientWidth + 1).map(card => card.textContent?.slice(0, 100)));
  expect(clipped).toEqual([]);
}

for (const width of [320, 390, 600, 768, 1000, 1280]) {
  for (const file of stages) {
    test(`${file}: sections at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await load(page, file);
      const initial = await state(page);
      const cards = await page.locator('.app-body .section-card').count();
      await noOverflow(page);
      if (width < 768) {
        const tabs = page.getByRole('tab');
        const names = await tabs.locator('.section-tab-label').allTextContents();
        expect(names.includes('Fleet')).toBe(initial.spaceFlag === 1);
        for (const name of names) {
          await page.getByRole('tab', { name, exact: true }).click();
          await expect(page.getByRole('tabpanel')).toHaveAccessibleName(name);
          await expect(page.locator(`.game-panel-slot:not([hidden]):not([data-section="${name}"])`)).toHaveCount(0);
          expect(await page.locator('.app-body .section-card').count()).toBe(cards);
          await noOverflow(page);
        }
        expect(await state(page)).toEqual(initial);
      } else {
        await expect(page.getByRole('tablist')).toHaveCount(0);
        await expect(page.locator('.app-body')).toHaveCSS('display', 'grid');
        const columns = await page.locator('.app-body').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(width < 1000 ? 2 : 3);
        await expect(page.locator('.game-panel-slot[hidden]')).toHaveCount(0);
      }
    });
  }
}

test('new game has no tabs; unlocks and dismantling follow live content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await change(page, { compFlag: 1, projectsFlag: 1 });
  await expect(page.getByRole('tab').locator('.section-tab-label')).toHaveText(['Production', 'Computing', 'Projects']);
  await page.getByRole('tab', { name: 'Computing' }).click();
  await change(page, { compFlag: 0, qFlag: 0, swarmFlag: 0 });
  await expect(page.getByRole('tab', { name: 'Production' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Computing' })).toHaveCount(0);
  await load(page);
  await page.getByRole('tab', { name: 'Fleet' }).click();
  await change(page, { dismantle: 1, endTimer1: 189, battleFlag: 1 });
  await expect(page.getByRole('tab', { name: 'Fleet' })).toBeVisible();
  await change(page, { endTimer1: 190 });
  await expect(page.getByRole('tab', { name: 'Fleet' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Production' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Computing' }).click();
  await change(page, { dismantle: 7, endTimer2: 150, endTimer4: 250 });
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Make Paperclip', exact: true })).toBeVisible();
});

test('tabs retain scroll and mounted panels through switching and rotation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await load(page, '03-phase1-late.json');
  await page.locator('[data-reveal-id="panel:Computing"]').evaluate(el => el.setAttribute('data-mount-witness', 'retained'));
  await page.evaluate(() => scrollTo(0, 300));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300);
  await page.getByRole('tab', { name: 'Computing' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 100));
  await page.getByRole('tab', { name: 'Production' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(300);
  await page.getByRole('tab', { name: 'Computing' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(100);
  await page.setViewportSize({ width: 1000, height: 500 });
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 500 });
  await expect(page.getByRole('tab', { name: 'Computing' })).toHaveAttribute('aria-selected', 'true');
  // Responsive reflow can round the restored offset by one CSS pixel.
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - 100)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-mount-witness="retained"]')).toHaveCount(1);
});

test('tabs support arrow, Home, End and Tab keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await load(page);
  const production = page.getByRole('tab', { name: 'Production' });
  await production.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Computing' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Fleet' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(production).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Fleet' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(production).toBeFocused();
  expect(await page.locator('[role="tab"][tabindex="0"]').count()).toBe(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel', { name: 'Production' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(production).toBeFocused();
});

for (const width of [320, 390, 768, 1280]) {
  test(`log updates keep three visual lines and stationary panels at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await load(page, '03-phase1-late.json', { readouts: ['Newest', 'Middle', 'Oldest'] });
    await page.evaluate(() => document.fonts.ready);
    const preview = page.locator('.console-preview');
    const viewport = preview.locator('.console-preview-viewport');
    const previewHeight = (await preview.boundingBox())!.height;
    const panelTop = (await page.locator('.app-body').boundingBox())!.y;
    const lineHeight = await viewport.evaluate(el => parseFloat(getComputedStyle(el).lineHeight));
    expect((await viewport.boundingBox())!.height / lineHeight).toBeCloseTo(3, 2);
    const twoLineMessage = await viewport.evaluate(el => {
      const canvas = document.createElement('canvas').getContext('2d')!;
      const style = getComputedStyle(el);
      canvas.font = `${style.fontSize} ${style.fontFamily}`;
      return 'Wrapped message '.repeat(Math.ceil(el.clientWidth * 1.4 / canvas.measureText('Wrapped message ').width)).trim();
    });
    await change(page, { readouts: [twoLineMessage, 'Previous message', 'Older message'] });
    const lines = preview.locator('.console-line');
    await expect(lines.last()).toHaveText(twoLineMessage);
    expect((await lines.last().boundingBox())!.height / lineHeight).toBeCloseTo(2, 2);
    const visible = (await viewport.boundingBox())!;
    const oldest = (await lines.first().boundingBox())!;
    const previous = (await lines.nth(1).boundingBox())!;
    const latest = (await lines.last().boundingBox())!;
    expect(oldest.y + oldest.height).toBeLessThanOrEqual(visible.y + .1);
    expect(previous.y).toBeCloseTo(visible.y, 1);
    expect(latest.y + latest.height).toBeCloseTo(visible.y + visible.height, 1);
    await expect(lines.last()).toHaveCSS('text-overflow', 'clip');
    const longMessage = 'Processor added, operations (or creativity) per sec increased. '.repeat(8);
    for (const readouts of [[longMessage, 'Memory added', 'Memory added'], ['Memory added'], [], ['Newest', 'Middle', 'Oldest']]) {
      await change(page, { readouts });
      await expect(preview.locator('.console-line')).toHaveCount(readouts.length);
      expect((await preview.boundingBox())!.height).toBeCloseTo(previewHeight, 1);
      expect((await page.locator('.app-body').boundingBox())!.y).toBeCloseTo(panelTop, 1);
    }
    await change(page, { readouts: [longMessage, 'Memory added', 'Memory added'] });
    const visibleLines = await lines.last().evaluate(el => {
      const window = el.closest('.console-preview-viewport')!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()].filter(rect => rect.top >= window.top - .1 && rect.bottom <= window.bottom + .1).length;
    });
    expect(visibleLines).toBe(3);
    await page.getByRole('button', { name: 'Full history', exact: true }).click();
    const completeEntry = page.locator('.log-history .console-line').last();
    await expect(completeEntry).toHaveText(longMessage);
    // Complete messages still wrap in history and remain reachable by scrolling.
    expect((await completeEntry.boundingBox())!.height).toBeGreaterThan(previewHeight);
    await completeEntry.scrollIntoViewIfNeeded();
    await expect(completeEntry).toBeVisible();
  });
}

test('full log scrolls, traps focus, restores focus and Back never leaves the game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page, '03-phase1-late.json', { readouts: Array.from({ length: 100 }, (_, i) => `Log entry ${i}`) });
  await expect(page.locator('.console-preview .console-line')).toHaveCount(3);
  const logCount = (await state(page)).readouts.length;
  const open = page.getByRole('button', { name: 'Full history' });
  const dialog = page.getByRole('dialog', { name: 'Log history' });
  await open.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.console-line')).toHaveCount(logCount);
  expect(await dialog.locator('.log-history').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.waitForFunction(() => !history.state?.paperclipsOverlay);
  await open.click();
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  expect(page.url()).toContain('127.0.0.1:5173');
  await page.getByRole('tab', { name: 'Computing' }).click();
  await open.click();
  await expect(dialog.locator('.console-line')).toHaveCount(logCount);
  await page.setViewportSize({ width: 1000, height: 700 });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(open).toBeFocused();
});

test('disabled purchase controls look inactive, stay legible, and update without moving', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await load(page, '01-phase1-start.json', { funds: 0, wireCost: 20, operations: 0, standardOps: 0 });
  const wire = page.getByRole('button', { name: 'Buy wire ($20)', exact: true });
  await expect(wire).toBeDisabled();
  await expect(wire).toHaveCSS('border-top-style', 'dashed');
  await expect(wire).toHaveCSS('background-image', 'none');
  const disabledBounds = await wire.boundingBox();
  const disabledColor = await wire.evaluate(el => getComputedStyle(el).color);
  const before = await state(page);
  await wire.evaluate((el: HTMLButtonElement) => el.click());
  expect(await state(page)).toEqual(before);
  await change(page, { funds: 20 });
  await expect(wire).toBeEnabled();
  await expect(wire).toHaveCSS('border-top-style', 'solid');
  expect(await wire.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
  expect(await wire.evaluate(el => getComputedStyle(el).color)).not.toBe(disabledColor);
  expect(await wire.boundingBox()).toEqual(disabledBounds);
  await wire.click();
  await expect(wire).toBeDisabled();
  await expect(wire).toHaveCSS('border-top-style', 'dashed');
  await page.getByRole('tab', { name: 'Computing', exact: true }).click();
  const allocations = page.locator('[data-section="Computing"] button:disabled');
  await change(page, { trust: 0, processors: 10, memory: 10, swarmGifts: 0 });
  await expect(allocations.first()).toHaveCSS('border-top-style', 'dashed');
  await page.getByRole('tab', { name: 'Projects', exact: true }).click();
  const project = page.locator('.project-reveal:not(.is-affordable)').first();
  await expect(project).toHaveCSS('border-top-style', 'dashed');
  await expect(project.locator('button')).toHaveCSS('background-image', 'none');
});

test('import handles a reduced keyboard viewport and resets section and scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page);
  await page.getByRole('tab', { name: 'Fleet' }).click();
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Import save' }).click();
  await page.setViewportSize({ width: 390, height: 330 });
  const input = page.getByRole('textbox', { name: 'Save string', exact: true });
  await input.fill(Buffer.from(readFileSync('dev-saves/03-phase1-late.json','utf8')).toString('base64'));
  await expect(input).toBeFocused();
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Production' })).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.waitForFunction(() => !history.state?.paperclipsOverlay);
  await page.getByRole('tab', { name: 'Strategy' }).click();
  await page.evaluate(async () => {
    const path = '/src/game/runtime.ts';
    (await import(path)).game.resetAll();
  });
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Make Paperclip', exact: true })).toBeVisible();
});

test('disabled projects keep 14px text and at least 4.5:1 contrast', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await load(page, '01-phase1-start.json', { operations: 0, standardOps: 0 });
  await page.getByRole('tab', { name: 'Projects' }).click();
  const card = page.locator('.project-reveal').filter({ has: page.locator('button:disabled') }).first();
  await expect(card).toBeVisible();
  const result = await card.evaluate(el => {
    const luminance = (rgb: string) => {
      const values = rgb.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
      return values[0]*.2126+values[1]*.7152+values[2]*.0722;
    };
    return [...el.querySelectorAll('.project-btn-title, .project-btn-price, .project-btn-desc')].map(text => {
      const style = getComputedStyle(text);
      let parent: Element | null = text;
      while (parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent=parent.parentElement;
      const bg = luminance(getComputedStyle(parent!).backgroundColor);
      const fg = luminance(style.color);
      return { size: parseFloat(style.fontSize), ratio: (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05), opacity: getComputedStyle(text.closest('button') ?? el).opacity };
    });
  });
  for (const value of result) { expect(value.size).toBeGreaterThanOrEqual(14); expect(value.ratio).toBeGreaterThanOrEqual(4.5); expect(value.opacity).toBe('1'); }
});

test('production, tournament, combat and autosave continue across sections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.clock.install({ time: new Date('2026-09-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-13T00:00:00Z'));
  await load(page, '06-phase3-space.json', { operations: 100000, standardOps: 100000, autoTourneyStatus: 0, probeCount: 1e8, drifterCount: 2e6, probeHaz: 10, randomState: 123 }, false);
  await page.getByRole('tab', { name: 'Strategy' }).click();
  await page.clock.runFor(1000);
  await page.getByRole('button', { name: /^Run Tournament / }).click();
  const before = await state(page);
  expect(before.battles.length).toBeGreaterThan(0);
  expect(before.currentTournament.ticksRemaining).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('combobox', { name: 'Interface density' }).selectOption(density === 'compact' ? 'comfortable' : 'compact');
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Fleet' }).click();
  await page.getByRole('tab', { name: 'Projects' }).click();
  await page.clock.runFor(3000);
  const after = await state(page);
  expect(after.ticks).toBe(before.ticks+300);
  expect(after.clips).toBeGreaterThan(before.clips);
  expect(after.currentTournament.ticksRemaining).toBeLessThan(before.currentTournament.ticksRemaining);
  expect(after.battles).not.toEqual(before.battles);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('upc_v2')!).state.ticks)).toBeGreaterThan(before.ticks);
});

test.describe('touch controls', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 700 } });
  test('allocation targets match density and scrolling or hiding cancels a hold', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-13T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-13T00:00:00Z'));
    await load(page, '06-phase3-space.json', { probeTrust: 100, maxTrust: 100 }, false);
    await page.getByRole('tab', { name: 'Fleet' }).click();
    const button = page.getByRole('button', { name: 'Increase Speed', exact: true });
    await button.scrollIntoViewIfNeeded();
    const bounds = (await button.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(density === 'compact' ? 40 : 48);
    expect(bounds.height).toBeGreaterThanOrEqual(density === 'compact' ? 40 : 48);
    const before = (await state(page)).probeSpeed;
    const pointer = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: bounds.x+10, clientY: bounds.y+10 };
    await button.dispatchEvent('pointerdown', pointer);
    await button.dispatchEvent('pointermove', { ...pointer, clientY: pointer.clientY+40 });
    await page.clock.runFor(1200);
    await button.dispatchEvent('pointerup', { ...pointer, clientY: pointer.clientY+40 });
    await button.dispatchEvent('click');
    expect((await state(page)).probeSpeed).toBe(before);
    await button.dispatchEvent('pointerdown', pointer);
    await page.clock.runFor(700);
    expect((await state(page)).probeSpeed).toBe(before+1);
    await page.getByRole('tab', { name: 'Computing' }).click();
    await page.clock.runFor(1500);
    expect((await state(page)).probeSpeed).toBe(before+1);
    await page.getByRole('tab', { name: 'Fleet' }).click();
    await button.dispatchEvent('pointerdown', pointer);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(1500);
    expect((await state(page)).probeSpeed).toBe(before+1);
  });
});

test('header overlays dismiss with Back and restore the header controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await load(page, '03-phase1-late.json', { prestigeU: 3, prestigeS: 2 });
  await page.getByRole('button', { name: 'Artifact map', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Artifact map' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Artifact map', exact: true })).toBeFocused();
  for (const name of ['Changelog', 'Import save']) {
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'More actions' })).toBeFocused();
  }
});

test('an actual touch scroll over an allocation button does not purchase', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 700 } });
  const page = await context.newPage();
  await load(page, '06-phase3-space.json', { probeTrust: 100, maxTrust: 100 });
  await page.getByRole('tab', { name: 'Fleet' }).click();
  const button = page.getByRole('button', { name: 'Increase Speed', exact: true });
  await button.scrollIntoViewIfNeeded();
  const bounds = (await button.boundingBox())!;
  const before = (await state(page)).probeSpeed;
  const scrollBefore = await page.evaluate(() => scrollY);
  const cdp = await context.newCDPSession(page);
  const point = { x: bounds.x + bounds.width/2, y: bounds.y + bounds.height/2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  for (let i=1; i<=6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x, y: point.y - i*20 }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore);
  expect((await state(page)).probeSpeed).toBe(before);
  await context.close();
});

test('phone and landscape controls retain touch size and the selected section', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await load(page, '03-phase1-late.json', { swarmGifts: 500, trust: 1000 });
  for (const viewport of [{ width: 320, height: 700 }, { width: 700, height: 320 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    if (viewport.width < 768) {
      for (const name of ['Production', 'Computing', 'Projects', 'Strategy']) {
        await page.getByRole('tab', { name, exact: true }).click();
        const short = await page.locator('.app-body button:visible, .app-header button:visible, .app-body select:visible').evaluateAll((els, targetSize) => els.filter(el => {
          const rect=el.getBoundingClientRect();
          return rect.width < targetSize || rect.height < targetSize;
        }).map(el => el.textContent), density === 'compact' ? 40 : 48);
        expect(short).toEqual([]);
      }
    }
    await noOverflow(page);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(page.getByRole('tab', { name: 'Strategy', exact: true })).toHaveAttribute('aria-selected', 'true');
  await context.close();
});

  });
}

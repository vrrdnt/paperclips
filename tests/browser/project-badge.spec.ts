import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { makeInitialState } from '../../src/game/state';
import { ALL_PROJECTS } from '../../src/game/projects';

async function change(page: Page, values: Record<string, unknown>) {
  await page.evaluate(async values => {
    const path = '/src/game/runtime.ts';
    const { game } = await import(path);
    Object.assign(game.state, values);
    game.publish();
  }, values);
}

const fixture = {
  ...makeInitialState(), projectsFlag: 1, compFlag: 1, activeProjectIds: [1],
  hiddenProjectIds: ALL_PROJECTS.filter(p => ![1, 7].includes(p.id)).map(p => p.id),
};

for (const density of ['auto', 'compact', 'comfortable']) {
  test(`project badge tracks new and purchasable projects independently: ${density}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(({ fixture, density }) => {
      Date.now = () => 1789200000000;
      window.setInterval = (() => 0) as unknown as typeof window.setInterval;
      localStorage.setItem('upc_v2', JSON.stringify(fixture));
      localStorage.setItem('paperclips.density', density);
    }, { fixture, density });
    await page.goto('/');
    const tab = page.getByRole('tab', { name: 'Projects', exact: true });
    const badge = tab.locator('.project-tab-badge');
    const nav = page.getByRole('tablist');
    await expect(badge).toHaveText('1');
    await expect(tab).toHaveAccessibleDescription('Available: 1. Purchasable: 0. New: 0.');
    const navHeight = (await nav.boundingBox())!.height;
    if (density === 'auto') await expect(nav).toHaveScreenshot('projects-badge-neutral.png');

    await change(page, { activeProjectIds: [1, 7] });
    await expect(badge).toHaveText('2');
    await expect(badge).toHaveClass(/has-new/);
    await expect(badge).not.toHaveClass(/is-purchasable/);
    await expect(tab).toHaveAccessibleDescription('Available: 2. Purchasable: 0. New: 1.');
    if (density === 'auto') await expect(nav).toHaveScreenshot('projects-badge-new.png');

    await change(page, { operations: 2000, standardOps: 2000 });
    await expect(badge).toHaveClass(/is-purchasable/);
    await expect(badge).toHaveClass(/has-new/);
    await expect(tab).toHaveAccessibleDescription('Available: 2. Purchasable: 2. New: 1.');
    if (density === 'auto') await expect(nav).toHaveScreenshot('projects-badge-new-purchasable.png');
    await tab.click();
    await expect(badge).not.toHaveClass(/has-new/);
    await expect(badge).toHaveClass(/is-purchasable/);
    if (density === 'auto') await expect(nav).toHaveScreenshot('projects-badge-purchasable.png');
    await expect(page.locator('.project-list button:enabled')).toHaveCount(2);

    await page.locator('[data-reveal-id="project:1"] button').click();
    await expect(badge).toHaveText('1');
    await expect(tab).toHaveAccessibleDescription('Available: 1. Purchasable: 0. New: 0.');
    await expect(badge).not.toHaveClass(/is-purchasable/);
    await page.getByRole('tab', { name: 'Production', exact: true }).click();
    await expect(badge).not.toHaveClass(/has-new/);
    expect((await nav.boundingBox())!.height).toBe(navHeight);

    await change(page, { activeProjectIds: [] });
    await expect(badge).toHaveCount(0);
    await expect(tab).toHaveAccessibleDescription('Available: 0. Purchasable: 0. New: 0.');
    expect((await nav.boundingBox())!.height).toBe(navHeight);
    await change(page, { dismantle: 7 });
    await expect(tab).toHaveCount(0);
  });
}

test('viewed projects remain read across rotation; imports and new runs reset notification state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(fixture => {
    Date.now = () => 1789200000000;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', JSON.stringify(fixture));
  }, fixture);
  await page.goto('/');
  const tab = page.getByRole('tab', { name: 'Projects', exact: true });
  await expect(tab.locator('.project-tab-badge')).toHaveText('1');
  await page.setViewportSize({ width: 1000, height: 844 });
  await change(page, { activeProjectIds: [1, 7] });
  await expect(page.locator('.project-reveal:visible')).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(tab.locator('.project-tab-badge')).not.toHaveClass(/has-new/);
  const save = Buffer.from(JSON.stringify({ ...fixture, activeProjectIds: [7] })).toString('base64');
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await page.getByRole('button', { name: 'Import save', exact: true }).click();
  await page.getByRole('textbox', { name: 'Save string', exact: true }).fill(save);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(tab.locator('.project-tab-badge')).toHaveText('1');
  await expect(tab.locator('.project-tab-badge')).not.toHaveClass(/has-new/);
  await change(page, { activeProjectIds: [7, 1] });
  await expect(tab).toHaveAccessibleDescription('Available: 2. Purchasable: 0. New: 1.');
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset game', exact: true }).click();
  await expect(tab).toHaveCount(0);
  await change(page, { projectsFlag: 1, compFlag: 1, activeProjectIds: [1], hiddenProjectIds: fixture.hiddenProjectIds });
  await expect(tab).toHaveAccessibleDescription('Available: 1. Purchasable: 0. New: 1.');
});

test('two-digit counts fit five tabs on a narrow phone, including expanded translations', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.addInitScript(save => {
    Date.now = () => 1789200000000;
    window.setInterval = (() => 0) as unknown as typeof window.setInterval;
    localStorage.setItem('upc_v2', save);
  }, readFileSync('dev-saves/06-phase3-space.json', 'utf8'));
  await page.goto('/');
  await change(page, { activeProjectIds: ALL_PROJECTS.slice(0, 12).map(p => p.id), projectFlags: {}, hiddenProjectIds: [] });
  const nav = page.getByRole('tablist');
  for (const locale of ['en', 'en-XA']) {
    await page.evaluate(async locale => { const path = '/src/i18n/index.ts'; (await import(path)).setLocale(locale); }, locale);
    await expect(page.locator('.project-tab-badge')).toHaveText('12');
    expect(await nav.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Each badge stays within its own touch target instead of covering a neighboring tab.
    const badge = (await page.locator('.project-tab-badge').boundingBox())!;
    const target = (await page.locator('#section-tab-Projects').boundingBox())!;
    expect(badge.x).toBeGreaterThanOrEqual(target.x);
    expect(badge.x + badge.width).toBeLessThanOrEqual(target.x + target.width);
    expect(target.height).toBeGreaterThanOrEqual(52);
  }
});

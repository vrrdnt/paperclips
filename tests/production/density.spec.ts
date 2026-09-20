import { test, expect } from '@playwright/test';

test('the production PWA retains density and game progress across an offline reload', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Make Paperclip', exact: true }).click();
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await page.getByRole('combobox', { name: 'Interface density', exact: true }).selectOption('compact');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await expect(page.locator('.header-clip-number')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Make Paperclip', exact: true })).toHaveCSS('min-height', '40px');
  await page.getByRole('button', { name: 'More actions', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Interface density', exact: true })).toHaveValue('compact');
  await page.getByRole('combobox', { name: 'Interface density', exact: true }).selectOption('comfortable');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Make Paperclip', exact: true })).toHaveCSS('min-height', '48px');
});

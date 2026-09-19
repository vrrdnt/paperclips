import { test, expect } from '@playwright/test';

test('production excludes the pseudo locale and resolves English offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('paperclips.locale', 'en-XA'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Make Paperclip' })).toBeVisible();
  await page.getByRole('button', { name: 'More actions' }).click();
  await expect(page.locator('.language-setting')).toHaveCount(0);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Make Paperclip' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
});

import { test, expect } from '@playwright/test';

test('the built app retains progress and reloads without a network', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const makeClip = page.getByRole('button', { name: 'Make Paperclip', exact: true });
  await makeClip.click();
  await page.getByRole('button', { name: 'Save game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Game saved', exact: true })).toBeVisible();
  // Activation follows successful app-shell precaching, including built JS/CSS.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(makeClip).toBeVisible();
  await expect(page.locator('.header-clip-number')).toHaveText('1');
  await makeClip.click();
  await expect(page.locator('.header-clip-number')).toHaveText('2');
  expect(errors).toEqual([]);
});

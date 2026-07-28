import { expect, test } from '@playwright/test';

test('keeps task routes protected without a restored session', async ({ page }) => {
  await page.goto('/app/projects/demo-project/tasks');
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

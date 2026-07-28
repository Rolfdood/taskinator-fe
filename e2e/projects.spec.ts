import { expect, test } from '@playwright/test';

test('keeps project routes protected without a restored session', async ({ page }) => {
  await page.goto('/app/projects/demo-project/tasks');
  await expect(page).toHaveURL(/\/login$/);
});

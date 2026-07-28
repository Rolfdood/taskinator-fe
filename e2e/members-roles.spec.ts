import { expect, test } from '@playwright/test';

test('keeps member and role routes protected without a restored session', async ({ page }) => {
  await page.goto('/app/projects/demo-project/members');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/app/projects/demo-project/roles');
  await expect(page).toHaveURL(/\/login$/);
});

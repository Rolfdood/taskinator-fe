import { expect, test } from '@playwright/test';

test('shows login and registration screens', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();

  await page.getByRole('link', { name: 'Create one' }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await expect(page.getByLabel('First name')).toBeVisible();
});

test('redirects unauthenticated app routes to login', async ({ page }) => {
  await page.goto('/app/projects');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

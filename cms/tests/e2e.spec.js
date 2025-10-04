import { test, expect } from '@playwright/test';

test('dashboard loads and shows KPIs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('CMS Dashboard')).toBeVisible();
  await expect(page.locator('#out')).toContainText('products', { timeout: 15000 });
  await expect(page.locator('#kpis .bg-white')).toHaveCount(4, { timeout: 15000 });
});

test('stats endpoint returns JSON', async ({ request }) => {
  const res = await request.get('/api/stats/overview', { headers: { 'x-api-key': 'dev-api-key-123' } });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data).toHaveProperty('products');
  expect(Array.isArray(data.salesOverTime)).toBeTruthy();
});

test('create and list category via UI', async ({ page }) => {
  await page.goto('/');
  await page.locator('#catForm [name=name]').fill('E2E Cat');
  await page.locator('#catForm [name=slug]').fill('e2e-cat');
  await page.locator('#catForm button').click();
  await expect(page.locator('#categories')).toContainText('E2E Cat', { timeout: 15000 });
});

test('create and delete product via UI', async ({ page }) => {
  await page.goto('/');
  await page.locator('#prodForm [name=name]').fill('E2E Item');
  await page.locator('#prodForm [name=slug]').fill('e2e-item');
  await page.locator('#prodForm [name=sku]').fill('E2E-SKU');
  await page.locator('#prodForm [name=priceCents]').fill('2500');
  await page.locator('#prodForm button').click();
  await expect(page.locator('#products')).toContainText('E2E Item', { timeout: 15000 });
  const row = page.locator('#products tr', { hasText: 'E2E Item' });
  await row.getByText('verwijderen').click();
  await expect(page.locator('#products')).not.toContainText('E2E Item');
});



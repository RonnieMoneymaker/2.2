const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Check if main dashboard elements are visible
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check stats cards
    await expect(page.locator('text=Klanten')).toBeVisible();
    await expect(page.locator('text=Bestellingen')).toBeVisible();
    await expect(page.locator('text=Omzet')).toBeVisible();
    await expect(page.locator('text=Netto Winst')).toBeVisible();
  });

  test('should change time period and update data', async ({ page }) => {
    // Test period selector
    await page.selectOption('select', 'week');
    await expect(page.locator('text=Afgelopen week')).toBeVisible();
    
    await page.selectOption('select', 'month');
    await expect(page.locator('text=Afgelopen maand')).toBeVisible();
    
    await page.selectOption('select', 'year');
    await expect(page.locator('text=Afgelopen jaar')).toBeVisible();
  });

  test('should display financial breakdown section', async ({ page }) => {
    // Check if financial breakdown is visible
    await expect(page.locator('text=Complete Financiële Breakdown')).toBeVisible();
    await expect(page.locator('text=INKOMSTEN')).toBeVisible();
    await expect(page.locator('text=KOSTEN')).toBeVisible();
    await expect(page.locator('text=NETTO WINST BEREKENING')).toBeVisible();
    await expect(page.locator('text=BTW OVERZICHT')).toBeVisible();
  });

  test('should display marketing costs breakdown', async ({ page }) => {
    await expect(page.locator('text=Marketing Kosten Breakdown')).toBeVisible();
    await expect(page.locator('text=Google Ads')).toBeVisible();
    await expect(page.locator('text=Meta Ads')).toBeVisible();
    await expect(page.locator('text=ROAS')).toBeVisible();
  });

  test('should display charts and graphs', async ({ page }) => {
    // Check if charts are rendered
    await expect(page.locator('text=Verkopen Trend')).toBeVisible();
    await expect(page.locator('text=Status Verdeling')).toBeVisible();
    
    // Wait for charts to load
    await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });
  });

  test('should navigate to customers when clicking top customers', async ({ page }) => {
    // Click on a customer in top customers section
    const customerLink = page.locator('text=Top Klanten').locator('..').locator('.cursor-pointer').first();
    await customerLink.click();
    
    // Should navigate to customer detail page
    await expect(page).toHaveURL(/.*\/customers\/\d+/);
  });

  test('should navigate to orders when clicking recent orders', async ({ page }) => {
    // Click on an order in recent orders section
    const orderLink = page.locator('text=Recente Bestellingen').locator('..').locator('.cursor-pointer').first();
    await orderLink.click();
    
    // Should navigate to order detail page
    await expect(page).toHaveURL(/.*\/orders\/\d+/);
  });

  test('should display profit calculations correctly', async ({ page }) => {
    // Check if profit calculations are visible and formatted correctly
    await expect(page.locator('text=€').first()).toBeVisible();
    
    // Check if profit values are displayed with + or - signs
    const profitElements = page.locator('text=/[+\\-]€\\d+\\.\\d{2}/');
    await expect(profitElements.first()).toBeVisible();
  });
});

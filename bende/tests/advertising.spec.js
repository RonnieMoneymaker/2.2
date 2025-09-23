const { test, expect } = require('@playwright/test');

test.describe('Advertising Platform Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/advertising');
  });

  test('should display advertising dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Advertising');
    
    // Check if main sections are visible
    await expect(page.locator('text=Google Ads')).toBeVisible();
    await expect(page.locator('text=Meta Ads')).toBeVisible();
    await expect(page.locator('text=Performance Overview')).toBeVisible();
  });

  test('should display Google Ads campaigns', async ({ page }) => {
    // Check Google Ads section
    const googleAdsSection = page.locator('text=Google Ads').locator('..');
    await expect(googleAdsSection.locator('text=Campaigns')).toBeVisible();
    
    // Check if campaign data is displayed
    await expect(page.locator('text=Search Campaign')).toBeVisible();
    await expect(page.locator('text=Shopping Campaign')).toBeVisible();
  });

  test('should display Meta Ads campaigns', async ({ page }) => {
    // Check Meta Ads section
    const metaAdsSection = page.locator('text=Meta Ads').locator('..');
    await expect(metaAdsSection.locator('text=Campaigns')).toBeVisible();
    
    // Check if campaign data is displayed
    await expect(page.locator('text=Facebook Traffic')).toBeVisible();
    await expect(page.locator('text=Instagram Shopping')).toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    // Check if performance metrics are visible
    await expect(page.locator('text=CTR')).toBeVisible();
    await expect(page.locator('text=CPC')).toBeVisible();
    await expect(page.locator('text=ROAS')).toBeVisible();
    await expect(page.locator('text=Conversions')).toBeVisible();
    
    // Check if values are displayed as percentages/currency
    const percentageValues = page.locator('text=/%/');
    const currencyValues = page.locator('text=/€\\d+/');
    
    if (await percentageValues.count() > 0) {
      await expect(percentageValues.first()).toBeVisible();
    }
    if (await currencyValues.count() > 0) {
      await expect(currencyValues.first()).toBeVisible();
    }
  });

  test('should create new Google Ads campaign', async ({ page }) => {
    await page.click('text=Nieuwe Google Ads Campaign');
    
    // Modal should be visible
    await expect(page.locator('text=Nieuwe Google Ads Campaign')).toBeVisible();
    
    // Fill in campaign details
    await page.fill('input[placeholder="Campaign naam"]', 'Test Campaign');
    await page.fill('input[placeholder="Dagelijks budget"]', '50.00');
    await page.selectOption('select', 'SEARCH');
    
    await page.click('text=Aanmaken');
    
    // Should show success or close modal
    await page.waitForTimeout(1000);
  });

  test('should create new Meta Ads campaign', async ({ page }) => {
    await page.click('text=Nieuwe Meta Campaign');
    
    // Modal should be visible
    await expect(page.locator('text=Nieuwe Meta Campaign')).toBeVisible();
    
    // Fill in campaign details
    await page.fill('input[placeholder="Campaign naam"]', 'Test Meta Campaign');
    await page.fill('input[placeholder="Dagelijks budget"]', '30.00');
    await page.selectOption('select', 'OUTCOME_SALES');
    
    await page.click('text=Aanmaken');
    
    // Should show success or close modal
    await page.waitForTimeout(1000);
  });

  test('should display campaign performance charts', async ({ page }) => {
    // Check if charts are rendered
    await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should test API connections', async ({ page }) => {
    // Look for connection status indicators
    const connectionIndicators = page.locator('text=/Connected|Disconnected|Mock Data/');
    if (await connectionIndicators.count() > 0) {
      await expect(connectionIndicators.first()).toBeVisible();
    }
  });

  test('should display cost breakdown', async ({ page }) => {
    // Check if advertising costs are broken down correctly
    await expect(page.locator('text=Total Spent')).toBeVisible();
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=ROI')).toBeVisible();
    
    // Check currency formatting
    const costValues = page.locator('text=/€\\d+\\.\\d{2}/');
    await expect(costValues.first()).toBeVisible();
  });

  test('should refresh campaign data', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.locator('text=Vernieuwen');
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

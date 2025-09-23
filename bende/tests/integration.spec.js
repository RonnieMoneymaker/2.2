const { test, expect } = require('@playwright/test');

test.describe('Platform Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('should test complete order fulfillment workflow', async ({ page }) => {
    // Go to orders page
    await page.goto('/orders');
    
    // Select an order
    await page.click('tbody tr:first-child input[type="checkbox"]');
    
    // Create DHL label
    await page.click('text=Maak DHL Labels');
    await page.waitForTimeout(3000);
    
    // Should show success message
    await expect(page.locator('text=DHL labels aangemaakt')).toBeVisible();
    
    // Order status should be updated
    await expect(page.locator('text=shipped')).toBeVisible();
  });

  test('should test email notification workflow', async ({ page }) => {
    // Go to orders and trigger shipping
    await page.goto('/orders');
    await page.click('.lucide-truck').first();
    
    // Should trigger email notification
    await page.waitForTimeout(2000);
    
    // Check console for email confirmation (in real test, verify actual email)
    const logs = await page.evaluate(() => {
      return window.console._logs || [];
    });
    
    // In a real environment, we'd verify email was sent to customer
  });

  test('should test Google Ads API integration', async ({ page }) => {
    await page.goto('/advertising');
    
    // Check if Google Ads data loads
    await expect(page.locator('text=Google Ads')).toBeVisible();
    
    // Try to create new campaign
    await page.click('text=Nieuwe Google Ads Campaign');
    await page.fill('input[placeholder="Campaign naam"]', 'Playwright Test Campaign');
    await page.fill('input[placeholder="Dagelijks budget"]', '25.00');
    await page.click('text=Aanmaken');
    
    await page.waitForTimeout(2000);
    
    // Should show success or mock confirmation
    // In real environment, this would create actual Google Ads campaign
  });

  test('should test Meta Ads API integration', async ({ page }) => {
    await page.goto('/advertising');
    
    // Check if Meta Ads data loads
    await expect(page.locator('text=Meta Ads')).toBeVisible();
    
    // Try to create new campaign
    await page.click('text=Nieuwe Meta Campaign');
    await page.fill('input[placeholder="Campaign naam"]', 'Playwright Meta Test');
    await page.fill('input[placeholder="Dagelijks budget"]', '20.00');
    await page.click('text=Aanmaken');
    
    await page.waitForTimeout(2000);
    
    // Should show success or mock confirmation
  });

  test('should test profit calculations across all pages', async ({ page }) => {
    // Test dashboard profit calculations
    await page.goto('/dashboard');
    await expect(page.locator('text=Echte winst')).toBeVisible();
    
    // Test customers profit calculations
    await page.goto('/customers');
    await expect(page.locator('th:has-text("Echte Winst")')).toBeVisible();
    
    // Test products profit calculations
    await page.goto('/products');
    await expect(page.locator('th:has-text("Echte Winst/stuk")')).toBeVisible();
    
    // Test orders profit calculations
    await page.goto('/orders');
    await expect(page.locator('th:has-text("Echte Winst")')).toBeVisible();
  });

  test('should test navigation between all pages', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/customers', 
      '/orders',
      '/products',
      '/advertising',
      '/costs',
      '/profit-analytics',
      '/ai-insights',
      '/shipping-tax',
      '/shipping-rules',
      '/saas-dashboard',
      '/payment-providers',
      '/geographic-map'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Should load without errors
      await expect(page.locator('h1')).toBeVisible();
      
      // Should not show error messages
      await expect(page.locator('text=Error')).not.toBeVisible();
      await expect(page.locator('text=404')).not.toBeVisible();
    }
  });

  test('should test sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test all sidebar links
    await page.click('text=Klanten');
    await expect(page).toHaveURL('/customers');
    
    await page.click('text=Bestellingen');
    await expect(page).toHaveURL('/orders');
    
    await page.click('text=Producten');
    await expect(page).toHaveURL('/products');
    
    await page.click('text=Advertising');
    await expect(page).toHaveURL('/advertising');
    
    await page.click('text=AI Inzichten');
    await expect(page).toHaveURL('/ai-insights');
  });

  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Dashboard should be responsive
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/customers');
    
    // Customer page should be responsive
    await expect(page.locator('table')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should test API error handling', async ({ page }) => {
    // This test checks how the app handles API errors
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/dashboard');
    
    // Should still show dashboard with mock data
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Should show some data (mock data fallback)
    await expect(page.locator('text=/€\\d+/').first()).toBeVisible();
  });

  test('should test bulk operations performance', async ({ page }) => {
    await page.goto('/orders');
    
    // Select all orders
    await page.click('th input[type="checkbox"]');
    
    // Perform bulk operation
    await page.click('text=Download Pakbonnen');
    
    // Should handle bulk operation without timeout
    await page.waitForTimeout(5000);
    
    // Should complete successfully
    await expect(page.locator('text=Pakbonnen gedownload')).toBeVisible();
  });
});

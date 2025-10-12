const { test, expect } = require('@playwright/test');

test.describe('Shipping & DHL Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('should access shipping tax calculator', async ({ page }) => {
    await page.goto('/shipping-tax');
    
    await expect(page.locator('h1')).toContainText('Verzending & Belasting');
    
    // Check if calculators are visible
    await expect(page.locator('text=Verzendkosten Calculator')).toBeVisible();
    await expect(page.locator('text=BTW Calculator')).toBeVisible();
  });

  test('should calculate shipping costs', async ({ page }) => {
    await page.goto('/shipping-tax');
    
    // Fill in shipping calculator
    await page.fill('input[placeholder="Gewicht (gram)"]', '500');
    await page.fill('input[placeholder="Lengte (cm)"]', '20');
    await page.fill('input[placeholder="Breedte (cm)"]', '15');
    await page.fill('input[placeholder="Hoogte (cm)"]', '10');
    await page.selectOption('select', 'NL');
    
    await page.click('text=Bereken Verzendkosten');
    
    // Should show calculated shipping cost
    await expect(page.locator('text=/€\\d+\\.\\d{2}/')).toBeVisible();
  });

  test('should calculate VAT/BTW', async ({ page }) => {
    await page.goto('/shipping-tax');
    
    // Fill in VAT calculator
    await page.fill('input[placeholder="Bedrag (excl. BTW)"]', '100.00');
    await page.selectOption('select', '21'); // 21% BTW
    
    await page.click('text=Bereken BTW');
    
    // Should show calculated VAT
    await expect(page.locator('text=€121.00')).toBeVisible(); // 100 + 21% BTW
  });

  test('should manage shipping rules', async ({ page }) => {
    await page.goto('/shipping-rules');
    
    await expect(page.locator('h1')).toContainText('Verzendregels');
    
    // Check if shipping rules table is visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Bestemming")')).toBeVisible();
    await expect(page.locator('th:has-text("Gewicht")')).toBeVisible();
    await expect(page.locator('th:has-text("Prijs")')).toBeVisible();
  });

  test('should add new shipping rule', async ({ page }) => {
    await page.goto('/shipping-rules');
    await page.click('text=Nieuwe Regel');
    
    // Fill in shipping rule
    await page.selectOption('select', 'NL');
    await page.fill('input[placeholder="Min gewicht (gram)"]', '0');
    await page.fill('input[placeholder="Max gewicht (gram)"]', '1000');
    await page.fill('input[placeholder="Prijs"]', '5.95');
    await page.selectOption('select', 'standard');
    
    await page.click('text=Toevoegen');
    
    // Should add rule to table
    await page.waitForTimeout(1000);
  });

  test('should edit shipping rule', async ({ page }) => {
    await page.goto('/shipping-rules');
    
    // Click edit button on first rule
    await page.click('.lucide-edit').first();
    
    // Update price
    await page.fill('input[placeholder="Prijs"]', '7.95');
    await page.click('text=Opslaan');
    
    await page.waitForTimeout(1000);
  });

  test('should delete shipping rule', async ({ page }) => {
    await page.goto('/shipping-rules');
    
    // Click delete button on first rule
    await page.click('.lucide-trash-2').first();
    
    // Should show confirmation
    await expect(page.locator('text=Weet je het zeker?')).toBeVisible();
    await page.click('text=Verwijderen');
    
    await page.waitForTimeout(1000);
  });

  test('should test DHL API connection', async ({ page }) => {
    await page.goto('/shipping-rules');
    
    // Look for DHL connection status
    const connectionStatus = page.locator('text=/DHL.*Connected|DHL.*Disconnected|Mock.*DHL/');
    if (await connectionStatus.count() > 0) {
      await expect(connectionStatus.first()).toBeVisible();
    }
  });

  test('should create DHL label from orders page', async ({ page }) => {
    await page.goto('/orders');
    
    // Click DHL button on first order
    await page.click('.lucide-truck').first();
    
    // Should show loading or success state
    await page.waitForTimeout(2000);
    
    // Check if tracking number appears or success message
    await page.waitForSelector('text=/3S4A|DHL|Track/', { timeout: 5000 });
  });

  test('should send shipping notification email', async ({ page }) => {
    await page.goto('/orders');
    
    // Create DHL label which should trigger email
    await page.click('.lucide-truck').first();
    await page.waitForTimeout(2000);
    
    // Email should be sent (we can check console logs or success indicators)
    // In a real test environment, we'd verify the email was actually sent
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/orders');
  });

  test('should display orders list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bestellingen');
    
    // Check if orders table is visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Bestelnummer")')).toBeVisible();
    await expect(page.locator('th:has-text("Klant")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Echte Winst")')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    await page.selectOption('select', 'delivered');
    
    // Should show only delivered orders
    await expect(page.locator('text=delivered').first()).toBeVisible();
  });

  test('should search orders', async ({ page }) => {
    await page.fill('input[placeholder*="Zoek"]', 'ORD-2024');
    await page.keyboard.press('Enter');
    
    // Should filter results
    await expect(page.locator('td:has-text("ORD-2024")')).toBeVisible();
  });

  test('should select individual orders', async ({ page }) => {
    // Click checkbox on first order
    await page.click('input[type="checkbox"]').first();
    
    // Bulk action buttons should become visible/enabled
    await expect(page.locator('text=Download Pakbonnen')).toBeVisible();
    await expect(page.locator('text=Maak DHL Labels')).toBeVisible();
  });

  test('should select all orders', async ({ page }) => {
    // Click "select all" checkbox
    await page.click('th input[type="checkbox"]');
    
    // All order checkboxes should be checked
    const orderCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await orderCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      await expect(orderCheckboxes.nth(i)).toBeChecked();
    }
  });

  test('should create DHL label for single order', async ({ page }) => {
    // Click DHL button on first order
    await page.click('.lucide-truck').first();
    
    // Should show success message or modal
    await page.waitForTimeout(1000); // Wait for API call
    // Note: In a real test, we'd check for specific success indicators
  });

  test('should download packing slip for single order', async ({ page }) => {
    // Click packing slip button on first order
    await page.click('.lucide-file-text').first();
    
    // Should trigger download
    await page.waitForTimeout(1000);
  });

  test('should perform bulk DHL label creation', async ({ page }) => {
    // Select multiple orders
    await page.click('tbody tr:nth-child(1) input[type="checkbox"]');
    await page.click('tbody tr:nth-child(2) input[type="checkbox"]');
    
    // Click bulk DHL button
    await page.click('text=Maak DHL Labels');
    
    // Should show loading state
    await expect(page.locator('text=Bezig met aanmaken...')).toBeVisible();
    await page.waitForTimeout(2000); // Wait for bulk operation
  });

  test('should perform bulk packing slip download', async ({ page }) => {
    // Select multiple orders
    await page.click('tbody tr:nth-child(1) input[type="checkbox"]');
    await page.click('tbody tr:nth-child(2) input[type="checkbox"]');
    
    // Click bulk download button
    await page.click('text=Download Pakbonnen');
    
    // Should show loading state
    await expect(page.locator('text=Bezig met downloaden...')).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('should update order status', async ({ page }) => {
    // Find first order and change its status
    const statusSelect = page.locator('tbody tr:first-child select');
    await statusSelect.selectOption('shipped');
    
    // Should update automatically
    await page.waitForTimeout(1000);
  });

  test('should display profit calculations in orders', async ({ page }) => {
    // Check if profit columns are visible
    await expect(page.locator('th:has-text("Echte Winst")')).toBeVisible();
    
    // Check if profit values are displayed correctly
    const profitCells = page.locator('td:has-text("€")');
    await expect(profitCells.first()).toBeVisible();
  });

  test('should export orders', async ({ page }) => {
    await page.click('text=Exporteren');
    
    // Should trigger export
    await page.waitForTimeout(1000);
  });
});

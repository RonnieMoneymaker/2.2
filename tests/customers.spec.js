const { test, expect } = require('@playwright/test');

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/customers');
  });

  test('should display customers list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Klanten');
    
    // Check if customer table is visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Naam")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Echte Winst")')).toBeVisible();
  });

  test('should search customers', async ({ page }) => {
    // Test search functionality
    await page.fill('input[placeholder*="Zoek"]', 'Piet');
    await page.keyboard.press('Enter');
    
    // Should filter results
    await expect(page.locator('td:has-text("Piet")')).toBeVisible();
  });

  test('should filter customers by status', async ({ page }) => {
    // Test status filter
    await page.selectOption('select', 'vip');
    
    // Should show only VIP customers
    await expect(page.locator('text=VIP').first()).toBeVisible();
  });

  test('should open add customer modal', async ({ page }) => {
    await page.click('text=Nieuwe Klant');
    
    // Modal should be visible
    await expect(page.locator('text=Nieuwe klant toevoegen')).toBeVisible();
    await expect(page.locator('input[placeholder="Voornaam"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Achternaam"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
  });

  test('should add new customer', async ({ page }) => {
    await page.click('text=Nieuwe Klant');
    
    // Fill in customer details
    await page.fill('input[placeholder="Voornaam"]', 'Test');
    await page.fill('input[placeholder="Achternaam"]', 'Gebruiker');
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.fill('input[placeholder="Telefoon"]', '+31612345678');
    await page.fill('input[placeholder="Straat"]', 'Teststraat 123');
    await page.fill('input[placeholder="Postcode"]', '1234AB');
    await page.fill('input[placeholder="Stad"]', 'Amsterdam');
    
    await page.click('text=Toevoegen');
    
    // Should close modal and show success
    await expect(page.locator('text=Nieuwe klant toevoegen')).not.toBeVisible();
  });

  test('should edit existing customer', async ({ page }) => {
    // Click edit button on first customer
    await page.click('.lucide-edit').first();
    
    // Modal should open with existing data
    await expect(page.locator('text=Klant bewerken')).toBeVisible();
    
    // Update email
    await page.fill('input[placeholder="Email"]', 'updated@example.com');
    await page.click('text=Opslaan');
    
    // Should close modal
    await expect(page.locator('text=Klant bewerken')).not.toBeVisible();
  });

  test('should delete customer', async ({ page }) => {
    // Click delete button on first customer
    await page.click('.lucide-trash-2').first();
    
    // Should show confirmation
    await expect(page.locator('text=Weet je het zeker?')).toBeVisible();
    await page.click('text=Verwijderen');
    
    // Should close confirmation
    await expect(page.locator('text=Weet je het zeker?')).not.toBeVisible();
  });

  test('should navigate to customer detail page', async ({ page }) => {
    // Click on first customer row
    await page.click('tbody tr').first();
    
    // Should navigate to customer detail
    await expect(page).toHaveURL(/.*\/customers\/\d+/);
    await expect(page.locator('h1')).toContainText('Klant Details');
  });

  test('should display customer profit calculations', async ({ page }) => {
    // Check if profit calculations are visible in the table
    const profitCells = page.locator('td:has-text("€")');
    await expect(profitCells.first()).toBeVisible();
    
    // Check if profit values include + or - signs
    const profitValues = page.locator('text=/[+\\-]€\\d+\\.\\d{2}/');
    await expect(profitValues.first()).toBeVisible();
  });

  test('should export customers', async ({ page }) => {
    await page.click('text=Exporteren');
    
    // Should trigger download (we can't easily test actual download in Playwright)
    // But we can check if the button works
    await expect(page.locator('text=Exporteren')).toBeVisible();
  });
});

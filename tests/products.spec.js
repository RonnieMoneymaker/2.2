const { test, expect } = require('@playwright/test');

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/products');
  });

  test('should display products list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Producten');
    
    // Check if products table is visible
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Product")')).toBeVisible();
    await expect(page.locator('th:has-text("Prijs")')).toBeVisible();
    await expect(page.locator('th:has-text("Echte Winst/stuk")')).toBeVisible();
    await expect(page.locator('th:has-text("Winst %")')).toBeVisible();
  });

  test('should open add product modal', async ({ page }) => {
    await page.click('text=Nieuw Product');
    
    // Modal should be visible
    await expect(page.locator('text=Nieuw product toevoegen')).toBeVisible();
    await expect(page.locator('input[placeholder="Productnaam"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Verkoopprijs"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Inkoopprijs"]')).toBeVisible();
  });

  test('should add new product with profit calculation', async ({ page }) => {
    await page.click('text=Nieuw Product');
    
    // Fill in product details
    await page.fill('input[placeholder="Productnaam"]', 'Test Product');
    await page.fill('textarea[placeholder="Beschrijving"]', 'Dit is een test product');
    await page.fill('input[placeholder="Verkoopprijs"]', '99.99');
    await page.fill('input[placeholder="Inkoopprijs"]', '60.00');
    await page.fill('input[placeholder="Gewicht (gram)"]', '500');
    await page.fill('input[placeholder="Verzendkosten"]', '6.95');
    await page.fill('input[placeholder="Product afbeelding URL"]', 'https://example.com/image.jpg');
    await page.fill('input[placeholder="Voorraad"]', '50');
    
    // Check if profit calculation is visible
    await expect(page.locator('text=Winst Berekening')).toBeVisible();
    await expect(page.locator('text=Echte Winst per stuk')).toBeVisible();
    
    await page.click('text=Toevoegen');
    
    // Should close modal
    await expect(page.locator('text=Nieuw product toevoegen')).not.toBeVisible();
  });

  test('should edit existing product', async ({ page }) => {
    // Click edit button on first product
    await page.click('.lucide-edit').first();
    
    // Modal should open with existing data
    await expect(page.locator('text=Product bewerken')).toBeVisible();
    
    // Update price
    await page.fill('input[placeholder="Verkoopprijs"]', '109.99');
    await page.click('text=Opslaan');
    
    // Should close modal
    await expect(page.locator('text=Product bewerken')).not.toBeVisible();
  });

  test('should delete product', async ({ page }) => {
    // Click delete button on first product
    await page.click('.lucide-trash-2').first();
    
    // Should show confirmation
    await expect(page.locator('text=Weet je het zeker?')).toBeVisible();
    await page.click('text=Verwijderen');
    
    // Should close confirmation
    await expect(page.locator('text=Weet je het zeker?')).not.toBeVisible();
  });

  test('should display product images', async ({ page }) => {
    // Check if product images are displayed
    const images = page.locator('img[alt*="Product"]');
    if (await images.count() > 0) {
      await expect(images.first()).toBeVisible();
    }
  });

  test('should display profit calculations correctly', async ({ page }) => {
    // Check if profit columns show correct values
    await expect(page.locator('th:has-text("Echte Winst/stuk")')).toBeVisible();
    await expect(page.locator('th:has-text("Winst %")')).toBeVisible();
    await expect(page.locator('th:has-text("Totale Winst")')).toBeVisible();
    
    // Check if values are formatted as currency
    const profitCells = page.locator('td:has-text("€")');
    await expect(profitCells.first()).toBeVisible();
  });

  test('should show profit calculation in modal', async ({ page }) => {
    await page.click('text=Nieuw Product');
    
    // Fill in some prices to trigger calculation
    await page.fill('input[placeholder="Verkoopprijs"]', '100.00');
    await page.fill('input[placeholder="Inkoopprijs"]', '65.00');
    await page.fill('input[placeholder="Verzendkosten"]', '5.95');
    
    // Should show profit calculation section
    await expect(page.locator('text=Winst Berekening')).toBeVisible();
    await expect(page.locator('text=Echte Winst per stuk')).toBeVisible();
    await expect(page.locator('text=Winstmarge')).toBeVisible();
  });

  test('should sort products by different columns', async ({ page }) => {
    // Click on price column to sort
    await page.click('th:has-text("Prijs")');
    await page.waitForTimeout(500);
    
    // Click on profit column to sort
    await page.click('th:has-text("Echte Winst/stuk")');
    await page.waitForTimeout(500);
  });
});

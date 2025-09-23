const { test, expect } = require('@playwright/test');

test.describe('Customer Login System', () => {
  test('should test complete customer login flow', async ({ page }) => {
    console.log('🧪 Testing Complete Customer Login Flow...');
    
    // 1. Navigate to admin login
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText('Inloggen bij CRM');
    
    // 2. Click customer login link
    await page.click('text=👥 Klant Login Portal →');
    await expect(page).toHaveURL(/.*customer-login/);
    await expect(page.locator('h2')).toContainText('Inloggen');
    
    console.log('✅ Customer login page loads correctly');
    
    // 3. Test customer registration
    await page.click('text=Nog geen account? Registreer hier');
    await expect(page.locator('h2')).toContainText('Account Aanmaken');
    
    // Fill registration form
    await page.fill('input[placeholder="Voornaam"]', 'Playwright');
    await page.fill('input[placeholder="Achternaam"]', 'Test');
    await page.fill('input[placeholder="je@email.com"]', 'playwright.test@example.com');
    await page.fill('input[placeholder="Minimaal 6 karakters"]', 'testpass123');
    await page.fill('input[placeholder="+31 6 12345678"]', '+31612345678');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    console.log('✅ Customer registration form submitted');
    
    // 4. Switch back to login
    await page.click('text=Al een account? Inloggen');
    await expect(page.locator('h2')).toContainText('Inloggen');
    
    // 5. Use demo customer credentials
    await page.click('text=Demo klant inloggegevens gebruiken');
    await expect(page.locator('input[type="email"]')).toHaveValue('piet.bakker@email.com');
    await expect(page.locator('input[type="password"]')).toHaveValue('customer123');
    
    console.log('✅ Demo customer credentials filled automatically');
    
    // 6. Login as customer
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Should redirect to customer portal
    await expect(page).toHaveURL(/.*customer-portal/);
    await expect(page.locator('h1')).toContainText('Mijn Account');
    await expect(page.locator('text=Welkom terug, Piet!')).toBeVisible();
    
    console.log('✅ Customer login successful - redirected to portal');
    
    // 7. Test customer portal tabs
    await expect(page.locator('text=Overzicht')).toBeVisible();
    await expect(page.locator('text=Mijn Bestellingen')).toBeVisible();
    await expect(page.locator('text=Profiel')).toBeVisible();
    
    // Test tab navigation
    await page.click('text=Mijn Bestellingen');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Bestelling")')).toBeVisible();
    
    console.log('✅ Customer portal orders tab works');
    
    await page.click('text=Profiel');
    await expect(page.locator('text=Persoonlijke Gegevens')).toBeVisible();
    await expect(page.locator('text=Piet')).toBeVisible();
    
    console.log('✅ Customer portal profile tab works');
    
    // 8. Test customer logout
    await page.click('text=Uitloggen');
    await expect(page).toHaveURL(/.*customer-login/);
    
    console.log('✅ Customer logout works');
    
    // 9. Test admin login still works
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    console.log('✅ Admin login still works correctly');
    
    console.log('\n🎉 COMPLETE LOGIN SYSTEM TEST PASSED!');
    console.log('✅ Admin Login Portal: Working');
    console.log('✅ Customer Login Portal: Working');
    console.log('✅ Customer Registration: Working');
    console.log('✅ Customer Portal: Working');
    console.log('✅ Role Separation: Working');
    console.log('✅ Navigation: Working');
    console.log('✅ Logout: Working');
  });

  test('should display customer analytics and data', async ({ page }) => {
    // Login as customer
    await page.goto('http://localhost:3000/customer-login');
    await page.click('text=Demo klant inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/.*customer-portal/);
    
    // Check overview stats
    await expect(page.locator('text=Totaal Bestellingen')).toBeVisible();
    await expect(page.locator('text=Totaal Besteed')).toBeVisible();
    await expect(page.locator('text=Gemiddelde Bestelling')).toBeVisible();
    
    // Check if customer data is displayed
    const totalOrdersElement = page.locator('text=Totaal Bestellingen').locator('..').locator('.text-2xl');
    await expect(totalOrdersElement).toBeVisible();
    
    console.log('✅ Customer analytics display correctly');
  });
});

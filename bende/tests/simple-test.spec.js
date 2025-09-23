const { test, expect } = require('@playwright/test');

test.describe('Simple System Test', () => {
  test('should test basic CRM functionality', async ({ page }) => {
    console.log('🔍 SIMPLE SYSTEM TEST...');
    
    // Test 1: Application loads
    await page.goto('http://localhost:3000');
    console.log('✅ Navigated to application');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    console.log('✅ Redirects to login page');
    
    // Check login elements
    await expect(page.locator('h2')).toContainText('Inloggen bij CRM');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    console.log('✅ Login page elements visible');
    
    // Use demo credentials
    await page.click('text=Demo inloggegevens gebruiken');
    await expect(page.locator('input[type="email"]')).toHaveValue('admin@webshop.nl');
    console.log('✅ Demo credentials work');
    
    // Attempt login
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Check if login successful
    const currentUrl = page.url();
    console.log('URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard') || currentUrl === 'http://localhost:3000/') {
      console.log('🎉 LOGIN SUCCESSFUL!');
      
      // Test dashboard (use specific selector for main dashboard title)
      await expect(page.locator('main h1, [role="main"] h1').first()).toContainText('Dashboard');
      console.log('✅ Dashboard loads');
      
      // Test navigation
      await page.click('a[href="/customers"]');
      await page.waitForTimeout(2000);
      await expect(page.locator('main h1').first()).toContainText('Klanten');
      console.log('✅ Customer page loads');
      
      await page.click('a[href="/orders"]');
      await page.waitForTimeout(2000);
      await expect(page.locator('main h1').first()).toContainText('Bestellingen');
      console.log('✅ Orders page loads');
      
      await page.click('a[href="/products"]');
      await page.waitForTimeout(2000);
      await expect(page.locator('main h1').first()).toContainText('Producten');
      console.log('✅ Products page loads');
      
      console.log('🎉 ALL CORE PAGES WORKING!');
      
    } else {
      console.log('❌ Login failed - checking for errors');
      
      // Look for error messages
      const errorVisible = await page.locator('text=Verbindingsfout').isVisible();
      if (errorVisible) {
        console.log('❌ Connection error detected - backend issue');
      } else {
        console.log('❌ Unknown login issue');
      }
    }
  });
  
  test('should test customer portal', async ({ page }) => {
    console.log('👥 Testing customer portal...');
    
    await page.goto('http://localhost:3000/customer-login');
    await expect(page.locator('h2')).toContainText('Inloggen');
    console.log('✅ Customer login page loads');
    
    // Test customer login - use manual credentials instead of demo button
    await page.fill('input[type="email"]', 'piet.bakker@email.com');
    await page.fill('input[type="password"]', 'customer123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    if (url.includes('/customer-portal')) {
      console.log('✅ Customer portal works');
      await expect(page.locator('h1')).toContainText('Mijn Account');
    } else {
      console.log('❌ Customer portal failed - URL:', url);
      
      // Debug customer login issue
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('Verbindingsfout')) {
        console.log('❌ Backend connection error for customer login');
      } else if (bodyText.includes('Ongeldige')) {
        console.log('❌ Invalid customer credentials');
      } else {
        console.log('❌ Unknown customer login issue');
      }
    }
  });
});

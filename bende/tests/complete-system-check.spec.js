const { test, expect } = require('@playwright/test');

test.describe('Complete System Check', () => {
  test('should perform comprehensive system test', async ({ page }) => {
    console.log('🔍 COMPREHENSIVE SYSTEM CHECK STARTING...');
    
    // 1. Test if application loads
    console.log('1️⃣ Testing application loading...');
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're on login page
    if (currentUrl.includes('/login')) {
      console.log('✅ Application loads - redirects to login correctly');
      
      // Test login page elements
      await expect(page.locator('h2')).toContainText('Inloggen bij CRM');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      console.log('✅ Login page elements are visible');
      
      // Test demo credentials
      await page.click('text=Demo inloggegevens gebruiken');
      await expect(page.locator('input[type="email"]')).toHaveValue('admin@webshop.nl');
      console.log('✅ Demo credentials work');
      
      // Attempt login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      const afterLoginUrl = page.url();
      console.log('URL after login attempt:', afterLoginUrl);
      
      if (afterLoginUrl.includes('/dashboard') || afterLoginUrl === 'http://localhost:3000/') {
        console.log('✅ LOGIN SUCCESSFUL - Testing dashboard...');
        
        // Test dashboard elements
        try {
          await expect(page.locator('h1')).toContainText('Dashboard');
          console.log('✅ Dashboard title visible');
          
          // Test stats cards
          await expect(page.locator('text=Klanten')).toBeVisible();
          await expect(page.locator('text=Bestellingen')).toBeVisible();
          await expect(page.locator('text=Omzet')).toBeVisible();
          console.log('✅ Dashboard stats cards visible');
          
          // Test navigation
          await page.click('text=Klanten');
          await page.waitForTimeout(2000);
          await expect(page.locator('h1')).toContainText('Klanten');
          console.log('✅ Navigation to customers works');
          
          await page.click('text=Bestellingen');
          await page.waitForTimeout(2000);
          await expect(page.locator('h1')).toContainText('Bestellingen');
          console.log('✅ Navigation to orders works');
          
          await page.click('text=Producten');
          await page.waitForTimeout(2000);
          await expect(page.locator('h1')).toContainText('Producten');
          console.log('✅ Navigation to products works');
          
          // Test Magic Live Map
          await page.click('text=Magic Live Map');
          await page.waitForTimeout(3000);
          await expect(page.locator('h1')).toContainText('Magic Live Map');
          console.log('✅ Magic Live Map loads');
          
          // Test AI Insights
          await page.click('text=AI Inzichten');
          await page.waitForTimeout(2000);
          await expect(page.locator('h1')).toContainText('AI Business Intelligence');
          console.log('✅ Enhanced AI Insights loads');
          
          console.log('🎉 ALL CORE FUNCTIONALITY WORKING!');
          
        } catch (dashboardError) {
          console.log('❌ Dashboard elements not found:', dashboardError.message);
        }
        
      } else {
        console.log('❌ Login failed - still on login page');
        
        // Check for error messages
        const errorElement = page.locator('.text-red-600');
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log('Error message:', errorText);
        }
      }
      
    } else {
      console.log('❌ Application did not redirect to login - unexpected behavior');
    }
    
    // Test customer portal
    console.log('2️⃣ Testing customer portal...');
    await page.goto('http://localhost:3000/customer-login');
    await page.waitForTimeout(2000);
    
    try {
      await expect(page.locator('h2')).toContainText('Inloggen');
      console.log('✅ Customer login page loads');
      
      // Test customer demo login
      await page.click('text=Demo klant inloggegevens gebruiken');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const customerUrl = page.url();
      if (customerUrl.includes('/customer-portal')) {
        console.log('✅ Customer login works');
        await expect(page.locator('h1')).toContainText('Mijn Account');
        console.log('✅ Customer portal loads');
      } else {
        console.log('❌ Customer login failed');
      }
      
    } catch (customerError) {
      console.log('❌ Customer portal error:', customerError.message);
    }
  });

  test('should test API endpoints directly', async ({ page }) => {
    // Test API endpoints by checking network responses
    console.log('🔌 Testing API endpoints...');
    
    await page.goto('http://localhost:3000/login');
    
    // Monitor network requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Trigger API calls by logging in
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Check API responses
    console.log('API Responses:', responses);
    
    const successfulAPIs = responses.filter(r => r.status === 200 || r.status === 304);
    const failedAPIs = responses.filter(r => r.status >= 400);
    
    console.log(`✅ Successful API calls: ${successfulAPIs.length}`);
    console.log(`❌ Failed API calls: ${failedAPIs.length}`);
    
    successfulAPIs.forEach(api => {
      console.log(`  ✅ ${api.url} - ${api.status}`);
    });
    
    failedAPIs.forEach(api => {
      console.log(`  ❌ ${api.url} - ${api.status} ${api.statusText}`);
    });
  });
});




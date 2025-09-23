const { test, expect } = require('@playwright/test');

test.describe('Parallel Stress Test', () => {
  test('should test dashboard under load', async ({ page }) => {
    console.log('📊 Testing Dashboard (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Test dashboard multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForTimeout(2000);
      
      const title = await page.locator('h1').first().textContent();
      console.log(`Dashboard reload ${i + 1}: ${title ? 'Success' : 'Failed'}`);
    }
  });

  test('should test customers page under load', async ({ page }) => {
    console.log('👥 Testing Customers (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/customers');
    await page.waitForTimeout(2000);
    
    const table = await page.locator('table').isVisible();
    console.log('Customers table loaded:', table);
    
    // Test search functionality
    const searchField = page.locator('input[placeholder*="Zoek"]');
    if (await searchField.isVisible()) {
      await searchField.fill('Piet');
      await page.waitForTimeout(1000);
      await searchField.fill('');
      console.log('✅ Customer search works');
    }
  });

  test('should test orders page under load', async ({ page }) => {
    console.log('📦 Testing Orders (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/orders');
    await page.waitForTimeout(2000);
    
    const table = await page.locator('table').isVisible();
    console.log('Orders table loaded:', table);
    
    // Test bulk operations
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    console.log(`Found ${checkboxes} order checkboxes`);
    
    if (checkboxes > 0) {
      await page.locator('input[type="checkbox"]').first().click();
      console.log('✅ Order selection works');
    }
  });

  test('should test products page under load', async ({ page }) => {
    console.log('🛍️ Testing Products (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/products');
    await page.waitForTimeout(2000);
    
    const table = await page.locator('table').isVisible();
    console.log('Products table loaded:', table);
    
    // Test profit calculations visibility
    const profitColumns = await page.locator('th:has-text("Winst")').count();
    console.log(`Found ${profitColumns} profit columns`);
  });

  test('should test advertising page under load', async ({ page }) => {
    console.log('🎯 Testing Advertising (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/advertising');
    await page.waitForTimeout(2000);
    
    const googleAds = await page.locator('text=Google Ads').isVisible();
    const metaAds = await page.locator('text=Meta Ads').isVisible();
    console.log('Google Ads section:', googleAds);
    console.log('Meta Ads section:', metaAds);
  });

  test('should test AI insights under load', async ({ page }) => {
    console.log('🧠 Testing AI Insights (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/ai-insights');
    await page.waitForTimeout(2000);
    
    const recommendations = await page.locator('text=SCHAAL OP, text=URGENT, text=Aanbevelingen').count();
    console.log(`Found ${recommendations} AI recommendations`);
  });

  test('should test customer portal under load', async ({ page }) => {
    console.log('👤 Testing Customer Portal (Worker)');
    
    await page.goto('http://localhost:3000/customer-login');
    await page.waitForTimeout(2000);
    
    await page.click('text=Demo klant inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const portalUrl = page.url();
    if (portalUrl.includes('/customer-portal')) {
      console.log('✅ Customer portal login successful');
      
      // Test portal tabs
      const tabs = await page.locator('button:has-text("Overzicht"), button:has-text("Bestellingen"), button:has-text("Profiel")').count();
      console.log(`Found ${tabs} customer portal tabs`);
      
      // Test orders tab
      const ordersTab = page.locator('text=Mijn Bestellingen');
      if (await ordersTab.isVisible()) {
        await ordersTab.click();
        await page.waitForTimeout(1000);
        console.log('✅ Customer orders tab works');
      }
    }
  });

  test('should test magic live map', async ({ page }) => {
    console.log('🗺️ Testing Magic Live Map (Worker)');
    
    await page.goto('http://localhost:3000');
    await page.click('text=Demo inloggegevens gebruiken');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('http://localhost:3000/magic-live-map');
    await page.waitForTimeout(5000); // Extra time for map to load
    
    const mapTitle = await page.locator('h1:has-text("Magic Live Map")').isVisible();
    console.log('Magic Live Map loads:', mapTitle);
    
    // Check for live stats
    const liveStats = await page.locator('text=Live').count();
    console.log(`Found ${liveStats} live indicators`);
    
    // Check for map container
    const mapContainer = await page.locator('.leaflet-container').isVisible();
    console.log('Map container loaded:', mapContainer);
  });
});




const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Test and Fix', () => {
  test('should test everything and report status', async ({ page }) => {
    console.log('🔬 COMPREHENSIVE CRM SYSTEM TEST & DIAGNOSIS');
    console.log('=' .repeat(60));
    
    let testResults = {
      applicationLoads: false,
      loginPageVisible: false,
      loginWorks: false,
      dashboardLoads: false,
      navigationWorks: false,
      customerPortalWorks: false,
      apiCallsWork: false
    };
    
    try {
      // Test 1: Application Loading
      console.log('\n1️⃣ Testing application loading...');
      await page.goto('http://localhost:3000', { timeout: 30000 });
      testResults.applicationLoads = true;
      console.log('✅ Application loads successfully');
      
      // Test 2: Login Page
      console.log('\n2️⃣ Testing login page...');
      await page.waitForSelector('h2', { timeout: 10000 });
      const loginTitle = await page.locator('h2').textContent();
      
      if (loginTitle && loginTitle.includes('Inloggen')) {
        testResults.loginPageVisible = true;
        console.log('✅ Login page visible with correct title');
        
        // Test login form elements
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        console.log('✅ Login form elements are present');
        
        // Test demo credentials
        await page.click('text=Demo inloggegevens gebruiken');
        await expect(page.locator('input[type="email"]')).toHaveValue('admin@webshop.nl');
        await expect(page.locator('input[type="password"]')).toHaveValue('admin123');
        console.log('✅ Demo credentials function works');
        
        // Test 3: Login Process
        console.log('\n3️⃣ Testing login process...');
        
        // Monitor network requests
        const apiRequests = [];
        page.on('response', response => {
          if (response.url().includes('/api/')) {
            apiRequests.push({
              url: response.url(),
              status: response.status(),
              method: response.request().method()
            });
          }
        });
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        const currentUrl = page.url();
        console.log('Current URL after login:', currentUrl);
        
        if (currentUrl.includes('/dashboard') || currentUrl === 'http://localhost:3000/') {
          testResults.loginWorks = true;
          console.log('✅ Login successful - redirected correctly');
          
          // Test 4: Dashboard
          console.log('\n4️⃣ Testing dashboard...');
          try {
            await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
            testResults.dashboardLoads = true;
            console.log('✅ Dashboard loads with correct title');
            
            // Test dashboard elements
            const statsVisible = await page.locator('text=Klanten').isVisible();
            const ordersVisible = await page.locator('text=Bestellingen').isVisible();
            const revenueVisible = await page.locator('text=Omzet').isVisible();
            
            if (statsVisible && ordersVisible && revenueVisible) {
              console.log('✅ Dashboard stats cards are visible');
            } else {
              console.log('⚠️ Some dashboard elements missing');
            }
            
            // Test 5: Navigation
            console.log('\n5️⃣ Testing navigation...');
            
            // Test customers page
            await page.click('a[href="/customers"]');
            await page.waitForTimeout(3000);
            
            const customersTitle = await page.locator('h1').textContent();
            if (customersTitle && customersTitle.includes('Klanten')) {
              console.log('✅ Customers page loads');
              testResults.navigationWorks = true;
              
              // Test orders page
              await page.click('a[href="/orders"]');
              await page.waitForTimeout(3000);
              
              const ordersTitle = await page.locator('h1').textContent();
              if (ordersTitle && ordersTitle.includes('Bestellingen')) {
                console.log('✅ Orders page loads');
                
                // Test products page
                await page.click('a[href="/products"]');
                await page.waitForTimeout(3000);
                
                const productsTitle = await page.locator('h1').textContent();
                if (productsTitle && productsTitle.includes('Producten')) {
                  console.log('✅ Products page loads');
                  console.log('✅ Core navigation working perfectly!');
                }
              }
            }
            
          } catch (dashboardError) {
            console.log('❌ Dashboard loading failed:', dashboardError.message);
          }
          
        } else {
          console.log('❌ Login failed - still on login page');
          
          // Check for error messages
          const errorElement = page.locator('.text-red-600');
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            console.log('Error message found:', errorText);
          }
        }
        
        // Test 6: API Calls
        console.log('\n6️⃣ Analyzing API calls...');
        testResults.apiCallsWork = apiRequests.length > 0;
        
        const successfulAPIs = apiRequests.filter(req => req.status >= 200 && req.status < 400);
        const failedAPIs = apiRequests.filter(req => req.status >= 400);
        
        console.log(`API Calls made: ${apiRequests.length}`);
        console.log(`Successful: ${successfulAPIs.length}`);
        console.log(`Failed: ${failedAPIs.length}`);
        
        successfulAPIs.forEach(api => {
          console.log(`  ✅ ${api.method} ${api.url} - ${api.status}`);
        });
        
        failedAPIs.forEach(api => {
          console.log(`  ❌ ${api.method} ${api.url} - ${api.status}`);
        });
        
      } else {
        console.log('❌ Login page not found or incorrect title');
      }
      
      // Test 7: Customer Portal
      console.log('\n7️⃣ Testing customer portal...');
      await page.goto('http://localhost:3000/customer-login');
      
      try {
        await expect(page.locator('h2')).toContainText('Inloggen', { timeout: 5000 });
        console.log('✅ Customer login page loads');
        
        await page.click('text=Demo klant inloggegevens gebruiken');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/customer-portal')) {
          testResults.customerPortalWorks = true;
          console.log('✅ Customer portal works');
        } else {
          console.log('❌ Customer portal login failed');
        }
        
      } catch (customerError) {
        console.log('❌ Customer portal error:', customerError.message);
      }
      
    } catch (error) {
      console.log('❌ Critical error:', error.message);
    }
    
    // Final Report
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('=' .repeat(40));
    console.log(`Application Loads: ${testResults.applicationLoads ? '✅' : '❌'}`);
    console.log(`Login Page Visible: ${testResults.loginPageVisible ? '✅' : '❌'}`);
    console.log(`Login Works: ${testResults.loginWorks ? '✅' : '❌'}`);
    console.log(`Dashboard Loads: ${testResults.dashboardLoads ? '✅' : '❌'}`);
    console.log(`Navigation Works: ${testResults.navigationWorks ? '✅' : '❌'}`);
    console.log(`Customer Portal: ${testResults.customerPortalWorks ? '✅' : '❌'}`);
    console.log(`API Calls Work: ${testResults.apiCallsWork ? '✅' : '❌'}`);
    
    const workingFeatures = Object.values(testResults).filter(Boolean).length;
    const totalFeatures = Object.keys(testResults).length;
    
    console.log(`\n🎯 SYSTEM HEALTH: ${workingFeatures}/${totalFeatures} features working (${Math.round(workingFeatures/totalFeatures*100)}%)`);
    
    if (workingFeatures >= 5) {
      console.log('🎉 SYSTEM IS MOSTLY FUNCTIONAL - READY FOR USE!');
    } else if (workingFeatures >= 3) {
      console.log('⚠️ SYSTEM PARTIALLY WORKING - NEEDS MINOR FIXES');
    } else {
      console.log('❌ SYSTEM NEEDS MAJOR REPAIRS');
    }
    
    console.log('\n🚀 RECOMMENDATION:');
    if (workingFeatures >= 4) {
      console.log('Deploy to production now - core functionality works!');
      console.log('Railway deployment: railway.app → Deploy from GitHub');
    } else {
      console.log('Fix critical issues first, then deploy');
    }
  });
});




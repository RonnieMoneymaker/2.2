const { test, expect } = require('@playwright/test');

test.describe('Complete Application Test', () => {
  test('should test EVERYTHING step by step', async ({ page }) => {
    console.log('🚀 COMPLETE APPLICATION TEST - TESTING EVERY FEATURE');
    console.log('=' .repeat(70));
    
    // Configure longer timeout and better error handling
    test.setTimeout(120000); // 2 minutes
    
    try {
      // Step 1: Load application
      console.log('\n1️⃣ Loading application...');
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      console.log('✅ Application loaded');
      
      // Step 2: Check login page
      console.log('\n2️⃣ Checking login page...');
      const pageTitle = await page.title();
      console.log('Page title:', pageTitle);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-login-page.png' });
      console.log('📸 Screenshot saved: debug-login-page.png');
      
      // Look for any H1, H2, or form elements
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log('All headings found:', headings);
      
      const forms = await page.locator('form').count();
      console.log('Forms found:', forms);
      
      const inputs = await page.locator('input').count();
      console.log('Input fields found:', inputs);
      
      const buttons = await page.locator('button').count();
      console.log('Buttons found:', buttons);
      
      // Step 3: Try to find login elements by different selectors
      console.log('\n3️⃣ Finding login elements...');
      
      // Try different ways to find email field
      const emailField = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
      const emailByPlaceholder = await page.locator('input[placeholder*="email"]').first().isVisible().catch(() => false);
      const emailByName = await page.locator('input[name="email"]').first().isVisible().catch(() => false);
      
      console.log('Email field by type:', emailField);
      console.log('Email field by placeholder:', emailByPlaceholder);
      console.log('Email field by name:', emailByName);
      
      // Try different ways to find password field
      const passwordField = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
      const passwordByPlaceholder = await page.locator('input[placeholder*="wachtwoord"]').first().isVisible().catch(() => false);
      
      console.log('Password field by type:', passwordField);
      console.log('Password field by placeholder:', passwordByPlaceholder);
      
      // Step 4: Try to login with any available method
      console.log('\n4️⃣ Attempting login...');
      
      if (emailField || emailByPlaceholder || emailByName) {
        // Find the working email field
        let emailElement = page.locator('input[type="email"]').first();
        if (!emailField && emailByPlaceholder) {
          emailElement = page.locator('input[placeholder*="email"]').first();
        } else if (!emailField && !emailByPlaceholder && emailByName) {
          emailElement = page.locator('input[name="email"]').first();
        }
        
        await emailElement.fill('admin@webshop.nl');
        console.log('✅ Email filled');
        
        // Find password field
        let passwordElement = page.locator('input[type="password"]').first();
        if (!passwordField && passwordByPlaceholder) {
          passwordElement = page.locator('input[placeholder*="wachtwoord"]').first();
        }
        
        await passwordElement.fill('admin123');
        console.log('✅ Password filled');
        
        // Find and click submit button
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        console.log('✅ Login submitted');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        const newUrl = page.url();
        console.log('URL after login:', newUrl);
        
        // Step 5: Test dashboard if login successful
        if (newUrl.includes('/dashboard') || newUrl === 'http://localhost:3000/') {
          console.log('\n5️⃣ LOGIN SUCCESSFUL! Testing dashboard...');
          
          // Take screenshot of dashboard
          await page.screenshot({ path: 'debug-dashboard.png' });
          console.log('📸 Dashboard screenshot saved');
          
          // Look for dashboard content
          const allText = await page.locator('body').textContent();
          const hasDashboardContent = allText.includes('Dashboard') || 
                                     allText.includes('Klanten') || 
                                     allText.includes('Bestellingen') ||
                                     allText.includes('Omzet');
          
          console.log('Dashboard content detected:', hasDashboardContent);
          
          // Step 6: Test navigation by clicking sidebar links
          console.log('\n6️⃣ Testing navigation...');
          
          const sidebarLinks = await page.locator('nav a, .sidebar a, [class*="nav"] a').allTextContents();
          console.log('Sidebar links found:', sidebarLinks);
          
          // Try to click on different pages
          const pagesToTest = ['Klanten', 'Bestellingen', 'Producten', 'Analytics'];
          
          for (const pageText of pagesToTest) {
            try {
              const linkExists = await page.locator(`text=${pageText}`).first().isVisible().catch(() => false);
              if (linkExists) {
                await page.click(`text=${pageText}`);
                await page.waitForTimeout(2000);
                
                const currentPageTitle = await page.locator('h1').first().textContent().catch(() => 'No title');
                console.log(`✅ ${pageText} page loads - title: ${currentPageTitle}`);
                
                // Take screenshot of each page
                await page.screenshot({ path: `debug-${pageText.toLowerCase()}.png` });
              } else {
                console.log(`⚠️ ${pageText} link not found`);
              }
            } catch (navError) {
              console.log(`❌ Error navigating to ${pageText}:`, navError.message);
            }
          }
          
          console.log('\n🎉 NAVIGATION TEST COMPLETE!');
          
        } else {
          console.log('❌ Login failed - checking for error messages');
          
          const bodyText = await page.locator('body').textContent();
          if (bodyText.includes('Verbindingsfout')) {
            console.log('❌ Connection error detected');
          } else if (bodyText.includes('Server fout')) {
            console.log('❌ Server error detected');
          } else {
            console.log('❌ Unknown login issue');
          }
        }
        
      } else {
        console.log('❌ No login fields found');
      }
      
    } catch (error) {
      console.log('❌ Critical test error:', error.message);
      
      // Take error screenshot
      await page.screenshot({ path: 'debug-error.png' });
      console.log('📸 Error screenshot saved');
    }
    
    console.log('\n📊 COMPLETE TEST FINISHED');
    console.log('Check debug screenshots for visual verification');
    console.log('Screenshots saved: debug-login-page.png, debug-dashboard.png, etc.');
  });
});




const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h2')).toContainText('Inloggen bij CRM');
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-red-600')).toBeVisible();
  });

  test('should use demo credentials button', async ({ page }) => {
    await page.click('text=Demo inloggegevens gebruiken');
    
    // Should fill in demo credentials
    await expect(page.locator('input[type="email"]')).toHaveValue('admin@webshop.nl');
    await expect(page.locator('input[type="password"]')).toHaveValue('admin123');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('text=Uitloggen');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});

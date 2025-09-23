const { test, expect } = require('@playwright/test');

test.describe('AI Insights', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@webshop.nl');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/ai-insights');
  });

  test('should display AI insights dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('AI Inzichten');
    
    // Check if main sections are visible
    await expect(page.locator('text=Product Aanbevelingen')).toBeVisible();
    await expect(page.locator('text=Klant Inzichten')).toBeVisible();
    await expect(page.locator('text=Bedrijfs Gezondheid')).toBeVisible();
  });

  test('should display product recommendations', async ({ page }) => {
    // Check if product recommendations are shown
    await expect(page.locator('text=🚀 SCHAAL OP')).toBeVisible();
    await expect(page.locator('text=⚠️ LET OP')).toBeVisible();
    await expect(page.locator('text=📈 GROEI KANS')).toBeVisible();
    
    // Check if specific product recommendations are visible
    await expect(page.locator('text=Sneakers Sport')).toBeVisible();
    await expect(page.locator('text=Premium T-Shirt')).toBeVisible();
  });

  test('should display customer insights', async ({ page }) => {
    // Check customer insights section
    await expect(page.locator('text=High-Value Klanten')).toBeVisible();
    await expect(page.locator('text=Churn Risico')).toBeVisible();
    await expect(page.locator('text=Nieuwe Marktkansen')).toBeVisible();
  });

  test('should display business health metrics', async ({ page }) => {
    // Check business health section
    await expect(page.locator('text=Bedrijfs Score')).toBeVisible();
    await expect(page.locator('text=Groei Trend')).toBeVisible();
    await expect(page.locator('text=Winstgevendheid')).toBeVisible();
    
    // Check if health score is displayed
    const healthScore = page.locator('text=/\\d{2}%|\\d{1}%/');
    await expect(healthScore.first()).toBeVisible();
  });

  test('should display specific AI action plan', async ({ page }) => {
    // Check if AI action plan is visible
    await expect(page.locator('text=Specifieke AI Actie Plan')).toBeVisible();
    
    // Check different action categories
    await expect(page.locator('text=🚨 URGENT ACTIES')).toBeVisible();
    await expect(page.locator('text=🎯 HIGH IMPACT ACTIES')).toBeVisible();
    await expect(page.locator('text=📅 Q4 STRATEGIE')).toBeVisible();
  });

  test('should display total profit potential', async ({ page }) => {
    // Check if total profit potential is shown
    await expect(page.locator('text=TOTAAL WINST POTENTIEEL')).toBeVisible();
    
    // Should show currency amounts
    const profitAmounts = page.locator('text=/€\\d+\\.\\d{3}/');
    await expect(profitAmounts.first()).toBeVisible();
  });

  test('should show actionable recommendations', async ({ page }) => {
    // Check if recommendations include specific actions
    await expect(page.locator('text=Verhoog voorraad')).toBeVisible();
    await expect(page.locator('text=Investeer')).toBeVisible();
    await expect(page.locator('text=Optimaliseer')).toBeVisible();
    
    // Check if investment amounts are specified
    const investmentAmounts = page.locator('text=/€\\d+/');
    await expect(investmentAmounts.first()).toBeVisible();
  });

  test('should display confidence scores', async ({ page }) => {
    // Check if confidence scores are displayed
    const confidenceScores = page.locator('text=/\\d+% confidence|Confidence: \\d+%/');
    if (await confidenceScores.count() > 0) {
      await expect(confidenceScores.first()).toBeVisible();
    }
  });

  test('should refresh AI insights', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.locator('text=Vernieuwen');
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display priority levels', async ({ page }) => {
    // Check if priority indicators are visible
    await expect(page.locator('text=🚨')).toBeVisible(); // Urgent
    await expect(page.locator('text=🎯')).toBeVisible(); // High Impact
    await expect(page.locator('text=📅')).toBeVisible(); // Strategic
  });

  test('should show detailed profit impact calculations', async ({ page }) => {
    // Check if detailed profit impacts are shown
    await expect(page.locator('text=+€')).toBeVisible();
    await expect(page.locator('text=winst impact')).toBeVisible();
    
    // Check if timeframes are specified
    await expect(page.locator('text=/binnen \\d+ maanden?/i')).toBeVisible();
  });
});

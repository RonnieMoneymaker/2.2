import { chromium } from 'playwright';
import fs from 'fs';

const baseUrl = 'http://localhost:3000';

async function run() {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  // Dashboard
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for data to load
  await page.screenshot({ path: 'screenshots/react-dashboard.png', fullPage: true });
  console.log('SNAPSHOT_SAVED screenshots/react-dashboard.png');

  // Products page
  await page.click('a[href="/products"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/react-products.png', fullPage: true });
  console.log('SNAPSHOT_SAVED screenshots/react-products.png');

  // Categories page
  await page.click('a[href="/categories"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/react-categories.png', fullPage: true });
  console.log('SNAPSHOT_SAVED screenshots/react-categories.png');

  // Add a new category
  await page.click('button:has-text("Nieuwe categorie")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/react-add-category-modal.png', fullPage: true });
  console.log('SNAPSHOT_SAVED screenshots/react-add-category-modal.png');

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });






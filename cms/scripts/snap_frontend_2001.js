import { chromium } from 'playwright';
import fs from 'fs';

const baseUrl = 'http://localhost:2001';

async function run() {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  // Dashboard
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Wait for data to load
  await page.screenshot({ path: 'screenshots/react-frontend-2001.png', fullPage: true });
  console.log('SNAPSHOT_SAVED screenshots/react-frontend-2001.png');

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });






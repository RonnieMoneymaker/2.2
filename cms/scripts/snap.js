import { chromium } from 'playwright';

const url = process.env.SNAP_URL || 'http://localhost:5050/';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // wait for dashboard container to appear
  await page.waitForSelector('#dashboard', { timeout: 15000 });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `screenshots/dashboard-${ts}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log('SNAPSHOT_SAVED', path);
  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });




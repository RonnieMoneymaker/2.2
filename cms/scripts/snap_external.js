import { chromium } from 'playwright';
import fs from 'fs';

const url = process.env.SNAP_URL || 'https://example.com/';

async function run() {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `screenshots/external-${ts}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log('SNAPSHOT_SAVED', path);
  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });




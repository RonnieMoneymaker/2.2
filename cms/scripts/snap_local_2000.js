import { chromium } from 'playwright';
import fs from 'fs';

const url = 'http://localhost:2000/';

async function run() {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#dashboard', { timeout: 15000 });
  await page.screenshot({ path: 'screenshots/cms-2000-full.png', fullPage: true });
  const kpis = await page.$('#kpis');
  if (kpis) await kpis.screenshot({ path: 'screenshots/cms-2000-kpis.png' });
  const out = await page.$('#out');
  if (out) await out.screenshot({ path: 'screenshots/cms-2000-out.png' });
  await browser.close();
  console.log('SNAPSHOT_SAVED screenshots/cms-2000-full.png');
}

run().catch((e) => { console.error(e); process.exit(1); });




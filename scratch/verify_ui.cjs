const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to live deployment...');
  await page.goto('https://f2f-command-center.netlify.app/analytics');

  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for recharts animations

  const artifactsDir = 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14';
  const screenshotPath = path.join(artifactsDir, 'live_analytics_dashboard.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
  console.log('Verification complete.');
}

verify().catch(console.error);

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to live deployment...');
  await page.goto('https://f2f-command-center.netlify.app/auth');

  console.log('Waiting for auth page to load...');
  await page.waitForLoadState('networkidle');

  // Switch to Register tab
  await page.click('text=Register');
  await page.waitForTimeout(1000);

  // Take screenshot of the Register form to verify Date of Birth field
  const artifactsDir = 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14';
  const screenshotPath = path.join(artifactsDir, 'live_verification_age_gate.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot of Age Gate to:', screenshotPath);

  await browser.close();
  console.log('Verification complete.');
}

verify().catch(console.error);

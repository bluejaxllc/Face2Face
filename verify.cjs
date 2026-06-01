const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to auth...");
    await page.goto('https://face2face.icu/auth', { waitUntil: 'domcontentloaded' });
    
    console.log("Logging in...");
    await page.waitForTimeout(2000); // wait for animations
    await page.fill('input[placeholder="Enter your username"]', 'testuser');
    await page.fill('input[placeholder="Enter your password"]', 'password');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    console.log("Navigating to profile...");
    await page.goto('https://face2face.icu/profile', { waitUntil: 'domcontentloaded' });
    
    await page.waitForTimeout(3000);
    
    const outPath = path.join(__dirname, 'gamification_ui.png');
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Screenshot saved to: ' + outPath);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to auth...");
    await page.goto('https://face2face.icu/auth', { waitUntil: 'domcontentloaded' });
    
    console.log("Logging in...");
    await page.waitForTimeout(2000); // Wait for auth animations
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    // Using generic click in case placeholder fails
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(3000);
    
    console.log("Navigating to map...");
    await page.goto('https://face2face.icu/map', { waitUntil: 'domcontentloaded' });
    
    // Wait for map to load
    await page.waitForTimeout(5000);
    
    console.log("Switching to Radar mode...");
    // We can dispatch the custom event directly to the window to avoid UI clicking fragility!
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('f2f:mapStyleChange', { detail: 'radar' }));
    });
    
    await page.waitForTimeout(2000); // let radar layer render
    
    const outPathRadar = path.join(__dirname, 'map_radar.png');
    await page.screenshot({ path: outPathRadar, fullPage: true });
    console.log('Radar Screenshot saved to: ' + outPathRadar);
    
    console.log("Switching to Heatmap mode...");
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('f2f:mapStyleChange', { detail: 'heatmap' }));
    });
    
    await page.waitForTimeout(2000);
    const outPathHeatmap = path.join(__dirname, 'map_heatmap.png');
    await page.screenshot({ path: outPathHeatmap, fullPage: true });
    console.log('Heatmap Screenshot saved to: ' + outPathHeatmap);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
})();

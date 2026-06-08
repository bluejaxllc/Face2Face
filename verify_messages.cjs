const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile view
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to messages...");
    await page.goto('https://bump.bluejax.ai/messages', { waitUntil: 'networkidle' });
    
    // Check if we need to login
    const isLogin = await page.locator('input[placeholder*="username"], input[type="text"]').count();
    if (isLogin > 0) {
      console.log("Login form detected. Logging in...");
      await page.fill('input[placeholder*="username"], input[type="text"]', 'edgar');
      await page.fill('input[placeholder*="password"], input[type="password"]', 'Legolitas1!');
      
      // Let's click sign in / log in button
      const loginBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');
      await loginBtn.first().click();
      
      console.log("Submitted login. Waiting for navigation...");
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }
    
    console.log("Current URL:", page.url());
    
    // Check if we are on messages page
    if (!page.url().includes('/messages')) {
      console.log("Not on messages page, navigating there directly...");
      await page.goto('https://bump.bluejax.ai/messages', { waitUntil: 'networkidle' });
    }
    
    // Wait for the UI elements to render
    await page.waitForTimeout(3000);
    
    // Create target directory if it doesn't exist
    const screenshotDir = 'C:/Users/edgar/.gemini/antigravity/brain/232c5f6f-cc5c-4aa3-947e-0e094fa3eb97';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const screenshotPath = path.join(screenshotDir, 'mutual_bumps_timestamps.png');
    
    // Check if Bumps mode is active (Mutual Bumps)
    console.log("Extracting Bumps mode contents...");
    const mutualBumpsHeader = await page.locator('h2:has-text("Mutual Bumps")').count();
    console.log("Mutual Bumps header count:", mutualBumpsHeader);
    
    // Let's scrape the timestamps and names of the visible bumps
    const bumpCards = page.locator('div.relative.w-36.h-\\[210px\\]');
    const bumpCount = await bumpCards.count();
    console.log("Found bump cards count:", bumpCount);
    for (let i = 0; i < bumpCount; i++) {
      const card = bumpCards.nth(i);
      const name = await card.locator('h3').textContent();
      const desc = await card.locator('p').textContent();
      const time = await card.locator('span.text-\\[10px\\]').textContent();
      console.log(`Card ${i + 1}: Name="${name.trim()}", Desc="${desc.trim()}", Time="${time.trim()}"`);
    }
    
    // Take screenshot of the main view (which will be the Bumps view)
    await page.screenshot({ path: screenshotPath });
    console.log('Main screenshot saved to:', screenshotPath);
    
    // Now let's click on the "Contacts" button to check the list view items if there is one
    const contactsBtn = page.locator('button:has-text("Contacts")');
    if (await contactsBtn.count() > 0) {
      console.log("Clicking Contacts tab...");
      await contactsBtn.click();
      await page.waitForTimeout(1000);
      
      // Let's see if there are contact items
      const contactItems = page.locator('div.flex-1.min-w-0');
      const contactCount = await contactItems.count();
      console.log("Found contact list items count:", contactCount);
      for (let i = 0; i < contactCount; i++) {
        const item = contactItems.nth(i);
        const name = await item.locator('p').first().textContent();
        const lastMsg = await item.locator('p').last().textContent();
        const time = await item.locator('span').textContent();
        console.log(`Contact ${i + 1}: Name="${name.trim()}", LastMsg="${lastMsg.trim()}", Time="${time.trim()}"`);
      }
      
      // Take another screenshot for debug/verification of contacts list view
      const contactsScreenshotPath = path.join(screenshotDir, 'contacts_list_timestamps.png');
      await page.screenshot({ path: contactsScreenshotPath });
      console.log('Contacts screenshot saved to:', contactsScreenshotPath);
    } else {
      console.log("Contacts tab button not found.");
    }
    
  } catch (error) {
    console.error("Error running automation:", error);
  } finally {
    await browser.close();
  }
})();

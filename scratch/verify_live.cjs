const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    await page.goto('https://f2f-command-center.netlify.app', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait a bit for any animations
    await page.waitForTimeout(2000);
    
    // Screenshot 1: Full page top (header + nav)
    const screenshotPath = 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\screenshot_v6_nav.png';
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 1920, height: 300 } });
    console.log('Screenshot 1 saved: header + nav bar');
    
    // Check if category buttons exist
    const catBtns = await page.$$('.cat-btn');
    console.log('Category buttons found:', catBtns.length);
    
    // Check visible tab buttons
    const visibleTabs = await page.$$('.cat-visible .tab-btn');
    console.log('Visible tab buttons (Core category):', visibleTabs.length);
    
    // Click "Research" category to test switching
    const researchBtn = await page.$('[data-cat="research"]');
    if (researchBtn) {
        await researchBtn.click();
        await page.waitForTimeout(500);
        const researchTabs = await page.$$('.cat-visible .tab-btn');
        console.log('After clicking Research - visible tabs:', researchTabs.length);
        
        // Screenshot 2: Research category selected
        const screenshotPath2 = 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\screenshot_v6_research.png';
        await page.screenshot({ path: screenshotPath2, clip: { x: 0, y: 0, width: 1920, height: 300 } });
        console.log('Screenshot 2 saved: Research category');
    }
    
    // Click "Investor" to test another category
    const investorBtn = await page.$('[data-cat="investor"]');
    if (investorBtn) {
        await investorBtn.click();
        await page.waitForTimeout(500);
        const investorTabs = await page.$$('.cat-visible .tab-btn');
        console.log('After clicking Investor - visible tabs:', investorTabs.length);
        
        const screenshotPath3 = 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\screenshot_v6_investor.png';
        await page.screenshot({ path: screenshotPath3, clip: { x: 0, y: 0, width: 1920, height: 300 } });
        console.log('Screenshot 3 saved: Investor category');
    }
    
    await browser.close();
    console.log('All screenshots taken successfully!');
})();

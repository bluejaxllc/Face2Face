const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    console.log('Loading live site...');
    await page.goto('https://f2f-command-center.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Test all categories
    const categories = ['core', 'research', 'strategy', 'tools', 'growth', 'ops', 'investor', 'technical'];
    let totalOk = 0, totalFail = 0;
    
    for (const cat of categories) {
        const tabs = await page.evaluate((c) => {
            const results = [];
            const catBtn = document.querySelector(`[data-cat="${c}"]`);
            if (catBtn) catBtn.click();
            
            document.querySelectorAll(`li[data-cat="${c}"] .tab-btn`).forEach(btn => {
                const tabId = btn.dataset.tab;
                btn.click();
                const panel = document.getElementById('tab-' + tabId);
                if (!panel) {
                    results.push({ id: tabId, status: 'NO_PANEL' });
                    return;
                }
                const isActive = panel.classList.contains('active');
                const isVisible = panel.offsetHeight > 0;
                const textLen = panel.textContent.trim().length;
                results.push({
                    id: tabId,
                    status: !isActive ? 'NOT_ACTIVE' : !isVisible ? 'INVISIBLE' : textLen < 30 ? 'EMPTY' : 'OK',
                    chars: textLen
                });
            });
            return results;
        }, cat);
        
        const ok = tabs.filter(t => t.status === 'OK').length;
        const fail = tabs.filter(t => t.status !== 'OK').length;
        totalOk += ok;
        totalFail += fail;
        
        const failTabs = tabs.filter(t => t.status !== 'OK');
        const failStr = fail > 0 ? ' ❌ ' + failTabs.map(t => `${t.id}(${t.status})`).join(', ') : '';
        console.log(`  ${cat.toUpperCase()}: ${ok}/${tabs.length} OK${failStr}`);
    }
    
    console.log(`\n=== TOTAL: ${totalOk} OK, ${totalFail} FAILED ===`);
    
    // Take screenshots
    await page.evaluate(() => {
        document.querySelector('[data-cat="core"]').click();
        document.querySelector('[data-tab="market"]').click();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\live_core.png' });
    
    await page.evaluate(() => {
        document.querySelector('[data-cat="tools"]').click();
        document.querySelector('[data-tab="sprint"]').click();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\live_tools.png' });
    
    await page.evaluate(() => {
        document.querySelector('[data-cat="investor"]').click();
        document.querySelector('[data-tab="pitchdeck"]').click();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\live_investor.png' });
    
    await browser.close();
    console.log('Live verification complete!');
})();

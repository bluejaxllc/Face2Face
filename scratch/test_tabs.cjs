const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    // Test the LOCAL file first
    await page.goto('file:///C:/Users/edgar/OneDrive/Desktop/Face 2 Face/dashboard-deploy/index.html', { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Click each category and then test tabs
    const categories = ['core', 'research', 'strategy', 'tools', 'growth', 'ops', 'investor', 'technical'];
    
    for (const cat of categories) {
        await page.evaluate((c) => {
            const btn = document.querySelector(`[data-cat="${c}"]`);
            if (btn) btn.click();
        }, cat);
        await page.waitForTimeout(200);
        
        // Get visible tabs and click each
        const tabs = await page.evaluate((c) => {
            const results = [];
            document.querySelectorAll(`li[data-cat="${c}"] .tab-btn`).forEach(btn => {
                const tabId = btn.dataset.tab;
                btn.click();
                const panel = document.getElementById('tab-' + tabId);
                if (!panel) {
                    results.push({ id: tabId, status: 'NO_PANEL' });
                    return;
                }
                const isActive = panel.classList.contains('active');
                const isVisible = panel.offsetParent !== null || panel.offsetHeight > 0;
                const textLen = panel.textContent.trim().length;
                const rect = panel.getBoundingClientRect();
                
                results.push({
                    id: tabId,
                    status: !isActive ? 'NOT_ACTIVE' : !isVisible ? 'INVISIBLE' : textLen < 30 ? 'EMPTY' : 'OK',
                    chars: textLen,
                    height: rect.height,
                    visible: isVisible
                });
            });
            return results;
        }, cat);
        
        console.log(`\n=== ${cat.toUpperCase()} ===`);
        tabs.forEach(t => {
            const icon = t.status === 'OK' ? '✅' : '❌';
            console.log(`  ${icon} ${t.id.padEnd(18)} ${t.status.padEnd(12)} ${t.chars} chars  h:${t.height}px`);
        });
    }
    
    // Take screenshots of 3 different tabs to verify they show unique content
    const testTabs = [
        { cat: 'strategy', tab: 'roadmap', file: 'test_roadmap.png' },
        { cat: 'tools', tab: 'sprint', file: 'test_sprint.png' },
        { cat: 'ops', tab: 'citylaunch', file: 'test_citylaunch.png' },
    ];
    
    for (const test of testTabs) {
        await page.evaluate(t => {
            document.querySelector(`[data-cat="${t.cat}"]`).click();
            document.querySelector(`[data-tab="${t.tab}"]`).click();
        }, test);
        await page.waitForTimeout(300);
        await page.screenshot({
            path: `C:\\Users\\edgar\\.gemini\\antigravity\\brain\\c1292af2-66bd-4144-86e2-2a0791810d14\\${test.file}`
        });
    }
    
    await browser.close();
    console.log('\nDone! Screenshots saved.');
})();

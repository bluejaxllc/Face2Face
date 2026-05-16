const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://face2face-layout-bm564t8rx-eds-projects-bc846511.vercel.app/explore', {waitUntil: 'networkidle0'});
        
        // Wait for nav to render
        await page.waitForSelector('nav');
        
        // Extract text from nav
        const navText = await page.$eval('nav', el => el.innerText);
        console.log('NAV_TEXT:', navText);
        
        // Extract all classes from nav items
        const items = await page.$$eval('nav > div > div', els => els.map(el => ({
            text: el.innerText,
            html: el.innerHTML
        })));
        console.log('ITEMS:', JSON.stringify(items, null, 2));

        await browser.close();
        console.log('Done');
    } catch(e) {
        console.error(e);
    }
})();

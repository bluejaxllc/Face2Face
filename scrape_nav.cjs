const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://face2face-layout-bm564t8rx-eds-projects-bc846511.vercel.app/map', {waitUntil: 'networkidle0'});
        const navHtml = await page.$eval('nav', el => el.outerHTML).catch(e => 'No nav element found');
        console.log('NAV_HTML:', navHtml);
        await page.screenshot({path: 'C:\\Users\\edgar\\.gemini\\antigravity\\brain\\80549a54-2314-49ec-b64f-5064cbde70e7\\vercel_layout_check.png', fullPage: true});
        await browser.close();
        console.log('Done');
    } catch(e) {
        console.error(e);
    }
})();

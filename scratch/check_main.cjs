const c = require('fs').readFileSync('c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html', 'utf8');
const mainEnd = c.indexOf('</main>');
const panelRe = /id="tab-([^"]+)"/g;
let m;
let outside = [];
while ((m = panelRe.exec(c)) !== null) {
    if (m.index > mainEnd) outside.push(m[1]);
}
console.log('</main> at position:', mainEnd);
console.log('Total file length:', c.length);
console.log('Panels AFTER </main>:', outside.length);
outside.forEach(o => console.log('  ' + o));

// Also run the Playwright test
console.log('\nNow testing tab switching...');

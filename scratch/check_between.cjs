const fs = require('fs');
const c = fs.readFileSync('c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html', 'utf8');
const mainEnd = c.indexOf('</main>');
const footer = c.indexOf('<footer');

// Show what's between </main> and <footer>
const between = c.substring(mainEnd + 7, footer > 0 ? footer : c.length);
console.log('Content between </main> and <footer> (' + between.length + ' chars):');
console.log(between.substring(0, 500));
console.log('\n...\n');
console.log(between.substring(between.length - 500));

// Find any tab-panel refs
const panelRe = /id="tab-([^"]+)"/g;
let m;
while ((m = panelRe.exec(between)) !== null) {
    console.log('  Panel: ' + m[1] + ' at pos ' + m.index);
}

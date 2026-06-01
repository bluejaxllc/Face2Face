const fs = require('fs');
const file = 'c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html';
const c = fs.readFileSync(file, 'utf8');

// Count panels
const panelRe = /<div class="tab-panel"[^>]*id="tab-([^"]+)"[^>]*>/g;
let m;
const ids = [];
while ((m = panelRe.exec(c)) !== null) {
    ids.push(m[1]);
}
console.log('Total panel tags: ' + ids.length);

// Count duplicates
const counts = {};
ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
const dupes = Object.entries(counts).filter(([k,v]) => v > 1);
console.log('Unique IDs: ' + Object.keys(counts).length);
console.log('Duplicated IDs: ' + dupes.length);
dupes.forEach(([k,v]) => console.log('  ' + k + ': ' + v + ' copies'));

// Check </main> position 
const mainEnd = c.indexOf('</main>');
console.log('\n</main> at: ' + mainEnd + ' / ' + c.length);

// Count panels after </main>
let after = 0;
panelRe.lastIndex = 0;
while ((m = panelRe.exec(c)) !== null) {
    if (m.index > mainEnd) after++;
}
console.log('Panels after </main>: ' + after);

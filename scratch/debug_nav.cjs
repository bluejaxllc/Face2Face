var c = require('fs').readFileSync('c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html','utf8');
var lines = c.split('\n');

console.log('=== CSS RULES FOR NAV ===');
for (var i=0; i<lines.length; i++) {
    var l = lines[i];
    if (l.match(/\.tab-nav\s*\{/) || l.match(/\.tab-list\s*\{/) || l.match(/\.cat-bar/) || l.match(/\.cat-btn/) || l.match(/\.tab-btn\s*\{/)) {
        console.log('L' + (i+1) + ': ' + l.trim().substring(0,140));
    }
}

console.log('\n=== HTML NAV STRUCTURE ===');
var catBarCount = (c.match(/class="cat-bar"/g) || []).length;
var catBtnCount = (c.match(/class="cat-btn/g) || []).length;
var dataCatLi = (c.match(/li[^>]*data-cat="/g) || []).length;
var catVisibleLi = (c.match(/cat-visible/g) || []).length;

console.log('cat-bar divs:', catBarCount);
console.log('cat-btn buttons:', catBtnCount);
console.log('li with data-cat:', dataCatLi);
console.log('li with cat-visible class:', catVisibleLi);

// Check if old CSS comes AFTER new CSS (which would override)
var oldNavPos = c.indexOf('.tab-nav {\n');
var newNavPos = c.indexOf('/* ===== CATEGORY NAV SYSTEM =====');
console.log('\nOld .tab-nav CSS at position:', oldNavPos);
console.log('New category CSS at position:', newNavPos);
console.log('New CSS comes ' + (newNavPos > oldNavPos ? 'AFTER (wins!)' : 'BEFORE (loses!)') + ' old CSS');

// Check for the tab switching JS
var catNavJS = c.indexOf("CATEGORY NAV");
console.log('\nCategory Nav JS at position:', catNavJS > 0 ? catNavJS : 'NOT FOUND!');

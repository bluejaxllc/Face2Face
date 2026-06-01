const fs = require('fs');
const c = fs.readFileSync('c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html', 'utf8');

// Extract all tab button data-tab values
const btnMatches = [...c.matchAll(/data-tab="([^"]+)"/g)];
const buttons = btnMatches.map(m => m[1]);

// Extract all tab panel IDs
const panelMatches = [...c.matchAll(/id="tab-([^"]+)"/g)];
const panels = panelMatches.map(m => m[1]);

const panelSet = new Set(panels);
const buttonSet = new Set(buttons);

console.log('=== TAB BUTTONS (' + buttons.length + ') ===');
console.log(buttons.join(', '));
console.log('\n=== TAB PANELS (' + panels.length + ') ===');
console.log(panels.join(', '));

console.log('\n=== BUTTONS WITHOUT PANELS (BROKEN!) ===');
const broken = buttons.filter(b => !panelSet.has(b));
console.log(broken.length + ' broken buttons:');
broken.forEach(b => console.log('  ❌ ' + b));

console.log('\n=== PANELS WITHOUT BUTTONS (ORPHANED) ===');
const orphaned = panels.filter(p => !buttonSet.has(p));
console.log(orphaned.length + ' orphaned panels:');
orphaned.forEach(p => console.log('  🔸 ' + p));

// Also check the tab-switching JS
const hasSwitchJS = c.includes("data-tab");
const hasTabPanelSwitch = c.includes("tab-panel");
console.log('\n=== JS CHECK ===');
console.log('Has data-tab in JS: ' + hasSwitchJS);
console.log('Has tab-panel switching: ' + hasTabPanelSwitch);

// Check if the basic tab switching logic exists
const tabSwitchBlock = c.includes("forEach(function(panel)");
console.log('Has panel forEach: ' + tabSwitchBlock);

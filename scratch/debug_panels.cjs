const fs = require('fs');
const c = fs.readFileSync('c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html', 'utf8');

// Find each tab-panel and check div balance
const panelRegex = /id="tab-([^"]+)"/g;
let match;
const positions = [];
while ((match = panelRegex.exec(c)) !== null) {
    positions.push({ id: match[1], pos: match.index });
}

// Add end-of-file as boundary
positions.push({ id: 'EOF', pos: c.length });

console.log('=== DIV BALANCE PER PANEL ===');
let cumulative = 0;
for (let i = 0; i < positions.length - 1; i++) {
    const section = c.substring(positions[i].pos, positions[i+1].pos);
    const opens = (section.match(/<div/g) || []).length;
    const closes = (section.match(/<\/div>/g) || []).length;
    const balance = opens - closes;
    cumulative += balance;
    
    if (balance !== 0) {
        console.log(`  ⚠️  ${positions[i].id.padEnd(18)} opens:${opens} closes:${closes} balance:${balance > 0 ? '+' : ''}${balance}  (cumulative: ${cumulative})`);
    }
}

// Now find exactly which divs are unclosed in the KPI panel
const kpiStart = c.indexOf('id="tab-kpis"');
const nextPanelStart = c.indexOf('id="tab-', kpiStart + 20);
const kpiHTML = c.substring(kpiStart, nextPanelStart);
const kpiLines = kpiHTML.split('\n');

let depth = 0;
let unclosedLines = [];
for (let i = 0; i < kpiLines.length; i++) {
    const line = kpiLines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    const prevDepth = depth;
    depth += opens - closes;
    if (opens > 0 && closes === 0) {
        unclosedLines.push({ lineInKPI: i+1, depth: depth, text: line.trim().substring(0, 100) });
    }
}

console.log('\n=== KPI PANEL UNCLOSED DIV LINES ===');
console.log('Final depth at end of KPI section:', depth);
console.log('Last 10 lines of KPI panel:');
for (let i = Math.max(0, kpiLines.length - 15); i < kpiLines.length; i++) {
    console.log(`  KPI-L${i+1}: ${kpiLines[i].trim().substring(0, 120)}`);
}

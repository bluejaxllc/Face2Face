const cp = require('child_process');
const base = 'c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face';
const c = cp.execSync('git show HEAD~4:dashboard-deploy/index.html', {cwd: base, encoding: 'utf8', maxBuffer: 2*1024*1024});

const s = c.indexOf('id="tab-kpis"');
const e = c.indexOf('id="tab-', s + 20);
const kpi = c.substring(s, e);

const opens = (kpi.match(/<div/g)||[]).length;
const closes = (kpi.match(/<\/div>/g)||[]).length;
console.log('KPI opens:' + opens + ' closes:' + closes + ' diff:' + (opens - closes));

// Find unclosed divs
const lines = kpi.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
    const lo = (lines[i].match(/<div/g)||[]).length;
    const lc = (lines[i].match(/<\/div>/g)||[]).length;
    const prev = depth;
    depth += lo - lc;
    if (lo > 0 && lc === 0) {
        // This line opens a div but doesn't close it
        if (i > lines.length - 30) { // only show last 30 lines
            console.log('  L' + (i+1) + ' depth:' + prev + '->' + depth + ': ' + lines[i].trim().substring(0, 100));
        }
    }
}
console.log('\nFinal depth: ' + depth);
console.log('\nLast 15 lines of KPI section:');
for (let i = Math.max(0, lines.length - 15); i < lines.length; i++) {
    console.log('  L' + (i+1) + ': ' + lines[i].trim().substring(0, 120));
}

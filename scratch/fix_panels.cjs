const fs = require('fs');
const cp = require('child_process');
const base = 'c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face';
const file = base + '\\strategic_dashboard.html';
const outFile = base + '\\dashboard-deploy\\index.html';

// ═══════════════════════════════════════════
// STEP 0: Restore clean V3.0 base
// ═══════════════════════════════════════════
const gitClean = cp.execSync('git show HEAD~4:dashboard-deploy/index.html', {cwd: base, encoding: 'utf8', maxBuffer: 2*1024*1024});
fs.writeFileSync(file, gitClean);
let c = fs.readFileSync(file, 'utf8');

// Fix: V3.0 has 6 </main> tags! Keep only the last one
const mainCount = (c.match(/<\/main>/g) || []).length;
if (mainCount > 1) {
    console.log('Fixing V3.0 base: ' + mainCount + ' </main> tags -> 1');
    // Remove all </main> except the last
    for (let mc = 0; mc < mainCount - 1; mc++) {
        c = c.replace('</main>', '');
    }
}

// Load component files
const pv2 = fs.readFileSync(base + '\\scratch\\new_panels_v2.html', 'utf8');
const pv3 = fs.readFileSync(base + '\\scratch\\new_panels_v3.html', 'utf8');
const pv4 = fs.readFileSync(base + '\\scratch\\new_panels_v4.html', 'utf8');
const pv5 = fs.readFileSync(base + '\\scratch\\new_panels_v5.html', 'utf8');
const js  = fs.readFileSync(base + '\\scratch\\dashboard_js.txt', 'utf8');
const hdr = fs.readFileSync(base + '\\scratch\\header_controls.txt', 'utf8');

// ═══════════════════════════════════════════
// STEP 1: CSS
// ═══════════════════════════════════════════
const newCss = `
        /* ===== CATEGORY NAV ===== */
        .tab-nav{position:sticky;top:0;z-index:100;background:rgba(5,10,20,0.95);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:0}
        .cat-bar{display:flex;gap:0;justify-content:center;border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none;background:rgba(5,10,20,0.6);padding:0 1rem}
        .cat-bar::-webkit-scrollbar{display:none}
        .cat-btn{padding:0.6rem 1rem;font-family:inherit;font-size:0.72rem;font-weight:700;color:var(--text-muted);background:none;border:none;cursor:pointer;white-space:nowrap;text-transform:uppercase;letter-spacing:0.08em;transition:all 0.2s;position:relative}
        .cat-btn:hover{color:var(--text-secondary)}
        .cat-btn.active{color:var(--accent)}
        .cat-btn.active::after{content:'';position:absolute;bottom:0;left:0.25rem;right:0.25rem;height:2px;background:var(--accent);border-radius:2px 2px 0 0}
        .tab-list{max-width:1600px;width:100%;margin:0 auto;display:flex;gap:0;list-style:none;overflow-x:auto;scrollbar-width:none;padding:0 1rem;justify-content:center}
        .tab-list::-webkit-scrollbar{display:none}
        .tab-list li{display:none}
        .tab-list li.cat-visible{display:block}
        .tab-btn{padding:0.65rem 0.9rem;font-family:inherit;font-size:0.78rem;font-weight:600;color:var(--text-muted);background:none;border:none;cursor:pointer;position:relative;transition:color 0.3s;white-space:nowrap;letter-spacing:0.01em}
        .tab-btn:hover{color:var(--text-secondary)}
        .tab-btn.active{color:var(--accent)}
        .tab-btn.active::after{content:'';position:absolute;bottom:0;left:0.25rem;right:0.25rem;height:2px;background:var(--accent);border-radius:2px 2px 0 0;box-shadow:0 0 12px var(--accent-glow)}
        @media(max-width:768px){.cat-btn{padding:0.5rem 0.6rem;font-size:0.65rem}.tab-btn{padding:0.5rem 0.6rem;font-size:0.72rem}}
        .sprint-col{min-height:200px}.sprint-item{padding:.75rem;margin:.5rem 0;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;cursor:grab;font-size:.85rem;color:var(--text-secondary);transition:all .2s}.sprint-item:hover{border-color:var(--accent);transform:translateY(-1px)}
        .global-search{position:relative}.global-search input{background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-primary);padding:.5rem 1rem .5rem 2.2rem;border-radius:8px;font-size:.85rem;width:220px;outline:none;transition:all .3s}.global-search input:focus{border-color:var(--accent);width:320px;box-shadow:0 0 20px rgba(59,130,246,.15)}
        .header-controls{display:flex;align-items:center;gap:.75rem;margin-top:.75rem;flex-wrap:wrap}.header-controls button{background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-secondary);padding:.4rem .75rem;border-radius:6px;cursor:pointer;font-size:.75rem;transition:all .2s}.header-controls button:hover{border-color:var(--accent);color:var(--text-primary)}
        .countdown-display{display:inline-flex;gap:.5rem;align-items:center;font-size:.8rem;color:var(--text-muted);background:var(--bg-elevated);padding:.4rem .75rem;border-radius:6px;border:1px solid var(--border)}.countdown-display .cd-num{color:var(--accent);font-weight:700;font-size:1rem}
        html.light{--bg-deep:#f0f2f5;--bg-primary:#fff;--bg-card:#f8f9fa;--bg-elevated:#edf0f4;--border:rgba(0,0,0,.1);--border-bright:rgba(0,0,0,.2);--text-primary:#1a1a2e;--text-secondary:#4a5568;--text-muted:#718096}html.light .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}html.light .tab-nav{background:rgba(255,255,255,0.95)}html.light .cat-bar{background:rgba(240,242,245,0.8)}html.light .footer{background:#1a1a2e}
`;
let i = c.indexOf('</style>');
c = c.slice(0, i) + newCss + '\n' + c.slice(i);

// STEP 2: CDN scripts
i = c.indexOf('</head>');
c = c.slice(0, i) + '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>\n' + c.slice(i);

// STEP 3: Header controls
i = c.indexOf('</header>');
c = c.slice(0, i) + hdr + '\n' + c.slice(i);

// STEP 4: Replace nav
const navHTML = fs.readFileSync(base + '\\scratch\\nav_categorized.html', 'utf8');
const ns = c.indexOf('<!-- ═══════════ TAB NAV ═══════════ -->');
const ne = c.indexOf('</nav>') + '</nav>'.length;
c = c.slice(0, ns) + navHTML + '\n' + c.slice(ne);

// STEP 5: Inject all panel HTML before </main>
i = c.indexOf('</main>');
c = c.slice(0, i) + '\n' + pv2 + '\n\n' + pv3 + '\n\n' + pv4 + '\n\n' + pv5 + '\n\n' + c.slice(i);

// ═══════════════════════════════════════════
// STEP 6: DOM-LEVEL PANEL EXTRACTION & FLATTEN
// This is the critical fix. We extract every tab-panel as a
// properly-closed DOM subtree, deduplicate, and re-insert them
// as flat siblings directly inside <main>.
// ═══════════════════════════════════════════
// STEP 5.5: Patch KPI panel's unclosed divs
// The V3.0 base has a KPI panel with 3 unclosed <div> tags.
// We need to close them before DOM extraction can work.
const kpiPanelStart = c.indexOf('id="tab-kpis"');
if (kpiPanelStart !== -1) {
    // Find where the next panel starts after KPI
    const nextPanelComment = c.indexOf('<!-- ═════', kpiPanelStart + 20);
    if (nextPanelComment !== -1) {
        // Insert 3 closing </div> tags before the next panel comment
        c = c.substring(0, nextPanelComment) + '</div></div></div>\n' + c.substring(nextPanelComment);
        console.log('Patched KPI panel: added 3 closing </div> tags');
    }
}

console.log('DOM-level panel fix...');

function extractPanel(html, startPos) {
    const remaining = html.substring(startPos);
    const tagRe = /<\/?div[^>]*>/g;
    let depth = 0, tm;
    while ((tm = tagRe.exec(remaining)) !== null) {
        if (tm[0].startsWith('</div')) {
            depth--;
            if (depth === 0) return startPos + tm.index + tm[0].length;
        } else if (tm[0].startsWith('<div')) {
            depth++;
        }
    }
    return -1;
}

// Find all panels
const panelRe = /<div class="tab-panel"[^>]*id="tab-([^"]+)"[^>]*>/g;
let pm;
const allPanels = [];
const seenIds = new Set();
while ((pm = panelRe.exec(c)) !== null) {
    const id = pm[1];
    const endPos = extractPanel(c, pm.index);
    if (endPos === -1) { console.log('  WARN: unclosed panel ' + id); continue; }
    
    if (seenIds.has(id)) {
        // Keep the LONGER version (more content = newer version)
        const existing = allPanels.find(p => p.id === id);
        const newHtml = c.substring(pm.index, endPos);
        if (newHtml.length > existing.html.length) {
            existing.html = newHtml;
            console.log('  Replaced duplicate ' + id + ' with longer version (' + newHtml.length + ' > ' + existing.html.length + ')');
        } else {
            console.log('  Skipped shorter duplicate: ' + id);
        }
        continue;
    }
    seenIds.add(id);
    allPanels.push({ id, html: c.substring(pm.index, endPos) });
}
console.log('  Unique panels: ' + allPanels.length);
console.log('  Panel IDs: ' + allPanels.map(p => p.id).join(', '));
// Rebuild: Remove ALL tab-panel blocks from the entire document,
// then re-insert only the unique ones inside <main>

// First check if there are any remaining panel tags we didn't extract
const missedRe = /<div class="tab-panel"[^>]*id="tab-([^"]+)"[^>]*>/g;
let missedCount = 0;
let mmm;
while ((mmm = missedRe.exec(c)) !== null) {
    if (!allPanels.find(p => p.id === mmm[1])) {
        console.log('  MISSED: ' + mmm[1] + ' at pos ' + mmm.index);
        missedCount++;
    }
}
if (missedCount > 0) console.log('  ' + missedCount + ' panels not extracted!');

console.log('  Stripping all panels from document...');

// Sort panels by position (descending) to remove from end first
const allPanelPositions = [];
const stripAllRe = /<div class="tab-panel"[^>]*id="tab-([^"]+)"[^>]*>/g;
let sam;
while ((sam = stripAllRe.exec(c)) !== null) {
    const ep = extractPanel(c, sam.index);
    if (ep !== -1) {
        // Include preceding comment
        let start = sam.index;
        const prec = c.substring(Math.max(0, start - 200), start);
        const cmt = prec.match(/<!--[^]*?-->\s*$/);
        if (cmt) start -= cmt[0].length;
        allPanelPositions.push({ start, end: ep });
    }
}

// Remove in reverse order
for (let rp = allPanelPositions.length - 1; rp >= 0; rp--) {
    c = c.substring(0, allPanelPositions[rp].start) + c.substring(allPanelPositions[rp].end);
}
console.log('  Removed ' + allPanelPositions.length + ' panel blocks');

// Clean up: remove any remaining orphaned content between <main> and </main>
// that isn't a tab-panel (leftover KPI content, stray divs, etc.)
// Strategy: Keep only <main> tag, panels, and </main>
const mainOpenIdx = c.indexOf('<main');
const mainOpenEnd = c.indexOf('>', mainOpenIdx) + 1;
const mainCloseIdx = c.lastIndexOf('</main>'); // use LAST </main>
const mainContent = c.substring(mainOpenEnd, mainCloseIdx);

// Extract only the text that's NOT inside a tab-panel
// Find all panel-free gaps and check if they contain significant HTML
const gapRe = /<div class="tab-panel"[^>]*>/g;
let gm;
const panelBounds = [];
const gapContent = c.substring(mainOpenEnd, mainCloseIdx);
while ((gm = gapRe.exec(gapContent)) !== null) {
    const absStart = mainOpenEnd + gm.index;
    const absEnd = extractPanel(c, absStart);
    if (absEnd !== -1) panelBounds.push({ start: absStart, end: absEnd });
}

// The "clean main" = main tag + only panel blocks + </main>
const mainTag = c.substring(mainOpenIdx, mainOpenEnd);
let cleanMain = mainTag + '\n\n';
for (const p of allPanels) {
    cleanMain += p.html + '\n\n';
}
cleanMain += '</main>';

// Replace everything from <main to the LAST </main> + 7
const lastMainClose = c.lastIndexOf('</main>') + '</main>'.length;
const beforeMain = c.substring(0, mainOpenIdx);
const afterLastMain = c.substring(lastMainClose);
c = beforeMain + cleanMain + afterLastMain;

// Debug: count </main> tags 
const mainTags = (c.match(/<\/main>/g) || []).length;
console.log('  </main> tags in output: ' + mainTags);
const firstMain = c.indexOf('</main>');
const lastMain = c.lastIndexOf('</main>');
console.log('  First </main> at: ' + firstMain + ', Last at: ' + lastMain);
// Check panels after last </main>
const pAfter = /<div class="tab-panel"[^>]*id="tab-([^"]+)"[^>]*>/g;
let paM;
while ((paM = pAfter.exec(c)) !== null) {
    if (paM.index > lastMain) console.log('  STILL OUTSIDE: ' + paM[1] + ' at ' + paM.index);
}

// ═══════════════════════════════════════════
// STEP 7: JS injection
// ═══════════════════════════════════════════
const allJS = `
    // ======= CATEGORY NAV =======
    document.querySelectorAll('.cat-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.cat-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var cat = btn.dataset.cat;
            document.querySelectorAll('.tab-list li').forEach(function(li) {
                li.classList.toggle('cat-visible', li.dataset.cat === cat);
            });
        });
    });
` + '\n' + js + `
    // ======= DUE DILIGENCE CHECKLIST =======
    function saveDDChecklist() {
        var checks = Array.from(document.querySelectorAll('.dd-check')).map(function(c){return c.checked;});
        localStorage.setItem('f2f-dd', JSON.stringify(checks));
    }
    (function(){var s=localStorage.getItem('f2f-dd');if(s){try{var st=JSON.parse(s);document.querySelectorAll('.dd-check').forEach(function(c,i){if(st[i])c.checked=true;});}catch(e){}}})();
`;

var lastIdx = c.lastIndexOf('</script>');
c = c.slice(0, lastIdx) + '\n' + allJS + '\n' + c.slice(lastIdx);

// STEP 8: Footer
c = c.replace('28 Tabs', '68 Tabs');
c = c.replace('15 Research Reports', '8 Categories · 35+ Reports');

// ═══════════════════════════════════════════
// VERIFY & SAVE
// ═══════════════════════════════════════════
const finalRe = /<div class="tab-panel"[^>]*id="tab-([^"]+)"[^>]*>/g;
let fv;
const finalPanels = [];
while ((fv = finalRe.exec(c)) !== null) {
    finalPanels.push({ id: fv[1], pos: fv.index });
}
const finalMainEnd = c.indexOf('</main>');
finalPanels.push({ id: '__END__', pos: finalMainEnd });

let issues = 0, outside = 0;
for (let fi = 0; fi < finalPanels.length - 1; fi++) {
    if (finalPanels[fi].pos > finalMainEnd) outside++;
}

console.log('\n=== FINAL VERIFICATION ===');
console.log('Panels: ' + (finalPanels.length - 1));
console.log('Outside <main>: ' + outside);
console.log('Buttons: ' + (c.match(/data-tab="/g)||[]).length);

fs.writeFileSync(outFile, c, 'utf8');
console.log('Saved! ' + c.length + ' bytes');

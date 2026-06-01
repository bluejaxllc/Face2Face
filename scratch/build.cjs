const fs = require('fs');
const cp = require('child_process');
const base = 'c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face';
const file = base + '\\strategic_dashboard.html';

// Restore clean V3.0 base
const gitClean = cp.execSync('git show HEAD~4:dashboard-deploy/index.html', {cwd: base, encoding: 'utf8', maxBuffer: 2*1024*1024});
fs.writeFileSync(file, gitClean);
let c = fs.readFileSync(file, 'utf8');

// Load all component files
const pv2 = fs.readFileSync(base + '\\scratch\\new_panels_v2.html', 'utf8');
const pv3 = fs.readFileSync(base + '\\scratch\\new_panels_v3.html', 'utf8');
const pv4 = fs.readFileSync(base + '\\scratch\\new_panels_v4.html', 'utf8');
const pv5 = fs.readFileSync(base + '\\scratch\\new_panels_v5.html', 'utf8');
const js  = fs.readFileSync(base + '\\scratch\\dashboard_js.txt', 'utf8');
const hdr = fs.readFileSync(base + '\\scratch\\header_controls.txt', 'utf8');

// ── STEP 1: CSS before </style> ──
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

// ── STEP 2: CDN scripts before </head> ──
i = c.indexOf('</head>');
c = c.slice(0, i) + '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>\n' + c.slice(i);

// ── STEP 3: Header controls before </header> ──
i = c.indexOf('</header>');
c = c.slice(0, i) + hdr + '\n' + c.slice(i);

// ── STEP 4: Replace entire nav with categorized version ──
const navHTML = fs.readFileSync(base + '\\scratch\\nav_categorized.html', 'utf8');
const ns = c.indexOf('<!-- ═══════════ TAB NAV ═══════════ -->');
const ne = c.indexOf('</nav>') + '</nav>'.length;
c = c.slice(0, ns) + navHTML + '\n' + c.slice(ne);

// ── STEP 5: Panels before </main> ──
i = c.indexOf('</main>');
c = c.slice(0, i) + '\n' + pv2 + '\n\n' + pv3 + '\n\n' + pv4 + '\n\n' + pv5 + '\n\n' + c.slice(i);

// ── STEP 5.5: FIX UNCLOSED DIVS PER PANEL ──
// The KPI panel (and possibly others) have unclosed <div> tags which cause
// subsequent panels to nest inside them. When the broken panel is hidden,
// all children (= subsequent panels) become invisible too.
var panelPositions = [];
var panelRe = /id="tab-([^"]+)"/g;
var pm;
while ((pm = panelRe.exec(c)) !== null) {
    panelPositions.push({ id: pm[1], pos: pm.index });
}
// Find </main> position to use as the final boundary
var mainEnd = c.indexOf('</main>');
panelPositions.push({ id: '__END__', pos: mainEnd > 0 ? mainEnd : c.length });

var fixes = 0;
// Process in reverse so insertions don't shift positions
for (var pi = panelPositions.length - 2; pi >= 0; pi--) {
    var section = c.substring(panelPositions[pi].pos, panelPositions[pi + 1].pos);
    var opens = (section.match(/<div/g) || []).length;
    var closes = (section.match(/<\/div>/g) || []).length;
    var deficit = opens - closes;
    if (deficit > 0) {
        // Need to add closing </div> tags before the next panel
        var insertPos = panelPositions[pi + 1].pos;
        // Walk back to find a good insertion point (before the comment/div of next panel)
        var insertStr = '\n' + '</div>\n'.repeat(deficit);
        c = c.slice(0, insertPos) + insertStr + c.slice(insertPos);
        console.log('  Fixed ' + panelPositions[pi].id + ': added ' + deficit + ' closing </div> tags');
        fixes++;
    }
}
if (fixes > 0) console.log('  Total panels fixed: ' + fixes);

// ── STEP 5.6: MOVE PANELS OUTSIDE </main> BACK INSIDE ──
var mainEndPos = c.indexOf('</main>');
var strayPanels = '';
var strayRe = /<!--[^>]*-->\s*<div class="tab-panel"[^]*?<\/div>\s*(?=\n|<!--|<footer|<script|$)/g;
// Find panels after </main>
var afterMain = c.substring(mainEndPos + 7); // after '</main>'
var beforeMain = c.substring(0, mainEndPos);
var foundStrays = afterMain.match(/<div class="tab-panel"[\s\S]*?<\/div>\s*\n\s*(?=\n\n|<div class="tab-panel"|<footer|<script|$)/g);
// Simpler approach: extract everything between </main> and <footer> that contains tab-panel
var footerPos = c.indexOf('<footer');
if (footerPos < 0) footerPos = c.indexOf('</body>');
var betweenMainAndFooter = c.substring(mainEndPos + 7, footerPos).trim();
if (betweenMainAndFooter.includes('tab-panel')) {
    console.log('  Moving stray panels from after </main> back inside main...');
    // Remove from after main, put before </main>
    c = beforeMain + '\n\n' + betweenMainAndFooter + '\n\n</main>' + c.substring(footerPos);
    console.log('  Done. Stray content size: ' + betweenMainAndFooter.length + ' chars');
}

// ── STEP 5.7: FIX EXCESS CLOSING DIVS IN PANELS ──
// Re-scan panels now and fix any with negative balance (too many closes)
panelPositions = [];
panelRe = /id="tab-([^"]+)"/g;
while ((pm = panelRe.exec(c)) !== null) {
    panelPositions.push({ id: pm[1], pos: pm.index });
}
mainEndPos = c.indexOf('</main>');
panelPositions.push({ id: '__END__', pos: mainEndPos > 0 ? mainEndPos : c.length });

for (var pi2 = panelPositions.length - 2; pi2 >= 0; pi2--) {
    var sec = c.substring(panelPositions[pi2].pos, panelPositions[pi2 + 1].pos);
    var op = (sec.match(/<div/g) || []).length;
    var cl = (sec.match(/<\/div>/g) || []).length;
    var excess = cl - op;
    if (excess > 0) {
        // Remove excess closing divs from the end of this section
        var secEnd = panelPositions[pi2 + 1].pos;
        var region = c.substring(panelPositions[pi2].pos, secEnd);
        for (var xx = 0; xx < excess; xx++) {
            var lastClose = region.lastIndexOf('</div>');
            if (lastClose >= 0) {
                region = region.substring(0, lastClose) + region.substring(lastClose + 6);
            }
        }
        c = c.substring(0, panelPositions[pi2].pos) + region + c.substring(secEnd);
        console.log('  Trimmed ' + excess + ' excess </div> from ' + panelPositions[pi2].id);
    }
}

// ── STEP 6: JS before the LAST </script> ──
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

// Find the LAST </script> — this is the inline one with tab switching logic
var lastIdx = c.lastIndexOf('</script>');
c = c.slice(0, lastIdx) + '\n' + allJS + '\n' + c.slice(lastIdx);

// ── STEP 7: Footer ──
c = c.replace('28 Tabs', '68 Tabs');
c = c.replace('15 Research Reports', '8 Categories · 35+ Reports');

// ── SAVE ──
fs.writeFileSync(file, c, 'utf8');
fs.copyFileSync(file, base + '\\dashboard-deploy\\index.html');

var btns = (c.match(/data-tab="/g)||[]).length;
var pnls = (c.match(/id="tab-/g)||[]).length;
console.log('Buttons: ' + btns + ' | Panels: ' + pnls + ' | Size: ' + c.length + ' | Lines: ' + c.split('\n').length);

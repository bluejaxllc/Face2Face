import re, sys

file = r"c:\Users\edgar\OneDrive\Desktop\Face 2 Face\strategic_dashboard.html"
panels_file = r"c:\Users\edgar\OneDrive\Desktop\Face 2 Face\scratch\new_panels_v2.html"

with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

with open(panels_file, 'r', encoding='utf-8') as f:
    panels = f.read()

# 1. Add CDN scripts before FIRST </head>
cdn = '''    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
'''
idx = content.index('</head>')
content = content[:idx] + cdn + content[idx:]

# 2. Add new CSS before FIRST </style>
new_css = '''
        /* Sprint Board */
        .sprint-col { min-height: 200px; }
        .sprint-item { padding: 0.75rem; margin: 0.5rem 0; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; cursor: grab; font-size: 0.85rem; color: var(--text-secondary); transition: all 0.2s; }
        .sprint-item:hover { border-color: var(--accent); transform: translateY(-1px); }
        .sprint-item:active { cursor: grabbing; }
        .global-search { position: relative; }
        .global-search input { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 1rem 0.5rem 2.2rem; border-radius: 8px; font-size: 0.85rem; width: 220px; outline: none; transition: all 0.3s; }
        .global-search input:focus { border-color: var(--accent); width: 320px; box-shadow: 0 0 20px rgba(59,130,246,0.15); }
        .global-search::before { content: "\\1F50D"; position: absolute; left: 0.6rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; }
        .header-controls { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; }
        .header-controls button { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; }
        .header-controls button:hover { border-color: var(--accent); color: var(--text-primary); }
        .countdown-display { display: inline-flex; gap: 0.5rem; align-items: center; font-size: 0.8rem; color: var(--text-muted); background: var(--bg-elevated); padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); }
        .countdown-display .cd-num { color: var(--accent); font-weight: 700; font-size: 1rem; }
        html.light { --bg-deep: #f0f2f5; --bg-primary: #ffffff; --bg-card: #f8f9fa; --bg-elevated: #edf0f4; --border: rgba(0,0,0,0.1); --border-bright: rgba(0,0,0,0.2); --text-primary: #1a1a2e; --text-secondary: #4a5568; --text-muted: #718096; }
        html.light .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        html.light .tab-nav { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.1); }
        html.light .footer { background: #1a1a2e; }
        .search-highlight { background: rgba(251,191,36,0.3); border-radius: 2px; padding: 0 2px; }
'''
idx = content.index('</style>')
content = content[:idx] + new_css + content[idx:]

# 3. Add header controls before </header>
header_controls = '''        <div class="header-controls">
            <div class="global-search"><input type="text" id="globalSearch" placeholder="Search all tabs..." oninput="globalSearchHandler(this.value)"></div>
            <button onclick="toggleTheme()" id="themeToggle">&#127763; Light Mode</button>
            <button onclick="exportToPDF()">&#128228; Export PNG</button>
            <div class="countdown-display" id="countdown-box">&#128640; MVP Launch: <span class="cd-num" id="cd-days">--</span>d <span class="cd-num" id="cd-hours">--</span>h <span class="cd-num" id="cd-mins">--</span>m</div>
        </div>
'''
idx = content.index('</header>')
content = content[:idx] + header_controls + content[idx:]

# 4. Add 8 new tab buttons after techarch button line
techarch_line_end = content.index('Tech Architecture</button></li>') + len('Tech Architecture</button></li>')
# Find end of that line
nl = content.index('\n', techarch_line_end)
new_tabs = '''
        <li><button class="tab-btn" data-tab="sprint" style="color:var(--success);">&#128203; Sprint Board</button></li>
        <li><button class="tab-btn" data-tab="calculator" style="color:var(--gold);">&#128185; Calculator</button></li>
        <li><button class="tab-btn" data-tab="hiring" style="color:var(--teal);">&#129489;&#8205;&#128188; Hiring</button></li>
        <li><button class="tab-btn" data-tab="aso" style="color:var(--accent-secondary);">&#128241; ASO</button></li>
        <li><button class="tab-btn" data-tab="gamification" style="color:var(--warning);">&#127918; Gamification</button></li>
        <li><button class="tab-btn" data-tab="uniteconomics" style="color:var(--accent);">&#128202; Unit Economics</button></li>
        <li><button class="tab-btn" data-tab="legal" style="color:var(--danger);">&#127963; Legal</button></li>
        <li><button class="tab-btn" data-tab="security" style="color:var(--teal);">&#128272; Security Audit</button></li>'''
content = content[:nl+1] + new_tabs + '\n' + content[nl+1:]

# 5. Add panels before FIRST </main>
idx = content.index('</main>')
content = content[:idx] + '\n' + panels + '\n\n' + content[idx:]

# 6. Add all JS before </script>
js = '''
    // ======= FINANCIAL CALCULATOR =======
    function updateCalc() {
        var mau = +document.getElementById('calc-mau').value;
        var conv = +document.getElementById('calc-conv').value / 100;
        var price = +document.getElementById('calc-price').value;
        var churn = +document.getElementById('calc-churn').value / 100;
        var burn = +document.getElementById('calc-burn').value;
        var paidUsers = Math.round(mau * conv);
        var mrr = paidUsers * price;
        var arr = mrr * 12;
        var arpu = mrr / mau;
        var ltv = price / churn;
        var netMRR = mrr - burn;
        document.getElementById('calc-mau-val').textContent = mau.toLocaleString();
        document.getElementById('calc-conv-val').textContent = (conv*100).toFixed(1) + '%';
        document.getElementById('calc-price-val').textContent = '$' + price.toFixed(2);
        document.getElementById('calc-churn-val').textContent = (churn*100) + '%';
        document.getElementById('calc-burn-val').textContent = '$' + burn.toLocaleString();
        document.getElementById('calc-mrr').textContent = '$' + mrr.toLocaleString(undefined, {maximumFractionDigits:0});
        document.getElementById('calc-arr').textContent = '$' + arr.toLocaleString(undefined, {maximumFractionDigits:0});
        document.getElementById('calc-arpu').textContent = '$' + arpu.toFixed(2);
        document.getElementById('calc-ltv').textContent = '$' + ltv.toFixed(2);
        document.getElementById('calc-payback').textContent = (1/conv).toFixed(1) + ' mo';
        document.getElementById('calc-runway').textContent = netMRR > 0 ? 'Infinite' : Math.ceil(10000/Math.abs(netMRR)) + ' mo';
        document.getElementById('calc-val-3x').textContent = '$' + (arr*3/1000).toFixed(0) + 'K';
        document.getElementById('calc-val-5x').textContent = '$' + (arr*5/1000).toFixed(0) + 'K';
        document.getElementById('calc-val-8x').textContent = '$' + (arr*8/1000).toFixed(0) + 'K';
        document.getElementById('calc-val-10x').textContent = '$' + (arr*10/1000).toFixed(0) + 'K';
    }
    // ======= SPRINT BOARD =======
    function sprintDrag(ev) { ev.dataTransfer.setData('text', ev.target.id); }
    function sprintDrop(ev) {
        ev.preventDefault();
        var id = ev.dataTransfer.getData('text');
        var el = document.getElementById(id);
        var col = ev.target.closest('.sprint-col');
        if (col && el) { col.appendChild(el); saveSprintState(); }
    }
    function saveSprintState() {
        var state = {};
        document.querySelectorAll('.sprint-col').forEach(function(col) {
            state[col.id] = Array.from(col.children).map(function(c) { return c.id; });
        });
        localStorage.setItem('f2f-sprint', JSON.stringify(state));
    }
    (function loadSprint() {
        var saved = localStorage.getItem('f2f-sprint');
        if (!saved) return;
        try {
            var state = JSON.parse(saved);
            Object.keys(state).forEach(function(colId) {
                var col = document.getElementById(colId);
                if (!col) return;
                state[colId].forEach(function(itemId) {
                    var item = document.getElementById(itemId);
                    if (item) col.appendChild(item);
                });
            });
        } catch(e) {}
    })();
    // ======= GLOBAL SEARCH =======
    function globalSearchHandler(query) {
        if (!query || query.length < 2) return;
        var panels = document.querySelectorAll('.tab-panel');
        var found = [];
        panels.forEach(function(panel) {
            if (panel.textContent.toLowerCase().includes(query.toLowerCase())) {
                found.push(panel.id.replace('tab-', ''));
            }
        });
        if (found.length > 0) {
            var btn = document.querySelector('[data-tab="' + found[0] + '"]');
            if (btn) btn.click();
            document.getElementById('globalSearch').title = 'Found in ' + found.length + ' tabs: ' + found.join(', ');
        }
    }
    // ======= THEME TOGGLE =======
    function toggleTheme() {
        document.documentElement.classList.toggle('light');
        var isLight = document.documentElement.classList.contains('light');
        document.getElementById('themeToggle').innerHTML = isLight ? '&#127769; Dark Mode' : '&#127763; Light Mode';
        localStorage.setItem('f2f-theme', isLight ? 'light' : 'dark');
    }
    if (localStorage.getItem('f2f-theme') === 'light') {
        document.documentElement.classList.add('light');
        var tb = document.getElementById('themeToggle');
        if (tb) tb.innerHTML = '&#127769; Dark Mode';
    }
    // ======= EXPORT PNG =======
    function exportToPDF() {
        var activePanel = document.querySelector('.tab-panel.active');
        if (!activePanel) return;
        var tabName = activePanel.id.replace('tab-', '');
        if (typeof html2canvas !== 'undefined') {
            html2canvas(activePanel, {backgroundColor:'#050a14', scale:2, useCORS:true}).then(function(canvas) {
                var link = document.createElement('a');
                link.download = 'F2F_' + tabName + '_' + new Date().toISOString().slice(0,10) + '.png';
                link.href = canvas.toDataURL();
                link.click();
            });
        } else { window.print(); }
    }
    // ======= COUNTDOWN =======
    function updateCountdown() {
        var saved = localStorage.getItem('f2f-launch-date');
        var launch = saved ? new Date(saved) : new Date(Date.now() + 21*86400000);
        if (!saved) localStorage.setItem('f2f-launch-date', launch.toISOString());
        var diff = launch - new Date();
        if (diff <= 0) { document.getElementById('cd-days').textContent = '0'; document.getElementById('cd-hours').textContent = '0'; document.getElementById('cd-mins').textContent = '0'; return; }
        document.getElementById('cd-days').textContent = Math.floor(diff/86400000);
        document.getElementById('cd-hours').textContent = Math.floor((diff%86400000)/3600000);
        document.getElementById('cd-mins').textContent = Math.floor((diff%3600000)/60000);
    }
    updateCountdown(); setInterval(updateCountdown, 60000);
    // ======= SECURITY PROGRESS =======
    function updateSecurityProgress() {
        var checks = document.querySelectorAll('.sec-check');
        var done = Array.from(checks).filter(function(c){return c.checked;}).length;
        var total = checks.length;
        var pct = Math.round((done/total)*100);
        var critLeft = Array.from(checks).slice(0,6).filter(function(c){return !c.checked;}).length;
        var highLeft = Array.from(checks).slice(6).filter(function(c){return !c.checked;}).length;
        document.getElementById('sec-critical').textContent = critLeft;
        document.getElementById('sec-high').textContent = highLeft;
        document.getElementById('sec-done').textContent = done;
        document.getElementById('sec-pct').textContent = pct + '%';
        localStorage.setItem('f2f-security', JSON.stringify(Array.from(checks).map(function(c){return c.checked;})));
    }
    (function(){var s=localStorage.getItem('f2f-security');if(s){try{var st=JSON.parse(s);document.querySelectorAll('.sec-check').forEach(function(c,i){if(st[i])c.checked=true;});updateSecurityProgress();}catch(e){}}})();
    // ======= LEGAL CHECKLIST =======
    function saveLegalChecklist() {
        var checks = [];
        for (var i=1;i<=12;i++){var el=document.getElementById('lc-'+i);if(el)checks.push(el.checked);}
        localStorage.setItem('f2f-legal', JSON.stringify(checks));
    }
    (function(){var s=localStorage.getItem('f2f-legal');if(s){try{var st=JSON.parse(s);st.forEach(function(v,i){var el=document.getElementById('lc-'+(i+1));if(el)el.checked=v;});}catch(e){}}})();
'''
idx = content.index('</script>')
content = content[:idx] + js + '\n' + content[idx:]

# 7. Update footer
content = content.replace('28 Tabs', '36 Tabs')

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
btn_count = len(re.findall(r'data-tab="', content))
panel_count = len(re.findall(r'id="tab-', content))
print(f"Buttons: {btn_count} | Panels: {panel_count} | Size: {len(content)} bytes | Lines: {content.count(chr(10))}")

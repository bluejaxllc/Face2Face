const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

// 1. CSS
const oldMediaPattern = /@media\(max-width:768px\)\{[^\}]+\.cat-btn\.active::after\s*\{\s*display:\s*none;\s*\}\s*\}/;

const newMedia = `.mobile-dropdown-nav { display: none; }
@media(max-width:768px){
  .cat-bar, .tab-list { display: none !important; }
  .mobile-dropdown-nav { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(5,10,20,0.95); border-bottom: 1px solid var(--border); }
  .nav-select { width: 100%; padding: 0.75rem 1rem; font-size: 1rem; font-weight: 600; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; }
  .nav-select:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
  .mobile-dropdown-nav select { background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 1rem top 50%; background-size: 0.65rem auto; }
}`.replace(/\n\s*/g, ' ');

html = html.replace(oldMediaPattern, newMedia);

// 2. HTML Injection
const htmlToInject = `
      <div class="mobile-dropdown-nav">
          <select id="mobile-cat-select" class="nav-select" style="border-color: var(--accent); color: var(--accent);">
              <option value="core">📊 Core</option>
              <option value="research">🔬 Research</option>
              <option value="strategy">💡 Strategy</option>
              <option value="tools">🛠️ Tools</option>
              <option value="growth">🚀 Growth</option>
              <option value="ops">⚙️ Operations</option>
              <option value="investor">💼 Investor</option>
              <option value="technical">🔧 Technical</option>
          </select>
          <select id="mobile-tab-select" class="nav-select">
          </select>
      </div>`;
html = html.replace('<div class="cat-bar">', htmlToInject + '\n      <div class="cat-bar">');

// 3. JS Injection
const jsToInject = `
    // ======= MOBILE DROPDOWNS =======
    (function() {
        var catSelect = document.getElementById('mobile-cat-select');
        var tabSelect = document.getElementById('mobile-tab-select');
        if (!catSelect || !tabSelect) return;

        function populateTabs(cat) {
            tabSelect.innerHTML = '';
            var btns = document.querySelectorAll('.tab-list li[data-cat="'+cat+'"] .tab-btn');
            btns.forEach(function(btn) {
                var opt = document.createElement('option');
                opt.value = btn.dataset.tab;
                opt.textContent = btn.textContent;
                tabSelect.appendChild(opt);
            });
        }

        catSelect.addEventListener('change', function() {
            var catBtn = document.querySelector('.cat-btn[data-cat="'+this.value+'"]');
            if (catBtn) catBtn.click();
            populateTabs(this.value);
            if (tabSelect.options.length > 0) {
                tabSelect.value = tabSelect.options[0].value;
                var tabBtn = document.querySelector('.tab-btn[data-tab="'+tabSelect.value+'"]');
                if (tabBtn) tabBtn.click();
            }
        });

        tabSelect.addEventListener('change', function() {
            var tabBtn = document.querySelector('.tab-btn[data-tab="'+this.value+'"]');
            if (tabBtn) tabBtn.click();
        });

        // Initialize
        populateTabs('core');
        
        // Listen to native clicks on desktop to keep mobile dropdown in sync
        document.querySelectorAll('.cat-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if(catSelect.value !== btn.dataset.cat) {
                    catSelect.value = btn.dataset.cat;
                    populateTabs(btn.dataset.cat);
                }
            });
        });
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if(tabSelect.value !== btn.dataset.tab) {
                    tabSelect.value = btn.dataset.tab;
                }
            });
        });
    })();
`;

html = html.replace('</body>', jsToInject + '\n</body>');

fs.writeFileSync(SRC, html, 'utf8');
console.log('Mobile dropdowns applied');

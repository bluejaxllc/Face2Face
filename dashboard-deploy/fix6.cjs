const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

// I need to wrap the raw JS block at the bottom with <script> tags.
// The string was:
//     // ======= MOBILE DROPDOWNS =======
//     (function() {
// ...
//     })();

const badScript = `
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

html = html.replace(badScript, '<script>' + badScript + '</script>');

fs.writeFileSync(SRC, html, 'utf8');
console.log('Fixed missing script tag!');

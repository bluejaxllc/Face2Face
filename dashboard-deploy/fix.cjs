const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

// 1. Remove the literal \n\n</main> 
html = html.replace(/\\n\\n<\/main>/g, '\n</main>');

// 2. Add the missing buttons if they don't exist
const navItems = [
  '        <li data-cat="research"><button class="tab-btn" data-tab="gamificationpsych" style="color:var(--purple);">🧠 Gamification Psychology</button></li>',
  '        <li data-cat="tools"><button class="tab-btn" data-tab="dataanalytics" style="color:var(--blue);">📈 Analytics Map</button></li>',
  '        <li data-cat="strategy"><button class="tab-btn" data-tab="gtmplaybooks" style="color:var(--orange);">🚀 GTM Playbooks</button></li>',
  '        <li data-cat="investor"><button class="tab-btn" data-tab="financialmodels" style="color:var(--green);">💸 Financial Models</button></li>'
].join('\n');

if (!html.includes('gamificationpsych">🧠')) {
    html = html.replace('    </ul>\r\n</nav>', navItems + '\n    </ul>\r\n</nav>');
    html = html.replace('    </ul>\n</nav>', navItems + '\n    </ul>\n</nav>');
}

// 3. Fix the "overview" button issue
// We will change the Overview button to data-tab="market" and the Market Intel button to data-tab="market2" ... Wait, no.
// Let's just remove the Overview button and make Market Intel the default.
html = html.replace('<li class="cat-visible" data-cat="core"><button class="tab-btn active" data-tab="overview">Overview</button></li>\r\n', '');
html = html.replace('<li class="cat-visible" data-cat="core"><button class="tab-btn active" data-tab="overview">Overview</button></li>\n', '');
html = html.replace('<button class="tab-btn" data-tab="market">Market Intel</button>', '<button class="tab-btn active" data-tab="market">Market Intel</button>');

// Also need to set tab-market to active
html = html.replace('<div class="tab-panel" id="tab-market">', '<div class="tab-panel active" id="tab-market">');

fs.writeFileSync(SRC, html, 'utf8');
console.log('Fixed index.html');

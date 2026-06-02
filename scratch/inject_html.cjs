const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'dashboard-deploy', 'index.html');
const NEW_PANELS = path.join(__dirname, 'new_panels.html');

let html = fs.readFileSync(SRC, 'utf8');
let newHtml = fs.readFileSync(NEW_PANELS, 'utf8');

const navItems = [
  '        <li data-cat="research"><button class="tab-btn" data-tab="gamificationpsych" style="color:var(--purple);">🧠 Gamification Psychology</button></li>',
  '        <li data-cat="tools"><button class="tab-btn" data-tab="dataanalytics" style="color:var(--blue);">📈 Analytics Map</button></li>',
  '        <li data-cat="strategy"><button class="tab-btn" data-tab="gtmplaybooks" style="color:var(--orange);">🚀 GTM Playbooks</button></li>',
  '        <li data-cat="investor"><button class="tab-btn" data-tab="financialmodels" style="color:var(--green);">💸 Financial Models</button></li>'
].join('\\n');

html = html.replace('    </ul>\\n</nav>', navItems + '\\n    </ul>\\n</nav>');
html = html.replace('</main>', newHtml + '\\n\\n</main>');

fs.writeFileSync(SRC, html, 'utf8');
console.log('✅ Injected 4 new panels into dashboard');

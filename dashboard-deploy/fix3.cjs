const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

const target = '@media(max-width:768px){.cat-bar,.tab-list{justify-content:flex-start !important; padding-left: 1rem;}.cat-btn{padding:0.5rem 0.6rem;font-size:0.65rem}.tab-btn{padding:0.5rem 0.6rem;font-size:0.72rem}}';

const replacement = `@media(max-width:768px){
  .cat-bar { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; padding: 0.75rem !important; background: rgba(5,10,20,0.95); }
  .cat-btn { padding: 0.5rem 0.2rem; font-size: 0.65rem; text-align: center; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid transparent; white-space: normal; line-height: 1.3; }
  .cat-btn.active { background: rgba(59,130,246,0.15); border: 1px solid var(--accent); color: var(--accent); }
  .cat-btn.active::after { display: none; }
  .tab-list { display: flex !important; flex-wrap: wrap; justify-content: center !important; gap: 0.5rem; padding: 0.75rem !important; }
  .tab-btn { padding: 0.4rem 0.8rem; font-size: 0.75rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; }
  .tab-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .tab-btn.active::after { display: none; }
}`.replace(/\n\s*/g, '');

html = html.replace(target, replacement);

fs.writeFileSync(SRC, html, 'utf8');
console.log('Grid layout applied for mobile categories');

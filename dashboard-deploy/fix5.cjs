const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

const targetStr = '@media(max-width:768px){.cat-bar { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; padding: 0.75rem !important; background: rgba(5,10,20,0.95); }.cat-btn { padding: 0.5rem 0.2rem; font-size: 0.65rem; text-align: center; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid transparent; white-space: normal; line-height: 1.3; }.cat-btn.active { background: rgba(59,130,246,0.15); border: 1px solid var(--accent); color: var(--accent); }.cat-btn.active::after { display: none; }.tab-list { display: flex !important; flex-wrap: wrap; justify-content: center !important; gap: 0.5rem; padding: 0.75rem !important; }.tab-btn { padding: 0.4rem 0.8rem; font-size: 0.75rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; }.tab-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }.tab-btn.active::after { display: none; }}';

const newMedia = `.mobile-dropdown-nav { display: none; }
@media(max-width:768px){
  .cat-bar, .tab-list { display: none !important; }
  .mobile-dropdown-nav { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(5,10,20,0.95); border-bottom: 1px solid var(--border); }
  .nav-select { width: 100%; padding: 0.75rem 1rem; font-size: 1rem; font-weight: 600; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; -webkit-appearance: none; appearance: none; outline: none; cursor: pointer; }
  .nav-select:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
  .mobile-dropdown-nav select { background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 1rem top 50%; background-size: 0.65rem auto; }
}`.replace(/\n\s*/g, ' ');

html = html.replace(targetStr, newMedia);
fs.writeFileSync(SRC, html, 'utf8');
console.log('Mobile dropdown CSS applied!');

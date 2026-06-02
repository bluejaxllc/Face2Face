const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
let html = fs.readFileSync(SRC, 'utf8');

// The line is:
// @media(max-width:768px){.cat-btn{padding:0.5rem 0.6rem;font-size:0.65rem}.tab-btn{padding:0.5rem 0.6rem;font-size:0.72rem}}

const target = '@media(max-width:768px){.cat-btn{padding:0.5rem 0.6rem;font-size:0.65rem}.tab-btn{padding:0.5rem 0.6rem;font-size:0.72rem}}';
const replacement = '@media(max-width:768px){.cat-bar,.tab-list{justify-content:flex-start !important; padding-left: 1rem;}.cat-btn{padding:0.5rem 0.6rem;font-size:0.65rem}.tab-btn{padding:0.5rem 0.6rem;font-size:0.72rem}}';

html = html.replace(target, replacement);

fs.writeFileSync(SRC, html, 'utf8');
console.log('Fixed mobile CSS');

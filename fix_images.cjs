const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Explore.tsx', 'utf-8');
let count = 1;
c = c.replace(/src="https:\/\/images\.unsplash\.com\/[^"]+"/g, () => 'src="https://picsum.photos/seed/f2f_' + (count++) + '/400/600"');
fs.writeFileSync('client/src/pages/Explore.tsx', c);

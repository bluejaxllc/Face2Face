const { execSync } = require('child_process');
const fs = require('fs');
const out = execSync('git -C "d:\\Repository\\Face 2 Face" log --oneline -n 10', { encoding: 'utf8' });
// replace spaces with underscores to prevent wrapping issues if needed
fs.writeFileSync('C:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\log_utf8.txt', out, 'utf8');
console.log(out);

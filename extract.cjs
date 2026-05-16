const { execSync } = require('child_process');
const fs = require('fs');
const output = execSync('git -C "D:\\Repository\\Face 2 Face" show ed17f00:client/src/components/BottomNavigation.tsx', { encoding: 'utf8' });
fs.writeFileSync('C:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\nav_fixed_utf8.tsx', output, 'utf8');

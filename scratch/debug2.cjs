var c = require('fs').readFileSync('c:\\Users\\edgar\\OneDrive\\Desktop\\Face 2 Face\\dashboard-deploy\\index.html','utf8');
var lines = c.split('\n');

// Find all script tags
for (var i=0; i<lines.length; i++) {
    if (lines[i].match(/<script/) || lines[i].match(/<\/script>/)) {
        console.log('L' + (i+1) + ': ' + lines[i].trim().substring(0,120));
    }
}

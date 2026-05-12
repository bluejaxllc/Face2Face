const fs = require('fs');
const path = require('path');

const replacements = [
    // Categories
    { regex: /category === "bump"/g, replace: 'category === "casual"' },
    { regex: /category: "bump"/g, replace: 'category: "casual"' },
    { regex: /category === "grind"/g, replace: 'category === "intimate"' },
    { regex: /category: "grind"/g, replace: 'category: "intimate"' },
    { regex: /"bump" \/\//g, replace: '"casual" //' },
    { regex: /"grind" \/\//g, replace: '"intimate" //' },
    { regex: /showBump/g, replace: 'showCasual' },
    { regex: /showGrind/g, replace: 'showIntimate' },
    { regex: /onBumpClick/g, replace: 'onCasualClick' },
    { regex: /onGrindClick/g, replace: 'onIntimateClick' },
    { regex: /handleBumpClick/g, replace: 'handleCasualClick' },
    { regex: /handleGrindClick/g, replace: 'handleIntimateClick' },

    // UI text
    { regex: />Bump</g, replace: '>Casual<' },
    { regex: />Grind</g, replace: '>Intimate<' },
    { regex: /Bump \(Casual\)/g, replace: 'Casual' },
    { regex: /Grind \(Intimate\)/g, replace: 'Intimate' },
    { regex: /Bump users/g, replace: 'Casual users' },
    { regex: /Grind users/g, replace: 'Intimate users' },
    { regex: /"Bump" for/g, replace: '"Casual" for' },
    { regex: /"Grind" for/g, replace: '"Intimate" for' },
    { regex: /bump-marker/g, replace: 'casual-marker' },
    { regex: /grind-marker/g, replace: 'intimate-marker' },
    { regex: /badge-bump/g, replace: 'badge-casual' },
    { regex: /badge-grind/g, replace: 'badge-intimate' },
    { regex: /Bump and Grind/ig, replace: 'Face2Face' },
    { regex: /Bump & Grind/ig, replace: 'Face2Face' },

    // Action text replacements
    { regex: /Bump successful!/g, replace: 'Connection successful!' },
    { regex: /Failed to bump/g, replace: 'Failed to connect' },
    { regex: /bumped into/g, replace: 'connected with' },
    { regex: /You've both bumped into each other/g, replace: "You've both connected with each other" },
    { regex: /simulate bump/g, replace: 'simulate connection' },
    { regex: /Bump/g, replace: 'Connect' }
];

const walk = function (dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/edgar/OneDrive/Desktop/Face 2 Face/Bump-and-Grind/client/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    for (let { regex, replace } of replacements) {
        content = content.replace(regex, replace);
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        console.log('Updated:', file);
    }
});

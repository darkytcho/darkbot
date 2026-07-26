const fs = require('fs');
const path = require('path');

const HEADER = `// ==UserScript==
// @name         DarkBot
// @author       DarkBot
// @description  Bot for Grepolis
// @version      0.1.0-beta
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// ==/UserScript==

`;

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT = path.join(DIST_DIR, 'darkbot.user.js');

// Order matters: util first, then storage, console, UI, modules, setup last
const FILE_ORDER = [
    'util.js',
    'storage.js',
    'console.js',
    'darkui.js',
    'autoFarm.js',
    'setup.js',
];

if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

let combined = HEADER;

for (const file of FILE_ORDER) {
    const filePath = path.join(SRC_DIR, file);
    if (fs.existsSync(filePath)) {
        combined += fs.readFileSync(filePath, 'utf8') + '\n\n';
        console.log(`  + ${file}`);
    } else {
        console.warn(`  ! ${file} not found, skipping`);
    }
}

fs.writeFileSync(OUTPUT, combined, 'utf8');
console.log(`\nBuild complete: ${OUTPUT}`);

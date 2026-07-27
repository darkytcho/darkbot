const fs = require('fs');
const path = require('path');

const HEADER = `// ==UserScript==
// @name         DarkBot
// @author       DarkBot
// @description  Bot for Grepolis
// @version      0.2.2
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @run-at       document-idle
// ==/UserScript==

`;

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT = path.join(DIST_DIR, 'darkbot.user.js');

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

let modules = '';
for (const file of FILE_ORDER) {
    const filePath = path.join(SRC_DIR, file);
    if (fs.existsSync(filePath)) {
        modules += fs.readFileSync(filePath, 'utf8') + '\n\n';
        console.log(`  + ${file}`);
    } else {
        console.warn(`  ! ${file} not found, skipping`);
    }
}

const toggleStyle = `
    .darkbot-toggle-btn {
        position: fixed; top: 50%; right: 0;
        transform: translateY(-50%);
        width: 32px; height: 64px;
        background: #1a0f06; border: 2px solid #8b6914;
        border-right: none;
        border-radius: 8px 0 0 8px;
        cursor: pointer; z-index: 99998;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; color: #d4a017;
        font-size: 16px; font-weight: 900;
        font-family: 'Segoe UI', Arial, sans-serif;
    }
    .darkbot-toggle-btn:hover {
        background: #8b6914; color: #fff;
        width: 38px;
    }
`;

const innerInit = `
        (function _darkbotInit() {
            var loader = document.getElementById('loader');
            var uwReady = typeof uw !== 'undefined';
            console.log('[DarkBot] init check — loader:', !!loader, 'uw:', uwReady);

            if (!uwReady) {
                var candidates = ['uw', 'Grepolis', 'gp', 'gameData', 'GameData', 'ITowns', 'MM'];
                var found = candidates.filter(function(k) { return typeof window[k] !== 'undefined'; });
                if (found.length > 0) {
                    console.log('[DarkBot] found globals:', found.join(', '));
                }
            }

            if (loader || !uwReady) {
                setTimeout(_darkbotInit, 1000);
                return;
            }

            console.log('[DarkBot] starting...');
            window.addEventListener('beforeunload', function () {
                document.querySelectorAll('.darkbot-toggle-btn, #darkbot-panel, #darkbot-style').forEach(function(el) { el.remove(); });
                if (window._darkbotScript) window._darkbotScript.remove();
                if (window._darkbotStyleEl) window._darkbotStyleEl.remove();
            });

            window.darkBot = new DarkBot();
            console.log('[DarkBot] ready!');
        })();
`;

const innerScript =
    '(function () {\n' +
    '    if (window.opener) {\n' +
    '        window.close();\n' +
    '        return;\n' +
    '    }\n\n' +
    modules +
    innerInit +
    '})();\n';

const output =
    HEADER +
    '(function () {\n' +
    '    if (window.opener) {\n' +
    '        window.close();\n' +
    '        return;\n' +
    '    }\n\n' +
    '    document.head.appendChild(document.createElement("style")).textContent = ' + JSON.stringify(toggleStyle) + ';\n' +
    '    window._darkbotStyleEl = document.head.querySelector("style");\n\n' +
    '    var script = document.head.appendChild(document.createElement("script"));\n' +
    '    script.textContent = ' + JSON.stringify(innerScript) + ';\n' +
    '    window._darkbotScript = script;\n' +
    '})();\n';

fs.writeFileSync(OUTPUT, output, 'utf8');
console.log(`\nBuild complete: ${OUTPUT}`);

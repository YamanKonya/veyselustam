const fs = require('fs');
const path = './src/i18n/translations.ts';

let content = fs.readFileSync(path, 'utf8');

// Replace the literal string "\\nnav_whatsapp_support" with actual newline and the string
content = content.replace(/\\nnav_whatsapp_support/g, '\n    nav_whatsapp_support');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed literal newlines!");

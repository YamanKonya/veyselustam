const fs = require('fs');
const path = './src/i18n/translations.ts';

let content = fs.readFileSync(path, 'utf8');

// Replace ANY occurrence of the literal two characters '\' and 'n' that got wrongly inserted
content = content.replace(/\\n/g, '\n');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed all literal newlines!");

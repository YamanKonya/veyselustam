const fs = require('fs');
const path = './src/i18n/translations.ts';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the line that is '  },' (which is the end of the ar block, around line 908)
// and '};' (which is the end of the file)
let cleanLines = [];
let foundEnd = false;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '};' && lines[i-1].trim() === '},') {
        cleanLines.push(line);
        foundEnd = true;
        break;
    }
    cleanLines.push(line);
}

// Now we have the clean lines before the injection messed it up.
// Wait, the injection happened INSIDE the blocks, didn't it?
// Let's check if the injection happened inside 'tr', 'en', 'es', 'de' as well.

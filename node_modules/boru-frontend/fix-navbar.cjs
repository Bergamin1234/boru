const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('<nav class="hidden xl:flex items-center gap-6 text-sm font-medium text-zinc-300">', '<nav class="hidden xl:flex items-center gap-4 text-sm font-medium text-zinc-300 whitespace-nowrap">');

fs.writeFileSync('index.html', html);

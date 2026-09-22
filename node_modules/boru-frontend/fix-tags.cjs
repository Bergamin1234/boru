const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace the unmatched </button> with </a> for the two buttons
html = html.replace(/<a href="\/agendar" class="w-full sm:w-auto inline-flex([\s\S]*?)<\/button>/, '<a href="/agendar" class="w-full sm:w-auto inline-flex$1</a>');
html = html.replace(/<a href="\/agendar" class="px-3 py-1\.5 rounded-lg([\s\S]*?)<\/button>/, '<a href="/agendar" class="px-3 py-1.5 rounded-lg$1</a>');

fs.writeFileSync('index.html', html);

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/<button onclick="openBookingModal\(\)"/g, '<a href="/agendar"');
html = html.replace(/Agendar Minha Primeira Aula\s*<\/button>/g, 'Agendar Minha Primeira Aula</a>');
html = html.replace(/Agendar\s*<\/button>/g, 'Agendar</a>');
html = html.replace(/Agendar Treino Experimental\s*<\/button>/g, 'Agendar Treino Experimental</a>');

fs.writeFileSync('index.html', html);

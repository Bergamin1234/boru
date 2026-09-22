const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('Mestres Faixa Preta', 'Mestres Graduados');
html = html.replace('professores faixa preta em Muay Thai', 'professores graduados em Muay Thai');

fs.writeFileSync('index.html', html);

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('KRU FELIPE BORÜ', 'FELIPE BORÜ');
html = html.replace('Grau Preto (Kru)', 'Prajied Azul Escuro e Preto');
html = html.replace('Grau Preto em Muay Thai', 'Prajied Azul Escuro e Preto em Muay Thai');

fs.writeFileSync('index.html', html);

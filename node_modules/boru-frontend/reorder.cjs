const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sections = html.split('<!-- ================= ');

// Original array: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
// Target array:   0, 1, 2, 9, 8, 3, 4, 5, 6, 7, 10, 11, 12, 13

const newOrder = [
  sections[0],
  sections[1],
  sections[2],
  sections[9], // Planos
  sections[8], // Horarios
  sections[3], // O Que 
  sections[4], // Estrutura
  sections[5], // Professores
  sections[6], // Modalidades
  sections[7], // Galeria
  sections[10], // FAQ
  sections[11], // Localizacao
  sections[12], // Footer
  sections[13]  // Modal
];

const newHtml = newOrder.join('<!-- ================= ');
fs.writeFileSync('index.html', newHtml);
console.log('Reordered successfully!');

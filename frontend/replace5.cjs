const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const style = `
  <style>
    body.react-active > *:not(#root):not(script) {
      display: none !important;
    }
  </style>
</head>`;

html = html.replace('</head>', style);
fs.writeFileSync('index.html', html);

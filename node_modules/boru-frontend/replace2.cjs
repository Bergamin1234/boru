const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 3. Hero CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base uppercase tracking-wider glow-red transition transform hover:-translate-y-0.5 active:scale-95">\s*<i data-lucide="calendar" class="w-5 h-5 text-amber-300"><\/i>\s*Agendar Minha Primeira Aula\s*<\/button>/,
  '<a href="/agendar" class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base uppercase tracking-wider glow-red transition transform hover:-translate-y-0.5 active:scale-95">\n              <i data-lucide="calendar" class="w-5 h-5 text-amber-300"></i>\n              Agendar Minha Primeira Aula\n            </a>'
);

// 4. About Modal CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition">\s*Agendar\s*<\/button>/,
  '<a href="/agendar" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition">\n                  Agendar\n                </a>'
);

// 5. Structure CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition">\s*Agendar Treino Experimental\s*<\/button>/,
  '<a href="/agendar" class="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition">\n              Agendar Treino Experimental\n            </a>'
);

fs.writeFileSync('index.html', html);
console.log('Replaced successfully');

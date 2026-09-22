const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Navbar 'Aula Experimental'
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="inline-flex items-center gap-2 px-5 py-2\.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-900\/40 hover:shadow-red-700\/60 transition transform active:scale-95">\s*<i data-lucide="flame" class="w-4 h-4 text-amber-300 animate-pulse"><\/i>\s*<span>Aula Experimental<\/span>\s*<\/button>/,
  '<a href="/agendar" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-900/40 hover:shadow-red-700/60 transition transform active:scale-95">\n          <i data-lucide="flame" class="w-4 h-4 text-amber-300 animate-pulse"></i>\n          <span>Aula Experimental</span>\n        </a>'
);

// 2. Mobile Menu
html = html.replace(
  /<button onclick="closeMobileMenu\(\); openBookingModal\(\);" class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 text-white font-bold text-sm shadow-md">\s*<i data-lucide="calendar-check" class="w-4 h-4"><\/i>\s*Agendar Aula Gratuita no WhatsApp\s*<\/button>/,
  '<a href="/agendar" onclick="closeMobileMenu()" class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition">\n          <i data-lucide="calendar-check" class="w-4 h-4"></i>\n          Agendar Aula Experimental\n        </a>'
);

// 3. Hero CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base uppercase tracking-wider glow-red transition transform hover:-translate-y-0\.5 active:scale-95">\s*<i data-lucide="calendar" class="w-5 h-5 text-amber-300"><\/i>\s*Agendar Minha Primeira Aula\s*<\/button>/,
  '<a href="/agendar" class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base uppercase tracking-wider glow-red transition transform hover:-translate-y-0.5 active:scale-95">\n              <i data-lucide="calendar" class="w-5 h-5 text-amber-300"></i>\n              Agendar Minha Primeira Aula\n            </a>'
);

// 4. About Modal CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="px-3 py-1\.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition">\s*Agendar\s*<\/button>/,
  '<a href="/agendar" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition">\n                  Agendar\n                </a>'
);

// 5. Structure CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition">\s*Agendar Treino Experimental\s*<\/button>/,
  '<a href="/agendar" class="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg transition">\n              Agendar Treino Experimental\n            </a>'
);

// 6. Muay Thai Card CTA
html = html.replace(
  /<button onclick="openBookingModal\('Muay Thai'\)" class="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">\s*Agendar Aula <i data-lucide="chevron-right" class="w-3\.5 h-3\.5"><\/i>\s*<\/button>/,
  '<a href="/agendar" class="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">\n                Agendar Aula <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>\n              </a>'
);

// 7. Pricing 2x
html = html.replace(
  /<button onclick="openBookingModal\('Plano 2x na semana'\)" class="w-full py-3 rounded-xl border border-zinc-700 hover:border-red-500 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition">\s*Assinar Plano\s*<\/button>/,
  '<a href="/checkout?plano=2x%20na%20semana&valor=140" class="block text-center w-full py-3 rounded-xl border border-zinc-700 hover:border-red-500 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition">\n              Assinar Plano\n            </a>'
);

// 8. Pricing 3x
html = html.replace(
  /<button onclick="openBookingModal\('Plano 3x na semana'\)" class="w-full py-3 rounded-xl border border-zinc-700 hover:border-red-500 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition">\s*Assinar Plano\s*<\/button>/,
  '<a href="/checkout?plano=3x%20na%20semana&valor=160" class="block text-center w-full py-3 rounded-xl border border-zinc-700 hover:border-red-500 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition">\n              Assinar Plano\n            </a>'
);

// 9. Pricing 5x
html = html.replace(
  /<button onclick="openBookingModal\('Plano 5x na semana'\)" class="w-full py-3 rounded-xl border border-zinc-700 hover:border-red-500 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition">\s*Assinar Plano\s*<\/button>/,
  '<a href="/checkout?plano=5x%20na%20semana&valor=200" class="block text-center w-full py-3 rounded-xl border border-zinc-700 hover:border-red-500 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition">\n              Assinar Plano\n            </a>'
);

// 10. Pricing Livre
html = html.replace(
  /<button onclick="openBookingModal\('Plano Livre'\)" class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-red-950 font-black text-sm uppercase tracking-wider shadow-lg transition">\s*Garantir\s*<\/button>/,
  '<a href="/checkout?plano=Livre&valor=280" class="block text-center w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-red-950 font-black text-sm uppercase tracking-wider shadow-lg transition">\n              Garantir\n            </a>'
);

// 11. Pricing Diária - note original had Diária R$25 in param but html might be Di&#225;ria or something. Let's just match any param.
html = html.replace(
  /<button onclick="openBookingModal\('[^']+'\)" class="px-6 py-2\.5 rounded-lg border border-zinc-700 hover:border-red-500 text-white font-bold text-sm transition">\s*Agendar\s*<\/button>/,
  '<a href="/checkout?plano=Diária&valor=25" class="px-6 py-2.5 rounded-lg border border-zinc-700 hover:border-red-500 text-white font-bold text-sm transition">\n            Agendar\n          </a>'
);

// 12. Contact WhatsApp CTA
html = html.replace(
  /<button onclick="openBookingModal\(\)" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">\s*<i data-lucide="send" class="w-4 h-4"><\/i>\s*Conversar no WhatsApp\s*<\/button>/,
  '<a href="/agendar" class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">\n              <i data-lucide="send" class="w-4 h-4"></i>\n              Conversar no WhatsApp\n            </a>'
);

// 13. Footer Area do Aluno
html = html.replace(
  /<a href="portal\.html" class="hover:text-red-400 transition font-bold">Área do Aluno<\/a>/,
  '<a href="/portal" class="hover:text-red-400 transition font-bold">Área do Aluno</a>'
);

// 14. Footer Admin Link
html = html.replace(
  /<div class="text-xs text-center md:text-right">\s*&copy; <span id="current-year"><\/span> BORÜ Centro de Combate\. Todos os direitos reservados\.\s*<\/div>/,
  '<div class="text-xs text-center md:text-right flex flex-col gap-1 items-end">\n          <span>&copy; <span id="current-year"></span> BORÜ Centro de Combate. Todos os direitos reservados.</span>\n          <a href="/admin" class="hover:text-red-500 transition opacity-30 hover:opacity-100 mt-1">Acesso de Professor</a>\n        </div>'
);

fs.writeFileSync('index.html', html);
console.log('Replaced successfully');

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace desktop nav
const newDesktopNav = `<nav class="hidden xl:flex items-center gap-4 text-sm font-medium text-zinc-300 whitespace-nowrap">
        <a href="#planos" class="hover:text-red-500 transition">Planos</a>
        <a href="#horarios" class="hover:text-red-500 transition">Horários</a>
        <a href="#o-que-e-o-ct" class="hover:text-red-500 transition">O Que É o CT</a>
        <a href="#estrutura" class="hover:text-red-500 transition">Estrutura</a>
        <a href="#modalidades" class="hover:text-red-500 transition">Modalidades</a>
        <a href="#professores" class="hover:text-red-500 transition">Professores</a>
        <a href="#galeria" class="hover:text-red-500 transition">Galeria</a>
        <a href="#faq" class="hover:text-red-500 transition">FAQ</a>
      </nav>`;

html = html.replace(/<nav class="hidden xl:flex items-center gap-4 text-sm font-medium text-zinc-300 whitespace-nowrap">[\s\S]*?<\/nav>/, newDesktopNav);

// Replace mobile nav
const newMobileNav = `<nav class="flex flex-col space-y-3 text-base font-semibold">
        <a href="#planos" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Planos & Parcerias</a>
        <a href="#horarios" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Grade de Horários</a>
        <a href="#o-que-e-o-ct" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">O Que É o CT BORÜ</a>
        <a href="#estrutura" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Estrutura & Espaço</a>
        <a href="#modalidades" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Modalidades de Luta</a>
        <a href="#professores" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Nossos Professores / Mestres</a>
        <a href="#galeria" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Galeria do Tatame</a>
        <a href="#faq" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Dúvidas Frequentes (FAQ)</a>
        <a href="#localizacao" class="text-zinc-300 hover:text-red-500 py-1" onclick="closeMobileMenu()">Onde Estamos</a>
      </nav>`;

html = html.replace(/<nav class="flex flex-col space-y-3 text-base font-semibold">[\s\S]*?<\/nav>/, newMobileNav);

fs.writeFileSync('index.html', html);
console.log('Navbars updated successfully!');

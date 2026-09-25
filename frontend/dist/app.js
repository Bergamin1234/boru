// js/app.js - Interações da Landing Page do BORÜ Centro de Combate (Modelo Portfólio do CT)

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  renderFacilities();
  renderInstructorsPortfolio();
  renderSchedule('all');
  initScheduleFilters();
  renderFAQ();
  lucide.createIcons();
});

function initHeaderScroll() {
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('bg-[#0B0B0C]', 'shadow-xl', 'border-zinc-800');
      header.classList.remove('bg-[#0B0B0C]/90');
    } else {
      header.classList.remove('bg-[#0B0B0C]', 'shadow-xl');
      header.classList.add('bg-[#0B0B0C]/90');
    }
  });
}

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.add('hidden');
}

function renderFacilities() {
  const container = document.getElementById('facilities-grid');
  if (!container || !window.BORU_DATA || !window.BORU_DATA.facilities) return;

  const facilities = window.BORU_DATA.facilities;
  let html = '';

  facilities.forEach(item => {
    html += `
      <div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 transition duration-300 card-combat space-y-4">
        <div class="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500">
          <i data-lucide="${item.icon}" class="w-6 h-6"></i>
        </div>
        <h4 class="font-heading text-xl font-bold text-white uppercase">${item.title}</h4>
        <p class="text-xs text-zinc-400 leading-relaxed">${item.desc}</p>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderInstructorsPortfolio() {
  const container = document.getElementById('instructors-portfolio-grid');
  if (!container || !window.BORU_DATA || !window.BORU_DATA.instructors) return;

  const instructors = window.BORU_DATA.instructors;
  let html = '';

  instructors.forEach(coach => {
    html += `
      <div class="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row gap-6 card-combat group">
        
        <div class="w-full md:w-48 flex-shrink-0">
          <div class="relative h-60 md:h-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
            <img src="${coach.image}" alt="${coach.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-red-500">${coach.role}</span>
              <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-amber-400 font-semibold border border-zinc-700">
                ${coach.cref}
              </span>
            </div>

            <h4 class="font-heading text-2xl font-bold text-white uppercase mt-1">${coach.name}</h4>
            <p class="text-xs text-zinc-400 mt-2 leading-relaxed">${coach.bio}</p>
          </div>

          <div>
            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Especialidades:</span>
            <div class="flex flex-wrap gap-1.5">
              ${coach.specialties.map(spec => `
                <span class="text-[11px] px-2.5 py-1 rounded-md bg-zinc-950 text-zinc-300 border border-zinc-800 font-medium">
                  ${spec}
                </span>
              `).join('')}
            </div>
          </div>

          <div class="pt-3 border-t border-zinc-800">
            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Currículo & Conquistas:</span>
            <ul class="space-y-1 text-xs text-zinc-300">
              ${coach.achievements.map(ach => `
                <li class="flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5 text-red-500 flex-shrink-0"></i>
                  <span>${ach}</span>
                </li>
              `).join('')}
            </ul>
          </div>

        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

function renderSchedule(filterShift = 'all') {
  const container = document.getElementById('schedule-container');
  if (!container || !window.BORU_DATA || !window.BORU_DATA.schedules) return;

  const schedules = window.BORU_DATA.schedules;
  let html = '';

  schedules.forEach(daySchedule => {
    const filteredPeriods = filterShift === 'all' 
      ? daySchedule.periods 
      : daySchedule.periods.filter(p => p.shift === filterShift);

    if (filteredPeriods.length === 0) return;

    html += `
      <div class="rounded-xl bg-zinc-900/90 border border-zinc-800 p-6 flex flex-col justify-between card-combat">
        <div>
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <h4 class="font-heading text-xl font-bold text-white uppercase flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-red-500"></i>
              ${daySchedule.day}
            </h4>
            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              ${filteredPeriods.length} aulas
            </span>
          </div>

          <div class="space-y-3">
            ${filteredPeriods.map(period => `
              <div class="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      ${period.time}
                    </span>
                    <span class="text-xs text-zinc-400">Prof. ${period.instructor}</span>
                  </div>
                  <div class="text-sm font-bold text-white mt-1">
                    ${period.modality}
                  </div>
                  <div class="text-[11px] text-zinc-400">
                    Nível: ${period.level}
                  </div>
                </div>

                <button onclick="openBookingModal('${period.modality}')" title="Agendar aula neste horário" class="p-2 rounded bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white transition">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  });

  if (html === '') {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-zinc-500">
        Nenhum horário encontrado para o turno selecionado.
      </div>
    `;
  } else {
    container.innerHTML = html;
  }

  lucide.createIcons();
}

function initScheduleFilters() {
  const buttons = document.querySelectorAll('.schedule-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('bg-red-600', 'text-white');
        b.classList.add('bg-zinc-900', 'text-zinc-300');
      });
      btn.classList.add('bg-red-600', 'text-white');
      btn.classList.remove('bg-zinc-900', 'text-zinc-300');

      const filter = btn.getAttribute('data-filter');
      renderSchedule(filter);
    });
  });
}

function renderFAQ() {
  const container = document.getElementById('faq-accordion-container');
  if (!container || !window.BORU_DATA || !window.BORU_DATA.faq) return;

  const faqs = window.BORU_DATA.faq;
  let html = '';

  faqs.forEach((item, index) => {
    html += `
      <div class="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition">
        <button 
          onclick="toggleFAQ(${index})" 
          class="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-red-400 transition focus:outline-none">
          <span>${item.question}</span>
          <i data-lucide="chevron-down" id="faq-icon-${index}" class="w-4 h-4 text-zinc-400 transition-transform duration-300"></i>
        </button>
        <div id="faq-answer-${index}" class="hidden px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
          ${item.answer}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function toggleFAQ(index) {
  const answer = document.getElementById(`faq-answer-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);

  if (answer && icon) {
    const isHidden = answer.classList.contains('hidden');
    if (isHidden) {
      answer.classList.remove('hidden');
      icon.classList.add('rotate-180', 'text-red-500');
    } else {
      answer.classList.add('hidden');
      icon.classList.remove('rotate-180', 'text-red-500');
    }
  }
}

function openBookingModal(modalityName = '') {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  if (modalityName) {
    const select = document.getElementById('book-modality');
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase().includes(modalityName.toLowerCase()) ||
            modalityName.toLowerCase().includes(select.options[i].value.toLowerCase())) {
          select.selectedIndex = i;
          break;
        }
      }
    }
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleBookingSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('book-name').value.trim();
  const phone = document.getElementById('book-phone').value.trim();
  const modality = document.getElementById('book-modality').value;
  const shift = document.getElementById('book-shift').value;
  const experience = document.getElementById('book-experience').value;

  if (!name || !phone) {
    showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  const textMessage = `*AGENDAMENTO DE AULA EXPERIMENTAL - CT BORÜ*%0A%0A` +
    `🥋 *Nome:* ${encodeURIComponent(name)}%0A` +
    `📱 *WhatsApp:* ${encodeURIComponent(phone)}%0A` +
    `🥊 *Modalidade:* ${encodeURIComponent(modality)}%0A` +
    `⏰ *Turno Escolhido:* ${encodeURIComponent(shift)}%0A` +
    `📋 *Experiência:* ${encodeURIComponent(experience)}%0A%0A` +
    `Olá equipe BORÜ! Vi a apresentação do CT no site e gostaria de confirmar minha aula experimental gratuita.`;

  const whatsappNumber = '556992384491';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${textMessage}`;

  showToast('Redirecionando para a recepção do CT BORÜ...', 'success');

  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
    closeBookingModal();
    document.getElementById('booking-form').reset();
  }, 1000);
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="text-xs font-semibold">${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookingModal();
  }
});

// js/app.js - Interações da Landing Page do BORÜ Centro de Combate (Modelo Portfólio do CT)

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  renderFacilities();
  renderInstructorsPortfolio();
  renderSchedule('all');
  initScheduleFilters();
  renderFAQ();
  initPartnersShowcase();
  initSpotlightCards();
  initTiltEffect();
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
});

function initHeaderScroll() {
  const header = document.getElementById('main-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('bg-[#0B0B0C]', 'shadow-xl', 'border-zinc-800');
      header.classList.remove('bg-[#0B0B0C]/90');
    } else {
      header.classList.remove('bg-[#0B0B0C]', 'shadow-xl');
      header.classList.add('bg-[#0B0B0C]/90');
    }
  }, { passive: true });
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
      <div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 transition duration-300 card-combat spotlight-card tilt-card space-y-4">
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
      <div class="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row gap-6 card-combat group shadow-xl shrink-0 w-[300px] sm:w-[420px] md:w-[480px] lg:w-[520px] spotlight-card tilt-card">
        
        <div class="w-full md:w-48 flex-shrink-0">
          <div class="relative h-60 md:h-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
            <img loading="lazy" decoding="async" src="${coach.image}" alt="${coach.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
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

// ==========================================
// SPOTLIGHT SEGUIDOR DE CURSOR NOS CARDS (BORÜ RED)
// ==========================================
function initSpotlightCards() {
  document.querySelectorAll('.spotlight-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// ==========================================
// TILT 3D PARALLAX SUAVE NOS CARDS (GPU 60 FPS)
// ==========================================
function initTiltEffect() {
  const elements = document.querySelectorAll('.tilt-card');

  elements.forEach(el => {
    let ticking = false;

    el.addEventListener('mousemove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;

          el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
          ticking = false;
        });
        ticking = true;
      }
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

// ==========================================
// CARROSSEL HORIZONTAL DINÂMICO DE PROFESSORES (AUTO-PLAY 5S + HOVER PAUSE)
// ==========================================
function initInstructorsCarousel() {
  const container = document.getElementById('instructors-portfolio-grid');
  const prevBtn = document.getElementById('prof-carousel-prev');
  const nextBtn = document.getElementById('prof-carousel-next');

  if (!container) return;

  let autoplayTimer = null;
  const slideStep = () => {
    const card = container.querySelector('.shrink-0');
    return card ? card.offsetWidth + 24 : 480;
  };

  const scrollNext = () => {
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (container.scrollLeft >= maxScroll - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: slideStep(), behavior: 'smooth' });
    }
  };

  const scrollPrev = () => {
    if (container.scrollLeft <= 10) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -slideStep(), behavior: 'smooth' });
    }
  };

  if (nextBtn) nextBtn.addEventListener('click', () => { scrollNext(); restartAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { scrollPrev(); restartAutoplay(); });

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(scrollNext, 5000);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(() => {
    if (typeof initInstructorsCarousel === 'function') initInstructorsCarousel();
    if (typeof initPartnersShowcase === 'function') initPartnersShowcase();
  }, 100);
}

// ==========================================
// VITRINE DE PARCEIROS, PATROCINADORES & GOOGLE ADS NA HOME PRINCIPAL
// ==========================================
let boruPartnersState = {
  initialized: false,
  partners: [],
  adsConfig: null,
  activeFilter: 'TODOS',
  carouselIndex: 0,
  carouselTimer: null
};

const FALLBACK_HOME_PARTNERS = [
  {
    id: 'parceiro-wellhub-oficial',
    nome: 'Wellhub (Gympass) & TotalPass',
    categoria: 'PARCEIRO_OFICIAL',
    descricao: 'Convênio corporativo oficial aceito no BORÜ Centro de Combate. Faça check-in diário e treine Muay Thai em estrutura 100% climatizada.',
    beneficioAlunos: 'Check-in liberado em todos os horários compatíveis com seu plano corporativo',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '/ct-boru-estrutura.jpg',
    linkDestino: 'https://wa.me/556992384491?text=Ol%C3%A1!%20Gostaria%20de%20saber%20como%20treinar%20no%20CT%20BOR%C3%9C%20usando%20Wellhub%20ou%20TotalPass.',
    tipoLink: 'WHATSAPP',
    contatoTexto: 'Atendimento Recepção CT Borü',
    destaqueHome: true
  },
  {
    id: 'patrocinador-felipe-boru',
    nome: 'Espaço Patrocinador Oficial — Mestre Felipe Borü',
    categoria: 'PATROCINADOR_FELIPE',
    descricao: 'Associe sua marca à preparação de alto rendimento, campeonatos e eventos oficiais do Mestre Felipe Borü em Porto Velho - RO.',
    beneficioAlunos: 'Visibilidade no tatame, uniformes de competição e vitrine digital do CT',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '/equipe-boru-hero.jpg',
    linkDestino: 'https://wa.me/556992384491?text=Ol%C3%A1!%20Tenho%20interesse%20em%20ser%20Patrocinador%20do%20Mestre%20Felipe%20Bor%C3%BC%20e%20do%20CT.',
    tipoLink: 'WHATSAPP',
    contatoTexto: '(69) 99238-4491',
    destaqueHome: true
  },
  {
    id: 'empreendimento-aluno-vitrine',
    nome: 'Vitrine Empreendimento de Aluno Borü',
    categoria: 'EMPREENDIMENTO_ALUNO',
    descricao: 'É aluno do CT BORÜ e tem uma empresa, clínica, loja ou prestação de serviço? Divulgue seu negócio para toda a nossa comunidade de guerreiros!',
    beneficioAlunos: 'Condição especial de divulgação para alunos ativos do CT Borü',
    alunoVinculadoNome: 'Comunidade de Alunos Nak Muay Borü',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '/galeria-mestre-aluno.jpg',
    linkDestino: 'https://wa.me/556992384491?text=Ol%C3%A1!%20Sou%20aluno%20do%20CT%20BOR%C3%9C%20e%20quero%20divulgar%20meu%20empreendimento%20na%20Vitrine%20de%20Parceiros.',
    tipoLink: 'WHATSAPP',
    contatoTexto: '@borucentrodecombate',
    destaqueHome: true
  }
];

function getPartnerCategoryBadge(cat) {
  if (cat === 'EMPREENDIMENTO_ALUNO') {
    return { label: '🥋 Empreendimento de Aluno', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
  }
  if (cat === 'PATROCINADOR_FELIPE') {
    return { label: '🏆 Patrocinador do Felipe', cls: 'bg-red-600/20 text-red-300 border-red-500/40' };
  }
  if (cat === 'APOIADOR_EVENTO') {
    return { label: '⚡ Apoiador / Evento', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' };
  }
  return { label: '🤝 Parceiro Oficial', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
}

function trackHomePartnerClick(partnerId) {
  const apiBase = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://boru-api-fhdn.onrender.com/api';
  fetch(`${apiBase}/parceiros/${partnerId}/clique`, { method: 'POST' }).catch(() => {});
}

function renderHomePartnersCarousel() {
  const bannerEl = document.getElementById('home-partners-carousel-banner');
  if (!bannerEl) return;

  const list = boruPartnersState.partners.filter(p => p.destaqueHome !== false);
  const pool = list.length > 0 ? list : boruPartnersState.partners;
  if (!pool || pool.length === 0) {
    bannerEl.innerHTML = '';
    return;
  }

  const current = pool[boruPartnersState.carouselIndex % pool.length];
  const badge = getPartnerCategoryBadge(current.categoria);
  const ctaText = current.tipoLink === 'WHATSAPP'
    ? '💬 Chamar no WhatsApp'
    : current.tipoLink === 'INSTAGRAM'
    ? '📸 Ver no Instagram'
    : '🌐 Acessar Site';

  bannerEl.innerHTML = `
    <div class="px-5 sm:px-7 py-3 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        <span class="text-xs font-black uppercase tracking-wider text-white">Vitrine Rotativa de Parceiros & Patrocinadores</span>
      </div>
      <div class="flex items-center gap-1.5">
        ${pool.map((item, idx) => `
          <button type="button" onclick="setHomePartnerSlide(${idx})" class="h-2 rounded-full transition-all ${idx === (boruPartnersState.carouselIndex % pool.length) ? 'w-7 bg-red-500' : 'w-2 bg-zinc-700 hover:bg-zinc-500'}" aria-label="Slide ${idx + 1}"></button>
        `).join('')}
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
      <div class="lg:col-span-5">
        <div class="relative h-52 sm:h-60 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl">
          <img src="${current.bannerUrl || current.logoUrl || '/logo-boru.jpg'}" alt="${current.nome}" onerror="this.onerror=null;this.src='/logo-boru.jpg'" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center gap-3">
            <img src="${current.logoUrl || '/logo-boru.jpg'}" alt="${current.nome}" onerror="this.onerror=null;this.src='/logo-boru.jpg'" class="w-12 h-12 rounded-xl object-cover border-2 border-red-500 bg-zinc-900 shrink-0">
            <div class="min-w-0">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badge.cls}">${badge.label}</span>
              ${current.contatoTexto ? `<p class="text-xs text-zinc-300 font-semibold truncate mt-0.5">${current.contatoTexto}</p>` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="lg:col-span-7 space-y-3.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase border ${badge.cls}">${badge.label}</span>
          ${current.alunoVinculadoNome ? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-amber-300 border border-zinc-700">🥋 ${current.alunoVinculadoNome}</span>` : ''}
        </div>
        <h3 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">${current.nome}</h3>
        <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">${current.descricao}</p>
        ${current.beneficioAlunos ? `
          <div class="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-white">
            <strong class="text-red-400 uppercase text-[10px] block">🎁 Benefício / Destaque para Alunos Borü:</strong>
            ${current.beneficioAlunos}
          </div>
        ` : ''}
        <div class="pt-2 flex flex-wrap items-center justify-between gap-3">
          <a href="${current.linkDestino || '#'}" target="_blank" rel="noreferrer" onclick="trackHomePartnerClick('${current.id}')" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition">
            <span>${ctaText}</span>
            <span>→</span>
          </a>
          <div class="flex items-center gap-2">
            <button type="button" onclick="stepHomePartnerSlide(-1)" class="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold">←</button>
            <button type="button" onclick="stepHomePartnerSlide(1)" class="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold">→</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setHomePartnerSlide(idx) {
  boruPartnersState.carouselIndex = idx;
  renderHomePartnersCarousel();
}

function stepHomePartnerSlide(delta) {
  const list = boruPartnersState.partners.filter(p => p.destaqueHome !== false);
  const pool = list.length > 0 ? list : boruPartnersState.partners;
  if (!pool.length) return;
  boruPartnersState.carouselIndex = (boruPartnersState.carouselIndex + delta + pool.length) % pool.length;
  renderHomePartnersCarousel();
}

function renderHomePartnersGrid() {
  const gridEl = document.getElementById('home-partners-grid');
  if (!gridEl) return;

  const filtered = boruPartnersState.activeFilter === 'TODOS'
    ? boruPartnersState.partners
    : boruPartnersState.partners.filter(p => p.categoria === boruPartnersState.activeFilter);

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-full py-10 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-zinc-400 text-xs">
        Nenhum parceiro cadastrado nesta categoria no momento.
      </div>
    `;
    return;
  }

  gridEl.innerHTML = filtered.map(p => {
    const badge = getPartnerCategoryBadge(p.categoria);
    const ctaText = p.tipoLink === 'WHATSAPP'
      ? '💬 Falar no WhatsApp'
      : p.tipoLink === 'INSTAGRAM'
      ? '📸 Abrir Instagram'
      : '🌐 Visitar Site';

    return `
      <div class="rounded-2xl bg-[#141416] border border-zinc-800 hover:border-red-500/70 transition duration-300 overflow-hidden flex flex-col justify-between shadow-xl group">
        <div>
          <div class="relative h-40 bg-zinc-950 overflow-hidden">
            <img loading="lazy" src="${p.bannerUrl || p.logoUrl || '/logo-boru.jpg'}" alt="${p.nome}" onerror="this.onerror=null;this.src='/logo-boru.jpg'" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-[#141416] via-black/30 to-transparent"></div>
            <span class="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase border backdrop-blur-md ${badge.cls}">
              ${badge.label}
            </span>
          </div>
          <div class="p-5 pt-2 space-y-2.5">
            <div class="flex items-center gap-3">
              <img loading="lazy" src="${p.logoUrl || '/logo-boru.jpg'}" alt="${p.nome}" onerror="this.onerror=null;this.src='/logo-boru.jpg'" class="w-11 h-11 rounded-xl object-cover border border-zinc-700 bg-zinc-900 shrink-0">
              <div class="min-w-0">
                <h4 class="text-base font-black text-white uppercase truncate">${p.nome}</h4>
                ${p.alunoVinculadoNome ? `<p class="text-[11px] text-amber-400 font-semibold truncate">🥋 ${p.alunoVinculadoNome}</p>` : ''}
                ${p.contatoTexto ? `<p class="text-[11px] text-zinc-400 truncate">${p.contatoTexto}</p>` : ''}
              </div>
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed">${p.descricao}</p>
            ${p.beneficioAlunos ? `
              <div class="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-[11px] text-red-200">
                <strong class="text-red-400 uppercase text-[9px] block">🎁 Benefício Alunos Borü:</strong>
                ${p.beneficioAlunos}
              </div>
            ` : ''}
          </div>
        </div>
        <div class="p-5 pt-0">
          <a href="${p.linkDestino || '#'}" target="_blank" rel="noreferrer" onclick="trackHomePartnerClick('${p.id}')" class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition">
            <span>${ctaText}</span>
            <span>→</span>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderHomeGoogleAdSlot(adsConfig) {
  const container = document.getElementById('home-google-ads-container');
  if (!container || !adsConfig) return;

  const clientId = (adsConfig.clientId || '').trim();
  const slotId = (adsConfig.slots && adsConfig.slots.homeHorizontalSlot || '').trim();
  const isReady = Boolean(adsConfig.enabled && clientId && slotId);

  if (!isReady && !adsConfig.showPlaceholderWhenEmpty) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');

  if (isReady) {
    if (!document.getElementById('google-adsense-script-boru')) {
      const s = document.createElement('script');
      s.id = 'google-adsense-script-boru';
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }
    container.innerHTML = `
      <div class="rounded-2xl bg-[#141416] border border-zinc-800 p-4">
        <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          <span>Publicidade / Espaço Patrocinado</span>
          <span>BORÜ ADS</span>
        </div>
        <ins class="adsbygoogle" style="display:block" data-ad-client="${clientId}" data-ad-slot="${slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>
      </div>
    `;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_e) {}
  } else {
    container.innerHTML = `
      <div class="rounded-2xl bg-[#141416] border border-dashed border-zinc-700 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">ESPAÇO PUBLICITÁRIO CT BORÜ</span>
          <h4 class="text-sm font-black text-white uppercase">Sua Marca em Destaque para Mais de 500 Alunos em Porto Velho</h4>
          <p class="text-xs text-zinc-400">Anuncie seu negócio ou patrocine o Mestre Felipe Borü com banner rotativo na página principal.</p>
        </div>
        <a href="https://wa.me/556992384491?text=Ol%C3%A1!%20Quero%20anunciar%20minha%20empresa%20no%20site%20do%20CT%20BOR%C3%9C." target="_blank" class="shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition">
          Anunciar Aqui →
        </a>
      </div>
    `;
  }
}

function initPartnersShowcase() {
  if (boruPartnersState.initialized) return;
  const section = document.getElementById('parceiros');
  if (!section) return;
  boruPartnersState.initialized = true;

  // Inicializa imediatamente com os parceiros padrão e depois sincroniza com a API em tempo real
  boruPartnersState.partners = FALLBACK_HOME_PARTNERS;
  renderHomePartnersCarousel();
  renderHomePartnersGrid();

  // Botões de filtro por categoria
  document.querySelectorAll('.partner-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.partner-cat-btn').forEach(b => {
        b.classList.remove('bg-red-600', 'text-white', 'border-red-500');
        b.classList.add('bg-zinc-900', 'text-zinc-300', 'border-zinc-800');
      });
      btn.classList.add('bg-red-600', 'text-white', 'border-red-500');
      btn.classList.remove('bg-zinc-900', 'text-zinc-300', 'border-zinc-800');
      boruPartnersState.activeFilter = btn.getAttribute('data-partner-cat') || 'TODOS';
      renderHomePartnersGrid();
    });
  });

  // Rotação automática do carrossel a cada 5s
  boruPartnersState.carouselTimer = setInterval(() => {
    stepHomePartnerSlide(1);
  }, 5500);

  const apiBase = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://boru-api-fhdn.onrender.com/api';

  fetch(`${apiBase}/parceiros`)
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.parceiros) && data.parceiros.length > 0) {
        boruPartnersState.partners = data.parceiros;
        boruPartnersState.carouselIndex = 0;
        renderHomePartnersCarousel();
        renderHomePartnersGrid();
      }
      if (data && data.adsConfig) {
        boruPartnersState.adsConfig = data.adsConfig;
        renderHomeGoogleAdSlot(data.adsConfig);
      }
    })
    .catch(() => {});
}


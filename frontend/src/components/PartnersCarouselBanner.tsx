import React, { useState, useEffect } from 'react';
import { publicApi } from '../services/api';

export interface PartnerPublicItem {
  id: string;
  nome: string;
  categoria: 'EMPREENDIMENTO_ALUNO' | 'PATROCINADOR_FELIPE' | 'PARCEIRO_OFICIAL' | 'APOIADOR_EVENTO';
  descricao: string;
  beneficioAlunos?: string;
  alunoVinculadoNome?: string;
  logoUrl: string;
  bannerUrl?: string;
  linkDestino: string;
  tipoLink: 'INSTAGRAM' | 'WHATSAPP' | 'SITE';
  contatoTexto?: string;
  destaqueHome: boolean;
  ordem: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  ativo: boolean;
  cliquesCount?: number;
}

export const PARTNER_CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string; icon: string }
> = {
  EMPREENDIMENTO_ALUNO: {
    label: 'Empreendimento de Aluno',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    icon: '🥋',
  },
  PATROCINADOR_FELIPE: {
    label: 'Patrocinador do Felipe',
    badgeClass: 'bg-red-600/20 text-red-300 border-red-500/40',
    icon: '🏆',
  },
  PARCEIRO_OFICIAL: {
    label: 'Parceiro Oficial',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    icon: '🤝',
  },
  APOIADOR_EVENTO: {
    label: 'Apoiador / Evento',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    icon: '⚡',
  },
};

interface PartnersCarouselBannerProps {
  partners: PartnerPublicItem[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const PartnersCarouselBanner: React.FC<PartnersCarouselBannerProps> = ({
  partners,
  title = 'Vitrine Rotativa de Parceiros & Patrocinadores',
  subtitle = 'Empresas parceiras, patrocinadores do Mestre Felipe Borü e empreendimentos dos nossos alunos',
  compact = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!partners || partners.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % partners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [partners, paused]);

  if (!partners || partners.length === 0) return null;

  const current = partners[activeIndex % partners.length];
  const catMeta = PARTNER_CATEGORY_META[current.categoria] || PARTNER_CATEGORY_META.PARCEIRO_OFICIAL;

  const handlePartnerClick = (id: string) => {
    publicApi.trackPartnerClick(id).catch(() => {});
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#141418] via-[#111114] to-[#1A1214] border border-zinc-800/90 shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Barra Superior */}
      <div className="px-5 sm:px-7 py-3.5 bg-zinc-950/70 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-white">{title}</span>
          <span className="hidden md:inline text-xs text-zinc-500">— {subtitle}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {partners.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex % partners.length
                  ? 'w-7 bg-red-500'
                  : 'w-2 bg-zinc-700 hover:bg-zinc-500'
              }`}
              aria-label={`Ver parceiro ${p.nome}`}
            />
          ))}
        </div>
      </div>

      {/* Card Principal do Carrossel */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-12' : 'lg:grid-cols-12'} gap-6 p-6 sm:p-8 items-center`}>
        {/* Imagem / Banner ou Logo */}
        <div className={`${compact ? 'md:col-span-4' : 'lg:col-span-5'} relative`}>
          <div className="relative h-52 sm:h-60 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-center">
            <img
              src={current.bannerUrl || current.logoUrl || '/logo-boru.jpg'}
              alt={current.nome}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-boru.jpg';
              }}
              className="w-full h-full object-cover transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
              <img
                src={current.logoUrl || '/logo-boru.jpg'}
                alt={current.nome}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-boru.jpg';
                }}
                className="w-12 h-12 rounded-xl object-cover border-2 border-red-500 bg-zinc-900 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${catMeta.badgeClass}`}
                >
                  <span>{catMeta.icon}</span>
                  <span>{catMeta.label}</span>
                </span>
                {current.contatoTexto && (
                  <p className="text-xs text-zinc-300 font-semibold truncate mt-0.5">
                    {current.contatoTexto}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo e CTA */}
        <div className={`${compact ? 'md:col-span-8' : 'lg:col-span-7'} space-y-4`}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border ${catMeta.badgeClass}`}
            >
              <span>{catMeta.icon}</span>
              <span>{catMeta.label}</span>
            </span>
            {current.alunoVinculadoNome && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800/90 text-zinc-200 border border-zinc-700">
                🥋 {current.alunoVinculadoNome}
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {current.nome}
          </h3>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {current.descricao}
          </p>

          {current.beneficioAlunos && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block">
                  Benefício / Destaque para a Comunidade Borü
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {current.beneficioAlunos}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <a
              href={current.linkDestino || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={() => handlePartnerClick(current.id)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-950/50 transition"
            >
              <span>
                {current.tipoLink === 'WHATSAPP'
                  ? '💬 Chamar no WhatsApp'
                  : current.tipoLink === 'INSTAGRAM'
                  ? '📸 Ver no Instagram'
                  : '🌐 Acessar Site Oficial'}
              </span>
              <span>→</span>
            </a>

            {partners.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev - 1 + partners.length) % partners.length)
                  }
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition"
                  title="Anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % partners.length)}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition"
                  title="Próximo"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

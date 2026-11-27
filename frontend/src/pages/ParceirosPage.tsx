import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import {
  PartnersCarouselBanner,
  PARTNER_CATEGORY_META,
  PartnerPublicItem,
} from '../components/PartnersCarouselBanner';
import { GoogleAdSlot } from '../components/GoogleAdSlot';

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<PartnerPublicItem[]>([]);
  const [adsConfig, setAdsConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    publicApi
      .getPartners()
      .then((res) => {
        setParceiros(res.data?.parceiros || []);
        setAdsConfig(res.data?.adsConfig || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTrackClick = (id: string) => {
    publicApi.trackPartnerClick(id).catch(() => {});
  };

  const parceirosFiltrados = parceiros.filter((p) => {
    if (categoriaFiltro !== 'TODOS' && p.categoria !== categoriaFiltro) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.descricao || '').toLowerCase().includes(q) ||
        (p.alunoVinculadoNome || '').toLowerCase().includes(q) ||
        (p.beneficioAlunos || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const destaquesCarrossel = parceiros.filter((p) => p.destaqueHome);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 pb-20">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-[#0B0B0C]/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo-boru.jpg"
              alt="BORÜ"
              className="w-11 h-11 rounded-full border-2 border-red-600 object-cover"
            />
            <div>
              <span className="font-black text-xl tracking-widest text-white block leading-none">
                BORÜ
              </span>
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">
                Parceiros & Patrocinadores
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition"
            >
              ← Voltar ao Site Principal
            </Link>
            <Link
              to="/portal"
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white uppercase tracking-wider transition"
            >
              Área do Aluno
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        {/* HERO DE PARCEIROS */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-800/70 text-red-400 text-xs font-bold uppercase tracking-widest">
            <span>🤝 REDE DE NEGÓCIOS, CONVÊNIOS & PATROCÍNIO OFICIAL CT BORÜ</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Parceiros, Patrocinadores &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-400">
              Empreendimentos de Alunos
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Fortaleça quem apoia o esporte e valorize os negócios dos alunos da nossa família.
            Confira descontos exclusivos, patrocinadores do Mestre Felipe Borü e parceiros oficiais.
          </p>
        </div>

        {/* CARROSSEL ROTATIVO EM DESTAQUE */}
        {destaquesCarrossel.length > 0 && (
          <PartnersCarouselBanner partners={destaquesCarrossel} />
        )}

        {/* ESPAÇO GOOGLE ADSENSE ESTRATÉGICO */}
        {adsConfig && (
          <GoogleAdSlot
            enabled={adsConfig.enabled}
            clientId={adsConfig.clientId}
            slotId={adsConfig.slots?.parceirosPageSlot || adsConfig.slots?.homeHorizontalSlot}
            showPlaceholder={adsConfig.showPlaceholderWhenEmpty}
          />
        )}

        {/* FILTROS POR CATEGORIA & BUSCA */}
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'TODOS', label: '🌐 Todos', count: parceiros.length },
              {
                id: 'EMPREENDIMENTO_ALUNO',
                label: '🥋 Empreendimentos de Alunos',
                count: parceiros.filter((p) => p.categoria === 'EMPREENDIMENTO_ALUNO').length,
              },
              {
                id: 'PATROCINADOR_FELIPE',
                label: '🏆 Patrocinadores do Felipe',
                count: parceiros.filter((p) => p.categoria === 'PATROCINADOR_FELIPE').length,
              },
              {
                id: 'PARCEIRO_OFICIAL',
                label: '🤝 Parceiros Oficiais',
                count: parceiros.filter((p) => p.categoria === 'PARCEIRO_OFICIAL').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoriaFiltro(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  categoriaFiltro === tab.id
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/50'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar empresa, serviço ou aluno..."
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none md:w-72"
          />
        </div>

        {/* GRADE DE CARDS DOS PARCEIROS */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-sm">
            Carregando vitrine de parceiros...
          </div>
        ) : parceirosFiltrados.length === 0 ? (
          <div className="py-16 text-center bg-[#141416] border border-zinc-800 rounded-2xl p-8 space-y-3">
            <p className="text-base font-bold text-white">
              Nenhum parceiro encontrado nesta categoria.
            </p>
            <p className="text-xs text-zinc-400">
              Experimente selecionar "Todos" ou entre em contato para divulgar sua marca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parceirosFiltrados.map((p) => {
              const meta =
                PARTNER_CATEGORY_META[p.categoria] || PARTNER_CATEGORY_META.PARCEIRO_OFICIAL;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-[#141416] border border-zinc-800 hover:border-red-500/70 transition duration-300 overflow-hidden flex flex-col justify-between shadow-xl group"
                >
                  <div>
                    {/* Topo / Banner */}
                    <div className="relative h-44 bg-zinc-950 overflow-hidden">
                      <img
                        src={p.bannerUrl || p.logoUrl || '/logo-boru.jpg'}
                        alt={p.nome}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo-boru.jpg';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-black/30 to-transparent" />
                      <span
                        className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border backdrop-blur-md ${meta.badgeClass}`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                    </div>

                    {/* Corpo */}
                    <div className="p-6 pt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.logoUrl || '/logo-boru.jpg'}
                          alt={p.nome}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo-boru.jpg';
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-700 bg-zinc-900 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-white uppercase leading-snug truncate">
                            {p.nome}
                          </h3>
                          {p.alunoVinculadoNome && (
                            <p className="text-[11px] text-amber-400 font-semibold truncate">
                              🥋 {p.alunoVinculadoNome}
                            </p>
                          )}
                          {p.contatoTexto && (
                            <p className="text-[11px] text-zinc-400 truncate">{p.contatoTexto}</p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {p.descricao}
                      </p>

                      {p.beneficioAlunos && (
                        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-200">
                          <strong className="text-red-400 uppercase text-[10px] block">
                            🎁 Benefício Alunos Borü:
                          </strong>
                          {p.beneficioAlunos}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <a
                      href={p.linkDestino || '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleTrackClick(p.id)}
                      className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md shadow-red-950/40"
                    >
                      <span>
                        {p.tipoLink === 'WHATSAPP'
                          ? '💬 Falar no WhatsApp'
                          : p.tipoLink === 'INSTAGRAM'
                          ? '📸 Abrir Instagram'
                          : '🌐 Visitar Site'}
                      </span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA PARA NOVOS ANUNCIANTES E ALUNOS EMPREENDEDORES */}
        <div className="rounded-3xl bg-gradient-to-r from-red-950/60 via-[#141416] to-amber-950/30 border border-red-500/30 p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              DIVULGUE SUA MARCA NO CT BORÜ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">
              É aluno empreendedor ou quer patrocinar o Mestre Felipe Borü?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Sua empresa em destaque no site oficial, no carrossel da página principal e no portal
              de mais de 500 alunos ativos em Porto Velho - RO.
            </p>
          </div>
          <a
            href="https://wa.me/556992384491?text=Ol%C3%A1!%20Quero%20divulgar%20minha%20empresa%20na%20aba%20de%20Parceiros%20e%20Patrocinadores%20do%20CT%20BOR%C3%9C."
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-7 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl transition"
          >
            💬 Anunciar Minha Empresa no WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}

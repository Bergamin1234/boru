import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { FileUploadInput } from './FileUploadInput';
import { PARTNER_CATEGORY_META } from './PartnersCarouselBanner';
import { GoogleAdSlot } from './GoogleAdSlot';

export const AdminPartnersTab: React.FC = () => {
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [adsConfig, setAdsConfig] = useState<any>({
    enabled: false,
    clientId: '',
    slots: {
      homeHorizontalSlot: '',
      parceirosPageSlot: '',
      portalAlunoSlot: '',
    },
    showPlaceholderWhenEmpty: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingAds, setSavingAds] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');

  const emptyForm = {
    nome: '',
    categoria: 'EMPREENDIMENTO_ALUNO',
    descricao: '',
    beneficioAlunos: '',
    alunoVinculadoNome: '',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '',
    linkDestino: '',
    tipoLink: 'INSTAGRAM',
    contatoTexto: '',
    destaqueHome: true,
    ordem: 1,
    dataInicio: '',
    dataFim: '',
    ativo: true,
  };
  const [form, setForm] = useState<any>(emptyForm);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminPartners();
      setParceiros(res.data?.parceiros || []);
      if (res.data?.adsConfig) {
        setAdsConfig(res.data.adsConfig);
      }
    } catch (e) {
      console.error('Erro ao carregar parceiros:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirNovo = () => {
    setEditingPartner(null);
    setForm({
      ...emptyForm,
      ordem: parceiros.length + 1,
    });
    setShowModal(true);
  };

  const abrirEdicao = (item: any) => {
    setEditingPartner(item);
    setForm({
      nome: item.nome || '',
      categoria: item.categoria || 'PARCEIRO_OFICIAL',
      descricao: item.descricao || '',
      beneficioAlunos: item.beneficioAlunos || '',
      alunoVinculadoNome: item.alunoVinculadoNome || '',
      logoUrl: item.logoUrl || '/logo-boru.jpg',
      bannerUrl: item.bannerUrl || '',
      linkDestino: item.linkDestino || '',
      tipoLink: item.tipoLink || 'INSTAGRAM',
      contatoTexto: item.contatoTexto || '',
      destaqueHome: item.destaqueHome ?? true,
      ordem: item.ordem ?? 1,
      dataInicio: item.dataInicio ? String(item.dataInicio).split('T')[0] : '',
      dataFim: item.dataFim ? String(item.dataFim).split('T')[0] : '',
      ativo: item.ativo ?? true,
    });
    setShowModal(true);
  };

  const salvarParceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        dataInicio: form.dataInicio || null,
        dataFim: form.dataFim || null,
      };
      if (editingPartner) {
        await adminApi.updatePartner(editingPartner.id, payload);
      } else {
        await adminApi.createPartner(payload);
      }
      setShowModal(false);
      await carregarDados();
    } catch (err: any) {
      alert(err?.response?.data?.erro || 'Erro ao salvar parceiro.');
    }
  };

  const alternarAtivo = async (item: any) => {
    try {
      await adminApi.updatePartner(item.id, { ativo: !item.ativo });
      await carregarDados();
    } catch (_e) {
      alert('Erro ao alterar status.');
    }
  };

  const alterarOrdem = async (item: any, delta: number) => {
    try {
      const novaOrdem = Math.max(1, (Number(item.ordem) || 1) + delta);
      await adminApi.updatePartner(item.id, { ordem: novaOrdem });
      await carregarDados();
    } catch (_e) {}
  };

  const excluirParceiro = async (item: any) => {
    if (!window.confirm(`Deseja realmente remover o parceiro "${item.nome}"?`)) return;
    try {
      await adminApi.deletePartner(item.id);
      await carregarDados();
    } catch (_e) {
      alert('Erro ao remover parceiro.');
    }
  };

  const salvarConfigAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAds(true);
    try {
      const res = await adminApi.saveGoogleAdsConfig(adsConfig);
      if (res.data?.adsConfig) setAdsConfig(res.data.adsConfig);
      alert('Configurações do Google AdSense salvas com sucesso!');
    } catch (_e) {
      alert('Erro ao salvar configurações do Google Ads.');
    } finally {
      setSavingAds(false);
    }
  };

  const getVigenciaBadge = (p: any) => {
    if (!p.ativo) {
      return { text: 'Pausado / Inativo', cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
    const today = new Date().toISOString().split('T')[0];
    if (p.dataInicio && String(p.dataInicio).split('T')[0] > today) {
      return { text: 'Agendado', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
    }
    if (p.dataFim && String(p.dataFim).split('T')[0] < today) {
      return { text: 'Expirado', cls: 'bg-red-500/15 text-red-400 border-red-500/40' };
    }
    return { text: 'Em Exibição no Site', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' };
  };

  const listaFiltrada = parceiros.filter(
    (p) => filtroCategoria === 'TODOS' || p.categoria === filtroCategoria
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-red-400">
            MÓDULO DE MONETIZAÇÃO & VITRINE COMERCIAL
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase mt-0.5">
            🤝 Parceiros, Patrocinadores & Google Ads
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gerencie os banners rotativos da página inicial, a página dedicada{' '}
            <a
              href="/parceiros"
              target="_blank"
              rel="noreferrer"
              className="text-red-400 underline font-bold"
            >
              /parceiros
            </a>{' '}
            e os espaços de anúncios do Google AdSense sem mexer no código.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/parceiros"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 transition"
          >
            🌐 Ver Página Pública (/parceiros)
          </a>
          <button
            type="button"
            onClick={abrirNovo}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/50 transition"
          >
            ➕ Novo Parceiro / Patrocinador
          </button>
        </div>
      </div>

      {/* FILTROS RÁPIDOS DE CATEGORIA */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'TODOS', label: `Todos (${parceiros.length})` },
          {
            id: 'EMPREENDIMENTO_ALUNO',
            label: `🥋 Empreendimento de Aluno (${
              parceiros.filter((p) => p.categoria === 'EMPREENDIMENTO_ALUNO').length
            })`,
          },
          {
            id: 'PATROCINADOR_FELIPE',
            label: `🏆 Patrocinador do Felipe (${
              parceiros.filter((p) => p.categoria === 'PATROCINADOR_FELIPE').length
            })`,
          },
          {
            id: 'PARCEIRO_OFICIAL',
            label: `🤝 Parceiro Oficial (${
              parceiros.filter((p) => p.categoria === 'PARCEIRO_OFICIAL').length
            })`,
          },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltroCategoria(f.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              filtroCategoria === f.id
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-[#141416] text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* TABELA / CARDS DE PARCEIROS CADASTRADOS */}
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-400 text-sm">Carregando parceiros...</div>
        ) : listaFiltrada.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-bold text-white">Nenhum parceiro cadastrado neste filtro.</p>
            <button
              type="button"
              onClick={abrirNovo}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              ➕ Cadastrar Primeiro Parceiro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {listaFiltrada.map((item) => {
              const cat =
                PARTNER_CATEGORY_META[item.categoria] || PARTNER_CATEGORY_META.PARCEIRO_OFICIAL;
              const vig = getVigenciaBadge(item);
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-zinc-900/40 transition"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={item.logoUrl || '/logo-boru.jpg'}
                      alt={item.nome}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo-boru.jpg';
                      }}
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-700 bg-zinc-900 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
                          #{item.ordem}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-white uppercase">
                          {item.nome}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${cat.badgeClass}`}
                        >
                          {cat.icon} {cat.label}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${vig.cls}`}
                        >
                          {vig.text}
                        </span>
                        {item.destaqueHome && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                            🔥 Carrossel Home
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2">{item.descricao}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 pt-1">
                        {item.alunoVinculadoNome && (
                          <span className="text-amber-400 font-semibold">
                            🥋 {item.alunoVinculadoNome}
                          </span>
                        )}
                        {item.beneficioAlunos && (
                          <span className="text-emerald-400">🎁 {item.beneficioAlunos}</span>
                        )}
                        <span>
                          📅 Vigência:{' '}
                          {item.dataInicio
                            ? new Date(item.dataInicio).toLocaleDateString('pt-BR')
                            : 'Imediato'}{' '}
                          até{' '}
                          {item.dataFim
                            ? new Date(item.dataFim).toLocaleDateString('pt-BR')
                            : 'Contínuo'}
                        </span>
                        <span>🖱️ {item.cliquesCount || 0} cliques</span>
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES RÁPIDAS */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => alterarOrdem(item, -1)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-bold"
                      title="Subir posição"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => alterarOrdem(item, 1)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-bold"
                      title="Descer posição"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarAtivo(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        item.ativo
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {item.ativo ? '🟢 Ativo' : '⚪ Inativo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(item)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirParceiro(item)}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIGURAÇÃO DO GOOGLE ADSENSE */}
      <form
        onSubmit={salvarConfigAds}
        className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              GOOGLE ADSENSE & MONETIZAÇÃO AUTOMÁTICA
            </span>
            <h3 className="text-lg font-black text-white uppercase">
              Configuração dos Blocos de Anúncio (Google Ads)
            </h3>
            <p className="text-xs text-zinc-400">
              Insira seu ID de editor (`ca-pub-...`) e os IDs de bloco (`data-ad-slot`). Quando
              desativado ou vazio, nenhum bloco em branco polui a navegação do site.
            </p>
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-700">
            <input
              type="checkbox"
              checked={Boolean(adsConfig.enabled)}
              onChange={(e) => setAdsConfig({ ...adsConfig, enabled: e.target.checked })}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-xs font-bold text-white">
              {adsConfig.enabled ? '🟢 Google Ads Ativado' : '⚪ Google Ads Desativado'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
              Google AdSense Client ID
            </label>
            <input
              type="text"
              placeholder="ca-pub-0000000000000000"
              value={adsConfig.clientId || ''}
              onChange={(e) => setAdsConfig({ ...adsConfig, clientId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
              Slot Banner Home Principal
            </label>
            <input
              type="text"
              placeholder="Ex: 1234567890"
              value={adsConfig.slots?.homeHorizontalSlot || ''}
              onChange={(e) =>
                setAdsConfig({
                  ...adsConfig,
                  slots: { ...adsConfig.slots, homeHorizontalSlot: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
              Slot Página /parceiros
            </label>
            <input
              type="text"
              placeholder="Ex: 2345678901"
              value={adsConfig.slots?.parceirosPageSlot || ''}
              onChange={(e) =>
                setAdsConfig({
                  ...adsConfig,
                  slots: { ...adsConfig.slots, parceirosPageSlot: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
              Slot Portal do Aluno
            </label>
            <input
              type="text"
              placeholder="Ex: 3456789012"
              value={adsConfig.slots?.portalAlunoSlot || ''}
              onChange={(e) =>
                setAdsConfig({
                  ...adsConfig,
                  slots: { ...adsConfig.slots, portalAlunoSlot: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(adsConfig.showPlaceholderWhenEmpty)}
              onChange={(e) =>
                setAdsConfig({ ...adsConfig, showPlaceholderWhenEmpty: e.target.checked })
              }
              className="w-4 h-4 accent-red-600"
            />
            <span>
              Exibir banner "Anuncie Aqui no CT Borü" nos espaços de anúncio quando o AdSense não
              estiver preenchido
            </span>
          </label>

          <button
            type="submit"
            disabled={savingAds}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition"
          >
            {savingAds ? 'Salvando...' : '💾 Salvar Configuração Google Ads'}
          </button>
        </div>

        {/* Preview do Bloco Google Ads */}
        <div className="pt-3 border-t border-zinc-800/80">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
            Pré-visualização do Componente GoogleAdSlot:
          </span>
          <GoogleAdSlot
            enabled={adsConfig.enabled}
            clientId={adsConfig.clientId}
            slotId={adsConfig.slots?.homeHorizontalSlot}
            showPlaceholder={true}
          />
        </div>
      </form>

      {/* MODAL CRIAR / EDITAR PARCEIRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase">
                {editingPartner ? '✏️ Editar Parceiro / Patrocinador' : '➕ Novo Parceiro / Patrocinador'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={salvarParceiro} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Nome da Empresa / Parceiro *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Suplementos Force PVH"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Categoria do Anunciante *
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                  >
                    <option value="EMPREENDIMENTO_ALUNO">🥋 Empreendimento de Aluno</option>
                    <option value="PATROCINADOR_FELIPE">🏆 Patrocinador do Felipe</option>
                    <option value="PARCEIRO_OFICIAL">🤝 Parceiro Oficial</option>
                    <option value="APOIADOR_EVENTO">⚡ Apoiador / Evento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Breve Descrição / Propaganda *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descreva os produtos, serviços ou diferencial do parceiro..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Benefício / Cupom para Alunos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.beneficioAlunos}
                    onChange={(e) => setForm({ ...form, beneficioAlunos: e.target.value })}
                    placeholder="Ex: 15% OFF apresentando o Portal Borü"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Nome do Aluno Vinculado (Se for de Aluno)
                  </label>
                  <input
                    type="text"
                    value={form.alunoVinculadoNome}
                    onChange={(e) => setForm({ ...form, alunoVinculadoNome: e.target.value })}
                    placeholder="Ex: Aluno Lucas (Turma 19h)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUploadInput
                  label="Logo / Ícone do Parceiro"
                  value={form.logoUrl}
                  onChange={(url) => setForm({ ...form, logoUrl: url })}
                  folder="parceiros"
                />
                <FileUploadInput
                  label="Banner Horizontal (Opcional p/ Carrossel)"
                  value={form.bannerUrl}
                  onChange={(url) => setForm({ ...form, bannerUrl: url })}
                  folder="parceiros"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Tipo de Link
                  </label>
                  <select
                    value={form.tipoLink}
                    onChange={(e) => setForm({ ...form, tipoLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                  >
                    <option value="INSTAGRAM">📸 Instagram</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="SITE">🌐 Site / Link Externo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    URL / Link de Destino (Instagram, WhatsApp ou Site) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.linkDestino}
                    onChange={(e) => setForm({ ...form, linkDestino: e.target.value })}
                    placeholder="https://instagram.com/... ou https://wa.me/5569..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Texto Contato (@ / Tel)
                  </label>
                  <input
                    type="text"
                    value={form.contatoTexto}
                    onChange={(e) => setForm({ ...form, contatoTexto: e.target.value })}
                    placeholder="@empresa"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Início Exibição
                  </label>
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Fim Exibição
                  </label>
                  <input
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.destaqueHome)}
                    onChange={(e) => setForm({ ...form, destaqueHome: e.target.checked })}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span>Exibir no Carrossel Rotativo da Página Inicial (Home)</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.ativo)}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span>Anúncio Ativo</span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider"
                >
                  💾 Salvar Parceiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';

interface RewardStoreItem {
  id: string;
  nome: string;
  categoria: string;
  custo_points: number;
  estoque: number;
  descricao?: string;
  imagem_url?: string;
  ativo: boolean;
}

interface PointsLedgerItem {
  id: string;
  tipo: string;
  xp_delta: number;
  points_delta: number;
  saldo_pontos_apos: number;
  descricao: string;
  criadoEm: string;
}

interface RewardRedemption {
  id: string;
  codigo_voucher: string;
  status: string;
  pontos_gastos: number;
  criadoEm: string;
  entregueEm?: string;
  entreguePor?: string;
  item: RewardStoreItem;
}

interface GraduationItem {
  id: string;
  modalidade: string;
  graduacao_anterior: string;
  nova_graduacao: string;
  professorNome: string;
  data_graduacao: string;
  notas_exame?: string;
  certificado_url?: string;
}

interface StudentRewardStoreTabProps {
  alunoId: string;
  alunoNome: string;
}

export const StudentRewardStoreTab: React.FC<StudentRewardStoreTabProps> = ({
  alunoId,
  alunoNome
}) => {
  const [subAba, setSubAba] = useState<'loja' | 'meus_resgates' | 'graduacoes' | 'extrato'>('loja');
  const [itensLoja, setItensLoja] = useState<RewardStoreItem[]>([]);
  const [wallet, setWallet] = useState<{
    total_xp: number;
    spendable_points: number;
    prajied?: string;
    extrato: PointsLedgerItem[];
    resgates: RewardRedemption[];
  }>({
    total_xp: 0,
    spendable_points: 0,
    prajied: '',
    extrato: [],
    resgates: []
  });
  const [graduacoes, setGraduacoes] = useState<GraduationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resgatandoId, setResgatandoId] = useState<string | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<RewardStoreItem | null>(null);
  const [voucherSucesso, setVoucherSucesso] = useState<{
    codigo: string;
    itemNome: string;
    mensagem: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [walletRes, itensRes, gradRes] = await Promise.all([
        studentApi.getPointsWallet(alunoId).catch(() => ({ data: null })),
        studentApi.getRewardStoreItems().catch(() => ({ data: [] })),
        studentApi.getGraduations(alunoId).catch(() => ({ data: [] }))
      ]);

      if (walletRes?.data) {
        setWallet({
          total_xp: walletRes.data.total_xp || 0,
          spendable_points: walletRes.data.spendable_points || 0,
          prajied: walletRes.data.prajied || '',
          extrato: walletRes.data.extrato || [],
          resgates: walletRes.data.resgates || []
        });
      }

      if (Array.isArray(itensRes?.data)) {
        setItensLoja(itensRes.data);
      }

      if (Array.isArray(gradRes?.data)) {
        setGraduacoes(gradRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da Loja e Pontos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alunoId) {
      carregarDados();
    }
  }, [alunoId]);

  const handleConfirmarResgate = async () => {
    if (!itemSelecionado) return;
    setResgatandoId(itemSelecionado.id);
    setErroMsg('');

    try {
      const res = await studentApi.redeemStoreItem(alunoId, itemSelecionado.id);
      if (res.data?.resgate) {
        setVoucherSucesso({
          codigo: res.data.resgate.codigo_voucher,
          itemNome: itemSelecionado.nome,
          mensagem: res.data.mensagem || 'Resgate concluído!'
        });
        setItemSelecionado(null);
        await carregarDados();
      }
    } catch (err: any) {
      const msg = err.response?.data?.erro || 'Erro ao resgatar produto. Tente novamente.';
      setErroMsg(msg);
    } finally {
      setResgatandoId(null);
    }
  };

  const copiarVoucher = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA ECONOMIA DE GAMIFICAÇÃO: XP vs POINTS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181B] via-[#141416] to-[#0B0B0C] border border-zinc-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                Economia Marcial CT Borü
              </span>
              {wallet.prajied && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {wallet.prajied}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Loja de Recompensas & Points
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Treine forte para acumular <strong>XP vitalício</strong> de prestígio no tatame e ganhe <strong>Points</strong> para trocar por equipamentos e vestuário oficiais do CT Borü!
            </p>
          </div>

          {/* Cards de Saldo: XP vs Points */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="bg-[#1C1C21]/90 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                  Points Disponíveis
                </span>
                <span className="text-base">🪙</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-300">
                  {wallet.spendable_points.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-bold text-amber-400/80">pts</span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1">Saldo para resgates</span>
            </div>

            <div className="bg-[#1C1C21]/90 border border-red-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-red-400 tracking-wider">
                  XP Vitalício
                </span>
                <span className="text-base">⚡</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">
                  {wallet.total_xp.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-bold text-red-400/80">XP</span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1">Nível permanente (não gasta)</span>
            </div>
          </div>
        </div>

        {/* Sub-navegação interna */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-zinc-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubAba('loja')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              subAba === 'loja'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🛍️</span>
            <span>Vitrine de Recompensas</span>
          </button>

          <button
            onClick={() => setSubAba('meus_resgates')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              subAba === 'meus_resgates'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🎟️</span>
            <span>Meus Vouchers ({wallet.resgates.length})</span>
          </button>

          <button
            onClick={() => setSubAba('graduacoes')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              subAba === 'graduacoes'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🥋</span>
            <span>Histórico de Graduações ({graduacoes.length})</span>
          </button>

          <button
            onClick={() => setSubAba('extrato')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              subAba === 'extrato'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <span>📊</span>
            <span>Extrato de Pontos</span>
          </button>
        </div>
      </div>

      {/* MODAL / FEEDBACK DE RESGATE COM SUCESSO (VOUCHER) */}
      {voucherSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141416] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
              🎉
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Resgate Efetuado!</h3>
              <p className="text-xs text-zinc-400">
                Você resgatou com sucesso: <strong className="text-white">{voucherSucesso.itemNome}</strong>
              </p>
            </div>

            {/* Código do Voucher */}
            <div className="bg-black/60 border-2 border-dashed border-amber-500/50 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Seu Código de Resgate Único
              </span>
              <div className="text-3xl font-mono font-black tracking-widest text-amber-300 select-all">
                {voucherSucesso.codigo}
              </div>
              <p className="text-[11px] text-zinc-400">
                Apresente este código no balcão da recepção do CT Borü para retirar o seu item.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => copiarVoucher(voucherSucesso.codigo)}
                className="flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition flex items-center justify-center gap-2"
              >
                {copiado ? '✓ Código Copiado!' : '📋 Copiar Código'}
              </button>
              <button
                onClick={() => setVoucherSucesso(null)}
                className="py-3 px-5 rounded-xl font-bold text-xs text-zinc-400 hover:text-white bg-zinc-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE RESGATE */}
      {itemSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141416] border border-zinc-700 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Confirmar Troca de Points</span>
              </h3>
              <button
                onClick={() => { setItemSelecionado(null); setErroMsg(''); }}
                className="text-zinc-500 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {erroMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 font-bold">
                {erroMsg}
              </div>
            )}

            <div className="flex gap-4 items-center bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
              <img
                src={itemSelecionado.imagem_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80'}
                alt={itemSelecionado.nome}
                className="w-16 h-16 rounded-xl object-cover border border-zinc-700"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-red-500">
                  {itemSelecionado.categoria}
                </span>
                <h4 className="text-sm font-bold text-white">{itemSelecionado.nome}</h4>
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                  <span>🪙</span>
                  <span>{itemSelecionado.custo_points} Points</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Seu saldo atual:</span>
                <span className="font-bold text-amber-300">{wallet.spendable_points} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Custo do resgate:</span>
                <span className="font-bold text-red-400">- {itemSelecionado.custo_points} pts</span>
              </div>
              <div className="border-t border-zinc-800 pt-1.5 flex justify-between font-black">
                <span className="text-white">Saldo restante:</span>
                <span className="text-emerald-400">
                  {wallet.spendable_points - itemSelecionado.custo_points} pts
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setItemSelecionado(null); setErroMsg(''); }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarResgate}
                disabled={resgatandoId !== null}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 disabled:opacity-50"
              >
                {resgatandoId ? 'Processando...' : 'Confirmar Resgate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEÚDO 1: VITRINE DA LOJA DE POINTS                    */}
      {/* ======================================================== */}
      {subAba === 'loja' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">Catálogo de Recompensas Físicas</h3>
              <p className="text-xs text-zinc-400">
                Itens oficiais entregues em mãos no Centro de Treinamento Borü.
              </p>
            </div>
            <div className="text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
              <span>📍</span> Retirada presencial na recepção
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Carregando itens oficiais...
            </div>
          ) : itensLoja.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm bg-zinc-900/30 rounded-2xl border border-zinc-800">
              Nenhum item disponível no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {itensLoja.map(item => {
                const podeResgatar = wallet.spendable_points >= item.custo_points && item.estoque > 0;
                const esgotado = item.estoque <= 0;
                const faltamPontos = Math.max(0, item.custo_points - wallet.spendable_points);

                return (
                  <div
                    key={item.id}
                    className="bg-[#141416] border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-lg"
                  >
                    <div className="relative h-48 bg-zinc-900 overflow-hidden">
                      <img
                        src={item.imagem_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80'}
                        alt={item.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-sm text-red-400 border border-red-500/30">
                          {item.categoria}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm ${
                            esgotado
                              ? 'bg-red-950/90 text-red-400 border border-red-500/40'
                              : 'bg-black/80 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {esgotado ? 'Esgotado' : `${item.estoque} no estoque`}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-black text-white leading-snug line-clamp-2">
                          {item.nome}
                        </h4>
                        {item.descricao && (
                          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {item.descricao}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400 font-bold uppercase">Preço</span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <span className="text-xs">🪙</span>
                            <span className="text-sm font-black text-amber-300">
                              {item.custo_points} Points
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => { setItemSelecionado(item); setErroMsg(''); }}
                          disabled={!podeResgatar}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                            esgotado
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                              : podeResgatar
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 cursor-not-allowed'
                          }`}
                        >
                          {esgotado
                            ? 'Indisponível'
                            : podeResgatar
                            ? 'Resgatar Recompensa'
                            : `Faltam ${faltamPontos} pts`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEÚDO 2: MEUS RESGATES E VOUCHERS                     */}
      {/* ======================================================== */}
      {subAba === 'meus_resgates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Histórico de Vouchers Solicitados</h3>
            <span className="text-xs text-zinc-400">
              Total: {wallet.resgates.length} resgate(s)
            </span>
          </div>

          {wallet.resgates.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-zinc-800">
              Você ainda não realizou nenhum resgate de pontos. Treine e troque por itens!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wallet.resgates.map(resgate => {
                const pendente = resgate.status === 'PENDENTE_RETIRADA';
                return (
                  <div
                    key={resgate.id}
                    className="bg-[#141416] border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resgate.item?.imagem_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&q=80'}
                          alt={resgate.item?.nome}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{resgate.item?.nome}</h4>
                          <span className="text-[11px] text-zinc-400">
                            Resgatado em {new Date(resgate.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          pendente
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {pendente ? 'Aguardando Retirada' : 'Entregue'}
                      </span>
                    </div>

                    <div className="bg-black/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                          Voucher de Validação
                        </span>
                        <span className="text-base font-mono font-black text-amber-300">
                          {resgate.codigo_voucher}
                        </span>
                      </div>
                      <button
                        onClick={() => copiarVoucher(resgate.codigo_voucher)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-white transition flex items-center gap-1"
                      >
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    {resgate.entregueEm && (
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Entregue em: {new Date(resgate.entregueEm).toLocaleDateString('pt-BR')}</span>
                        {resgate.entreguePor && <span>Por: {resgate.entreguePor}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEÚDO 3: HISTÓRICO DE GRADUAÇÕES (LINHA DO TEMPO)      */}
      {/* ======================================================== */}
      {subAba === 'graduacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Linha do Tempo de Graduação</h3>
              <p className="text-xs text-zinc-400">
                Acompanhe seus exames oficiais de faixa e prajied no CT Borü.
              </p>
            </div>
          </div>

          {graduacoes.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-zinc-800">
              Nenhuma graduação registrada no sistema ainda. Participe dos exames de graduação com o Mestre!
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
              {graduacoes.map((grad, idx) => (
                <div key={grad.id || idx} className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-red-600 border-2 border-zinc-900 ring-2 ring-red-600/30" />
                  <div className="bg-[#141416] border border-zinc-800 group-hover:border-zinc-700 rounded-2xl p-4 space-y-2 transition shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-red-400">
                        {grad.modalidade}
                      </span>
                      <span className="text-xs text-zinc-400 font-bold">
                        {new Date(grad.data_graduacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-lg font-black text-white">
                        {grad.nova_graduacao}
                      </div>
                      {grad.graduacao_anterior && (
                        <span className="text-xs text-zinc-500 font-bold">
                          (Anterior: {grad.graduacao_anterior})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                      <span>Examinador: <strong className="text-zinc-300">{grad.professorNome}</strong></span>
                      <span className="text-emerald-400 font-bold">+50 XP & +25 Points</span>
                    </div>

                    {grad.notas_exame && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/80">
                        "{grad.notas_exame}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTEÚDO 4: EXTRATO DE PONTOS (POINTS LEDGER)             */}
      {/* ======================================================== */}
      {subAba === 'extrato' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Extrato de Movimentação de Points</h3>
            <span className="text-xs text-zinc-400">Histórico de entradas e resgates</span>
          </div>

          {wallet.extrato.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-zinc-800">
              Nenhuma movimentação registrada até o momento.
            </div>
          ) : (
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg divide-y divide-zinc-800">
              {wallet.extrato.map(item => {
                const isPositivo = item.points_delta > 0;
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.descricao}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-black bg-zinc-800 text-zinc-300">
                          {item.tipo.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(item.criadoEm).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-black ${
                          isPositivo ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositivo ? `+${item.points_delta}` : item.points_delta} pts
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Saldo: {item.saldo_pontos_apos} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

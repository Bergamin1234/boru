import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface CashRegisterData {
  id: string;
  data_abertura: string;
  data_fechamento?: string;
  operador_abertura_nome: string;
  operador_fechamento_nome?: string;
  saldo_inicial_dinheiro: number;
  entradas_dinheiro: number;
  entradas_pix: number;
  entradas_cartao: number;
  saidas_dinheiro: number;
  saldo_dinheiro_esperado: number;
  saldo_dinheiro_contado?: number;
  diferenca_dinheiro?: number;
  justificativa_diferenca?: string;
  status: 'ABERTO' | 'FECHADO';
  total_transacoes?: number;
}

export const CashRegisterTab: React.FC<{ usuarioLogado: any }> = ({ usuarioLogado }) => {
  const [caixaStatus, setCaixaStatus] = useState<'ABERTO' | 'FECHADO'>('FECHADO');
  const [caixaAtual, setCaixaAtual] = useState<CashRegisterData | null>(null);
  const [historico, setHistorico] = useState<CashRegisterData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Abertura
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState('0.00');
  const [operadorAbertura, setOperadorAbertura] = useState(usuarioLogado?.nome || 'Administrador');

  // Modal Fechamento
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [saldoContado, setSaldoContado] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [operadorFechamento, setOperadorFechamento] = useState(usuarioLogado?.nome || 'Administrador');
  const [processando, setProcessando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  const carregarStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, histRes] = await Promise.all([
        adminApi.getCashRegisterStatus().catch(() => ({ data: { status: 'FECHADO', caixa: null } })),
        adminApi.getCashRegisterReports().catch(() => ({ data: [] }))
      ]);

      if (statusRes.data?.status === 'ABERTO' && statusRes.data?.caixa) {
        setCaixaStatus('ABERTO');
        setCaixaAtual(statusRes.data.caixa);
      } else {
        setCaixaStatus('FECHADO');
        setCaixaAtual(null);
      }

      if (Array.isArray(histRes.data)) {
        setHistorico(histRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar status de caixa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarStatus();
  }, []);

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessando(true);
    setErroMsg('');

    try {
      const valor = parseFloat(saldoInicial.replace(',', '.')) || 0;
      await adminApi.openCashRegister({
        saldo_inicial_dinheiro: valor,
        operador_id: usuarioLogado?.id || 'admin',
        operador_nome: operadorAbertura
      });
      setShowAbrirModal(false);
      setSucessoMsg('Caixa aberto com sucesso! Pronto para registrar movimentações.');
      setTimeout(() => setSucessoMsg(''), 4000);
      await carregarStatus();
    } catch (err: any) {
      setErroMsg(err.response?.data?.erro || 'Erro ao abrir o caixa.');
    } finally {
      setProcessando(false);
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAtual) return;

    const contado = parseFloat(saldoContado.replace(',', '.')) || 0;
    const esperado = caixaAtual.saldo_dinheiro_esperado || 0;
    const diferenca = contado - esperado;

    if (Math.abs(diferenca) > 0.01 && !justificativa.trim()) {
      setErroMsg(`Divergência de R$ ${diferenca.toFixed(2)}. Justificativa é obrigatória!`);
      return;
    }

    setProcessando(true);
    setErroMsg('');

    try {
      await adminApi.closeCashRegister({
        caixaId: caixaAtual.id,
        saldo_dinheiro_contado: contado,
        justificativa_diferenca: justificativa.trim() || undefined,
        operador_fechamento_id: usuarioLogado?.id || 'admin',
        operador_fechamento_nome: operadorFechamento
      });

      setShowFecharModal(false);
      setSaldoContado('');
      setJustificativa('');
      setSucessoMsg('Fechamento de caixa concluído e balanço auditado com sucesso!');
      setTimeout(() => setSucessoMsg(''), 4000);
      await carregarStatus();
    } catch (err: any) {
      setErroMsg(err.response?.data?.erro || 'Erro ao fechar o caixa.');
    } finally {
      setProcessando(false);
    }
  };

  const diferencaPrevia = caixaAtual && saldoContado
    ? (parseFloat(saldoContado.replace(',', '.')) || 0) - caixaAtual.saldo_dinheiro_esperado
    : 0;

  return (
    <div className="space-y-6">
      {/* HEADER DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141416] border border-zinc-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Controle & Fechamento de Caixa Diário</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                caixaStatus === 'ABERTO'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {caixaStatus === 'ABERTO' ? '● Caixa Aberto' : 'Caixa Fechado'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão auditada da gaveta física de dinheiro, recebimentos em PIX/Cartão e conferência de sangrias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {caixaStatus === 'FECHADO' ? (
            <button
              onClick={() => { setShowAbrirModal(true); setErroMsg(''); }}
              className="py-2.5 px-5 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <span>🔓</span>
              <span>Abrir Sessão de Caixa</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowFecharModal(true); setErroMsg(''); }}
              className="py-2.5 px-5 rounded-xl font-black text-xs uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-2 shadow-lg shadow-red-950/40"
            >
              <span>🔒</span>
              <span>Realizar Fechamento Diário</span>
            </button>
          )}
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
          <span>✓</span>
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* PAINEL DA SESSÃO ATUAL (QUANDO ABERTO) */}
      {caixaStatus === 'ABERTO' && caixaAtual && (
        <div className="bg-gradient-to-br from-[#18181B] via-[#141416] to-[#0E0E10] border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Sessão em Andamento
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                Operador: <span className="text-emerald-400">{caixaAtual.operador_abertura_nome}</span> • Abertura às {new Date(caixaAtual.data_abertura).toLocaleTimeString('pt-BR')} ({new Date(caixaAtual.data_abertura).toLocaleDateString('pt-BR')})
              </div>
            </div>

            <div className="text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
              {caixaAtual.total_transacoes || 0} transações auditadas
            </div>
          </div>

          {/* Cards de Totais da Sessão */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-[#1C1C21] border border-zinc-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Fundo Inicial (Troco)</span>
              <div className="text-lg font-black text-white">
                R$ {caixaAtual.saldo_inicial_dinheiro.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="bg-[#1C1C21] border border-emerald-500/20 p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Entradas Dinheiro</span>
              <div className="text-lg font-black text-emerald-300">
                + R$ {caixaAtual.entradas_dinheiro.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="bg-[#1C1C21] border border-cyan-500/20 p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Entradas PIX</span>
              <div className="text-lg font-black text-cyan-300">
                + R$ {caixaAtual.entradas_pix.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="bg-[#1C1C21] border border-indigo-500/20 p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400">Entradas Cartão</span>
              <div className="text-lg font-black text-indigo-300">
                + R$ {caixaAtual.entradas_cartao.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-gradient-to-r from-emerald-950/50 to-zinc-900 border border-emerald-500/40 p-4 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-black text-emerald-400">Esperado na Gaveta</span>
              <div className="text-xl font-black text-emerald-300">
                R$ {caixaAtual.saldo_dinheiro_esperado.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DE FECHAMENTOS ANTERIORES */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <span>📑</span>
          <span>Balanços & Histórico de Fechamento de Caixa</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Carregando balanços...</div>
        ) : historico.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs bg-[#141416] rounded-2xl border border-zinc-800">
            Nenhuma sessão de caixa finalizada registrada ainda.
          </div>
        ) : (
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                    <th className="p-3.5">Período / Data</th>
                    <th className="p-3.5">Operador</th>
                    <th className="p-3.5">Fundo Inicial</th>
                    <th className="p-3.5">Entradas Espécie</th>
                    <th className="p-3.5">PIX / Cartão</th>
                    <th className="p-3.5">Esperado</th>
                    <th className="p-3.5">Contado</th>
                    <th className="p-3.5">Diferença</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {historico.map(sessao => {
                    const diff = sessao.diferenca_dinheiro || 0;
                    const temDivergencia = Math.abs(diff) > 0.01;
                    return (
                      <tr key={sessao.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-3.5 font-mono text-zinc-300 whitespace-nowrap">
                          {new Date(sessao.data_abertura).toLocaleDateString('pt-BR')}{' '}
                          <span className="text-[10px] text-zinc-500">
                            {new Date(sessao.data_abertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {sessao.data_fechamento && ` → ${new Date(sessao.data_fechamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {sessao.operador_fechamento_nome || sessao.operador_abertura_nome}
                        </td>
                        <td className="p-3.5 text-zinc-400 whitespace-nowrap">
                          R$ {sessao.saldo_inicial_dinheiro.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3.5 text-emerald-400 font-bold whitespace-nowrap">
                          R$ {sessao.entradas_dinheiro.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3.5 text-cyan-400 font-bold whitespace-nowrap">
                          R$ {(sessao.entradas_pix + sessao.entradas_cartao).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3.5 font-black text-white whitespace-nowrap">
                          R$ {sessao.saldo_dinheiro_esperado.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3.5 font-black text-zinc-200 whitespace-nowrap">
                          {sessao.saldo_dinheiro_contado !== undefined
                            ? `R$ ${sessao.saldo_dinheiro_contado.toFixed(2).replace('.', ',')}`
                            : '—'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {sessao.status === 'FECHADO' ? (
                            <span
                              className={`font-black px-2 py-0.5 rounded text-[11px] ${
                                temDivergencia
                                  ? diff < 0
                                    ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                                    : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                  : 'text-emerald-400'
                              }`}
                              title={sessao.justificativa_diferenca || 'Sem divergência'}
                            >
                              {temDivergencia
                                ? `${diff > 0 ? '+' : ''}R$ ${diff.toFixed(2).replace('.', ',')}`
                                : 'OK (Exato)'}
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sessao.status === 'ABERTO'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {sessao.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ABERTURA DE CAIXA */}
      {showAbrirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleAbrirCaixa}
            className="bg-[#141416] border border-zinc-700 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🔓 Abertura de Caixa Diário</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAbrirModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {erroMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 font-bold">
                {erroMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Saldo Inicial / Fundo de Troco (R$)
                </label>
                <input
                  type="text"
                  value={saldoInicial}
                  onChange={e => setSaldoInicial(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-base font-black text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Informe a quantia física que já está na gaveta para iniciar o expediente.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Operador Responsável
                </label>
                <input
                  type="text"
                  value={operadorAbertura}
                  onChange={e => setOperadorAbertura(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAbrirModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processando}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                {processando ? 'Abrindo...' : 'Confirmar Abertura'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: FECHAMENTO DE CAIXA COM AUDITORIA OBRIGATÓRIA */}
      {showFecharModal && caixaAtual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleFecharCaixa}
            className="bg-[#141416] border border-zinc-700 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🔒 Fechamento e Auditoria de Caixa</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFecharModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {erroMsg && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-400 font-bold">
                {erroMsg}
              </div>
            )}

            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Fundo Inicial (Troco):</span>
                <span className="font-bold text-white">
                  R$ {caixaAtual.saldo_inicial_dinheiro.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">+ Entradas em Dinheiro:</span>
                <span className="font-bold text-emerald-400">
                  R$ {caixaAtual.entradas_dinheiro.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-black">
                <span className="text-white">Saldo Esperado na Gaveta:</span>
                <span className="text-emerald-300">
                  R$ {caixaAtual.saldo_dinheiro_esperado.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Saldo Contado em Dinheiro em Espécie (R$) *
                </label>
                <input
                  type="text"
                  value={saldoContado}
                  onChange={e => setSaldoContado(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-base font-black text-white focus:outline-none focus:border-red-500"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Conte todas as cédulas e moedas físicas presentes na gaveta.
                </span>
              </div>

              {/* Indicador em tempo real de divergência */}
              {saldoContado !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    Math.abs(diferencaPrevia) <= 0.01
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                      : diferencaPrevia < 0
                      ? 'bg-red-950/40 border-red-500/40 text-red-400'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                  }`}
                >
                  <span>
                    {Math.abs(diferencaPrevia) <= 0.01
                      ? '✓ Valor contado bate com o sistema!'
                      : diferencaPrevia < 0
                      ? `⚠️ Falta de R$ ${Math.abs(diferencaPrevia).toFixed(2).replace('.', ',')} na gaveta!`
                      : `⚠️ Sobra de R$ ${diferencaPrevia.toFixed(2).replace('.', ',')} na gaveta!`}
                  </span>
                  <span className="font-mono text-sm">
                    {diferencaPrevia > 0 ? '+' : ''}R$ {diferencaPrevia.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}

              {/* Justificativa obrigatória se houver divergência */}
              {Math.abs(diferencaPrevia) > 0.01 && (
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-red-400 uppercase tracking-wider block">
                    Justificativa Obrigatória da Diferença *
                  </label>
                  <textarea
                    value={justificativa}
                    onChange={e => setJustificativa(e.target.value)}
                    placeholder="Descreva o motivo da divergência (ex: sangria emergencial para produto de limpeza, troco incorreto, etc.)"
                    rows={3}
                    className="w-full bg-zinc-900 border border-red-500/50 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-400"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Operador do Fechamento
                </label>
                <input
                  type="text"
                  value={operadorFechamento}
                  onChange={e => setOperadorFechamento(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowFecharModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={processando || (Math.abs(diferencaPrevia) > 0.01 && !justificativa.trim())}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                {processando ? 'Fechando...' : 'Confirmar Fechamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface FinancialDashboardTabProps {
  onRefreshGlobal?: () => void;
}

export const FinancialDashboardTab: React.FC<FinancialDashboardTabProps> = ({
  onRefreshGlobal,
}) => {
  const [resumo, setResumo] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<
    'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'BOLSISTA'
  >('TODOS');

  // Seleção múltipla e paginação
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Modal de Baixa Manual com DatePicker Obrigatório (Individual ou Lote)
  const [modalBaixa, setModalBaixa] = useState<{
    aberto: boolean;
    modo: 'INDIVIDUAL' | 'LOTE';
    aluno?: any;
  }>({ aberto: false, modo: 'INDIVIDUAL' });
  const [dataPagamentoPicker, setDataPagamentoPicker] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [valorPagamentoInput, setValorPagamentoInput] = useState<string>('');
  const [processandoBaixa, setProcessandoBaixa] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregarFinanceiro = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFinancialDashboard();
      setResumo(res.data.resumo);
      setRegistros(res.data.registros || []);
    } catch {
      mostrarFeedback('erro', 'Erro ao carregar dados do Dashboard Financeiro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  const mostrarFeedback = (tipo: 'ok' | 'erro', texto: string) => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 5000);
  };

  const registrosFiltrados = registros.filter((r) => {
    const matchBusca =
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (r.cpf && r.cpf.includes(busca)) ||
      (r.plano && r.plano.toLowerCase().includes(busca.toLowerCase()));
    if (!matchBusca) return false;
    if (filtroStatus === 'TODOS') return true;
    return r.statusFinanceiro === filtroStatus;
  });

  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const registrosPaginados = registrosFiltrados.slice(
    (paginaSegura - 1) * itensPorPagina,
    paginaSegura * itensPorPagina
  );

  const toggleSelecionar = (alunoId: string) => {
    setSelecionados((prev) =>
      prev.includes(alunoId) ? prev.filter((id) => id !== alunoId) : [...prev, alunoId]
    );
  };

  const toggleSelecionarPagina = () => {
    const idsPagina = registrosPaginados.map((r) => r.alunoId);
    const todosMarcados = idsPagina.every((id) => selecionados.includes(id));
    if (todosMarcados) {
      setSelecionados((prev) => prev.filter((id) => !idsPagina.includes(id)));
    } else {
      setSelecionados((prev) => Array.from(new Set([...prev, ...idsPagina])));
    }
  };

  const abrirModalBaixaIndividual = (item: any) => {
    setDataPagamentoPicker(new Date().toISOString().split('T')[0]);
    setValorPagamentoInput(String(item.valor || 160));
    setModalBaixa({ aberto: true, modo: 'INDIVIDUAL', aluno: item });
  };

  const abrirModalBaixaLote = () => {
    if (selecionados.length === 0) return;
    setDataPagamentoPicker(new Date().toISOString().split('T')[0]);
    setValorPagamentoInput('');
    setModalBaixa({ aberto: true, modo: 'LOTE' });
  };

  const confirmarBaixaComDatePicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataPagamentoPicker) {
      mostrarFeedback('erro', 'Selecione a data do pagamento no calendário (DatePicker).');
      return;
    }

    setProcessandoBaixa(true);
    try {
      if (modalBaixa.modo === 'INDIVIDUAL' && modalBaixa.aluno) {
        const res = await adminApi.registerPayment(modalBaixa.aluno.alunoId, {
          dataPagamento: dataPagamentoPicker,
          valor: valorPagamentoInput ? Number(valorPagamentoInput) : undefined,
        });
        mostrarFeedback('ok', res.data.mensagem || 'Baixa registrada com sucesso!');
      } else {
        const res = await adminApi.batchRegisterPayment({
          alunoIds: selecionados,
          dataPagamento: dataPagamentoPicker,
          valorCustom: valorPagamentoInput ? Number(valorPagamentoInput) : undefined,
        });
        mostrarFeedback('ok', res.data.mensagem || 'Baixa em lote registrada com sucesso!');
        setSelecionados([]);
      }
      setModalBaixa({ aberto: false, modo: 'INDIVIDUAL' });
      await carregarFinanceiro();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      mostrarFeedback('erro', err.response?.data?.erro || 'Erro ao confirmar baixa manual.');
    } finally {
      setProcessandoBaixa(false);
    }
  };

  const handleToggleBolsista = async (item: any) => {
    const novoStatus = !item.is_bolsista;
    try {
      const res = await adminApi.toggleStudentBolsista(item.alunoId, novoStatus);
      mostrarFeedback('ok', res.data.mensagem);
      await carregarFinanceiro();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch {
      mostrarFeedback('erro', 'Erro ao alterar status de bolsista.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO DO DASHBOARD FINANCEIRO */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#141416] to-[#1A1A1E] border border-emerald-500/30 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            💰 Módulo 5 — Gestão Financeira & Fluxo de Caixa
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
            Dashboard Financeiro, Inadimplências & Baixa Manual
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Controle de receitas, vencimentos fixados pela data de adesão, isenção automática de bolsistas e baixa retroativa/atual com DatePicker.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selecionados.length > 0 && (
            <button
              onClick={abrirModalBaixaLote}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-600/20"
            >
              📅 Dar Baixa nos Selecionados ({selecionados.length})
            </button>
          )}
          <button
            onClick={carregarFinanceiro}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition"
          >
            🔄 Atualizar Caixa
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <span>{feedback.texto}</span>
          <button onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* CARDS DE FLUXO DE CAIXA E RECEITAS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-emerald-400">Receita Confirmada</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            R$ {(resumo?.receitaRecebidaMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500">{resumo?.countPagos || 0} alunos em dia</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-cyan-400">Previsão Mensal Bruta</span>
          <p className="text-2xl font-black text-white mt-1">
            R$ {(resumo?.receitaPrevistaMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500">Faturamento estimado</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-red-400">Total em Atraso</span>
          <p className="text-2xl font-black text-red-500 mt-1">
            R$ {(resumo?.totalInadimplenteValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500">{resumo?.countAtrasados || 0} faturas vencidas</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-amber-400">A Receber (Pendentes)</span>
          <p className="text-2xl font-black text-amber-400 mt-1">
            R$ {(resumo?.saldoPendenteMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500">{resumo?.countPendentes || 0} aguardando baixa</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4 col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase text-purple-400">Alunos Bolsistas</span>
          <p className="text-2xl font-black text-purple-400 mt-1">{resumo?.countBolsistas || 0}</p>
          <span className="text-[11px] text-zinc-500">Isentos de cobrança/bloqueio</span>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA DO GRID DE PAGAMENTOS */}
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'TODOS', label: `Todos (${registros.length})` },
              { id: 'PAGO', label: `🟢 Pagos (${resumo?.countPagos || 0})` },
              { id: 'PENDENTE', label: `🟡 Pendentes (${resumo?.countPendentes || 0})` },
              { id: 'ATRASADO', label: `🔴 Inadimplentes (${resumo?.countAtrasados || 0})` },
              { id: 'BOLSISTA', label: `🎓 Bolsistas (${resumo?.countBolsistas || 0})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFiltroStatus(f.id as any);
                  setPaginaAtual(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  filtroStatus === f.id
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            placeholder="🔍 Filtrar por nome, CPF ou plano..."
            className="w-full md:w-72 bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />
        </div>

        {/* TABELA / GRID DE PAGAMENTOS */}
        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            Carregando grid de pagamentos...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        registrosPaginados.length > 0 &&
                        registrosPaginados.every((r) => selecionados.includes(r.alunoId))
                      }
                      onChange={toggleSelecionarPagina}
                      className="accent-red-600 rounded"
                    />
                  </th>
                  <th className="p-3">Aluno / CPF</th>
                  <th className="p-3">Plano & Valor</th>
                  <th className="p-3">Adesão & Vencimento</th>
                  <th className="p-3">Último Pagamento</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações Financeiras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {registrosPaginados.map((item) => (
                  <tr key={item.alunoId} className="hover:bg-zinc-800/30 transition">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(item.alunoId)}
                        onChange={() => toggleSelecionar(item.alunoId)}
                        className="accent-red-600 rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.nome}</span>
                        {item.is_bolsista && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            🎓 BOLSISTA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        CPF: {item.cpf || 'Não informado'} {item.telefone ? `• ${item.telefone}` : ''}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-200">{item.plano}</div>
                      <div className="text-[11px] text-emerald-400 font-bold">
                        {item.is_bolsista
                          ? 'Isento (R$ 0,00)'
                          : `R$ ${Number(item.valor || 0).toFixed(2).replace('.', ',')}`}
                      </div>
                    </td>
                    <td className="p-3">
                      {item.dataVencimento ? (
                        <div>
                          <span className="font-bold text-white">
                            Vence: {new Date(item.dataVencimento).toLocaleDateString('pt-BR')}
                          </span>
                          {item.diaVencimentoFixo && (
                            <span className="block text-[10px] text-amber-400">
                              Fixado todo dia {String(item.diaVencimentoFixo).padStart(2, '0')} (Adesão)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500">Sem fatura aberta</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.dataPagamento ? (
                        <span className="text-emerald-300 font-semibold">
                          ✓ Pago em {new Date(item.dataPagamento).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.statusFinanceiro === 'BOLSISTA'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : item.statusFinanceiro === 'PAGO' ||
                              item.statusFinanceiro === 'CONVENIO_DIARIA'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.statusFinanceiro === 'ATRASADO'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.statusFinanceiro}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {!item.is_bolsista && (
                          <button
                            onClick={() => abrirModalBaixaIndividual(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>📅</span>
                            <span>Dar Baixa (+30d)</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleBolsista(item)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                            item.is_bolsista
                              ? 'bg-purple-600 text-white border-purple-500'
                              : 'bg-zinc-900 hover:bg-purple-950/50 text-zinc-400 hover:text-purple-300 border-zinc-800'
                          }`}
                          title="Alternar bolsa esportiva (isenta de cobranças e bloqueios)"
                        >
                          {item.is_bolsista ? '🎓 Bolsista Ativo' : '🎓 Tornar Bolsista'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINAÇÃO DO GRID */}
        <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
          <span>
            Exibindo {registrosPaginados.length} de {registrosFiltrados.length} registros • Página{' '}
            <strong className="text-white">{paginaSegura}</strong> de{' '}
            <strong className="text-white">{totalPaginas}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={paginaSegura <= 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold"
            >
              ← Anterior
            </button>
            <button
              disabled={paginaSegura >= totalPaginas}
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold"
            >
              Próxima →
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE BAIXA MANUAL COM COMPONENTE DATEPICKER (CALENDÁRIO) OBRIGATÓRIO */}
      {modalBaixa.aberto && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Módulo 5 — Baixa Financeira Auditada
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {modalBaixa.modo === 'INDIVIDUAL'
                    ? `Dar Baixa: ${modalBaixa.aluno?.nome}`
                    : `Baixa em Lote (${selecionados.length} alunos)`}
                </h3>
              </div>
              <button
                onClick={() => setModalBaixa({ aberto: false, modo: 'INDIVIDUAL' })}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarBaixaComDatePicker} className="space-y-4">
              <div className="bg-[#1A1A1E] border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-black text-emerald-300">
                  📅 Data Real em que o Pagamento Ocorreu (DatePicker Obrigatório):
                </label>
                <input
                  type="date"
                  required
                  value={dataPagamentoPicker}
                  onChange={(e) => setDataPagamentoPicker(e.target.value)}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:border-emerald-500 outline-none"
                />
                <p className="text-[11px] text-zinc-400">
                  Você pode selecionar uma data passada (pagamento retroativo) ou a data de hoje. O sistema gravará exatamente esta data no banco.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Valor Pago (R$) {modalBaixa.modo === 'LOTE' && '(Deixe vazio para manter o valor de cada plano)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorPagamentoInput}
                  onChange={(e) => setValorPagamentoInput(e.target.value)}
                  placeholder="Ex: 160.00"
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBaixa({ aberto: false, modo: 'INDIVIDUAL' })}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoBaixa}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20"
                >
                  {processandoBaixa ? 'Registrando...' : '✓ Confirmar Baixa (+30 dias)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

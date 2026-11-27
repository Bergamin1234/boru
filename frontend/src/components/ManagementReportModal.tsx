import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../services/api';
import { formatarMoeda, isDiariaOuConvenio } from '../utils/sharedFormatters';
import {
  exportGovernanceWorkbookXlsx,
  filterStudentsForGovernance,
  filterTransactionsForGovernance,
  GovernanceExportFilters,
} from '../utils/exportGovernanceUtils';

interface ManagementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  alunos: any[];
  metricas: any;
  presencas?: any[];
  agendamentos?: any;
  professores?: any[];
  usuarioLogadoNome?: string;
}

export const ManagementReportModal: React.FC<ManagementReportModalProps> = ({
  isOpen,
  onClose,
  alunos,
  metricas,
  presencas = [],
  agendamentos,
  professores = [],
  usuarioLogadoNome = 'Administração CT Borü',
}) => {
  const [filtros, setFiltros] = useState<GovernanceExportFilters>({
    periodo: 'MES_ATUAL',
    statusAluno: 'TODOS',
    modalidade: 'TODAS',
    mesRef: new Date().getMonth() + 1,
    anoRef: new Date().getFullYear(),
  });

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [registrosFin, setRegistrosFin] = useState<any[]>([]);
  const [graficosApi, setGraficosApi] = useState<any>(null);
  const [loadingFin, setLoadingFin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingFin(true);
    adminApi
      .getFinancialDashboard({
        mes: filtros.mesRef || new Date().getMonth() + 1,
        ano: filtros.anoRef || new Date().getFullYear(),
      })
      .then((res) => {
        setTransacoes(res.data?.transacoes || []);
        setRegistrosFin(res.data?.registros || []);
        setGraficosApi(res.data?.graficos || null);
      })
      .catch(() => {})
      .finally(() => setLoadingFin(false));
  }, [isOpen, filtros.mesRef, filtros.anoRef]);

  const alunosFiltrados = useMemo(
    () => filterStudentsForGovernance(alunos, filtros),
    [alunos, filtros]
  );

  const transacoesFiltradas = useMemo(
    () => filterTransactionsForGovernance(transacoes, filtros),
    [transacoes, filtros]
  );

  const kpis = useMemo(() => {
    const total = alunosFiltrados.length;
    const ativos = alunosFiltrados.filter(
      (a) => a.statusAtividade === 'ATIVO' || (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14)
    ).length;
    const inativos = Math.max(0, total - ativos);
    const bolsistas = alunosFiltrados.filter((a) => Boolean(a.is_bolsista)).length;
    const convenios = alunosFiltrados.filter((a) => isDiariaOuConvenio(a.plano)).length;
    const inadimplentes = alunosFiltrados.filter((a) => {
      const st = String(a.statusFinanceiro || a.statusMensalidade || '').toUpperCase();
      return !a.is_bolsista && (st === 'ATRASADO' || st === 'INADIMPLENTE' || st === 'PENDENTE');
    }).length;
    const emDia = Math.max(0, total - inadimplentes);

    const entradas = transacoesFiltradas
      .filter((t) => t.tipo === 'ENTRADA' && t.status !== 'CANCELADO')
      .reduce((s, t) => s + (Number(t.valor) || 0), 0);
    const saidas = transacoesFiltradas
      .filter((t) => t.tipo === 'SAIDA' && t.status !== 'CANCELADO')
      .reduce((s, t) => s + (Number(t.valor) || 0), 0);

    return {
      total,
      ativos,
      inativos,
      bolsistas,
      convenios,
      inadimplentes,
      emDia,
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [alunosFiltrados, transacoesFiltradas]);

  const distribuicaoPlanos = useMemo(() => {
    const mapa: Record<string, number> = {};
    alunosFiltrados.forEach((a) => {
      const plano = a.is_bolsista ? 'Bolsista / Projeto' : a.plano || '2x na semana';
      mapa[plano] = (mapa[plano] || 0) + 1;
    });
    return Object.entries(mapa).map(([nome, quantidade]) => ({ nome, quantidade }));
  }, [alunosFiltrados]);

  if (!isOpen) return null;

  const handleExportExcel = (usarBaseCompleta = false) => {
    exportGovernanceWorkbookXlsx({
      alunos,
      metricas,
      transacoesFinanceiras: transacoes,
      registrosFinanceiros: registrosFin,
      presencas,
      agendamentosExperimentais: agendamentos,
      professores,
      emitidoPor: usuarioLogadoNome,
      filtros: usarBaseCompleta
        ? { periodo: 'TUDO', statusAluno: 'TODOS', modalidade: 'TODAS' }
        : filtros,
    });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-2 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0 print:overflow-visible">
      <div className="bg-[#141416] border border-zinc-700 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl my-4 print:my-0 print:border-0 print:shadow-none print:bg-white print:text-black print:max-w-none">
        {/* BARRA DE CONTROLE SUPERIOR (OCULTA NA IMPRESSÃO / PDF) */}
        <div className="p-4 sm:p-5 bg-zinc-900 border-b border-zinc-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              GOVERNANÇA & EXPORTAÇÃO EM TEMPO REAL (1 CLIQUE)
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase">
              📊 Central de Exportação Excel (.xlsx) & Relatório Executivo (PDF / Print)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExportExcel(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5"
              title="Baixar base completa sem filtros em Excel (.xlsx)"
            >
              <span>⚡ Baixar Excel Completo (1-Click)</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportExcel(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5"
              title="Baixar planilha Excel (.xlsx) aplicando os filtros abaixo"
            >
              <span>📥 Exportar Excel Filtrado (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/50 transition flex items-center gap-1.5"
            >
              <span>🖨️ Imprimir / Salvar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
            >
              ✕ Fechar
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS RÁPIDOS OPCIONAIS (OCULTA NA IMPRESSÃO) */}
        <div className="p-4 sm:p-5 bg-[#111114] border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Filtro de Período Financeiro
            </label>
            <select
              value={filtros.periodo}
              onChange={(e) =>
                setFiltros({ ...filtros, periodo: e.target.value as GovernanceExportFilters['periodo'] })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            >
              <option value="MES_ATUAL">Mês de Referência Selecionado</option>
              <option value="ULTIMOS_3_MESES">Últimos 3 Meses</option>
              <option value="ANO_ATUAL">Ano Atual Completo</option>
              <option value="TUDO">Todo o Histórico (Base Completa)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Mês / Ano de Referência
            </label>
            <div className="flex gap-2">
              <select
                value={filtros.mesRef}
                onChange={(e) => setFiltros({ ...filtros, mesRef: Number(e.target.value) })}
                className="w-full px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                {[
                  'Janeiro',
                  'Fevereiro',
                  'Março',
                  'Abril',
                  'Maio',
                  'Junho',
                  'Julho',
                  'Agosto',
                  'Setembro',
                  'Outubro',
                  'Novembro',
                  'Dezembro',
                ].map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={filtros.anoRef}
                onChange={(e) => setFiltros({ ...filtros, anoRef: Number(e.target.value) })}
                className="w-24 px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Status do Aluno
            </label>
            <select
              value={filtros.statusAluno}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  statusAluno: e.target.value as GovernanceExportFilters['statusAluno'],
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            >
              <option value="TODOS">Todos os Alunos ({alunos.length})</option>
              <option value="ATIVOS">Somente Ativos no Tatame</option>
              <option value="INATIVOS">Inativos / Em Risco (14+ dias)</option>
              <option value="EM_DIA">Mensalidade em Dia / Adimplentes</option>
              <option value="INADIMPLENTES">Atrasados / Pendentes</option>
              <option value="BOLSISTAS">Somente Bolsistas</option>
              <option value="CONVENIO_DIARIA">Convênios (Wellhub / TotalPass) & Diárias</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Modalidade
            </label>
            <select
              value={filtros.modalidade}
              onChange={(e) => setFiltros({ ...filtros, modalidade: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
            >
              <option value="TODAS">Todas as Modalidades</option>
              <option value="Muay Thai">Muay Thai</option>
              <option value="Jiu-Jitsu">Jiu-Jitsu</option>
              <option value="Boxe">Boxe</option>
              <option value="MMA">MMA</option>
            </select>
          </div>
        </div>

        {/* =====================================================================
            FOLHA DE RELATÓRIO EXECUTIVO (PRINT-FRIENDLY / REUNIÕES & DIRETORIA)
           ===================================================================== */}
        <div
          id="boru-printable-management-report"
          className="p-6 sm:p-8 space-y-8 bg-white text-zinc-900 print:p-0"
        >
          {/* CABEÇALHO CORPORATIVO DO RELATÓRIO */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-red-600 pb-5">
            <div className="flex items-center gap-4">
              <img
                src="/logo-boru.jpg"
                alt="BORÜ"
                className="w-16 h-16 rounded-full border-2 border-red-600 object-cover"
              />
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-red-600">
                  RELATÓRIO EXECUTIVO DE GESTÃO & GOVERNANÇA
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">
                  BORÜ CENTRO DE COMBATE
                </h1>
                <p className="text-xs text-zinc-600">
                  Porto Velho - RO • CNPJ / Gestão Interna • Documento Gerado em Tempo Real
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-zinc-700 space-y-0.5 bg-zinc-100 px-4 py-3 rounded-xl border border-zinc-300">
              <div>
                <strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às{' '}
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div>
                <strong>Responsável:</strong> {usuarioLogadoNome}
              </div>
              <div>
                <strong>Competência:</strong> {String(filtros.mesRef).padStart(2, '0')}/
                {filtros.anoRef} ({filtros.statusAluno})
              </div>
            </div>
          </div>

          {/* 1. INDICADORES-CHAVE (KPIs DE ALUNOS E FINANCEIRO) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 border-l-4 border-red-600 pl-2.5">
              1. Indicadores-Chave de Desempenho (KPIs do Período)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-bold uppercase text-zinc-500 block">
                  Total de Alunos
                </span>
                <span className="text-2xl font-black text-zinc-900">{kpis.total}</span>
                <span className="text-[11px] text-zinc-500 block">Base selecionada</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                  Alunos Ativos
                </span>
                <span className="text-2xl font-black text-emerald-700">{kpis.ativos}</span>
                <span className="text-[11px] text-emerald-600 block">
                  {kpis.total > 0 ? Math.round((kpis.ativos / kpis.total) * 100) : 100}% em treino
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">
                  Inativos (14+ dias)
                </span>
                <span className="text-2xl font-black text-amber-700">{kpis.inativos}</span>
                <span className="text-[11px] text-amber-700 block">Atenção / Retenção</span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-800 block">
                  Em Dia / Bolsistas
                </span>
                <span className="text-2xl font-black text-blue-800">{kpis.emDia}</span>
                <span className="text-[11px] text-blue-600 block">
                  {kpis.bolsistas} bolsistas | {kpis.convenios} convênio
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[10px] font-bold uppercase text-red-700 block">
                  Pendentes / Atraso
                </span>
                <span className="text-2xl font-black text-red-700">{kpis.inadimplentes}</span>
                <span className="text-[11px] text-red-600 block">Cobrança ativa</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-100 border border-zinc-300">
                <span className="text-[10px] font-bold uppercase text-zinc-600 block">
                  Assiduidade Média
                </span>
                <span className="text-2xl font-black text-zinc-900">
                  {metricas?.taxaPresencaMedia ?? 100}%
                </span>
                <span className="text-[11px] text-zinc-600 block">Frequência geral</span>
              </div>
            </div>

            {/* RESUMO FINANCEIRO EXECUTIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-800 block">
                    Receita Bruta (Entradas)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {formatarMoeda(kpis.entradas)}
                  </span>
                </div>
                <span className="text-2xl">📈</span>
              </div>

              <div className="p-4 rounded-xl bg-red-50/80 border border-red-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-red-800 block">
                    Despesas & Saídas
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-red-700">
                    {formatarMoeda(kpis.saidas)}
                  </span>
                </div>
                <span className="text-2xl">📉</span>
              </div>

              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  kpis.saldo >= 0
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-red-900 text-white border-red-900'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase text-zinc-300 block">
                    Saldo Líquido do Período
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {formatarMoeda(kpis.saldo)}
                  </span>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* 2. GRÁFICOS DE EVOLUÇÃO MENSAL E DISTRIBUIÇÃO POR PLANO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">
                2.1 Distribuição de Alunos por Plano / Modalidade
              </h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribuicaoPlanos}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#3f3f46' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#3f3f46' }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" name="Alunos" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">
                2.2 Evolução Financeira Mensal (Receitas vs. Despesas)
              </h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      graficosApi?.evolucaoMensal?.length > 0
                        ? graficosApi.evolucaoMensal
                        : [
                            {
                              mes: `${String(filtros.mesRef).padStart(2, '0')}/${filtros.anoRef}`,
                              entradas: kpis.entradas,
                              saidas: kpis.saidas,
                            },
                          ]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#3f3f46' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#3f3f46' }} />
                    <Tooltip />
                    <Bar dataKey="entradas" name="Entradas (R$)" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas (R$)" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. TABELA DE TRANSAÇÕES FINANCEIRAS DO PERÍODO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 border-l-4 border-red-600 pl-2.5">
                3. Resumo de Movimentações Financeiras ({transacoesFiltradas.length} lançamentos)
              </h3>
              {loadingFin && (
                <span className="text-xs text-zinc-500">Atualizando dados financeiros...</span>
              )}
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {transacoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 px-3 text-center text-zinc-500">
                        Nenhum lançamento financeiro registrado no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    transacoesFiltradas.slice(0, 25).map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-50">
                        <td className="py-2 px-3 whitespace-nowrap">
                          {t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-2 px-3 font-bold">
                          <span
                            className={
                              t.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'
                            }
                          >
                            {t.tipo}
                          </span>
                        </td>
                        <td className="py-2 px-3">{t.categoria}</td>
                        <td className="py-2 px-3">{t.descricao}</td>
                        <td className="py-2 px-3">{t.metodoPagamento}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                            t.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {t.tipo === 'ENTRADA' ? '+' : '-'} {formatarMoeda(Number(t.valor) || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. RELAÇÃO NOMINAL DE ALUNOS (GOVERNANÇA) */}
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 border-l-4 border-red-600 pl-2.5">
              4. Relação Nominal de Alunos ({alunosFiltrados.length} registros)
            </h3>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300 text-zinc-700 uppercase text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Nome do Aluno</th>
                    <th className="py-2.5 px-3">Telefone</th>
                    <th className="py-2.5 px-3">Modalidade / Graduação</th>
                    <th className="py-2.5 px-3">Plano</th>
                    <th className="py-2.5 px-3">Assiduidade</th>
                    <th className="py-2.5 px-3">Situação Financeira</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {alunosFiltrados.map((a, idx) => {
                    const isAtivo =
                      a.statusAtividade === 'ATIVO' ||
                      (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14);
                    return (
                      <tr key={a.id || idx} className="hover:bg-zinc-50">
                        <td className="py-2 px-3 text-zinc-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-zinc-900">{a.nome}</td>
                        <td className="py-2 px-3 text-zinc-600">{a.telefone || '—'}</td>
                        <td className="py-2 px-3">
                          {a.modalidade || 'Muay Thai'} ({a.graduacao || a.prajied || 'Branco'})
                        </td>
                        <td className="py-2 px-3">{a.plano || '2x na semana'}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAtivo
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isAtivo ? 'ATIVO' : 'INATIVO'} ({a.presencasMes ?? 0} check-ins)
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">
                          {a.is_bolsista ? (
                            <span className="text-blue-700">BOLSISTA</span>
                          ) : (
                            <span
                              className={
                                String(a.statusFinanceiro || '').toUpperCase() === 'ATRASADO'
                                  ? 'text-red-700'
                                  : 'text-emerald-700'
                              }
                            >
                              {a.statusFinanceiro || 'EM DIA'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RODAPÉ DE ASSINATURA E GOVERNANÇA */}
          <div className="pt-8 border-t border-zinc-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
            <div>
              <strong>BORÜ Centro de Combate</strong> — Sistema Integrado de Gestão, Frequência e
              Governança Financeira.
            </div>
            <div className="text-center sm:text-right">
              <div className="w-56 border-b border-zinc-400 mb-1 mx-auto sm:ml-auto" />
              <span>Assinatura da Diretoria / Administração ({usuarioLogadoNome})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

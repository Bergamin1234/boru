import * as XLSX from 'xlsx';
import { formatarMoeda, isDiariaOuConvenio } from './sharedFormatters';

export interface GovernanceExportFilters {
  periodo: 'MES_ATUAL' | 'ULTIMOS_3_MESES' | 'ANO_ATUAL' | 'TUDO';
  statusAluno: 'TODOS' | 'ATIVOS' | 'INATIVOS' | 'EM_DIA' | 'INADIMPLENTES' | 'BOLSISTAS' | 'CONVENIO_DIARIA';
  modalidade: string;
  mesRef?: number;
  anoRef?: number;
}

export interface GovernanceExportPayload {
  alunos: any[];
  metricas: any;
  transacoesFinanceiras?: any[];
  registrosFinanceiros?: any[];
  presencas?: any[];
  agendamentosExperimentais?: any;
  professores?: any[];
  emitidoPor?: string;
  filtros?: GovernanceExportFilters;
}

function formatDatePtBr(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('pt-BR');
}

function formatDateTimePtBr(dateInput?: string | Date | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function autoFitWorksheetColumns(ws: XLSX.WorkSheet, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  ws['!cols'] = headers.map((key) => {
    const maxCellLen = rows.reduce((max, row) => {
      const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxCellLen + 4, 14), 52) };
  });
}

export function filterStudentsForGovernance(
  alunos: any[],
  filtros?: GovernanceExportFilters
): any[] {
  if (!filtros) return alunos;
  return alunos.filter((a) => {
    if (filtros.modalidade && filtros.modalidade !== 'TODAS') {
      const mod = (a.modalidade || 'Muay Thai').toLowerCase();
      if (!mod.includes(filtros.modalidade.toLowerCase())) return false;
    }

    const isAtivoTreino =
      a.statusAtividade === 'ATIVO' || (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14);
    const isDiariaConv = isDiariaOuConvenio(a.plano);
    const statusFin = (a.statusFinanceiro || a.statusMensalidade || 'EM_DIA').toUpperCase();

    switch (filtros.statusAluno) {
      case 'ATIVOS':
        return isAtivoTreino;
      case 'INATIVOS':
        return !isAtivoTreino;
      case 'EM_DIA':
        return statusFin === 'PAGO' || statusFin === 'EM_DIA' || Boolean(a.is_bolsista);
      case 'INADIMPLENTES':
        return (statusFin === 'ATRASADO' || statusFin === 'PENDENTE' || statusFin === 'INADIMPLENTE') && !a.is_bolsista;
      case 'BOLSISTAS':
        return Boolean(a.is_bolsista);
      case 'CONVENIO_DIARIA':
        return isDiariaConv;
      default:
        return true;
    }
  });
}

export function filterTransactionsForGovernance(
  transacoes: any[],
  filtros?: GovernanceExportFilters
): any[] {
  if (!filtros || filtros.periodo === 'TUDO') return transacoes;
  const now = new Date();
  const mesAlvo = filtros.mesRef || now.getMonth() + 1;
  const anoAlvo = filtros.anoRef || now.getFullYear();

  return transacoes.filter((t) => {
    if (!t.data && !t.criadoEm) return true;
    const d = new Date(t.data || t.criadoEm);
    if (Number.isNaN(d.getTime())) return true;

    if (filtros.periodo === 'MES_ATUAL') {
      return d.getMonth() + 1 === mesAlvo && d.getFullYear() === anoAlvo;
    }
    if (filtros.periodo === 'ULTIMOS_3_MESES') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return d >= cutoff;
    }
    if (filtros.periodo === 'ANO_ATUAL') {
      return d.getFullYear() === anoAlvo;
    }
    return true;
  });
}

export function exportGovernanceWorkbookXlsx(payload: GovernanceExportPayload): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const alunosFiltrados = filterStudentsForGovernance(payload.alunos || [], payload.filtros);
  const transacoesFiltradas = filterTransactionsForGovernance(
    payload.transacoesFinanceiras || [],
    payload.filtros
  );

  const totalAlunos = alunosFiltrados.length;
  const ativosCount = alunosFiltrados.filter(
    (a) => a.statusAtividade === 'ATIVO' || (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14)
  ).length;
  const inativosCount = totalAlunos - ativosCount;
  const bolsistasCount = alunosFiltrados.filter((a) => Boolean(a.is_bolsista)).length;
  const convenioCount = alunosFiltrados.filter((a) => isDiariaOuConvenio(a.plano)).length;
  const inadimplentesCount = alunosFiltrados.filter((a) => {
    const st = String(a.statusFinanceiro || a.statusMensalidade || '').toUpperCase();
    return !a.is_bolsista && (st === 'ATRASADO' || st === 'INADIMPLENTE' || st === 'PENDENTE');
  }).length;
  const emDiaCount = Math.max(0, totalAlunos - inadimplentesCount);

  const totalEntradas = transacoesFiltradas
    .filter((t) => t.tipo === 'ENTRADA' && t.status !== 'CANCELADO')
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

  const totalSaidas = transacoesFiltradas
    .filter((t) => t.tipo === 'SAIDA' && t.status !== 'CANCELADO')
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

  const saldoLiquido = totalEntradas - totalSaidas;

  // =========================================================================
  // ABA 1: RESUMO GERAL (GOVERNANÇA & KPIs)
  // =========================================================================
  const resumoRows = [
    {
      Indicador: 'Instituição / Unidade',
      Valor: 'BORÜ Centro de Combate — Porto Velho / RO',
      Observacao: 'Relatório Oficial de Governança & Gestão em Tempo Real',
    },
    {
      Indicador: 'Data e Hora de Emissão',
      Valor: formatDateTimePtBr(now),
      Observacao: `Emitido por: ${payload.emitidoPor || 'Administração CT Borü'}`,
    },
    {
      Indicador: 'Filtro de Período Aplicado',
      Valor: payload.filtros?.periodo || 'TUDO (Base Completa)',
      Observacao: `Filtro de Status: ${payload.filtros?.statusAluno || 'TODOS'}`,
    },
    {
      Indicador: 'Total de Alunos (Base Filtrada)',
      Valor: totalAlunos,
      Observacao: `${ativosCount} ativos no tatame | ${inativosCount} inativos (14+ dias sem check-in)`,
    },
    {
      Indicador: 'Alunos Em Dia / Adimplentes',
      Valor: emDiaCount,
      Observacao: `${bolsistasCount} bolsistas isentos | ${convenioCount} convênios/diárias`,
    },
    {
      Indicador: 'Alunos Pendentes / Atrasados',
      Valor: inadimplentesCount,
      Observacao:
        totalAlunos > 0
          ? `Taxa de Adimplência: ${Math.round((emDiaCount / totalAlunos) * 100)}%`
          : '100%',
    },
    {
      Indicador: 'Taxa Média de Assiduidade',
      Valor: `${payload.metricas?.taxaPresencaMedia ?? 100}%`,
      Observacao: `Check-ins hoje: ${payload.metricas?.presencasHoje ?? 0}`,
    },
    {
      Indicador: 'Receita Total Registrada (Entradas)',
      Valor: formatarMoeda(totalEntradas),
      Observacao: `${transacoesFiltradas.filter((t) => t.tipo === 'ENTRADA').length} lançamentos de entrada`,
    },
    {
      Indicador: 'Despesas & Investimentos (Saídas)',
      Valor: formatarMoeda(totalSaidas),
      Observacao: `${transacoesFiltradas.filter((t) => t.tipo === 'SAIDA').length} lançamentos de saída`,
    },
    {
      Indicador: 'Resultado / Saldo Líquido do Período',
      Valor: formatarMoeda(saldoLiquido),
      Observacao: saldoLiquido >= 0 ? 'Superávit Operacional' : 'Déficit no Período',
    },
  ];
  const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
  autoFitWorksheetColumns(wsResumo, resumoRows);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');

  // =========================================================================
  // ABA 2: ALUNOS (CADASTRO, PLANOS, ASSIDUIDADE E STATUS FINANCEIRO)
  // =========================================================================
  const alunosRows = alunosFiltrados.map((a, idx) => {
    const isAtivo =
      a.statusAtividade === 'ATIVO' || (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14);
    const valorPlano =
      a.valorMensalidade !== undefined
        ? Number(a.valorMensalidade)
        : a.plano?.includes('3x')
        ? 170
        : a.plano?.includes('Todos')
        ? 200
        : isDiariaOuConvenio(a.plano)
        ? 40
        : 150;

    return {
      '#': idx + 1,
      'Nome do Aluno': a.nome || '—',
      CPF: a.cpf || 'Não informado',
      'Telefone / WhatsApp': a.telefone || 'Não informado',
      'E-mail': a.email || '—',
      Modalidade: a.modalidade || 'Muay Thai',
      'Graduação / Prajied': a.graduacao || a.prajied || 'Branco',
      'Plano Contratado': a.plano || '2x na semana',
      'Bolsista': a.is_bolsista ? 'SIM (Isento)' : 'NÃO',
      'Valor Base (R$)': a.is_bolsista ? formatarMoeda(0) : formatarMoeda(valorPlano),
      'Status Financeiro': a.is_bolsista
        ? 'BOLSISTA'
        : a.statusFinanceiro || a.statusMensalidade || 'EM DIA',
      'Status de Assiduidade': isAtivo ? 'ATIVO' : 'INATIVO (2+ sem)',
      'Presenças no Mês': a.presencasMes ?? a.totalPresencas ?? 0,
      'Dias sem Treinar': a.diasSemTreinar !== undefined ? a.diasSemTreinar : 0,
      'Último Check-in': formatDatePtBr(a.ultimoCheckin || a.ultimaPresenca),
      'Data de Cadastro': formatDatePtBr(a.criadoEm || a.data_de_adesao),
    };
  });

  const wsAlunos = XLSX.utils.json_to_sheet(
    alunosRows.length > 0
      ? alunosRows
      : [{ Aviso: 'Nenhum aluno encontrado para os filtros selecionados.' }]
  );
  autoFitWorksheetColumns(wsAlunos, alunosRows);
  XLSX.utils.book_append_sheet(wb, wsAlunos, 'Alunos');

  // =========================================================================
  // ABA 3: FINANCEIRO & PLANOS (LIVRO-CAIXA E MENSALIDADES)
  // =========================================================================
  const financeiroRows: Record<string, any>[] = [];

  transacoesFiltradas.forEach((t) => {
    financeiroRows.push({
      'Data Lançamento': formatDatePtBr(t.data || t.criadoEm),
      'Tipo': t.tipo === 'ENTRADA' ? 'ENTRADA (+)' : 'SAÍDA (-)',
      'Categoria Contábil': t.categoria || 'MENSALIDADE',
      'Descrição / Histórico': t.descricao || 'Lançamento Financeiro',
      'Aluno / Vinculado': t.alunoNome || '—',
      'Método de Pagamento': t.metodoPagamento || 'PIX',
      'Valor Formatado (PT-BR)': formatarMoeda(Number(t.valor) || 0),
      'Valor Numérico (R$)': Number((Number(t.valor) || 0).toFixed(2)),
      Status: t.status || 'CONFIRMADO',
      Responsável: t.registradoPor || 'Administração',
    });
  });

  // Se também houver registros de mensalidades de alunos não presentes nas transações avulsas
  if (payload.registrosFinanceiros && payload.registrosFinanceiros.length > 0) {
    payload.registrosFinanceiros.forEach((reg) => {
      financeiroRows.push({
        'Data Lançamento': formatDatePtBr(reg.dataPagamento || reg.dataVencimento),
        'Tipo': 'ASSINATURA / PLANO',
        'Categoria Contábil': reg.plano || 'MENSALIDADE',
        'Descrição / Histórico': `Mensalidade Aluno — ${reg.nome || ''}`,
        'Aluno / Vinculado': reg.nome || '—',
        'Método de Pagamento': reg.metodoPagamento || 'PIX / Mensalidade',
        'Valor Formatado (PT-BR)': formatarMoeda(Number(reg.valor) || 0),
        'Valor Numérico (R$)': Number((Number(reg.valor) || 0).toFixed(2)),
        Status: reg.status || 'PENDENTE',
        Responsável: 'ERP Financeiro Borü',
      });
    });
  }

  const wsFinanceiro = XLSX.utils.json_to_sheet(
    financeiroRows.length > 0
      ? financeiroRows
      : [
          {
            'Data Lançamento': formatDatePtBr(now),
            Tipo: 'RESUMO',
            'Categoria Contábil': 'SEM LANÇAMENTOS NO PERÍODO',
            'Descrição / Histórico': 'Nenhuma transação financeira registrada neste filtro.',
            'Valor Formatado (PT-BR)': formatarMoeda(0),
            'Valor Numérico (R$)': 0,
          },
        ]
  );
  autoFitWorksheetColumns(wsFinanceiro, financeiroRows);
  XLSX.utils.book_append_sheet(wb, wsFinanceiro, 'Financeiro e Planos');

  // =========================================================================
  // ABA 4: FREQUÊNCIA, LEADS & CORPO DOCENTE
  // =========================================================================
  const operacaoRows: Record<string, any>[] = [];

  (payload.professores || []).forEach((prof) => {
    operacaoRows.push({
      Seção: 'CORPO DOCENTE',
      Nome: prof.nome || '—',
      Modalidade: prof.modalidade || 'Muay Thai',
      'Graduação / Cargo': `${prof.cargo || 'PROFESSOR'} — ${prof.prajied || prof.graduacao || ''}`,
      'Horários / Data': prof.horariosAula || 'Grade Oficial',
      Status: prof.ativo !== false ? 'ATIVO' : 'INATIVO',
    });
  });

  const expPendentes = payload.agendamentosExperimentais?.pendentes || [];
  const expPosAula = payload.agendamentosExperimentais?.posAula || [];
  [...expPendentes, ...expPosAula].forEach((ag) => {
    operacaoRows.push({
      Seção: 'AULA EXPERIMENTAL / LEAD',
      Nome: ag.nome || '—',
      Modalidade: 'Muay Thai Experimental',
      'Graduação / Cargo': ag.telefone || '—',
      'Horários / Data': `${ag.data || ''} ${ag.horario || ''}`.trim(),
      Status: ag.status || 'PENDENTE',
    });
  });

  if (operacaoRows.length > 0) {
    const wsOperacao = XLSX.utils.json_to_sheet(operacaoRows);
    autoFitWorksheetColumns(wsOperacao, operacaoRows);
    XLSX.utils.book_append_sheet(wb, wsOperacao, 'Equipe e Leads');
  }

  const dateTag = now.toISOString().split('T')[0];
  XLSX.writeFile(wb, `Boru_Relatorio_Gerencial_${dateTag}.xlsx`);
}

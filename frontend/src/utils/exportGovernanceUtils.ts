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

// ============================================================================
// EXPORTAÇÃO ESPECIALIZADA 1: RELATÓRIO DE ALUNOS, MÉDIAS & ASSIDUIDADE (.XLSX)
// ============================================================================
export function exportStudentsAnalyticsXlsx(params: {
  alunos: any[];
  filtroAplicado?: string;
  emitidoPor?: string;
}): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const lista = params.alunos || [];
  const total = lista.length;

  const getValorPlano = (a: any): number => {
    if (a.is_bolsista) return 0;
    if (a.valorMensalidade !== undefined && Number(a.valorMensalidade) > 0) {
      return Number(a.valorMensalidade);
    }
    const p = String(a.plano || '').toLowerCase();
    if (p.includes('todos')) return 280;
    if (p.includes('3x')) return 160;
    if (isDiariaOuConvenio(a.plano)) return 40;
    return 130;
  };

  const ativosCount = lista.filter(
    (a) => a.statusAtividade === 'ATIVO' || (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14)
  ).length;
  const inativosCount = Math.max(0, total - ativosCount);
  const bolsistasCount = lista.filter((a) => Boolean(a.is_bolsista)).length;
  const conveniosCount = lista.filter((a) => isDiariaOuConvenio(a.plano)).length;
  const mensalistasPagantes = lista.filter(
    (a) => !a.is_bolsista && !isDiariaOuConvenio(a.plano)
  );
  const emDiaCount = lista.filter(
    (a) => a.is_bolsista || a.status === 'PAGO' || a.statusFinanceiro === 'PAGO'
  ).length;
  const atrasadosCount = Math.max(0, total - emDiaCount);

  const somaPresencasMes = lista.reduce((acc, a) => acc + (Number(a.presencasMes) || 0), 0);
  const somaFaltasMes = lista.reduce((acc, a) => acc + (Number(a.faltasMes) || 0), 0);
  const somaPorcentagemPresenca = lista.reduce(
    (acc, a) => acc + (Number(a.porcentagemPresenca ?? 100) || 0),
    0
  );
  const somaDiasSemTreinar = lista.reduce(
    (acc, a) => acc + (Number(a.diasSemTreinar ?? 0) || 0),
    0
  );
  const receitaPotencialMensal = lista.reduce((acc, a) => acc + getValorPlano(a), 0);

  const mediaPresencasPorAluno = total > 0 ? Number((somaPresencasMes / total).toFixed(2)) : 0;
  const mediaFaltasPorAluno = total > 0 ? Number((somaFaltasMes / total).toFixed(2)) : 0;
  const mediaAssiduidadePercentual =
    total > 0 ? Number((somaPorcentagemPresenca / total).toFixed(1)) : 100;
  const mediaDiasSemTreinar =
    total > 0 ? Number((somaDiasSemTreinar / total).toFixed(1)) : 0;
  const ticketMedioGeral = total > 0 ? Number((receitaPotencialMensal / total).toFixed(2)) : 0;
  const ticketMedioPagantes =
    mensalistasPagantes.length > 0
      ? Number(
          (
            mensalistasPagantes.reduce((acc, a) => acc + getValorPlano(a), 0) /
            mensalistasPagantes.length
          ).toFixed(2)
        )
      : 0;

  // ABA 1: MÉDIAS & ESTATÍSTICAS DE ALUNOS
  const mediasRows = [
    {
      'Métrica / Indicador Estatístico': 'Data de Emissão do Relatório de Alunos',
      'Resultado / Média': formatDateTimePtBr(now),
      'Valor Numérico': total,
      'Análise / Referência': `Filtro: ${params.filtroAplicado || 'TODOS'} | Emitido por: ${
        params.emitidoPor || 'Administração'
      }`,
    },
    {
      'Métrica / Indicador Estatístico': 'Total de Alunos Analisados',
      'Resultado / Média': `${total} aluno(s)`,
      'Valor Numérico': total,
      'Análise / Referência': `${ativosCount} Ativos (${
        total > 0 ? Math.round((ativosCount / total) * 100) : 100
      }%) | ${inativosCount} Inativos (${
        total > 0 ? Math.round((inativosCount / total) * 100) : 0
      }%)`,
    },
    {
      'Métrica / Indicador Estatístico': 'Média de Presenças no Mês por Aluno',
      'Resultado / Média': `${mediaPresencasPorAluno} treinos/mês`,
      'Valor Numérico': mediaPresencasPorAluno,
      'Análise / Referência': `Total acumulado de ${somaPresencasMes} check-ins no mês`,
    },
    {
      'Métrica / Indicador Estatístico': 'Média de Faltas no Mês por Aluno',
      'Resultado / Média': `${mediaFaltasPorAluno} faltas/mês`,
      'Valor Numérico': mediaFaltasPorAluno,
      'Análise / Referência': `Total acumulado de ${somaFaltasMes} faltas registradas`,
    },
    {
      'Métrica / Indicador Estatístico': 'Média Geral de Assiduidade (%)',
      'Resultado / Média': `${mediaAssiduidadePercentual}%`,
      'Valor Numérico': mediaAssiduidadePercentual,
      'Análise / Referência': 'Média percentual de frequência dos alunos matriculados',
    },
    {
      'Métrica / Indicador Estatístico': 'Média de Dias sem Treinar (Recência)',
      'Resultado / Média': `${mediaDiasSemTreinar} dias`,
      'Valor Numérico': mediaDiasSemTreinar,
      'Análise / Referência': 'Acima de 14 dias é classificado como Inativo (2+ semanas)',
    },
    {
      'Métrica / Indicador Estatístico': 'Ticket Médio por Aluno (Geral)',
      'Resultado / Média': formatarMoeda(ticketMedioGeral),
      'Valor Numérico': ticketMedioGeral,
      'Análise / Referência': `Receita potencial da lista: ${formatarMoeda(receitaPotencialMensal)}`,
    },
    {
      'Métrica / Indicador Estatístico': 'Ticket Médio (Somente Mensalistas Pagantes)',
      'Resultado / Média': formatarMoeda(ticketMedioPagantes),
      'Valor Numérico': ticketMedioPagantes,
      'Análise / Referência': `${mensalistasPagantes.length} mensalistas | ${bolsistasCount} bolsistas | ${conveniosCount} convênios/diárias`,
    },
    {
      'Métrica / Indicador Estatístico': 'Taxa de Adimplência da Lista (%)',
      'Resultado / Média': `${total > 0 ? ((emDiaCount / total) * 100).toFixed(1) : '100.0'}%`,
      'Valor Numérico': total > 0 ? Number(((emDiaCount / total) * 100).toFixed(1)) : 100,
      'Análise / Referência': `${emDiaCount} em dia/isentos vs. ${atrasadosCount} pendentes/atrasados`,
    },
  ];
  const wsMedias = XLSX.utils.json_to_sheet(mediasRows);
  autoFitWorksheetColumns(wsMedias, mediasRows);
  XLSX.utils.book_append_sheet(wb, wsMedias, '1. Médias e Indicadores');

  // ABA 2: BASE DETALHADA DE ALUNOS (COM COLUNAS NUMÉRICAS PARA FÓRMULAS NO EXCEL)
  const alunosDetalhadosRows = lista.map((a, idx) => {
    const isAtivo =
      a.statusAtividade === 'ATIVO' || (a.diasSemTreinar !== undefined && a.diasSemTreinar < 14);
    const valPlano = getValorPlano(a);
    return {
      '#': idx + 1,
      'Nome do Aluno': a.nome || '—',
      CPF: a.cpf || '—',
      'Telefone / WhatsApp': a.telefone || '—',
      'Plano / Convênio': a.plano || '2x na semana',
      'Graduação (Prajied)': a.prajied || a.graduacao || 'Branco',
      'Status Treino': isAtivo ? 'ATIVO' : 'INATIVO (14+ dias)',
      'Classificação Assiduidade': a.statusAssiduidade || 'ALTA',
      'Bolsista': a.is_bolsista ? 'SIM' : 'NÃO',
      'Status Mensalidade': a.is_bolsista
        ? 'BOLSISTA'
        : isDiariaOuConvenio(a.plano)
        ? 'CONVÊNIO / DIÁRIA'
        : a.status || 'PAGO',
      'Presenças no Mês (Nº)': Number(a.presencasMes || 0),
      'Faltas no Mês (Nº)': Number(a.faltasMes || 0),
      'Treinos na Semana (Nº)': Number(a.treinosSemana || 0),
      'Taxa de Presença (%)': Number(a.porcentagemPresenca ?? 100),
      'Dias sem Treinar (Nº)': Number(a.diasSemTreinar ?? 0),
      'Dias p/ Vencimento (Nº)':
        a.diasVencimento !== null && a.diasVencimento !== undefined ? Number(a.diasVencimento) : 0,
      'Valor Mensal Numérico (R$)': valPlano,
      'Valor Mensal Formatado': formatarMoeda(valPlano),
      'Data de Cadastro': formatDatePtBr(a.criadoEm || a.data_de_adesao),
    };
  });

  // Linha final de Média/Total na própria tabela de Alunos
  if (alunosDetalhadosRows.length > 0) {
    alunosDetalhadosRows.push({
      '#': total,
      'Nome do Aluno': 'MÉDIA / TOTAL GERAL DA BASE',
      CPF: '—',
      'Telefone / WhatsApp': '—',
      'Plano / Convênio': `${total} alunos`,
      'Graduação (Prajied)': '—',
      'Status Treino': `${ativosCount} Ativos / ${inativosCount} Inativos`,
      'Classificação Assiduidade': 'MÉDIA →',
      'Bolsista': `${bolsistasCount} Bolsistas`,
      'Status Mensalidade': `${emDiaCount} Em Dia`,
      'Presenças no Mês (Nº)': mediaPresencasPorAluno,
      'Faltas no Mês (Nº)': mediaFaltasPorAluno,
      'Treinos na Semana (Nº)': Number(
        (
          lista.reduce((acc, a) => acc + (Number(a.treinosSemana) || 0), 0) / Math.max(1, total)
        ).toFixed(2)
      ),
      'Taxa de Presença (%)': mediaAssiduidadePercentual,
      'Dias sem Treinar (Nº)': mediaDiasSemTreinar,
      'Dias p/ Vencimento (Nº)': 0,
      'Valor Mensal Numérico (R$)': receitaPotencialMensal,
      'Valor Mensal Formatado': `Total: ${formatarMoeda(receitaPotencialMensal)} (Média: ${formatarMoeda(
        ticketMedioGeral
      )})`,
      'Data de Cadastro': formatDatePtBr(now),
    });
  }

  const wsAlunos = XLSX.utils.json_to_sheet(
    alunosDetalhadosRows.length > 0
      ? alunosDetalhadosRows
      : [{ Aviso: 'Nenhum aluno encontrado.' }]
  );
  autoFitWorksheetColumns(wsAlunos, alunosDetalhadosRows);
  XLSX.utils.book_append_sheet(wb, wsAlunos, '2. Alunos e Médias');

  // ABA 3: DISTRIBUIÇÃO E MÉDIAS POR PLANO & GRADUAÇÃO
  const mapaPlanos: Record<
    string,
    { qtd: number; somaPresenca: number; somaTaxa: number; receita: number }
  > = {};
  lista.forEach((a) => {
    const chave = a.is_bolsista ? 'Bolsista Integral' : a.plano || '2x na semana';
    if (!mapaPlanos[chave]) {
      mapaPlanos[chave] = { qtd: 0, somaPresenca: 0, somaTaxa: 0, receita: 0 };
    }
    mapaPlanos[chave].qtd += 1;
    mapaPlanos[chave].somaPresenca += Number(a.presencasMes || 0);
    mapaPlanos[chave].somaTaxa += Number(a.porcentagemPresenca ?? 100);
    mapaPlanos[chave].receita += getValorPlano(a);
  });

  const porPlanoRows = Object.entries(mapaPlanos).map(([plano, info]) => ({
    'Plano / Modalidade': plano,
    'Quantidade de Alunos': info.qtd,
    'Participação (%)': total > 0 ? `${((info.qtd / total) * 100).toFixed(1)}%` : '0%',
    'Média de Presenças/Mês': Number((info.somaPresenca / Math.max(1, info.qtd)).toFixed(2)),
    'Média de Assiduidade (%)': Number((info.somaTaxa / Math.max(1, info.qtd)).toFixed(1)),
    'Receita Total do Grupo (R$)': Number(info.receita.toFixed(2)),
    'Receita Formatada': formatarMoeda(info.receita),
  }));

  const wsPlanos = XLSX.utils.json_to_sheet(
    porPlanoRows.length > 0 ? porPlanoRows : [{ Aviso: 'Sem dados por plano.' }]
  );
  autoFitWorksheetColumns(wsPlanos, porPlanoRows);
  XLSX.utils.book_append_sheet(wb, wsPlanos, '3. Médias por Plano');

  const dateTag = now.toISOString().split('T')[0];
  XLSX.writeFile(wb, `Boru_Relatorio_Alunos_e_Medias_${dateTag}.xlsx`);
}

// ============================================================================
// EXPORTAÇÃO ESPECIALIZADA 2: RELATÓRIO DE LEADS, AULAS EXP. & CONVERSÃO (.XLSX)
// ============================================================================
export function exportLeadsAnalyticsXlsx(params: {
  agendamentos: { pendentes?: any[]; posAula?: any[]; finalizados?: any[] };
  buscaFiltro?: string;
  emitidoPor?: string;
}): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();

  const pendentesRaw = params.agendamentos?.pendentes || [];
  const posAulaRaw = params.agendamentos?.posAula || [];
  const finalizadosRaw = params.agendamentos?.finalizados || [];

  const filtrarPorTermo = (lista: any[]) => {
    const q = (params.buscaFiltro || '').trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (ag) =>
        (ag.nome && ag.nome.toLowerCase().includes(q)) ||
        (ag.telefone && String(ag.telefone).toLowerCase().includes(q))
    );
  };

  const pendentes = filtrarPorTermo(pendentesRaw);
  const posAula = filtrarPorTermo(posAulaRaw);
  const finalizados = filtrarPorTermo(finalizadosRaw);
  const todosLeads = [...pendentes, ...posAula, ...finalizados];

  const totalLeads = todosLeads.length;
  const totalPendentes = pendentes.length;
  const totalPosAula = posAula.length;
  const totalConvertidos = finalizados.filter(
    (l) => l.status === 'FECHOU_CONTRATO' || l.status === 'MATRICULADO'
  ).length;
  const totalRealizaramAula = totalPosAula + totalConvertidos;

  const somaDiasPosAula = posAula.reduce((acc, l) => acc + (Number(l.diasDesdeAula) || 0), 0);
  const mediaDiasEsperaPosAula =
    totalPosAula > 0 ? Number((somaDiasPosAula / totalPosAula).toFixed(1)) : 0;
  const leadsQuentesAte3Dias = posAula.filter((l) => (Number(l.diasDesdeAula) || 0) <= 3).length;
  const leadsEsfriandoMais3Dias = Math.max(0, totalPosAula - leadsQuentesAte3Dias);

  const taxaComparecimento =
    totalLeads > 0 ? Number(((totalRealizaramAula / totalLeads) * 100).toFixed(1)) : 0;

  // Agrupamento por horário mais procurado
  const mapaHorarios: Record<string, number> = {};
  todosLeads.forEach((l) => {
    const h = (l.horario || 'Horário a definir').trim() || 'Horário a definir';
    mapaHorarios[h] = (mapaHorarios[h] || 0) + 1;
  });

  // ABA 1: RESUMO & MÉDIAS DO FUNIL DE LEADS
  const resumoLeadsRows = [
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Data e Hora de Emissão',
      'Valor / Média': formatDateTimePtBr(now),
      'Valor Numérico': totalLeads,
      'Observação Estratégica': `Emitido por: ${params.emitidoPor || 'Administração CT Borü'}`,
    },
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Total de Leads & Aulas Experimentais',
      'Valor / Média': `${totalLeads} lead(s)`,
      'Valor Numérico': totalLeads,
      'Observação Estratégica': `${totalPendentes} agendados | ${totalPosAula} em Pós-Aula (fechar contrato)`,
    },
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Leads Agendados (Aguardando Aula)',
      'Valor / Média': `${totalPendentes} lead(s)`,
      'Valor Numérico': totalPendentes,
      'Observação Estratégica':
        totalLeads > 0
          ? `${((totalPendentes / totalLeads) * 100).toFixed(1)}% do funil total`
          : '0%',
    },
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Leads no Pós-Aula (Prontos p/ Fechar Matrícula)',
      'Valor / Média': `${totalPosAula} lead(s)`,
      'Valor Numérico': totalPosAula,
      'Observação Estratégica': `${leadsQuentesAte3Dias} quentes (≤ 3 dias) | ${leadsEsfriandoMais3Dias} precisando de follow-up (> 3 dias)`,
    },
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Taxa de Comparecimento / Aula Realizada (%)',
      'Valor / Média': `${taxaComparecimento}%`,
      'Valor Numérico': taxaComparecimento,
      'Observação Estratégica': `${totalRealizaramAula} de ${totalLeads} leads já realizaram o treino experimental`,
    },
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Média de Dias desde a Aula Experimental (Pós-Aula)',
      'Valor / Média': `${mediaDiasEsperaPosAula} dias`,
      'Valor Numérico': mediaDiasEsperaPosAula,
      'Observação Estratégica': 'Tempo médio de espera para fechamento de contrato após a aula',
    },
    {
      'Indicador do Funil Comercial (CRM Borü)': 'Receita Mensal Potencial no Pós-Aula (Ticket R$ 150)',
      'Valor / Média': formatarMoeda(totalPosAula * 150),
      'Valor Numérico': totalPosAula * 150,
      'Observação Estratégica': 'Potencial imediato de faturamento recorrente caso convertidos',
    },
  ];
  const wsResumoLeads = XLSX.utils.json_to_sheet(resumoLeadsRows);
  autoFitWorksheetColumns(wsResumoLeads, resumoLeadsRows);
  XLSX.utils.book_append_sheet(wb, wsResumoLeads, '1. Médias e Funil Leads');

  // ABA 2: TODOS OS LEADS UNIFICADOS (PARA TABELA DINÂMICA E FILTROS NO EXCEL)
  const todosLeadsRows = [
    ...pendentes.map((ag, idx) => ({
      '#': idx + 1,
      'Etapa do Funil': '1. AULA AGENDADA (PENDENTE)',
      'Nome do Lead': ag.nome || '—',
      'Telefone / WhatsApp': ag.telefone || '—',
      'Data Prevista': ag.data || '—',
      'Horário Previsto': ag.horario || '—',
      'Professor Responsável': ag.professorNome || 'Felipe Borü',
      'Dias desde a Aula (Nº)': 0,
      'Prioridade Follow-up': 'CONFIRMAR PRESENÇA',
      Observação: ag.observacao || 'Aguardando realização da aula experimental',
      'Data de Cadastro': formatDatePtBr(ag.criadoEm),
    })),
    ...posAula.map((ag, idx) => {
      const dias = Number(ag.diasDesdeAula || 0);
      return {
        '#': pendentes.length + idx + 1,
        'Etapa do Funil': '2. PÓS-AULA (FECHAR CONTRATO)',
        'Nome do Lead': ag.nome || '—',
        'Telefone / WhatsApp': ag.telefone || '—',
        'Data Prevista': ag.data || 'Realizada',
        'Horário Previsto': ag.horario || '—',
        'Professor Responsável': ag.professorNome || 'Felipe Borü',
        'Dias desde a Aula (Nº)': dias,
        'Prioridade Follow-up': dias <= 3 ? '🔥 ALTA (Lead Quente ≤ 3d)' : '⚠️ URGENTE (Reativar > 3d)',
        Observação: ag.observacao || 'Fez aula experimental — chamar para fechar matrícula',
        'Data de Cadastro': formatDatePtBr(ag.dataRealizada || ag.criadoEm),
      };
    }),
  ];

  const wsTodosLeads = XLSX.utils.json_to_sheet(
    todosLeadsRows.length > 0
      ? todosLeadsRows
      : [{ Aviso: 'Nenhum lead encontrado para o filtro atual.' }]
  );
  autoFitWorksheetColumns(wsTodosLeads, todosLeadsRows);
  XLSX.utils.book_append_sheet(wb, wsTodosLeads, '2. Base Completa de Leads');

  // ABA 3: DISTRIBUIÇÃO POR HORÁRIO DE PREFERÊNCIA
  const horariosRows = Object.entries(mapaHorarios)
    .sort((a, b) => b[1] - a[1])
    .map(([horario, qtd]) => ({
      'Horário Procurado': horario,
      'Quantidade de Leads': qtd,
      'Participação (%)': totalLeads > 0 ? `${((qtd / totalLeads) * 100).toFixed(1)}%` : '0%',
    }));
  const wsHorarios = XLSX.utils.json_to_sheet(
    horariosRows.length > 0 ? horariosRows : [{ Aviso: 'Sem horários registrados.' }]
  );
  autoFitWorksheetColumns(wsHorarios, horariosRows);
  XLSX.utils.book_append_sheet(wb, wsHorarios, '3. Demanda por Horário');

  const dateTag = now.toISOString().split('T')[0];
  XLSX.writeFile(wb, `Boru_Relatorio_Leads_e_Conversao_${dateTag}.xlsx`);
}


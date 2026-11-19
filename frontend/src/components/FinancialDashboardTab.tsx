import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { RealEstateDepreciationPanel } from './RealEstateDepreciationPanel';

interface FinancialDashboardTabProps {
  onRefreshGlobal?: () => void;
  usuarioLogadoNome?: string;
}

const CATEGORIAS_ENTRADA = [
  { value: 'MENSALIDADE', label: '💳 Assinatura / Mensalidade de Aluno' },
  { value: 'MERCADO_LOJA', label: '🛍️ Venda do Mercado / Loja Borü' },
  { value: 'DIARIA_AVULSA', label: '⚡ Diária / Treino Avulso (R$ 40)' },
  { value: 'WELLHUB_TOTALPASS', label: '🎫 Repasse Wellhub (Gympass) / TotalPass' },
  { value: 'EXAME_GRADUACAO', label: '🥋 Taxa de Exame de Graduação (Prajied)' },
  { value: 'EVENTO_SEMINARIO', label: '🏆 Seminário / Evento / Aulão' },
  { value: 'OUTROS_ENTRADA', label: '➕ Outra Receita / Patrocínio' },
];

export const CATEGORIAS_DESPESAS = [
  // --- GRUPO 2.2: DESPESAS OPERACIONAIS (OPEX) / SERVIÇOS & APOIO ADMINISTRATIVO ---
  { value: 'SERVICOS_CONTABEIS', label: '📊 [2.2.1.01.002] Contabilidade - Serviço de Terceiro (PJ)' },
  { value: 'ASSESSORIA_JURIDICA', label: '⚖️ [2.2.1.01.001] Assessoria Jurídica e Contratual' },
  { value: 'AUDITORIA_LAUDOS', label: '📑 [2.2.1.01.003] Laudos, Certificações e Auditoria Externa' },
  { value: 'ALUGUEL_CONTAS', label: '🏢 [2.2.2.01.001] Aluguel, Energia, Água e Internet' },
  { value: 'MARKETING_SISTEMA', label: '📢 [2.2.2.01.002] Marketing, Tráfego Pago, Placas e Sistema' },
  { value: 'IMPOSTOS_TAXAS', label: '🏛️ [2.2.2.01.003] Impostos, Tributos e Taxas Bancárias' },
  { value: 'VIAGENS_LOGISTICA', label: '✈️ [2.2.2.01.004] Passagens, Diárias e Deslocamento' },

  // --- GRUPO 2.1: CUSTOS OPERACIONAIS DIRETOS (OPEX) ---
  { value: 'PAGAMENTO_PROFESSORES', label: '🥋 [2.1.1.01.001] Pagamento / Repasse de Professores e Equipe' },
  { value: 'SERVICOS_TECNICOS_PROJETO', label: '🛠️ [2.1.2.01.001] Consultoria e Serviços Técnicos Operacionais' },
  { value: 'DESENVOLVIMENTO_TERCEIRIZADO', label: '⚙️ [2.1.2.01.002] Manutenção de Sistemas e TI Terceirizada' },
  { value: 'LICENCAS_SOFTWARE_PROJETO', label: '💻 [2.1.3.01.001] Assinaturas de Softwares e Serviços Digitais' },
  { value: 'EQUIPAMENTOS_MANUTENCAO', label: '🥊 [2.1.3.01.002] Manutenção de Tatame, Sacos e Limpeza' },
  { value: 'ESTOQUE_MERCADO', label: '📦 [2.1.3.01.003] Compra de Estoque p/ Mercado (Luvas, Bebidas)' },
  { value: 'OUTRAS_DESPESAS', label: '🔴 [2.2.2.99.999] Outras Despesas Operacionais' },
  { value: 'OUTROS_GASTOS', label: '🔴 [2.2.2.99.999] Outras Despesas Operacionais' }, // Retrocompatibilidade com registros legados
];

export const CATEGORIAS_INVESTIMENTOS = [
  // --- GRUPO 2.3: INVESTIMENTOS DE CAPITAL (CAPEX) ---
  { value: 'CAPEX_IMOBILIZADO', label: '🏗️ [2.3.1.01.001] Obras, Reformas e Benfeitorias na Unidade (CAPEX)' },
  { value: 'INVESTIMENTO_EQUIPAMENTOS', label: '🥊 [2.3.1.01.002] Aquisição de Novos Tatames e Equipamentos' },
  { value: 'CAPEX_INTANGIVEL', label: '💡 [2.3.2.01.001] Tecnologia, Desenvolvimento de Software e App (CAPEX)' },
  { value: 'INVESTIMENTO_EXPANSAO', label: '🏢 [2.3.1.01.003] Expansão de Unidade e Infraestrutura' },
  { value: 'OUTROS_INVESTIMENTOS', label: '💎 [2.3.3.01.001] Outros Investimentos de Capital (CAPEX)' },
];

export const CATEGORIAS_SAIDA = [...CATEGORIAS_DESPESAS, ...CATEGORIAS_INVESTIMENTOS];

export const isInvestimento = (categoria: string) => {
  return [
    'CAPEX_IMOBILIZADO',
    'INVESTIMENTO_EQUIPAMENTOS',
    'CAPEX_INTANGIVEL',
    'INVESTIMENTO_EXPANSAO',
    'OUTROS_INVESTIMENTOS',
  ].includes(categoria);
};

const METODOS_PAGAMENTO = [
  { value: 'PIX', label: '💠 PIX' },
  { value: 'DINHEIRO', label: '💵 Dinheiro em Espécie' },
  { value: 'CARTAO_CREDITO', label: '💳 Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: '💳 Cartão de Débito' },
  { value: 'BOLETO_TRANSFERENCIA', label: '🏦 Transferência / Boleto' },
  { value: 'CONVENIO', label: '🎫 Convênio (Wellhub / TotalPass)' },
];

const formatarMoeda = (valor: number) =>
  (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const traduzirCategoria = (cat: string) => {
  const todas = [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA];
  const achou = todas.find((c) => c.value === cat);
  return achou ? achou.label : cat;
};

export const FinancialDashboardTab: React.FC<FinancialDashboardTabProps> = ({
  onRefreshGlobal,
  usuarioLogadoNome = 'Administração Borü',
}) => {
  const hojeIso = new Date().toISOString().split('T')[0];
  const [mesFiltro, setMesFiltro] = useState<number>(new Date().getMonth() + 1);
  const [anoFiltro, setAnoFiltro] = useState<number>(new Date().getFullYear());

  const [resumo, setResumo] = useState<any>(null);
  const [graficos, setGraficos] = useState<any>(null);
  const [patrimonioImobiliario, setPatrimonioImobiliario] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-Abas do ERP Financeiro:
  // 'graficos_bi' | 'livro_caixa' | 'mercado_pdv' | 'controle_gastos' | 'assinaturas_alunos' | 'patrimonio_imoveis'
  const [subAba, setSubAba] = useState<
    'graficos_bi' | 'livro_caixa' | 'mercado_pdv' | 'controle_gastos' | 'assinaturas_alunos' | 'patrimonio_imoveis'
  >('graficos_bi');

  // Filtro da Aba Despesas & Investimentos
  const [filtroClassificacaoSaida, setFiltroClassificacaoSaida] = useState<
    'TODAS' | 'DESPESAS' | 'INVESTIMENTOS'
  >('TODAS');

  // Filtros da Aba Assinaturas de Alunos
  const [buscaAluno, setBuscaAluno] = useState('');
  const [filtroStatusAluno, setFiltroStatusAluno] = useState<
    'TODOS' | 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'BOLSISTA'
  >('TODOS');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Filtros do Livro-Caixa
  const [buscaCaixa, setBuscaCaixa] = useState('');
  const [filtroTipoCaixa, setFiltroTipoCaixa] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [filtroCategoriaCaixa, setFiltroCategoriaCaixa] = useState<string>('TODAS');
  const [filtroMetodoCaixa, setFiltroMetodoCaixa] = useState<string>('TODOS');

  // Modal de Baixa Manual de Mensalidade (Individual ou Lote) com DatePicker
  const [modalBaixa, setModalBaixa] = useState<{
    aberto: boolean;
    modo: 'INDIVIDUAL' | 'LOTE';
    aluno?: any;
  }>({ aberto: false, modo: 'INDIVIDUAL' });
  const [dataPagamentoEscolhida, setDataPagamentoEscolhida] = useState<string>(hojeIso);
  const [valorPagamentoCustom, setValorPagamentoCustom] = useState<string>('');
  const [metodoBaixa, setMetodoBaixa] = useState<string>('PIX');
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);

  // Modal Universal de Lançamento Financeiro (Entrada, Venda do Mercado, Assinatura, Despesa ou Investimento)
  const [modalTransacao, setModalTransacao] = useState(false);
  const [buscaAlunoTransacao, setBuscaAlunoTransacao] = useState('');
  const [editandoTransacaoId, setEditandoTransacaoId] = useState<string | null>(null);
  const [salvandoTransacao, setSalvandoTransacao] = useState(false);
  const [formTransacao, setFormTransacao] = useState({
    tipo: 'ENTRADA' as 'ENTRADA' | 'SAIDA',
    categoria: 'MENSALIDADE',
    descricao: '',
    valor: '',
    data: hojeIso,
    metodoPagamento: 'PIX',
    status: 'CONFIRMADO',
    alunoId: '',
    produtoId: '',
    quantidade: '1',
    registradoPor: usuarioLogadoNome,
    observacao: '',
    renovarAssinaturaAluno: true,
    atualizarEstoqueProduto: true,
  });

  const carregarDadosFinanceiros = async (mes = mesFiltro, ano = anoFiltro) => {
    setLoading(true);
    try {
      const res = await adminApi.getFinancialDashboard({ mes, ano });
      setResumo(res.data.resumo);
      setGraficos(res.data.graficos);
      setPatrimonioImobiliario(res.data.patrimonioImobiliario || null);
      setRegistros(res.data.registros || []);
      setTransacoes(res.data.transacoes || []);
      setProdutos(res.data.produtos || []);
    } catch (error) {
      console.error('Erro ao carregar ERP financeiro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosFinanceiros(mesFiltro, anoFiltro);
  }, [mesFiltro, anoFiltro]);

  const mudarMes = (delta: number) => {
    let novoMes = mesFiltro + delta;
    let novoAno = anoFiltro;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }
    setMesFiltro(novoMes);
    setAnoFiltro(novoAno);
  };

  // =========================================================
  // ABERTURA RÁPIDA DE MODAIS DE LANÇAMENTO (MESTRE & GESTOR FINANCEIRO)
  // =========================================================
  const abrirLancamentoRapidoMestre = (preset: {
    tipo: 'ENTRADA' | 'SAIDA';
    categoria: string;
    descricao: string;
    valor?: string;
    observacao?: string;
  }) => {
    setEditandoTransacaoId(null);
    setFormTransacao({
      tipo: preset.tipo,
      categoria: preset.categoria,
      descricao: preset.descricao,
      valor: preset.valor || '',
      data: hojeIso,
      metodoPagamento: 'PIX',
      status: 'CONFIRMADO',
      alunoId: '',
      produtoId: '',
      quantidade: '1',
      registradoPor: usuarioLogadoNome,
      observacao: preset.observacao || '',
      renovarAssinaturaAluno: false,
      atualizarEstoqueProduto: false,
    });
    setModalTransacao(true);
  };

  const abrirModalNovoLancamento = (
    preset: 'ASSINATURA' | 'MERCADO' | 'DESPESA' | 'INVESTIMENTO' | 'EQUIPAMENTO' | 'GASTO' | 'LIVRE',
    produtoPreSelecionado?: any
  ) => {
    setEditandoTransacaoId(null);
    if (preset === 'ASSINATURA') {
      setFormTransacao({
        tipo: 'ENTRADA',
        categoria: 'MENSALIDADE',
        descricao: '',
        valor: '160',
        data: hojeIso,
        metodoPagamento: 'PIX',
        status: 'CONFIRMADO',
        alunoId: '',
        produtoId: '',
        quantidade: '1',
        registradoPor: usuarioLogadoNome,
        observacao: '',
        renovarAssinaturaAluno: true,
        atualizarEstoqueProduto: false,
      });
    } else if (preset === 'MERCADO') {
      const prod = produtoPreSelecionado || produtos[0] || null;
      setFormTransacao({
        tipo: 'ENTRADA',
        categoria: 'MERCADO_LOJA',
        descricao: prod ? `Venda Mercado: 1x ${prod.nome}` : 'Venda Balcão — Mercado Borü',
        valor: prod ? String(prod.preco) : '',
        data: hojeIso,
        metodoPagamento: 'PIX',
        status: 'CONFIRMADO',
        alunoId: '',
        produtoId: prod ? prod.id : '',
        quantidade: '1',
        registradoPor: usuarioLogadoNome,
        observacao: '',
        renovarAssinaturaAluno: false,
        atualizarEstoqueProduto: true,
      });
    } else if (preset === 'DESPESA' || preset === 'GASTO') {
      setFormTransacao({
        tipo: 'SAIDA',
        categoria: 'ALUGUEL_CONTAS',
        descricao: '',
        valor: '',
        data: hojeIso,
        metodoPagamento: 'PIX',
        status: 'CONFIRMADO',
        alunoId: '',
        produtoId: '',
        quantidade: '1',
        registradoPor: usuarioLogadoNome,
        observacao: '',
        renovarAssinaturaAluno: false,
        atualizarEstoqueProduto: false,
      });
    } else if (preset === 'EQUIPAMENTO') {
      setFormTransacao({
        tipo: 'SAIDA',
        categoria: 'INVESTIMENTO_EQUIPAMENTOS',
        descricao: '',
        valor: '',
        data: hojeIso,
        metodoPagamento: 'PIX',
        status: 'CONFIRMADO',
        alunoId: '',
        produtoId: '',
        quantidade: '1',
        registradoPor: usuarioLogadoNome,
        observacao: '',
        renovarAssinaturaAluno: false,
        atualizarEstoqueProduto: false,
      });
    } else if (preset === 'INVESTIMENTO') {
      setFormTransacao({
        tipo: 'SAIDA',
        categoria: 'CAPEX_IMOBILIZADO',
        descricao: '',
        valor: '',
        data: hojeIso,
        metodoPagamento: 'PIX',
        status: 'CONFIRMADO',
        alunoId: '',
        produtoId: '',
        quantidade: '1',
        registradoPor: usuarioLogadoNome,
        observacao: '',
        renovarAssinaturaAluno: false,
        atualizarEstoqueProduto: false,
      });
    } else {
      setFormTransacao({
        tipo: 'ENTRADA',
        categoria: 'DIARIA_AVULSA',
        descricao: 'Diária Avulsa de Treino',
        valor: '40',
        data: hojeIso,
        metodoPagamento: 'PIX',
        status: 'CONFIRMADO',
        alunoId: '',
        produtoId: '',
        quantidade: '1',
        registradoPor: usuarioLogadoNome,
        observacao: '',
        renovarAssinaturaAluno: false,
        atualizarEstoqueProduto: false,
      });
    }
    setModalTransacao(true);
  };

  const abrirEdicaoTransacao = (t: any) => {
    setEditandoTransacaoId(t.id);
    setFormTransacao({
      tipo: t.tipo === 'SAIDA' ? 'SAIDA' : 'ENTRADA',
      categoria: t.categoria || 'MENSALIDADE',
      descricao: t.descricao || '',
      valor: String(t.valor || ''),
      data: t.data ? new Date(t.data).toISOString().split('T')[0] : hojeIso,
      metodoPagamento: t.metodoPagamento || 'PIX',
      status: t.status || 'CONFIRMADO',
      alunoId: t.alunoId || '',
      produtoId: t.produtoId || '',
      quantidade: String(t.quantidade || 1),
      registradoPor: t.registradoPor || usuarioLogadoNome,
      observacao: t.observacao || '',
      renovarAssinaturaAluno: false,
      atualizarEstoqueProduto: false,
    });
    setModalTransacao(true);
  };

  const handleSalvarTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTransacao.descricao.trim() || !formTransacao.valor) {
      alert('Preencha a descrição e o valor do lançamento.');
      return;
    }

    setSalvandoTransacao(true);
    try {
      if (editandoTransacaoId) {
        await adminApi.updateFinancialTransaction(editandoTransacaoId, {
          tipo: formTransacao.tipo,
          categoria: formTransacao.categoria,
          descricao: formTransacao.descricao,
          valor: Number(formTransacao.valor),
          data: formTransacao.data,
          metodoPagamento: formTransacao.metodoPagamento,
          status: formTransacao.status,
          registradoPor: formTransacao.registradoPor,
          observacao: formTransacao.observacao,
        });
      } else {
        await adminApi.createFinancialTransaction({
          ...formTransacao,
          valor: Number(formTransacao.valor),
          quantidade: Number(formTransacao.quantidade || 1),
        });
      }
      setModalTransacao(false);
      await carregarDadosFinanceiros(mesFiltro, anoFiltro);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao salvar lançamento financeiro.');
    } finally {
      setSalvandoTransacao(false);
    }
  };

  const handleExcluirTransacao = async (t: any) => {
    if (!confirm(`Deseja realmente excluir o lançamento "${t.descricao}" (${formatarMoeda(t.valor)})?`)) {
      return;
    }
    try {
      await adminApi.deleteFinancialTransaction(t.id);
      await carregarDadosFinanceiros(mesFiltro, anoFiltro);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao excluir lançamento.');
    }
  };

  // =========================================================
  // BAIXA DE ASSINATURA (INDIVIDUAL OU LOTE) COM DATEPICKER
  // =========================================================
  const abrirModalBaixaIndividual = (reg: any) => {
    setDataPagamentoEscolhida(hojeIso);
    setValorPagamentoCustom(String(reg.valor || 160));
    setMetodoBaixa('PIX');
    setModalBaixa({ aberto: true, modo: 'INDIVIDUAL', aluno: reg });
  };

  const abrirModalBaixaLote = () => {
    if (selecionados.length === 0) {
      alert('Selecione pelo menos um aluno na tabela para dar baixa em lote.');
      return;
    }
    setDataPagamentoEscolhida(hojeIso);
    setValorPagamentoCustom('');
    setMetodoBaixa('PIX');
    setModalBaixa({ aberto: true, modo: 'LOTE' });
  };

  const confirmarBaixaPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataPagamentoEscolhida) {
      alert('Selecione a data do pagamento no calendário.');
      return;
    }

    setSalvandoBaixa(true);
    try {
      if (modalBaixa.modo === 'INDIVIDUAL' && modalBaixa.aluno) {
        await adminApi.registerPayment(modalBaixa.aluno.alunoId, {
          dataPagamento: dataPagamentoEscolhida,
          valor: valorPagamentoCustom ? Number(valorPagamentoCustom) : undefined,
          metodoPagamento: metodoBaixa,
        });
      } else if (modalBaixa.modo === 'LOTE') {
        await adminApi.batchRegisterPayment({
          alunoIds: selecionados,
          dataPagamento: dataPagamentoEscolhida,
          valorCustom: valorPagamentoCustom ? Number(valorPagamentoCustom) : undefined,
          metodoPagamento: metodoBaixa,
          registradoPor: usuarioLogadoNome,
        });
        setSelecionados([]);
      }

      setModalBaixa({ aberto: false, modo: 'INDIVIDUAL' });
      await carregarDadosFinanceiros(mesFiltro, anoFiltro);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao registrar baixa de pagamento.');
    } finally {
      setSalvandoBaixa(false);
    }
  };

  const alternarBolsista = async (reg: any) => {
    const novoValor = !reg.is_bolsista;
    if (
      !confirm(
        `Deseja definir ${reg.nome} como ${
          novoValor ? 'ALUNO BOLSISTA (Isento de mensalidades)' : 'ALUNO MENSALISTA REGULAR'
        }?`
      )
    ) {
      return;
    }
    try {
      await adminApi.toggleStudentBolsista(reg.alunoId, novoValor);
      await carregarDadosFinanceiros(mesFiltro, anoFiltro);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao atualizar status de bolsista.');
    }
  };

  // =========================================================
  // EXPORTAÇÃO CSV (EXCEL)
  // =========================================================
  const exportarLivroCaixaCSV = () => {
    const linhas = [
      ['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor (R$)', 'Metodo Pagamento', 'Status', 'Aluno', 'Produto', 'Registrado Por', 'Observacao'],
      ...transacoesFiltradas.map((t) => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.tipo,
        t.categoria,
        `"${(t.descricao || '').replace(/"/g, '""')}"`,
        String(t.valor.toFixed(2)).replace('.', ','),
        t.metodoPagamento || 'PIX',
        t.status || 'CONFIRMADO',
        `"${(t.alunoNome || '').replace(/"/g, '""')}"`,
        `"${(t.produtoNome || '').replace(/"/g, '""')}"`,
        `"${(t.registradoPor || '').replace(/"/g, '""')}"`,
        `"${(t.observacao || '').replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = '\uFEFF' + linhas.map((e) => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_boru_${String(mesFiltro).padStart(2, '0')}_${anoFiltro}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================
  // COLEÇÕES FILTRADAS
  // =========================================================
  const transacoesDoMes = transacoes.filter((t) => {
    const d = new Date(t.data);
    return d.getMonth() + 1 === mesFiltro && d.getFullYear() === anoFiltro;
  });

  const transacoesFiltradas = transacoesDoMes.filter((t) => {
    if (filtroTipoCaixa !== 'TODOS' && t.tipo !== filtroTipoCaixa) return false;
    if (filtroCategoriaCaixa !== 'TODAS' && t.categoria !== filtroCategoriaCaixa) return false;
    if (filtroMetodoCaixa !== 'TODOS' && t.metodoPagamento !== filtroMetodoCaixa) return false;
    const termo = buscaCaixa.trim().toLowerCase();
    if (!termo) return true;
    const nomeAlunoVinculado = t.alunoId
      ? (registros.find((r) => r.alunoId === t.alunoId)?.nome || '').toLowerCase()
      : '';
    return (
      (t.descricao && t.descricao.toLowerCase().includes(termo)) ||
      (t.alunoNome && t.alunoNome.toLowerCase().includes(termo)) ||
      (nomeAlunoVinculado && nomeAlunoVinculado.includes(termo)) ||
      (t.produtoNome && t.produtoNome.toLowerCase().includes(termo)) ||
      (t.registradoPor && t.registradoPor.toLowerCase().includes(termo)) ||
      (t.observacao && t.observacao.toLowerCase().includes(termo))
    );
  });

  const vendasMercadoMes = transacoesDoMes.filter(
    (t) => t.tipo === 'ENTRADA' && t.categoria === 'MERCADO_LOJA' && t.status !== 'CANCELADO'
  );

  const saidasMes = transacoesDoMes.filter((t) => t.tipo === 'SAIDA');
  const despesasMes = saidasMes.filter((t) => !isInvestimento(t.categoria));
  const investimentosMes = saidasMes.filter((t) => isInvestimento(t.categoria));

  const totalSaidasMes = saidasMes.reduce((acc, t) => acc + (t.valor || 0), 0);
  const totalDespesasMes = despesasMes.reduce((acc, t) => acc + (t.valor || 0), 0);
  const totalInvestimentosMes = investimentosMes.reduce((acc, t) => acc + (t.valor || 0), 0);

  const gastosMes = saidasMes; // Alias retrocompatível

  const registrosFiltrados = registros.filter((r) => {
    const termo = buscaAluno.trim().toLowerCase();
    const bateBusca =
      !termo ||
      (r.nome && r.nome.toLowerCase().includes(termo)) ||
      (r.cpf && r.cpf.toLowerCase().includes(termo)) ||
      (r.plano && r.plano.toLowerCase().includes(termo));
    if (!bateBusca) return false;
    if (filtroStatusAluno === 'TODOS') return true;
    if (filtroStatusAluno === 'BOLSISTA') return r.is_bolsista === true;
    return r.statusFinanceiro === filtroStatusAluno;
  });

  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / itensPorPagina));
  const registrosPaginados = registrosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const nomeMesFormatado = new Date(anoFiltro, mesFiltro - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* CABEÇALHO EXECUTIVO + SELETOR DE MÊS + BOTÕES DE LANÇAMENTO RÁPIDO */}
      <div className="bg-gradient-to-r from-[#141416] via-[#1A1A1E] to-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                ERP Financeiro & BI Completo
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                Acesso: Admin Geral & AdminDev
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              💰 Central Financeira, Mercado, Despesas & Investimentos
            </h2>
            <p className="text-xs text-zinc-400">
              Registre todas as assinaturas, vendas do Mercado Borü, despesas operacionais (OPEX) e investimentos de capital (CAPEX) com demonstrativos contábeis em tempo real.
            </p>
          </div>

          {/* Seletor de Mês/Ano e Exportação */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#0B0B0C] border border-zinc-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => mudarMes(-1)}
                className="px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                ←
              </button>
              <span className="px-3.5 py-2 text-xs font-black text-white border-x border-zinc-800 min-w-[140px] text-center">
                📅 {nomeMesFormatado}
              </span>
              <button
                type="button"
                onClick={() => mudarMes(1)}
                className="px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                →
              </button>
            </div>

            <button
              type="button"
              onClick={exportarLivroCaixaCSV}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
              title="Exportar planilha compatível com Excel (.CSV)"
            >
              📥 Exportar Excel (CSV)
            </button>
          </div>
        </div>

        {/* BARRA DE AÇÕES RÁPIDAS DO MESTRE & GESTOR FINANCEIRO (REGISTRAR TUDO EM 1 CLIQUE) */}
        <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('ASSINATURA')}
            className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition flex items-center gap-2.5 text-left group shadow-sm"
          >
            <span className="text-2xl">💳</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                + Registrar Assinatura
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-emerald-100">
                Aluno, Data e Renovação +30d
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('MERCADO')}
            className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 transition flex items-center gap-2.5 text-left group shadow-sm"
          >
            <span className="text-2xl">🛍️</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                + Venda Mercado (PDV)
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-zinc-900">
                Luvas, Bebidas e Baixa de Estoque
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('DESPESA')}
            className="p-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 transition flex items-center gap-2.5 text-left group shadow-sm"
          >
            <span className="text-2xl">🔴</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                + Gasto / Custo Fixo
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-red-100">
                Aluguel, Luz, Água, Equipe, Contas
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('EQUIPAMENTO')}
            className="p-3 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/40 transition flex items-center gap-2.5 text-left group shadow-sm"
          >
            <span className="text-2xl">🥊</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                + Adicionar Equipamento
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-orange-100">
                Luvas, Caneleiras, Tatames, Sacos
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('INVESTIMENTO')}
            className="p-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition flex items-center gap-2.5 text-left group shadow-sm"
          >
            <span className="text-2xl">💎</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                + Registrar Investimento
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-indigo-100">
                Obras, Reforma, Estrutura (CAPEX)
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('LIVRE')}
            className="p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 transition flex items-center gap-2.5 text-left group shadow-sm"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                + Diária / Exame / Entrada
              </span>
              <span className="text-[10px] text-zinc-400 group-hover:text-cyan-100">
                Diárias avulsas, Wellhub, Seminários
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 6 CARDS DE KPI EXECUTIVOS (RECEITA BRUTA, SAÍDAS/DESPESAS/INVESTIMENTOS, LUCRO LÍQUIDO, MERCADO, PREVISÃO E INADIMPLÊNCIA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-[#141416] border border-emerald-500/30 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
            🟢 Receita Bruta (Mês)
          </span>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">
            {formatarMoeda(resumo?.receitaRecebidaMes || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
             Planos: {formatarMoeda(resumo?.receitaMensalidadesMes || 0)} • Loja: {formatarMoeda(resumo?.receitaMercadoMes || 0)}
          </span>
        </div>

        <div className="bg-[#141416] border border-red-500/30 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
            🔻 Despesas & Investimentos (Mês)
          </span>
          <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">
            {formatarMoeda(resumo?.saidasTotaisMes || resumo?.gastosTotaisMes || totalSaidasMes)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Despesas: <strong className="text-zinc-200">{formatarMoeda(resumo?.despesasTotaisMes ?? totalDespesasMes)}</strong> • Invest.: <strong className="text-indigo-300">{formatarMoeda(resumo?.investimentosTotaisMes ?? totalInvestimentosMes)}</strong>
          </span>
        </div>

        <div
          className={`bg-[#141416] border rounded-xl p-4 ${
            (resumo?.lucroLiquidoMes || 0) >= 0 ? 'border-emerald-400/50' : 'border-red-500/60'
          }`}
        >
          <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">
            💎 Lucro Líquido Real
          </span>
          <p
            className={`text-xl sm:text-2xl font-black mt-1 ${
              (resumo?.lucroLiquidoMes || 0) >= 0 ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {formatarMoeda(resumo?.lucroLiquidoMes || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Margem: <strong className="text-white">{resumo?.margemLucroMes ?? 0}%</strong> • Ano:{' '}
            {formatarMoeda(resumo?.lucroAcumuladoAno || 0)}
          </span>
        </div>

        <div className="bg-[#141416] border border-amber-500/30 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
            🛍️ Vendas do Mercado
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
            {formatarMoeda(resumo?.receitaMercadoMes || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            {vendasMercadoMes.length} venda(s) de produtos no mês
          </span>
        </div>

        <div className="bg-[#141416] border border-cyan-500/30 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
            📊 Previsão Assinaturas
          </span>
          <p className="text-xl sm:text-2xl font-black text-cyan-300 mt-1">
            {formatarMoeda(resumo?.receitaPrevistaMes || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Falta receber: {formatarMoeda(resumo?.saldoPendenteMes || 0)}
          </span>
        </div>

        <div className="bg-[#141416] border border-purple-500/30 rounded-xl p-4">
          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
            ⚠️ Inadimplência & Bolsas
          </span>
          <p className="text-xl sm:text-2xl font-black text-red-400 mt-1">
            {formatarMoeda(resumo?.totalInadimplenteValor || 0)}
          </p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            {resumo?.countAtrasados || 0} atrasados • {resumo?.countBolsistas || 0} bolsistas
          </span>
        </div>
      </div>

      {/* NAVEGAÇÃO INTERNA DAS 6 SUB-ABAS DO ERP FINANCEIRO */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setSubAba('graficos_bi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
            subAba === 'graficos_bi'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          📊 Gráficos, Lucro, DRE & BI de Alunos
        </button>

        <button
          type="button"
          onClick={() => setSubAba('controle_gastos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
            subAba === 'controle_gastos'
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
              : 'bg-[#141416] text-red-400 hover:text-white border border-red-500/30'
          }`}
        >
          📉 Gastos, Custos, Equipamentos & Investimentos ({saidasMes.length})
        </button>

        <button
          type="button"
          onClick={() => setSubAba('livro_caixa')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
            subAba === 'livro_caixa'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          📒 Livro-Caixa Completo ({transacoesDoMes.length})
        </button>

        <button
          type="button"
          onClick={() => setSubAba('mercado_pdv')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
            subAba === 'mercado_pdv'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#141416] text-amber-400 hover:text-white border border-amber-500/30'
          }`}
        >
          🛍️ Pagamentos do Mercado & PDV ({vendasMercadoMes.length})
        </button>

        <button
          type="button"
          onClick={() => setSubAba('assinaturas_alunos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
            subAba === 'assinaturas_alunos'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
              : 'bg-[#141416] text-cyan-400 hover:text-white border border-cyan-500/30'
          }`}
        >
          👥 Assinaturas de Alunos & Baixa ({registros.length})
        </button>

        <button
          type="button"
          onClick={() => setSubAba('patrimonio_imoveis')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
            subAba === 'patrimonio_imoveis'
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-900/30'
              : 'bg-[#141416] text-amber-300 hover:text-white border border-amber-500/40'
          }`}
        >
          🥊 Equipamentos, Patrimônio & Depreciação
        </button>
      </div>

      {/* FAIXA EXECUTIVA LIMPA: GESTÃO DE EQUIPAMENTOS, GASTOS, CUSTOS & PATRIMÔNIO DO CT */}
      {subAba !== 'patrimonio_imoveis' && (
        <div className="bg-gradient-to-r from-[#16161B] via-[#141418] to-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-400 text-black">
                🥊 Equipamentos, Custos & Patrimônio CT
              </span>
              <span className="text-xs font-black text-white">
                Patrimônio Líquido Real Ajustado:{' '}
                <strong className="text-emerald-400">
                  {formatarMoeda(
                    resumo?.patrimonioLiquidoRealAjustado ?? (resumo?.lucroAcumuladoAno || 0)
                  )}
                </strong>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Equipamentos & Ativos Cadastrados:{' '}
              <strong className="text-zinc-200">
                {formatarMoeda(resumo?.custoTotalAquisicaoImoveis ?? 0)}
              </strong>{' '}
              • Valor Líquido Atual:{' '}
              <strong className="text-emerald-300">
                {formatarMoeda(resumo?.valorLiquidoAtualImoveis ?? 0)}
              </strong>{' '}
              • Desgaste/Depreciação Acumulada:{' '}
              <strong className="text-red-400">
                -{formatarMoeda(resumo?.desvalorizacaoImoveisLiquidaTotalRs ?? 0)} (-
                {resumo?.desvalorizacaoImoveisAcumuladaPct ?? 0}%)
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => abrirModalNovoLancamento('EQUIPAMENTO')}
              className="px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/40 text-xs font-black transition"
            >
              🥊 + Equipamento
            </button>
            <button
              type="button"
              onClick={() => abrirModalNovoLancamento('DESPESA')}
              className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-black transition"
            >
              🔴 + Gasto / Custo
            </button>
            <button
              type="button"
              onClick={() => setSubAba('patrimonio_imoveis')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-black transition"
            >
              🥊 Gerenciar Equipamentos & Patrimônio →
            </button>
          </div>
        </div>
      )}

      {subAba === 'patrimonio_imoveis' && (
        <RealEstateDepreciationPanel
          caixaOperacionalAcumulado={resumo?.lucroAcumuladoAno || 0}
          patrimonioInicialBackend={patrimonioImobiliario}
          onPortfolioChanged={() => carregarDadosFinanceiros(mesFiltro, anoFiltro)}
          onOpenQuickTransaction={(preset) => abrirModalNovoLancamento(preset)}
        />
      )}

      {/* =========================================================
          SUB-ABA 1: GRÁFICOS, LUCRO, DRE & BI DE ALUNOS MATRICULADOS
      ========================================================= */}
      {subAba === 'graficos_bi' && (
        <div className="space-y-6">
          {/* LINHA 1 DE GRÁFICOS: EVOLUÇÃO SEMESTRAL (RECEITA x SAÍDAS x LUCRO) + COMPOSIÇÃO DE RECEITAS/SAÍDAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* GRÁFICO 1: EVOLUÇÃO MENSAL DE CAIXA E LUCRO (BARRAS AGRUPADAS) */}
            <div className="lg:col-span-2 bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      📈 Evolução Financeira Semestral (Receitas vs Despesas & Invest. vs Lucro)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Comparativo mensal de receitas totais, despesas operacionais, investimentos e resultado líquido.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Entradas
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block"></span> Despesas & Invest.
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"></span> Lucro
                    </span>
                  </div>
                </div>

                {/* Renderização Visual de Barras Verticais Proporcionais */}
                {(() => {
                  const serie: any[] = graficos?.fluxoPorMes || [];
                  const maiorValor = Math.max(
                    100,
                    ...serie.map((s) => Math.max(s.entradas || 0, s.gastos || s.saidas || 0, Math.abs(s.lucro || 0)))
                  );

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 pt-6 px-2 bg-[#0B0B0C]/60 rounded-xl border border-zinc-800/80">
                        {serie.map((item, idx) => {
                          const hEntrada = Math.max(4, Math.round(((item.entradas || 0) / maiorValor) * 160));
                          const hSaida = Math.max(4, Math.round(((item.saidas || item.gastos || 0) / maiorValor) * 160));
                          const hLucro = Math.max(
                            4,
                            Math.round((Math.abs(item.lucro || 0) / maiorValor) * 160)
                          );

                          return (
                            <div key={idx} className="flex flex-col items-center h-full justify-end group">
                              <div className="text-[9px] text-zinc-400 font-bold mb-1 hidden sm:block">
                                {formatarMoeda(item.lucro)}
                              </div>
                              <div className="flex items-end justify-center gap-1 sm:gap-1.5 w-full">
                                <div
                                  style={{ height: `${hEntrada}px` }}
                                  className="w-3 sm:w-4 bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-t transition-all duration-500"
                                  title={`${item.mesLabel} • Receita Total: ${formatarMoeda(item.entradas)} (Planos: ${formatarMoeda(item.mensalidades)} | Mercado: ${formatarMoeda(item.mercado)})`}
                                />
                                <div
                                  style={{ height: `${hSaida}px` }}
                                  className="w-3 sm:w-4 bg-gradient-to-t from-red-800 to-red-500 rounded-t transition-all duration-500"
                                  title={`${item.mesLabel} • Saídas Totais (Despesas & Invest.): ${formatarMoeda(item.saidas || item.gastos)}`}
                                />
                                <div
                                  style={{ height: `${hLucro}px` }}
                                  className={`w-3 sm:w-4 rounded-t transition-all duration-500 ${
                                    item.lucro >= 0
                                      ? 'bg-gradient-to-t from-amber-600 to-amber-300'
                                      : 'bg-zinc-600'
                                  }`}
                                  title={`${item.mesLabel} • Lucro Líquido: ${formatarMoeda(item.lucro)}`}
                                />
                              </div>
                              <span className="text-[10px] sm:text-xs font-black text-zinc-300 mt-2 pb-2">
                                {item.mesLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mini-Tabela dos 6 Meses */}
                      <div className="overflow-x-auto rounded-xl border border-zinc-800">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#1A1A1E] text-zinc-400 uppercase">
                            <tr>
                              <th className="p-2.5">Mês/Ano</th>
                              <th className="p-2.5">Assinaturas</th>
                              <th className="p-2.5">Mercado Borü</th>
                              <th className="p-2.5">Outras Entradas</th>
                              <th className="p-2.5">Receita Bruta</th>
                              <th className="p-2.5">Despesas & Invest.</th>
                              <th className="p-2.5 text-right">Lucro Líquido</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {serie.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-900/40">
                                <td className="p-2.5 font-black text-white">{item.mesAno}</td>
                                <td className="p-2.5 text-emerald-300">{formatarMoeda(item.mensalidades)}</td>
                                <td className="p-2.5 text-amber-300">{formatarMoeda(item.mercado)}</td>
                                <td className="p-2.5 text-cyan-300">{formatarMoeda(item.outros)}</td>
                                <td className="p-2.5 font-bold text-white">{formatarMoeda(item.entradas)}</td>
                                <td className="p-2.5 text-red-400">{formatarMoeda(item.saidas || item.gastos)}</td>
                                <td
                                  className={`p-2.5 text-right font-black ${
                                    item.lucro >= 0 ? 'text-emerald-400' : 'text-red-500'
                                  }`}
                                >
                                  {formatarMoeda(item.lucro)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* COLUNA DIREITA: DRE MENSAL SIMPLIFICADO & DEMONSTRATIVO DE RECEITAS, DESPESAS E INVESTIMENTOS */}
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-base font-black text-white">
                  📑 DRE Contábil ({String(mesFiltro).padStart(2, '0')}/{anoFiltro})
                </h3>
                <p className="text-xs text-zinc-400">
                  Demonstrativo de Resultado do Exercício do CT Borü.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-zinc-300 font-semibold">(+) Receita de Assinaturas</span>
                  <strong className="text-emerald-400">
                    {formatarMoeda(resumo?.receitaMensalidadesMes || 0)}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20">
                  <span className="text-zinc-300 font-semibold">(+) Vendas do Mercado Borü</span>
                  <strong className="text-amber-300">
                    {formatarMoeda(resumo?.receitaMercadoMes || 0)}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
                  <span className="text-zinc-300 font-semibold">(+) Diárias / Convênios / Eventos</span>
                  <strong className="text-cyan-300">
                    {formatarMoeda(
                      (resumo?.receitaDiariasConveniosMes || 0) + (resumo?.receitaEventosExamesMes || 0)
                    )}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-900 border border-zinc-700 font-black">
                  <span className="text-white uppercase text-[11px]">(=) Receita Bruta Total</span>
                  <span className="text-emerald-400 text-sm">
                    {formatarMoeda(resumo?.receitaRecebidaMes || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-red-950/20 border border-red-500/20">
                  <div>
                    <span className="text-zinc-300 font-semibold block">(-) Despesas Operacionais (OPEX)</span>
                    <span className="text-[10px] text-zinc-500">Aluguel, contas, salários, manutenção, impostos</span>
                  </div>
                  <strong className="text-red-400">
                    - {formatarMoeda(resumo?.despesasTotaisMes ?? totalDespesasMes)}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
                  <div>
                    <span className="text-zinc-300 font-semibold block">(-) Investimentos de Capital (CAPEX)</span>
                    <span className="text-[10px] text-zinc-500">Obras, reformas, tatames, novos equipamentos, app</span>
                  </div>
                  <strong className="text-indigo-400">
                    - {formatarMoeda(resumo?.investimentosTotaisMes ?? totalInvestimentosMes)}
                  </strong>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
                  <span className="text-zinc-400 font-bold uppercase text-[10px]">(=) Total Saídas / Desembolsos</span>
                  <strong className="text-red-400 font-black">
                    - {formatarMoeda(resumo?.saidasTotaisMes || resumo?.gastosTotaisMes || totalSaidasMes)}
                  </strong>
                </div>

                <div
                  className={`flex justify-between items-center p-3.5 rounded-xl border-2 font-black ${
                    (resumo?.lucroLiquidoMes || 0) >= 0
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/50 text-red-300'
                  }`}
                >
                  <div>
                    <span className="uppercase text-xs block">(=) Lucro Líquido do Mês</span>
                    <span className="text-[10px] font-normal text-zinc-400">
                      Margem líquida: {resumo?.margemLucroMes ?? 0}%
                    </span>
                  </div>
                  <span className="text-base sm:text-lg">
                    {formatarMoeda(resumo?.lucroLiquidoMes || 0)}
                  </span>
                </div>
              </div>

              {/* Composição por Método de Pagamento */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                  💳 Recebimentos por Meio de Pagamento
                </h4>
                {Object.entries(graficos?.receitasPorMetodo || {}).length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic">
                    Registre pagamentos no mês para visualizar a proporção por PIX, Dinheiro e Cartão.
                  </p>
                ) : (
                  Object.entries(graficos?.receitasPorMetodo || {}).map(([metodo, valor]: any) => {
                    const total = Math.max(1, resumo?.receitaRecebidaMes || 1);
                    const pct = Math.min(100, Math.round((Number(valor) / total) * 100));
                    return (
                      <div key={metodo} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-zinc-300">{metodo}</span>
                          <span className="text-white">
                            {formatarMoeda(Number(valor))} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* LINHA 2: ACOMPANHAMENTO DE ALUNOS MATRICULADOS (TABELA ANALÍTICA POR PLANO + GRÁFICO DE GRADUAÇÃO) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* TABELA E GRÁFICO DE ALUNOS MATRICULADOS POR PLANO */}
            <div className="lg:col-span-2 bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    👥 Acompanhamento de Alunos Matriculados & Receita por Plano
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Distribuição de matrículas ativas, adimplência, inadimplência e faturamento por modalidade de plano.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-black text-white">
                  Total: {resumo?.totalAlunos || 0} Alunos
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Plano / Categoria</th>
                      <th className="p-3 text-center">Matriculados</th>
                      <th className="p-3 text-center">Em Dia</th>
                      <th className="p-3 text-center">Pendentes / Atraso</th>
                      <th className="p-3">Receita Prevista</th>
                      <th className="p-3">Receita Realizada</th>
                      <th className="p-3">Adimplência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {(graficos?.alunosPorPlano || []).map((pl: any, idx: number) => {
                      const taxaAdimp =
                        pl.totalAlunos > 0 ? Math.round((pl.pagos / pl.totalAlunos) * 100) : 100;
                      return (
                        <tr key={idx} className="hover:bg-zinc-900/40">
                          <td className="p-3 font-black text-white">{pl.plano}</td>
                          <td className="p-3 text-center font-bold text-zinc-200">{pl.totalAlunos}</td>
                          <td className="p-3 text-center font-bold text-emerald-400">{pl.pagos}</td>
                          <td className="p-3 text-center font-bold text-red-400">
                            {pl.pendentes + pl.atrasados}
                          </td>
                          <td className="p-3 text-zinc-300">{formatarMoeda(pl.receitaPotencial)}</td>
                          <td className="p-3 font-bold text-emerald-400">
                            {formatarMoeda(pl.receitaRealizada)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    taxaAdimp >= 75
                                      ? 'bg-emerald-500'
                                      : taxaAdimp >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${taxaAdimp}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-black text-white">{taxaAdimp}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DISTRIBUIÇÃO DE ALUNOS POR GRADUAÇÃO (PRAJIED) + RAIO-X DE DESPESAS & INVESTIMENTOS */}
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-black text-white border-b border-zinc-800 pb-2 mb-3">
                  🥋 Alunos por Graduação (Prajied)
                </h3>
                <div className="space-y-2.5">
                  {(graficos?.alunosPorPrajied || []).map((item: any, idx: number) => {
                    const total = Math.max(1, resumo?.totalAlunos || 1);
                    const pct = Math.round((item.quantidade / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-zinc-200">{item.prajied}</span>
                          <span className="text-amber-400">
                            {item.quantidade} aluno(s) ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-wider mb-2">
                  📉 Saídas por Categoria (Despesas & Investimentos)
                </h3>
                {Object.entries(graficos?.gastosPorCategoria || {}).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">
                    Nenhuma despesa ou investimento registrado neste mês até o momento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(graficos?.gastosPorCategoria || {}).map(([cat, val]: any) => {
                      const totalG = Math.max(1, resumo?.saidasTotaisMes || resumo?.gastosTotaisMes || 1);
                      const pct = Math.min(100, Math.round((Number(val) / totalG) * 100));
                      const ehInvest = isInvestimento(cat);
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-zinc-300 truncate max-w-[180px]">
                              {traduzirCategoria(cat)}
                            </span>
                            <span className={ehInvest ? 'text-indigo-400' : 'text-red-400'}>
                              {formatarMoeda(Number(val))} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ehInvest ? 'bg-indigo-500' : 'bg-red-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-ABA 2: LIVRO-CAIXA COMPLETO (RECEITAS, MERCADO, DESPESAS E INVESTIMENTOS)
      ========================================================= */}
      {subAba === 'livro_caixa' && (
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">
                📒 Livro-Caixa Geral ({nomeMesFormatado})
              </h3>
              <p className="text-xs text-zinc-400">
                Histórico auditável de todas as mensalidades, vendas de produtos da loja, diárias, despesas operacionais e investimentos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={buscaCaixa}
                onChange={(e) => setBuscaCaixa(e.target.value)}
                placeholder="🔍 Buscar descrição, aluno, produto..."
                className="bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white w-60"
              />
              <select
                value={filtroTipoCaixa}
                onChange={(e) => setFiltroTipoCaixa(e.target.value as any)}
                className="bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
              >
                <option value="TODOS">Todos (Entradas e Saídas)</option>
                <option value="ENTRADA">🟢 Apenas Entradas (Receitas)</option>
                <option value="SAIDA">🔴 Apenas Saídas (Despesas & Investimentos)</option>
              </select>
              <select
                value={filtroCategoriaCaixa}
                onChange={(e) => setFiltroCategoriaCaixa(e.target.value)}
                className="bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="TODAS">Todas as Categorias</option>
                {[...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA].map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={filtroMetodoCaixa}
                onChange={(e) => setFiltroMetodoCaixa(e.target.value)}
                className="bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="TODOS">Todos os Meios</option>
                {METODOS_PAGAMENTO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo / Categoria</th>
                  <th className="p-3">Descrição / Vínculo</th>
                  <th className="p-3">Meio Pagto.</th>
                  <th className="p-3">Registrado Por</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {transacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      Nenhum lançamento encontrado neste período para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  transacoesFiltradas.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-3 font-bold text-zinc-200 whitespace-nowrap">
                        {new Date(t.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            t.tipo === 'ENTRADA'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : isInvestimento(t.categoria)
                              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {t.tipo === 'ENTRADA'
                            ? '▲ RECEITA'
                            : isInvestimento(t.categoria)
                            ? '💎 INVESTIMENTO'
                            : '▼ DESPESA'}
                        </span>
                        <span className="block text-[10px] text-zinc-400 mt-1">
                          {traduzirCategoria(t.categoria)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{t.descricao}</div>
                        <div className="text-[10px] text-zinc-400">
                          {t.alunoNome && <span>👤 Aluno: {t.alunoNome} </span>}
                          {t.produtoNome && (
                            <span>
                              • 🛍️ Produto: {t.produtoNome} (x{t.quantidade || 1}){' '}
                            </span>
                          )}
                          {t.observacao && <span>• Obs: {t.observacao}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-[10px]">
                          {t.metodoPagamento || 'PIX'}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{t.registradoPor || 'Administração'}</td>
                      <td
                        className={`p-3 font-black text-sm whitespace-nowrap ${
                          t.tipo === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {t.tipo === 'ENTRADA' ? '+ ' : '- '}
                        {formatarMoeda(t.valor)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoTransacao(t)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirTransacao(t)}
                            className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-700 text-red-300 hover:text-white text-[11px] font-bold"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-ABA 3: PAGAMENTOS E VENDAS DO MERCADO BORÜ (PDV INTEGRADO)
      ========================================================= */}
      {subAba === 'mercado_pdv' && (
        <div className="space-y-5">
          <div className="bg-[#141416] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  🛍️ Ponto de Venda (PDV) — Mercado & Loja Borü
                </h3>
                <p className="text-xs text-zinc-400">
                  Clique em qualquer produto abaixo para registrar o pagamento da venda no balcão e descontar automaticamente do estoque.
                </p>
              </div>
              <button
                type="button"
                onClick={() => abrirModalNovoLancamento('MERCADO')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
              >
                ➕ Registrar Venda Personalizada do Mercado
              </button>
            </div>

            {/* Cards Rápidos de Produtos da Loja para Venda em 1 Clique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {produtos.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#1A1A1E] border border-zinc-800 hover:border-amber-500/50 rounded-xl p-3.5 flex flex-col justify-between transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-amber-400">
                        {prod.categoria?.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (prod.estoque || 0) > 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        Estoque: {prod.estoque ?? 0}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white mt-1">{prod.nome}</h4>
                    <p className="text-lg font-black text-emerald-400 mt-1">
                      {formatarMoeda(prod.preco || 0)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirModalNovoLancamento('MERCADO', prod)}
                    className="mt-3 w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-black transition"
                  >
                    🛒 Registrar Pagamento deste Item
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de Vendas do Mercado no Mês */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-black text-white">
                🧾 Histórico de Pagamentos Recebidos no Mercado ({nomeMesFormatado})
              </h4>
              <span className="text-sm font-black text-amber-400">
                Total Loja: {formatarMoeda(resumo?.receitaMercadoMes || 0)}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Item / Descrição</th>
                    <th className="p-3">Qtd</th>
                    <th className="p-3">Comprador (Aluno / Balcão)</th>
                    <th className="p-3">Meio Pagto.</th>
                    <th className="p-3">Registrado Por</th>
                    <th className="p-3">Valor Total</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {vendasMercadoMes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-500">
                        Nenhuma venda do Mercado registrada neste mês. Use os botões acima para lançar vendas!
                      </td>
                    </tr>
                  ) : (
                    vendasMercadoMes.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-bold text-white">
                          {new Date(v.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 font-bold text-amber-300">{v.descricao}</td>
                        <td className="p-3 text-zinc-300">{v.quantidade || 1} un.</td>
                        <td className="p-3 text-zinc-200">{v.alunoNome || 'Cliente Balcão'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold text-[10px]">
                            {v.metodoPagamento}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{v.registradoPor}</td>
                        <td className="p-3 font-black text-emerald-400">
                          {formatarMoeda(v.valor)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoTransacao(v)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold mr-1"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirTransacao(v)}
                            className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-700 text-red-300 text-[11px] font-bold"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-ABA 4: CONTROLE DE GASTOS, CUSTOS, EQUIPAMENTOS & INVESTIMENTOS DO CT
      ========================================================= */}
      {subAba === 'controle_gastos' && (
        <div className="bg-[#141416] border border-red-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                📉 Controle de Gastos, Custos, Equipamentos & Investimentos ({nomeMesFormatado})
              </h3>
              <p className="text-xs text-zinc-400">
                Central do Mestre e Gestor Financeiro: lance compras de equipamentos, manutenção, contas fixas, repasses e investimentos em 1 clique.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => abrirModalNovoLancamento('EQUIPAMENTO')}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-orange-900/30 flex items-center gap-1.5"
              >
                <span>🥊</span> + Adicionar Equipamento
              </button>
              <button
                type="button"
                onClick={() => abrirModalNovoLancamento('DESPESA')}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-900/30 flex items-center gap-1.5"
              >
                <span>🔴</span> + Registrar Gasto / Custo
              </button>
              <button
                type="button"
                onClick={() => abrirModalNovoLancamento('INVESTIMENTO')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-900/30 flex items-center gap-1.5"
              >
                <span>💎</span> + Registrar Investimento
              </button>
            </div>
          </div>

          {/* ATALHOS DE 1 CLIQUE PARA O MESTRE ADICIONAR EQUIPAMENTOS, GASTOS E CUSTOS */}
          <div className="bg-[#101014] border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                ⚡ Lançamento Rápido em 1 Clique (Equipamentos, Custos Fixos e Gastos do CT):
              </span>
              <span className="text-[10px] text-zinc-400">
                Clique em qualquer item para abrir o lançamento já preenchido
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                {
                  icon: '🥊',
                  titulo: 'Luvas & Caneleiras',
                  sub: 'Equipamento de Combate',
                  tipo: 'SAIDA' as const,
                  categoria: 'INVESTIMENTO_EQUIPAMENTOS',
                  descricao: 'Aquisição de Luvas, Caneleiras e Manoplas CT Borü',
                },
                {
                  icon: '🧱',
                  titulo: 'Tatame & Sacos',
                  sub: 'Aquisição / Estrutura',
                  tipo: 'SAIDA' as const,
                  categoria: 'INVESTIMENTO_EQUIPAMENTOS',
                  descricao: 'Aquisição de Tatame / Sacos de Pancada / Suportes',
                },
                {
                  icon: '🛠️',
                  titulo: 'Manutenção & Limpeza',
                  sub: 'Custo Operacional CT',
                  tipo: 'SAIDA' as const,
                  categoria: 'EQUIPAMENTOS_MANUTENCAO',
                  descricao: 'Manutenção de Tatame, Higienização e Insumos de Limpeza',
                },
                {
                  icon: '🏢',
                  titulo: 'Aluguel do CT',
                  sub: 'Custo Fixo Mensal',
                  tipo: 'SAIDA' as const,
                  categoria: 'ALUGUEL_CONTAS',
                  descricao: `Aluguel Mensal Galpão CT Borü — ${nomeMesFormatado}`,
                },
                {
                  icon: '⚡',
                  titulo: 'Energia / Água / Net',
                  sub: 'Contas Fixas da Unidade',
                  tipo: 'SAIDA' as const,
                  categoria: 'ALUGUEL_CONTAS',
                  descricao: `Conta de Energia / Água / Internet Fibra — ${nomeMesFormatado}`,
                },
                {
                  icon: '🥋',
                  titulo: 'Pagamento Professores',
                  sub: 'Repasse / Equipe Técnica',
                  tipo: 'SAIDA' as const,
                  categoria: 'PAGAMENTO_PROFESSORES',
                  descricao: `Pagamento / Repasse de Professores — ${nomeMesFormatado}`,
                },
                {
                  icon: '📦',
                  titulo: 'Estoque do Mercado',
                  sub: 'Bebidas, Luvas e Loja',
                  tipo: 'SAIDA' as const,
                  categoria: 'ESTOQUE_MERCADO',
                  descricao: 'Reposição de Estoque do Mercado Borü (Bebidas / Acessórios)',
                },
                {
                  icon: '❄️',
                  titulo: 'Ar-Condicionado / Som',
                  sub: 'Climatização & Conforto',
                  tipo: 'SAIDA' as const,
                  categoria: 'CAPEX_IMOBILIZADO',
                  descricao: 'Climatização / Ar-Condicionado / Infraestrutura do CT',
                },
                {
                  icon: '📢',
                  titulo: 'Marketing & Sistema',
                  sub: 'Anúncios, Placas e App',
                  tipo: 'SAIDA' as const,
                  categoria: 'MARKETING_SISTEMA',
                  descricao: 'Tráfego Pago / Marketing / Divulgação CT Borü',
                },
                {
                  icon: '🏛️',
                  titulo: 'Contabilidade & Taxas',
                  sub: 'Impostos, CNPJ e Banco',
                  tipo: 'SAIDA' as const,
                  categoria: 'IMPOSTOS_TAXAS',
                  descricao: `Impostos, Contabilidade e Taxas — ${nomeMesFormatado}`,
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => abrirLancamentoRapidoMestre(item)}
                  className="p-2.5 rounded-xl bg-[#18181F] hover:bg-red-600/20 border border-zinc-800 hover:border-red-500/50 text-left transition group flex items-start gap-2"
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-white group-hover:text-red-300 block truncate">
                      {item.titulo}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">{item.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cards de Resumo Rápido Contábil */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Total de Saídas / Desembolsos
              </span>
              <p className="text-lg font-black text-white mt-0.5">
                {formatarMoeda(totalSaidasMes)}
              </p>
              <span className="text-[10px] text-zinc-500">
                {saidasMes.length} lançamento(s) no mês
              </span>
            </div>
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-red-400 block">
                🔴 Despesas Operacionais (OPEX)
              </span>
              <p className="text-lg font-black text-red-400 mt-0.5">
                {formatarMoeda(totalDespesasMes)}
              </p>
              <span className="text-[10px] text-zinc-400">
                {despesasMes.length} despesa(s) de rotina
              </span>
            </div>
            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                💎 Investimentos de Capital (CAPEX)
              </span>
              <p className="text-lg font-black text-indigo-300 mt-0.5">
                {formatarMoeda(totalInvestimentosMes)}
              </p>
              <span className="text-[10px] text-zinc-400">
                {investimentosMes.length} investimento(s) estrutural(is)
              </span>
            </div>
          </div>

          {/* Filtros em Abas/Pills */}
          <div className="flex gap-2 border-b border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setFiltroClassificacaoSaida('TODAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filtroClassificacaoSaida === 'TODAS'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-[#1A1A1E] text-zinc-400 hover:text-white'
              }`}
            >
              Todas as Saídas ({saidasMes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroClassificacaoSaida('DESPESAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filtroClassificacaoSaida === 'DESPESAS'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#1A1A1E] text-red-400 hover:text-white border border-red-500/30'
              }`}
            >
              🔴 Despesas Operacionais ({despesasMes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroClassificacaoSaida('INVESTIMENTOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filtroClassificacaoSaida === 'INVESTIMENTOS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#1A1A1E] text-indigo-400 hover:text-white border border-indigo-500/30'
              }`}
            >
              💎 Investimentos ({investimentosMes.length})
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Classificação</th>
                  <th className="p-3">Rubrica / Categoria</th>
                  <th className="p-3">Descrição da Saída</th>
                  <th className="p-3">Meio Pagto.</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Registrado Por</th>
                  <th className="p-3">Valor Saída</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {(() => {
                  const lista = saidasMes.filter((g) => {
                    if (filtroClassificacaoSaida === 'DESPESAS') return !isInvestimento(g.categoria);
                    if (filtroClassificacaoSaida === 'INVESTIMENTOS') return isInvestimento(g.categoria);
                    return true;
                  });

                  if (lista.length === 0) {
                    return (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-zinc-500">
                          Nenhuma saída encontrada para este filtro no mês selecionado.
                        </td>
                      </tr>
                    );
                  }

                  return lista.map((g) => {
                    const ehInvest = isInvestimento(g.categoria);
                    return (
                      <tr key={g.id} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          {new Date(g.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                              ehInvest
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-red-500/20 text-red-300 border-red-500/40'
                            }`}
                          >
                            {ehInvest ? '💎 INVESTIMENTO' : '🔴 DESPESA'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-zinc-300">
                          {traduzirCategoria(g.categoria)}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{g.descricao}</div>
                          {g.observacao && (
                            <div className="text-[10px] text-zinc-400">{g.observacao}</div>
                          )}
                        </td>
                        <td className="p-3">{g.metodoPagamento}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.status === 'CONFIRMADO'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {g.status === 'CONFIRMADO' ? 'PAGO / QUITADO' : 'PENDENTE A PAGAR'}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{g.registradoPor}</td>
                        <td className={`p-3 font-black whitespace-nowrap ${ehInvest ? 'text-indigo-400' : 'text-red-400'}`}>
                          - {formatarMoeda(g.valor)}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoTransacao(g)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold mr-1"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirTransacao(g)}
                            className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-700 text-red-300 text-[11px] font-bold"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-ABA 5: ASSINATURAS DE ALUNOS, GRID & BAIXA MANUAL COM DATEPICKER
      ========================================================= */}
      {subAba === 'assinaturas_alunos' && (
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                👥 Controle de Assinaturas por Aluno Matriculado
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
                  {registrosFiltrados.length} alunos
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Selecione alunos para baixa em lote ou clique em "💵 Dar Baixa (+30d)" escolhendo a data real no Calendário.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={buscaAluno}
                onChange={(e) => {
                  setBuscaAluno(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="🔍 Buscar por nome, CPF ou plano..."
                className="bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white w-64"
              />
              {selecionados.length > 0 && (
                <button
                  type="button"
                  onClick={abrirModalBaixaLote}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-900/30"
                >
                  📅 Dar Baixa em Lote ({selecionados.length})
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'TODOS', label: `Todos (${registros.length})` },
              { id: 'PAGO', label: `🟢 Em Dia (${resumo?.countPagos || 0})` },
              { id: 'PENDENTE', label: `🟡 Pendentes (${resumo?.countPendentes || 0})` },
              { id: 'ATRASADO', label: `🔴 Inadimplentes (${resumo?.countAtrasados || 0})` },
              { id: 'BOLSISTA', label: `🎓 Bolsistas (${resumo?.countBolsistas || 0})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFiltroStatusAluno(f.id as any);
                  setPaginaAtual(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                  filtroStatusAluno === f.id
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        registrosPaginados.length > 0 &&
                        registrosPaginados.every((r) => selecionados.includes(r.alunoId))
                      }
                      onChange={() => {
                        const idsPagina = registrosPaginados
                          .filter((r) => !r.is_bolsista)
                          .map((r) => r.alunoId);
                        const todosMarcados = idsPagina.every((id) => selecionados.includes(id));
                        if (todosMarcados) {
                          setSelecionados((prev) => prev.filter((id) => !idsPagina.includes(id)));
                        } else {
                          setSelecionados((prev) => Array.from(new Set([...prev, ...idsPagina])));
                        }
                      }}
                      className="rounded bg-zinc-800 border-zinc-700"
                    />
                  </th>
                  <th className="p-3">Aluno / Adesão</th>
                  <th className="p-3">Plano & Valor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Vencimento / Último Pagto.</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400">
                      Carregando registros...
                    </td>
                  </tr>
                ) : registrosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      Nenhum aluno encontrado para este filtro.
                    </td>
                  </tr>
                ) : (
                  registrosPaginados.map((reg) => {
                    const marcado = selecionados.includes(reg.alunoId);
                    return (
                      <tr
                        key={reg.alunoId}
                        className={`hover:bg-zinc-800/30 transition ${
                          marcado ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            disabled={reg.is_bolsista}
                            checked={marcado}
                            onChange={() =>
                              setSelecionados((prev) =>
                                prev.includes(reg.alunoId)
                                  ? prev.filter((id) => id !== reg.alunoId)
                                  : [...prev, reg.alunoId]
                              )
                            }
                            className="rounded bg-zinc-800 border-zinc-700 disabled:opacity-30"
                          />
                        </td>
                        <td className="p-3 font-bold text-white">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{reg.nome}</span>
                            {reg.is_bolsista && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                🎓 BOLSISTA (ISENTO)
                              </span>
                            )}
                            {reg.has_signed_contract && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                📄 Contrato OK
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                            CPF: {reg.cpf || 'N/A'} • Tel: {reg.telefone || 'N/A'}
                            {reg.diaVencimentoFixo && (
                              <span className="text-zinc-400 ml-2">
                                • Venc. Fixo: Dia {reg.diaVencimentoFixo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-zinc-200">{reg.plano}</div>
                          <div className="text-xs text-emerald-400 font-black">
                            {reg.is_bolsista ? 'R$ 0,00 (Isento)' : formatarMoeda(reg.valor || 0)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase border ${
                              reg.statusFinanceiro === 'PAGO'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : reg.statusFinanceiro === 'BOLSISTA'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : reg.statusFinanceiro === 'CONVENIO_DIARIA'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : reg.statusFinanceiro === 'ATRASADO'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {reg.statusFinanceiro}
                          </span>
                          {reg.diasAtraso > 0 && !reg.is_bolsista && (
                            <span className="block text-[10px] text-red-400 font-bold mt-1">
                              Vencido há {reg.diasAtraso} dia(s)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-zinc-300">
                          {reg.is_bolsista ? (
                            <span className="text-purple-300 font-semibold">
                              Acesso Vitalício / Bolsista
                            </span>
                          ) : (
                            <>
                              <div>
                                Venc.:{' '}
                                <strong>
                                  {reg.dataVencimento
                                    ? new Date(reg.dataVencimento).toLocaleDateString('pt-BR')
                                    : 'Sem fatura'}
                                </strong>
                              </div>
                              {reg.dataPagamento && (
                                <div className="text-[11px] text-emerald-400">
                                  Pago em: {new Date(reg.dataPagamento).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {!reg.is_bolsista && (
                              <button
                                type="button"
                                onClick={() => abrirModalBaixaIndividual(reg)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 text-xs font-black transition"
                              >
                                💵 Dar Baixa (+30d)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => alternarBolsista(reg)}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${
                                reg.is_bolsista
                                  ? 'bg-purple-600 text-white border-purple-500'
                                  : 'bg-zinc-900 hover:bg-purple-950/50 text-zinc-400 hover:text-purple-300 border-zinc-700'
                              }`}
                            >
                              🎓 {reg.is_bolsista ? 'Bolsista Ativo' : 'Tornar Bolsista'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
              <span>
                Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL UNIVERSAL: REGISTRAR / EDITAR QUALQUER TRANSAÇÃO (ASSINATURA, MERCADO, DESPESA OU INVESTIMENTO)
      ========================================================= */}
      {modalTransacao && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">
                  {editandoTransacaoId ? 'Editar Lançamento Financeiro' : 'Novo Lançamento no Caixa'}
                </span>
                <h3 className="text-lg font-black text-white">
                  {formTransacao.tipo === 'SAIDA'
                    ? isInvestimento(formTransacao.categoria)
                      ? '💎 Registrar Investimento de Capital (CAPEX)'
                      : '🔴 Registrar Despesa Operacional (OPEX)'
                    : formTransacao.categoria === 'MERCADO_LOJA'
                    ? '🛍️ Registrar Pagamento do Mercado Borü'
                    : '💳 Registrar Receita / Assinatura'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalTransacao(false)}
                className="text-zinc-500 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarTransacao} className="space-y-3.5">
              {/* Seletor 3 Vias: Receita vs Despesa vs Investimento */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormTransacao({
                      ...formTransacao,
                      tipo: 'ENTRADA',
                      categoria: 'MENSALIDADE',
                    })
                  }
                  className={`py-2.5 px-1 rounded-xl font-black text-xs uppercase border transition flex items-center justify-center gap-1 ${
                    formTransacao.tipo === 'ENTRADA'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/30'
                      : 'bg-[#1A1A1E] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  🟢 Receita (+)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormTransacao({
                      ...formTransacao,
                      tipo: 'SAIDA',
                      categoria: isInvestimento(formTransacao.categoria)
                        ? 'ALUGUEL_CONTAS'
                        : formTransacao.categoria,
                    })
                  }
                  className={`py-2.5 px-1 rounded-xl font-black text-xs uppercase border transition flex items-center justify-center gap-1 ${
                    formTransacao.tipo === 'SAIDA' && !isInvestimento(formTransacao.categoria)
                      ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-900/30'
                      : 'bg-[#1A1A1E] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  🔴 Despesa (-)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormTransacao({
                      ...formTransacao,
                      tipo: 'SAIDA',
                      categoria: isInvestimento(formTransacao.categoria)
                        ? formTransacao.categoria
                        : 'INVESTIMENTO_EQUIPAMENTOS',
                    })
                  }
                  className={`py-2.5 px-1 rounded-xl font-black text-xs uppercase border transition flex items-center justify-center gap-1 ${
                    formTransacao.tipo === 'SAIDA' && isInvestimento(formTransacao.categoria)
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-900/30'
                      : 'bg-[#1A1A1E] text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  🥊 Equip. / Invest. (-)
                </button>
              </div>

              {/* Atalhos Rápidos de 1 Clique para o Mestre dentro do Modal */}
              {formTransacao.tipo === 'SAIDA' && (
                <div className="bg-[#101014] border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    ⚡ Preencher Rápido (Clique para preencher Categoria e Descrição):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: '🥊 Luvas / Caneleiras',
                        cat: 'INVESTIMENTO_EQUIPAMENTOS',
                        desc: 'Aquisição de Luvas, Caneleiras e Manoplas CT Borü',
                      },
                      {
                        label: '🧱 Tatame / Sacos',
                        cat: 'INVESTIMENTO_EQUIPAMENTOS',
                        desc: 'Aquisição de Tatame / Sacos de Pancada',
                      },
                      {
                        label: '🛠️ Manutenção / Limpeza',
                        cat: 'EQUIPAMENTOS_MANUTENCAO',
                        desc: 'Manutenção de Tatame, Equipamentos e Limpeza',
                      },
                      {
                        label: '🏢 Aluguel',
                        cat: 'ALUGUEL_CONTAS',
                        desc: `Aluguel Mensal do CT — ${nomeMesFormatado}`,
                      },
                      {
                        label: '⚡ Energia / Água / Net',
                        cat: 'ALUGUEL_CONTAS',
                        desc: `Conta de Energia / Água / Internet — ${nomeMesFormatado}`,
                      },
                      {
                        label: '🥋 Professores',
                        cat: 'PAGAMENTO_PROFESSORES',
                        desc: `Pagamento / Repasse de Professores — ${nomeMesFormatado}`,
                      },
                      {
                        label: '📦 Estoque Mercado',
                        cat: 'ESTOQUE_MERCADO',
                        desc: 'Compra de Estoque p/ Mercado Borü (Bebidas/Loja)',
                      },
                      {
                        label: '🏗️ Reforma / Estrutura',
                        cat: 'CAPEX_IMOBILIZADO',
                        desc: 'Obra / Reforma / Climatização na Unidade',
                      },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFormTransacao({
                            ...formTransacao,
                            tipo: 'SAIDA',
                            categoria: p.cat,
                            descricao: p.desc,
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-[#1A1A22] hover:bg-red-600 text-zinc-200 hover:text-white border border-zinc-700/80 text-[10px] font-bold transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categoria */}
              <div>
                <label className="block text-zinc-300 text-xs font-bold mb-1">
                  {formTransacao.tipo === 'ENTRADA'
                    ? 'Categoria de Receita'
                    : isInvestimento(formTransacao.categoria)
                    ? 'Rubrica Contábil do Investimento (CAPEX)'
                    : 'Rubrica Contábil da Despesa Operacional (OPEX)'}
                </label>
                <select
                  value={formTransacao.categoria}
                  onChange={(e) =>
                    setFormTransacao({ ...formTransacao, categoria: e.target.value })
                  }
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                >
                  {(formTransacao.tipo === 'ENTRADA'
                    ? CATEGORIAS_ENTRADA
                    : isInvestimento(formTransacao.categoria)
                    ? CATEGORIAS_INVESTIMENTOS
                    : CATEGORIAS_DESPESAS
                  ).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Se for Venda do Mercado ou Compra de Estoque, permite escolher o Produto */}
              {(formTransacao.categoria === 'MERCADO_LOJA' ||
                formTransacao.categoria === 'ESTOQUE_MERCADO') && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-amber-300 text-[11px] font-bold mb-1">
                        🛍️ Produto do Mercado Borü
                      </label>
                      <select
                        value={formTransacao.produtoId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const prod = produtos.find((p) => p.id === pId);
                          const qtd = Number(formTransacao.quantidade || 1);
                          setFormTransacao({
                            ...formTransacao,
                            produtoId: pId,
                            descricao: prod
                              ? `${
                                  formTransacao.tipo === 'SAIDA'
                                    ? 'Compra Estoque'
                                    : 'Venda Mercado'
                                }: ${qtd}x ${prod.nome}`
                              : formTransacao.descricao,
                            valor: prod
                              ? String((prod.preco * qtd).toFixed(2))
                              : formTransacao.valor,
                          });
                        }}
                        className="w-full bg-[#141416] border border-zinc-700 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="">-- Item Personalizado / Avulso --</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {formatarMoeda(p.preco)} (Est: {p.estoque})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-amber-300 text-[11px] font-bold mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formTransacao.quantidade}
                        onChange={(e) => {
                          const qtd = Math.max(1, Number(e.target.value || 1));
                          const prod = produtos.find((p) => p.id === formTransacao.produtoId);
                          setFormTransacao({
                            ...formTransacao,
                            quantidade: String(qtd),
                            descricao: prod
                              ? `${
                                  formTransacao.tipo === 'SAIDA'
                                    ? 'Compra Estoque'
                                    : 'Venda Mercado'
                                }: ${qtd}x ${prod.nome}`
                              : formTransacao.descricao,
                            valor: prod
                              ? String((prod.preco * qtd).toFixed(2))
                              : formTransacao.valor,
                          });
                        }}
                        className="w-full bg-[#141416] border border-zinc-700 rounded-lg p-2 text-xs text-white font-bold"
                      />
                    </div>
                  </div>
                  {!editandoTransacaoId && formTransacao.produtoId && (
                    <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formTransacao.atualizarEstoqueProduto}
                        onChange={(e) =>
                          setFormTransacao({
                            ...formTransacao,
                            atualizarEstoqueProduto: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span>
                        {formTransacao.tipo === 'ENTRADA'
                          ? 'Descontar quantidade automaticamente do estoque da loja'
                          : 'Somar quantidade comprada ao estoque da loja'}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Vínculo opcional com Aluno (para Assinaturas, Mercado, Diárias ou Exames) */}
              {formTransacao.tipo === 'ENTRADA' && (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-zinc-300 text-[11px] font-bold">
                      👤 Vincular a um Aluno Matriculado (Opcional para Loja/Diária)
                    </label>
                    {formTransacao.alunoId && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        ✓ Vinculado
                      </span>
                    )}
                  </div>

                  {(() => {
                    const alunoVinculado = registros.find((r) => r.alunoId === formTransacao.alunoId);
                    const alunosFiltrados = registros.filter((r) => {
                      if (!buscaAlunoTransacao.trim()) return true;
                      const termo = buscaAlunoTransacao.trim().toLowerCase();
                      return (
                        r.nome.toLowerCase().includes(termo) ||
                        (r.cpf && r.cpf.includes(termo)) ||
                        (r.plano && r.plano.toLowerCase().includes(termo))
                      );
                    });

                    if (alunoVinculado) {
                      return (
                        <div className="bg-[#141416] border border-emerald-500/50 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-xs shrink-0">
                              ✓
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold text-white block truncate">{alunoVinculado.nome}</span>
                              <span className="text-[10px] text-zinc-400 block truncate">
                                {alunoVinculado.plano} • Mensalidade: {formatarMoeda(alunoVinculado.valor)} {alunoVinculado.is_bolsista ? '• (Bolsista)' : ''}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormTransacao({ ...formTransacao, alunoId: '' });
                              setBuscaAlunoTransacao('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 text-[11px] font-bold border border-red-700/50 transition shrink-0"
                          >
                            ✕ Trocar
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={buscaAlunoTransacao}
                            onChange={(e) => setBuscaAlunoTransacao(e.target.value)}
                            placeholder="🔍 Digite para pesquisar aluno por nome ou CPF..."
                            className="w-full bg-[#141416] border border-zinc-700 focus:border-red-500 rounded-lg pl-3 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                          />
                          {buscaAlunoTransacao && (
                            <button
                              type="button"
                              onClick={() => setBuscaAlunoTransacao('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="max-h-48 overflow-y-auto boru-scrollbar rounded-lg border border-zinc-800 bg-[#141416] divide-y divide-zinc-800/60 shadow-inner">
                          <button
                            type="button"
                            onClick={() => {
                              setFormTransacao({ ...formTransacao, alunoId: '' });
                              setBuscaAlunoTransacao('');
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/40 flex items-center justify-between transition"
                          >
                            <span className="italic">-- Sem vínculo / Cliente Balcão --</span>
                            <span className="text-[10px] text-zinc-500 font-bold">Avulso</span>
                          </button>
                          {alunosFiltrados.slice(0, 35).map((r) => (
                            <button
                              key={r.alunoId}
                              type="button"
                              onClick={() => {
                                setFormTransacao({
                                  ...formTransacao,
                                  alunoId: r.alunoId,
                                  descricao:
                                    formTransacao.categoria === 'MENSALIDADE'
                                      ? `Mensalidade (${r.plano}) — ${r.nome}`
                                      : formTransacao.descricao,
                                  valor:
                                    formTransacao.categoria === 'MENSALIDADE' && r.valor
                                      ? String(r.valor)
                                      : formTransacao.valor,
                                });
                                setBuscaAlunoTransacao('');
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-red-950/30 hover:border-l-2 hover:border-red-500 flex items-center justify-between transition group"
                            >
                              <div className="truncate pr-2">
                                <span className="font-bold text-white group-hover:text-red-300 block truncate">{r.nome}</span>
                                <span className="text-[10px] text-zinc-400 block truncate">
                                  {r.plano} • {formatarMoeda(r.valor)} {r.is_bolsista ? '• Bolsista' : ''}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-red-400 whitespace-nowrap shrink-0">
                                Vincular →
                              </span>
                            </button>
                          ))}
                          {alunosFiltrados.length === 0 && (
                            <div className="p-3 text-center text-xs text-zinc-500">
                              Nenhum aluno encontrado com "{buscaAlunoTransacao}".
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {!editandoTransacaoId &&
                    formTransacao.alunoId &&
                    formTransacao.categoria === 'MENSALIDADE' && (
                      <label className="flex items-center gap-2 text-[11px] text-emerald-300 font-semibold cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={formTransacao.renovarAssinaturaAluno}
                          onChange={(e) =>
                            setFormTransacao({
                              ...formTransacao,
                              renovarAssinaturaAluno: e.target.checked,
                            })
                          }
                          className="rounded accent-emerald-500"
                        />
                        <span>
                          Renovar automaticamente a vigência da assinatura do aluno por +30 dias
                        </span>
                      </label>
                    )}
                </div>
              )}

              {/* Descrição e Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-300 text-xs font-bold mb-1">
                    Descrição Detalhada *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTransacao.descricao}
                    onChange={(e) =>
                      setFormTransacao({ ...formTransacao, descricao: e.target.value })
                    }
                    placeholder="Ex: Conta de Energia, Luva 14oz, Mensalidade..."
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-emerald-300 text-xs font-black mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formTransacao.valor}
                    onChange={(e) => setFormTransacao({ ...formTransacao, valor: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#1A1A1E] border-2 border-emerald-500/40 rounded-xl px-3 py-2 text-sm text-white font-black"
                  />
                </div>
              </div>

              {/* Data (DatePicker), Meio de Pagamento e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-amber-300 text-xs font-bold mb-1">
                    📅 Data (Calendário)
                  </label>
                  <input
                    type="date"
                    required
                    value={formTransacao.data}
                    onChange={(e) => setFormTransacao({ ...formTransacao, data: e.target.value })}
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 text-xs font-bold mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    value={formTransacao.metodoPagamento}
                    onChange={(e) =>
                      setFormTransacao({ ...formTransacao, metodoPagamento: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                  >
                    {METODOS_PAGAMENTO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 text-xs font-bold mb-1">Situação</label>
                  <select
                    value={formTransacao.status}
                    onChange={(e) =>
                      setFormTransacao({ ...formTransacao, status: e.target.value })
                    }
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                  >
                    <option value="CONFIRMADO">✓ Confirmado / Pago</option>
                    <option value="PENDENTE">⏳ Pendente / Agendado</option>
                  </select>
                </div>
              </div>

              {/* Registrado Por & Observação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">
                    Responsável pelo Registro
                  </label>
                  <input
                    type="text"
                    value={formTransacao.registradoPor}
                    onChange={(e) =>
                      setFormTransacao({ ...formTransacao, registradoPor: e.target.value })
                    }
                    placeholder="Ex: Amanda Alencar / Felipe Borü"
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">
                    Observação / Comprovante (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formTransacao.observacao}
                    onChange={(e) =>
                      setFormTransacao({ ...formTransacao, observacao: e.target.value })
                    }
                    placeholder="Ex: Nota fiscal, PIX na recepção..."
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalTransacao(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoTransacao}
                  className={`px-5 py-2 rounded-lg text-white text-xs font-black uppercase tracking-wider shadow-lg ${
                    formTransacao.tipo === 'SAIDA'
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-900/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30'
                  }`}
                >
                  {salvandoTransacao
                    ? 'Salvando...'
                    : editandoTransacaoId
                    ? '✓ Salvar Alterações'
                    : '✓ Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DE BAIXA DE ASSINATURA COM DATEPICKER OBRIGATÓRIO
      ========================================================= */}
      {modalBaixa.aberto && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-emerald-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">
                  Baixa Manual de Assinatura + Livro-Caixa
                </span>
                <h3 className="text-lg font-black text-white">
                  {modalBaixa.modo === 'INDIVIDUAL'
                    ? `Registrar Pagamento: ${modalBaixa.aluno?.nome}`
                    : `Baixa em Lote (${selecionados.length} alunos)`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalBaixa({ aberto: false, modo: 'INDIVIDUAL' })}
                className="text-zinc-500 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={confirmarBaixaPagamento} className="space-y-4">
              <div>
                <label className="block text-emerald-300 text-xs font-black mb-1 uppercase tracking-wider">
                  📅 Data Real do Pagamento (DatePicker Obrigatório)
                </label>
                <input
                  type="date"
                  required
                  value={dataPagamentoEscolhida}
                  onChange={(e) => setDataPagamentoEscolhida(e.target.value)}
                  className="w-full bg-[#1A1A1E] border-2 border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1">
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={valorPagamentoCustom}
                    onChange={(e) => setValorPagamentoCustom(e.target.value)}
                    placeholder="Padrão do plano"
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    value={metodoBaixa}
                    onChange={(e) => setMetodoBaixa(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    {METODOS_PAGAMENTO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalBaixa({ aberto: false, modo: 'INDIVIDUAL' })}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoBaixa}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/30"
                >
                  {salvandoBaixa ? 'Registrando...' : '✓ Confirmar Baixa (+30d)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

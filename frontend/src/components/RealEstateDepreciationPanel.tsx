import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface RealEstateDepreciationPanelProps {
  caixaOperacionalAcumulado?: number;
  patrimonioInicialBackend?: any;
  onPortfolioChanged?: () => void;
  onOpenQuickTransaction?: (preset: 'DESPESA' | 'INVESTIMENTO' | 'GASTO') => void;
}

const TAXA_PADRAO_ANUAL_PCT = 4.0;

const formatarMoeda = (valor: number) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

const TEMPLATES_RAPIDOS_MESTRE = [
  {
    label: '🥊 Luvas, Caneleiras & Manoplas',
    nome: 'Kit Luvas 14oz, Caneleiras e Thai Pads CT Borü',
    tipoImovel: 'EQUIPAMENTO_CT',
    categoriaContabil: 'INVESTIMENTO_EQUIPAMENTOS',
    taxaDepreciacaoAnualPct: '20',
    separarTerrenoConstrucao: false,
  },
  {
    label: '🧱 Tatame Olímpico / Lona',
    nome: 'Tatame Olímpico EVA / Lona de Combate',
    tipoImovel: 'EQUIPAMENTO_CT',
    categoriaContabil: 'INVESTIMENTO_EQUIPAMENTOS',
    taxaDepreciacaoAnualPct: '15',
    separarTerrenoConstrucao: false,
  },
  {
    label: '🎯 Sacos de Pancada & Suportes',
    nome: 'Sacos de Pancada Profissionais + Estrutura Aérea',
    tipoImovel: 'EQUIPAMENTO_CT',
    categoriaContabil: 'INVESTIMENTO_EQUIPAMENTOS',
    taxaDepreciacaoAnualPct: '15',
    separarTerrenoConstrucao: false,
  },
  {
    label: '❄️ Ar-Condicionado / Climatização',
    nome: 'Sistema de Climatização / Ar-Condicionado do Tatame',
    tipoImovel: 'EQUIPAMENTO_CT',
    categoriaContabil: 'INVESTIMENTO_EQUIPAMENTOS',
    taxaDepreciacaoAnualPct: '10',
    separarTerrenoConstrucao: false,
  },
  {
    label: '🛠️ Manutenção / Reparo CT',
    nome: 'Manutenção de Tatame, Sacos e Estrutura',
    tipoImovel: 'MANUTENCAO_ESTRUTURA',
    categoriaContabil: 'EQUIPAMENTOS_MANUTENCAO',
    taxaDepreciacaoAnualPct: '10',
    separarTerrenoConstrucao: false,
  },
  {
    label: '🏢 Galpão / Imóvel / Reforma',
    nome: 'Estrutura / Imóvel Comercial CT Borü',
    tipoImovel: 'COMERCIAL_GALPAO',
    categoriaContabil: 'CAPEX_IMOBILIZADO',
    taxaDepreciacaoAnualPct: '4',
    separarTerrenoConstrucao: true,
  },
];

export function computeLocalRealEstateAnalysis(input: any) {
  const valorAquisicao = Number(input.valorAquisicao || 0);
  const camposFaltantes: string[] = [];
  if (!valorAquisicao || Number.isNaN(valorAquisicao) || valorAquisicao <= 0) {
    camposFaltantes.push('Valor de aquisição (R$)');
  }

  const taxaInformada =
    input.taxaDepreciacaoAnualPct !== undefined &&
    input.taxaDepreciacaoAnualPct !== null &&
    String(input.taxaDepreciacaoAnualPct).trim() !== '' &&
    !Number.isNaN(Number(input.taxaDepreciacaoAnualPct));

  const premissaTaxaPadraoAdotada = !taxaInformada;
  const taxaDepreciacaoAnualPct = taxaInformada
    ? Math.max(0, Number(input.taxaDepreciacaoAnualPct))
    : TAXA_PADRAO_ANUAL_PCT;
  const taxaDepreciacaoMensalPct = round2(taxaDepreciacaoAnualPct / 12);

  let separarTerrenoConstrucao = Boolean(input.separarTerrenoConstrucao);
  let valorTerrenoIsolado = 0;
  let baseDepreciavelEdificacao = Math.max(0, valorAquisicao);

  if (separarTerrenoConstrucao) {
    valorTerrenoIsolado = Math.max(0, Number(input.valorTerreno || 0));
    const construcaoInf = Number(input.valorConstrucao || 0);
    baseDepreciavelEdificacao =
      construcaoInf > 0 ? construcaoInf : Math.max(0, valorAquisicao - valorTerrenoIsolado);
  }

  const itbiValor = Math.max(0, Number(input.itbiValor || 0));
  const escrituraRegistroValor = Math.max(0, Number(input.escrituraRegistroValor || 0));
  const corretagemEntradaValor = Math.max(0, Number(input.corretagemEntradaValor || 0));
  const reformasIniciaisValor = Math.max(0, Number(input.reformasIniciaisValor || 0));
  const totalCustosTransacaoRs = round2(
    itbiValor + escrituraRegistroValor + corretagemEntradaValor + reformasIniciaisValor
  );
  const percentualSobreValorImovelPct =
    valorAquisicao > 0 ? round2((totalCustosTransacaoRs / valorAquisicao) * 100) : 0;

  const custoTotalAquisicao = round2(valorAquisicao + totalCustosTransacaoRs);
  const perdaImediataEntradaRs = round2(totalCustosTransacaoRs);
  const perdaImediataEntradaPct =
    custoTotalAquisicao > 0 ? round2((perdaImediataEntradaRs / custoTotalAquisicao) * 100) : 0;
  const valorLiquidoDia1 = round2(valorAquisicao);

  const tempoPosseMeses = Math.max(0, Number(input.tempoPosseMeses || 0));
  const tempoPosseAnos = round2(tempoPosseMeses / 12);

  const ritmoQuedaAnualRs = round2(baseDepreciavelEdificacao * (taxaDepreciacaoAnualPct / 100));
  const ritmoQuedaMensalRs = round2(ritmoQuedaAnualRs / 12);

  const custoManutencaoMensal = Math.max(0, Number(input.custoManutencaoMensal || 0));
  const ritmoQuedaComManutencaoMensalRs = round2(ritmoQuedaMensalRs + custoManutencaoMensal);
  const ritmoQuedaComManutencaoAnualRs = round2(ritmoQuedaAnualRs + custoManutencaoMensal * 12);

  const depreciacaoFisicaAcumuladaRs = round2(
    Math.min(baseDepreciavelEdificacao, ritmoQuedaMensalRs * tempoPosseMeses)
  );
  const valorResidualEdificacaoAtual = round2(
    Math.max(0, baseDepreciavelEdificacao - depreciacaoFisicaAcumuladaRs)
  );
  const valorResidualBrutoAtual = round2(valorTerrenoIsolado + valorResidualEdificacaoAtual);

  const manutencaoAcumuladaPosseRs = round2(custoManutencaoMensal * tempoPosseMeses);
  const valorLiquidoAtualEstimado = round2(
    Math.max(0, valorResidualBrutoAtual - manutencaoAcumuladaPosseRs)
  );

  const desvalorizacaoAcumuladaRs = round2(custoTotalAquisicao - valorResidualBrutoAtual);
  const desvalorizacaoAcumuladaPct =
    custoTotalAquisicao > 0 ? round2((desvalorizacaoAcumuladaRs / custoTotalAquisicao) * 100) : 0;

  const desvalorizacaoLiquidaTotalRs = round2(custoTotalAquisicao - valorLiquidoAtualEstimado);
  const desvalorizacaoLiquidaTotalPct =
    custoTotalAquisicao > 0 ? round2((desvalorizacaoLiquidaTotalRs / custoTotalAquisicao) * 100) : 0;

  const horizonteProjecaoAnos = Math.max(1, Number(input.horizonteProjecaoAnos || 5));
  const marcosAnos = Array.from(new Set([1, 3, 5, horizonteProjecaoAnos])).sort((a, b) => a - b);

  const buildPoint = (horizonteLabel: string, mesesTotais: number) => {
    const depFisica = round2(Math.min(baseDepreciavelEdificacao, ritmoQuedaMensalRs * mesesTotais));
    const resEdif = round2(Math.max(0, baseDepreciavelEdificacao - depFisica));
    const resBruto = round2(valorTerrenoIsolado + resEdif);
    const manutAcum = round2(custoManutencaoMensal * mesesTotais);
    const valLiquido = round2(Math.max(0, resBruto - manutAcum));
    const desvAcumRs = round2(custoTotalAquisicao - resBruto);
    const desvAcumPct = custoTotalAquisicao > 0 ? round2((desvAcumRs / custoTotalAquisicao) * 100) : 0;
    const desvLiqRs = round2(custoTotalAquisicao - valLiquido);
    const desvLiqPct = custoTotalAquisicao > 0 ? round2((desvLiqRs / custoTotalAquisicao) * 100) : 0;

    return {
      horizonteLabel,
      anosTotais: round2(mesesTotais / 12),
      mesesTotais,
      valorTerrenoIsolado,
      valorResidualEdificacao: resEdif,
      valorResidualBrutoImovel: resBruto,
      manutencaoAcumuladaRs: manutAcum,
      valorLiquidoEstimado: valLiquido,
      perdaImediataEntradaRs,
      depreciacaoFisicaAcumuladaRs: depFisica,
      desvalorizacaoAcumuladaRs: desvAcumRs,
      desvalorizacaoAcumuladaPct: desvAcumPct,
      desvalorizacaoLiquidaComManutencaoRs: desvLiqRs,
      desvalorizacaoLiquidaComManutencaoPct: desvLiqPct,
    };
  };

  const projecoesFuturas = [buildPoint('Dia 1 (Aquisição & Custos de Entrada)', 0)];
  if (tempoPosseMeses > 0) {
    projecoesFuturas.push(
      buildPoint(`Uso / Posse Atual (${tempoPosseMeses} meses)`, tempoPosseMeses)
    );
  }
  for (const a of marcosAnos) {
    const mesesAlvo = tempoPosseMeses + Math.round(a * 12);
    projecoesFuturas.push(
      buildPoint(
        tempoPosseMeses > 0
          ? `Projeção +${a} Ano(s) (${round2(mesesAlvo / 12)} anos totais)`
          : `Projeção ${a} Ano(s)`,
        mesesAlvo
      )
    );
  }

  const textoPremissaAdotada = premissaTaxaPadraoAdotada
    ? `Premissa Padrão Adotada (${TAXA_PADRAO_ANUAL_PCT.toFixed(1)}% a.a. / ${taxaDepreciacaoMensalPct}% a.m.): aplicável quando a taxa de desgaste/depreciação anual é deixada em branco.`
    : `Premissa Definida pelo Gestor: Taxa de depreciação/desgaste de ${taxaDepreciacaoAnualPct.toFixed(2)}% ao ano (${taxaDepreciacaoMensalPct}% ao mês) sobre ${
        separarTerrenoConstrucao
          ? `a área construída (${formatarMoeda(baseDepreciavelEdificacao)}), mantendo o terreno (${formatarMoeda(valorTerrenoIsolado)}) isolado`
          : `o valor do bem/equipamento (${formatarMoeda(baseDepreciavelEdificacao)})`
      }.`;

  return {
    validacaoOk: camposFaltantes.length === 0,
    camposFaltantes,
    id: input.id || `ativo-${Date.now()}`,
    nome: input.nome || 'Equipamento / Ativo do CT',
    tipoImovel: input.tipoImovel || 'EQUIPAMENTO_CT',
    dataAquisicao: input.dataAquisicao || new Date().toISOString().split('T')[0],
    premissaTaxaPadraoAdotada,
    taxaDepreciacaoAnualPct,
    taxaDepreciacaoMensalPct,
    textoPremissaAdotada,
    valorAquisicao,
    separarTerrenoConstrucao,
    valorTerrenoIsolado,
    baseDepreciavelEdificacao,
    custosTransacaoDetalhados: {
      itbiValor,
      escrituraRegistroValor,
      corretagemEntradaValor,
      reformasIniciaisValor,
      totalCustosTransacaoRs,
      percentualSobreValorImovelPct,
    },
    custoTotalAquisicao,
    valorLiquidoDia1,
    perdaImediataEntradaRs,
    perdaImediataEntradaPct,
    tempoPosseMeses,
    tempoPosseAnos,
    depreciacaoFisicaAcumuladaRs,
    valorResidualEdificacaoAtual,
    valorResidualBrutoAtual,
    custoManutencaoMensal,
    manutencaoAcumuladaPosseRs,
    valorLiquidoAtualEstimado,
    desvalorizacaoAcumuladaRs,
    desvalorizacaoAcumuladaPct,
    desvalorizacaoLiquidaTotalRs,
    desvalorizacaoLiquidaTotalPct,
    ritmoQuedaMensalRs,
    ritmoQuedaAnualRs,
    ritmoQuedaComManutencaoMensalRs,
    ritmoQuedaComManutencaoAnualRs,
    horizonteProjecaoAnos,
    projecoesFuturas,
    observacoes: input.observacoes || '',
  };
}

export const RealEstateDepreciationPanel: React.FC<RealEstateDepreciationPanelProps> = ({
  caixaOperacionalAcumulado = 0,
  patrimonioInicialBackend,
  onPortfolioChanged,
  onOpenQuickTransaction,
}) => {
  const hojeIso = new Date().toISOString().split('T')[0];

  // Lista começa 100% limpa (sem dados fictícios pré-carregados)
  const [imoveis, setImoveis] = useState<any[]>(() => {
    const iniciais = patrimonioInicialBackend?.imoveis || [];
    return iniciais.filter((i: any) => i?.id !== 'imovel-sede-ct-boru-pvh');
  });

  const [imovelAtivoIdx, setImovelAtivoIdx] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const criarFormLimpo = () => ({
    id: '',
    nome: '',
    tipoImovel: 'EQUIPAMENTO_CT',
    categoriaContabil: 'INVESTIMENTO_EQUIPAMENTOS',
    metodoPagamento: 'PIX',
    lancarNoLivroCaixa: true,
    dataAquisicao: hojeIso,
    valorAquisicao: '',
    separarTerrenoConstrucao: false,
    valorTerreno: '',
    valorConstrucao: '',
    itbiValor: '',
    escrituraRegistroValor: '',
    corretagemEntradaValor: '',
    reformasIniciaisValor: '',
    taxaDepreciacaoAnualPct: '',
    tempoPosseMeses: '0',
    horizonteProjecaoAnos: '5',
    custoManutencaoMensal: '',
    observacoes: '',
  });

  const [form, setForm] = useState(criarFormLimpo);

  useEffect(() => {
    if (Array.isArray(patrimonioInicialBackend?.imoveis)) {
      setImoveis(
        patrimonioInicialBackend.imoveis.filter((i: any) => i?.id !== 'imovel-sede-ct-boru-pvh')
      );
    }
  }, [patrimonioInicialBackend]);

  const analiseSimulada = computeLocalRealEstateAnalysis({
    ...form,
    valorAquisicao: Number(form.valorAquisicao || 0),
    valorTerreno: Number(form.valorTerreno || 0),
    valorConstrucao: Number(form.valorConstrucao || 0),
    itbiValor: Number(form.itbiValor || 0),
    escrituraRegistroValor: Number(form.escrituraRegistroValor || 0),
    corretagemEntradaValor: Number(form.corretagemEntradaValor || 0),
    reformasIniciaisValor: Number(form.reformasIniciaisValor || 0),
    taxaDepreciacaoAnualPct:
      String(form.taxaDepreciacaoAnualPct).trim() === ''
        ? null
        : Number(form.taxaDepreciacaoAnualPct),
    tempoPosseMeses: Number(form.tempoPosseMeses || 0),
    horizonteProjecaoAnos: Number(form.horizonteProjecaoAnos || 5),
    custoManutencaoMensal: Number(form.custoManutencaoMensal || 0),
  });

  const handleAplicarTemplateMestre = (tpl: (typeof TEMPLATES_RAPIDOS_MESTRE)[0]) => {
    setForm((prev) => ({
      ...prev,
      id: '',
      nome: tpl.nome,
      tipoImovel: tpl.tipoImovel,
      categoriaContabil: tpl.categoriaContabil,
      taxaDepreciacaoAnualPct: tpl.taxaDepreciacaoAnualPct,
      separarTerrenoConstrucao: tpl.separarTerrenoConstrucao,
    }));
    setFeedbackMsg(null);
  };

  const handleAplicarPresetTransacao = (pctTotal: number) => {
    const val = Number(form.valorAquisicao || 0);
    if (val <= 0) return;
    if (form.tipoImovel === 'COMERCIAL_GALPAO') {
      const itbi = Math.round(val * 0.03);
      const cartorio = Math.round(val * 0.02);
      const restante = Math.max(0, Math.round(val * (pctTotal / 100)) - itbi - cartorio);
      setForm((prev) => ({
        ...prev,
        itbiValor: String(itbi),
        escrituraRegistroValor: String(cartorio),
        reformasIniciaisValor: String(restante),
      }));
    } else {
      const freteInstalacao = Math.round(val * (pctTotal / 100));
      setForm((prev) => ({
        ...prev,
        itbiValor: '0',
        escrituraRegistroValor: '0',
        corretagemEntradaValor: '0',
        reformasIniciaisValor: String(freteInstalacao),
      }));
    }
  };

  const handleRegistrarNoPatrimonio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !analiseSimulada.validacaoOk) {
      setFeedbackMsg({
        tipo: 'erro',
        texto: 'Preencha o nome do equipamento/custo/ativo e o valor de aquisição (R$) para salvar.',
      });
      return;
    }

    setSalvando(true);
    setFeedbackMsg(null);
    try {
      const res = await adminApi.saveRealEstateAsset({
        ...form,
        id: form.id || undefined,
        nome: form.nome.trim(),
        valorAquisicao: Number(form.valorAquisicao),
        valorTerreno: Number(form.valorTerreno || 0),
        valorConstrucao: Number(form.valorConstrucao || 0),
        itbiValor: Number(form.itbiValor || 0),
        escrituraRegistroValor: Number(form.escrituraRegistroValor || 0),
        corretagemEntradaValor: Number(form.corretagemEntradaValor || 0),
        reformasIniciaisValor: Number(form.reformasIniciaisValor || 0),
        taxaDepreciacaoAnualPct:
          String(form.taxaDepreciacaoAnualPct).trim() === ''
            ? null
            : Number(form.taxaDepreciacaoAnualPct),
        tempoPosseMeses: Number(form.tempoPosseMeses || 0),
        horizonteProjecaoAnos: Number(form.horizonteProjecaoAnos || 5),
        custoManutencaoMensal: Number(form.custoManutencaoMensal || 0),
        lancarNoLivroCaixa: form.lancarNoLivroCaixa,
        categoriaContabil: form.categoriaContabil,
        metodoPagamento: form.metodoPagamento,
      });

      if (res.data?.portfolio?.imoveis) {
        setImoveis(res.data.portfolio.imoveis);
        setImovelAtivoIdx(0);
      } else {
        setImoveis((prev) => [analiseSimulada, ...prev]);
        setImovelAtivoIdx(0);
      }
      setForm(criarFormLimpo());
      setFeedbackMsg({
        tipo: 'ok',
        texto: form.lancarNoLivroCaixa
          ? '✅ Equipamento / Ativo salvo no Patrimônio e lançado automaticamente no Livro-Caixa e Despesas/Investimentos!'
          : '✅ Equipamento / Ativo salvo com sucesso no Patrimônio do CT!',
      });
      if (onPortfolioChanged) onPortfolioChanged();
    } catch {
      setImoveis((prev) => [analiseSimulada, ...prev]);
      setImovelAtivoIdx(0);
      setForm(criarFormLimpo());
      setFeedbackMsg({
        tipo: 'ok',
        texto: '✅ Equipamento / Ativo registrado na carteira patrimonial do CT!',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverImovel = async (id: string) => {
    if (!confirm('Deseja remover este item do patrimônio?')) return;
    try {
      const res = await adminApi.deleteRealEstateAsset(id);
      if (res.data?.portfolio?.imoveis) {
        setImoveis(res.data.portfolio.imoveis);
      } else {
        setImoveis((prev) => prev.filter((i) => i.id !== id));
      }
      setImovelAtivoIdx(0);
      if (onPortfolioChanged) onPortfolioChanged();
    } catch {
      setImoveis((prev) => prev.filter((i) => i.id !== id));
      setImovelAtivoIdx(0);
    }
  };

  // Consolidado da carteira cadastrada pelo Mestre (0 quando limpa!)
  const custoTotalCarteira = imoveis.reduce((acc, i) => acc + (i.custoTotalAquisicao || 0), 0);
  const valorLiquidoCarteira = imoveis.reduce((acc, i) => acc + (i.valorLiquidoAtualEstimado || 0), 0);
  const desvalorizacaoTotalCarteiraRs = round2(custoTotalCarteira - valorLiquidoCarteira);
  const desvalorizacaoTotalCarteiraPct =
    custoTotalCarteira > 0 ? round2((desvalorizacaoTotalCarteiraRs / custoTotalCarteira) * 100) : 0;
  const ritmoQuedaCarteiraMensal = imoveis.reduce((acc, i) => acc + (i.ritmoQuedaMensalRs || 0), 0);
  const ritmoQuedaCarteiraAnual = imoveis.reduce((acc, i) => acc + (i.ritmoQuedaAnualRs || 0), 0);
  const patrimonioBrutoNominal = round2(caixaOperacionalAcumulado + custoTotalCarteira);
  const patrimonioLiquidoRealSistema = round2(caixaOperacionalAcumulado + valorLiquidoCarteira);

  // Se o Mestre estiver digitando um valor no formulário, os 4 cards mostram a prévia em tempo real;
  // caso contrário, mostram o consolidado real da carteira (R$ 0,00 quando vazia)
  const temSimulacaoAtiva = Number(form.valorAquisicao || 0) > 0;
  const cardCustoTotal = temSimulacaoAtiva ? analiseSimulada.custoTotalAquisicao : custoTotalCarteira;
  const cardValorLiquido = temSimulacaoAtiva
    ? analiseSimulada.valorLiquidoAtualEstimado
    : valorLiquidoCarteira;
  const cardDesvalorizacaoRs = temSimulacaoAtiva
    ? analiseSimulada.desvalorizacaoLiquidaTotalRs
    : desvalorizacaoTotalCarteiraRs;
  const cardDesvalorizacaoPct = temSimulacaoAtiva
    ? analiseSimulada.desvalorizacaoLiquidaTotalPct
    : desvalorizacaoTotalCarteiraPct;
  const cardQuedaMensal = temSimulacaoAtiva
    ? analiseSimulada.ritmoQuedaMensalRs
    : ritmoQuedaCarteiraMensal;
  const cardQuedaAnual = temSimulacaoAtiva
    ? analiseSimulada.ritmoQuedaAnualRs
    : ritmoQuedaCarteiraAnual;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. CABEÇALHO LIMPO PARA O MESTRE / GESTOR FINANCEIRO */}
      <div className="bg-gradient-to-r from-[#17171D] via-[#141418] to-red-950/30 border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600 text-white">
                🥊 Gestão de Equipamentos, Estrutura, Custos & Patrimônio CT Borü
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Sincronizado com Livro-Caixa & DRE
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1.5">
              Cadastro de Equipamentos, Custos de Instalação, Manutenção & Depreciação Patrimonial
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Adicione luvas, tatames, sacos de pancada, climatização, reformas ou imóveis do CT. O sistema calcula o custo real desembolsado, o desgaste mensal/anual e já lança a saída no Livro-Caixa se desejar.
            </p>
          </div>

          <div className="bg-[#101014] border border-zinc-700/80 rounded-2xl p-3.5 shrink-0 min-w-[260px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              💎 Patrimônio Líquido Real (Caixa + Equipamentos/Ativos)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {formatarMoeda(patrimonioLiquidoRealSistema)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between gap-2">
              <span>Bruto: {formatarMoeda(patrimonioBrutoNominal)}</span>
              <span className="text-red-400 font-bold">
                Deprec.: -{formatarMoeda(desvalorizacaoTotalCarteiraRs)} ({desvalorizacaoTotalCarteiraPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* ATALHOS RÁPIDOS PARA O MESTRE LANÇAR GASTOS, CUSTOS OU EQUIPAMENTOS */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111115] border border-zinc-800 rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mr-1">
              ⚡ Modelos Rápidos p/ o Mestre:
            </span>
            {TEMPLATES_RAPIDOS_MESTRE.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAplicarTemplateMestre(tpl)}
                className="px-2.5 py-1.5 rounded-lg bg-[#1A1A22] hover:bg-red-600 text-zinc-200 hover:text-white border border-zinc-700/80 text-[11px] font-bold transition"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          {onOpenQuickTransaction && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenQuickTransaction('DESPESA')}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-[11px] font-black transition"
              >
                🔴 + Lançar Gasto / Conta Rápida
              </button>
              <button
                type="button"
                onClick={() => onOpenQuickTransaction('INVESTIMENTO')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-black transition"
              >
                💎 + Lançar Investimento Rápido
              </button>
            </div>
          )}
        </div>

        {/* 4 INDICADORES PATRIMONIAIS EM DESTAQUE (ZERADOS QUANDO LIMPO, OU MOSTRANDO PRÉVIA AO DIGITAR) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#121216] border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              1. Custo Total de Aquisição {temSimulacaoAtiva ? '(Simulação)' : `(${imoveis.length} itens)`}
            </span>
            <div className="text-xl font-black text-white">{formatarMoeda(cardCustoTotal)}</div>
            <p className="text-[11px] text-zinc-400">
              {temSimulacaoAtiva
                ? `Valor base: ${formatarMoeda(analiseSimulada.valorAquisicao)} + Custos/Frete/Taxas: ${formatarMoeda(analiseSimulada.custosTransacaoDetalhados.totalCustosTransacaoRs)}`
                : 'Total desembolsado em equipamentos e ativos cadastrados'}
            </p>
          </div>

          <div className="bg-[#121216] border border-emerald-500/40 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              2. Valor Líquido Atual Estimado
            </span>
            <div className="text-xl font-black text-emerald-300">
              {formatarMoeda(cardValorLiquido)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Valor patrimonial líquido descontando desgaste e custos afundados
            </p>
          </div>

          <div className="bg-[#121216] border border-red-500/40 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
              3. Desvalorização / Desgaste Acumulado
            </span>
            <div className="text-xl font-black text-red-400">
              -{formatarMoeda(cardDesvalorizacaoRs)}{' '}
              <span className="text-sm font-black text-amber-300">(-{cardDesvalorizacaoPct}%)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Perda de entrada (Dia 1) + depreciação física pelo tempo de uso
            </p>
          </div>

          <div className="bg-[#121216] border border-amber-500/40 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              4. Ritmo de Depreciação Mensal / Anual
            </span>
            <div className="text-lg font-black text-amber-300">
              -{formatarMoeda(cardQuedaMensal)}/mês{' '}
              <span className="text-xs text-zinc-300 font-bold">
                (-{formatarMoeda(cardQuedaAnual)}/ano)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Provisão recomendada para reposição futura de equipamentos/estrutura
            </p>
          </div>
        </div>
      </div>

      {/* 2. FORMULÁRIO DE CADASTRO DE EQUIPAMENTO / CUSTO / ATIVO + TABELA DE ITENS E PROJEÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleRegistrarNoPatrimonio}
          className="lg:col-span-5 bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                ➕ Adicionar Equipamento, Estrutura ou Ativo
              </h3>
              <p className="text-[11px] text-zinc-400">
                Preencha os dados ou clique em um modelo rápido acima.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm(criarFormLimpo());
                setFeedbackMsg(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold"
            >
              Limpar Campos
            </button>
          </div>

          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border ${
                feedbackMsg.tipo === 'ok'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}
            >
              {feedbackMsg.texto}
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase text-zinc-300 mb-1">
                  Nome do Equipamento / Custo / Bem: *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  placeholder="Ex: 10 Pares de Luvas 14oz, Tatame 100m², Ar-Condicionado..."
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-300 mb-1">
                  Tipo de Item:
                </label>
                <select
                  value={form.tipoImovel}
                  onChange={(e) => {
                    const tp = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      tipoImovel: tp,
                      separarTerrenoConstrucao: tp === 'COMERCIAL_GALPAO',
                      categoriaContabil:
                        tp === 'EQUIPAMENTO_CT'
                          ? 'INVESTIMENTO_EQUIPAMENTOS'
                          : tp === 'MANUTENCAO_ESTRUTURA'
                          ? 'EQUIPAMENTOS_MANUTENCAO'
                          : 'CAPEX_IMOBILIZADO',
                    }));
                  }}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                >
                  <option value="EQUIPAMENTO_CT">🥊 Equipamento do CT</option>
                  <option value="MANUTENCAO_ESTRUTURA">🛠️ Manutenção / Reparo</option>
                  <option value="REFORMA_BENFEITORIA">🏗️ Reforma / Estrutura</option>
                  <option value="COMERCIAL_GALPAO">🏢 Imóvel / Galpão</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-400 mb-1">
                  Valor de Compra / Aquisição (R$): *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorAquisicao}
                  onChange={(e) => {
                    const novoVal = e.target.value;
                    const num = Number(novoVal || 0);
                    setForm((prev) => ({
                      ...prev,
                      valorAquisicao: novoVal,
                      ...(prev.separarTerrenoConstrucao
                        ? {
                            valorTerreno: String(Math.round(num * 0.3333)),
                            valorConstrucao: String(Math.round(num * 0.6667)),
                          }
                        : {}),
                    }));
                  }}
                  placeholder="Ex: 1500.00"
                  className="w-full bg-[#0E0E11] border-2 border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Data da Compra / Registro:
                </label>
                <input
                  type="date"
                  value={form.dataAquisicao}
                  onChange={(e) => setForm({ ...form, dataAquisicao: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* INTEGRAÇÃO DIRETA COM O LIVRO-CAIXA E DESPESAS/INVESTIMENTOS */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-xs font-black text-emerald-300">
                  📒 Lançar automaticamente no Livro-Caixa & Despesas/Investimentos
                </span>
                <input
                  type="checkbox"
                  checked={form.lancarNoLivroCaixa}
                  onChange={(e) => setForm({ ...form, lancarNoLivroCaixa: e.target.checked })}
                  className="rounded accent-emerald-500"
                />
              </label>

              {form.lancarNoLivroCaixa && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 mb-0.5">
                      Classificação no Financeiro:
                    </label>
                    <select
                      value={form.categoriaContabil}
                      onChange={(e) => setForm({ ...form, categoriaContabil: e.target.value })}
                      className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-bold"
                    >
                      <option value="INVESTIMENTO_EQUIPAMENTOS">
                        🥊 Aquisição de Tatames e Equipamentos (CAPEX)
                      </option>
                      <option value="EQUIPAMENTOS_MANUTENCAO">
                        🛠️ Manutenção de Tatame, Sacos e Limpeza (OPEX)
                      </option>
                      <option value="CAPEX_IMOBILIZADO">
                        🏗️ Obras, Reformas e Estrutura (CAPEX)
                      </option>
                      <option value="ESTOQUE_MERCADO">
                        📦 Compra de Estoque p/ Mercado Borü (OPEX)
                      </option>
                      <option value="ALUGUEL_CONTAS">
                        🏢 Aluguel, Energia, Água e Estrutura Fixa (OPEX)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-300 mb-0.5">
                      Meio de Pagamento:
                    </label>
                    <select
                      value={form.metodoPagamento}
                      onChange={(e) => setForm({ ...form, metodoPagamento: e.target.value })}
                      className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-bold"
                    >
                      <option value="PIX">💠 PIX</option>
                      <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                      <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                      <option value="DINHEIRO">💵 Dinheiro</option>
                      <option value="BOLETO_TRANSFERENCIA">🏦 Boleto / Transferência</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOS ADICIONAIS DE ENTRADA (FRETE, INSTALAÇÃO, REFORMA OU TAXAS) */}
            <div className="p-3 rounded-xl bg-[#1A1A20] border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300">
                  💸 Custos Extras na Compra (Frete, Instalação, Reforma ou Taxas)
                </span>
                <div className="flex items-center gap-1">
                  {[5, 8, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleAplicarPresetTransacao(pct)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-amber-500 hover:text-black text-[10px] font-bold text-zinc-300 transition"
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">
                    Frete / Instalação / Adequação (R$):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.reformasIniciaisValor}
                    onChange={(e) => setForm({ ...form, reformasIniciaisValor: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">
                    Taxas / Impostos / Outros (R$):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.itbiValor}
                    onChange={(e) => setForm({ ...form, itbiValor: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* DIFERENCIAÇÃO TERRENO VS CONSTRUÇÃO (QUANDO FOR IMÓVEL / GALPÃO) */}
            {form.tipoImovel === 'COMERCIAL_GALPAO' && (
              <div className="p-3 rounded-xl bg-[#1A1A20] border border-zinc-800 space-y-2.5">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-xs font-black text-white">
                    🏗️ Separar Terreno vs. Área Construída (Imóvel)
                  </span>
                  <input
                    type="checkbox"
                    checked={form.separarTerrenoConstrucao}
                    onChange={(e) =>
                      setForm({ ...form, separarTerrenoConstrucao: e.target.checked })
                    }
                    className="rounded bg-zinc-800 border-zinc-600 text-red-600"
                  />
                </label>

                {form.separarTerrenoConstrucao && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-400 mb-1">
                        Valor do Terreno Isolado (R$):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.valorTerreno}
                        onChange={(e) => {
                          const terr = Number(e.target.value || 0);
                          const total = Number(form.valorAquisicao || 0);
                          setForm({
                            ...form,
                            valorTerreno: e.target.value,
                            valorConstrucao: String(Math.max(0, total - terr)),
                          });
                        }}
                        className="w-full bg-[#0E0E11] border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-400 mb-1">
                        Área Construída Depreciável (R$):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.valorConstrucao}
                        onChange={(e) => setForm({ ...form, valorConstrucao: e.target.value })}
                        className="w-full bg-[#0E0E11] border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAXA DE DESGASTE, TEMPO DE USO E MANUTENÇÃO MENSAL */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Desgaste (% a.a.):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.taxaDepreciacaoAnualPct}
                  onChange={(e) =>
                    setForm({ ...form, taxaDepreciacaoAnualPct: e.target.value })
                  }
                  placeholder="Padrão 4%"
                  className="w-full bg-[#0E0E11] border border-amber-500/40 rounded-xl px-2.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Uso Atual (Meses):
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.tempoPosseMeses}
                  onChange={(e) => setForm({ ...form, tempoPosseMeses: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Manut. Mensal (R$):
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.custoManutencaoMensal}
                  onChange={(e) =>
                    setForm({ ...form, custoManutencaoMensal: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg"
          >
            {salvando
              ? 'Salvando...'
              : form.lancarNoLivroCaixa
              ? '💾 Salvar Equipamento/Ativo & Lançar no Livro-Caixa'
              : '💾 Salvar Equipamento/Ativo no Patrimônio'}
          </button>
        </form>

        {/* 3. LISTA DE EQUIPAMENTOS / ATIVOS CADASTRADOS PELO MESTRE + PROJEÇÃO DE DESGASTE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  🥊 Equipamentos, Estrutura & Ativos Cadastrados ({imoveis.length})
                </h4>
                <p className="text-xs text-zinc-400">
                  Lista limpa e pronta para o gestor financeiro adicionar os equipamentos e bens reais do CT.
                </p>
              </div>
              <span className="text-xs text-zinc-300">
                Valor Líquido Total:{' '}
                <strong className="text-emerald-400">{formatarMoeda(valorLiquidoCarteira)}</strong>
              </span>
            </div>

            {imoveis.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#101013] border border-dashed border-zinc-800 text-center space-y-2">
                <div className="text-2xl">🥊</div>
                <p className="text-xs sm:text-sm font-black text-white">
                  Nenhum equipamento ou ativo cadastrado ainda (Tudo limpo: R$ 0,00)
                </p>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Use o formulário ao lado ou clique nos modelos rápidos acima para adicionar luvas, tatames, sacos de pancada, ar-condicionado, reformas ou estrutura do CT.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {imoveis.map((im, i) => (
                  <div
                    key={im.id || i}
                    onClick={() => {
                      setImovelAtivoIdx(i);
                      setForm({
                        id: im.id || '',
                        nome: im.nome || '',
                        tipoImovel: im.tipoImovel || 'EQUIPAMENTO_CT',
                        categoriaContabil: 'INVESTIMENTO_EQUIPAMENTOS',
                        metodoPagamento: 'PIX',
                        lancarNoLivroCaixa: false,
                        dataAquisicao: im.dataAquisicao || hojeIso,
                        valorAquisicao: String(im.valorAquisicao || 0),
                        separarTerrenoConstrucao: Boolean(im.separarTerrenoConstrucao),
                        valorTerreno: String(im.valorTerrenoIsolado || 0),
                        valorConstrucao: String(im.baseDepreciavelEdificacao || 0),
                        itbiValor: String(im.custosTransacaoDetalhados?.itbiValor || 0),
                        escrituraRegistroValor: String(
                          im.custosTransacaoDetalhados?.escrituraRegistroValor || 0
                        ),
                        corretagemEntradaValor: String(
                          im.custosTransacaoDetalhados?.corretagemEntradaValor || 0
                        ),
                        reformasIniciaisValor: String(
                          im.custosTransacaoDetalhados?.reformasIniciaisValor || 0
                        ),
                        taxaDepreciacaoAnualPct: String(im.taxaDepreciacaoAnualPct || 4),
                        tempoPosseMeses: String(im.tempoPosseMeses || 0),
                        horizonteProjecaoAnos: String(im.horizonteProjecaoAnos || 5),
                        custoManutencaoMensal: String(im.custoManutencaoMensal || 0),
                        observacoes: im.observacoes || '',
                      });
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      imovelAtivoIdx === i
                        ? 'bg-zinc-900 border-amber-500/50'
                        : 'bg-[#18181D] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-white text-xs sm:text-sm">{im.nome}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 text-red-300 border border-red-500/30">
                          Desgaste/Perda: -{formatarMoeda(im.desvalorizacaoLiquidaTotalRs)} (-
                          {im.desvalorizacaoLiquidaTotalPct}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Custo Total: <strong>{formatarMoeda(im.custoTotalAquisicao)}</strong> •
                        Valor Líquido Atual:{' '}
                        <strong className="text-emerald-400">
                          {formatarMoeda(im.valorLiquidoAtualEstimado)}
                        </strong>{' '}
                        • Depreciação: <strong>-{formatarMoeda(im.ritmoQuedaMensalRs)}/mês</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoverImovel(im.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-bold border border-red-500/30 shrink-0"
                    >
                      🗑️ Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TABELA DE SIMULAÇÃO DE DEPRECIAÇÃO (EXIBIDA QUANDO O MESTRE PREENCHE UM VALOR OU SELECIONA UM ITEM) */}
          {temSimulacaoAtiva && (
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    📉 Curva de Desgaste & Valor Residual Projetado ({form.nome || 'Simulação Atual'})
                  </h3>
                  <p className="text-xs text-zinc-400">{analiseSimulada.textoPremissaAdotada}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-black shrink-0">
                  Taxa: {analiseSimulada.taxaDepreciacaoAnualPct}% a.a. (
                  {analiseSimulada.taxaDepreciacaoMensalPct}% a.m.)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Período / Marco</th>
                      <th className="p-3">Valor Residual do Bem</th>
                      <th className="p-3">Valor Líquido Real</th>
                      <th className="p-3">Desgaste Acumulado (R$ / %)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {analiseSimulada.projecoesFuturas.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3 font-bold text-white">
                          {pt.horizonteLabel}
                          <span className="block text-[10px] text-zinc-500 font-normal">
                            {pt.mesesTotais} meses decorridos
                          </span>
                        </td>
                        <td className="p-3 text-zinc-200 font-semibold">
                          {formatarMoeda(pt.valorResidualBrutoImovel)}
                        </td>
                        <td className="p-3 font-black text-emerald-400">
                          {formatarMoeda(pt.valorLiquidoEstimado)}
                        </td>
                        <td className="p-3 font-black text-red-400">
                          -{formatarMoeda(pt.desvalorizacaoLiquidaComManutencaoRs)}{' '}
                          <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/30 text-[10px] text-amber-300">
                            -{pt.desvalorizacaoLiquidaComManutencaoPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

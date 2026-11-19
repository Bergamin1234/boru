import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface RealEstateDepreciationPanelProps {
  caixaOperacionalAcumulado?: number;
  patrimonioInicialBackend?: any;
  onPortfolioChanged?: () => void;
}

const TAXA_PADRAO_ANUAL_PCT = 4.0;

const formatarMoeda = (valor: number) =>
  (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function computeLocalRealEstateAnalysis(input: any) {
  const valorAquisicao = Number(input.valorAquisicao || 0);
  const camposFaltantes: string[] = [];
  if (!valorAquisicao || Number.isNaN(valorAquisicao) || valorAquisicao <= 0) {
    camposFaltantes.push('Valor de aquisição do imóvel (R$)');
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

  const projecoesFuturas = [buildPoint('Dia 1 (Impacto Imediato de Entrada)', 0)];
  if (tempoPosseMeses > 0) {
    projecoesFuturas.push(
      buildPoint(`Posse Atual (${tempoPosseMeses} meses / ${tempoPosseAnos} anos)`, tempoPosseMeses)
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
    ? `Premissa Padrão Adotada Automaticamente: Como a taxa de desvalorização não foi informada no formulário, adotou-se a premissa técnica padrão de ${TAXA_PADRAO_ANUAL_PCT.toFixed(1)}% ao ano (${taxaDepreciacaoMensalPct}% ao mês) incidente sobre o valor da edificação (${separarTerrenoConstrucao ? `R$ ${baseDepreciavelEdificacao.toLocaleString('pt-BR')}, mantendo o terreno de R$ ${valorTerrenoIsolado.toLocaleString('pt-BR')} isolado` : 'base integral da construção'}), além da contabilização imediata dos custos de transação como perda patrimonial de entrada no Dia 1.`
    : `Premissa Definida pelo Usuário: Taxa de depreciação/desvalorização de ${taxaDepreciacaoAnualPct.toFixed(2)}% ao ano (${taxaDepreciacaoMensalPct}% ao mês) aplicada sobre ${separarTerrenoConstrucao ? `a área construída (${formatarMoeda(baseDepreciavelEdificacao)}), mantendo o terreno (${formatarMoeda(valorTerrenoIsolado)}) isolado` : `o valor da edificação (${formatarMoeda(baseDepreciavelEdificacao)})`}, somada à perda imediata dos custos de transação no Dia 1.`;

  return {
    validacaoOk: camposFaltantes.length === 0,
    camposFaltantes,
    id: input.id || `imovel-${Date.now()}`,
    nome: input.nome || 'Imóvel Patrimonial',
    tipoImovel: input.tipoImovel || 'COMERCIAL_GALPAO',
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
}) => {
  const [imoveis, setImoveis] = useState<any[]>(() => {
    if (patrimonioInicialBackend?.imoveis?.length > 0) {
      return patrimonioInicialBackend.imoveis;
    }
    return [
      computeLocalRealEstateAnalysis({
        id: 'imovel-sede-ct-boru-pvh',
        nome: 'Imóvel Sede & Galpão CT BORÜ (180m² Climatizado — Porto Velho/RO)',
        tipoImovel: 'COMERCIAL_GALPAO',
        dataAquisicao: '2024-05-15',
        valorAquisicao: 480000,
        separarTerrenoConstrucao: true,
        valorTerreno: 160000,
        valorConstrucao: 320000,
        itbiValor: 14400,
        escrituraRegistroValor: 9600,
        corretagemEntradaValor: 0,
        reformasIniciaisValor: 18000,
        taxaDepreciacaoAnualPct: 4.0,
        tempoPosseMeses: 30,
        horizonteProjecaoAnos: 5,
        custoManutencaoMensal: 650,
      }),
    ];
  });

  const [imovelAtivoIdx, setImovelAtivoIdx] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Formulário de Simulação / Cadastro de Novo Imóvel
  const [form, setForm] = useState({
    nome: 'Unidade / Imóvel Comercial CT',
    tipoImovel: 'COMERCIAL_GALPAO',
    dataAquisicao: '2024-05-15',
    valorAquisicao: '480000',
    separarTerrenoConstrucao: true,
    valorTerreno: '160000',
    valorConstrucao: '320000',
    itbiValor: '14400',
    escrituraRegistroValor: '9600',
    corretagemEntradaValor: '0',
    reformasIniciaisValor: '18000',
    taxaDepreciacaoAnualPct: '', // Vazio por padrão para demonstrar ou permitir adoção explícita da premissa padrão (4% a.a.)
    tempoPosseMeses: '30',
    horizonteProjecaoAnos: '5',
    custoManutencaoMensal: '650',
    observacoes: '',
  });

  useEffect(() => {
    if (patrimonioInicialBackend?.imoveis?.length > 0) {
      setImoveis(patrimonioInicialBackend.imoveis);
    }
  }, [patrimonioInicialBackend]);

  // Análise em tempo real do formulário
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
      form.taxaDepreciacaoAnualPct.trim() === '' ? null : Number(form.taxaDepreciacaoAnualPct),
    tempoPosseMeses: Number(form.tempoPosseMeses || 0),
    horizonteProjecaoAnos: Number(form.horizonteProjecaoAnos || 5),
    custoManutencaoMensal: Number(form.custoManutencaoMensal || 0),
  });

  // Aplicar preset automático de custos de transação (ex: 6% ou 7% sobre o valor de aquisição)
  const handleAplicarPresetTransacao = (pctTotal: number) => {
    const val = Number(form.valorAquisicao || 0);
    if (val <= 0) return;
    const itbi = Math.round(val * 0.03); // 3% ITBI
    const cartorio = Math.round(val * 0.02); // 2% Escritura e Registro
    const restante = Math.max(0, Math.round(val * (pctTotal / 100)) - itbi - cartorio);
    setForm((prev) => ({
      ...prev,
      itbiValor: String(itbi),
      escrituraRegistroValor: String(cartorio),
      reformasIniciaisValor: String(restante),
    }));
  };

  const handleRegistrarImovelNoPatrimonio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analiseSimulada.validacaoOk) {
      setFeedbackMsg({
        tipo: 'erro',
        texto: `Solicitação de variáveis: informe ${analiseSimulada.camposFaltantes.join(', ')} antes de registrar.`,
      });
      return;
    }

    setSalvando(true);
    setFeedbackMsg(null);
    try {
      const res = await adminApi.saveRealEstateAsset({
        ...form,
        valorAquisicao: Number(form.valorAquisicao),
        valorTerreno: Number(form.valorTerreno || 0),
        valorConstrucao: Number(form.valorConstrucao || 0),
        itbiValor: Number(form.itbiValor || 0),
        escrituraRegistroValor: Number(form.escrituraRegistroValor || 0),
        corretagemEntradaValor: Number(form.corretagemEntradaValor || 0),
        reformasIniciaisValor: Number(form.reformasIniciaisValor || 0),
        taxaDepreciacaoAnualPct:
          form.taxaDepreciacaoAnualPct.trim() === '' ? null : Number(form.taxaDepreciacaoAnualPct),
        tempoPosseMeses: Number(form.tempoPosseMeses || 0),
        horizonteProjecaoAnos: Number(form.horizonteProjecaoAnos || 5),
        custoManutencaoMensal: Number(form.custoManutencaoMensal || 0),
      });

      if (res.data?.portfolio?.imoveis) {
        setImoveis(res.data.portfolio.imoveis);
        setImovelAtivoIdx(0);
      } else {
        setImoveis((prev) => [analiseSimulada, ...prev]);
        setImovelAtivoIdx(0);
      }
      setFeedbackMsg({
        tipo: 'ok',
        texto: 'Imóvel registrado e integrado ao cálculo do Patrimônio Líquido Total do sistema!',
      });
      if (onPortfolioChanged) onPortfolioChanged();
    } catch {
      // Fallback local imediato caso a API esteja offline
      setImoveis((prev) => [analiseSimulada, ...prev]);
      setImovelAtivoIdx(0);
      setFeedbackMsg({
        tipo: 'ok',
        texto: 'Análise patrimonial do imóvel registrada e integrada ao Patrimônio Líquido!',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverImovel = async (id: string) => {
    if (!confirm('Remover este imóvel da carteira patrimonial?')) return;
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

  // Consolidado de todos os imóveis registrados no Patrimônio Líquido
  const custoTotalCarteira = imoveis.reduce((acc, i) => acc + (i.custoTotalAquisicao || 0), 0);
  const valorLiquidoCarteira = imoveis.reduce((acc, i) => acc + (i.valorLiquidoAtualEstimado || 0), 0);
  const desvalorizacaoTotalCarteiraRs = custoTotalCarteira - valorLiquidoCarteira;
  const desvalorizacaoTotalCarteiraPct =
    custoTotalCarteira > 0 ? round2((desvalorizacaoTotalCarteiraRs / custoTotalCarteira) * 100) : 0;
  const patrimonioBrutoNominal = caixaOperacionalAcumulado + custoTotalCarteira;
  const patrimonioLiquidoRealSistema = caixaOperacionalAcumulado + valorLiquidoCarteira;

  const imovelExibido = imoveis[imovelAtivoIdx] || analiseSimulada;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. CABEÇALHO E IMPACTO NO PATRIMÔNIO LÍQUIDO TOTAL DO SISTEMA */}
      <div className="bg-gradient-to-r from-[#17171D] via-[#141418] to-red-950/30 border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600 text-white">
                🏢 Módulo Patrimonial — Gestão & Desvalorização de Imóveis
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Ativo de Liquidez Reduzida & Depreciação Contínua
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1.5">
              Análise de Perda de Entrada (Custos Afundados), Depreciação Física e Patrimônio Líquido Real
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Contabiliza o impacto imediato dos custos de transação no Dia 1 (ITBI, escritura, registro, corretagem e reformas), isola o terreno da área construída e deduz a depreciação acumulada diretamente do Patrimônio Líquido Total.
            </p>
          </div>

          <div className="bg-[#101014] border border-zinc-700/80 rounded-2xl p-3.5 shrink-0 min-w-[260px]">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              💎 Patrimônio Líquido Real Ajustado (Caixa + Imóveis)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {formatarMoeda(patrimonioLiquidoRealSistema)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between gap-2">
              <span>Nominal s/ depreciação: {formatarMoeda(patrimonioBrutoNominal)}</span>
              <span className="text-red-400 font-bold">
                -{formatarMoeda(desvalorizacaoTotalCarteiraRs)} ({desvalorizacaoTotalCarteiraPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* 4 INDICADORES PATRIMONIAIS OBRIGATÓRIOS EM DESTAQUE (DO IMÓVEL / SIMULAÇÃO ATIVA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Custo Total de Aquisição */}
          <div className="bg-[#121216] border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              1. Custo Total de Aquisição (Desembolsado)
            </span>
            <div className="text-xl font-black text-white">
              {formatarMoeda(analiseSimulada.custoTotalAquisicao)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Imóvel: <strong>{formatarMoeda(analiseSimulada.valorAquisicao)}</strong> + Taxas/Reformas:{' '}
              <strong className="text-amber-300">
                {formatarMoeda(analiseSimulada.custosTransacaoDetalhados.totalCustosTransacaoRs)} (
                {analiseSimulada.custosTransacaoDetalhados.percentualSobreValorImovelPct}%)
              </strong>
            </p>
          </div>

          {/* Card 2: Valor Líquido Atual Estimado */}
          <div className="bg-[#121216] border border-emerald-500/40 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              2. Valor Líquido Atual Estimado ({analiseSimulada.tempoPosseMeses}m)
            </span>
            <div className="text-xl font-black text-emerald-300">
              {formatarMoeda(analiseSimulada.valorLiquidoAtualEstimado)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Dia 1 (pós-taxas): <strong>{formatarMoeda(analiseSimulada.valorLiquidoDia1)}</strong> • Residual Bruto:{' '}
              <strong>{formatarMoeda(analiseSimulada.valorResidualBrutoAtual)}</strong>
            </p>
          </div>

          {/* Card 3: Desvalorização Acumulada (R$ e %) */}
          <div className="bg-[#121216] border border-red-500/40 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
              3. Desvalorização Acumulada (R$ e %)
            </span>
            <div className="text-xl font-black text-red-400">
              -{formatarMoeda(analiseSimulada.desvalorizacaoLiquidaTotalRs)}{' '}
              <span className="text-sm font-black text-amber-300">
                (-{analiseSimulada.desvalorizacaoLiquidaTotalPct}%)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Entrada (Dia 1): <strong>-{formatarMoeda(analiseSimulada.perdaImediataEntradaRs)}</strong> • Física:{' '}
              <strong>-{formatarMoeda(analiseSimulada.depreciacaoFisicaAcumuladaRs)}</strong>
              {analiseSimulada.manutencaoAcumuladaPosseRs > 0
                ? ` • Manut.: -${formatarMoeda(analiseSimulada.manutencaoAcumuladaPosseRs)}`
                : ''}
            </p>
          </div>

          {/* Card 4: Ritmo de Queda Mensal / Anual */}
          <div className="bg-[#121216] border border-amber-500/40 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              4. Ritmo de Queda Mensal / Anual
            </span>
            <div className="text-lg font-black text-amber-300">
              -{formatarMoeda(analiseSimulada.ritmoQuedaMensalRs)}/mês{' '}
              <span className="text-xs text-zinc-300 font-bold">
                (-{formatarMoeda(analiseSimulada.ritmoQuedaAnualRs)}/ano)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Com manutenção ({formatarMoeda(analiseSimulada.custoManutencaoMensal)}/mês):{' '}
              <strong className="text-red-300">
                -{formatarMoeda(analiseSimulada.ritmoQuedaComManutencaoAnualRs)}/ano
              </strong>
            </p>
          </div>
        </div>

        {/* BANNER EXPLÍCITO DA PREMISSA DE TAXA DE DESVALORIZAÇÃO ADOTADA */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            analiseSimulada.premissaTaxaPadraoAdotada
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-zinc-900/80 border-zinc-700 text-zinc-200'
          }`}
        >
          <div>
            <span className="font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-black/40 mr-2">
              {analiseSimulada.premissaTaxaPadraoAdotada
                ? '⚠️ Premissa Padrão Aplicada'
                : '✓ Premissa Customizada'}
            </span>
            <span className="font-medium">{analiseSimulada.textoPremissaAdotada}</span>
          </div>
          {analiseSimulada.separarTerrenoConstrucao && (
            <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-zinc-700 text-[11px] font-bold text-emerald-300 shrink-0">
              Terreno Isolado: {formatarMoeda(analiseSimulada.valorTerrenoIsolado)} | Edificação Depreciável:{' '}
              {formatarMoeda(analiseSimulada.baseDepreciavelEdificacao)}
            </span>
          )}
        </div>
      </div>

      {/* 2. CALCULADORA & SIMULADOR INTERATIVO DE AQUISIÇÃO, CUSTOS DE ENTRADA E DEPRECIAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleRegistrarImovelNoPatrimonio}
          className="lg:col-span-5 bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm sm:text-base font-black text-white">
              🧮 Parâmetros de Aquisição & Premissas de Depreciação
            </h3>
            <p className="text-[11px] text-zinc-400">
              Altere qualquer variável para recalcular o impacto de entrada (Dia 1) e a curva de desvalorização em tempo real.
            </p>
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
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                Identificação / Nome do Imóvel:
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                placeholder="Ex: Galpão Sede CT Borü"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Valor de Aquisição (R$): *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
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
                  className="w-full bg-[#0E0E11] border border-red-500/50 rounded-xl px-3 py-2 text-xs text-white font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Data de Aquisição:
                </label>
                <input
                  type="date"
                  value={form.dataAquisicao}
                  onChange={(e) => setForm({ ...form, dataAquisicao: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* DIFERENCIAÇÃO TERRENO VS CONSTRUÇÃO */}
            <div className="p-3 rounded-xl bg-[#1A1A20] border border-zinc-800 space-y-2.5">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-xs font-black text-white">
                  🏗️ Separar Terreno vs. Área Construída (Edificação)
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
              <p className="text-[10px] text-zinc-400">
                Quando ativado, a depreciação física incide <strong>apenas sobre a área construída</strong>, mantendo o valor do terreno isolado.
              </p>

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

            {/* CUSTOS DE TRANSAÇÃO NA COMPRA (PERDA PATRIMONIAL IMEDIATA NO DIA 1) */}
            <div className="p-3 rounded-xl bg-[#1A1A20] border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300">
                  💸 Custos de Transação na Compra (Perda Imediata Dia 1)
                </span>
                <div className="flex items-center gap-1">
                  {[5, 6, 8].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleAplicarPresetTransacao(pct)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-amber-500 hover:text-black text-[10px] font-bold text-zinc-300 transition"
                      title={`Preencher automaticamente com ${pct}% de custos de entrada`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">ITBI (R$):</label>
                  <input
                    type="number"
                    min="0"
                    value={form.itbiValor}
                    onChange={(e) => setForm({ ...form, itbiValor: e.target.value })}
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">
                    Escritura & Registro (R$):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.escrituraRegistroValor}
                    onChange={(e) =>
                      setForm({ ...form, escrituraRegistroValor: e.target.value })
                    }
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">
                    Corretagem / Taxas (R$):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.corretagemEntradaValor}
                    onChange={(e) =>
                      setForm({ ...form, corretagemEntradaValor: e.target.value })
                    }
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-0.5">
                    Reformas Iniciais (R$):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.reformasIniciaisValor}
                    onChange={(e) =>
                      setForm({ ...form, reformasIniciaisValor: e.target.value })
                    }
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* TAXA DE DEPRECIAÇÃO, TEMPO DE POSSE, PROJEÇÃO E MANUTENÇÃO */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Taxa Depreciação (% a.a.):
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={form.taxaDepreciacaoAnualPct}
                  onChange={(e) =>
                    setForm({ ...form, taxaDepreciacaoAnualPct: e.target.value })
                  }
                  placeholder="Vazio = Padrão 4,0% a.a."
                  className="w-full bg-[#0E0E11] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Tempo de Posse (Meses):
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.tempoPosseMeses}
                  onChange={(e) => setForm({ ...form, tempoPosseMeses: e.target.value })}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Horizonte Projeção (Anos):
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.horizonteProjecaoAnos}
                  onChange={(e) =>
                    setForm({ ...form, horizonteProjecaoAnos: e.target.value })
                  }
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  Manutenção Mensal (R$):
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.custoManutencaoMensal}
                  onChange={(e) =>
                    setForm({ ...form, custoManutencaoMensal: e.target.value })
                  }
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
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
              ? 'Registrando no Patrimônio...'
              : '💾 Salvar / Atualizar Imóvel no Patrimônio Líquido'}
          </button>
        </form>

        {/* 3. TABELA DE PROJEÇÃO DE PERDA ACUMULADA (DIA 1, POSSE ATUAL, 1, 3, 5 E X ANOS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  📉 Projeção de Depreciação Progressiva & Perda Acumulada (1, 3, 5 e {analiseSimulada.horizonteProjecaoAnos} Anos)
                </h3>
                <p className="text-xs text-zinc-400">
                  Evolução do valor residual da edificação, terreno isolado e perda acumulada desde o desembolso inicial.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-black shrink-0">
                Taxa: {analiseSimulada.taxaDepreciacaoAnualPct}% a.a. ({analiseSimulada.taxaDepreciacaoMensalPct}% a.m.)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Período / Marco</th>
                    <th className="p-3">Terreno Isolado</th>
                    <th className="p-3">Residual Edificação</th>
                    <th className="p-3">Valor Líquido Real</th>
                    <th className="p-3">Perda Acumulada (R$ / %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {analiseSimulada.projecoesFuturas.map((pt, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-zinc-800/30 transition ${
                        idx === 1 && analiseSimulada.tempoPosseMeses > 0
                          ? 'bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-white">
                        {pt.horizonteLabel}
                        <span className="block text-[10px] text-zinc-500 font-normal">
                          {pt.mesesTotais} meses decorridos
                        </span>
                      </td>
                      <td className="p-3 text-emerald-300 font-semibold">
                        {formatarMoeda(pt.valorTerrenoIsolado)}
                      </td>
                      <td className="p-3 text-zinc-200 font-semibold">
                        {formatarMoeda(pt.valorResidualEdificacao)}
                        {pt.depreciacaoFisicaAcumuladaRs > 0 && (
                          <span className="block text-[10px] text-red-400">
                            Deprec.: -{formatarMoeda(pt.depreciacaoFisicaAcumuladaRs)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-black text-emerald-400">
                        {formatarMoeda(pt.valorLiquidoEstimado)}
                        {pt.manutencaoAcumuladaRs > 0 && (
                          <span className="block text-[10px] text-zinc-400 font-normal">
                            Após -{formatarMoeda(pt.manutencaoAcumuladaRs)} manut.
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-black text-red-400">
                        -{formatarMoeda(pt.desvalorizacaoLiquidaComManutencaoRs)}{' '}
                        <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/30 text-[10px] text-amber-300">
                          -{pt.desvalorizacaoLiquidaComManutencaoPct}%
                        </span>
                        <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">
                          S/ manut.: -{formatarMoeda(pt.desvalorizacaoAcumuladaRs)} (-{pt.desvalorizacaoAcumuladaPct}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARTEIRA DE IMÓVEIS CADASTRADOS NO PATRIMÔNIO DO SISTEMA */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                🏛️ Imóveis Registrados no Balanço Patrimonial ({imoveis.length})
              </h4>
              <span className="text-[11px] text-zinc-400">
                Valor Líquido Total Recuperável:{' '}
                <strong className="text-emerald-400">{formatarMoeda(valorLiquidoCarteira)}</strong>
              </span>
            </div>

            <div className="space-y-2.5">
              {imoveis.map((im, i) => (
                <div
                  key={im.id || i}
                  onClick={() => {
                    setImovelAtivoIdx(i);
                    setForm({
                      nome: im.nome || '',
                      tipoImovel: im.tipoImovel || 'COMERCIAL_GALPAO',
                      dataAquisicao: im.dataAquisicao || '2024-05-15',
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
                    imovelExibido?.id === im.id
                      ? 'bg-zinc-900 border-amber-500/50'
                      : 'bg-[#18181D] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-white text-xs sm:text-sm">{im.nome}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 text-red-300 border border-red-500/30">
                        Perda Acumulada: -{formatarMoeda(im.desvalorizacaoLiquidaTotalRs)} (-
                        {im.desvalorizacaoLiquidaTotalPct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Custo Total Aquisição: <strong>{formatarMoeda(im.custoTotalAquisicao)}</strong> •
                      Valor Líquido Atual:{' '}
                      <strong className="text-emerald-400">
                        {formatarMoeda(im.valorLiquidoAtualEstimado)}
                      </strong>{' '}
                      • Queda: <strong>-{formatarMoeda(im.ritmoQuedaMensalRs)}/mês</strong> (-
                      {formatarMoeda(im.ritmoQuedaAnualRs)}/ano)
                    </p>
                  </div>

                  {imoveis.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoverImovel(im.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-bold border border-red-500/30 shrink-0"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

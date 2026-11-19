import fs from 'fs';
import path from 'path';

export interface RealEstateAssetInput {
  id?: string;
  nome?: string;
  tipoImovel?: string;
  dataAquisicao?: string;
  valorAquisicao?: number;
  separarTerrenoConstrucao?: boolean;
  valorTerreno?: number;
  valorConstrucao?: number;
  // Custos de transação na compra (5% a 8% tipicamente — perda patrimonial imediata / custo afundado no Dia 1)
  itbiValor?: number;
  escrituraRegistroValor?: number;
  corretagemEntradaValor?: number;
  reformasIniciaisValor?: number;
  custosTransacaoTotalOverride?: number;
  // Premissa de depreciação
  taxaDepreciacaoAnualPct?: number | null;
  // Tempo de posse e projeção
  tempoPosseMeses?: number | null;
  horizonteProjecaoAnos?: number | null;
  // Custos recorrentes opcionais de manutenção/conservação
  custoManutencaoMensal?: number | null;
  observacoes?: string;
}

export interface RealEstateProjectionPoint {
  horizonteLabel: string;
  anosTotais: number;
  mesesTotais: number;
  valorTerrenoIsolado: number;
  valorResidualEdificacao: number;
  valorResidualBrutoImovel: number;
  manutencaoAcumuladaRs: number;
  valorLiquidoEstimado: number;
  perdaImediataEntradaRs: number;
  depreciacaoFisicaAcumuladaRs: number;
  desvalorizacaoAcumuladaRs: number;
  desvalorizacaoAcumuladaPct: number;
  desvalorizacaoLiquidaComManutencaoRs: number;
  desvalorizacaoLiquidaComManutencaoPct: number;
}

export interface RealEstateAnalysisResult {
  validacaoOk: boolean;
  camposFaltantes: string[];
  mensagemSolicitacao?: string;
  id: string;
  nome: string;
  tipoImovel: string;
  dataAquisicao: string;
  // Premissa explícita
  premissaTaxaPadraoAdotada: boolean;
  taxaDepreciacaoAnualPct: number;
  taxaDepreciacaoMensalPct: number;
  textoPremissaAdotada: string;
  // Valores de aquisição e custos afundados de entrada (Dia 1)
  valorAquisicao: number;
  separarTerrenoConstrucao: boolean;
  valorTerrenoIsolado: number;
  baseDepreciavelEdificacao: number;
  custosTransacaoDetalhados: {
    itbiValor: number;
    escrituraRegistroValor: number;
    corretagemEntradaValor: number;
    reformasIniciaisValor: number;
    totalCustosTransacaoRs: number;
    percentualSobreValorImovelPct: number;
  };
  // 4 Indicadores Obrigatórios em Destaque
  custoTotalAquisicao: number; // Imóvel + Taxas/Impostos/Reformas
  valorLiquidoDia1: number; // Custo Total - Custos de Transação (Perda imediata no Dia 1)
  perdaImediataEntradaRs: number;
  perdaImediataEntradaPct: number;
  tempoPosseMeses: number;
  tempoPosseAnos: number;
  depreciacaoFisicaAcumuladaRs: number;
  valorResidualEdificacaoAtual: number;
  valorResidualBrutoAtual: number;
  custoManutencaoMensal: number;
  manutencaoAcumuladaPosseRs: number;
  valorLiquidoAtualEstimado: number;
  desvalorizacaoAcumuladaRs: number; // Perda de entrada + Depreciação física
  desvalorizacaoAcumuladaPct: number;
  desvalorizacaoLiquidaTotalRs: number; // Perda de entrada + Depreciação física + Manutenção acumulada
  desvalorizacaoLiquidaTotalPct: number;
  ritmoQuedaMensalRs: number;
  ritmoQuedaAnualRs: number;
  ritmoQuedaComManutencaoMensalRs: number;
  ritmoQuedaComManutencaoAnualRs: number;
  horizonteProjecaoAnos: number;
  projecoesFuturas: RealEstateProjectionPoint[];
  observacoes?: string;
}

const TAXA_DEPRECIACAO_PADRAO_ANUAL_PCT = 4.0; // 4% a.a. sobre a edificação (vida útil técnica de 25 anos)
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'patrimonio_imoveis.json');

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Calcula a análise patrimonial completa de um imóvel:
 * 1. Impacto imediato na compra (Desvalorização de entrada / custos afundados no Dia 1)
 * 2. Diferenciação Terreno vs. Construção (depreciação física apenas sobre a área construída)
 * 3. Depreciação progressiva contínua (mensal e anual) + manutenção recorrente opcional
 * 4. Projeção de perda acumulada para 1, 3, 5 e X anos
 */
export function calculateRealEstateDepreciation(input: RealEstateAssetInput): RealEstateAnalysisResult {
  const camposFaltantes: string[] = [];
  const valorAquisicao = Number(input.valorAquisicao || 0);

  if (!input.valorAquisicao || Number.isNaN(valorAquisicao) || valorAquisicao <= 0) {
    camposFaltantes.push('Valor de aquisição do imóvel (R$)');
  }

  // Verifica se a taxa de depreciação foi informada ou se devemos assumir a premissa padrão explícita
  const taxaInformada =
    input.taxaDepreciacaoAnualPct !== undefined &&
    input.taxaDepreciacaoAnualPct !== null &&
    String(input.taxaDepreciacaoAnualPct).trim() !== '' &&
    !Number.isNaN(Number(input.taxaDepreciacaoAnualPct));

  const premissaTaxaPadraoAdotada = !taxaInformada;
  const taxaDepreciacaoAnualPct = taxaInformada
    ? Math.max(0, Number(input.taxaDepreciacaoAnualPct))
    : TAXA_DEPRECIACAO_PADRAO_ANUAL_PCT;
  const taxaDepreciacaoMensalPct = round2(taxaDepreciacaoAnualPct / 12);

  // Separação Terreno vs Construção
  let separarTerrenoConstrucao = Boolean(input.separarTerrenoConstrucao);
  let valorTerrenoIsolado = 0;
  let baseDepreciavelEdificacao = Math.max(0, valorAquisicao);

  if (
    separarTerrenoConstrucao ||
    (Number(input.valorTerreno || 0) > 0 && Number(input.valorConstrucao || 0) > 0)
  ) {
    separarTerrenoConstrucao = true;
    valorTerrenoIsolado = Math.max(0, Number(input.valorTerreno || 0));
    const construcaoInformada = Number(input.valorConstrucao || 0);
    baseDepreciavelEdificacao =
      construcaoInformada > 0
        ? construcaoInformada
        : Math.max(0, valorAquisicao - valorTerrenoIsolado);
  }

  // Custos de transação na compra (ITBI, escritura, registro, corretagem e reformas iniciais)
  const itbiValor = Math.max(0, Number(input.itbiValor || 0));
  const escrituraRegistroValor = Math.max(0, Number(input.escrituraRegistroValor || 0));
  const corretagemEntradaValor = Math.max(0, Number(input.corretagemEntradaValor || 0));
  const reformasIniciaisValor = Math.max(0, Number(input.reformasIniciaisValor || 0));

  const somaItensTransacao =
    itbiValor + escrituraRegistroValor + corretagemEntradaValor + reformasIniciaisValor;
  const totalCustosTransacaoRs =
    input.custosTransacaoTotalOverride !== undefined &&
    input.custosTransacaoTotalOverride !== null &&
    Number(input.custosTransacaoTotalOverride) > 0 &&
    somaItensTransacao === 0
      ? round2(Number(input.custosTransacaoTotalOverride))
      : round2(somaItensTransacao);

  const percentualSobreValorImovelPct =
    valorAquisicao > 0 ? round2((totalCustosTransacaoRs / valorAquisicao) * 100) : 0;

  // Impacto imediato na compra (Dia 1):
  // Custo Total Desembolsado = Valor do Imóvel + Custos de Transação/Reformas
  // Os custos de transação são contabilizados como perda patrimonial imediata (custo afundado) no Dia 1.
  const custoTotalAquisicao = round2(valorAquisicao + totalCustosTransacaoRs);
  const perdaImediataEntradaRs = round2(totalCustosTransacaoRs);
  const perdaImediataEntradaPct =
    custoTotalAquisicao > 0 ? round2((perdaImediataEntradaRs / custoTotalAquisicao) * 100) : 0;
  const valorLiquidoDia1 = round2(valorAquisicao);

  // Tempo de posse (em meses)
  let tempoPosseMeses = 0;
  if (input.tempoPosseMeses !== undefined && input.tempoPosseMeses !== null && String(input.tempoPosseMeses) !== '') {
    tempoPosseMeses = Math.max(0, Number(input.tempoPosseMeses));
  } else if (input.dataAquisicao) {
    const dtAq = new Date(input.dataAquisicao);
    if (!Number.isNaN(dtAq.getTime())) {
      const diffMs = Date.now() - dtAq.getTime();
      tempoPosseMeses = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
    }
  }
  const tempoPosseAnos = round2(tempoPosseMeses / 12);

  // Ritmo de queda (depreciação física anual e mensal sobre a área construída/edificação)
  const ritmoQuedaAnualRs = round2(baseDepreciavelEdificacao * (taxaDepreciacaoAnualPct / 100));
  const ritmoQuedaMensalRs = round2(ritmoQuedaAnualRs / 12);

  // Custos recorrentes de manutenção/conservação
  const custoManutencaoMensal = Math.max(0, Number(input.custoManutencaoMensal || 0));
  const ritmoQuedaComManutencaoMensalRs = round2(ritmoQuedaMensalRs + custoManutencaoMensal);
  const ritmoQuedaComManutencaoAnualRs = round2(ritmoQuedaAnualRs + custoManutencaoMensal * 12);

  // Depreciação física acumulada até o momento atual de posse
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

  // Desvalorização Acumulada (Custos afundados de entrada + Depreciação física acumulada)
  const desvalorizacaoAcumuladaRs = round2(custoTotalAquisicao - valorResidualBrutoAtual);
  const desvalorizacaoAcumuladaPct =
    custoTotalAquisicao > 0 ? round2((desvalorizacaoAcumuladaRs / custoTotalAquisicao) * 100) : 0;

  // Desvalorização Líquida Total (incluindo dreno acumulado de manutenção/conservação)
  const desvalorizacaoLiquidaTotalRs = round2(custoTotalAquisicao - valorLiquidoAtualEstimado);
  const desvalorizacaoLiquidaTotalPct =
    custoTotalAquisicao > 0 ? round2((desvalorizacaoLiquidaTotalRs / custoTotalAquisicao) * 100) : 0;

  const horizonteProjecaoAnos = Math.max(1, Number(input.horizonteProjecaoAnos || 5));

  // Gera pontos de projeção: Dia 1 (Compra), Posse Atual (se > 0), +1 Ano, +3 Anos, +5 Anos, e +X Anos (se diferente)
  const marcosAnosSet = new Set<number>([1, 3, 5, horizonteProjecaoAnos]);
  const marcosAnosOrdenados = Array.from(marcosAnosSet).sort((a, b) => a - b);

  const buildPoint = (label: string, mesesTotais: number): RealEstateProjectionPoint => {
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
      horizonteLabel: label,
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

  const projecoesFuturas: RealEstateProjectionPoint[] = [
    buildPoint('Dia 1 (Impacto Imediato de Entrada)', 0),
  ];

  if (tempoPosseMeses > 0) {
    projecoesFuturas.push(
      buildPoint(`Posse Atual (${tempoPosseMeses} meses / ${tempoPosseAnos} anos)`, tempoPosseMeses)
    );
  }

  for (const anosAdicionais of marcosAnosOrdenados) {
    const mesesAlvo = tempoPosseMeses + Math.round(anosAdicionais * 12);
    projecoesFuturas.push(
      buildPoint(
        tempoPosseMeses > 0
          ? `Projeção +${anosAdicionais} Ano(s) (${round2(mesesAlvo / 12)} anos totais)`
          : `Projeção ${anosAdicionais} Ano(s)`,
        mesesAlvo
      )
    );
  }

  const textoPremissaAdotada = premissaTaxaPadraoAdotada
    ? `Premissa Padrão Adotada: Como a taxa de desvalorização não foi informada manualmente, aplicou-se a taxa técnica padrão de ${TAXA_DEPRECIACAO_PADRAO_ANUAL_PCT.toFixed(1)}% ao ano (${taxaDepreciacaoMensalPct}% ao mês) sobre o valor da edificação (${separarTerrenoConstrucao ? 'mantendo o valor do terreno isolado sem depreciação física' : '100% da base do imóvel'}), somada à perda patrimonial imediata dos custos de transação no Dia 1.`
    : `Premissa Informada pelo Usuário: Taxa de depreciação de ${taxaDepreciacaoAnualPct.toFixed(2)}% ao ano (${taxaDepreciacaoMensalPct}% ao mês) incidente sobre ${separarTerrenoConstrucao ? `a área construída (R$ ${baseDepreciavelEdificacao.toLocaleString('pt-BR')}), com terreno isolado de R$ ${valorTerrenoIsolado.toLocaleString('pt-BR')}` : 'o valor da edificação'}, somada à perda patrimonial imediata dos custos de transação no Dia 1.`;

  return {
    validacaoOk: camposFaltantes.length === 0,
    camposFaltantes,
    mensagemSolicitacao:
      camposFaltantes.length > 0
        ? `Variáveis obrigatórias ausentes para o cálculo patrimonial: ${camposFaltantes.join(', ')}.`
        : undefined,
    id: input.id || `imovel-${Date.now()}`,
    nome: input.nome?.trim() || 'Imóvel / Unidade Patrimonial',
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

const DEFAULT_SEED_PROPERTIES: RealEstateAssetInput[] = [
  {
    id: 'imovel-sede-ct-boru-pvh',
    nome: 'Imóvel Sede & Galpão CT BORÜ (180m² Climatizado — Porto Velho/RO)',
    tipoImovel: 'COMERCIAL_GALPAO',
    dataAquisicao: '2024-05-15',
    valorAquisicao: 480000,
    separarTerrenoConstrucao: true,
    valorTerreno: 160000,
    valorConstrucao: 320000,
    itbiValor: 14400, // 3% ITBI
    escrituraRegistroValor: 9600, // 2% Cartório/Escritura/Registro
    corretagemEntradaValor: 0,
    reformasIniciaisValor: 18000, // Adequação inicial tatame/climatização/elétrica
    taxaDepreciacaoAnualPct: 4.0, // 4% a.a. sobre os R$ 320.000 de área construída
    tempoPosseMeses: 30,
    horizonteProjecaoAnos: 5,
    custoManutencaoMensal: 650, // Conservação predial, IPTU rateado e manutenção estrutural
    observacoes:
      'Ativo imobiliário operacional do CT. Custos de transação (ITBI + Escritura + Reforma Inicial = R$ 42.000 / 8,75%) contabilizados como perda patrimonial imediata no Dia 1; depreciação física de 4% a.a. aplicada exclusivamente sobre a edificação (R$ 320.000), mantendo o terreno (R$ 160.000) isolado.',
  },
];

export function loadStoredRealEstateAssets(): RealEstateAssetInput[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(DEFAULT_SEED_PROPERTIES, null, 2), 'utf8');
      return DEFAULT_SEED_PROPERTIES;
    }
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_SEED_PROPERTIES;
  } catch {
    return DEFAULT_SEED_PROPERTIES;
  }
}

export function saveStoredRealEstateAssets(assets: RealEstateAssetInput[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(assets, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar patrimônio imobiliário:', err);
  }
}

export function getConsolidatedRealEstatePortfolio(caixaOperacionalAcumulado = 0) {
  const rawAssets = loadStoredRealEstateAssets();
  const imoveisAnalisados = rawAssets.map((item) => calculateRealEstateDepreciation(item));

  const custoTotalAquisicaoImoveis = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.custoTotalAquisicao, 0)
  );
  const valorAquisicaoNominalTotal = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.valorAquisicao, 0)
  );
  const perdaImediataEntradaTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.perdaImediataEntradaRs, 0)
  );
  const depreciacaoFisicaAcumuladaTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.depreciacaoFisicaAcumuladaRs, 0)
  );
  const manutencaoAcumuladaTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.manutencaoAcumuladaPosseRs, 0)
  );
  const valorResidualBrutoTotal = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.valorResidualBrutoAtual, 0)
  );
  const valorLiquidoAtualImoveis = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.valorLiquidoAtualEstimado, 0)
  );
  const desvalorizacaoAcumuladaTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.desvalorizacaoAcumuladaRs, 0)
  );
  const desvalorizacaoAcumuladaTotalPct =
    custoTotalAquisicaoImoveis > 0
      ? round2((desvalorizacaoAcumuladaTotalRs / custoTotalAquisicaoImoveis) * 100)
      : 0;
  const desvalorizacaoLiquidaTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.desvalorizacaoLiquidaTotalRs, 0)
  );
  const desvalorizacaoLiquidaTotalPct =
    custoTotalAquisicaoImoveis > 0
      ? round2((desvalorizacaoLiquidaTotalRs / custoTotalAquisicaoImoveis) * 100)
      : 0;
  const ritmoQuedaMensalTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.ritmoQuedaMensalRs, 0)
  );
  const ritmoQuedaAnualTotalRs = round2(
    imoveisAnalisados.reduce((acc, cur) => acc + cur.ritmoQuedaAnualRs, 0)
  );

  // Integração direta ao Patrimônio Líquido Total do sistema de gestão:
  // O patrimônio líquido considera o valor líquido recuperável real dos imóveis (já descontando custos afundados de entrada, depreciação acumulada e manutenção), em vez do custo nominal de aquisição.
  const patrimonioBrutoSemDesvalorizacao = round2(
    caixaOperacionalAcumulado + custoTotalAquisicaoImoveis
  );
  const patrimonioLiquidoRealAjustado = round2(
    caixaOperacionalAcumulado + valorLiquidoAtualImoveis
  );

  return {
    imoveis: imoveisAnalisados,
    consolidado: {
      totalImoveis: imoveisAnalisados.length,
      valorAquisicaoNominalTotal,
      custoTotalAquisicaoImoveis,
      perdaImediataEntradaTotalRs,
      depreciacaoFisicaAcumuladaTotalRs,
      manutencaoAcumuladaTotalRs,
      valorResidualBrutoTotal,
      valorLiquidoAtualImoveis,
      desvalorizacaoAcumuladaTotalRs,
      desvalorizacaoAcumuladaTotalPct,
      desvalorizacaoLiquidaTotalRs,
      desvalorizacaoLiquidaTotalPct,
      ritmoQuedaMensalTotalRs,
      ritmoQuedaAnualTotalRs,
      caixaOperacionalAcumulado: round2(caixaOperacionalAcumulado),
      patrimonioBrutoSemDesvalorizacao,
      patrimonioLiquidoRealAjustado,
      impactoPatrimonialTotalRs: desvalorizacaoLiquidaTotalRs,
    },
  };
}

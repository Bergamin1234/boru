import fs from 'fs';
import path from 'path';

/**
 * Arredonda um número para 2 casas decimais com segurança contra NaN/null.
 */
export function round2(n: number | string | null | undefined): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Categorias contábeis classificadas como Investimento de Capital (CAPEX).
 */
export const INVESTIMENTO_CATEGORIES = [
  'CAPEX_IMOBILIZADO',
  'INVESTIMENTO_EQUIPAMENTOS',
  'CAPEX_INTANGIVEL',
  'INVESTIMENTO_EXPANSAO',
  'OUTROS_INVESTIMENTOS',
] as const;

export function isInvestimentoCategory(categoria?: string | null): boolean {
  if (!categoria) return false;
  return (INVESTIMENTO_CATEGORIES as readonly string[]).includes(categoria);
}

/**
 * Verifica se o plano do aluno é Diária Avulsa ou Convênio (Wellhub / Gympass / TotalPass).
 */
export function isDiariaOuConvenioPlan(plano?: string | null): boolean {
  if (!plano) return false;
  const p = plano.toLowerCase();
  return (
    p.includes('diária') ||
    p.includes('diaria') ||
    p.includes('wellhub') ||
    p.includes('totalpass') ||
    p.includes('gympass') ||
    p.includes('convênio') ||
    p.includes('convenio')
  );
}

/**
 * Retorna o valor mensal padrão de referência de acordo com o nome do plano.
 */
export function inferPlanDefaultValue(plano?: string | null, fallback = 160): number {
  if (!plano) return fallback;
  const p = plano.toLowerCase();
  if (isDiariaOuConvenioPlan(p)) return 40;
  if (p.includes('2x')) return 130;
  if (p.includes('3x')) return 160;
  if (p.includes('5x')) return 200;
  if (p.includes('todos') || p.includes('livre') || p.includes('ilimitado')) return 280;
  return fallback;
}

/**
 * Infere o turno de treino ('MANHA' | 'TARDE' | 'NOITE') a partir de um horário ou turno explícito.
 */
export function inferTrainingShift(
  date: Date = new Date(),
  explicitShift?: string | null
): 'MANHA' | 'TARDE' | 'NOITE' {
  if (explicitShift === 'MANHA' || explicitShift === 'TARDE' || explicitShift === 'NOITE') {
    return explicitShift;
  }
  const h = date.getHours();
  if (h < 12) return 'MANHA';
  if (h < 18) return 'TARDE';
  return 'NOITE';
}

/**
 * Retorna o início (00:00:00.000) e o fim (23:59:59.999) de um dia.
 */
export function getDayBounds(date: Date = new Date()): { inicioDia: Date; fimDia: Date } {
  const inicioDia = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const fimDia = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { inicioDia, fimDia };
}

/**
 * Retorna o início e o fim de um mês específico (mes: 1 a 12).
 */
export function getMonthBounds(ano: number, mes: number): { inicioMes: Date; fimMes: Date } {
  const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
  return { inicioMes, fimMes };
}

/**
 * Leitura segura de arquivo JSON em disco com valor padrão de fallback.
 */
export function readJsonStorageFile<T>(filePath: string, fallback: T, createIfMissing = false): T {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      if (createIfMissing) {
        fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
      }
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/**
 * Escrita segura de arquivo JSON em disco criando diretórios necessários.
 */
export function writeJsonStorageFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Erro ao salvar arquivo JSON (${filePath}):`, err);
  }
}

/**
 * Consolida entradas e saídas de uma sessão de caixa diário a partir de uma lista de transações.
 */
export function summarizeCashRegisterTransactions(
  transacoes: Array<{ tipo: string; metodoPagamento?: string | null; valor: number }>,
  saldoInicialDinheiro = 0
) {
  let entradasDinheiro = 0;
  let entradasPix = 0;
  let entradasCartao = 0;
  let saidasDinheiro = 0;

  for (const t of transacoes) {
    if (t.tipo === 'ENTRADA') {
      if (t.metodoPagamento === 'DINHEIRO') entradasDinheiro += t.valor;
      else if (t.metodoPagamento === 'PIX') entradasPix += t.valor;
      else entradasCartao += t.valor;
    } else if (t.tipo === 'SAIDA') {
      if (t.metodoPagamento === 'DINHEIRO') saidasDinheiro += t.valor;
    }
  }

  const saldoEsperadoDinheiro = round2(saldoInicialDinheiro + entradasDinheiro - saidasDinheiro);

  return {
    entradasDinheiro: round2(entradasDinheiro),
    entradasPix: round2(entradasPix),
    entradasCartao: round2(entradasCartao),
    saidasDinheiro: round2(saidasDinheiro),
    saldoEsperadoDinheiro,
    totalTransacoes: transacoes.length,
  };
}

/**
 * Formata horários e rótulos curtos de eventos de aula (ex: "16:00", "16h", "16h Felipe").
 */
export function formatClassEventScheduleTime(
  dataInicio: Date | string,
  professorNome?: string | null
): {
  dateObj: Date;
  dataIso: string;
  horaStr: string;
  horaCurta: string;
  profCurto: string;
  horarioFormatado: string;
} {
  const d = new Date(dataInicio);
  const dataIso = d.toISOString().split('T')[0];
  const horaStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const horaCurta = d.getMinutes() > 0 ? `${d.getHours()}h${d.getMinutes()}` : `${d.getHours()}h`;
  const profCurto = professorNome ? professorNome.split(' ')[0] : 'Felipe';
  const horarioFormatado = `${horaCurta} ${profCurto}`;

  return {
    dateObj: d,
    dataIso,
    horaStr,
    horaCurta,
    profCurto,
    horarioFormatado,
  };
}


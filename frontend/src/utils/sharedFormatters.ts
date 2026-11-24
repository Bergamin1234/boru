/**
 * Utilitários, constantes e formatadores compartilhados do frontend CT BORÜ.
 */

export function round2(n: number | string | null | undefined): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function formatarMoeda(valor: number | string | null | undefined): string {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Aplica máscara de CPF (000.000.000-00) enquanto o usuário digita.
 */
export function formatarCpfInput(val: string): string {
  let v = (val || '').replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v;
}

/**
 * Valida dígitos verificadores oficiais de um CPF brasileiro.
 */
export function validarCPF(cpfRaw: string): boolean {
  const cpf = (cpfRaw || '').replace(/[^\d]+/g, '');
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i), 10) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i), 10) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

/**
 * Gera link oficial do WhatsApp (wa.me) normalizando DDI +55 para números brasileiros.
 */
export function formatarWhatsUrl(telefone?: string | null, mensagem = ''): string {
  let limpo = (telefone || '').replace(/\D/g, '');
  if (!limpo) return '#';
  if (!limpo.startsWith('55') && (limpo.length === 10 || limpo.length === 11)) {
    limpo = '55' + limpo;
  }
  return `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Verifica se o plano do aluno é Diária Avulsa ou Convênio (Wellhub / Gympass / TotalPass).
 */
export function isDiariaOuConvenio(plano?: string | null): boolean {
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
export function getValorPadraoPlano(plano?: string | null, fallback = 160): number {
  if (!plano) return fallback;
  const p = plano.toLowerCase();
  if (isDiariaOuConvenio(p)) return 40;
  if (p.includes('2x')) return 130;
  if (p.includes('3x')) return 160;
  if (p.includes('5x')) return 200;
  if (p.includes('todos') || p.includes('livre') || p.includes('ilimitado')) return 280;
  return fallback;
}

/**
 * Avança ou retrocede mês/ano mantendo o intervalo válido (1..12).
 */
export function shiftMonthYear(
  mesAtual: number,
  anoAtual: number,
  delta: number
): { mes: number; ano: number } {
  let novoMes = mesAtual + delta;
  let novoAno = anoAtual;
  if (novoMes > 12) {
    novoMes = 1;
    novoAno += 1;
  } else if (novoMes < 1) {
    novoMes = 12;
    novoAno -= 1;
  }
  return { mes: novoMes, ano: novoAno };
}

export const GRADUACOES_POR_MODALIDADE: Record<string, string[]> = {
  'Muay Thai': [
    'Prajied Branco',
    'Prajied Branco e Amarelo',
    'Prajied Amarelo',
    'Prajied Amarelo e Branco Ponta',
    'Prajied Laranja',
    'Prajied Verde',
    'Prajied Azul Claro',
    'Prajied Azul Escuro',
    'Prajied Azul Escuro e Preto',
    'Prajied Marrom',
    'Prajied Vermelho',
    'Prajied Vermelho e Preto',
    'Prajied Preto',
  ],
  'Jiu-Jitsu': [
    'Faixa Branca',
    'Faixa Azul',
    'Faixa Roxa',
    'Faixa Marrom',
    'Faixa Preta 1º Grau',
    'Faixa Preta 2º Grau',
    'Faixa Preta 3º Grau',
    'Faixa Coral (Vermelha e Preta)',
    'Faixa Vermelha',
  ],
  Taekwondo: [
    'Faixa Branca',
    'Faixa Amarela',
    'Faixa Verde',
    'Faixa Azul',
    'Faixa Vermelha',
    'Faixa Ponta Preta',
    'Faixa Preta 1º Dan',
    'Faixa Preta 2º Dan',
    'Faixa Preta 3º Dan',
    'Faixa Preta 4º Dan',
    'Faixa Preta 5º Dan',
  ],
  Boxe: [
    'Sem faixa (Graduação por experiência e cartel)',
    '1 a 3 anos de prática',
    '3 a 5 anos de prática',
    '5 a 10 anos de prática',
    'Mais de 10 anos / Veterano',
    'Ex-Atleta Profissional',
  ],
  MMA: [
    'Sem faixa (Graduação por experiência e cartel)',
    '1 a 3 anos de prática',
    '3 a 5 anos de prática',
    '5 a 10 anos de prática',
    'Mais de 10 anos / Veterano',
    'Ex-Atleta Profissional',
  ],
  '[DEV-SYSTEM]': [
    'Desenvolvedor do Sistema [DEV-SYSTEM]',
    'Arquiteto & Engenheiro de Software Full-Stack',
    'Tech Lead & DevOps / Cloud',
    'Administrador Técnico do Sistema',
    'Segurança & Infraestrutura de TI',
  ],
  'Administração Geral': [
    'Gestão Operacional & Financeira',
    'Diretoria & Coordenação Geral',
    'Supervisão & Atendimento',
    'Financeiro & Contabilidade',
  ],
};

export const TEMPOS_DE_AULA = ['45 min', '60 min', '75 min', '90 min', '120 min'];

export const OPCOES_TEMPO_DOCENCIA = [
  'Iniciando docência (menos de 1 ano)',
  '1 a 3 anos dando aulas',
  '3 a 5 anos dando aulas',
  '5 a 10 anos lecionando',
  'Mais de 10 anos como professor / Mestre',
];

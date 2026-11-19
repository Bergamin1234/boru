import { PrismaClient } from '@prisma/client';

export interface CheckinAccessProfile {
  historicoVerificado: boolean;
  verificacaoHistoricoSolicitada: boolean;
  mensagemVerificacao?: string;
  alunoIdentificacao: {
    id: string;
    nome: string;
    matricula: string;
    cpf?: string | null;
  };
  isPrimeiroCheckin: boolean;
  tagPerfilAcesso: 'Fez seu primeiro check-in' | 'Check-in recorrente' | 'Aguardando verificação de histórico' | 'Sem check-ins registrados';
  perfilAcessoCodigo: 'PRIMEIRO_CHECKIN' | 'RECORRENTE' | 'VERIFICACAO_PENDENTE' | 'SEM_ACESSOS';
  resumoClassificacao: string;
  checkinsAnterioresCount: number;
  totalAcessos: number;
  numeroDesteAcesso: number;
  registroAtualDataHora: string;
  dataPrimeiroCheckin: string | null;
  dataUltimoAcessoAnterior: string | null;
  alertaOperacionalAcolhimento: string | null;
}

const VALID_CHECKIN_STATUSES = ['AGENDADO', 'PRESENTE', 'DOENCA', 'JUSTIFICADO'];

export function buildStudentMatricula(aluno: { id: string; cpf?: string | null; criadoEm?: Date | string | null }): string {
  const ano = aluno.criadoEm ? new Date(aluno.criadoEm).getFullYear() : new Date().getFullYear();
  const sufixo = aluno.cpf
    ? String(aluno.cpf).replace(/\D/g, '').slice(-4)
    : String(aluno.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `BORU-${ano}-${sufixo || '0001'}`;
}

/**
 * Regra de Identificação de Primeiro Check-in (Portal/Academia):
 * - Verifica identificação do aluno (ID, nome, matrícula), histórico de check-ins anteriores e data/hora do check-in atual.
 * - Se check-ins anteriores == 0 -> "Fez seu primeiro check-in" (apenas na 1ª vez, com alerta operacional de acolhimento).
 * - Se check-ins anteriores >= 1 -> "Check-in recorrente" (aluno recorrente/ativo, mantendo data do 1º check-in salva).
 * - Se o histórico não for fornecido/verificado -> solicita verificação do histórico sem assumir que é a 1ª vez.
 */
export async function evaluateCheckinAccessProfile(
  prisma: PrismaClient,
  params: {
    alunoId?: string;
    alunoNome?: string;
    alunoCpf?: string | null;
    alunoCriadoEm?: Date | string | null;
    currentCheckinId?: string | null;
    currentCheckinDate?: Date | string | null;
    historicoFornecido?: {
      checkinsAnterioresCount?: number;
      dataUltimoAcesso?: string | null;
      dataPrimeiroCheckin?: string | null;
    } | null;
     exigirHistoricoExplicitoSemBanco?: boolean;
  }
): Promise<CheckinAccessProfile> {
  const agoraIso = params.currentCheckinDate
    ? new Date(params.currentCheckinDate).toISOString()
    : new Date().toISOString();

  // 1. Verifica identificação do aluno
  if (!params.alunoId && !params.alunoNome && !params.alunoCpf) {
    return {
      historicoVerificado: false,
      verificacaoHistoricoSolicitada: true,
      mensagemVerificacao:
        'Identificação do aluno/usuário (ID, nome ou matrícula) ausente. Solicite a identificação e verifique o histórico de check-ins antes de aplicar a marcação.',
      alunoIdentificacao: {
        id: '',
        nome: 'Não identificado',
        matricula: 'PENDENTE',
        cpf: null,
      },
      isPrimeiroCheckin: false,
      tagPerfilAcesso: 'Aguardando verificação de histórico',
      perfilAcessoCodigo: 'VERIFICACAO_PENDENTE',
      resumoClassificacao: 'Verificação pendente: informe ID, nome ou matrícula e consulte o histórico de check-ins.',
      checkinsAnterioresCount: 0,
      totalAcessos: 0,
      numeroDesteAcesso: 0,
      registroAtualDataHora: agoraIso,
      dataPrimeiroCheckin: null,
      dataUltimoAcessoAnterior: null,
      alertaOperacionalAcolhimento: null,
    };
  }

  // Se foi exigido histórico explícito na entrada e não foi fornecido, não assume 1ª vez
  if (params.exigirHistoricoExplicitoSemBanco && (!params.historicoFornecido || typeof params.historicoFornecido.checkinsAnterioresCount !== 'number')) {
    const matriculaFallback = buildStudentMatricula({
      id: params.alunoId || params.alunoNome || '0000',
      cpf: params.alunoCpf,
      criadoEm: params.alunoCriadoEm,
    });
    return {
      historicoVerificado: false,
      verificacaoHistoricoSolicitada: true,
      mensagemVerificacao:
        'O histórico de check-ins anteriores do usuário não foi fornecido na entrada de dados. Não é permitido assumir automaticamente que é a primeira vez — verifique o histórico de acessos antes de aplicar a marcação.',
      alunoIdentificacao: {
        id: params.alunoId || '',
        nome: params.alunoNome || 'Aluno',
        matricula: matriculaFallback,
        cpf: params.alunoCpf || null,
      },
      isPrimeiroCheckin: false,
      tagPerfilAcesso: 'Aguardando verificação de histórico',
      perfilAcessoCodigo: 'VERIFICACAO_PENDENTE',
      resumoClassificacao: 'Histórico não fornecido: solicite a verificação do histórico de check-ins antes de classificar.',
      checkinsAnterioresCount: 0,
      totalAcessos: 0,
      numeroDesteAcesso: 0,
      registroAtualDataHora: agoraIso,
      dataPrimeiroCheckin: null,
      dataUltimoAcessoAnterior: null,
      alertaOperacionalAcolhimento: null,
    };
  }

  let alunoNome = params.alunoNome || 'Aluno';
  let alunoCpf = params.alunoCpf || null;
  let alunoCriadoEm = params.alunoCriadoEm || null;
  let alunoId = params.alunoId || '';

  if (alunoId && (!params.alunoNome || !params.alunoCpf)) {
    const alunoDb = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: { id: true, nome: true, cpf: true, criadoEm: true },
    });
    if (alunoDb) {
      alunoNome = alunoDb.nome;
      alunoCpf = alunoDb.cpf;
      alunoCriadoEm = alunoDb.criadoEm;
    }
  }

  const matricula = buildStudentMatricula({ id: alunoId || alunoNome, cpf: alunoCpf, criadoEm: alunoCriadoEm });

  let checkinsAnterioresCount = 0;
  let dataPrimeiroCheckin: string | null = null;
  let dataUltimoAcessoAnterior: string | null = null;

  if (params.historicoFornecido && typeof params.historicoFornecido.checkinsAnterioresCount === 'number') {
    checkinsAnterioresCount = Math.max(0, params.historicoFornecido.checkinsAnterioresCount);
    dataUltimoAcessoAnterior = params.historicoFornecido.dataUltimoAcesso || null;
    dataPrimeiroCheckin =
      checkinsAnterioresCount === 0
        ? agoraIso
        : params.historicoFornecido.dataPrimeiroCheckin || params.historicoFornecido.dataUltimoAcesso || agoraIso;
  } else if (alunoId) {
    // Busca todos os check-ins válidos do aluno no banco ordenados cronologicamente
    const todosCheckins = await prisma.agendamentoPresenca.findMany({
      where: {
        alunoId,
        status: { in: VALID_CHECKIN_STATUSES },
      },
      orderBy: [{ data: 'asc' }, { criadoEm: 'asc' }],
      select: {
        id: true,
        data: true,
        criadoEm: true,
        status: true,
      },
    });

    const anteriores = params.currentCheckinId
      ? todosCheckins.filter((c) => c.id !== params.currentCheckinId)
      : todosCheckins;

    checkinsAnterioresCount = anteriores.length;

    if (anteriores.length > 0) {
      const primeiro = anteriores[0];
      const ultimo = anteriores[anteriores.length - 1];
      dataPrimeiroCheckin = new Date(primeiro.criadoEm || primeiro.data).toISOString();
      dataUltimoAcessoAnterior = new Date(ultimo.criadoEm || ultimo.data).toISOString();
    } else {
      dataPrimeiroCheckin = agoraIso;
      dataUltimoAcessoAnterior = null;
    }
  }

  const isPrimeiroCheckin = checkinsAnterioresCount === 0;
  const totalAcessos = checkinsAnterioresCount + 1;
  const numeroDesteAcesso = totalAcessos;

  const tagPerfilAcesso = isPrimeiroCheckin ? 'Fez seu primeiro check-in' : 'Check-in recorrente';
  const perfilAcessoCodigo = isPrimeiroCheckin ? 'PRIMEIRO_CHECKIN' : 'RECORRENTE';
  const resumoClassificacao = isPrimeiroCheckin
    ? 'Fez seu primeiro check-in (Estreante na unidade — 1º acesso registrado)'
    : `Check-in recorrente (${totalAcessos}º acesso no portal • ${checkinsAnterioresCount} check-in(s) anterior(es))`;

  const alertaOperacionalAcolhimento = isPrimeiroCheckin
    ? `ACOLHIMENTO INICIAL: ${alunoNome} (${matricula}) fez seu primeiro check-in na unidade! Realizar recepção de boas-vindas, apresentação do espaço/tatame e acompanhamento de entrada.`
    : null;

  return {
    historicoVerificado: true,
    verificacaoHistoricoSolicitada: false,
    alunoIdentificacao: {
      id: alunoId,
      nome: alunoNome,
      matricula,
      cpf: alunoCpf,
    },
    isPrimeiroCheckin,
    tagPerfilAcesso,
    perfilAcessoCodigo,
    resumoClassificacao,
    checkinsAnterioresCount,
    totalAcessos,
    numeroDesteAcesso,
    registroAtualDataHora: agoraIso,
    dataPrimeiroCheckin,
    dataUltimoAcessoAnterior,
    alertaOperacionalAcolhimento,
  };
}

/**
 * Calcula em lote o histórico de check-ins para todos os alunos ou registros de presença,
 * identificando com precisão qual registro foi o 1º check-in de cada aluno e quais são recorrentes.
 */
export async function buildCheckinHistoryMapForStudents(
  prisma: PrismaClient,
  alunoIds?: string[]
): Promise<{
  porCheckinId: Map<
    string,
    {
      isPrimeiroCheckin: boolean;
      tagPerfilAcesso: 'Fez seu primeiro check-in' | 'Check-in recorrente';
      numeroAcesso: number;
      totalAcessosAluno: number;
      checkinsAnterioresCount: number;
      dataPrimeiroCheckin: string;
      dataUltimoAcessoAnterior: string | null;
      alertaOperacionalAcolhimento: string | null;
    }
  >;
  porAlunoId: Map<
    string,
    {
      totalAcessos: number;
      primeiroCheckinId: string | null;
      dataPrimeiroCheckin: string | null;
      dataUltimoCheckin: string | null;
      fezPrimeiroCheckin: boolean;
      isEstreanteNoPrimeiroAcesso: boolean;
      tagPerfilAtual: 'Fez seu primeiro check-in' | 'Check-in recorrente' | 'Sem check-ins registrados';
      resumoHistorico: string;
    }
  >;
}> {
  const whereClause: any = {
    status: { in: VALID_CHECKIN_STATUSES },
  };
  if (alunoIds && alunoIds.length > 0) {
    whereClause.alunoId = { in: alunoIds };
  }

  const registros = await prisma.agendamentoPresenca.findMany({
    where: whereClause,
    orderBy: [{ data: 'asc' }, { criadoEm: 'asc' }],
    select: {
      id: true,
      alunoId: true,
      data: true,
      criadoEm: true,
      status: true,
    },
  });

  const porCheckinId = new Map<string, any>();
  const porAlunoId = new Map<string, any>();

  const agrupadoPorAluno = new Map<string, typeof registros>();
  for (const reg of registros) {
    const lista = agrupadoPorAluno.get(reg.alunoId) || [];
    lista.push(reg);
    agrupadoPorAluno.set(reg.alunoId, lista);
  }

  for (const [alunoId, lista] of agrupadoPorAluno.entries()) {
    const totalAcessos = lista.length;
    const primeiro = lista[0];
    const ultimo = lista[lista.length - 1];
    const dataPrimeiroIso = new Date(primeiro.criadoEm || primeiro.data).toISOString();
    const dataUltimoIso = new Date(ultimo.criadoEm || ultimo.data).toISOString();

    lista.forEach((item, index) => {
      const numeroAcesso = index + 1;
      const isPrimeiro = index === 0;
      const anterior = index > 0 ? lista[index - 1] : null;
      const dataAnteriorIso = anterior ? new Date(anterior.criadoEm || anterior.data).toISOString() : null;

      porCheckinId.set(item.id, {
        isPrimeiroCheckin: isPrimeiro,
        tagPerfilAcesso: isPrimeiro ? 'Fez seu primeiro check-in' : 'Check-in recorrente',
        numeroAcesso,
        totalAcessosAluno: totalAcessos,
        checkinsAnterioresCount: index,
        dataPrimeiroCheckin: dataPrimeiroIso,
        dataUltimoAcessoAnterior: dataAnteriorIso,
        alertaOperacionalAcolhimento: isPrimeiro
          ? 'Estreante na unidade: realizar acolhimento inicial, apresentação do espaço e acompanhamento de entrada.'
          : null,
      });
    });

    // O aluno é considerado "Fez seu primeiro check-in" em destaque se tiver exatamente 1 acesso registrado no histórico;
    // a partir do 2º check-in passa a ser "Check-in recorrente" (aluno recorrente/ativo).
    const isUnicoPrimeiroAcesso = totalAcessos === 1;

    porAlunoId.set(alunoId, {
      totalAcessos,
      primeiroCheckinId: primeiro.id,
      dataPrimeiroCheckin: dataPrimeiroIso,
      dataUltimoCheckin: dataUltimoIso,
      fezPrimeiroCheckin: totalAcessos >= 1,
      isEstreanteNoPrimeiroAcesso: isUnicoPrimeiroAcesso,
      tagPerfilAtual: isUnicoPrimeiroAcesso ? 'Fez seu primeiro check-in' : 'Check-in recorrente',
      resumoHistorico: isUnicoPrimeiroAcesso
        ? 'Fez seu primeiro check-in (1º acesso na academia — acolhimento inicial)'
        : `Check-in recorrente (${totalAcessos} acessos registrados)`,
    });
  }

  return { porCheckinId, porAlunoId };
}

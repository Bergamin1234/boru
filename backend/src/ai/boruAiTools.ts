import { PrismaClient } from '@prisma/client';
import { Type, FunctionDeclaration } from '@google/genai';
import {
  BORU_OFFICIAL_KNOWLEDGE,
  extractPhoneSearchVariants,
  formatPhoneBr,
  normalizePhoneE164
} from './boruAiKnowledge';
import { ensureMonthClassesCreated } from '../classScheduleRoutes';

// ============================================================================
// DECLARAÇÕES DE FERRAMENTAS (GEMINI FUNCTION CALLING)
// ============================================================================

export const BORU_AI_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'consultar_aluno',
    description:
      'Consulta a situação cadastral, plano contratado, prajied/graduação, contrato eletrônico, XP/pontos da Trilha do Nak Muay e frequência recente de um aluno pelo telefone, CPF ou nome.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        telefone: { type: Type.STRING, description: 'Telefone do aluno ou contato' },
        cpf: { type: Type.STRING, description: 'CPF do aluno (opcional)' },
        nome: { type: Type.STRING, description: 'Nome do aluno (opcional)' }
      }
    }
  },
  {
    name: 'consultar_plano',
    description:
      'Consulta os planos oficiais do BORÜ Centro de Combate (2x, 3x, 5x, Livre, Diária), valores atualizados, benefícios, links de matrícula e convênios aceitos (Wellhub, TotalPass, OAB/RO).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filtroPlano: {
          type: Type.STRING,
          description: 'Filtro opcional de plano (ex: 2x, 3x, 5x, livre, diaria, wellhub, totalpass, todos)'
        }
      }
    }
  },
  {
    name: 'consultar_financeiro',
    description:
      'Consulta mensalidades, vencimentos, faturas pendentes ou em atraso de um aluno cadastrado.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        alunoId: { type: Type.STRING, description: 'ID do aluno no sistema (opcional se informar telefone ou CPF)' },
        telefone: { type: Type.STRING, description: 'Telefone do aluno' },
        cpf: { type: Type.STRING, description: 'CPF do aluno (opcional)' }
      }
    }
  },
  {
    name: 'consultar_horarios',
    description:
      'Consulta a grade de horários oficial real do BORÜ Centro de Combate por dia da semana, turno (manhã, tarde, noite) ou modalidade (Adultos, Kids, Corujão).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        turno: { type: Type.STRING, description: 'Turno opcional: MANHA, TARDE, NOITE ou TODOS' },
        modalidade: { type: Type.STRING, description: 'Modalidade opcional: Muay Thai, Kids, Corujão, Jiu-Jitsu' }
      }
    }
  },
  {
    name: 'consultar_disponibilidade',
    description:
      'Consulta as turmas reais do calendário e verifica a disponibilidade exata de vagas em uma data específica (YYYY-MM-DD) ou hoje/amanhã.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        data: { type: Type.STRING, description: 'Data desejada no formato YYYY-MM-DD ou DD/MM/YYYY' },
        horario: { type: Type.STRING, description: 'Horário específico opcional (ex: 19:00)' }
      }
    }
  },
  {
    name: 'cadastrar_interessado',
    description:
      'Registra ou atualiza um potencial cliente (lead) no CRM do BORÜ com nome, telefone, objetivo, modalidade de interesse, experiência prévia e disponibilidade.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nome: { type: Type.STRING, description: 'Nome do interessado' },
        telefone: { type: Type.STRING, description: 'Telefone com DDD' },
        objetivo: { type: Type.STRING, description: 'Objetivo (ex: Condicionamento, Defesa Pessoal, Emagrecimento, Competição, Infantil)' },
        modalidade: { type: Type.STRING, description: 'Modalidade de interesse (ex: Muay Thai, Muay Thai Kids, Jiu-Jitsu)' },
        experiencia: { type: Type.STRING, description: 'Se já praticou artes marciais ou é iniciante' },
        disponibilidade: { type: Type.STRING, description: 'Turnos ou horários de preferência' }
      },
      required: ['nome']
    }
  },
  {
    name: 'agendar_aula_experimental',
    description:
      'Realiza o agendamento oficial de uma aula experimental gratuita no sistema BORÜ após validar disponibilidade e evitar duplicidade.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        nome: { type: Type.STRING, description: 'Nome completo do interessado' },
        telefone: { type: Type.STRING, description: 'Telefone do interessado' },
        data: { type: Type.STRING, description: 'Data da aula experimental (ex: DD/MM/YYYY ou YYYY-MM-DD)' },
        horario: { type: Type.STRING, description: 'Horário escolhido da grade oficial (ex: 19:00, 16:00, 20:00, 18:00)' },
        modalidade: { type: Type.STRING, description: 'Modalidade escolhida (ex: Muay Thai, Muay Thai Kids)' },
        observacao: { type: Type.STRING, description: 'Observações sobre objetivo ou experiência do aluno' }
      },
      required: ['nome', 'data', 'horario']
    }
  },
  {
    name: 'atualizar_crm',
    description:
      'Atualiza a etapa do funil comercial, observações, reagendamento ou cancelamento de aula experimental no CRM.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        etapaFunil: {
          type: Type.STRING,
          description: 'Nova etapa: RECEPCAO, QUALIFICACAO, APRESENTACAO_PLANOS, AGENDAMENTO_EXPERIMENTAL, EXPERIMENTAL_AGENDADA, POS_EXPERIMENTAL, MATRICULADO'
        },
        statusExperimental: {
          type: Type.STRING,
          description: 'Status opcional na tabela AgendamentoExperimental: PENDENTE, REALIZADA, FECHOU_CONTRATO, DESISTIU'
        },
        novaData: { type: Type.STRING, description: 'Nova data em caso de reagendamento' },
        novoHorario: { type: Type.STRING, description: 'Novo horário em caso de reagendamento' },
        observacao: { type: Type.STRING, description: 'Nota de acompanhamento comercial' }
      }
    }
  },
  {
    name: 'registrar_solicitacao',
    description:
      'Registra uma solicitação administrativa ou comercial formal (pausa de plano, alteração de plano, negociação financeira, suporte ao portal) gerando número de protocolo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipoSolicitacao: {
          type: Type.STRING,
          description: 'Tipo: PAUSA_PLANO, ALTERACAO_PLANO, NEGOCIACAO_FINANCEIRA, PROBLEMA_ADMINISTRATIVO, SUPORTE_PORTAL, CANCELAMENTO'
        },
        descricao: { type: Type.STRING, description: 'Descrição detalhada da solicitação do aluno' },
        prioridade: { type: Type.STRING, description: 'Prioridade: BAIXA, MEDIA, ALTA, URGENTE' }
      },
      required: ['tipoSolicitacao', 'descricao']
    }
  },
  {
    name: 'enviar_cobranca_autorizada',
    description:
      'Consulta a mensalidade pendente/atrasada do aluno e retorna os dados oficiais de pagamento (PIX oficial e link do Portal do Aluno) sem gerar cobrança duplicada.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        alunoId: { type: Type.STRING, description: 'ID do aluno (opcional se já identificado pelo telefone)' },
        mensalidadeId: { type: Type.STRING, description: 'ID da mensalidade específica (opcional)' }
      }
    }
  },
  {
    name: 'consultar_pagamento',
    description:
      'Verifica no sistema financeiro (Mensalidade e TransacaoFinanceira) se um pagamento já consta como PAGO/CONFIRMADO. Nunca confirma pagamento sem esta validação.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        alunoId: { type: Type.STRING, description: 'ID do aluno (opcional)' },
        telefone: { type: Type.STRING, description: 'Telefone do aluno (opcional)' },
        cpf: { type: Type.STRING, description: 'CPF do aluno (opcional)' }
      }
    }
  },
  {
    name: 'registrar_atendimento',
    description:
      'Registra o resumo contextual e a classificação da intenção do atendimento atual no histórico da conversa.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        intencao: { type: Type.STRING, description: 'Intenção principal detectada' },
        resumo: { type: Type.STRING, description: 'Resumo objetivo do que foi tratado' }
      },
      required: ['intencao', 'resumo']
    }
  },
  {
    name: 'transferir_atendimento_humano',
    description:
      'Transfere imediatamente a conversa para um atendente humano e pausa a IA para este contato. Obrigatório em pedidos de cancelamento, reclamações delicadas, divergências financeiras, pedido explícito por humano ou falta de permissão.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        motivo: { type: Type.STRING, description: 'Motivo claro da transferência para o atendente humano' },
        informacoesColetadas: { type: Type.STRING, description: 'Dados já coletados do cliente na conversa' },
        acoesRealizadas: { type: Type.STRING, description: 'O que a IA já consultou ou registrou' },
        proximaProvidenciaRecomendada: { type: Type.STRING, description: 'Recomendação prática para o atendente humano' },
        prioridade: { type: Type.STRING, description: 'ALTA, URGENTE ou MEDIA' }
      },
      required: ['motivo', 'proximaProvidenciaRecomendada']
    }
  }
];

// ============================================================================
// CONTEXTO DE EXECUÇÃO DAS FERRAMENTAS
// ============================================================================

export interface ToolExecutionContext {
  prisma: PrismaClient;
  conversationId: string;
  telefoneContato: string;
  nomeContato: string;
  alunoId?: string | null;
  experimentalId?: string | null;
}

async function logToolAudit(
  prisma: PrismaClient,
  conversationId: string | undefined,
  toolName: string,
  inputPayload: any,
  outputResult: any,
  sucesso = true,
  autorizado = true,
  categoria = 'TOOL_EXECUTION'
) {
  try {
    await prisma.aiOperationAuditLog.create({
      data: {
        conversationId: conversationId || null,
        toolName,
        categoria,
        inputPayload: JSON.stringify(inputPayload ?? {}),
        outputResult: JSON.stringify(outputResult ?? {}),
        sucesso,
        autorizado,
        executadoPor: 'BORU_IA'
      }
    });
  } catch (err) {
    console.error('Erro ao gravar log de auditoria da IA:', err);
  }
}

export async function findStudentByContact(
  prisma: PrismaClient,
  params: { alunoId?: string | null; telefone?: string | null; cpf?: string | null; nome?: string | null }
) {
  if (params.alunoId) {
    const byId = await prisma.aluno.findUnique({
      where: { id: params.alunoId },
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 6 },
        presencas: { orderBy: { data: 'desc' }, take: 10 },
        contratosLongos: { where: { status: 'ATIVO' }, take: 3 }
      }
    });
    if (byId) return byId;
  }

  if (params.cpf) {
    const cpfDigits = params.cpf.replace(/\D/g, '');
    if (cpfDigits.length >= 11) {
      const byCpf = await prisma.aluno.findFirst({
        where: { OR: [{ cpf: cpfDigits }, { cpf: params.cpf.trim() }] },
        include: {
          mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 6 },
          presencas: { orderBy: { data: 'desc' }, take: 10 },
          contratosLongos: { where: { status: 'ATIVO' }, take: 3 }
        }
      });
      if (byCpf) return byCpf;
    }
  }

  if (params.telefone) {
    const variants = extractPhoneSearchVariants(params.telefone);
    const last8 = variants[variants.length - 1];
    if (last8 && last8.length >= 8) {
      const candidatos = await prisma.aluno.findMany({
        where: {
          telefone: { contains: last8 }
        },
        include: {
          mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 6 },
          presencas: { orderBy: { data: 'desc' }, take: 10 },
          contratosLongos: { where: { status: 'ATIVO' }, take: 3 }
        },
        take: 5
      });
      if (candidatos.length > 0) return candidatos[0];
    }
  }

  if (params.nome && params.nome.trim().length >= 3 && params.nome !== 'Visitante WhatsApp') {
    const byNome = await prisma.aluno.findFirst({
      where: { nome: { contains: params.nome.trim(), mode: 'insensitive' } },
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 6 },
        presencas: { orderBy: { data: 'desc' }, take: 10 },
        contratosLongos: { where: { status: 'ATIVO' }, take: 3 }
      }
    });
    if (byNome) return byNome;
  }

  return null;
}

// ============================================================================
// EXECUTOR CENTRAL DAS 13 FERRAMENTAS AUTORIZADAS
// ============================================================================

export async function executeBoruAiTool(
  toolName: string,
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<Record<string, any>> {
  const { prisma, conversationId, telefoneContato, nomeContato } = ctx;

  try {
    switch (toolName) {
      // ----------------------------------------------------------------------
      // 1. CONSULTAR ALUNO
      // ----------------------------------------------------------------------
      case 'consultar_aluno': {
        const aluno = await findStudentByContact(prisma, {
          alunoId: args.alunoId || ctx.alunoId,
          telefone: args.telefone || telefoneContato,
          cpf: args.cpf,
          nome: args.nome
        });

        if (!aluno) {
          const result = {
            encontrado: false,
            mensagem: 'Nenhum aluno matriculado localizado com este telefone/CPF. Trate o contato como potencial cliente (lead) ou peça o CPF caso ele informe já ser aluno.'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
          return result;
        }

        // Vincula aluno à conversa se ainda não estiver vinculado
        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            alunoId: aluno.id,
            nomeContato: aluno.nome,
            tipoContato: 'ALUNO'
          }
        }).catch(() => null);

        const presencasConfirmadas = aluno.presencas.filter(p => p.status === 'PRESENTE').length;
        const checkinsValidos = [...aluno.presencas]
          .filter(p => ['AGENDADO', 'PRESENTE', 'DOENCA', 'JUSTIFICADO'].includes(p.status))
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        const totalCheckins = checkinsValidos.length;
        const primeiroCheckin = totalCheckins > 0 ? checkinsValidos[0] : null;
        const ultimaPresenca = aluno.presencas.find(p => p.status === 'PRESENTE');
        const mensalidadeAtual = aluno.mensalidades[0] || null;
        const isPrimeiroCheckin = totalCheckins === 1;
        const tagPerfilCheckin =
          totalCheckins === 0
            ? 'Sem check-ins anteriores (Estreante no próximo acesso)'
            : totalCheckins === 1
            ? 'Fez seu primeiro check-in'
            : `Check-in recorrente (${totalCheckins} acessos registrados)`;

        const result = {
          encontrado: true,
          aluno: {
            id: aluno.id,
            nome: aluno.nome,
            cpfMascarado: aluno.cpf ? `***.${aluno.cpf.slice(3, 6)}.${aluno.cpf.slice(6, 9)}-**` : 'Não informado',
            telefone: aluno.telefone,
            planoContratado: aluno.plano || 'Não especificado',
            modalidade: aluno.modalidade || 'Muay Thai',
            graduacaoPrajied: aluno.graduacao || aluno.prajied || 'Branco',
            isBolsista: aluno.is_bolsista,
            contratoAssinado: aluno.has_signed_contract,
            dataAdesao: aluno.data_de_adesao ? aluno.data_de_adesao.toLocaleDateString('pt-BR') : null,
            gamificacao: {
              totalXp: aluno.total_xp,
              pontosDisponiveisLoja: aluno.spendable_points
            },
            frequenciaRecente: {
              presencasNosUltimosRegistros: presencasConfirmadas,
              totalCheckinsRegistrados: totalCheckins,
              isPrimeiroCheckin,
              tagPerfilCheckin,
              dataPrimeiroCheckin: primeiroCheckin ? primeiroCheckin.data.toLocaleDateString('pt-BR') : null,
              ultimoTreinoData: ultimaPresenca ? ultimaPresenca.data.toLocaleDateString('pt-BR') : 'Sem registro recente',
              orientacaoOperacional:
                totalCheckins <= 1
                  ? 'Estreante na unidade (Fez seu primeiro check-in): priorizar acolhimento inicial, apresentação do espaço e acompanhamento de entrada.'
                  : 'Aluno recorrente/ativo no tatame.'
            },
            situacaoFinanceiraResumo: aluno.is_bolsista
              ? 'ISENTO / BOLSISTA'
              : mensalidadeAtual
              ? `${mensalidadeAtual.status} — R$ ${mensalidadeAtual.valor.toFixed(2)} (Vencimento: ${mensalidadeAtual.dataVencimento.toLocaleDateString('pt-BR')})`
              : 'Sem faturas abertas',
            portalDoAlunoUrl: BORU_OFFICIAL_KNOWLEDGE.portalAlunoUrl
          }
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 2. CONSULTAR PLANO
      // ----------------------------------------------------------------------
      case 'consultar_plano': {
        const filtro = String(args.filtroPlano || 'todos').toLowerCase();
        let planos = BORU_OFFICIAL_KNOWLEDGE.planosMensais;
        if (filtro && filtro !== 'todos') {
          const filtrados = planos.filter(
            p =>
              p.nome.toLowerCase().includes(filtro) ||
              p.codigo.toLowerCase().includes(filtro) ||
              p.descricao.toLowerCase().includes(filtro)
          );
          if (filtrados.length > 0) planos = filtrados;
        }

        const result = {
          academia: BORU_OFFICIAL_KNOWLEDGE.nome,
          localizacao: BORU_OFFICIAL_KNOWLEDGE.cidade,
          planosOficiais: planos,
          conveniosAceitos: BORU_OFFICIAL_KNOWLEDGE.conveniosParcerias,
          aulaExperimental: BORU_OFFICIAL_KNOWLEDGE.regrasAulaExperimental,
          observacaoComercial:
            'Todos os planos incluem acompanhamento técnico do Mestre Felipe Borü, acesso ao Portal do Aluno e participação no ranking Trilha do Nak Muay.'
        };
        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 3. CONSULTAR FINANCEIRO
      // ----------------------------------------------------------------------
      case 'consultar_financeiro': {
        const aluno = await findStudentByContact(prisma, {
          alunoId: args.alunoId || ctx.alunoId,
          telefone: args.telefone || telefoneContato,
          cpf: args.cpf
        });

        if (!aluno) {
          const result = {
            encontrado: false,
            mensagem: 'Aluno não localizado pelo telefone atual. Solicite o CPF ou nome completo para consultar a situação financeira.'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
          return result;
        }

        const agora = new Date();
        const mensalidades = aluno.mensalidades.map(m => {
          const vencida = m.status !== 'PAGO' && new Date(m.dataVencimento) < agora;
          return {
            id: m.id,
            valor: m.valor,
            valorFormatado: `R$ ${m.valor.toFixed(2).replace('.', ',')}`,
            dataVencimento: m.dataVencimento.toLocaleDateString('pt-BR'),
            dataPagamento: m.dataPagamento ? m.dataPagamento.toLocaleDateString('pt-BR') : null,
            status: vencida && m.status === 'PENDENTE' ? 'ATRASADO' : m.status
          };
        });

        const pendentesOuAtrasadas = mensalidades.filter(m => m.status === 'PENDENTE' || m.status === 'ATRASADO');
        const config = await prisma.aiAutomationConfig.findUnique({ where: { id: 'default' } }).catch(() => null);

        const result = {
          encontrado: true,
          alunoNome: aluno.nome,
          plano: aluno.plano,
          isBolsista: aluno.is_bolsista,
          possuiPendencia: !aluno.is_bolsista && pendentesOuAtrasadas.length > 0,
          faturasEmAberto: aluno.is_bolsista ? [] : pendentesOuAtrasadas,
          historicoMensalidades: mensalidades,
          canaisPagamentoOficiais: {
            chavePix: config?.pixChaveOficial || 'borucentrodecombate@gmail.com',
            favorecido: config?.pixFavorecido || 'BORÜ Centro de Combate',
            portalAlunoLink: config?.linkPagamentoOficial || BORU_OFFICIAL_KNOWLEDGE.portalAlunoUrl
          }
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 4. CONSULTAR HORÁRIOS
      // ----------------------------------------------------------------------
      case 'consultar_horarios': {
        const professores = await prisma.usuario.findMany({
          where: { ativo: true, cargo: 'PROFESSOR' },
          select: { nome: true, modalidade: true, graduacao: true, horariosAula: true }
        });

        const result = {
          gradeOficialBoru: BORU_OFFICIAL_KNOWLEDGE.gradeHorariaOficial,
          horarioFuncionamentoCT: BORU_OFFICIAL_KNOWLEDGE.funcionamento,
          professoresAtivos: professores.length > 0 ? professores : [{ nome: 'Mestre Felipe Borü', modalidade: 'Muay Thai', graduacao: 'Prajied Azul Escuro e Preto' }],
          dica: 'Turmas de adultos aceitam iniciantes em todos os horários. Turma KIDS (infantil) ocorre Seg/Qua/Sex às 18:00. Turma Corujão ocorre Ter/Qui às 22:30.'
        };
        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 5. CONSULTAR DISPONIBILIDADE
      // ----------------------------------------------------------------------
      case 'consultar_disponibilidade': {
        const hoje = new Date();
        let dataAlvo = new Date();

        const rawData = String(args.data || '').trim().toLowerCase();
        if (rawData.includes('amanha') || rawData.includes('amanhã')) {
          dataAlvo.setDate(hoje.getDate() + 1);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawData)) {
          dataAlvo = new Date(rawData + 'T12:00:00');
        } else if (/^\d{2}\/\d{2}(\/\d{4})?$/.test(rawData)) {
          const parts = rawData.split('/');
          const dia = parseInt(parts[0], 10);
          const mes = parseInt(parts[1], 10) - 1;
          const ano = parts[2] ? parseInt(parts[2], 10) : hoje.getFullYear();
          dataAlvo = new Date(ano, mes, dia, 12, 0, 0);
        }

        if (isNaN(dataAlvo.getTime())) {
          dataAlvo = hoje;
        }

        await ensureMonthClassesCreated(prisma, dataAlvo.getFullYear(), dataAlvo.getMonth() + 1);

        const inicioDia = new Date(dataAlvo.getFullYear(), dataAlvo.getMonth(), dataAlvo.getDate(), 0, 0, 0, 0);
        const fimDia = new Date(dataAlvo.getFullYear(), dataAlvo.getMonth(), dataAlvo.getDate(), 23, 59, 59, 999);

        const aulasDia = await prisma.eventoDeAula.findMany({
          where: {
            dataInicio: { gte: inicioDia, lte: fimDia },
            cancelada: false
          },
          include: {
            agendamentos: true
          },
          orderBy: { dataInicio: 'asc' }
        });

        const dataFormatada = dataAlvo.toLocaleDateString('pt-BR');
        const experimentaisNoDia = await prisma.agendamentoExperimental.findMany({
          where: {
            OR: [{ data: dataFormatada }, { data: dataAlvo.toISOString().split('T')[0] }],
            status: 'PENDENTE'
          }
        });

        const turmasDisponiveis = aulasDia.map(aula => {
          const h = String(aula.dataInicio.getHours()).padStart(2, '0') + ':' + String(aula.dataInicio.getMinutes()).padStart(2, '0');
          const expCount = experimentaisNoDia.filter(e => e.horario.startsWith(h)).length;
          const ocupados = aula.agendamentos.length + expCount;
          const vagasRestantes = Math.max(0, aula.capacidade - ocupados);
          return {
            eventoId: aula.id,
            horario: h,
            titulo: aula.titulo,
            modalidade: aula.modalidade,
            professor: aula.professorNome || 'Felipe Borü',
            capacidadeTotal: aula.capacidade,
            ocupados,
            vagasRestantes,
            disponivel: vagasRestantes > 0
          };
        });

        const result = {
          dataConsultada: dataFormatada,
          diaDaSemana: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dataAlvo.getDay()],
          possuiAulasNoDia: turmasDisponiveis.length > 0,
          turmas: turmasDisponiveis
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 6. CADASTRAR INTERESSADO (CRM)
      // ----------------------------------------------------------------------
      case 'cadastrar_interessado': {
        const nomeLead = String(args.nome || nomeContato || 'Interessado WhatsApp').trim();
        const telFormatted = formatPhoneBr(args.telefone || telefoneContato);

        // Atualiza dados de qualificação na conversa
        const convAtualizada = await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            nomeContato: nomeLead,
            objetivoTreino: args.objetivo || undefined,
            modalidadeInteresse: args.modalidade || undefined,
            experienciaPrevia: args.experiencia || undefined,
            disponibilidadeHorario: args.disponibilidade || undefined,
            etapaFunil: 'QUALIFICACAO'
          }
        });

        const result = {
          sucesso: true,
          mensagem: 'Interessado registrado/atualizado no CRM com sucesso.',
          lead: {
            conversationId: convAtualizada.id,
            nome: nomeLead,
            telefone: telFormatted,
            objetivo: convAtualizada.objetivoTreino,
            modalidade: convAtualizada.modalidadeInteresse,
            experiencia: convAtualizada.experienciaPrevia,
            disponibilidade: convAtualizada.disponibilidadeHorario
          }
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 7. AGENDAR AULA EXPERIMENTAL
      // ----------------------------------------------------------------------
      case 'agendar_aula_experimental': {
        const nomeFinal = String(args.nome || nomeContato || 'Visitante').trim();
        const telFinal = formatPhoneBr(args.telefone || telefoneContato);
        const dataStr = String(args.data || '').trim();
        const horarioStr = String(args.horario || '').trim();
        const modalidadeStr = String(args.modalidade || 'Muay Thai').trim();

        if (!dataStr || !horarioStr) {
          const result = {
            sucesso: false,
            erro: 'Data e horário são obrigatórios para confirmar o agendamento da aula experimental.'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, false, true);
          return result;
        }

        // Verifica duplicidade para o mesmo telefone e data/horário
        const variants = extractPhoneSearchVariants(telFinal);
        const last8 = variants[variants.length - 1] || telFinal;

        const existente = await prisma.agendamentoExperimental.findFirst({
          where: {
            telefone: { contains: last8 },
            status: 'PENDENTE'
          }
        });

        const obsCompleta = [
          `[Agendado via BORÜ IA Autônoma]`,
          `Modalidade: ${modalidadeStr}`,
          args.observacao ? `Obs: ${args.observacao}` : ''
        ]
          .filter(Boolean)
          .join(' | ');

        let agendamento;
        let foiReagendado = false;

        if (existente) {
          agendamento = await prisma.agendamentoExperimental.update({
            where: { id: existente.id },
            data: {
              nome: nomeFinal,
              data: dataStr,
              horario: horarioStr,
              observacao: obsCompleta
            }
          });
          foiReagendado = true;
        } else {
          agendamento = await prisma.agendamentoExperimental.create({
            data: {
              nome: nomeFinal,
              telefone: telFinal,
              data: dataStr,
              horario: horarioStr,
              professorNome: 'Felipe Borü',
              status: 'PENDENTE',
              observacao: obsCompleta
            }
          });
        }

        // Atualiza a conversa com o vínculo da experimental
        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            nomeContato: nomeFinal,
            experimentalId: agendamento.id,
            etapaFunil: 'EXPERIMENTAL_AGENDADA',
            modalidadeInteresse: modalidadeStr
          }
        });

        // Cria tarefa de follow-up / lembrete automático
        const lembreteData = new Date(Date.now() + 1000 * 60 * 60 * 18); // 18h depois ou antes da aula
        await prisma.aiFollowUpTask.create({
          data: {
            conversationId,
            tipoGatilho: 'LEMBRETE_EXPERIMENTAL',
            descricaoMotivo: `Lembrete de Aula Experimental agendada para ${dataStr} às ${horarioStr}`,
            agendadoPara: lembreteData,
            status: 'PENDENTE',
            mensagemSugerida: `Fala, ${nomeFinal}! Passando para confirmar sua aula experimental de ${modalidadeStr} no BORÜ Centro de Combate (${dataStr} às ${horarioStr}). Basta vir com roupa leve de treino e trazer sua garrafinha de água — as luvas nós emprestamos aqui! Bora treinar? 🥊🐺`
          }
        }).catch(() => null);

        const result = {
          sucesso: true,
          reagendado: foiReagendado,
          agendamento: {
            id: agendamento.id,
            nome: agendamento.nome,
            telefone: agendamento.telefone,
            data: agendamento.data,
            horario: agendamento.horario,
            professor: agendamento.professorNome,
            status: agendamento.status
          },
          orientacoesObrigatorias:
            'Confirmado no sistema! Oriente o aluno a chegar 10 minutos antes, vir com roupa esportiva confortável (bermuda e camiseta) e informar na recepção. Luvas higienizadas são emprestadas gratuitamente pelo CT.'
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 8. ATUALIZAR CRM
      // ----------------------------------------------------------------------
      case 'atualizar_crm': {
        const updateConv: Record<string, any> = {};
        if (args.etapaFunil) updateConv.etapaFunil = args.etapaFunil;
        if (args.observacao) updateConv.resumoMemoriaContexto = args.observacao;

        const conv = await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: updateConv
        });

        if (conv.experimentalId && (args.statusExperimental || args.novaData || args.novoHorario || args.observacao)) {
          await prisma.agendamentoExperimental.update({
            where: { id: conv.experimentalId },
            data: {
              ...(args.statusExperimental ? { status: args.statusExperimental } : {}),
              ...(args.novaData ? { data: args.novaData } : {}),
              ...(args.novoHorario ? { horario: args.novoHorario } : {}),
              ...(args.observacao ? { observacao: args.observacao } : {})
            }
          }).catch(() => null);
        }

        const result = {
          sucesso: true,
          etapaFunilAtual: conv.etapaFunil,
          mensagem: 'CRM atualizado com sucesso.'
        };
        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 9. REGISTRAR SOLICITAÇÃO
      // ----------------------------------------------------------------------
      case 'registrar_solicitacao': {
        const protocolo = `BORU-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const ticket = await prisma.aiServiceTicket.create({
          data: {
            protocolo,
            conversationId,
            alunoId: ctx.alunoId || null,
            nomeContato: nomeContato || 'Contato WhatsApp',
            telefone: formatPhoneBr(telefoneContato),
            tipoSolicitacao: args.tipoSolicitacao || 'PROBLEMA_ADMINISTRATIVO',
            descricao: args.descricao || 'Solicitação registrada via WhatsApp',
            prioridade: args.prioridade || 'MEDIA',
            status: 'ABERTO',
            acaoRealizadaIa: 'Protocolo registrado formalmente pela BORÜ IA Autônoma.'
          }
        });

        const result = {
          sucesso: true,
          protocolo: ticket.protocolo,
          tipoSolicitacao: ticket.tipoSolicitacao,
          status: ticket.status,
          mensagem: `Solicitação registrada sob o protocolo ${ticket.protocolo}.`
        };
        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 10. ENVIAR COBRANÇA AUTORIZADA
      // ----------------------------------------------------------------------
      case 'enviar_cobranca_autorizada': {
        const aluno = await findStudentByContact(prisma, {
          alunoId: args.alunoId || ctx.alunoId,
          telefone: telefoneContato
        });

        if (!aluno) {
          const result = {
            sucesso: false,
            erro: 'Aluno não localizado para envio de cobrança. Solicite o CPF primeiro.'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, false, true);
          return result;
        }

        if (aluno.is_bolsista) {
          const result = {
            sucesso: false,
            mensagem: 'Este aluno possui cadastro de Bolsista/Isento e não possui cobranças em aberto.'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
          return result;
        }

        const faturaAberta = aluno.mensalidades.find(m => m.status === 'PENDENTE' || m.status === 'ATRASADO');
        if (!faturaAberta) {
          const result = {
            sucesso: false,
            mensagem: 'Não há nenhuma mensalidade pendente ou em atraso para este aluno. Todas as faturas constam em dia!'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
          return result;
        }

        const config = await prisma.aiAutomationConfig.findUnique({ where: { id: 'default' } }).catch(() => null);

        const result = {
          sucesso: true,
          cobrancaAutorizada: {
            faturaId: faturaAberta.id,
            alunoNome: aluno.nome,
            plano: aluno.plano,
            valor: `R$ ${faturaAberta.valor.toFixed(2).replace('.', ',')}`,
            vencimento: faturaAberta.dataVencimento.toLocaleDateString('pt-BR'),
            status: faturaAberta.status,
            chavePixOficial: config?.pixChaveOficial || 'borucentrodecombate@gmail.com',
            favorecido: config?.pixFavorecido || 'BORÜ Centro de Combate',
            linkPortalAluno: config?.linkPagamentoOficial || BORU_OFFICIAL_KNOWLEDGE.portalAlunoUrl
          }
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 11. CONSULTAR PAGAMENTO
      // ----------------------------------------------------------------------
      case 'consultar_pagamento': {
        const aluno = await findStudentByContact(prisma, {
          alunoId: args.alunoId || ctx.alunoId,
          telefone: args.telefone || telefoneContato,
          cpf: args.cpf
        });

        if (!aluno) {
          const result = {
            encontrado: false,
            pagamentoConfirmadoNoSistema: false,
            mensagem: 'Aluno não localizado. Nunca confirme pagamento sem localizar o registro no sistema.'
          };
          await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
          return result;
        }

        const ultimaPaga = aluno.mensalidades.find(m => m.status === 'PAGO');
        const pendentes = aluno.mensalidades.filter(m => m.status !== 'PAGO');

        const transacoesRecentes = await prisma.transacaoFinanceira.findMany({
          where: {
            alunoId: aluno.id,
            status: 'CONFIRMADO'
          },
          orderBy: { data: 'desc' },
          take: 3
        });

        const result = {
          encontrado: true,
          alunoNome: aluno.nome,
          emDia: aluno.is_bolsista || pendentes.length === 0,
          pagamentoConfirmadoNoSistema: Boolean(ultimaPaga && pendentes.length === 0),
          ultimaMensalidadePaga: ultimaPaga
            ? {
                valor: `R$ ${ultimaPaga.valor.toFixed(2).replace('.', ',')}`,
                dataPagamento: ultimaPaga.dataPagamento ? ultimaPaga.dataPagamento.toLocaleDateString('pt-BR') : 'Confirmado',
                vencimentoReferencia: ultimaPaga.dataVencimento.toLocaleDateString('pt-BR')
              }
            : null,
          pendenciasAbertasCount: pendentes.length,
          transacoesCaixaRecentes: transacoesRecentes.map(t => ({
            descricao: t.descricao,
            valor: `R$ ${t.valor.toFixed(2).replace('.', ',')}`,
            metodo: t.metodoPagamento,
            data: t.data.toLocaleDateString('pt-BR')
          })),
          regraDeSeguranca:
            pendentes.length > 0
              ? 'ATENÇÃO: Ainda consta fatura PENDENTE/ATRASADA no sistema. Se o aluno alegar que já pagou ou enviou comprovante, transfira para o financeiro humano validar.'
              : 'Pagamento validado e confirmado no sistema financeiro do BORÜ.'
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 12. REGISTRAR ATENDIMENTO
      // ----------------------------------------------------------------------
      case 'registrar_atendimento': {
        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            ultimaIntencao: args.intencao || 'ATENDIMENTO_GERAL',
            resumoMemoriaContexto: args.resumo || undefined
          }
        });

        const result = {
          sucesso: true,
          intencaoRegistrada: args.intencao,
          resumo: args.resumo
        };
        await logToolAudit(prisma, conversationId, toolName, args, result, true, true);
        return result;
      }

      // ----------------------------------------------------------------------
      // 13. TRANSFERIR PARA ATENDIMENTO HUMANO
      // ----------------------------------------------------------------------
      case 'transferir_atendimento_humano': {
        const conv = await prisma.whatsAppConversation.findUnique({
          where: { id: conversationId },
          include: {
            mensagens: { orderBy: { criadoEm: 'desc' }, take: 8 }
          }
        });

        const protocolo = `HANDOFF-${Math.floor(100000 + Math.random() * 900000)}`;

        const dossie = {
          protocolo,
          nomeContato: conv?.nomeContato || nomeContato || 'Contato WhatsApp',
          telefone: formatPhoneBr(telefoneContato),
          tipoContato: conv?.tipoContato || 'LEAD',
          motivoAtendimento: args.motivo || 'Solicitação de transferência para atendimento humano',
          informacoesColetadas:
            args.informacoesColetadas ||
            `Objetivo: ${conv?.objetivoTreino || 'N/A'} | Modalidade: ${conv?.modalidadeInteresse || 'Muay Thai'} | Etapa: ${conv?.etapaFunil || 'RECEPCAO'}`,
          acoesRealizadas: args.acoesRealizadas || 'Triagem inicial e registro de contexto realizados pela BORÜ IA.',
          proximaProvidenciaRecomendada:
            args.proximaProvidenciaRecomendada || 'Assumir conversa no painel e dar andamento personalizado.',
          historicoRecente: (conv?.mensagens || [])
            .reverse()
            .map(m => `[${m.remetente}]: ${m.conteudo}`),
          transferidoEm: new Date().toISOString()
        };

        await prisma.whatsAppConversation.update({
          where: { id: conversationId },
          data: {
            statusAtendimento: 'TRANSFERIDA_HUMANO',
            iaPausadaIndividual: true,
            motivoTransferencia: dossie.motivoAtendimento,
            dossieTransferenciaJson: JSON.stringify(dossie),
            naoLidasAdmin: { increment: 1 }
          }
        });

        await prisma.aiServiceTicket.create({
          data: {
            protocolo,
            conversationId,
            alunoId: conv?.alunoId || ctx.alunoId || null,
            nomeContato: dossie.nomeContato,
            telefone: dossie.telefone,
            tipoSolicitacao: 'TRANSFERENCIA_HUMANA',
            descricao: dossie.motivoAtendimento,
            prioridade: args.prioridade || 'ALTA',
            status: 'ABERTO',
            dadosColetadosJson: JSON.stringify(dossie),
            acaoRealizadaIa: dossie.acoesRealizadas,
            proximaProvidencia: dossie.proximaProvidenciaRecomendada
          }
        });

        const result = {
          sucesso: true,
          transferidoParaHumano: true,
          iaPausadaParaEsteContato: true,
          protocoloHandoff: protocolo,
          dossieEntregueAoAtendente: dossie
        };

        await logToolAudit(prisma, conversationId, toolName, args, result, true, true, 'HANDOFF');
        return result;
      }

      default: {
        const result = {
          sucesso: false,
          erro: `Ferramenta '${toolName}' não reconhecida ou não autorizada.`
        };
        await logToolAudit(prisma, conversationId, toolName, args, result, false, false, 'SECURITY_GUARD');
        return result;
      }
    }
  } catch (error: any) {
    const errResult = {
      sucesso: false,
      erro: error?.message || 'Falha interna ao executar ferramenta.'
    };
    await logToolAudit(prisma, conversationId, toolName, args, errResult, false, true);
    return errResult;
  }
}

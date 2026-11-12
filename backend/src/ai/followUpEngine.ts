import { PrismaClient } from '@prisma/client';
import { formatPhoneBr, normalizePhoneE164, BORU_OFFICIAL_KNOWLEDGE } from './boruAiKnowledge';
import { getOrCreateAiConfig, sendWhatsAppCloudMessage } from './whatsappService';

// ============================================================================
// 1. VARREDURA INTELIGENTE DO BANCO PARA GERAR TAREFAS DE FOLLOW-UP
// ============================================================================

export async function scanAndGenerateFollowUpTasks(prisma: PrismaClient) {
  const config = await getOrCreateAiConfig(prisma);
  const agora = new Date();
  let novasTarefasCriadas = 0;

  // Pré-carrega conversas existentes em memória para evitar N+1 queries no banco remoto
  const todasConversas = await prisma.whatsAppConversation.findMany({
    include: { followUps: true }
  });
  const convMap = new Map<string, (typeof todasConversas)[0]>();
  for (const c of todasConversas) {
    convMap.set(c.telefone, c);
  }

  // Helper para garantir conversa associada ao telefone e criar follow-up sem duplicar
  async function ensureFollowUpForContact(params: {
    telefone: string;
    nome: string;
    tipoContato: 'LEAD' | 'ALUNO';
    alunoId?: string | null;
    experimentalId?: string | null;
    tipoGatilho: string;
    descricaoMotivo: string;
    mensagemSugerida: string;
  }) {
    const telNorm = normalizePhoneE164(params.telefone);
    if (!telNorm || telNorm.length < 10) return false;

    let conv = convMap.get(telNorm);

    if (!conv) {
      conv = await prisma.whatsAppConversation.create({
        data: {
          telefone: telNorm,
          telefoneExibicao: formatPhoneBr(telNorm),
          nomeContato: params.nome,
          tipoContato: params.tipoContato,
          alunoId: params.alunoId || null,
          experimentalId: params.experimentalId || null,
          statusAtendimento: 'IA_ATIVA',
          etapaFunil: params.tipoContato === 'ALUNO' ? 'SUPORTE_ALUNO' : 'POS_EXPERIMENTAL'
        },
        include: { followUps: true }
      });
      convMap.set(telNorm, conv);
    }

    if (conv.optOutFollowUp || conv.iaPausadaIndividual || conv.statusAtendimento === 'TRANSFERIDA_HUMANO') {
      return false;
    }

    // Respeita limite máximo de follow-ups por contato
    const enviadosCount = conv.followUps.filter(f => f.status === 'ENVIADO').length;
    if (enviadosCount >= config.maxFollowUpsPerContact) {
      return false;
    }

    // Evita criar tarefa repetida para o mesmo gatilho se já houver PENDENTE ou enviada recentemente
    const limiteRecente = new Date(agora.getTime() - config.minHoursBetweenFollowUps * 60 * 60 * 1000);
    const jaExiste = conv.followUps.some(
      f =>
        f.tipoGatilho === params.tipoGatilho &&
        (f.status === 'PENDENTE' || (f.status === 'ENVIADO' && f.executadoEm && f.executadoEm > limiteRecente))
    );

    if (jaExiste) return false;

    const createdTask = await prisma.aiFollowUpTask.create({
      data: {
        conversationId: conv.id,
        tipoGatilho: params.tipoGatilho,
        descricaoMotivo: params.descricaoMotivo,
        agendadoPara: agora,
        status: 'PENDENTE',
        tentativa: enviadosCount + 1,
        mensagemSugerida: params.mensagemSugerida
      }
    });

    conv.followUps.push(createdTask);
    novasTarefasCriadas++;
    return true;
  }

  // --------------------------------------------------------------------------
  // CASO A: INTERESSADOS QUE REALIZARAM EXPERIMENTAL MAS NÃO SE MATRICULARAM
  // E INTERESSADOS QUE AGENDARAM E NÃO COMPARECERAM
  // --------------------------------------------------------------------------
  const experimentais = await prisma.agendamentoExperimental.findMany({
    where: {
      status: { in: ['REALIZADA', 'PENDENTE'] }
    },
    orderBy: { criadoEm: 'desc' },
    take: 12
  });

  for (const exp of experimentais) {
    if (!exp.telefone) continue;
    const primeiroNome = exp.nome.split(' ')[0];

    if (exp.status === 'REALIZADA') {
      await ensureFollowUpForContact({
        telefone: exp.telefone,
        nome: exp.nome,
        tipoContato: 'LEAD',
        experimentalId: exp.id,
        tipoGatilho: 'POS_EXPERIMENTAL_NAO_MATRICULOU',
        descricaoMotivo: `Realizou aula experimental e ainda não fechou matrícula.`,
        mensagemSugerida: `Fala, ${primeiroNome}! Tudo bem? 🥊 Aqui é do BORÜ Centro de Combate! O Mestre Felipe Borü comentou da sua aula experimental. O que você achou do treino e da nossa estrutura? Se quiser garantir sua vaga oficial no tatame, nossos planos começam a partir de R$ 140/mês (2x) e R$ 160/mês (3x). Posso te ajudar a finalizar sua matrícula hoje? 🐺🔥`
      });
    } else if (exp.status === 'PENDENTE') {
      // Verifica se a data já passou (ex: formato DD/MM/YYYY ou YYYY-MM-DD)
      let dataAula: Date | null = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(exp.data)) {
        dataAula = new Date(exp.data + 'T23:59:59');
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(exp.data)) {
        const [d, m, y] = exp.data.split('/').map(Number);
        dataAula = new Date(y, m - 1, d, 23, 59, 59);
      }

      if (dataAula && dataAula < agora) {
        await ensureFollowUpForContact({
          telefone: exp.telefone,
          nome: exp.nome,
          tipoContato: 'LEAD',
          experimentalId: exp.id,
          tipoGatilho: 'FALTOU_EXPERIMENTAL',
          descricaoMotivo: `Agendou aula experimental em ${exp.data} às ${exp.horario} e não compareceu.`,
          mensagemSugerida: `Olá, ${primeiroNome}! Tudo bem? Sentimos sua falta na aula experimental no BORÜ Centro de Combate (${exp.data} às ${exp.horario}). Imprevistos acontecem! Qual dia e horário desta semana fica melhor para reagendarmos seu treino gratuito? 🥊🐺`
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // CASO B: ALUNOS COM MENSALIDADE PRÓXIMA DO VENCIMENTO (<= 3 DIAS) OU PENDENTE/ATRASADA
  // E ALUNOS HÁ MUITO TEMPO SEM TREINAR (>= 10 DIAS)
  // --------------------------------------------------------------------------
  const alunos = await prisma.aluno.findMany({
    where: {
      telefone: { not: null }
    },
    include: {
      mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 2 },
      presencas: { where: { status: 'PRESENTE' }, orderBy: { data: 'desc' }, take: 1 }
    },
    orderBy: { criadoEm: 'desc' },
    take: 15
  });

  for (const aluno of alunos) {
    if (!aluno.telefone) continue;
    const primeiroNome = aluno.nome.split(' ')[0];

    // 1. Verificação Financeira (apenas não-bolsistas)
    if (!aluno.is_bolsista && aluno.mensalidades.length > 0) {
      const m = aluno.mensalidades[0];
      if (m.status !== 'PAGO') {
        const diffDias = Math.ceil((new Date(m.dataVencimento).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
        const vencFormatado = new Date(m.dataVencimento).toLocaleDateString('pt-BR');
        const valorFormatado = `R$ ${m.valor.toFixed(2).replace('.', ',')}`;

        if (diffDias < 0 || m.status === 'ATRASADO') {
          await ensureFollowUpForContact({
            telefone: aluno.telefone,
            nome: aluno.nome,
            tipoContato: 'ALUNO',
            alunoId: aluno.id,
            tipoGatilho: 'MENSALIDADE_PENDENTE',
            descricaoMotivo: `Mensalidade vencida em ${vencFormatado} (${valorFormatado}).`,
            mensagemSugerida: `Olá, ${primeiroNome}! Tudo bem? 🥊 Passando pelo atendimento do BORÜ Centro de Combate para lembrar que consta em aberto a sua mensalidade com vencimento em ${vencFormatado} (${valorFormatado}). Você pode regularizar via Chave PIX oficial (${config.pixChaveOficial}) ou pelo Portal do Aluno: ${BORU_OFFICIAL_KNOWLEDGE.portalAlunoUrl}. Caso já tenha efetuado o pagamento, basta nos enviar o comprovante por aqui! 🤝🐺`
          });
        } else if (diffDias >= 0 && diffDias <= 3) {
          await ensureFollowUpForContact({
            telefone: aluno.telefone,
            nome: aluno.nome,
            tipoContato: 'ALUNO',
            alunoId: aluno.id,
            tipoGatilho: 'MENSALIDADE_PROXIMA_VENCIMENTO',
            descricaoMotivo: `Mensalidade vence em ${diffDias} dia(s) (${vencFormatado}).`,
            mensagemSugerida: `Fala, ${primeiroNome}! Bons treinos! 🥊 Passando para lembrar que a mensalidade do seu plano no BORÜ Centro de Combate (${valorFormatado}) vence no dia ${vencFormatado}. Para sua comodidade, nossa Chave PIX oficial é ${config.pixChaveOficial} ou acesse ${BORU_OFFICIAL_KNOWLEDGE.portalAlunoUrl}. Oss! 🐺`
          });
        }
      }
    }

    // 2. Verificação de Ausência Prolongada (Aluno sumido dos treinos >= 10 dias)
    const ultimaPresenca = aluno.presencas[0];
    if (ultimaPresenca) {
      const diasSemTreinar = Math.floor((agora.getTime() - new Date(ultimaPresenca.data).getTime()) / (1000 * 60 * 60 * 24));
      if (diasSemTreinar >= 10) {
        await ensureFollowUpForContact({
          telefone: aluno.telefone,
          nome: aluno.nome,
          tipoContato: 'ALUNO',
          alunoId: aluno.id,
          tipoGatilho: 'ALUNO_SUMIDO_TREINO',
          descricaoMotivo: `Aluno está há ${diasSemTreinar} dias sem registrar presença no tatame.`,
          mensagemSugerida: `Fala, ${primeiroNome}! Tudo certo com você? 🥊 Sentimos sua falta nos últimos treinos aqui no tatame do BORÜ! Lembre-se que a constância é o segredo da evolução na Trilha do Nak Muay. Estamos te esperando essa semana para suar o kimono/bandagem com a família BORÜ! Bora voltar? 🐺🔥`
        });
      }
    }
  }

  return { novasTarefasCriadas };
}

// ============================================================================
// 2. EXECUTOR DA FILA DE FOLLOW-UPS AUTORIZADOS
// ============================================================================

export async function processPendingFollowUpTasks(
  prisma: PrismaClient,
  options: { forceIgnoreBusinessHours?: boolean; limit?: number } = {}
) {
  const config = await getOrCreateAiConfig(prisma);

  // REGRA PRINCIPAL: Se a IA estiver DESATIVADA, interrompe imediatamente novos envios
  if (!config.enabled || config.mode === 'MODO_MANUAL') {
    return {
      executados: 0,
      bloqueadoPorEstado: true,
      motivo: 'IA Desativada ou em Modo Manual — nenhum follow-up disparado.'
    };
  }

  const agora = new Date();
  const horaAtual = agora.getHours();

  if (
    config.businessHoursOnlyFollowUp &&
    !options.forceIgnoreBusinessHours &&
    (horaAtual < config.followUpStartHour || horaAtual >= config.followUpEndHour)
  ) {
    return {
      executados: 0,
      bloqueadoPorHorario: true,
      motivo: `Fora da janela comercial configurada (${config.followUpStartHour}h às ${config.followUpEndHour}h).`
    };
  }

  const pendentes = await prisma.aiFollowUpTask.findMany({
    where: {
      status: 'PENDENTE',
      agendadoPara: { lte: options.forceIgnoreBusinessHours ? new Date(Date.now() + 86400000 * 7) : agora }
    },
    include: {
      conversation: true
    },
    orderBy: { agendadoPara: 'asc' },
    take: options.limit || 10
  });

  let executados = 0;

  for (const task of pendentes) {
    const conv = task.conversation;
    if (!conv || conv.optOutFollowUp || conv.iaPausadaIndividual || conv.statusAtendimento === 'TRANSFERIDA_HUMANO') {
      await prisma.aiFollowUpTask.update({
        where: { id: task.id },
        data: { status: 'CANCELADO', erroDetalhe: 'Contato em opt-out ou atendimento humano' }
      });
      continue;
    }

    const texto = task.mensagemSugerida || `Olá, ${conv.nomeContato}! Como podemos te ajudar hoje no BORÜ Centro de Combate? 🥊`;

    if (config.mode === 'IA_ASSISTIDA') {
      // No Modo Assistido, prepara a mensagem para aprovação do humano
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: conv.id,
          direcao: 'OUTBOUND',
          remetente: 'IA',
          remetenteNome: 'BORÜ IA (Follow-up Assistido)',
          tipoMidia: 'TEXT',
          conteudo: texto,
          statusEnvio: 'PENDING_APPROVAL',
          intencaoDetectada: `FOLLOWUP_${task.tipoGatilho}`
        }
      });

      await prisma.aiFollowUpTask.update({
        where: { id: task.id },
        data: {
          status: 'ENVIADO',
          mensagemEnviada: `[Modo Assistido - Aguardando aprovação] ${texto}`,
          executadoEm: new Date()
        }
      });
      executados++;
      continue;
    }

    // Modo IA Autônoma: envia pelo WhatsApp Cloud API / Sandbox
    const sendRes = await sendWhatsAppCloudMessage(prisma, conv.telefone, texto);

    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conv.id,
        externalMessageId: sendRes.externalId || null,
        direcao: 'OUTBOUND',
        remetente: 'IA',
        remetenteNome: 'BORÜ IA (Follow-up Inteligente)',
        tipoMidia: 'TEXT',
        conteudo: texto,
        statusEnvio: sendRes.enviado ? 'SENT' : 'FAILED',
        intencaoDetectada: `FOLLOWUP_${task.tipoGatilho}`,
        erroDetalhe: sendRes.erro || null
      }
    });

    await prisma.aiFollowUpTask.update({
      where: { id: task.id },
      data: {
        status: sendRes.enviado ? 'ENVIADO' : 'FALHOU',
        mensagemEnviada: texto,
        executadoEm: new Date(),
        erroDetalhe: sendRes.erro || null
      }
    });

    await prisma.aiOperationAuditLog.create({
      data: {
        conversationId: conv.id,
        toolName: 'FollowUp_Automatico',
        categoria: 'FOLLOW_UP',
        inputPayload: JSON.stringify({ taskId: task.id, tipoGatilho: task.tipoGatilho }),
        outputResult: JSON.stringify({ enviado: sendRes.enviado, modoEnvio: sendRes.modoEnvio }),
        sucesso: sendRes.enviado,
        autorizado: true,
        executadoPor: 'BORU_IA'
      }
    });

    executados++;
  }

  return {
    executados,
    bloqueadoPorEstado: false
  };
}

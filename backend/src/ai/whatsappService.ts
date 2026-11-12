import { PrismaClient } from '@prisma/client';
import { formatPhoneBr, normalizePhoneE164 } from './boruAiKnowledge';
import { processIncomingMessageWithBoruBrain } from './boruAiBrain';

export interface InboundMessageInput {
  telefone: string;
  nomeContato?: string;
  conteudo: string;
  tipoMidia?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  transcricaoAudio?: string;
  externalMessageId?: string;
  origem?: 'WHATSAPP_WEBHOOK' | 'SIMULADOR_SANDBOX';
  forcarSimulacaoAtiva?: boolean;
}

// ============================================================================
// 1. GERENCIADOR CENTRAL DE ESTADO (ON/OFF E MODO DE OPERAÇÃO NO BACKEND)
// ============================================================================

export async function getOrCreateAiConfig(prisma: PrismaClient) {
  let config = await prisma.aiAutomationConfig.findUnique({ where: { id: 'default' } });
  const hasCloudCredentials = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );

  if (!config) {
    config = await prisma.aiAutomationConfig.create({
      data: {
        id: 'default',
        enabled: false,
        mode: 'IA_AUTONOMA',
        whatsappConnected: hasCloudCredentials,
        whatsappPhoneNumber: '(69) 99238-4491',
        whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
        whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'boru_ia_webhook_verify_2026',
        pixChaveOficial: 'borucentrodecombate@gmail.com',
        pixFavorecido: 'BORÜ Centro de Combate',
        linkPagamentoOficial: 'https://www.borucentrodecombate.com/portal'
      }
    });
  } else if (hasCloudCredentials && !config.whatsappConnected) {
    config = await prisma.aiAutomationConfig.update({
      where: { id: 'default' },
      data: {
        whatsappConnected: true,
        whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || config.whatsappPhoneNumberId
      }
    });
  }

  return config;
}

export async function setMasterAiState(
  prisma: PrismaClient,
  params: {
    enabled?: boolean;
    mode?: 'IA_AUTONOMA' | 'IA_ASSISTIDA' | 'MODO_MANUAL';
    updatedBy?: string;
  }
) {
  const atual = await getOrCreateAiConfig(prisma);

  const novoEnabled = params.enabled !== undefined ? Boolean(params.enabled) : atual.enabled;
  let novoMode = params.mode || atual.mode;

  // Se o administrador clicar em DESATIVAR IA, interrompe imediatamente respostas automáticas
  // Se clicar em ATIVAR IA e estava em MODO_MANUAL, coloca em IA_AUTONOMA (a menos que especificado IA_ASSISTIDA)
  if (params.enabled === true && novoMode === 'MODO_MANUAL' && !params.mode) {
    novoMode = 'IA_AUTONOMA';
  }

  const atualizado = await prisma.aiAutomationConfig.update({
    where: { id: 'default' },
    data: {
      enabled: novoEnabled,
      mode: novoMode,
      updatedBy: params.updatedBy || 'Administrador BORÜ'
    }
  });

  // Registra auditoria centralizada da mudança de estado
  await prisma.aiOperationAuditLog.create({
    data: {
      toolName: novoEnabled ? 'ATIVAR_IA_MASTER' : 'DESATIVAR_IA_MASTER',
      categoria: 'STATE_CHANGE',
      inputPayload: JSON.stringify(params),
      outputResult: JSON.stringify({
        estadoAnterior: { enabled: atual.enabled, mode: atual.mode },
        estadoNovo: { enabled: atualizado.enabled, mode: atualizado.mode }
      }),
      sucesso: true,
      autorizado: true,
      executadoPor: params.updatedBy || 'Administrador BORÜ'
    }
  });

  await prisma.systemLog.create({
    data: {
      level: 'INFO',
      service: 'BORU_IA_AUTONOMA',
      message: `Estado mestre alterado para: ${atualizado.enabled ? 'IA ATIVADA' : 'IA DESATIVADA'} (Modo: ${atualizado.mode}) por ${params.updatedBy || 'Administrador'}`
    }
  }).catch(() => null);

  return atualizado;
}

// ============================================================================
// 2. CLIENTE DE ENVIO WHATSAPP BUSINESS CLOUD API
// ============================================================================

export async function sendWhatsAppCloudMessage(
  prisma: PrismaClient,
  telefoneDestino: string,
  textoMensagem: string
): Promise<{ enviado: boolean; externalId?: string; modoEnvio: string; erro?: string }> {
  const config = await getOrCreateAiConfig(prisma);
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || config.whatsappPhoneNumberId;
  const toE164 = normalizePhoneE164(telefoneDestino);

  if (accessToken && phoneNumberId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: toE164,
          type: 'text',
          text: {
            preview_url: true,
            body: textoMensagem
          }
        })
      });

      const data: any = await response.json();
      if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status} na WhatsApp Cloud API`;
        await prisma.systemLog.create({
          data: {
            level: 'ERROR',
            service: 'WHATSAPP_CLOUD_API',
            message: `Falha ao enviar mensagem para ${toE164}: ${errMsg}`,
            metadata: JSON.stringify(data)
          }
        }).catch(() => null);
        return { enviado: false, modoEnvio: 'CLOUD_API', erro: errMsg };
      }

      const wamid = data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { enviado: true, externalId: wamid, modoEnvio: 'CLOUD_API' };
    } catch (error: any) {
      return {
        enviado: false,
        modoEnvio: 'CLOUD_API',
        erro: error?.message || 'Erro de rede ao comunicar com WhatsApp Cloud API'
      };
    }
  }

  // Modo Sandbox / Homologação (quando credenciais da Meta ainda não estão ativas no .env)
  return {
    enviado: true,
    externalId: `sandbox_wamid_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    modoEnvio: 'SANDBOX_SIMULATOR'
  };
}

// ============================================================================
// 3. PROCESSADOR DE MENSAGENS RECEBIDAS (RESPEITANDO REGRA ON/OFF CENTRAL)
// ============================================================================

export async function handleInboundWhatsAppMessage(
  prisma: PrismaClient,
  input: InboundMessageInput
) {
  const telefoneNorm = normalizePhoneE164(input.telefone);
  if (!telefoneNorm) {
    throw new Error('Telefone do remetente inválido.');
  }

  // 1. Controle de Duplicidade (Idempotência pelo externalMessageId)
  if (input.externalMessageId) {
    const msgDuplicada = await prisma.whatsAppMessage.findUnique({
      where: { externalMessageId: input.externalMessageId }
    });
    if (msgDuplicada) {
      return {
        duplicadaIgnorada: true,
        conversationId: msgDuplicada.conversationId,
        inboundMessage: msgDuplicada
      };
    }
  }

  // 2. Localiza ou cria a conversa do contato
  let conv = await prisma.whatsAppConversation.findUnique({
    where: { telefone: telefoneNorm }
  });

  if (!conv) {
    conv = await prisma.whatsAppConversation.create({
      data: {
        telefone: telefoneNorm,
        telefoneExibicao: formatPhoneBr(telefoneNorm),
        nomeContato: input.nomeContato?.trim() || 'Visitante WhatsApp',
        tipoContato: 'LEAD',
        statusAtendimento: 'IA_ATIVA',
        etapaFunil: 'RECEPCAO',
        ultimaMensagemTexto: input.conteudo,
        ultimaMensagemEm: new Date()
      }
    });
  } else {
    conv = await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: {
        ...(input.nomeContato && conv.nomeContato === 'Visitante WhatsApp'
          ? { nomeContato: input.nomeContato.trim() }
          : {}),
        ultimaMensagemTexto: input.conteudo,
        ultimaMensagemEm: new Date()
      }
    });
  }

  // Se o cliente respondeu, cancela eventuais follow-ups de "sumiço" pendentes para evitar mensagens inconvenientes
  await prisma.aiFollowUpTask.updateMany({
    where: {
      conversationId: conv.id,
      status: 'PENDENTE',
      tipoGatilho: { in: ['LEAD_PRECO_SUMIU', 'INTERESSE_EXPERIMENTAL', 'ALUNO_SUMIDO_TREINO'] }
    },
    data: { status: 'CANCELADO' }
  }).catch(() => null);

  // 3. Registra a mensagem recebida no histórico (SEMPRE preservada, mesmo com IA OFF)
  const inboundMsg = await prisma.whatsAppMessage.create({
    data: {
      conversationId: conv.id,
      externalMessageId: input.externalMessageId || `in_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      direcao: 'INBOUND',
      remetente: 'CONTATO',
      remetenteNome: conv.nomeContato,
      tipoMidia: input.tipoMidia || 'TEXT',
      conteudo: input.conteudo,
      transcricaoAudio: input.transcricaoAudio || null,
      statusEnvio: 'RECEIVED'
    }
  });

  // 4. Consulta o Estado Centralizado da Automação no Backend
  const config = await getOrCreateAiConfig(prisma);

  // REGRA INEGOCIÁVEL: Se a IA estiver DESATIVADA globalmente, em MODO_MANUAL,
  // ou se a conversa estiver sob controle humano (PAUSADA_HUMANO / TRANSFERIDA_HUMANO),
  // interrompe imediatamente novas respostas automáticas!
  // (No Simulador Sandbox, se forcarSimulacaoAtiva=true, permite testar o cérebro da IA mesmo com o WhatsApp real desligado)
  const ignorarTravaPorSimulacao = input.origem === 'SIMULADOR_SANDBOX' && input.forcarSimulacaoAtiva === true;
  if (
    (!ignorarTravaPorSimulacao && (!config.enabled || config.mode === 'MODO_MANUAL')) ||
    conv.iaPausadaIndividual ||
    conv.statusAtendimento === 'PAUSADA_HUMANO' ||
    conv.statusAtendimento === 'TRANSFERIDA_HUMANO'
  ) {
    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { naoLidasAdmin: { increment: 1 } }
    });

    const motivoBloqueio = !config.enabled
      ? 'IA Desativada no Botão Principal (OFF)'
      : config.mode === 'MODO_MANUAL'
      ? 'Sistema em MODO MANUAL'
      : 'Conversa sob controle de atendente humano';

    return {
      duplicadaIgnorada: false,
      processedByAi: false,
      motivoBloqueio,
      estadoIaGlobal: { enabled: config.enabled, mode: config.mode },
      conversationId: conv.id,
      inboundMessage: inboundMsg,
      outboundMessage: null
    };
  }

  // 5. Processa a mensagem com o Cérebro da BORÜ IA
  const brainResult = await processIncomingMessageWithBoruBrain(
    prisma,
    conv.id,
    input.conteudo,
    input.tipoMidia || 'TEXT',
    input.transcricaoAudio
  );

  // Atualiza metadados de intenção na mensagem de entrada
  await prisma.whatsAppMessage.update({
    where: { id: inboundMsg.id },
    data: {
      intencaoDetectada: brainResult.intencaoDetectada,
      toolsAcionadasJson: JSON.stringify(brainResult.toolsExecutadas)
    }
  });

  // 6. Verifica se está em MODO ASSISTIDO (prepara resposta para humano aprovar)
  if (config.mode === 'IA_ASSISTIDA' && !brainResult.transferidoParaHumano) {
    const draftMsg = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conv.id,
        direcao: 'OUTBOUND',
        remetente: 'IA',
        remetenteNome: 'BORÜ IA (Sugestão Assistida)',
        tipoMidia: 'TEXT',
        conteudo: brainResult.respostaTexto,
        statusEnvio: 'PENDING_APPROVAL',
        intencaoDetectada: brainResult.intencaoDetectada,
        toolsAcionadasJson: JSON.stringify(brainResult.toolsExecutadas),
        tempoRespostaMs: brainResult.tempoRespostaMs
      }
    });

    await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: {
        statusAtendimento: 'AGUARDANDO_APROVACAO',
        ultimaIntencao: brainResult.intencaoDetectada,
        naoLidasAdmin: { increment: 1 }
      }
    });

    return {
      duplicadaIgnorada: false,
      processedByAi: true,
      modoOperacao: 'IA_ASSISTIDA',
      aguardandoAprovacaoHumana: true,
      conversationId: conv.id,
      inboundMessage: inboundMsg,
      outboundMessage: draftMsg,
      brainResult
    };
  }

  // 7. MODO IA AUTÔNOMA: Envia imediatamente pelo WhatsApp e registra no histórico
  const sendRes = await sendWhatsAppCloudMessage(prisma, conv.telefone, brainResult.respostaTexto);

  const outboundMsg = await prisma.whatsAppMessage.create({
    data: {
      conversationId: conv.id,
      externalMessageId: sendRes.externalId || null,
      direcao: 'OUTBOUND',
      remetente: 'IA',
      remetenteNome: 'BORÜ IA Autônoma',
      tipoMidia: 'TEXT',
      conteudo: brainResult.respostaTexto,
      statusEnvio: sendRes.enviado ? 'SENT' : 'FAILED',
      intencaoDetectada: brainResult.intencaoDetectada,
      toolsAcionadasJson: JSON.stringify(brainResult.toolsExecutadas),
      tempoRespostaMs: brainResult.tempoRespostaMs,
      erroDetalhe: sendRes.erro || null
    }
  });

  await prisma.whatsAppConversation.update({
    where: { id: conv.id },
    data: {
      ultimaIntencao: brainResult.intencaoDetectada,
      ultimaMensagemTexto: brainResult.respostaTexto,
      ultimaMensagemEm: new Date(),
      ...(brainResult.etapaFunilAtualizada ? { etapaFunil: brainResult.etapaFunilAtualizada } : {})
    }
  });

  return {
    duplicadaIgnorada: false,
    processedByAi: true,
    modoOperacao: 'IA_AUTONOMA',
    aguardandoAprovacaoHumana: false,
    conversationId: conv.id,
    inboundMessage: inboundMsg,
    outboundMessage: outboundMsg,
    brainResult
  };
}

// ============================================================================
// 4. PARSER DE WEBHOOK DA WHATSAPP BUSINESS CLOUD API (META)
// ============================================================================

export function extractMessagesFromCloudWebhook(body: any): InboundMessageInput[] {
  const extraidas: InboundMessageInput[] = [];
  if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
    return extraidas;
  }

  for (const entry of body.entry) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const value = change?.value;
      const contacts = value?.contacts || [];
      const messages = value?.messages || [];

      for (const msg of messages) {
        const from = msg.from;
        const wamid = msg.id;
        const contactMatch = contacts.find((c: any) => c.wa_id === from) || contacts[0];
        const profileName = contactMatch?.profile?.name || 'Contato WhatsApp';

        let conteudo = '';
        let tipoMidia: InboundMessageInput['tipoMidia'] = 'TEXT';

        if (msg.type === 'text' && msg.text?.body) {
          conteudo = msg.text.body;
          tipoMidia = 'TEXT';
        } else if (msg.type === 'audio') {
          conteudo = msg.audio?.caption || '[Mensagem de Áudio recebida no WhatsApp]';
          tipoMidia = 'AUDIO';
        } else if (msg.type === 'button' && msg.button?.text) {
          conteudo = msg.button.text;
          tipoMidia = 'TEXT';
        } else if (msg.type === 'interactive') {
          conteudo =
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            '[Interação no WhatsApp]';
          tipoMidia = 'TEXT';
        } else if (msg.type === 'image') {
          conteudo = msg.image?.caption || '[Imagem/Comprovante recebido]';
          tipoMidia = 'IMAGE';
        } else {
          conteudo = `[Mídia recebida: ${msg.type || 'desconhecido'}]`;
        }

        if (from && conteudo) {
          extraidas.push({
            telefone: from,
            nomeContato: profileName,
            conteudo,
            tipoMidia,
            externalMessageId: wamid,
            origem: 'WHATSAPP_WEBHOOK'
          });
        }
      }
    }
  }

  return extraidas;
}

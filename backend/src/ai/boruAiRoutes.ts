import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  extractMessagesFromCloudWebhook,
  getOrCreateAiConfig,
  handleInboundWhatsAppMessage,
  sendWhatsAppCloudMessage,
  setMasterAiState
} from './whatsappService';
import { processPendingFollowUpTasks, scanAndGenerateFollowUpTasks } from './followUpEngine';
import {
  formatPhoneBr,
  normalizePhoneE164,
  parseBoruAiCustomSettings,
  DEFAULT_BORU_AI_CUSTOM_SETTINGS
} from './boruAiKnowledge';

export function registerBoruAiRoutes(app: Express, prisma: PrismaClient) {
  // Inicializa o loop autônomo de verificação de Follow-up em background (a cada 5 minutos)
  setInterval(async () => {
    try {
      const cfg = await getOrCreateAiConfig(prisma);
      if (cfg.enabled && cfg.mode !== 'MODO_MANUAL') {
        await scanAndGenerateFollowUpTasks(prisma);
        await processPendingFollowUpTasks(prisma);
      }
    } catch (err) {
      // Silencioso em background para não interromper o servidor
    }
  }, 5 * 60 * 1000);

  // ==========================================================================
  // 1. WEBHOOK OFICIAL WHATSAPP BUSINESS CLOUD API (META)
  // ==========================================================================

  // Verificação oficial do Webhook (Meta Challenge) + Status amigável no navegador
  app.get('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const config = await getOrCreateAiConfig(prisma);
    const verifyTokenEsperado = process.env.WHATSAPP_VERIFY_TOKEN || config.whatsappVerifyToken;

    // Se for aberto diretamente no navegador pelo administrador (sem parâmetros da Meta)
    if (!mode && !token) {
      return res.status(200).json({
        status: 'WEBHOOK_ONLINE',
        sistema: 'BORÜ IA AUTÔNOMA — INTELLIGENT OPERATIONS',
        iaAtiva: config.enabled,
        modoOperacao: config.mode,
        whatsappOficial: config.whatsappPhoneNumber,
        instrucao:
          'Este endereço é o Webhook técnico para a Meta (WhatsApp Cloud API). Para usar o painel visual, ver as conversas e testar no Modo Simulação, acesse a aba "💬 WhatsApp & Atendimento IA" dentro do Painel Administrativo (/admin).'
      });
    }

    if (mode === 'subscribe' && token === verifyTokenEsperado) {
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          service: 'WHATSAPP_WEBHOOK',
          message: 'Webhook Oficial do WhatsApp Business verificado com sucesso pela Meta.'
        }
      }).catch(() => null);
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ erro: 'Token de verificação do Webhook inválido.' });
  });

  // Recebimento de mensagens em tempo real via Webhook
  app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
    try {
      const mensagensExtraidas = extractMessagesFromCloudWebhook(req.body);

      // Se vier em formato simplificado de provedor oficial compatível (Z-API / Twilio / Dialog360 / Sandbox)
      if (mensagensExtraidas.length === 0 && req.body?.telefone && req.body?.conteudo) {
        mensagensExtraidas.push({
          telefone: String(req.body.telefone),
          nomeContato: req.body.nomeContato || 'Contato WhatsApp',
          conteudo: String(req.body.conteudo),
          tipoMidia: req.body.tipoMidia || 'TEXT',
          transcricaoAudio: req.body.transcricaoAudio || undefined,
          externalMessageId: req.body.externalMessageId || undefined,
          origem: 'WHATSAPP_WEBHOOK'
        });
      }

      const resultados = [];
      for (const item of mensagensExtraidas) {
        const resItem = await handleInboundWhatsAppMessage(prisma, item);
        resultados.push(resItem);
      }

      return res.status(200).json({ status: 'EVENT_RECEIVED', processados: resultados.length, resultados });
    } catch (error: any) {
      await prisma.systemLog.create({
        data: {
          level: 'ERROR',
          service: 'WHATSAPP_WEBHOOK',
          message: `Falha no processamento de webhook: ${error?.message || 'Erro desconhecido'}`
        }
      }).catch(() => null);
      return res.status(200).json({ status: 'EVENT_RECEIVED_WITH_ERROR', erro: error?.message });
    }
  });

  // ==========================================================================
  // 2. CONTROLE CENTRAL DE ESTADO (BOTÃO ÚNICO ATIVAR IA / DESATIVAR IA)
  // ==========================================================================

  app.get('/api/admin/ia/status', async (_req: Request, res: Response) => {
    try {
      const config = await getOrCreateAiConfig(prisma);
      res.json({
        config,
        customSettings: parseBoruAiCustomSettings(config.customSettingsJson)
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao consultar status da BORÜ IA.', detalhe: error?.message });
    }
  });

  app.post('/api/admin/ia/toggle', async (req: Request, res: Response) => {
    const { enabled, mode, operador } = req.body;
    try {
      const configAtualizada = await setMasterAiState(prisma, {
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
        mode,
        updatedBy: operador || 'Administrador BORÜ'
      });

      res.json({
        mensagem: configAtualizada.enabled
          ? `BORÜ IA AUTÔNOMA ATIVADA (${configAtualizada.mode})! O sistema já está recebendo e processando mensagens.`
          : 'BORÜ IA DESATIVADA! Respostas automáticas interrompidas imediatamente e controle devolvido aos atendentes humanos.',
        config: configAtualizada
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao alterar estado da IA.', detalhe: error?.message });
    }
  });

  app.patch('/api/admin/ia/config', async (req: Request, res: Response) => {
    try {
      await getOrCreateAiConfig(prisma);
      const {
        whatsappConnected,
        whatsappProvider,
        whatsappPhoneNumber,
        whatsappPhoneNumberId,
        whatsappBusinessAccountId,
        whatsappVerifyToken,
        businessHoursOnlyFollowUp,
        followUpStartHour,
        followUpEndHour,
        maxFollowUpsPerContact,
        minHoursBetweenFollowUps,
        pixChaveOficial,
        pixFavorecido,
        linkPagamentoOficial,
        customSettings,
        resetCustomSettings,
        updatedBy
      } = req.body;

      let customSettingsJsonToSave: string | undefined = undefined;
      if (resetCustomSettings) {
        customSettingsJsonToSave = JSON.stringify(DEFAULT_BORU_AI_CUSTOM_SETTINGS);
      } else if (customSettings && typeof customSettings === 'object') {
        customSettingsJsonToSave = JSON.stringify(customSettings);
      }

      const config = await prisma.aiAutomationConfig.update({
        where: { id: 'default' },
        data: {
          ...(whatsappConnected !== undefined ? { whatsappConnected: Boolean(whatsappConnected) } : {}),
          ...(whatsappProvider ? { whatsappProvider } : {}),
          ...(whatsappPhoneNumber ? { whatsappPhoneNumber } : {}),
          ...(whatsappPhoneNumberId !== undefined ? { whatsappPhoneNumberId } : {}),
          ...(whatsappBusinessAccountId !== undefined ? { whatsappBusinessAccountId } : {}),
          ...(whatsappVerifyToken ? { whatsappVerifyToken } : {}),
          ...(businessHoursOnlyFollowUp !== undefined ? { businessHoursOnlyFollowUp: Boolean(businessHoursOnlyFollowUp) } : {}),
          ...(followUpStartHour !== undefined ? { followUpStartHour: Number(followUpStartHour) } : {}),
          ...(followUpEndHour !== undefined ? { followUpEndHour: Number(followUpEndHour) } : {}),
          ...(maxFollowUpsPerContact !== undefined ? { maxFollowUpsPerContact: Number(maxFollowUpsPerContact) } : {}),
          ...(minHoursBetweenFollowUps !== undefined ? { minHoursBetweenFollowUps: Number(minHoursBetweenFollowUps) } : {}),
          ...(pixChaveOficial ? { pixChaveOficial } : {}),
          ...(pixFavorecido ? { pixFavorecido } : {}),
          ...(linkPagamentoOficial ? { linkPagamentoOficial } : {}),
          ...(customSettingsJsonToSave !== undefined ? { customSettingsJson: customSettingsJsonToSave } : {}),
          updatedBy: updatedBy || 'Administrador BORÜ'
        }
      });

      res.json({
        mensagem: 'Configurações, mensagens e prazos da BORÜ IA salvos com sucesso!',
        config,
        customSettings: parseBoruAiCustomSettings(config.customSettingsJson)
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao salvar configurações da IA.', detalhe: error?.message });
    }
  });

  // ==========================================================================
  // 3. DASHBOARD EXECUTIVO, KPIS EM TEMPO REAL E INTELIGÊNCIA DE GESTÃO
  // ==========================================================================

  app.get('/api/admin/ia/dashboard', async (req: Request, res: Response) => {
    const periodo = String(req.query.periodo || '30d');
    const agora = new Date();
    let dataCorte = new Date(0);
    if (periodo === 'hoje') {
      dataCorte = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
    } else if (periodo === '7d') {
      dataCorte = new Date(agora.getTime() - 7 * 86400000);
    } else if (periodo === '30d') {
      dataCorte = new Date(agora.getTime() - 30 * 86400000);
    } else if (periodo === '90d') {
      dataCorte = new Date(agora.getTime() - 90 * 86400000);
    }

    try {
      const config = await getOrCreateAiConfig(prisma);

      const [
        conversas,
        mensagens,
        operacoes,
        followUps,
        tickets,
        experimentaisSistema,
        mensalidadesPendentesCount,
        falhasLogCount
      ] = await Promise.all([
        prisma.whatsAppConversation.findMany({
          where: { criadoEm: { gte: dataCorte } },
          orderBy: { ultimaMensagemEm: 'desc' }
        }),
        prisma.whatsAppMessage.findMany({
          where: { criadoEm: { gte: dataCorte } }
        }),
        prisma.aiOperationAuditLog.findMany({
          where: { criadoEm: { gte: dataCorte } },
          orderBy: { criadoEm: 'desc' },
          take: 100
        }),
        prisma.aiFollowUpTask.findMany({
          where: { criadoEm: { gte: dataCorte } },
          include: { conversation: true },
          orderBy: { criadoEm: 'desc' },
          take: 50
        }),
        prisma.aiServiceTicket.findMany({
          where: { criadoEm: { gte: dataCorte } },
          orderBy: { criadoEm: 'desc' }
        }),
        prisma.agendamentoExperimental.findMany({
          where: { criadoEm: { gte: dataCorte } }
        }),
        prisma.mensalidade.count({
          where: { status: { in: ['PENDENTE', 'ATRASADO'] }, dataVencimento: { lt: agora } }
        }),
        prisma.aiOperationAuditLog.count({
          where: { sucesso: false, criadoEm: { gte: dataCorte } }
        })
      ]);

      const msgsRecebidas = mensagens.filter(m => m.direcao === 'INBOUND');
      const msgsRespondidas = mensagens.filter(m => m.direcao === 'OUTBOUND' && m.statusEnvio === 'SENT');
      const msgsAguardandoAprovacao = mensagens.filter(m => m.statusEnvio === 'PENDING_APPROVAL');
      const msgsFalha = mensagens.filter(m => m.statusEnvio === 'FAILED');

      const temposValidos = msgsRespondidas
        .map(m => m.tempoRespostaMs)
        .filter((t): t is number => typeof t === 'number' && t > 0);
      const tempoMedioRespostaMs =
        temposValidos.length > 0
          ? Math.round(temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length)
          : 420;

      const interessadosCaptados = conversas.filter(c => c.tipoContato === 'LEAD' || c.tipoContato === 'RESPONSAVEL').length;
      const experimentaisAgendadasIa = experimentaisSistema.filter(
        e => (e.observacao || '').includes('BORÜ IA') || conversas.some(c => c.experimentalId === e.id)
      );
      const totalExperimentaisPeriodo = Math.max(experimentaisAgendadasIa.length, operacoes.filter(o => o.toolName === 'agendar_aula_experimental' && o.sucesso).length);
      const compareceramExperimental = experimentaisSistema.filter(
        e => e.status === 'REALIZADA' || e.status === 'FECHOU_CONTRATO'
      ).length;
      const matriculasOriginadas = experimentaisSistema.filter(e => e.status === 'FECHOU_CONTRATO').length +
        conversas.filter(c => c.etapaFunil === 'MATRICULADO').length;

      const transferenciasHumanas = conversas.filter(c => c.statusAtendimento === 'TRANSFERIDA_HUMANO').length +
        tickets.filter(t => t.tipoSolicitacao === 'TRANSFERENCIA_HUMANA').length;

      const taxaConversao =
        interessadosCaptados > 0
          ? Math.min(100, Math.round(((totalExperimentaisPeriodo + matriculasOriginadas) / interessadosCaptados) * 100))
          : 0;

      // Agrupamento das principais intenções / dúvidas
      const intencoesMap: Record<string, number> = {};
      for (const m of mensagens) {
        if (m.intencaoDetectada) {
          intencoesMap[m.intencaoDetectada] = (intencoesMap[m.intencaoDetectada] || 0) + 1;
        }
      }
      const principaisDuvidas = Object.entries(intencoesMap)
        .map(([intencao, total]) => ({ intencao, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      // Agrupamento de operações executadas pela IA
      const toolsCountMap: Record<string, number> = {};
      for (const op of operacoes) {
        toolsCountMap[op.toolName] = (toolsCountMap[op.toolName] || 0) + 1;
      }
      const operacoesPorFerramenta = Object.entries(toolsCountMap)
        .map(([ferramenta, execucoes]) => ({ ferramenta, execucoes }))
        .sort((a, b) => b.execucoes - a.execucoes);

      res.json({
        config,
        customSettings: parseBoruAiCustomSettings(config.customSettingsJson),
        indicadores: {
          estadoAtualIa: config.enabled ? config.mode : 'DESATIVADA',
          iaAtiva: config.enabled,
          modoOperacao: config.mode,
          whatsappConectado: config.whatsappConnected,
          whatsappNumero: config.whatsappPhoneNumber,
          conversasAtendidas: conversas.length,
          mensagensRecebidas: msgsRecebidas.length,
          mensagensRespondidas: msgsRespondidas.length,
          mensagensAguardandoAprovacao: msgsAguardandoAprovacao.length,
          tempoMedioRespostaMs,
          tempoMedioRespostaFormatado: `${(tempoMedioRespostaMs / 1000).toFixed(1)}s`,
          interessadosCaptados,
          aulasExperimentaisAgendadas: totalExperimentaisPeriodo,
          comparecimentoExperimentais: compareceramExperimental,
          matriculasOriginadas,
          taxaConversaoPercent: taxaConversao,
          solicitacoesEncaminhadasHumanos: transferenciasHumanas,
          inadimplenciaIdentificada: mensalidadesPendentesCount,
          falhasIntegracao: falhasLogCount + msgsFalha.length,
          followUpsPendentes: followUps.filter(f => f.status === 'PENDENTE').length,
          followUpsEnviados: followUps.filter(f => f.status === 'ENVIADO').length,
          ticketsAbertos: tickets.filter(t => t.status === 'ABERTO').length
        },
        inteligenciaGestao: {
          principaisDuvidas,
          operacoesPorFerramenta,
          motivosDesistencia: experimentaisSistema
            .filter(e => e.status === 'DESISTIU')
            .map(e => ({ nome: e.nome, motivo: e.observacao || 'Horário / Sem retorno pós-aula' }))
        },
        ultimasOperacoes: operacoes.slice(0, 25),
        ticketsRecentes: tickets.slice(0, 20),
        followUpsRecentes: followUps.slice(0, 20)
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao carregar dashboard da BORÜ IA.', detalhe: error?.message });
    }
  });

  // Exportação de relatório de gestão (CSV ou JSON)
  app.get('/api/admin/ia/relatorios/exportar', async (req: Request, res: Response) => {
    const formato = String(req.query.formato || 'json').toLowerCase();
    try {
      const conversas = await prisma.whatsAppConversation.findMany({
        include: {
          mensagens: true,
          tickets: true
        },
        orderBy: { ultimaMensagemEm: 'desc' }
      });

      if (formato === 'csv') {
        const header = 'ID,Nome,Telefone,Tipo,Status_Atendimento,Etapa_Funil,Ultima_Intencao,Total_Mensagens,Ultima_Interacao\n';
        const rows = conversas
          .map(c =>
            [
              c.id,
              `"${(c.nomeContato || '').replace(/"/g, '""')}"`,
              c.telefoneExibicao || c.telefone,
              c.tipoContato,
              c.statusAtendimento,
              c.etapaFunil,
              c.ultimaIntencao || 'N/A',
              c.mensagens.length,
              c.ultimaMensagemEm.toISOString()
            ].join(',')
          )
          .join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_boru_ia_autonoma.csv"');
        return res.send('\uFEFF' + header + rows);
      }

      return res.json({
        geradoEm: new Date().toISOString(),
        sistema: 'BORÜ IA AUTÔNOMA — INTELLIGENT OPERATIONS',
        totalConversas: conversas.length,
        conversas
      });
    } catch (error: any) {
      return res.status(500).json({ erro: 'Erro ao exportar relatório.', detalhe: error?.message });
    }
  });

  // ==========================================================================
  // 4. CONTROLE INDIVIDUAL DE CONVERSAS (INBOX AO VIVO, ASSUMIR, PAUSAR, DEVOLVER)
  // ==========================================================================

  app.get('/api/admin/ia/conversas', async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const tipo = req.query.tipo as string | undefined;
    const busca = (req.query.busca as string | undefined)?.trim();

    try {
      const where: any = {};
      if (status && status !== 'TODAS') {
        where.statusAtendimento = status;
      }
      if (tipo && tipo !== 'TODOS') {
        where.tipoContato = tipo;
      }
      if (busca) {
        where.OR = [
          { nomeContato: { contains: busca, mode: 'insensitive' } },
          { telefone: { contains: busca } },
          { ultimaMensagemTexto: { contains: busca, mode: 'insensitive' } }
        ];
      }

      const conversas = await prisma.whatsAppConversation.findMany({
        where,
        include: {
          mensagens: {
            orderBy: { criadoEm: 'desc' },
            take: 1
          },
          _count: {
            select: { mensagens: true, operacoes: true, tickets: true }
          }
        },
        orderBy: { ultimaMensagemEm: 'desc' }
      });

      res.json({ conversas });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar conversas.', detalhe: error?.message });
    }
  });

  app.get('/api/admin/ia/conversas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const conversa = await prisma.whatsAppConversation.findUnique({
        where: { id },
        include: {
          mensagens: { orderBy: { criadoEm: 'asc' } },
          operacoes: { orderBy: { criadoEm: 'desc' }, take: 30 },
          followUps: { orderBy: { criadoEm: 'desc' } },
          tickets: { orderBy: { criadoEm: 'desc' } }
        }
      });

      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada.' });
      }

      // Zera contador de não lidas ao abrir
      if (conversa.naoLidasAdmin > 0) {
        await prisma.whatsAppConversation.update({
          where: { id },
          data: { naoLidasAdmin: 0 }
        }).catch(() => null);
      }

      let alunoVinculado = null;
      if (conversa.alunoId) {
        alunoVinculado = await prisma.aluno.findUnique({
          where: { id: conversa.alunoId },
          include: {
            mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 4 }
          }
        });
      }

      res.json({ conversa, alunoVinculado });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao carregar detalhes da conversa.', detalhe: error?.message });
    }
  });

  // Assumir conversa manualmente / Pausar a IA para este contato
  app.post('/api/admin/ia/conversas/:id/assumir', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { atendenteNome } = req.body;
    try {
      const conv = await prisma.whatsAppConversation.update({
        where: { id },
        data: {
          statusAtendimento: 'PAUSADA_HUMANO',
          iaPausadaIndividual: true,
          atendenteHumanoNome: atendenteNome || 'Atendente BORÜ',
          naoLidasAdmin: 0
        }
      });

      await prisma.aiOperationAuditLog.create({
        data: {
          conversationId: id,
          toolName: 'Assumir_Conversa_Manual',
          categoria: 'STATE_CHANGE',
          inputPayload: JSON.stringify({ atendenteNome }),
          outputResult: JSON.stringify({ iaPausadaIndividual: true, statusAtendimento: 'PAUSADA_HUMANO' }),
          sucesso: true,
          autorizado: true,
          executadoPor: atendenteNome || 'Atendente BORÜ'
        }
      });

      res.json({
        mensagem: `Você assumiu a conversa com ${conv.nomeContato}. A IA está pausada para este contato.`,
        conversa: conv
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao assumir conversa.', detalhe: error?.message });
    }
  });

  // Devolver a conversa para a IA
  app.post('/api/admin/ia/conversas/:id/devolver-ia', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { operadorNome } = req.body;
    try {
      const conv = await prisma.whatsAppConversation.update({
        where: { id },
        data: {
          statusAtendimento: 'IA_ATIVA',
          iaPausadaIndividual: false,
          motivoTransferencia: null
        }
      });

      await prisma.aiOperationAuditLog.create({
        data: {
          conversationId: id,
          toolName: 'Devolver_Conversa_Para_IA',
          categoria: 'STATE_CHANGE',
          inputPayload: JSON.stringify({ operadorNome }),
          outputResult: JSON.stringify({ iaPausadaIndividual: false, statusAtendimento: 'IA_ATIVA' }),
          sucesso: true,
          autorizado: true,
          executadoPor: operadorNome || 'Administrador BORÜ'
        }
      });

      res.json({
        mensagem: `Conversa com ${conv.nomeContato} devolvida para a BORÜ IA Autônoma!`,
        conversa: conv
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao devolver conversa para a IA.', detalhe: error?.message });
    }
  });

  // Enviar mensagem manual pelo atendente humano
  app.post('/api/admin/ia/conversas/:id/mensagem-manual', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { conteudo, atendenteNome, pausarIa } = req.body;

    if (!conteudo || !String(conteudo).trim()) {
      return res.status(400).json({ erro: 'Digite o conteúdo da mensagem.' });
    }

    try {
      const conv = await prisma.whatsAppConversation.findUnique({ where: { id } });
      if (!conv) return res.status(404).json({ erro: 'Conversa não encontrada.' });

      const sendRes = await sendWhatsAppCloudMessage(prisma, conv.telefone, String(conteudo).trim());

      const msg = await prisma.whatsAppMessage.create({
        data: {
          conversationId: conv.id,
          externalMessageId: sendRes.externalId || null,
          direcao: 'OUTBOUND',
          remetente: 'HUMANO',
          remetenteNome: atendenteNome || 'Recepção BORÜ',
          tipoMidia: 'TEXT',
          conteudo: String(conteudo).trim(),
          statusEnvio: sendRes.enviado ? 'SENT' : 'FAILED',
          erroDetalhe: sendRes.erro || null
        }
      });

      await prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          ultimaMensagemTexto: String(conteudo).trim(),
          ultimaMensagemEm: new Date(),
          ...(pausarIa !== false
            ? {
                statusAtendimento: 'PAUSADA_HUMANO',
                iaPausadaIndividual: true,
                atendenteHumanoNome: atendenteNome || 'Recepção BORÜ'
              }
            : {})
        }
      });

      res.json({ mensagem: 'Mensagem manual enviada com sucesso!', message: msg });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao enviar mensagem manual.', detalhe: error?.message });
    }
  });

  // Aprovar e enviar resposta preparada pela IA no MODO ASSISTIDO
  app.post('/api/admin/ia/mensagens/:msgId/aprovar', async (req: Request, res: Response) => {
    const { msgId } = req.params;
    const { textoEditado, aprovadoPor } = req.body;

    try {
      const msg = await prisma.whatsAppMessage.findUnique({
        where: { id: msgId },
        include: { conversation: true }
      });

      if (!msg) return res.status(404).json({ erro: 'Mensagem não encontrada.' });

      const textoFinal = textoEditado && String(textoEditado).trim() ? String(textoEditado).trim() : msg.conteudo;
      const sendRes = await sendWhatsAppCloudMessage(prisma, msg.conversation.telefone, textoFinal);

      const atualizada = await prisma.whatsAppMessage.update({
        where: { id: msgId },
        data: {
          conteudo: textoFinal,
          statusEnvio: sendRes.enviado ? 'SENT' : 'FAILED',
          externalMessageId: sendRes.externalId || null,
          remetenteNome: `BORÜ IA (Aprovado por ${aprovadoPor || 'Admin'})`
        }
      });

      await prisma.whatsAppConversation.update({
        where: { id: msg.conversationId },
        data: {
          statusAtendimento: 'IA_ATIVA',
          ultimaMensagemTexto: textoFinal,
          ultimaMensagemEm: new Date()
        }
      });

      res.json({ mensagem: 'Resposta aprovada e enviada pelo WhatsApp!', message: atualizada });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao aprovar mensagem.', detalhe: error?.message });
    }
  });

  app.post('/api/admin/ia/mensagens/:msgId/rejeitar', async (req: Request, res: Response) => {
    const { msgId } = req.params;
    try {
      const msg = await prisma.whatsAppMessage.update({
        where: { id: msgId },
        data: { statusEnvio: 'REJECTED' }
      });
      res.json({ mensagem: 'Sugestão descartada.', message: msg });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao descartar sugestão.', detalhe: error?.message });
    }
  });

  // ==========================================================================
  // 5. FOLLOW-UPS, TICKETS E LOGS DE AUDITORIA
  // ==========================================================================

  app.post('/api/admin/ia/followups/varrer', async (_req: Request, res: Response) => {
    try {
      const resultado = await scanAndGenerateFollowUpTasks(prisma);
      res.json({
        mensagem: `Varredura concluída: ${resultado.novasTarefasCriadas} novo(s) acompanhamento(s) inteligente(s) identificado(s).`,
        ...resultado
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao varrer follow-ups.', detalhe: error?.message });
    }
  });

  app.post('/api/admin/ia/followups/processar', async (req: Request, res: Response) => {
    try {
      const resultado = await processPendingFollowUpTasks(prisma, {
        forceIgnoreBusinessHours: Boolean(req.body?.forcarEnvioImediato)
      });
      res.json({
        mensagem: resultado.bloqueadoPorEstado
          ? resultado.motivo
          : `${resultado.executados} follow-up(s) processado(s) com sucesso!`,
        ...resultado
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao processar fila de follow-ups.', detalhe: error?.message });
    }
  });

  app.post('/api/admin/ia/followups/:id/cancelar', async (req: Request, res: Response) => {
    try {
      const task = await prisma.aiFollowUpTask.update({
        where: { id: req.params.id },
        data: { status: 'CANCELADO' }
      });
      res.json({ mensagem: 'Follow-up cancelado.', task });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao cancelar follow-up.', detalhe: error?.message });
    }
  });

  // Editar mensagem, prazo (data/hora agendada) ou motivo de qualquer follow-up individual
  app.patch('/api/admin/ia/followups/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { mensagemSugerida, agendadoPara, descricaoMotivo, status } = req.body;
    try {
      const task = await prisma.aiFollowUpTask.update({
        where: { id },
        data: {
          ...(mensagemSugerida !== undefined ? { mensagemSugerida: String(mensagemSugerida) } : {}),
          ...(agendadoPara ? { agendadoPara: new Date(agendadoPara) } : {}),
          ...(descricaoMotivo !== undefined ? { descricaoMotivo: String(descricaoMotivo) } : {}),
          ...(status ? { status: String(status) } : {})
        }
      });
      res.json({ mensagem: 'Mensagem e prazo do follow-up atualizados com sucesso!', task });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao editar follow-up.', detalhe: error?.message });
    }
  });

  // Criar novo agendamento de mensagem / follow-up customizado
  app.post('/api/admin/ia/followups/criar', async (req: Request, res: Response) => {
    const { telefone, nomeContato, tipoGatilho, descricaoMotivo, mensagemSugerida, agendadoPara, prazoHoras } = req.body;
    if (!telefone || !mensagemSugerida) {
      return res.status(400).json({ erro: 'Informe o telefone e a mensagem a ser enviada.' });
    }

    try {
      const telNorm = normalizePhoneE164(String(telefone));
      let conv = await prisma.whatsAppConversation.findUnique({ where: { telefone: telNorm } });
      if (!conv) {
        conv = await prisma.whatsAppConversation.create({
          data: {
            telefone: telNorm,
            telefoneExibicao: formatPhoneBr(telNorm),
            nomeContato: nomeContato || 'Contato WhatsApp',
            tipoContato: 'LEAD',
            statusAtendimento: 'IA_ATIVA',
            etapaFunil: 'RECEPCAO'
          }
        });
      }

      const dataEnvio = agendadoPara
        ? new Date(agendadoPara)
        : new Date(Date.now() + Number(prazoHoras || 24) * 3600000);

      const task = await prisma.aiFollowUpTask.create({
        data: {
          conversationId: conv.id,
          tipoGatilho: tipoGatilho || 'MENSAGEM_PROGRAMADA_ADMIN',
          descricaoMotivo: descricaoMotivo || 'Mensagem programada manualmente pela administração',
          agendadoPara: dataEnvio,
          status: 'PENDENTE',
          mensagemSugerida: String(mensagemSugerida)
        }
      });

      res.json({ mensagem: 'Envio programado com sucesso na fila!', task });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao programar mensagem.', detalhe: error?.message });
    }
  });

  // Disparar imediatamente um follow-up específico (com opção de edição na hora)
  app.post('/api/admin/ia/followups/:id/disparar', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { mensagemCustomizada } = req.body;
    try {
      const task = await prisma.aiFollowUpTask.findUnique({
        where: { id },
        include: { conversation: true }
      });
      if (!task || !task.conversation) {
        return res.status(404).json({ erro: 'Follow-up não encontrado.' });
      }

      const textoEnvio = (mensagemCustomizada || task.mensagemSugerida || '').trim();
      const sendRes = await sendWhatsAppCloudMessage(prisma, task.conversation.telefone, textoEnvio);

      await prisma.whatsAppMessage.create({
        data: {
          conversationId: task.conversationId,
          externalMessageId: sendRes.externalId || null,
          direcao: 'OUTBOUND',
          remetente: 'IA',
          remetenteNome: 'BORÜ IA (Follow-up Programado)',
          tipoMidia: 'TEXT',
          conteudo: textoEnvio,
          statusEnvio: sendRes.enviado ? 'SENT' : 'FAILED',
          intencaoDetectada: `FOLLOWUP_${task.tipoGatilho}`
        }
      });

      await prisma.whatsAppConversation.update({
        where: { id: task.conversationId },
        data: {
          ultimaMensagemTexto: textoEnvio,
          ultimaMensagemEm: new Date()
        }
      });

      const atualizado = await prisma.aiFollowUpTask.update({
        where: { id },
        data: {
          status: sendRes.enviado ? 'ENVIADO' : 'FALHOU',
          mensagemSugerida: textoEnvio,
          mensagemEnviada: textoEnvio,
          executadoEm: new Date()
        }
      });

      res.json({ mensagem: 'Follow-up disparado com sucesso!', task: atualizado });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao disparar follow-up.', detalhe: error?.message });
    }
  });

  // Limpar / Resetar uma conversa de teste ou histórico específico
  app.delete('/api/admin/ia/conversas/:id', async (req: Request, res: Response) => {
    try {
      await prisma.whatsAppConversation.delete({
        where: { id: req.params.id }
      });
      res.json({ mensagem: 'Conversa removida/resetada com sucesso!' });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao remover conversa.', detalhe: error?.message });
    }
  });

  app.patch('/api/admin/ia/tickets/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, resolvidoPor } = req.body;
    try {
      const ticket = await prisma.aiServiceTicket.update({
        where: { id },
        data: {
          status: status || 'RESOLVIDO',
          resolvidoPor: resolvidoPor || 'Administração BORÜ',
          resolvidoEm: status === 'RESOLVIDO' ? new Date() : undefined
        }
      });
      res.json({ mensagem: 'Status da solicitação atualizado!', ticket });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar ticket.', detalhe: error?.message });
    }
  });

  // ==========================================================================
  // 6. SIMULADOR INTEGRADO DE TESTES (FASE 6 — HOMOLOGAÇÃO ANTES DE PRODUÇÃO)
  // ==========================================================================

  app.post('/api/admin/ia/simular-mensagem', async (req: Request, res: Response) => {
    const { telefone, nomeContato, conteudo, tipoMidia, transcricaoAudio, forcarSimulacaoAtiva } = req.body;
    if (!telefone || !conteudo) {
      return res.status(400).json({ erro: 'Informe o telefone e o conteúdo da mensagem para simular.' });
    }

    try {
      const resultado = await handleInboundWhatsAppMessage(prisma, {
        telefone: String(telefone),
        nomeContato: nomeContato || 'Contato Teste Sandbox',
        conteudo: String(conteudo),
        tipoMidia: tipoMidia || 'TEXT',
        transcricaoAudio: transcricaoAudio || undefined,
        origem: 'SIMULADOR_SANDBOX',
        forcarSimulacaoAtiva: forcarSimulacaoAtiva !== undefined ? Boolean(forcarSimulacaoAtiva) : true
      });

      res.json({
        mensagem: resultado.processedByAi
          ? 'Mensagem processada pela BORÜ IA com sucesso!'
          : `Mensagem registrada no histórico (${resultado.motivoBloqueio}).`,
        resultado
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro na simulação.', detalhe: error?.message });
    }
  });
}

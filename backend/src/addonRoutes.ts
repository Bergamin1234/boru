import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { evaluateStudentGamification } from './gamificationService';

export async function ensureRbacSeeded(prisma: PrismaClient) {
  try {
    // 1. Garantir AdminDev (Ítalo Bergamin - BrgAdmin)
    await prisma.usuario.upsert({
      where: { email: 'brgadmin@boru.com' },
      update: {
        is_dev: true,
        cargo: 'ADMIN',
        ativo: true,
      },
      create: {
        nome: 'Ítalo Bergamin (BrgAdmin)',
        email: 'brgadmin@boru.com',
        senha: 'BoruCentroDeCombate98490@!',
        cargo: 'ADMIN',
        is_dev: true,
        telefone: '(69) 99238-4491',
        prajied: 'Prajied Preto',
        prajied_faixa: 'Prajied Preto',
        ativo: true,
      },
    });

    // 2. Garantir Admin Geral: Amanda Alencar Moreira (CPF: 00542041278, Senha provisória: @Felipe.01)
    const amandaExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ cpf: '00542041278' }, { email: 'amanda@boru.com' }],
      },
    });

    if (!amandaExistente) {
      await prisma.usuario.create({
        data: {
          nome: 'Amanda Alencar Moreira',
          cpf: '00542041278',
          email: 'amanda@boru.com',
          senha: '@Felipe.01',
          cargo: 'ADMIN',
          is_dev: false,
          modalidade: 'Administração Geral',
          graduacao: 'Gestão Operacional & Financeira',
          prajied: 'Gestão Operacional & Financeira',
          prajied_faixa: 'Gestão Operacional & Financeira',
          ativo: true,
        },
      });
    }
  } catch (err) {
    console.error('Aviso ao verificar seed RBAC:', err);
  }
}

/**
 * Calcula o próximo vencimento fixando o dia com base na data_de_adesao (Módulo 2 e Módulo 5)
 */
export function calcularProximoVencimentoPorAdesao(
  dataBasePagamento: Date,
  dataDeAdesao?: Date | null
): Date {
  const proximo = new Date(dataBasePagamento.getTime());
  if (dataDeAdesao) {
    const diaAdesao = new Date(dataDeAdesao).getDate();
    proximo.setMonth(proximo.getMonth() + 1);
    const ultimoDiaProximoMes = new Date(proximo.getFullYear(), proximo.getMonth() + 1, 0).getDate();
    proximo.setDate(Math.min(diaAdesao, ultimoDiaProximoMes));
  } else {
    proximo.setDate(proximo.getDate() + 30);
  }
  return proximo;
}

export function registerAddonRoutes(app: Express, prisma: PrismaClient) {
  // Inicializa seed RBAC silenciosamente
  ensureRbacSeeded(prisma).catch(() => {});

  // Garantir diretório de uploads físicos
  const uploadsDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Helper de Log do Sistema (Dev Dashboard)
  const logSystemEvent = async (
    level: 'INFO' | 'WARN' | 'ERROR' | 'WEBHOOK',
    service: string,
    message: string,
    metadata?: any
  ) => {
    try {
      await prisma.systemLog.create({
        data: {
          level,
          service,
          message,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch {
      // ignora falha silenciosa de log
    }
  };

  // =========================================================
  // DIRETRIZ 3: STORAGE REAL DE ARQUIVOS LOCAIS (/api/upload)
  // =========================================================
  app.post('/api/upload', async (req: Request, res: Response) => {
    try {
      const { fileName, mimeType, base64Data, folder } = req.body;

      if (!base64Data) {
        return res.status(400).json({ erro: 'Arquivo não enviado para upload.' });
      }

      // Extrair conteúdo binário e salvar também no disco local (public/uploads)
      const matches = String(base64Data).match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const detectedMime = matches ? matches[1] : mimeType || 'image/png';
      const rawBase64 = matches ? matches[2] : String(base64Data);
      const buffer = Buffer.from(rawBase64, 'base64');

      const ext = detectedMime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';
      const safeName = (fileName || 'upload')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9_-]/gi, '_')
        .slice(0, 40);
      const finalFileName = `${folder ? folder + '_' : ''}${Date.now()}_${safeName}.${ext}`;
      const filePath = path.join(uploadsDir, finalFileName);

      try {
        fs.writeFileSync(filePath, buffer);
      } catch {
        // Em ambientes serverless read-only, mantém o DataURI persistente
      }

      const dataUri = `data:${detectedMime};base64,${rawBase64}`;
      const staticPath = `/uploads/${finalFileName}`;

      await logSystemEvent('INFO', 'STORAGE_UPLOAD', `Arquivo salvo via Storage: ${finalFileName}`, {
        sizeBytes: buffer.length,
        mimeType: detectedMime,
      });

      return res.json({
        mensagem: 'Upload de arquivo concluído com sucesso!',
        url: dataUri, // Persistente no banco e imune a reinicializações de container
        staticUrl: staticPath,
        fileName: finalFileName,
        size: buffer.length,
      });
    } catch (error: any) {
      console.error('Erro no upload de arquivo:', error);
      return res.status(500).json({ erro: 'Falha ao processar upload do arquivo.' });
    }
  });

  // =========================================================
  // MÓDULO 1: DEV DASHBOARD (PROTEGIDO POR MIDDLEWARE AdminDev)
  // =========================================================
  const requireAdminDevMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const devHeader = req.headers['x-admin-dev'];
    const userEmail = String(req.headers['x-user-email'] || req.query.email || '').toLowerCase();
    const userId = String(req.headers['x-user-id'] || req.query.userId || '');

    if (devHeader === 'true' || userEmail === 'brgadmin@boru.com') {
      return next();
    }

    if (userId) {
      const user = await prisma.usuario.findUnique({ where: { id: userId } }).catch(() => null);
      if (user && (user.is_dev || user.email.toLowerCase() === 'brgadmin@boru.com')) {
        return next();
      }
    }

    return res.status(403).json({
      erro: 'Acesso Negado (403): Rota exclusiva para perfil AdminDev / BrgAdmin (Ítalo Bergamin).',
    });
  };

  app.get('/api/dev/dashboard', requireAdminDevMiddleware, async (_req: Request, res: Response) => {
    try {
      const startPing = Date.now();
      const [
        usuariosCount,
        alunosCount,
        bolsistasCount,
        contratosAssinadosCount,
        mensalidadesCount,
        presencasCount,
        experimentaisCount,
        ranksCount,
        conquistasCount,
        logs,
      ] = await Promise.all([
        prisma.usuario.count(),
        prisma.aluno.count(),
        prisma.aluno.count({ where: { is_bolsista: true } }),
        prisma.aluno.count({ where: { has_signed_contract: true } }),
        prisma.mensalidade.count(),
        prisma.agendamentoPresenca.count(),
        prisma.agendamentoExperimental.count(),
        prisma.gamificationRank.count(),
        prisma.gamificationAchievement.count(),
        prisma.systemLog.findMany({
          orderBy: { criadoEm: 'desc' },
          take: 50,
        }),
      ]);
      const dbLatencyMs = Date.now() - startPing;

      const mem = process.memoryUsage();

      res.json({
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        ambiente: process.env.NODE_ENV || 'production',
        infraestrutura: {
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSeconds: Math.round(process.uptime()),
          memoryRssMB: Math.round(mem.rss / 1024 / 1024),
          memoryHeapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
          memoryHeapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
          dbLatencyMs,
          databaseProvider: 'Supabase PostgreSQL (Pooler AWS US-West-2)',
          frontendHost: 'Vercel Edge Network (https://boru-lime.vercel.app)',
          backendHost: 'Render Cloud Web Service (https://boru-api-fhdn.onrender.com)',
        },
        contagensBanco: {
          usuarios: usuariosCount,
          alunos: alunosCount,
          bolsistas: bolsistasCount,
          contratosAssinados: contratosAssinadosCount,
          mensalidades: mensalidadesCount,
          presencas: presencasCount,
          aulasExperimentais: experimentaisCount,
          gamificationRanks: ranksCount,
          gamificationAchievements: conquistasCount,
        },
        apisEWebhooks: [
          {
            nome: 'API Core & RBAC Auth',
            rota: '/api/auth/login',
            metodo: 'POST',
            status: 'ATIVO',
            descricao: 'Autenticação hierárquica AdminDev, Admin Geral e Professor',
          },
          {
            nome: 'Quick Check-in (Público & Logado)',
            rota: '/api/quick-checkin',
            metodo: 'POST',
            status: 'ATIVO',
            descricao: 'Check-in expresso via CPF+Senha na Home ou 1-clique na sessão do aluno',
          },
          {
            nome: 'Contrato Eletrônico & Carimbo',
            rota: '/api/alunos/:id/assinar-contrato',
            metodo: 'POST',
            status: 'ATIVO',
            descricao: 'Assinatura digital com hash de auditoria e vínculo de data_de_adesao',
          },
          {
            nome: 'Storage Multipart/Base64 Upload',
            rota: '/api/upload',
            metodo: 'POST',
            status: 'ATIVO',
            descricao: 'Armazenamento real de fotos de perfil de professores e badges de conquistas',
          },
          {
            nome: 'Split-List Chamada Diária',
            rota: '/api/admin/chamada-diaria',
            metodo: 'GET / POST',
            status: 'ATIVO',
            descricao: 'Divisão em tempo real de presentes vs ausentes no dia com baixa expressa',
          },
          {
            nome: 'Gateway Automação WhatsApp',
            rota: 'https://wa.me/',
            metodo: 'WEBHOOK_LINK',
            status: 'ATIVO',
            descricao: 'Disparo parametrizado de confirmação de Aula Experimental',
          },
        ],
        logs,
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao carregar Dev Dashboard.', detalhe: error?.message });
    }
  });

  app.post('/api/dev/logs', requireAdminDevMiddleware, async (req: Request, res: Response) => {
    const { level, service, message, metadata } = req.body;
    try {
      const log = await prisma.systemLog.create({
        data: {
          level: level || 'INFO',
          service: service || 'DEV_CONSOLE',
          message: message || 'Teste de log disparado pelo Dev Dashboard',
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
      res.json({ mensagem: 'Log registrado com sucesso!', log });
    } catch {
      res.status(500).json({ erro: 'Erro ao criar log.' });
    }
  });

  app.delete('/api/dev/logs', requireAdminDevMiddleware, async (_req: Request, res: Response) => {
    try {
      await prisma.systemLog.deleteMany({});
      await logSystemEvent('INFO', 'DEV_CONSOLE', 'Histórico de logs limpo pelo AdminDev (Ítalo Bergamin).');
      res.json({ mensagem: 'Logs limpos com sucesso!' });
    } catch {
      res.status(500).json({ erro: 'Erro ao limpar logs.' });
    }
  });

  // =========================================================
  // MÓDULO 1: HORÁRIOS DE AULA DOS PROFESSORES (VISÍVEL AO ALUNO)
  // =========================================================
  app.get('/api/professores/horarios', async (_req: Request, res: Response) => {
    try {
      const professores = await prisma.usuario.findMany({
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          cargo: true,
          modalidade: true,
          graduacao: true,
          prajied: true,
          prajied_faixa: true,
          horariosAula: true,
          horarios_aula: true,
          tempoAula: true,
          fotoPerfilUrl: true,
        },
        orderBy: { nome: 'asc' },
      });
      res.json(professores);
    } catch {
      res.status(500).json({ erro: 'Erro ao carregar horários dos professores.' });
    }
  });

  // Alternar flag is_bolsista do Aluno (Módulo 1)
  app.patch('/api/admin/alunos/:id/bolsista', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_bolsista } = req.body;

    try {
      const flag = Boolean(is_bolsista);
      const aluno = await prisma.aluno.update({
        where: { id },
        data: { is_bolsista: flag },
      });

      // Se virou bolsista, isenta faturas em aberto para nunca bloquear acesso
      if (flag) {
        await prisma.mensalidade.updateMany({
          where: {
            alunoId: id,
            status: { in: ['PENDENTE', 'ATRASADO'] },
          },
          data: { status: 'PAGO', dataPagamento: new Date() },
        });
      }

      await logSystemEvent(
        'INFO',
        'ALUNO_BOLSISTA',
        `Status de bolsista de ${aluno.nome} alterado para: ${flag ? 'BOLSISTA (ISENTO)' : 'PAGANTE NORMAL'}`
      );

      res.json({
        mensagem: flag
          ? `${aluno.nome} agora está marcado como Aluno Bolsista (isento de cobranças e bloqueios).`
          : `${aluno.nome} voltou para o regime regular de mensalidades.`,
        aluno,
      });
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar status de bolsista do aluno.' });
    }
  });

  // =========================================================
  // MÓDULO 2: ONBOARDING E CONTRATO ELETRÔNICO (PORTAL DO ALUNO)
  // =========================================================
  app.get('/api/alunos/:id/contrato', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const aluno = await prisma.aluno.findUnique({
        where: { id },
        include: {
          mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 },
        },
      });
      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

      let signaturePayload = null;
      if (aluno.contract_signature_payload) {
        try {
          signaturePayload = JSON.parse(aluno.contract_signature_payload);
        } catch {
          signaturePayload = { raw: aluno.contract_signature_payload };
        }
      }

      res.json({
        alunoId: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        plano: aluno.plano || '2x na semana',
        modalidade: aluno.modalidade || 'Muay Thai',
        is_bolsista: aluno.is_bolsista,
        has_signed_contract: aluno.has_signed_contract,
        data_de_adesao: aluno.data_de_adesao,
        contract_signed_at: aluno.contract_signed_at,
        signaturePayload,
      });
    } catch {
      res.status(500).json({ erro: 'Erro ao consultar contrato do aluno.' });
    }
  });

  app.post('/api/alunos/:id/assinar-contrato', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { aceitoTermos, dataDeAdesaoCustom } = req.body;

    if (!aceitoTermos) {
      return res.status(400).json({ erro: 'É necessário marcar o aceite dos termos para assinar o contrato.' });
    }

    try {
      const aluno = await prisma.aluno.findUnique({
        where: { id },
        include: { mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 } },
      });

      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

      const agora = new Date();
      const dataAdesaoFinal = dataDeAdesaoCustom
        ? new Date(dataDeAdesaoCustom)
        : aluno.data_de_adesao
        ? new Date(aluno.data_de_adesao)
        : agora;

      const diaVencimentoFixo = dataAdesaoFinal.getDate();

      const hashAuditoria = crypto
        .createHash('sha256')
        .update(`${aluno.id}|${aluno.nome}|${aluno.cpf || 'SEM_CPF'}|${agora.toISOString()}`)
        .digest('hex')
        .slice(0, 24)
        .toUpperCase();

      const payloadAssinatura = {
        documento: 'Contrato de Prestação de Serviços Educacionais e Esportivos — Borü Centro de Combate',
        nomeAssinante: aluno.nome,
        cpfAssinante: aluno.cpf || 'CPF Registrado na Secretaria',
        planoContratado: aluno.plano || '2x na semana',
        modalidade: aluno.modalidade || 'Muay Thai',
        dataAdesaoIso: dataAdesaoFinal.toISOString(),
        diaVencimentoFixo,
        assinadoEmIso: agora.toISOString(),
        assinadoEmFormatado: agora.toLocaleString('pt-BR', { timeZone: 'America/Porto_Velho' }),
        hashAutenticidade: `BORU-DOC-${hashAuditoria}`,
        ipOrigem: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Borü Web/Mobile Client',
      };

      const alunoAtualizado = await prisma.aluno.update({
        where: { id },
        data: {
          has_signed_contract: true,
          data_de_adesao: dataAdesaoFinal,
          contract_signed_at: agora,
          contract_signature_payload: JSON.stringify(payloadAssinatura),
        },
        include: {
          mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 },
        },
      });

      // VÍNCULO FINANCEIRO (CRÍTICO): Fixar o dia de vencimento da fatura aberta com base no dia da data_de_adesao
      if (!alunoAtualizado.is_bolsista && alunoAtualizado.mensalidades.length > 0) {
        const ultima = alunoAtualizado.mensalidades[0];
        if (ultima.status !== 'PAGO') {
          const vencAtual = new Date(ultima.dataVencimento);
          const ultimoDiaMes = new Date(vencAtual.getFullYear(), vencAtual.getMonth() + 1, 0).getDate();
          vencAtual.setDate(Math.min(diaVencimentoFixo, ultimoDiaMes));

          await prisma.mensalidade.update({
            where: { id: ultima.id },
            data: { dataVencimento: vencAtual },
          });
        }
      }

      await logSystemEvent(
        'INFO',
        'CONTRATO_ELETRONICO',
        `Contrato assinado digitalmente por ${aluno.nome} (CPF: ${aluno.cpf || 'N/A'}) — Hash: BORU-DOC-${hashAuditoria}`
      );

      res.json({
        mensagem: 'Contrato assinado eletronicamente com sucesso! Bem-vindo(a) ao Borü Centro de Combate.',
        aluno: alunoAtualizado,
        assinatura: payloadAssinatura,
      });
    } catch (error: any) {
      console.error('Erro ao assinar contrato:', error);
      res.status(500).json({ erro: 'Erro ao registrar assinatura eletrônica do contrato.' });
    }
  });

  // =========================================================
  // MÓDULO 3: CHECK-IN RÁPIDO (HOME PÚBLICA E PORTAL INTERNO)
  // =========================================================
  app.post('/api/quick-checkin', async (req: Request, res: Response) => {
    const { cpf, senha, alunoId, shift } = req.body;

    try {
      let aluno: any = null;

      if (alunoId) {
        // Frente 2: Dashboard do Aluno (Logado) — sem pedir senha
        aluno = await prisma.aluno.findUnique({
          where: { id: String(alunoId) },
          include: {
            mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 },
          },
        });
        if (!aluno) {
          return res.status(404).json({ erro: 'Sessão de aluno não encontrada.' });
        }
      } else {
        // Frente 1: Home / Tela de Login (Público) — apenas CPF e Senha
        if (!cpf || !senha) {
          return res.status(400).json({ erro: 'Informe seu CPF e Senha para o Check-in Rápido.' });
        }
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        aluno = await prisma.aluno.findFirst({
          where: {
            OR: [{ cpf: cpfLimpo }, { cpf: String(cpf).trim() }],
          },
          include: {
            mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 },
          },
        });

        if (!aluno) {
          return res.status(404).json({ erro: 'CPF não encontrado. Verifique os números digitados.' });
        }

        if (aluno.senha && aluno.senha !== String(senha).trim()) {
          return res.status(401).json({ erro: 'Senha incorreta para realizar o check-in.' });
        }
      }

      // Verificar se existe presença registrada no dia de hoje
      const agora = new Date();
      const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
      const fimDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

      const horaAtual = agora.getHours();
      const turnoInferido = shift || (horaAtual < 12 ? 'MANHA' : horaAtual < 18 ? 'TARDE' : 'NOITE');

      let presencaHoje = await prisma.agendamentoPresenca.findFirst({
        where: {
          alunoId: aluno.id,
          data: { gte: inicioDia, lte: fimDia },
        },
      });

      let jaEstavaPresente = false;

      if (presencaHoje) {
        if (presencaHoje.status === 'PRESENTE') {
          jaEstavaPresente = true;
        } else {
          presencaHoje = await prisma.agendamentoPresenca.update({
            where: { id: presencaHoje.id },
            data: {
              status: 'PRESENTE',
              shift: turnoInferido,
            },
          });
        }
      } else {
        presencaHoje = await prisma.agendamentoPresenca.create({
          data: {
            alunoId: aluno.id,
            data: agora,
            status: 'PRESENTE',
            shift: turnoInferido,
          },
        });
      }

      // Avalia motor de gamificação ("Trilha do Nak Muay") para disparar Level Up! se houver conquista nova
      const gamificacao = await evaluateStudentGamification(prisma, aluno.id).catch(() => null);
      const novasConquistas = gamificacao?.recemDesbloqueadas || [];

      await logSystemEvent(
        'INFO',
        'QUICK_CHECKIN',
        `Check-in Rápido confirmado: ${aluno.nome} (${alunoId ? 'Portal Logado' : 'Home Pública'})`
      );

      return res.json({
        ok: true,
        jaEstavaPresente,
        mensagem: jaEstavaPresente
          ? `Oss, ${aluno.nome.split(' ')[0]}! Sua presença de hoje já estava confirmada no tatame! 🥊`
          : `Oss, ${aluno.nome.split(' ')[0]}! Check-in de hoje registrado com sucesso! Bom treino! 🐺🥊`,
        aluno: {
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf,
          plano: aluno.plano || '2x na semana',
          prajied: aluno.prajied,
          is_bolsista: aluno.is_bolsista,
        },
        checkin: presencaHoje,
        gamificacao,
        novasConquistas,
      });
    } catch (error: any) {
      console.error('Erro no quick-checkin:', error);
      return res.status(500).json({ erro: 'Erro interno ao processar o Check-in Rápido.' });
    }
  });

  // =========================================================
  // MÓDULO 5: GESTÃO FINANCEIRA, GRID & BAIXA COM DATEPICKER
  // =========================================================
  app.get('/api/admin/financeiro', async (_req: Request, res: Response) => {
    try {
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);

      const alunos = await prisma.aluno.findMany({
        include: {
          mensalidades: {
            orderBy: { dataVencimento: 'desc' },
          },
        },
        orderBy: { nome: 'asc' },
      });

      let receitaRecebidaMes = 0;
      let receitaPrevistaMes = 0;
      let totalInadimplenteValor = 0;
      let countPagos = 0;
      let countPendentes = 0;
      let countAtrasados = 0;
      let countBolsistas = 0;

      const registrosFinanceiros = alunos.map((aluno) => {
        const planoLower = (aluno.plano || '').toLowerCase();
        const isDiariaOuConvenio =
          planoLower.includes('diária') ||
          planoLower.includes('diaria') ||
          planoLower.includes('wellhub') ||
          planoLower.includes('totalpass') ||
          planoLower.includes('gympass');

        const ultimaMensalidade = aluno.mensalidades[0] || null;

        let valorPadrao = ultimaMensalidade?.valor || 160;
        if (!ultimaMensalidade) {
          if (planoLower.includes('2x')) valorPadrao = 130;
          else if (planoLower.includes('3x')) valorPadrao = 160;
          else if (planoLower.includes('todos')) valorPadrao = 280;
          else if (isDiariaOuConvenio) valorPadrao = 40;
        }

        // Regra de Negócio Módulo 1: Ignorar alunos com is_bolsista == true na inadimplência
        if (aluno.is_bolsista) {
          countBolsistas++;
          return {
            alunoId: aluno.id,
            mensalidadeId: ultimaMensalidade?.id || null,
            nome: aluno.nome,
            cpf: aluno.cpf,
            telefone: aluno.telefone,
            plano: aluno.plano || 'Bolsista',
            is_bolsista: true,
            isDiariaOuConvenio,
            has_signed_contract: aluno.has_signed_contract,
            data_de_adesao: aluno.data_de_adesao,
            diaVencimentoFixo: aluno.data_de_adesao ? new Date(aluno.data_de_adesao).getDate() : null,
            valor: 0,
            statusFinanceiro: 'BOLSISTA',
            dataVencimento: ultimaMensalidade?.dataVencimento || null,
            dataPagamento: ultimaMensalidade?.dataPagamento || null,
            diasAtraso: 0,
            historicoPagamentos: aluno.mensalidades.slice(0, 5),
          };
        }

        if (isDiariaOuConvenio) {
          countPagos++;
          return {
            alunoId: aluno.id,
            mensalidadeId: ultimaMensalidade?.id || null,
            nome: aluno.nome,
            cpf: aluno.cpf,
            telefone: aluno.telefone,
            plano: aluno.plano || 'Convênio / Diária',
            is_bolsista: false,
            isDiariaOuConvenio: true,
            has_signed_contract: aluno.has_signed_contract,
            data_de_adesao: aluno.data_de_adesao,
            diaVencimentoFixo: null,
            valor: valorPadrao,
            statusFinanceiro: 'CONVENIO_DIARIA',
            dataVencimento: ultimaMensalidade?.dataVencimento || null,
            dataPagamento: ultimaMensalidade?.dataPagamento || null,
            diasAtraso: 0,
            historicoPagamentos: aluno.mensalidades.slice(0, 5),
          };
        }

        let statusFinanceiro = ultimaMensalidade ? ultimaMensalidade.status : 'PENDENTE';
        let diasVencimento = 0;

        if (ultimaMensalidade) {
          const diffMs = new Date(ultimaMensalidade.dataVencimento).getTime() - agora.getTime();
          diasVencimento = Math.ceil(diffMs / (1000 * 3600 * 24));
          if (diasVencimento < 0 && statusFinanceiro !== 'PAGO') {
            statusFinanceiro = 'ATRASADO';
          }
        }

        receitaPrevistaMes += valorPadrao;

        // Contabilizar pagamentos realizados no mês atual
        const pagosNoMes = aluno.mensalidades.filter(
          (m) =>
            m.status === 'PAGO' &&
            m.dataPagamento &&
            new Date(m.dataPagamento) >= inicioMes &&
            new Date(m.dataPagamento) <= fimMes
        );

        if (pagosNoMes.length > 0) {
          receitaRecebidaMes += pagosNoMes.reduce((acc, cur) => acc + cur.valor, 0);
        } else if (statusFinanceiro === 'PAGO') {
          receitaRecebidaMes += valorPadrao;
        }

        if (statusFinanceiro === 'PAGO') {
          countPagos++;
        } else if (statusFinanceiro === 'ATRASADO') {
          countAtrasados++;
          totalInadimplenteValor += valorPadrao;
        } else {
          countPendentes++;
        }

        return {
          alunoId: aluno.id,
          mensalidadeId: ultimaMensalidade?.id || null,
          nome: aluno.nome,
          cpf: aluno.cpf,
          telefone: aluno.telefone,
          plano: aluno.plano || '2x na semana',
          is_bolsista: false,
          isDiariaOuConvenio: false,
          has_signed_contract: aluno.has_signed_contract,
          data_de_adesao: aluno.data_de_adesao,
          diaVencimentoFixo: aluno.data_de_adesao ? new Date(aluno.data_de_adesao).getDate() : null,
          valor: valorPadrao,
          statusFinanceiro,
          dataVencimento: ultimaMensalidade?.dataVencimento || null,
          dataPagamento: ultimaMensalidade?.dataPagamento || null,
          diasVencimento,
          diasAtraso: diasVencimento < 0 ? Math.abs(diasVencimento) : 0,
          historicoPagamentos: aluno.mensalidades.slice(0, 5),
        };
      });

      res.json({
        resumo: {
          receitaRecebidaMes,
          receitaPrevistaMes,
          totalInadimplenteValor,
          saldoPendenteMes: Math.max(0, receitaPrevistaMes - receitaRecebidaMes),
          countPagos,
          countPendentes,
          countAtrasados,
          countBolsistas,
          totalAlunos: alunos.length,
        },
        registros: registrosFinanceiros,
      });
    } catch (error) {
      console.error('Erro no dashboard financeiro:', error);
      res.status(500).json({ erro: 'Erro ao carregar dados financeiros.' });
    }
  });

  // Baixa Manual em Lote com DatePicker (Módulo 5)
  app.post('/api/admin/financeiro/baixa-lote', async (req: Request, res: Response) => {
    const { alunoIds, dataPagamento, valorCustom } = req.body;

    if (!Array.isArray(alunoIds) || alunoIds.length === 0) {
      return res.status(400).json({ erro: 'Selecione ao menos um aluno para dar baixa.' });
    }

    const dataPagEscolhida = dataPagamento ? new Date(dataPagamento + 'T12:00:00') : new Date();

    try {
      let processados = 0;

      for (const alunoId of alunoIds) {
        const aluno = await prisma.aluno.findUnique({
          where: { id: alunoId },
          include: { mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 } },
        });

        if (!aluno || aluno.is_bolsista) continue;

        const ultima = aluno.mensalidades[0];
        const valorFinal =
          valorCustom !== undefined && valorCustom !== ''
            ? Number(valorCustom)
            : ultima?.valor || 160;

        const baseVencimento =
          ultima && new Date(ultima.dataVencimento) > dataPagEscolhida
            ? new Date(ultima.dataVencimento)
            : dataPagEscolhida;

        const novoVencimento = calcularProximoVencimentoPorAdesao(
          baseVencimento,
          aluno.data_de_adesao
        );

        await prisma.mensalidade.create({
          data: {
            alunoId: aluno.id,
            valor: valorFinal,
            dataPagamento: dataPagEscolhida,
            dataVencimento: novoVencimento,
            status: 'PAGO',
          },
        });
        processados++;
      }

      await logSystemEvent(
        'INFO',
        'FINANCEIRO_LOTE',
        `Baixa manual em lote registrada para ${processados} aluno(s) com data de pagamento ${dataPagEscolhida.toLocaleDateString('pt-BR')}`
      );

      res.json({
        mensagem: `Baixa manual confirmada para ${processados} aluno(s) na data ${dataPagEscolhida.toLocaleDateString('pt-BR')}!`,
        processados,
      });
    } catch (error) {
      console.error('Erro na baixa em lote:', error);
      res.status(500).json({ erro: 'Erro ao processar baixa manual em lote.' });
    }
  });

  // =========================================================
  // MÓDULO 6: SPLIT-LIST DE CHAMADA DIÁRIA (ADMIN E PROFESSOR)
  // =========================================================
  app.get('/api/admin/chamada-diaria', async (req: Request, res: Response) => {
    try {
      const dataParam = req.query.data as string | undefined;
      const baseDate = dataParam ? new Date(dataParam + 'T12:00:00') : new Date();
      const inicioDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
      const fimDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

      const [alunos, presencasDia] = await Promise.all([
        prisma.aluno.findMany({
          orderBy: { nome: 'asc' },
        }),
        prisma.agendamentoPresenca.findMany({
          where: {
            data: { gte: inicioDia, lte: fimDia },
          },
          orderBy: { criadoEm: 'desc' },
        }),
      ]);

      const mapaPresencaPorAluno = new Map<string, any>();
      for (const p of presencasDia) {
        if (!mapaPresencaPorAluno.has(p.alunoId) || p.status === 'PRESENTE') {
          mapaPresencaPorAluno.set(p.alunoId, p);
        }
      }

      const fizeramCheckinHoje: any[] = [];
      const naoFizeramCheckinHoje: any[] = [];

      for (const aluno of alunos) {
        const reg = mapaPresencaPorAluno.get(aluno.id);
        const item = {
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf,
          telefone: aluno.telefone,
          plano: aluno.plano || '2x na semana',
          prajied: aluno.prajied || 'Branco',
          modalidade: aluno.modalidade || 'Muay Thai',
          is_bolsista: aluno.is_bolsista,
          presencaHojeId: reg?.id || null,
          statusHoje: reg?.status || null,
          horarioCheckin: reg?.criadoEm
            ? new Date(reg.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : null,
          shift: reg?.shift || null,
        };

        if (reg && reg.status === 'PRESENTE') {
          fizeramCheckinHoje.push(item);
        } else {
          naoFizeramCheckinHoje.push(item);
        }
      }

      res.json({
        dataReferencia: inicioDia.toISOString().split('T')[0],
        totalAlunos: alunos.length,
        totalPresentes: fizeramCheckinHoje.length,
        totalAusentes: naoFizeramCheckinHoje.length,
        fizeramCheckinHoje,
        naoFizeramCheckinHoje,
      });
    } catch (error) {
      console.error('Erro ao buscar chamada diária split-list:', error);
      res.status(500).json({ erro: 'Erro ao carregar a Chamada Diária.' });
    }
  });

  // Baixa Manual Expressa do Professor na Split-List ([ ✓ ])
  app.post('/api/admin/chamada-diaria/marcar', async (req: Request, res: Response) => {
    const { alunoId, professorId, data, status } = req.body;

    if (!alunoId) {
      return res.status(400).json({ erro: 'ID do aluno é obrigatório.' });
    }

    try {
      const baseDate = data ? new Date(data + 'T12:00:00') : new Date();
      const inicioDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
      const fimDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
      const statusFinal = status || 'PRESENTE';

      const hora = new Date().getHours();
      const shiftInferido = hora < 12 ? 'MANHA' : hora < 18 ? 'TARDE' : 'NOITE';

      let registro = await prisma.agendamentoPresenca.findFirst({
        where: {
          alunoId,
          data: { gte: inicioDia, lte: fimDia },
        },
      });

      if (registro) {
        registro = await prisma.agendamentoPresenca.update({
          where: { id: registro.id },
          data: {
            status: statusFinal,
            checked_by_teacher_id: professorId || 'PROFESSOR',
            shift: registro.shift || shiftInferido,
          },
        });
      } else {
        registro = await prisma.agendamentoPresenca.create({
          data: {
            alunoId,
            data: baseDate,
            status: statusFinal,
            checked_by_teacher_id: professorId || 'PROFESSOR',
            shift: shiftInferido,
          },
        });
      }

      const gamificacao = await evaluateStudentGamification(prisma, alunoId).catch(() => null);

      res.json({
        ok: true,
        mensagem: 'Presença confirmada na chamada diária!',
        registro,
        gamificacao,
      });
    } catch (error) {
      console.error('Erro ao marcar chamada diária expressa:', error);
      res.status(500).json({ erro: 'Erro ao registrar presença expressa.' });
    }
  });
}

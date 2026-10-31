import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Seed automático dos itens oficiais da Loja de Points
export async function seedRewardStoreItems(prisma: PrismaClient) {
  try {
    const existing = await prisma.rewardStoreItem.count();
    if (existing === 0) {
      await prisma.rewardStoreItem.createMany({
        data: [
          {
            nome: 'Boné CT Borü Oficial',
            categoria: 'VESTUARIO',
            custo_points: 200,
            estoque: 25,
            descricao: 'Boné exclusivo CT Borü com bordado frontal de alta definição.',
            imagem_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&auto=format&fit=crop&q=80',
            ativo: true,
          },
          {
            nome: 'Coqueteleira Premium Borü',
            categoria: 'ACESSORIOS',
            custo_points: 400,
            estoque: 30,
            descricao: 'Coqueteleira 700ml anti-vazamento com misturador em aço inox.',
            imagem_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
            ativo: true,
          },
          {
            nome: 'Luvas de Boxe / Muay Thai Borü (14oz)',
            categoria: 'EQUIPAMENTOS',
            custo_points: 800,
            estoque: 15,
            descricao: 'Luvas de couro sintético de alta densidade, proteção anatômica de punho.',
            imagem_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&auto=format&fit=crop&q=80',
            ativo: true,
          },
          {
            nome: 'Kimono Trançado Oficial Borü',
            categoria: 'VESTUARIO',
            custo_points: 1000,
            estoque: 10,
            descricao: 'Kimono trançado reforçado 450g/m² com patches oficiais do Centro de Treinamento.',
            imagem_url: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400&auto=format&fit=crop&q=80',
            ativo: true,
          },
        ]
      });
      console.log('✅ Itens iniciais da Loja de Points seedados com sucesso!');
    }
  } catch (e) {
    console.error('Aviso ao seedar RewardStoreItems:', e);
  }
}

export function registerPhase1Routes(app: Express, prisma: PrismaClient) {
  // Inicializa seed em background
  seedRewardStoreItems(prisma);

  // ========================================================
  // 1. CARTEIRA DE PONTOS, EXTRATO & LOJA IN-APP
  // ========================================================

  // Consulta carteira de pontos do aluno (XP vs Points)
  app.get('/api/alunos/:id/carteira-pontos', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const aluno = await prisma.aluno.findUnique({
        where: { id },
        include: {
          extratoPontos: { orderBy: { criadoEm: 'desc' }, take: 20 },
          resgatesLoja: {
            orderBy: { criadoEm: 'desc' },
            include: { item: true }
          }
        }
      });

      if (!aluno) {
        return res.status(404).json({ erro: 'Aluno não encontrado.' });
      }

      // Se o aluno tiver 0 pontos registrados mas já tiver presenças, calcula o saldo inicial proporcional
      let totalXp = aluno.total_xp;
      let spendablePoints = aluno.spendable_points;

      if (totalXp === 0 && spendablePoints === 0) {
        const presencas = await prisma.agendamentoPresenca.count({
          where: { alunoId: id, status: 'PRESENTE' }
        });
        if (presencas > 0) {
          totalXp = presencas * 10;
          spendablePoints = presencas * 5;
          await prisma.aluno.update({
            where: { id },
            data: { total_xp: totalXp, spendable_points: spendablePoints }
          });
          await prisma.pointsLedger.create({
            data: {
              alunoId: id,
              tipo: 'PRESENCA_TATAME',
              xp_delta: totalXp,
              points_delta: spendablePoints,
              saldo_pontos_apos: spendablePoints,
              descricao: `Pontuação retroativa de ${presencas} treinos confirmados no tatame.`
            }
          });
        }
      }

      res.json({
        alunoId: aluno.id,
        nome: aluno.nome,
        total_xp: totalXp,
        spendable_points: spendablePoints,
        prajied: aluno.prajied,
        extrato: aluno.extratoPontos,
        resgates: aluno.resgatesLoja
      });
    } catch (error) {
      console.error('Erro ao buscar carteira de pontos:', error);
      res.status(500).json({ erro: 'Erro interno ao consultar carteira de pontos.' });
    }
  });

  // Lista itens disponíveis para resgate na Loja In-App
  app.get('/api/loja/recompensas', async (_req: Request, res: Response) => {
    try {
      const itens = await prisma.rewardStoreItem.findMany({
        where: { ativo: true },
        orderBy: { custo_points: 'asc' }
      });
      res.json(itens);
    } catch (error) {
      console.error('Erro ao listar recompensas:', error);
      res.status(500).json({ erro: 'Erro ao listar produtos da loja de recompensas.' });
    }
  });

  // Resgate de item da Loja In-App com Points
  app.post('/api/alunos/:id/loja/resgatar', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ erro: 'ID do produto é obrigatório.' });
    }

    try {
      const aluno = await prisma.aluno.findUnique({ where: { id } });
      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

      const item = await prisma.rewardStoreItem.findUnique({ where: { id: itemId } });
      if (!item || !item.ativo) return res.status(404).json({ erro: 'Produto indisponível.' });

      if (item.estoque <= 0) {
        return res.status(400).json({ erro: 'Produto esgotado no estoque do CT.' });
      }

      if (aluno.spendable_points < item.custo_points) {
        return res.status(400).json({
          erro: `Saldo insuficiente! Você tem ${aluno.spendable_points} Points e o item custa ${item.custo_points} Points.`
        });
      }

      // Executa o resgate de forma atômica
      const voucherCode = 'BORU-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const novoSaldoPoints = aluno.spendable_points - item.custo_points;

      const [resgate] = await prisma.$transaction([
        prisma.rewardRedemption.create({
          data: {
            alunoId: id,
            itemId: item.id,
            pontos_gastos: item.custo_points,
            codigo_voucher: voucherCode,
            status: 'PENDENTE_RETIRADA'
          },
          include: { item: true }
        }),
        prisma.aluno.update({
          where: { id },
          data: { spendable_points: novoSaldoPoints }
        }),
        prisma.rewardStoreItem.update({
          where: { id: item.id },
          data: { estoque: { decrement: 1 } }
        }),
        prisma.pointsLedger.create({
          data: {
            alunoId: id,
            tipo: 'RESGATE_LOJA',
            xp_delta: 0, // XP nunca diminui!
            points_delta: -item.custo_points,
            saldo_pontos_apos: novoSaldoPoints,
            descricao: `Resgate de recompensa: ${item.nome} (Voucher ${voucherCode})`
          }
        })
      ]);

      res.status(201).json({
        mensagem: `Resgate realizado com sucesso! Apresente o voucher ${voucherCode} na recepção.`,
        resgate,
        novoSaldoPoints
      });
    } catch (error) {
      console.error('Erro ao resgatar item:', error);
      res.status(500).json({ erro: 'Erro interno ao processar resgate.' });
    }
  });

  // Admin: Listar todos os resgates para entrega na recepção
  app.get('/api/admin/loja/resgates', async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const where: any = {};
      if (status) where.status = String(status);

      const resgates = await prisma.rewardRedemption.findMany({
        where,
        include: {
          aluno: { select: { id: true, nome: true, cpf: true, telefone: true } },
          item: true
        },
        orderBy: { criadoEm: 'desc' }
      });
      res.json(resgates);
    } catch (error) {
      console.error('Erro ao listar resgates admin:', error);
      res.status(500).json({ erro: 'Erro ao buscar resgates.' });
    }
  });

  // Admin: Confirmar entrega física do produto resgatado
  app.post('/api/admin/loja/resgates/:id/entregar', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { entreguePor } = req.body;

    try {
      const resgate = await prisma.rewardRedemption.update({
        where: { id },
        data: {
          status: 'ENTREGUE',
          entregueEm: new Date(),
          entreguePor: entreguePor || 'Recepção CT Borü'
        },
        include: { item: true, aluno: true }
      });
      res.json({ mensagem: 'Item entregue com sucesso!', resgate });
    } catch (error) {
      console.error('Erro ao entregar resgate:', error);
      res.status(500).json({ erro: 'Erro ao confirmar entrega do item.' });
    }
  });

  // ========================================================
  // 2. HISTÓRICO DE GRADUAÇÕES (ALUNO & ADMIN)
  // ========================================================

  app.get('/api/alunos/:id/graduacoes', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const graduacoes = await prisma.graduationHistory.findMany({
        where: { alunoId: id },
        orderBy: { data_graduacao: 'desc' }
      });
      res.json(graduacoes);
    } catch (error) {
      console.error('Erro ao buscar graduações:', error);
      res.status(500).json({ erro: 'Erro ao buscar histórico de graduações.' });
    }
  });

  app.post('/api/admin/alunos/:id/graduacoes', async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      modalidade,
      graduacao_anterior,
      nova_graduacao,
      professorId,
      professorNome,
      data_graduacao,
      notas_exame,
      certificado_url
    } = req.body;

    if (!nova_graduacao) {
      return res.status(400).json({ erro: 'A nova graduação é obrigatória.' });
    }

    try {
      const aluno = await prisma.aluno.findUnique({ where: { id } });
      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

      const gradAnterior = graduacao_anterior || aluno.prajied || 'Branco';
      const novoXp = aluno.total_xp + 50;
      const novosPoints = aluno.spendable_points + 25;

      const [registro] = await prisma.$transaction([
        prisma.graduationHistory.create({
          data: {
            alunoId: id,
            modalidade: modalidade || aluno.modalidade || 'Muay Thai',
            graduacao_anterior: gradAnterior,
            nova_graduacao,
            professorId,
            professorNome: professorNome || 'Mestre Felipe Borü',
            data_graduacao: data_graduacao ? new Date(data_graduacao) : new Date(),
            notas_exame,
            certificado_url
          }
        }),
        prisma.aluno.update({
          where: { id },
          data: {
            prajied: nova_graduacao,
            graduacao: nova_graduacao,
            total_xp: novoXp,
            spendable_points: novosPoints
          }
        }),
        prisma.pointsLedger.create({
          data: {
            alunoId: id,
            tipo: 'GRADUACAO_CONQUISTADA',
            xp_delta: 50,
            points_delta: 25,
            saldo_pontos_apos: novosPoints,
            descricao: `Exame de Graduação: Promovido para ${nova_graduacao} (+50 XP e +25 Points)`
          }
        })
      ]);

      res.status(201).json({ mensagem: 'Graduação registrada e pontuada com sucesso!', registro });
    } catch (error) {
      console.error('Erro ao salvar graduação:', error);
      res.status(500).json({ erro: 'Erro ao registrar graduação.' });
    }
  });

  // ========================================================
  // 3. FECHAMENTO DE CAIXA DIÁRIO OBRIGATÓRIO
  // ========================================================

  app.get('/api/admin/caixa/status', async (_req: Request, res: Response) => {
    try {
      // Busca a sessão aberta mais recente
      const caixaAberto = await prisma.cashRegisterSession.findFirst({
        where: { status: 'ABERTO' },
        orderBy: { data_abertura: 'desc' }
      });

      if (!caixaAberto) {
        return res.json({ status: 'FECHADO', caixa: null });
      }

      // Calcula movimentações ocorridas a partir do momento de abertura deste caixa
      const transacoes = await prisma.transacaoFinanceira.findMany({
        where: {
          data: { gte: caixaAberto.data_abertura },
          status: 'CONFIRMADO'
        }
      });

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

      const saldoEsperadoDinheiro = caixaAberto.saldo_inicial_dinheiro + entradasDinheiro - saidasDinheiro;

      res.json({
        status: 'ABERTO',
        caixa: {
          ...caixaAberto,
          entradas_dinheiro: entradasDinheiro,
          entradas_pix: entradasPix,
          entradas_cartao: entradasCartao,
          saidas_dinheiro: saidasDinheiro,
          saldo_dinheiro_esperado: saldoEsperadoDinheiro,
          total_transacoes: transacoes.length
        }
      });
    } catch (error) {
      console.error('Erro ao consultar status de caixa:', error);
      res.status(500).json({ erro: 'Erro ao consultar status do caixa.' });
    }
  });

  app.post('/api/admin/caixa/abrir', async (req: Request, res: Response) => {
    const { saldo_inicial_dinheiro, operador_id, operador_nome } = req.body;

    try {
      const jaAberto = await prisma.cashRegisterSession.findFirst({
        where: { status: 'ABERTO' }
      });

      if (jaAberto) {
        return res.status(400).json({ erro: 'Já existe um caixa aberto! Realize o fechamento antes de abrir outro.' });
      }

      const novoCaixa = await prisma.cashRegisterSession.create({
        data: {
          saldo_inicial_dinheiro: Number(saldo_inicial_dinheiro) || 0,
          operador_abertura_id: operador_id || 'admin',
          operador_abertura_nome: operador_nome || 'Recepção / Administrador',
          status: 'ABERTO'
        }
      });

      res.status(201).json({ mensagem: 'Caixa aberto com sucesso!', caixa: novoCaixa });
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      res.status(500).json({ erro: 'Erro ao abrir sessão de caixa.' });
    }
  });

  app.post('/api/admin/caixa/fechar', async (req: Request, res: Response) => {
    const { caixaId, saldo_dinheiro_contado, justificativa_diferenca, operador_fechamento_id, operador_fechamento_nome } = req.body;

    if (!caixaId) {
      return res.status(400).json({ erro: 'ID do caixa é obrigatório.' });
    }

    try {
      const caixa = await prisma.cashRegisterSession.findUnique({ where: { id: caixaId } });
      if (!caixa || caixa.status !== 'ABERTO') {
        return res.status(400).json({ erro: 'Caixa não encontrado ou já fechado.' });
      }

      // Calcula movimentações exatas
      const transacoes = await prisma.transacaoFinanceira.findMany({
        where: {
          data: { gte: caixa.data_abertura },
          status: 'CONFIRMADO'
        }
      });

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

      const saldoEsperado = caixa.saldo_inicial_dinheiro + entradasDinheiro - saidasDinheiro;
      const contado = Number(saldo_dinheiro_contado) || 0;
      const diferenca = contado - saldoEsperado;

      if (Math.abs(diferenca) > 0.01 && !justificativa_diferenca) {
        return res.status(400).json({
          erro: `Diferença de caixa detectada (${diferenca.toFixed(2)}). É obrigatório preencher uma justificativa para o fechamento.`
        });
      }

      const resumoJson = JSON.stringify({
        saldoInicial: caixa.saldo_inicial_dinheiro,
        entradasDinheiro,
        entradasPix,
        entradasCartao,
        saidasDinheiro,
        saldoEsperado,
        saldoContado: contado,
        diferenca,
        totalTransacoes: transacoes.length,
        fechadoPor: operador_fechamento_nome || 'Administrador'
      });

      const caixaFechado = await prisma.cashRegisterSession.update({
        where: { id: caixaId },
        data: {
          data_fechamento: new Date(),
          operador_fechamento_id: operador_fechamento_id || 'admin',
          operador_fechamento_nome: operador_fechamento_nome || 'Administrador',
          entradas_dinheiro: entradasDinheiro,
          entradas_pix: entradasPix,
          entradas_cartao: entradasCartao,
          saidas_dinheiro: saidasDinheiro,
          saldo_dinheiro_esperado: saldoEsperado,
          saldo_dinheiro_contado: contado,
          diferenca_dinheiro: diferenca,
          justificativa_diferenca: justificativa_diferenca || null,
          status: 'FECHADO',
          resumo_json: resumoJson
        }
      });

      res.json({ mensagem: 'Caixa fechado e balanço gerado com sucesso!', caixa: caixaFechado });
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      res.status(500).json({ erro: 'Erro ao fechar caixa.' });
    }
  });

  app.get('/api/admin/caixa/relatorios', async (req: Request, res: Response) => {
    try {
      const sessoes = await prisma.cashRegisterSession.findMany({
        orderBy: { data_abertura: 'desc' },
        take: 30
      });
      res.json(sessoes);
    } catch (error) {
      console.error('Erro ao buscar relatórios de caixa:', error);
      res.status(500).json({ erro: 'Erro ao buscar relatórios de caixa.' });
    }
  });

  // ========================================================
  // 4. CONTRATOS LONGOS (TRIMESTRAL, SEMESTRAL, ANUAL)
  // ========================================================

  app.get('/api/admin/alunos/:id/contratos', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const contratos = await prisma.studentContract.findMany({
        where: { alunoId: id },
        orderBy: { data_inicio: 'desc' }
      });
      res.json(contratos);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      res.status(500).json({ erro: 'Erro ao buscar contratos do aluno.' });
    }
  });

  app.post('/api/admin/alunos/:id/contratos', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome_plano, tipo_duracao, duracao_meses, valor_total, data_inicio, observacao } = req.body;

    const meses = Number(duracao_meses) || (tipo_duracao === 'ANUAL' ? 12 : tipo_duracao === 'SEMESTRAL' ? 6 : 3);
    const total = Number(valor_total);

    if (!total || total <= 0) {
      return res.status(400).json({ erro: 'O valor total do contrato é obrigatório.' });
    }

    try {
      const aluno = await prisma.aluno.findUnique({ where: { id } });
      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

      const dInicio = data_inicio ? new Date(data_inicio) : new Date();
      const dFim = new Date(dInicio);
      dFim.setMonth(dFim.getMonth() + meses);

      const valorMensalComp = total / meses;

      // Bônus de points por plano longo
      const bonusPoints = meses >= 12 ? 300 : meses >= 6 ? 120 : 50;
      const novoSaldoPoints = aluno.spendable_points + bonusPoints;

      const [contrato] = await prisma.$transaction([
        prisma.studentContract.create({
          data: {
            alunoId: id,
            nome_plano: nome_plano || `Plano ${meses} Meses (${tipo_duracao || 'LONGO'})`,
            tipo_duracao: tipo_duracao || (meses >= 12 ? 'ANUAL' : meses >= 6 ? 'SEMESTRAL' : 'TRIMESTRAL'),
            duracao_meses: meses,
            valor_total: total,
            valor_mensal_competencia: valorMensalComp,
            data_inicio: dInicio,
            data_fim: dFim,
            status: 'ATIVO',
            observacao
          }
        }),
        prisma.aluno.update({
          where: { id },
          data: {
            plano: `${nome_plano || 'Contrato Fidelidade'} (${meses}m)`,
            spendable_points: novoSaldoPoints
          }
        }),
        prisma.pointsLedger.create({
          data: {
            alunoId: id,
            tipo: 'BONUS_CONTRATO',
            xp_delta: 0,
            points_delta: bonusPoints,
            saldo_pontos_apos: novoSaldoPoints,
            descricao: `Bônus por adesão ao contrato de ${meses} meses (+${bonusPoints} Points)`
          }
        })
      ]);

      res.status(201).json({ mensagem: 'Contrato ativado com sucesso e bônus de Points creditado!', contrato });
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      res.status(500).json({ erro: 'Erro ao registrar contrato.' });
    }
  });

  // ========================================================
  // 5. COMISSIONAMENTO DINÂMICO DE PROFESSORES
  // ========================================================

  app.get('/api/admin/professores/comissoes/config', async (_req: Request, res: Response) => {
    try {
      const professores = await prisma.usuario.findMany({
        where: { cargo: 'PROFESSOR', ativo: true }
      });
      const settings = await prisma.teacherCommissionSetting.findMany();

      const resultado = professores.map(prof => {
        const config = settings.find(s => s.professorId === prof.id);
        return {
          professorId: prof.id,
          nome: prof.nome,
          modalidade: prof.modalidade,
          graduacao: prof.graduacao,
          modelo: config?.modelo || 'POR_ALUNO_PRESENTE',
          valor_por_presenca: config?.valor_por_presenca ?? 3.0,
          valor_por_matriculado: config?.valor_por_matriculado ?? 5.0,
          bonus_conversao_lead: config?.bonus_conversao_lead ?? 30.0
        };
      });

      res.json(resultado);
    } catch (error) {
      console.error('Erro ao buscar configs de comissão:', error);
      res.status(500).json({ erro: 'Erro ao consultar regras de comissão.' });
    }
  });

  app.post('/api/admin/professores/comissoes/config', async (req: Request, res: Response) => {
    const { professorId, modelo, valor_por_presenca, valor_por_matriculado, bonus_conversao_lead } = req.body;

    if (!professorId) return res.status(400).json({ erro: 'ID do professor é obrigatório.' });

    try {
      const setting = await prisma.teacherCommissionSetting.upsert({
        where: { professorId },
        update: {
          modelo: modelo || 'POR_ALUNO_PRESENTE',
          valor_por_presenca: Number(valor_por_presenca) ?? 3.0,
          valor_por_matriculado: Number(valor_por_matriculado) ?? 5.0,
          bonus_conversao_lead: Number(bonus_conversao_lead) ?? 30.0
        },
        create: {
          professorId,
          modelo: modelo || 'POR_ALUNO_PRESENTE',
          valor_por_presenca: Number(valor_por_presenca) ?? 3.0,
          valor_por_matriculado: Number(valor_por_matriculado) ?? 5.0,
          bonus_conversao_lead: Number(bonus_conversao_lead) ?? 30.0
        }
      });
      res.json({ mensagem: 'Configuração de comissão salva com sucesso!', setting });
    } catch (error) {
      console.error('Erro ao salvar config de comissão:', error);
      res.status(500).json({ erro: 'Erro ao salvar configuração de comissão.' });
    }
  });

  app.get('/api/admin/professores/comissoes/relatorio', async (req: Request, res: Response) => {
    const mes = Number(req.query.mes) || (new Date().getMonth() + 1);
    const ano = Number(req.query.ano) || new Date().getFullYear();

    try {
      const professores = await prisma.usuario.findMany({
        where: { cargo: 'PROFESSOR', ativo: true }
      });
      const settings = await prisma.teacherCommissionSetting.findMany();

      const primeiroDia = new Date(ano, mes - 1, 1);
      const ultimoDia = new Date(ano, mes, 0, 23, 59, 59);

      // Total de alunos ativos no sistema
      const totalAlunosAtivos = await prisma.aluno.count();

      const relatorios = [];

      for (const prof of professores) {
        const config = settings.find(s => s.professorId === prof.id);
        const valorPresencaUnit = config?.valor_por_presenca ?? 3.0;
        const valorMatriculadoUnit = config?.valor_por_matriculado ?? 5.0;
        const bonusConversaoUnit = config?.bonus_conversao_lead ?? 30.0;
        const modelo = config?.modelo || 'POR_ALUNO_PRESENTE';

        // Contabiliza presenças computadas no mês
        const totalPresencas = await prisma.agendamentoPresenca.count({
          where: {
            status: 'PRESENTE',
            evento: {
              dataInicio: { gte: primeiroDia, lte: ultimoDia }
            }
          }
        });

        // Alunos na modalidade do professor
        const matriculadosModalidade = await prisma.aluno.count({
          where: { modalidade: { contains: prof.modalidade || 'Muay Thai' } }
        });

        // Aulas experimentais convertidas no mês
        const conversoes = await prisma.agendamentoExperimental.count({
          where: {
            status: 'CONVERTIDO',
            dataAula: { gte: primeiroDia, lte: ultimoDia }
          }
        });

        let valorComissaoPresenca = 0;
        let valorComissaoMatriculados = 0;

        if (modelo === 'POR_ALUNO_PRESENTE' || modelo === 'HIBRIDO') {
          valorComissaoPresenca = totalPresencas * valorPresencaUnit;
        }
        if (modelo === 'POR_MATRICULADO_ATIVO' || modelo === 'HIBRIDO') {
          valorComissaoMatriculados = matriculadosModalidade * valorMatriculadoUnit;
        }
        const valorBonusConversoes = conversoes * bonusConversaoUnit;
        const valorTotal = valorComissaoPresenca + valorComissaoMatriculados + valorBonusConversoes;

        relatorios.push({
          professorId: prof.id,
          nome: prof.nome,
          modalidade: prof.modalidade,
          mes,
          ano,
          modelo,
          total_presencas: totalPresencas,
          total_matriculados: matriculadosModalidade,
          total_conversoes: conversoes,
          valor_comissao_presenca: valorComissaoPresenca,
          valor_comissao_matriculados: valorComissaoMatriculados,
          valor_bonus_conversoes: valorBonusConversoes,
          valor_total: valorTotal
        });
      }

      res.json(relatorios);
    } catch (error) {
      console.error('Erro ao gerar relatório de comissões:', error);
      res.status(500).json({ erro: 'Erro ao gerar relatório de comissões.' });
    }
  });

  // ========================================================
  // 6. DASHBOARD DE OCUPAÇÃO & VISÃO 360 DO ALUNO
  // ========================================================

  app.get('/api/admin/dashboard/ocupacao', async (_req: Request, res: Response) => {
    try {
      const turmas = [
        { id: 't-1', horario: '07:00 - 08:00', modalidade: 'Muay Thai Matutino', capacidade: 25, matriculados: 18, mediaPresenca: 15, status: 'IDEAL' },
        { id: 't-2', horario: '08:30 - 09:30', modalidade: 'Muay Thai & Boxe', capacidade: 25, matriculados: 9, mediaPresenca: 7, status: 'OCIOSA' },
        { id: 't-3', horario: '12:00 - 13:00', modalidade: 'Muay Thai Almoço', capacidade: 20, matriculados: 14, mediaPresenca: 11, status: 'IDEAL' },
        { id: 't-4', horario: '17:00 - 18:00', modalidade: 'Iniciantes & Teens', capacidade: 25, matriculados: 20, mediaPresenca: 17, status: 'IDEAL' },
        { id: 't-5', horario: '18:30 - 19:30', modalidade: 'Muay Thai Noite (Pico)', capacidade: 30, matriculados: 29, mediaPresenca: 27, status: 'LOTADA_PICO' },
        { id: 't-6', horario: '20:00 - 21:00', modalidade: 'Sparring & Competição', capacidade: 30, matriculados: 28, mediaPresenca: 26, status: 'LOTADA_PICO' },
      ];

      res.json(turmas);
    } catch (error) {
      console.error('Erro ao buscar ocupação:', error);
      res.status(500).json({ erro: 'Erro ao buscar dados de ocupação.' });
    }
  });

  app.get('/api/admin/alunos/:id/visao360', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const aluno = await prisma.aluno.findUnique({
        where: { id },
        include: {
          mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 6 },
          contratosLongos: { orderBy: { data_inicio: 'desc' } },
          extratoPontos: { orderBy: { criadoEm: 'desc' }, take: 10 },
          resgatesLoja: { orderBy: { criadoEm: 'desc' }, include: { item: true } },
          historicoGraduacoes: { orderBy: { data_graduacao: 'desc' } },
          conquistasProgresso: {
            where: { status: 'completed' },
            include: { achievement: true }
          }
        }
      });

      if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

      // Métricas de assiduidade
      const totalPresencas = await prisma.agendamentoPresenca.count({
        where: { alunoId: id, status: 'PRESENTE' }
      });

      res.json({
        aluno: {
          id: aluno.id,
          nome: aluno.nome,
          email: aluno.email,
          telefone: aluno.telefone,
          cpf: aluno.cpf,
          plano: aluno.plano,
          modalidade: aluno.modalidade,
          graduacao: aluno.graduacao,
          prajied: aluno.prajied,
          is_bolsista: aluno.is_bolsista,
          has_signed_contract: aluno.has_signed_contract,
          data_de_adesao: aluno.data_de_adesao,
          total_xp: aluno.total_xp,
          spendable_points: aluno.spendable_points,
          criadoEm: aluno.criadoEm
        },
        metricas: {
          totalPresencas,
          totalConquistas: aluno.conquistasProgresso.length,
          totalContratos: aluno.contratosLongos.length,
          totalResgates: aluno.resgatesLoja.length
        },
        contratos: aluno.contratosLongos,
        mensalidades: aluno.mensalidades,
        extratoPontos: aluno.extratoPontos,
        resgatesLoja: aluno.resgatesLoja,
        historicoGraduacoes: aluno.historicoGraduacoes,
        conquistas: aluno.conquistasProgresso.map(c => c.achievement)
      });
    } catch (error) {
      console.error('Erro na Visão 360 do aluno:', error);
      res.status(500).json({ erro: 'Erro ao compilar Visão 360 do aluno.' });
    }
  });
}

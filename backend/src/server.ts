import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ==========================================
// ROTAS DO ALUNO
// ==========================================

// Login do Aluno via CPF e Senha
app.post('/api/alunos/login', async (req, res) => {
  const { cpf, senha } = req.body;
  if (!cpf) return res.status(400).json({ erro: 'CPF é obrigatório.' });

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { cpf: cpfLimpo },
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 }
      }
    });

    if (!aluno) {
      return res.status(404).json({ erro: 'CPF não encontrado no sistema.' });
    }

    // Se a senha foi fornecida, verifica
    if (senha) {
      if (aluno.senha !== senha) {
        return res.status(401).json({ erro: 'Senha incorreta.' });
      }
    } else {
      // Se a senha não foi fornecida, verifica se o aluno tem senha
      if (aluno.senha) {
        return res.status(401).json({ erro: 'Senha é obrigatória.' });
      }
    }

    res.json(aluno);
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// Aluno define/troca a senha
app.post('/api/alunos/alterar-senha', async (req, res) => {
  const { id, novaSenha } = req.body;
  try {
    const aluno = await prisma.aluno.update({
      where: { id },
      data: { senha: novaSenha, primeiroAcesso: false }
    });
    res.json({ mensagem: 'Senha atualizada com sucesso!', aluno });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
});

// Listar aulas de hoje e próximas (com status de check-in se alunoId for informado)
app.get('/api/aulas', async (req, res) => {
  const { alunoId } = req.query;

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 3); // Aulas dos próximos 3 dias

    const aulas = await prisma.eventoDeAula.findMany({
      where: {
        dataInicio: { gte: hoje, lte: limite }
      },
      include: alunoId ? {
        agendamentos: {
          where: { alunoId: String(alunoId) }
        }
      } : undefined,
      orderBy: { dataInicio: 'asc' }
    });

    const aulasFormatadas = aulas.map((aula: any) => {
      const meuCheckin = aula.agendamentos && aula.agendamentos.length > 0 ? aula.agendamentos[0] : null;
      return {
        id: aula.id,
        titulo: aula.titulo,
        dataInicio: aula.dataInicio,
        dataFim: aula.dataFim,
        checkinFeito: Boolean(meuCheckin),
        checkinStatus: meuCheckin ? meuCheckin.status : null,
        checkinId: meuCheckin ? meuCheckin.id : null
      };
    });

    res.json(aulasFormatadas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar aulas.' });
  }
});

// Realizar Check-in (Agendamento/Presença)
app.post('/api/checkin', async (req, res) => {
  const { alunoId, eventoId } = req.body;

  if (!alunoId || !eventoId) {
    return res.status(400).json({ erro: 'Aluno e Aula são obrigatórios para o check-in.' });
  }

  try {
    // Verifica se já fez checkin nesta aula
    const checkinExistente = await prisma.agendamentoPresenca.findFirst({
      where: { alunoId, eventoId }
    });

    if (checkinExistente) {
      return res.status(400).json({ erro: 'Você já realizou check-in nesta aula.', checkin: checkinExistente });
    }

    const evento = await prisma.eventoDeAula.findUnique({
      where: { id: eventoId }
    });

    const checkin = await prisma.agendamentoPresenca.create({
      data: {
        alunoId,
        eventoId,
        data: evento ? evento.dataInicio : new Date(),
        status: 'AGENDADO' // Fica aguardando confirmação do professor
      }
    });

    res.json({ mensagem: 'Check-in realizado com sucesso! Aguardando confirmação do professor.', checkin });
  } catch (error: any) {
    res.status(500).json({ erro: 'Erro ao realizar check-in.' });
  }
});


// ==========================================
// ROTAS DO ADMIN
// ==========================================

// Admin cria um novo Aluno
app.post('/api/admin/alunos', async (req, res) => {
  const { nome, cpf, email, telefone, plano, valorMensalidade } = req.body;
  
  if (!nome || !cpf) {
    return res.status(400).json({ erro: 'Nome e CPF são obrigatórios.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  const senhaTemporaria = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const novoAluno = await prisma.aluno.create({
      data: {
        nome,
        cpf: cpfLimpo,
        email,
        telefone,
        plano: plano || '2x na semana',
        senha: senhaTemporaria,
        primeiroAcesso: true,
        mensalidades: {
          create: {
            valor: parseFloat(valorMensalidade) || 160.00,
            dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // Daqui 30 dias
            status: 'PENDENTE'
          }
        }
      }
    });

    res.json({ mensagem: 'Aluno criado com sucesso!', aluno: novoAluno, senhaTemporaria });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Já existe um aluno com este CPF ou E-mail.' });
    }
    res.status(500).json({ erro: 'Erro ao criar aluno.' });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalAlunos = await prisma.aluno.count();
    const agora = new Date();

    const inadimplentesCount = await prisma.mensalidade.count({
      where: {
        status: 'ATRASADO',
        dataVencimento: { lt: agora }
      }
    });

    const alunos = await prisma.aluno.findMany({
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 }
      },
      orderBy: { nome: 'asc' }
    });

    const alunosFormatados = alunos.map(aluno => {
      const ultimaMensalidade = aluno.mensalidades[0];
      let diasVencimento = null;
      let statusMensalidade = 'PAGO';

      if (ultimaMensalidade) {
        statusMensalidade = ultimaMensalidade.status;
        const diferencaTempo = ultimaMensalidade.dataVencimento.getTime() - agora.getTime();
        diasVencimento = Math.ceil(diferencaTempo / (1000 * 3600 * 24));
        if (diasVencimento < 0 && statusMensalidade !== 'PAGO') {
          statusMensalidade = 'ATRASADO';
        }
      }

      return {
        id: aluno.id,
        nome: aluno.nome,
        plano: aluno.plano || '2x na semana',
        cpf: aluno.cpf,
        email: aluno.email,
        telefone: aluno.telefone,
        status: statusMensalidade,
        diasVencimento,
        prajied: aluno.prajied
      };
    });

    res.json({
      metricas: {
        totalAlunos,
        assinaturasAtivas: totalAlunos - inadimplentesCount,
        inadimplentes: inadimplentesCount
      },
      alunos: alunosFormatados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar dados do painel.' });
  }
});

// Admin atualiza o Prajied do aluno
app.patch('/api/admin/alunos/:id/prajied', async (req, res) => {
  const { id } = req.params;
  const { prajied } = req.body;
  try {
    const aluno = await prisma.aluno.update({
      where: { id },
      data: { prajied }
    });
    res.json({ mensagem: 'Prajied atualizado com sucesso!', aluno });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar Prajied.' });
  }
});

// Admin registra um pagamento manual (Dinheiro/Pix)
app.post('/api/admin/alunos/:id/pagar', async (req, res) => {
  const { id } = req.params;
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: { mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 } }
    });

    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado' });

    let novoVencimento = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

    if (aluno.mensalidades.length > 0) {
      const ultima = aluno.mensalidades[0];
      if (new Date(ultima.dataVencimento) > new Date()) {
        novoVencimento = new Date(new Date(ultima.dataVencimento).getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    const mensalidade = await prisma.mensalidade.create({
      data: {
        alunoId: id,
        valor: aluno.mensalidades[0]?.valor || 160.00,
        dataVencimento: novoVencimento,
        dataPagamento: new Date(),
        status: 'PAGO'
      }
    });

    res.json({ mensagem: 'Pagamento registrado com sucesso!', mensalidade });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar pagamento manual.' });
  }
});

// Admin visualiza as presenças/check-ins dos alunos
app.get('/api/admin/presencas', async (req, res) => {
  try {
    const presencas = await prisma.agendamentoPresenca.findMany({
      include: {
        aluno: { select: { id: true, nome: true, plano: true, telefone: true } },
        evento: { select: { id: true, titulo: true, dataInicio: true } }
      },
      orderBy: { data: 'desc' },
      take: 100
    });
    res.json(presencas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar presenças.' });
  }
});

// Admin altera o status da presença (Confirmar presença, Falta Justificada, Ausente)
app.patch('/api/admin/presencas/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, justificativa } = req.body;

  try {
    const presenca = await prisma.agendamentoPresenca.update({
      where: { id },
      data: {
        status, // 'PRESENTE', 'JUSTIFICADO', 'AUSENTE', 'AGENDADO'
        justificativa: justificativa !== undefined ? justificativa : undefined
      },
      include: {
        aluno: true,
        evento: true
      }
    });

    res.json({ mensagem: 'Status da presença atualizado com sucesso!', presenca });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar presença.' });
  }
});

// ==========================================
// CALENDÁRIO DO ALUNO E CÁLCULO DE FREQUÊNCIA
// ==========================================

// Obter dados do calendário e presença de um aluno para um determinado mês/ano
app.get('/api/admin/alunos/:id/calendario', async (req, res) => {
  const { id } = req.params;
  const agora = new Date();
  const mes = parseInt(req.query.mes as string) || (agora.getMonth() + 1); // 1 a 12
  const ano = parseInt(req.query.ano as string) || agora.getFullYear();

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 }
      }
    });

    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado.' });
    }

    // Intervalo do mês selecionado
    const dataInicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const presencas = await prisma.agendamentoPresenca.findMany({
      where: {
        alunoId: id,
        data: {
          gte: dataInicioMes,
          lte: dataFimMes
        }
      },
      include: {
        evento: true
      },
      orderBy: { data: 'asc' }
    });

    // Mapeamento por data em formato YYYY-MM-DD
    const presencasPorDia: Record<string, any[]> = {};
    presencas.forEach(p => {
      const dataIso = new Date(p.data).toISOString().split('T')[0];
      if (!presencasPorDia[dataIso]) {
        presencasPorDia[dataIso] = [];
      }
      presencasPorDia[dataIso].push(p);
    });

    // Contadores
    const presentesCount = presencas.filter(p => p.status === 'PRESENTE').length;
    const justificadasCount = presencas.filter(p => p.status === 'JUSTIFICADO').length;
    const agendadosCount = presencas.filter(p => p.status === 'AGENDADO').length;
    const ausentesCount = presencas.filter(p => p.status === 'AUSENTE').length;

    // Frequência esperada de acordo com o plano do aluno
    // Ex: "2x na semana" -> 2 aulas por semana x 4 semanas = 8 aulas
    // Ex: "3x na semana" -> 3 aulas por semana x 4 semanas = 12 aulas
    // Ex: "Todos os Horários" -> 5 aulas x 4 semanas = 20 aulas
    // Ex: "Diária" -> 1 aula
    const plano = (aluno.plano || '').toLowerCase();
    let aulasPorSemana = 2;
    if (plano.includes('3x') || plano.includes('tres')) {
      aulasPorSemana = 3;
    } else if (plano.includes('todos') || plano.includes('livre')) {
      aulasPorSemana = 5;
    } else if (plano.includes('diaria') || plano.includes('diária')) {
      aulasPorSemana = 1;
    } else {
      aulasPorSemana = 2;
    }

    const semanasNoMes = 4;
    const aulasEsperadasNoMes = aulasPorSemana * semanasNoMes;

    // Presenças válidas: Presenças confirmadas + Faltas Justificadas
    const presencasEfetivas = presentesCount + justificadasCount;
    
    // Porcentagem calculada
    let porcentagem = 0;
    if (aulasEsperadasNoMes > 0) {
      porcentagem = Math.min(100, Math.round((presencasEfetivas / aulasEsperadasNoMes) * 100));
    }

    // Dados da mensalidade
    const ultimaMensalidade = aluno.mensalidades[0];
    let diasParaVencer = null;
    let statusMensalidade = 'PAGO';

    if (ultimaMensalidade) {
      statusMensalidade = ultimaMensalidade.status;
      const diffTime = new Date(ultimaMensalidade.dataVencimento).getTime() - agora.getTime();
      diasParaVencer = Math.ceil(diffTime / (1000 * 3600 * 24));
      if (diasParaVencer < 0 && statusMensalidade !== 'PAGO') {
        statusMensalidade = 'ATRASADO';
      }
    }

    res.json({
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        telefone: aluno.telefone,
        email: aluno.email,
        plano: aluno.plano || '2x na semana',
        prajied: aluno.prajied
      },
      periodo: { mes, ano },
      estatisticas: {
        aulasPorSemana,
        aulasEsperadasNoMes,
        presentes: presentesCount,
        justificadas: justificadasCount,
        agendadasPendentes: agendadosCount,
        ausentes: ausentesCount,
        presencasEfetivas,
        porcentagemPresenca: porcentagem
      },
      mensalidade: {
        status: statusMensalidade,
        diasParaVencer,
        dataVencimento: ultimaMensalidade?.dataVencimento || null,
        valor: ultimaMensalidade?.valor || 160.00
      },
      presencas,
      presencasPorDia
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao carregar calendário do aluno.' });
  }
});

// Admin adiciona ou altera presença / falta justificada diretamente no calendário
app.post('/api/admin/alunos/:id/presenca', async (req, res) => {
  const { id } = req.params;
  const { data, status, justificativa, eventoId } = req.body;

  if (!data || !status) {
    return res.status(400).json({ erro: 'Data e status são obrigatórios.' });
  }

  try {
    const dataAlvo = new Date(data);
    const inicioDia = new Date(dataAlvo);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAlvo);
    fimDia.setHours(23, 59, 59, 999);

    // Procura se já existe registro de presença neste dia
    let registro = await prisma.agendamentoPresenca.findFirst({
      where: {
        alunoId: id,
        data: {
          gte: inicioDia,
          lte: fimDia
        }
      }
    });

    if (registro) {
      registro = await prisma.agendamentoPresenca.update({
        where: { id: registro.id },
        data: {
          status,
          justificativa: justificativa || null,
          ...(eventoId ? { eventoId } : {})
        }
      });
    } else {
      registro = await prisma.agendamentoPresenca.create({
        data: {
          alunoId: id,
          data: dataAlvo,
          status,
          justificativa: justificativa || null,
          eventoId: eventoId || null
        }
      });
    }

    res.json({ mensagem: 'Presença atualizada no calendário com sucesso!', registro });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao registrar presença no calendário.' });
  }
});

// Admin remove registro de presença de um dia
app.delete('/api/admin/alunos/:id/presenca', async (req, res) => {
  const { id } = req.params;
  const { data, presencaId } = req.body;

  try {
    if (presencaId) {
      await prisma.agendamentoPresenca.delete({
        where: { id: presencaId }
      });
    } else if (data) {
      const dataAlvo = new Date(data);
      const inicioDia = new Date(dataAlvo);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataAlvo);
      fimDia.setHours(23, 59, 59, 999);

      await prisma.agendamentoPresenca.deleteMany({
        where: {
          alunoId: id,
          data: {
            gte: inicioDia,
            lte: fimDia
          }
        }
      });
    }

    res.json({ mensagem: 'Registro removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover registro.' });
  }
});


// ==========================================
// AULAS EXPERIMENTAIS & LEAD FOLLOW-UP
// ==========================================

// Criar Agendamento Experimental (Pelo formulário público do site)
app.post('/api/agendamentos', async (req, res) => {
  const { nome, telefone, data, horario } = req.body;
  try {
    const agendamento = await prisma.agendamentoExperimental.create({
      data: {
        nome,
        telefone,
        data,
        horario,
        status: 'PENDENTE'
      }
    });
    res.json({ mensagem: 'Aula experimental agendada!', agendamento });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao agendar aula.' });
  }
});

// Listar Agendamentos categorizados para o Admin
app.get('/api/admin/agendamentos', async (req, res) => {
  try {
    const todos = await prisma.agendamentoExperimental.findMany({
      orderBy: { criadoEm: 'desc' }
    });

    const agora = new Date();

    // 1: Pendentes (agendados para fazer a aula)
    const pendentes = todos.filter(a => a.status === 'PENDENTE');

    // 2: Pós-Aula (Já realizou a aula experimental, mas ainda não fechou contrato)
    const posAula = todos
      .filter(a => a.status === 'REALIZADA')
      .map(item => {
        const dataReferencia = item.dataRealizada ? new Date(item.dataRealizada) : new Date(item.criadoEm);
        const diferencaMs = agora.getTime() - dataReferencia.getTime();
        const diasDesdeAula = Math.max(0, Math.floor(diferencaMs / (1000 * 60 * 60 * 24)));

        return {
          ...item,
          diasDesdeAula,
          dataRealizadaFormatada: dataReferencia.toLocaleDateString('pt-BR')
        };
      })
      .sort((a, b) => b.diasDesdeAula - a.diasDesdeAula); // Mais antigos primeiro para follow-up urgente

    // 3: Fecharam contrato ou Desistiram
    const finalizados = todos.filter(a => a.status === 'FECHOU_CONTRATO' || a.status === 'DESISTIU');

    res.json({
      pendentes,
      posAula,
      finalizados,
      todos
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// Atualizar status da aula experimental (Realizada, Desistiu, Fechou, etc)
app.patch('/api/admin/agendamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { status, observacao, dataRealizada } = req.body;

  try {
    const dataUpdate: any = {};
    if (status) dataUpdate.status = status;
    if (observacao !== undefined) dataUpdate.observacao = observacao;
    
    // Se marcar como realizada e não tiver dataRealizada, usa a data atual
    if (status === 'REALIZADA') {
      dataUpdate.dataRealizada = dataRealizada ? new Date(dataRealizada) : new Date();
    } else if (dataRealizada) {
      dataUpdate.dataRealizada = new Date(dataRealizada);
    }

    const agendamento = await prisma.agendamentoExperimental.update({
      where: { id },
      data: dataUpdate
    });

    res.json({ mensagem: 'Status do agendamento atualizado!', agendamento });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar agendamento.' });
  }
});

// Converter experimental diretamente em Aluno Matriculado
app.post('/api/admin/agendamentos/:id/converter', async (req, res) => {
  const { id } = req.params;
  const { plano, valorMensalidade, cpf, email } = req.body;

  try {
    const agendamento = await prisma.agendamentoExperimental.findUnique({
      where: { id }
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    // Gera CPF temporário se não fornecido
    const cpfFinal = cpf ? cpf.replace(/[^\d]+/g, '') : Math.floor(10000000000 + Math.random() * 90000000000).toString();
    const senhaTemporaria = Math.floor(100000 + Math.random() * 900000).toString();

    const novoAluno = await prisma.aluno.create({
      data: {
        nome: agendamento.nome,
        telefone: agendamento.telefone,
        cpf: cpfFinal,
        email: email || null,
        plano: plano || '2x na semana',
        senha: senhaTemporaria,
        primeiroAcesso: true,
        mensalidades: {
          create: {
            valor: parseFloat(valorMensalidade) || 160.00,
            dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
            status: 'PENDENTE'
          }
        }
      }
    });

    // Atualiza status do agendamento para FECHOU_CONTRATO
    await prisma.agendamentoExperimental.update({
      where: { id },
      data: { status: 'FECHOU_CONTRATO' }
    });

    res.json({
      mensagem: `Parabéns! ${agendamento.nome} agora é um aluno matriculado!`,
      aluno: novoAluno,
      senhaTemporaria
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao converter lead em aluno.' });
  }
});


// ==========================================
// ROTAS DE PAGAMENTO E CHECKOUT
// ==========================================

// Criar novo aluno via Checkout no site
app.post('/api/checkout', async (req, res) => {
  const { nome, cpf, email, telefone, senha, plano, valor } = req.body;
  if (!nome || !cpf || !senha) {
    return res.status(400).json({ erro: 'Nome, CPF e senha são obrigatórios.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  
  try {
    const novoAluno = await prisma.aluno.create({
      data: {
        nome,
        cpf: cpfLimpo,
        email,
        telefone,
        senha,
        primeiroAcesso: false,
        plano: plano || '2x na semana',
        mensalidades: {
          create: {
            valor: parseFloat(valor) || 160,
            dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
            dataPagamento: new Date(),
            status: 'PAGO'
          }
        }
      }
    });

    res.json({ mensagem: 'Pagamento aprovado e cadastro concluído!', aluno: novoAluno });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Já existe um aluno com este CPF ou E-mail.' });
    }
    res.status(500).json({ erro: 'Erro ao processar checkout.' });
  }
});

// Renovar mensalidade (Portal do Aluno)
app.post('/api/alunos/pagar', async (req, res) => {
  const { alunoId, valor } = req.body;
  try {
    const mensalidade = await prisma.mensalidade.create({
      data: {
        alunoId,
        valor: parseFloat(valor) || 160,
        dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
        dataPagamento: new Date(),
        status: 'PAGO'
      }
    });
    res.json({ mensagem: 'Mensalidade renovada com sucesso!', mensalidade });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar pagamento.' });
  }
});

// Processamento genérico de pagamentos (Mock Gateway)
app.post('/api/pagamentos/processar', async (req, res) => {
  const { alunoId, valor } = req.body;
  
  try {
    const dataPagamento = new Date();
    const status = 'PAGO';

    let alunoObj = null;
    if (alunoId) {
      alunoObj = await prisma.aluno.findUnique({ where: { id: alunoId } });
    }

    if (alunoObj) {
      const mensalidade = await prisma.mensalidade.create({
        data: {
          alunoId: alunoObj.id,
          valor: parseFloat(valor) || 160,
          dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
          dataPagamento,
          status
        }
      });
      res.json({ sucesso: true, mensagem: 'Pagamento processado com sucesso!', transacaoId: 'tx_' + Math.random().toString(36).substring(7), mensalidade });
    } else {
      res.json({ sucesso: true, mensagem: 'Pagamento avulso processado com sucesso!', transacaoId: 'tx_' + Math.random().toString(36).substring(7) });
    }
  } catch (error) {
    res.status(500).json({ erro: 'Falha no gateway de pagamento' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server API running on http://localhost:${PORT}`);
});

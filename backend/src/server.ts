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

// Listar aulas de hoje e próximas
app.get('/api/aulas', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 3); // Aulas dos próximos 3 dias

    const aulas = await prisma.eventoDeAula.findMany({
      where: {
        dataInicio: { gte: hoje, lte: limite }
      },
      orderBy: { dataInicio: 'asc' }
    });

    res.json(aulas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar aulas.' });
  }
});

// Realizar Check-in (Agendamento/Presença)
app.post('/api/checkin', async (req, res) => {
  const { alunoId, eventoId } = req.body;

  try {
    const checkin = await prisma.agendamentoPresenca.create({
      data: {
        alunoId,
        eventoId,
        status: 'AGENDADO'
      }
    });
    res.json({ mensagem: 'Check-in realizado com sucesso!', checkin });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Você já fez check-in nesta aula.' });
    }
    res.status(500).json({ erro: 'Erro ao realizar check-in.' });
  }
});


// ==========================================
// ROTAS DO ADMIN
// ==========================================

// Admin cria um novo Aluno
app.post('/api/admin/alunos', async (req, res) => {
  const { nome, cpf, email, plano, valorMensalidade } = req.body;
  
  if (!nome || !cpf) {
    return res.status(400).json({ erro: 'Nome e CPF são obrigatórios.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  
  // Gera uma senha temporária (simulação de envio por email)
  const senhaTemporaria = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const novoAluno = await prisma.aluno.create({
      data: {
        nome,
        cpf: cpfLimpo,
        email,
        plano,
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

    console.log(`\n\n📧 EMAIL ENVIADO PARA ${email || 'o aluno'}:`);
    console.log(`Assunto: Bem-vindo ao BORÜ Centro de Combate`);
    console.log(`Olá ${nome}, seu cadastro foi concluído!`);
    console.log(`Acesse o Portal do Aluno com seu CPF e a senha temporária: ${senhaTemporaria}`);
    console.log(`Você deverá criar uma nova senha no primeiro acesso.\n\n`);

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
    
    // Alunos com mensalidade atrasada
    const agora = new Date();
    const inadimplentesCount = await prisma.mensalidade.count({
      where: {
        status: 'ATRASADO',
        dataVencimento: { lt: agora }
      }
    });

    // Lista de todos os alunos com sua última mensalidade
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
      }

      return {
        id: aluno.id,
        nome: aluno.nome,
        plano: aluno.plano || 'Sem Plano Fixo',
        cpf: aluno.cpf,
        status: statusMensalidade,
        diasVencimento
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

// ==========================================
// NOVAS ROTAS (CHECKOUT E AGENDAMENTO)
// ==========================================

// Criar novo aluno via Checkout no site
app.post('/api/checkout', async (req, res) => {
  const { nome, cpf, email, senha, plano, valor } = req.body;
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
        senha, // Senha criada pelo próprio aluno
        primeiroAcesso: false, // Não precisa trocar a senha
        plano,
        mensalidades: {
          create: {
            valor: parseFloat(valor),
            dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // Daqui 30 dias
            dataPagamento: new Date(),
            status: 'PAGO' // Pago no ato do checkout
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
        valor: parseFloat(valor),
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

// Criar Agendamento Experimental
app.post('/api/agendamentos', async (req, res) => {
  const { nome, telefone, data, horario } = req.body;
  try {
    const agendamento = await prisma.agendamentoExperimental.create({
      data: { nome, telefone, data, horario, status: 'PENDENTE' }
    });
    res.json({ mensagem: 'Aula experimental agendada!', agendamento });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao agendar aula.' });
  }
});

// Listar Agendamentos (Admin)
app.get('/api/admin/agendamentos', async (req, res) => {
  try {
    const agendamentos = await prisma.agendamentoExperimental.findMany({
      orderBy: { criadoEm: 'desc' }
    });
    res.json(agendamentos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server API running on http://localhost:${PORT}`);
});

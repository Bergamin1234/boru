import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { evaluateStudentGamification } from './gamificationService';
import { registerGamificationRoutes } from './gamificationRoutes';
import { registerAddonRoutes, calcularProximoVencimentoPorAdesao } from './addonRoutes';

const app = express();
const prisma = new PrismaClient();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || !process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
registerGamificationRoutes(app, prisma);
registerAddonRoutes(app, prisma);

// Servir arquivos estáticos do frontend e uploads (modo portátil / produção)
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// AUTENTICAÇÃO RBAC (ADMIN DEV, ADMIN GERAL & PROFESSORES)
// ==========================================

// Login unificado de equipe (AdminDev, Administrador Geral e Professores)
app.post('/api/auth/login', async (req, res) => {
  const { emailOuUsuario, senha } = req.body;

  if (!emailOuUsuario || !senha) {
    return res.status(400).json({ erro: 'Informe o login e a senha de acesso.' });
  }

  const termo = emailOuUsuario.trim();
  const termoLower = termo.toLowerCase();
  const cpfLimpo = termo.replace(/\D/g, '');

  // 1. Verificação do AdminDev / BrgAdmin (Ítalo Bergamin | Acesso: BrgAdmin | Senha: BoruCentroDeCombate98490@!)
  const isAdminLogin = (termoLower === 'brgadmin' || termoLower === 'brgadmin@boru.com' || termoLower === 'admin@boru.com' || termoLower === 'admin');

  if (isAdminLogin) {
    if (senha !== 'BoruCentroDeCombate98490@!') {
      return res.status(401).json({ erro: 'Senha incorreta para o Administrador.' });
    }

    let adminDb = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: 'brgadmin@boru.com' },
          { email: 'admin@boru.com' }
        ]
      }
    });

    if (!adminDb) {
      adminDb = await prisma.usuario.create({
        data: {
          nome: 'Ítalo Bergamin (BrgAdmin)',
          email: 'brgadmin@boru.com',
          senha: 'BoruCentroDeCombate98490@!',
          cargo: 'ADMIN',
          is_dev: true,
          telefone: '(69) 99238-4491',
          prajied: 'Prajied Preto',
          prajied_faixa: 'Prajied Preto'
        }
      });
    } else if (adminDb.senha !== 'BoruCentroDeCombate98490@!' || !adminDb.is_dev) {
      adminDb = await prisma.usuario.update({
        where: { id: adminDb.id },
        data: {
          email: 'brgadmin@boru.com',
          senha: 'BoruCentroDeCombate98490@!',
          is_dev: true
        }
      });
    }

    return res.json({
      usuario: {
        id: adminDb.id,
        nome: adminDb.nome,
        email: adminDb.email,
        cargo: 'ADMIN',
        is_dev: true,
        role_level: 'ADMIN_DEV',
        telefone: adminDb.telefone,
        prajied: adminDb.prajied || 'Prajied Preto',
        prajied_faixa: adminDb.prajied_faixa || adminDb.prajied || 'Prajied Preto',
        fotoPerfilUrl: adminDb.fotoPerfilUrl || null
      }
    });
  }

  try {
    // 2. Busca do usuário (Admin Geral Amanda / Felipe ou Professor através do CPF ou E-mail)
    const condicoes: any[] = [
      { email: termoLower }
    ];

    if (cpfLimpo.length >= 11) {
      condicoes.push({ cpf: cpfLimpo });
      condicoes.push({ cpf: termo });
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: condicoes,
        ativo: true
      }
    });

    if (!usuario) {
      return res.status(401).json({
        erro: 'Usuário não localizado. Professores e Administradores devem acessar informando o seu CPF ou E-mail e senha cadastrados.'
      });
    }

    if (usuario.senha !== senha) {
      return res.status(401).json({
        erro: 'Senha incorreta. A troca de senha de equipe é realizada pelo Administrador.'
      });
    }

    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        cargo: usuario.cargo,
        is_dev: Boolean(usuario.is_dev),
        role_level: usuario.is_dev ? 'ADMIN_DEV' : usuario.cargo,
        telefone: usuario.telefone,
        modalidade: usuario.modalidade || 'Muay Thai',
        graduacao: usuario.graduacao || usuario.prajied,
        tempoPratica: usuario.tempoPratica,
        tempoDocencia: usuario.tempoDocencia,
        tempoAula: usuario.tempoAula || '60 min',
        horariosAula: usuario.horariosAula || usuario.horarios_aula,
        horarios_aula: usuario.horarios_aula || usuario.horariosAula,
        cargaHorariaSemanal: usuario.cargaHorariaSemanal,
        prajied: usuario.prajied,
        prajied_faixa: usuario.prajied_faixa || usuario.prajied || usuario.graduacao,
        fotoPerfilUrl: usuario.fotoPerfilUrl || null
      }
    });
  } catch (error) {
    console.error('Erro na autenticação de equipe', error);
    res.status(500).json({ erro: 'Erro interno ao validar credenciais.' });
  }
});

// ==========================================
// GESTÃO DE PROFESSORES (EXCLUSIVO PARA ADMIN)
// ==========================================

// Listar todos os professores e membros da equipe
app.get('/api/admin/professores', async (req, res) => {
  try {
    const professores = await prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' }
    });
    res.json(professores);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar professores.' });
  }
});

// Criar novo professor (Função exclusiva do Administrador)
app.post('/api/admin/professores', async (req, res) => {
  const { 
    nome, 
    email, 
    cpf,
    senha, 
    cargo, 
    telefone, 
    modalidade, 
    graduacao, 
    tempoPratica, 
    tempoDocencia, 
    tempoAula, 
    horariosAula,
    horarios_aula,
    cargaHorariaSemanal, 
    prajied,
    prajied_faixa,
    fotoPerfilUrl
  } = req.body;

  if (!nome || !senha) {
    return res.status(400).json({ erro: 'Nome e Senha são obrigatórios.' });
  }

  const cargoFinal = cargo === 'ADMIN' ? 'ADMIN' : 'PROFESSOR';
  const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;
  const emailFinal = email ? email.trim().toLowerCase() : (cpfLimpo ? `${cpfLimpo}@boru.com` : `professor_${Date.now()}@boru.com`);

  if (cargoFinal === 'PROFESSOR' && (!cpfLimpo || cpfLimpo.length < 11)) {
    return res.status(400).json({ erro: 'CPF válido (11 dígitos) é obrigatório para cadastrar o professor. O professor usará este CPF para fazer login no sistema.' });
  }

  try {
    if (cpfLimpo) {
      const existenteCpf = await prisma.usuario.findFirst({
        where: {
          OR: [{ cpf: cpfLimpo }, { cpf }]
        }
      });
      if (existenteCpf) {
        return res.status(400).json({ erro: `Já existe um professor/usuário cadastrado com este CPF (${cpfLimpo}).` });
      }
    }

    const existenteEmail = await prisma.usuario.findUnique({
      where: { email: emailFinal }
    });

    if (existenteEmail) {
      return res.status(400).json({ erro: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const modalidadeFinal = modalidade || 'Muay Thai';
    const graduacaoFinal = prajied_faixa || graduacao || prajied || 'Prajied Azul Escuro e Preto';
    const horariosFinal = horarios_aula || horariosAula || null;

    const novo = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailFinal,
        cpf: cpfLimpo,
        senha: senha.trim(),
        cargo: cargoFinal,
        telefone: telefone ? telefone.trim() : null,
        modalidade: modalidadeFinal,
        graduacao: graduacaoFinal,
        tempoPratica: tempoPratica ? tempoPratica.trim() : null,
        tempoDocencia: tempoDocencia ? tempoDocencia.trim() : null,
        tempoAula: tempoAula || '60 min',
        horariosAula: horariosFinal ? String(horariosFinal).trim() : null,
        horarios_aula: horariosFinal ? String(horariosFinal).trim() : null,
        cargaHorariaSemanal: cargaHorariaSemanal ? cargaHorariaSemanal.trim() : null,
        prajied: graduacaoFinal,
        prajied_faixa: graduacaoFinal,
        fotoPerfilUrl: fotoPerfilUrl || null,
        ativo: true
      }
    });

    res.json({ mensagem: 'Professor cadastrado com sucesso! Ele já pode acessar informando seu CPF e senha.', professor: novo });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ erro: error.message || 'Erro ao cadastrar professor.' });
  }
});

// Alterar senha de um professor manualmente (Exclusivo para o Administrador)
app.post('/api/admin/professores/:id/alterar-senha', async (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;

  if (!novaSenha || novaSenha.trim().length < 4) {
    return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 4 caracteres.' });
  }

  try {
    const professor = await prisma.usuario.update({
      where: { id },
      data: { senha: novaSenha.trim() }
    });

    res.json({ mensagem: `Senha do professor ${professor.nome} alterada com sucesso pelo Administrador!` });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao alterar senha do professor.' });
  }
});

// Atualizar dados de um professor
app.patch('/api/admin/professores/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    nome, 
    email,
    cpf,
    telefone, 
    prajied,
    prajied_faixa,
    cargo, 
    senha,
    modalidade,
    graduacao,
    tempoPratica,
    tempoDocencia,
    tempoAula,
    horariosAula,
    horarios_aula,
    cargaHorariaSemanal,
    fotoPerfilUrl,
    ativo,
    is_dev
  } = req.body;

  try {
    const userExistente = await prisma.usuario.findUnique({ where: { id } });
    if (!userExistente) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const dataUpdate: any = {};
    if (nome) dataUpdate.nome = nome.trim();
    
    if (email) {
      const emailLimpo = email.trim().toLowerCase();
      const existingEmail = await prisma.usuario.findFirst({
        where: { email: emailLimpo, id: { not: id } }
      });
      if (existingEmail) {
        return res.status(400).json({ erro: 'Este e-mail já está sendo utilizado por outro usuário.' });
      }
      dataUpdate.email = emailLimpo;
    }

    if (cpf !== undefined) {
      const cpfLimpo = cpf ? String(cpf).replace(/\D/g, '') : null;
      if (cpfLimpo) {
        const existingCpf = await prisma.usuario.findFirst({
          where: { cpf: cpfLimpo, id: { not: id } }
        });
        if (existingCpf) {
          return res.status(400).json({ erro: `O CPF ${cpf} já está em uso por outro usuário (${existingCpf.nome}).` });
        }
      }
      dataUpdate.cpf = cpfLimpo;
    }

    if (telefone !== undefined) dataUpdate.telefone = telefone ? String(telefone).trim() : null;
    if (cargo) dataUpdate.cargo = cargo;
    if (senha && String(senha).trim()) dataUpdate.senha = String(senha).trim();
    if (modalidade) dataUpdate.modalidade = modalidade;
    
    const faixaFinal = prajied_faixa || graduacao || prajied;
    if (faixaFinal) {
      dataUpdate.graduacao = faixaFinal;
      dataUpdate.prajied = faixaFinal;
      dataUpdate.prajied_faixa = faixaFinal;
    }

    if (tempoPratica !== undefined) dataUpdate.tempoPratica = tempoPratica ? String(tempoPratica) : null;
    if (tempoDocencia !== undefined) dataUpdate.tempoDocencia = tempoDocencia ? String(tempoDocencia) : null;
    if (tempoAula !== undefined) dataUpdate.tempoAula = tempoAula ? String(tempoAula) : '60 min';
    
    if (horariosAula !== undefined || horarios_aula !== undefined) {
      const hRaw = horarios_aula !== undefined ? horarios_aula : horariosAula;
      let hVal: string | null = null;
      if (Array.isArray(hRaw)) {
        hVal = hRaw.filter(Boolean).map((s: any) => String(s).trim()).join(', ');
      } else if (typeof hRaw === 'string') {
        hVal = hRaw.trim();
      } else if (hRaw) {
        hVal = String(hRaw);
      }
      dataUpdate.horariosAula = hVal || null;
      dataUpdate.horarios_aula = hVal || null;
    }

    if (cargaHorariaSemanal !== undefined) dataUpdate.cargaHorariaSemanal = cargaHorariaSemanal ? String(cargaHorariaSemanal) : null;
    if (fotoPerfilUrl !== undefined) dataUpdate.fotoPerfilUrl = fotoPerfilUrl || null;
    if (ativo !== undefined) dataUpdate.ativo = Boolean(ativo);
    if (is_dev !== undefined) dataUpdate.is_dev = Boolean(is_dev);

    const atualizado = await prisma.usuario.update({
      where: { id },
      data: dataUpdate
    });

    res.json({ mensagem: 'Dados do professor atualizados com sucesso!', professor: atualizado });
  } catch (error: any) {
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({ erro: error?.message || 'Erro ao atualizar dados do professor.' });
  }
});

// Excluir professor (Admin)
app.delete('/api/admin/professores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.usuario.delete({ where: { id } });
    res.json({ mensagem: 'Professor removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover professor.' });
  }
});

// ==========================================
// MURAL DE AVISOS (COMUNICADOS)
// ==========================================

// Listar avisos para Alunos e Professores
app.get('/api/avisos', async (req, res) => {
  try {
    const avisos = await prisma.aviso.findMany({
      orderBy: [
        { fixado: 'desc' },
        { criadoEm: 'desc' }
      ]
    });
    res.json(avisos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar avisos do mural.' });
  }
});

// Criar aviso no mural (Professores e Admin)
app.post('/api/admin/avisos', async (req, res) => {
  const { titulo, conteudo, tipo, autorNome, autorCargo, fixado } = req.body;

  if (!titulo || !conteudo) {
    return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios.' });
  }

  try {
    const aviso = await prisma.aviso.create({
      data: {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        tipo: tipo || 'GERAL',
        autorNome: autorNome || 'Felipe Borü',
        autorCargo: autorCargo || 'Professor',
        fixado: Boolean(fixado)
      }
    });

    res.json({ mensagem: 'Aviso publicado no mural com sucesso!', aviso });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar aviso.' });
  }
});

// Excluir aviso do mural
app.delete('/api/admin/avisos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.aviso.delete({ where: { id } });
    res.json({ mensagem: 'Aviso removido do mural.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao excluir aviso.' });
  }
});

// ==========================================
// LOJA & MERCADO BORÜ (BETA)
// ==========================================

// Listar produtos da loja (com filtro opcional por categoria)
app.get('/api/produtos', async (req, res) => {
  const { categoria } = req.query;

  try {
    const where: any = { disponivel: true };
    if (categoria && typeof categoria === 'string' && categoria !== 'TODOS') {
      where.categoria = categoria;
    }

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { criadoEm: 'asc' }
    });

    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar produtos da loja.' });
  }
});

// Admin adiciona novo produto na loja
app.post('/api/admin/produtos', async (req, res) => {
  const { nome, categoria, preco, estoque, descricao, imagemUrl } = req.body;

  if (!nome || !categoria || preco === undefined) {
    return res.status(400).json({ erro: 'Nome, categoria e preço são obrigatórios.' });
  }

  try {
    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        categoria,
        preco: parseFloat(preco) || 0,
        estoque: parseInt(estoque) || 0,
        descricao: descricao || null,
        imagemUrl: imagemUrl || null,
        disponivel: true
      }
    });

    res.json({ mensagem: 'Produto cadastrado com sucesso!', produto });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
  }
});

// Atualizar produto / estoque
app.put('/api/admin/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, preco, estoque, descricao, imagemUrl, disponivel } = req.body;

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...(nome ? { nome: nome.trim() } : {}),
        ...(categoria ? { categoria } : {}),
        ...(preco !== undefined ? { preco: parseFloat(preco) } : {}),
        ...(estoque !== undefined ? { estoque: parseInt(estoque) } : {}),
        ...(descricao !== undefined ? { descricao } : {}),
        ...(imagemUrl !== undefined ? { imagemUrl } : {}),
        ...(disponivel !== undefined ? { disponivel } : {})
      }
    });

    res.json({ mensagem: 'Produto atualizado com sucesso!', produto });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar produto.' });
  }
});

// Deletar produto da loja
app.delete('/api/admin/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.produto.delete({ where: { id } });
    res.json({ mensagem: 'Produto removido.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao excluir produto.' });
  }
});

// ==========================================
// ROTAS DO ALUNO
// ==========================================

// Recuperação de senha
app.post('/api/alunos/recuperar-senha', async (req, res) => {
  const { contato } = req.body;

  if (!contato) {
    return res.status(400).json({ erro: 'Por favor, informe seu CPF, E-mail ou Telefone.' });
  }

  const contatoLimpo = contato.trim();
  const apenasNumeros = contatoLimpo.replace(/[^\d]+/g, '');

  try {
    const filters: any[] = [{ email: contatoLimpo }];
    if (apenasNumeros.length > 0) {
      filters.push({ cpf: apenasNumeros });
    }
    if (apenasNumeros.length > 8) {
      filters.push({ telefone: { contains: apenasNumeros } });
    }

    const aluno = await prisma.aluno.findFirst({
      where: { OR: filters }
    });

    if (!aluno) {
      return res.status(404).json({ erro: 'Nenhum aluno encontrado com este contato.' });
    }

    const senhaTemporaria = 'boru123';
    
    await prisma.aluno.update({
      where: { id: aluno.id },
      data: {
        senha: senhaTemporaria,
        primeiroAcesso: true
      }
    });

    res.json({ mensagem: 'Sua senha foi redefinida para "boru123". Faça o login com essa senha e crie uma nova em seguida!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno ao recuperar senha.' });
  }
});

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

    if (senha) {
      if (aluno.senha !== senha) {
        return res.status(401).json({ erro: 'Senha incorreta.' });
      }
    } else {
      if (aluno.senha) {
        return res.status(401).json({ erro: 'Senha é obrigatória.' });
      }
    }

    const planoLower = (aluno.plano || '').toLowerCase();
    const isDiariaOuConvenio = planoLower.includes('diária') || planoLower.includes('diaria') || planoLower.includes('wellhub') || planoLower.includes('totalpass') || planoLower.includes('gympass');

    res.json({
      ...aluno,
      isDiariaOuConvenio,
      tipoCobranca: aluno.is_bolsista ? 'BOLSISTA' : isDiariaOuConvenio ? 'DIARIA_CONVENIO' : 'MENSALIDADE'
    });
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

// Gamificação & Estímulo ao Check-in
app.get('/api/alunos/:id/gamificacao', async (req, res) => {
  const { id } = req.params;
  try {
    const dadosGamificacao = await evaluateStudentGamification(prisma, id);
    res.json(dadosGamificacao);
  } catch (error: any) {
    if (error?.message?.includes('não encontrado')) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }
    res.status(500).json({ erro: 'Erro ao calcular gamificação.' });
  }
});

// Aluno justifica ausência antecipada (Doença / Atestado / Motivo de Força Maior)
app.post('/api/alunos/justificar-ausencia', async (req, res) => {
  const { alunoId, data, eventoId, motivo, justificativa } = req.body;

  if (!alunoId || !data) {
    return res.status(400).json({ erro: 'Aluno e data são obrigatórios.' });
  }

  try {
    const dataAlvo = new Date(data);
    const inicioDia = new Date(dataAlvo);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAlvo);
    fimDia.setHours(23, 59, 59, 999);

    const statusFinal = motivo === 'DOENCA' ? 'DOENCA' : 'JUSTIFICADO';

    let reg = await prisma.agendamentoPresenca.findFirst({
      where: {
        alunoId,
        data: { gte: inicioDia, lte: fimDia }
      }
    });

    if (reg) {
      reg = await prisma.agendamentoPresenca.update({
        where: { id: reg.id },
        data: {
          status: statusFinal,
          tipoJustificativa: motivo || 'DOENCA',
          justificativa: justificativa || 'Ausência comunicada pelo aluno no app'
        }
      });
    } else {
      reg = await prisma.agendamentoPresenca.create({
        data: {
          alunoId,
          eventoId: eventoId || null,
          data: dataAlvo,
          status: statusFinal,
          tipoJustificativa: motivo || 'DOENCA',
          justificativa: justificativa || 'Ausência comunicada pelo aluno no app'
        }
      });
    }

    res.json({ mensagem: 'Ausência registrada e justificada com sucesso! Melhoras, guerreiro!', registro: reg });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar justificativa.' });
  }
});

// Listar aulas de hoje e próximas com status do aluno
app.get('/api/aulas', async (req, res) => {
  const { alunoId } = req.query;

  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 4);

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
        checkinId: meuCheckin ? meuCheckin.id : null,
        tipoJustificativa: meuCheckin ? meuCheckin.tipoJustificativa : null
      };
    });

    res.json(aulasFormatadas);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar aulas.' });
  }
});

// Realizar Check-in
app.post('/api/checkin', async (req, res) => {
  const { alunoId, eventoId } = req.body;

  if (!alunoId || !eventoId) {
    return res.status(400).json({ erro: 'Aluno e Aula são obrigatórios para o check-in.' });
  }

  try {
    const checkinExistente = await prisma.agendamentoPresenca.findFirst({
      where: { alunoId, eventoId }
    });

    if (checkinExistente) {
      return res.status(400).json({ erro: 'Você já realizou check-in nesta aula.', checkin: checkinExistente });
    }

    const evento = await prisma.eventoDeAula.findUnique({ where: { id: eventoId } });

    const dataAula = evento ? new Date(evento.dataInicio) : new Date();
    const horaAula = dataAula.getHours();
    const turnoInferido = req.body.shift || (horaAula < 12 ? 'MANHA' : horaAula < 18 ? 'TARDE' : 'NOITE');

    const checkin = await prisma.agendamentoPresenca.create({
      data: {
        alunoId,
        eventoId,
        data: dataAula,
        status: 'AGENDADO',
        shift: turnoInferido,
        is_special_event: Boolean(req.body.is_special_event),
        arrived_early: Boolean(req.body.arrived_early),
        adverse_weather: Boolean(req.body.adverse_weather),
        accompanied_by_user_id: req.body.accompanied_by_user_id || null
      }
    });

    const gamificacao = await evaluateStudentGamification(prisma, alunoId).catch(() => null);

    res.json({ 
      mensagem: 'Oss! Check-in registrado com sucesso! Mostre sua determinação no tatame.', 
      checkin,
      gamificacao
    });
  } catch (error: any) {
    res.status(500).json({ erro: 'Erro ao realizar check-in.' });
  }
});

// ==========================================
// ROTAS DO ADMIN & PROFESSORES
// ==========================================

// Criar Aluno
app.post('/api/admin/alunos', async (req, res) => {
  const { nome, cpf, email, telefone, plano, valorMensalidade, is_bolsista, data_de_adesao } = req.body;
  
  if (!nome || !cpf) {
    return res.status(400).json({ erro: 'Nome e CPF são obrigatórios.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  if (!cpfLimpo) return res.status(400).json({ erro: 'CPF inválido.' });

  const senhaTemporaria = Math.floor(100000 + Math.random() * 900000).toString();

  let valorFinal = parseFloat(valorMensalidade);
  if (isNaN(valorFinal)) {
    if (plano === '2x na semana') valorFinal = 130.00;
    else if (plano === '3x na semana') valorFinal = 160.00;
    else if (plano === 'Todos os Horários') valorFinal = 280.00;
    else if (plano === 'Diária') valorFinal = 40.00;
    else valorFinal = 160.00;
  }

  const emailSanitizado = email && typeof email === 'string' && email.trim() !== '' ? email.trim().toLowerCase() : null;
  const telefoneSanitizado = telefone && typeof telefone === 'string' ? telefone.trim() : null;
  const flagBolsista = Boolean(is_bolsista);
  const dataAdesao = data_de_adesao ? new Date(data_de_adesao + 'T12:00:00') : new Date();

  try {
    const alunoExistente = await prisma.aluno.findFirst({
      where: {
        OR: [
          { cpf: cpfLimpo },
          ...(emailSanitizado ? [{ email: emailSanitizado }] : [])
        ]
      }
    });

    if (alunoExistente) {
      if (alunoExistente.cpf === cpfLimpo) {
        return res.status(400).json({ erro: `Já existe um aluno cadastrado com este CPF (${cpfLimpo}).` });
      }
      if (emailSanitizado && alunoExistente.email === emailSanitizado) {
        return res.status(400).json({ erro: `Já existe um aluno cadastrado com este E-mail (${emailSanitizado}).` });
      }
    }

    const planoLower = (plano || '').toLowerCase();
    const isDiariaOuConvenio = planoLower.includes('diária') || planoLower.includes('diaria') || planoLower.includes('wellhub') || planoLower.includes('totalpass') || planoLower.includes('gympass');

    const proximoVencimento = calcularProximoVencimentoPorAdesao(dataAdesao, dataAdesao);

    const novoAluno = await prisma.aluno.create({
      data: {
        nome: nome.trim(),
        cpf: cpfLimpo,
        email: emailSanitizado,
        telefone: telefoneSanitizado,
        plano: plano || '2x na semana',
        senha: senhaTemporaria,
        primeiroAcesso: true,
        is_bolsista: flagBolsista,
        data_de_adesao: dataAdesao,
        // Regra Módulo 1: Aluno bolsista não gera fatura mensal automática
        ...(!isDiariaOuConvenio && !flagBolsista ? {
          mensalidades: {
            create: {
              valor: valorFinal,
              dataVencimento: proximoVencimento,
              status: 'PENDENTE'
            }
          }
        } : {})
      }
    });

    res.json({ mensagem: 'Aluno criado com sucesso!', aluno: novoAluno, senhaTemporaria });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ erro: error.message || 'Erro ao criar aluno.' });
  }
});

// Dashboard Geral com Métricas de Presença e Assiduidade
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalAlunos = await prisma.aluno.count();
    const agora = new Date();

    // Regra Módulo 1: Ignorar alunos com is_bolsista == true na contagem de inadimplência
    const inadimplentesCount = await prisma.mensalidade.count({
      where: {
        status: 'ATRASADO',
        dataVencimento: { lt: agora },
        aluno: { is_bolsista: false }
      }
    });

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);

    const inicioHoje = new Date(agora);
    inicioHoje.setHours(0, 0, 0, 0);
    const fimHoje = new Date(agora);
    fimHoje.setHours(23, 59, 59, 999);

    // Início e fim da semana atual (Segunda a Domingo)
    const diaDaSemanaHoje = agora.getDay();
    const diffSegunda = agora.getDate() - (diaDaSemanaHoje === 0 ? 6 : diaDaSemanaHoje - 1);
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(diffSegunda);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    const alunos = await prisma.aluno.findMany({
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 },
        presencas: {
          where: { data: { gte: inicioMes, lte: fimMes } }
        }
      },
      orderBy: { nome: 'asc' }
    });

    let somaPorcentagens = 0;
    let totalMensalistas = 0;
    let alunosEmRiscoCount = 0;

    const alunosFormatados = alunos.map(aluno => {
      const ultimaMensalidade = aluno.mensalidades[0];
      let diasVencimento: number | null = null;
      let statusMensalidade = 'PAGO';

      if (aluno.is_bolsista) {
        statusMensalidade = 'BOLSISTA';
        diasVencimento = null;
      } else if (ultimaMensalidade) {
        statusMensalidade = ultimaMensalidade.status;
        const diferencaTempo = ultimaMensalidade.dataVencimento.getTime() - agora.getTime();
        diasVencimento = Math.ceil(diferencaTempo / (1000 * 3600 * 24));
        if (diasVencimento < 0 && statusMensalidade !== 'PAGO') {
          statusMensalidade = 'ATRASADO';
        }
      }

      const planoLower = (aluno.plano || '').toLowerCase();
      const isDiariaOuConvenio = planoLower.includes('diária') || planoLower.includes('diaria') || planoLower.includes('wellhub') || planoLower.includes('totalpass') || planoLower.includes('gympass');

      // Frequência no mês
      const presencasMes = aluno.presencas.filter(p => p.status === 'PRESENTE').length;
      const doencaMes = aluno.presencas.filter(p => p.status === 'DOENCA' || p.tipoJustificativa === 'DOENCA').length;
      const faltasMes = aluno.presencas.filter(p => p.status === 'FALTA' || p.status === 'AUSENTE').length;
      const treinosSemana = aluno.presencas.filter(p => p.data >= inicioSemana && p.data <= fimSemana && ['PRESENTE', 'DOENCA', 'JUSTIFICADO'].includes(p.status)).length;

      let aulasEsperadas = 8;
      if (planoLower.includes('3x')) aulasEsperadas = 12;
      else if (planoLower.includes('todos') || planoLower.includes('livre')) aulasEsperadas = 20;
      else if (isDiariaOuConvenio) aulasEsperadas = 4;

      let porcentagemPresenca: number | null = null;
      let statusAssiduidade = 'REGULAR';

      if (isDiariaOuConvenio) {
        statusAssiduidade = treinosSemana > 0 ? 'ATIVO_SEMANA' : 'SEM_TREINO_SEMANA';
      } else {
        totalMensalistas++;
        const base = Math.max(aulasEsperadas, aluno.presencas.length || 1);
        porcentagemPresenca = Math.min(100, Math.round(((presencasMes + doencaMes) / base) * 100));
        somaPorcentagens += porcentagemPresenca;

        if (porcentagemPresenca >= 75) {
          statusAssiduidade = 'ALTA';
        } else if (porcentagemPresenca >= 50) {
          statusAssiduidade = 'REGULAR';
        } else {
          statusAssiduidade = 'RISCO';
          alunosEmRiscoCount++;
        }
      }

      return {
        id: aluno.id,
        nome: aluno.nome,
        plano: aluno.plano || '2x na semana',
        cpf: aluno.cpf,
        email: aluno.email,
        telefone: aluno.telefone,
        is_bolsista: aluno.is_bolsista,
        has_signed_contract: aluno.has_signed_contract,
        data_de_adesao: aluno.data_de_adesao,
        contract_signed_at: aluno.contract_signed_at,
        status: aluno.is_bolsista ? 'BOLSISTA' : isDiariaOuConvenio ? 'LIBERADO' : statusMensalidade,
        diasVencimento: (aluno.is_bolsista || isDiariaOuConvenio) ? null : diasVencimento,
        prajied: aluno.prajied,
        modalidade: aluno.modalidade || 'Muay Thai',
        isDiariaOuConvenio,
        presencasMes,
        doencaMes,
        faltasMes,
        treinosSemana,
        aulasEsperadas,
        porcentagemPresenca,
        statusAssiduidade
      };
    });

    const taxaPresencaMedia = totalMensalistas > 0 ? Math.round(somaPorcentagens / totalMensalistas) : 100;
    const presencasHoje = await prisma.agendamentoPresenca.count({
      where: {
        data: { gte: inicioHoje, lte: fimHoje },
        status: 'PRESENTE'
      }
    });

    res.json({
      metricas: {
        totalAlunos,
        assinaturasAtivas: totalAlunos - inadimplentesCount,
        inadimplentes: inadimplentesCount,
        taxaPresencaMedia,
        alunosEmRisco: alunosEmRiscoCount,
        presencasHoje
      },
      alunos: alunosFormatados
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar dados do painel.' });
  }
});

// Atualizar Prajied
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

// Atualizar Dados Gerais do Aluno (Plano, Prajied, Nome, is_bolsista, etc.)
app.patch('/api/admin/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const { plano, prajied, nome, telefone, email, is_bolsista, data_de_adesao } = req.body;
  try {
    const dadosAtualizar: any = {};
    if (plano !== undefined) dadosAtualizar.plano = plano;
    if (prajied !== undefined) dadosAtualizar.prajied = prajied;
    if (nome !== undefined) dadosAtualizar.nome = nome.trim();
    if (telefone !== undefined) dadosAtualizar.telefone = telefone ? telefone.trim() : null;
    if (email !== undefined) dadosAtualizar.email = email ? email.trim().toLowerCase() : null;
    if (is_bolsista !== undefined) dadosAtualizar.is_bolsista = Boolean(is_bolsista);
    if (data_de_adesao !== undefined) dadosAtualizar.data_de_adesao = data_de_adesao ? new Date(data_de_adesao) : null;

    const aluno = await prisma.aluno.update({
      where: { id },
      data: dadosAtualizar
    });
    res.json({ mensagem: 'Aluno atualizado com sucesso!', aluno });
  } catch (error: any) {
    res.status(500).json({ erro: error.message || 'Erro ao atualizar aluno.' });
  }
});

// Registrar pagamento manual com DatePicker (Módulo 5)
app.post('/api/admin/alunos/:id/pagar', async (req, res) => {
  const { id } = req.params;
  const { dataPagamento, valor, metodoPagamento, registradoPor, observacao } = req.body || {};

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: { mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 } }
    });

    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado' });

    // Data escolhida no componente DatePicker (passada ou presente), não forçando new Date() se enviada
    const dataPagamentoEscolhida = dataPagamento
      ? new Date(String(dataPagamento).includes('T') ? dataPagamento : `${dataPagamento}T12:00:00`)
      : new Date();

    let baseCalculoVencimento = dataPagamentoEscolhida;
    if (aluno.mensalidades.length > 0) {
      const ultima = aluno.mensalidades[0];
      if (new Date(ultima.dataVencimento) > dataPagamentoEscolhida) {
        baseCalculoVencimento = new Date(ultima.dataVencimento);
      }
    }

    const novoVencimento = calcularProximoVencimentoPorAdesao(
      baseCalculoVencimento,
      aluno.data_de_adesao
    );

    const valorFinal =
      valor !== undefined && valor !== '' && !isNaN(Number(valor))
        ? Number(valor)
        : aluno.mensalidades[0]?.valor || 160.00;

    const mensalidade = await prisma.mensalidade.create({
      data: {
        alunoId: id,
        valor: valorFinal,
        dataVencimento: novoVencimento,
        dataPagamento: dataPagamentoEscolhida,
        status: 'PAGO'
      }
    });

    // Registra automaticamente no Livro-Caixa Geral (TransacaoFinanceira)
    await prisma.transacaoFinanceira.create({
      data: {
        tipo: 'ENTRADA',
        categoria: 'MENSALIDADE',
        descricao: `Mensalidade (${aluno.plano || 'Plano Regular'}) — ${aluno.nome}`,
        valor: valorFinal,
        data: dataPagamentoEscolhida,
        metodoPagamento: metodoPagamento || 'PIX',
        status: 'CONFIRMADO',
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        registradoPor: registradoPor || 'Administração',
        observacao: observacao || `Renovado até ${novoVencimento.toLocaleDateString('pt-BR')}`
      }
    }).catch(() => {});

    res.json({
      mensagem: `Pagamento registrado com sucesso na data ${dataPagamentoEscolhida.toLocaleDateString('pt-BR')}! Próximo vencimento: ${novoVencimento.toLocaleDateString('pt-BR')}.`,
      mensalidade
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar pagamento manual.' });
  }
});

// Visualizar presenças/check-ins recentes
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

// Atualizar status de presença (PRESENTE, FALTA, DOENCA, JUSTIFICADO)
app.patch('/api/admin/presencas/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, justificativa, tipoJustificativa } = req.body;

  try {
    const presenca = await prisma.agendamentoPresenca.update({
      where: { id },
      data: {
        status,
        justificativa: justificativa !== undefined ? justificativa : undefined,
        tipoJustificativa: tipoJustificativa !== undefined ? tipoJustificativa : undefined
      },
      include: { aluno: true, evento: true }
    });

    const gamificacao = await evaluateStudentGamification(prisma, presenca.alunoId).catch(() => null);
    res.json({ mensagem: 'Status da chamada atualizado!', presenca, gamificacao });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar presença.' });
  }
});

// Marcar presenças em lote (ex: Professor marca todos da lista com 1 clique)
app.post('/api/admin/presencas/marcar-lote', async (req, res) => {
  const { presencaIds, status } = req.body;

  if (!Array.isArray(presencaIds) || presencaIds.length === 0 || !status) {
    return res.status(400).json({ erro: 'Lista de IDs de presenças e status são obrigatórios.' });
  }

  try {
    const atualizados = await prisma.agendamentoPresenca.updateMany({
      where: { id: { in: presencaIds } },
      data: { status }
    });

    const registrosAfetados = await prisma.agendamentoPresenca.findMany({
      where: { id: { in: presencaIds } },
      select: { alunoId: true }
    });
    const alunosUnicos = Array.from(new Set(registrosAfetados.map(r => r.alunoId)));
    for (const aId of alunosUnicos) {
      await evaluateStudentGamification(prisma, aId).catch(() => null);
    }
    res.json({ mensagem: `${atualizados.count} presenças atualizadas com sucesso!`, count: atualizados.count });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar presenças em lote.' });
  }
});

// Calendário Geral da Academia & Frequência Coletiva por Data
app.get('/api/admin/frequencia-geral', async (req, res) => {
  const agora = new Date();
  const mes = parseInt(req.query.mes as string) || (agora.getMonth() + 1);
  const ano = parseInt(req.query.ano as string) || agora.getFullYear();

  try {
    const dataInicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const presencas = await prisma.agendamentoPresenca.findMany({
      where: {
        data: { gte: dataInicioMes, lte: dataFimMes }
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            plano: true,
            prajied: true,
            modalidade: true,
            telefone: true
          }
        },
        evento: {
          select: {
            id: true,
            titulo: true,
            dataInicio: true
          }
        }
      },
      orderBy: { data: 'asc' }
    });

    const mapaDias: Record<string, {
      total: number;
      presentes: number;
      faltas: number;
      doenca: number;
      agendados: number;
      taxaPresenca: number;
      alunos: any[];
    }> = {};

    presencas.forEach(p => {
      const dataIso = new Date(p.data).toISOString().split('T')[0];
      if (!mapaDias[dataIso]) {
        mapaDias[dataIso] = {
          total: 0,
          presentes: 0,
          faltas: 0,
          doenca: 0,
          agendados: 0,
          taxaPresenca: 100,
          alunos: []
        };
      }
      mapaDias[dataIso].total++;
      if (p.status === 'PRESENTE') mapaDias[dataIso].presentes++;
      else if (p.status === 'FALTA' || p.status === 'AUSENTE') mapaDias[dataIso].faltas++;
      else if (p.status === 'DOENCA') mapaDias[dataIso].doenca++;
      else if (p.status === 'AGENDADO') mapaDias[dataIso].agendados++;

      const efetivos = mapaDias[dataIso].presentes + mapaDias[dataIso].doenca;
      const base = mapaDias[dataIso].total || 1;
      mapaDias[dataIso].taxaPresenca = Math.round((efetivos / base) * 100);

      mapaDias[dataIso].alunos.push({
        id: p.id,
        alunoId: p.aluno?.id,
        nome: p.aluno?.nome || 'Aluno',
        plano: p.aluno?.plano || 'Geral',
        prajied: p.aluno?.prajied || 'Branco',
        telefone: p.aluno?.telefone,
        status: p.status,
        tipoJustificativa: p.tipoJustificativa,
        justificativa: p.justificativa,
        horario: p.evento ? new Date(p.evento.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Horário Livre'
      });
    });

    const totalPresentes = presencas.filter(p => p.status === 'PRESENTE').length;
    const totalFaltas = presencas.filter(p => p.status === 'FALTA' || p.status === 'AUSENTE').length;
    const totalDoenca = presencas.filter(p => p.status === 'DOENCA').length;
    const totalRegistros = presencas.length;
    const taxaGeral = totalRegistros > 0 ? Math.round(((totalPresentes + totalDoenca) / totalRegistros) * 100) : 100;

    res.json({
      periodo: { mes, ano },
      resumo: {
        totalPresentes,
        totalFaltas,
        totalDoenca,
        totalRegistros,
        taxaGeral,
        diasComTreino: Object.keys(mapaDias).length
      },
      mapaDias
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao carregar frequência geral.' });
  }
});

// =======================================================
// CALENDÁRIO COM CÁLCULO DETALHADO DE PRESENÇA, FALTA E DOENÇA
// =======================================================
app.get('/api/admin/alunos/:id/calendario', async (req, res) => {
  const { id } = req.params;
  const agora = new Date();
  const mes = parseInt(req.query.mes as string) || (agora.getMonth() + 1);
  const ano = parseInt(req.query.ano as string) || agora.getFullYear();

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        mensalidades: { orderBy: { dataVencimento: 'desc' }, take: 1 }
      }
    });

    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    const dataInicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const presencas = await prisma.agendamentoPresenca.findMany({
      where: {
        alunoId: id,
        data: { gte: dataInicioMes, lte: dataFimMes }
      },
      include: { evento: true },
      orderBy: { data: 'asc' }
    });

    const presencasPorDia: Record<string, any[]> = {};
    presencas.forEach(p => {
      const dataIso = new Date(p.data).toISOString().split('T')[0];
      if (!presencasPorDia[dataIso]) presencasPorDia[dataIso] = [];
      presencasPorDia[dataIso].push(p);
    });

    // Contadores refinados
    const presentesCount = presencas.filter(p => p.status === 'PRESENTE').length;
    const doencaCount = presencas.filter(p => p.status === 'DOENCA' || p.tipoJustificativa === 'DOENCA').length;
    const outrasJustificadasCount = presencas.filter(p => p.status === 'JUSTIFICADO' && p.tipoJustificativa !== 'DOENCA').length;
    const faltasNaoJustificadas = presencas.filter(p => p.status === 'FALTA' || p.status === 'AUSENTE').length;
    const agendadosCount = presencas.filter(p => p.status === 'AGENDADO').length;

    // Frequência esperada & Identificação de Diária/Convênio
    const plano = (aluno.plano || '').toLowerCase();
    const isDiariaOuConvenio = plano.includes('diária') || plano.includes('diaria') || plano.includes('wellhub') || plano.includes('totalpass') || plano.includes('gympass');

    let aulasPorSemana = 2;
    if (plano.includes('3x')) aulasPorSemana = 3;
    else if (plano.includes('todos') || plano.includes('livre')) aulasPorSemana = 5;
    else if (isDiariaOuConvenio) aulasPorSemana = 1;

    const semanasNoMes = 4;
    const aulasEsperadasNoMes = aulasPorSemana * semanasNoMes;

    // Frequência da semana atual (Segunda-feira a Domingo)
    const agoraHoje = new Date();
    const diaDaSemanaHoje = agoraHoje.getDay();
    const diffSegunda = agoraHoje.getDate() - (diaDaSemanaHoje === 0 ? 6 : diaDaSemanaHoje - 1);
    const inicioSemanaAtual = new Date(agoraHoje);
    inicioSemanaAtual.setDate(diffSegunda);
    inicioSemanaAtual.setHours(0, 0, 0, 0);

    const fimSemanaAtual = new Date(inicioSemanaAtual);
    fimSemanaAtual.setDate(fimSemanaAtual.getDate() + 6);
    fimSemanaAtual.setHours(23, 59, 59, 999);

    const presencasSemana = await prisma.agendamentoPresenca.findMany({
      where: {
        alunoId: id,
        data: { gte: inicioSemanaAtual, lte: fimSemanaAtual },
        status: { in: ['PRESENTE', 'DOENCA', 'JUSTIFICADO'] }
      },
      orderBy: { data: 'asc' }
    });

    const nomesDias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const nomesDiasCurto = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const diasFrequentadosNaSemana = presencasSemana.map(p => {
      const d = new Date(p.data);
      return {
        diaSemana: nomesDias[d.getDay()],
        diaSemanaCurto: nomesDiasCurto[d.getDay()],
        dataIso: d.toISOString().split('T')[0],
        dataFormatada: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        status: p.status
      };
    });

    const frequenciaSemanal = {
      totalNaSemana: presencasSemana.length,
      diasFrequentados: diasFrequentadosNaSemana,
      diasFormatadosTexto: diasFrequentadosNaSemana.length > 0 
        ? diasFrequentadosNaSemana.map(d => `${d.diaSemanaCurto} (${d.dataFormatada})`).join(', ') 
        : 'Nenhum treino registrado nesta semana'
    };

    const presencasEfetivas = presentesCount + doencaCount + outrasJustificadasCount;
    
    const baseCalculo = Math.max(aulasEsperadasNoMes, presencas.length || 1);
    const pctPresenca = Math.min(100, Math.round((presentesCount / baseCalculo) * 100));
    const pctDoenca = Math.min(100, Math.round((doencaCount / baseCalculo) * 100));
    const pctFalta = Math.min(100, Math.round((faltasNaoJustificadas / baseCalculo) * 100));
    const pctGeralEfetiva = Math.min(100, Math.round((presencasEfetivas / baseCalculo) * 100));

    const ultimaMensalidade = aluno.mensalidades[0];
    let diasParaVencer: number | null = null;
    let statusMensalidade = aluno.is_bolsista ? 'BOLSISTA' : isDiariaOuConvenio ? 'LIBERADO' : 'PAGO';

    if (!aluno.is_bolsista && !isDiariaOuConvenio && ultimaMensalidade) {
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
        prajied: aluno.prajied,
        is_bolsista: aluno.is_bolsista,
        has_signed_contract: aluno.has_signed_contract,
        data_de_adesao: aluno.data_de_adesao,
        contract_signed_at: aluno.contract_signed_at,
        contract_signature_payload: aluno.contract_signature_payload,
        isDiariaOuConvenio,
        tipoCobranca: aluno.is_bolsista ? 'BOLSISTA' : isDiariaOuConvenio ? 'DIARIA_CONVENIO' : 'MENSALIDADE'
      },
      periodo: { mes, ano },
      estatisticas: {
        isDiariaOuConvenio,
        frequenciaSemanal,
        aulasPorSemana,
        aulasEsperadasNoMes,
        presentes: presentesCount,
        doenca: doencaCount,
        justificadas: outrasJustificadasCount,
        faltasNaoJustificadas,
        agendadasPendentes: agendadosCount,
        presencasEfetivas,
        porcentagemPresenca: pctPresenca,
        porcentagemDoenca: pctDoenca,
        porcentagemFalta: pctFalta,
        porcentagemGeral: pctGeralEfetiva
      },
      mensalidade: {
        isDiariaOuConvenio,
        is_bolsista: aluno.is_bolsista,
        tipoCobranca: aluno.is_bolsista ? 'BOLSISTA' : isDiariaOuConvenio ? 'DIARIA_CONVENIO' : 'MENSALIDADE',
        status: aluno.is_bolsista ? 'BOLSISTA' : isDiariaOuConvenio ? 'LIBERADO' : statusMensalidade,
        diasParaVencer: (aluno.is_bolsista || isDiariaOuConvenio) ? null : diasParaVencer,
        dataVencimento: (aluno.is_bolsista || isDiariaOuConvenio) ? null : (ultimaMensalidade?.dataVencimento || null),
        valor: aluno.is_bolsista ? 0.00 : isDiariaOuConvenio ? 40.00 : (ultimaMensalidade?.valor || 160.00)
      },
      presencas,
      presencasPorDia
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao carregar frequência do aluno.' });
  }
});

// Admin adiciona ou altera presença no calendário
app.post('/api/admin/alunos/:id/presenca', async (req, res) => {
  const { id } = req.params;
  const { data, status, justificativa, tipoJustificativa, eventoId } = req.body;

  if (!data || !status) {
    return res.status(400).json({ erro: 'Data e status são obrigatórios.' });
  }

  try {
    const dataAlvo = new Date(data);
    const inicioDia = new Date(dataAlvo);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAlvo);
    fimDia.setHours(23, 59, 59, 999);

    let registro = await prisma.agendamentoPresenca.findFirst({
      where: {
        alunoId: id,
        data: { gte: inicioDia, lte: fimDia }
      }
    });

    if (registro) {
      registro = await prisma.agendamentoPresenca.update({
        where: { id: registro.id },
        data: {
          status,
          justificativa: justificativa || null,
          tipoJustificativa: tipoJustificativa || null,
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
          tipoJustificativa: tipoJustificativa || null,
          eventoId: eventoId || null
        }
      });
    }

    const gamificacao = await evaluateStudentGamification(prisma, id).catch(() => null);
    res.json({ mensagem: 'Frequência atualizada com sucesso!', registro, gamificacao });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar frequência.' });
  }
});

// Admin remove registro de presença
app.delete('/api/admin/alunos/:id/presenca', async (req, res) => {
  const { id } = req.params;
  const { presencaId, data } = req.body;

  try {
    if (presencaId) {
      await prisma.agendamentoPresenca.delete({ where: { id: presencaId } });
    } else if (data) {
      const dataAlvo = new Date(data);
      const inicioDia = new Date(dataAlvo);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataAlvo);
      fimDia.setHours(23, 59, 59, 999);

      await prisma.agendamentoPresenca.deleteMany({
        where: {
          alunoId: id,
          data: { gte: inicioDia, lte: fimDia }
        }
      });
    }

    res.json({ mensagem: 'Registro removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover registro.' });
  }
});

// ==========================================
// AULAS EXPERIMENTAIS & LEADS
// ==========================================

// Criar Agendamento Experimental
app.post('/api/agendamentos', async (req, res) => {
  const { nome, telefone, data, horario, professorNome } = req.body;
  try {
    const agendamento = await prisma.agendamentoExperimental.create({
      data: {
        nome,
        telefone,
        data,
        horario,
        professorNome: professorNome || 'Felipe Borü',
        status: 'PENDENTE'
      }
    });
    res.json({ mensagem: 'Aula experimental agendada!', agendamento });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao agendar aula.' });
  }
});

// Listar agendamentos
app.get('/api/admin/agendamentos', async (req, res) => {
  try {
    const todos = await prisma.agendamentoExperimental.findMany({
      orderBy: { criadoEm: 'desc' }
    });

    const agora = new Date();
    const pendentes = todos.filter(a => a.status === 'PENDENTE');
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
      .sort((a, b) => b.diasDesdeAula - a.diasDesdeAula);

    const finalizados = todos.filter(a => a.status === 'FECHOU_CONTRATO' || a.status === 'DESISTIU');

    res.json({ pendentes, posAula, finalizados, todos });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// Atualizar status de aula experimental
app.patch('/api/admin/agendamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { status, observacao, dataRealizada, professorNome } = req.body;

  try {
    const dataUpdate: any = {};
    if (status) dataUpdate.status = status;
    if (observacao !== undefined) dataUpdate.observacao = observacao;
    if (professorNome !== undefined) dataUpdate.professorNome = professorNome;
    if (status === 'REALIZADA') {
      dataUpdate.dataRealizada = dataRealizada ? new Date(dataRealizada) : new Date();
    } else if (dataRealizada) {
      dataUpdate.dataRealizada = new Date(dataRealizada);
    }

    const agendamento = await prisma.agendamentoExperimental.update({
      where: { id },
      data: dataUpdate
    });

    res.json({ mensagem: 'Agendamento atualizado!', agendamento });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar agendamento.' });
  }
});

// Converter experimental em Aluno Matriculado
app.post('/api/admin/agendamentos/:id/converter', async (req, res) => {
  const { id } = req.params;
  const { plano, valorMensalidade, cpf, email, is_bolsista } = req.body;

  try {
    const agendamento = await prisma.agendamentoExperimental.findUnique({ where: { id } });
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

    const cpfFinal = cpf ? cpf.replace(/[^\d]+/g, '') : Math.floor(10000000000 + Math.random() * 90000000000).toString();
    const senhaTemporaria = Math.floor(100000 + Math.random() * 900000).toString();
    const flagBolsista = Boolean(is_bolsista);
    const agora = new Date();

    const novoAluno = await prisma.aluno.create({
      data: {
        nome: agendamento.nome,
        telefone: agendamento.telefone,
        cpf: cpfFinal,
        email: email || null,
        plano: plano || '2x na semana',
        senha: senhaTemporaria,
        primeiroAcesso: true,
        is_bolsista: flagBolsista,
        data_de_adesao: agora,
        ...(!flagBolsista ? {
          mensalidades: {
            create: {
              valor: parseFloat(valorMensalidade) || 160.00,
              dataVencimento: calcularProximoVencimentoPorAdesao(agora, agora),
              status: 'PENDENTE'
            }
          }
        } : {})
      }
    });

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
    res.status(500).json({ erro: 'Erro ao converter lead em aluno.' });
  }
});

// ==========================================
// CHECKOUT PÚBLICO (PAGAMENTO PRESENCIAL)
// ==========================================

// Pré-matrícula pública via Checkout (Pagamento presencial na recepção)
app.post('/api/checkout', async (req, res) => {
  const { nome, cpf, email, telefone, senha, plano, valor } = req.body;
  if (!nome || !cpf || !senha) {
    return res.status(400).json({ erro: 'Nome, CPF e senha são obrigatórios.' });
  }

  const cpfLimpo = cpf.replace(/[^\d]+/g, '');
  const agora = new Date();
  
  try {
    const novoAluno = await prisma.aluno.create({
      data: {
        nome: nome.trim(),
        cpf: cpfLimpo,
        email: email ? email.trim().toLowerCase() : null,
        telefone: telefone ? telefone.trim() : null,
        senha: senha.trim(),
        primeiroAcesso: false,
        plano: plano || '2x na semana',
        data_de_adesao: agora,
        mensalidades: {
          create: {
            valor: parseFloat(valor) || 160,
            dataVencimento: calcularProximoVencimentoPorAdesao(agora, agora),
            status: 'PENDENTE' // Pagamento é feito presencialmente no balcão
          }
        }
      }
    });

    res.json({ 
      mensagem: 'Cadastro realizado com sucesso! Para confirmar sua matrícula, realize o pagamento da 1ª mensalidade presencialmente na recepção da academia.', 
      aluno: novoAluno 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Já existe um aluno com este CPF ou E-mail.' });
    }
    res.status(500).json({ erro: 'Erro ao processar cadastro.' });
  }
});

// Healthcheck & Fallback API
app.get('/', (req, res) => {
  res.json({ status: 'online', service: 'Borü Centro de Combate API', version: '2.0.0' });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).json({ status: 'online', service: 'Borü Centro de Combate API' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server Borü API rodando em http://localhost:${PORT}`);
});

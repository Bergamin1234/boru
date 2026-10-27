import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ensureGamificationSeeded } from '../src/gamificationService';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Limpando todos os dados de teste do banco de dados...');
  await prisma.userAchievementProgress.deleteMany();
  await prisma.agendamentoPresenca.deleteMany();
  await prisma.eventoDeAula.deleteMany();
  await prisma.mensalidade.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.agendamentoExperimental.deleteMany();
  await prisma.aviso.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('Criando exclusivamente o usuário Administrador Oficial (BrgAdmin)...');
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador Master',
      email: 'brgadmin@boru.com',
      senha: 'BoruCentroDeCombate98490@!',
      cargo: 'ADMIN',
      telefone: '(69) 99238-4491',
      prajied: 'Prajied Preto',
      ativo: true
    }
  });

  console.log('Garantindo estrutura padrão da Trilha do Nak Muay (Ranks e Conquistas)...');
  await ensureGamificationSeeded(prisma, false);

  const resumo = {
    usuarios: await prisma.usuario.count(),
    alunos: await prisma.aluno.count(),
    mensalidades: await prisma.mensalidade.count(),
    presencas: await prisma.agendamentoPresenca.count(),
    eventosDeAula: await prisma.eventoDeAula.count(),
    agendamentosExperimentais: await prisma.agendamentoExperimental.count(),
    avisos: await prisma.aviso.count(),
    produtos: await prisma.produto.count(),
    progressoConquistas: await prisma.userAchievementProgress.count(),
    gamificationRanks: await prisma.gamificationRank.count(),
    gamificationAchievements: await prisma.gamificationAchievement.count()
  };

  console.log('✅ Banco de dados limpo e pronto para produção!');
  console.log('👤 Usuário Admin:', { nome: admin.nome, login: 'BrgAdmin', email: admin.email, cargo: admin.cargo });
  console.log('📊 Contagem atual das tabelas:', resumo);
}

main()
  .catch((e) => {
    console.error('Erro ao preparar banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

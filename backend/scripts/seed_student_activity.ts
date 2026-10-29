import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('--- Iniciando ajuste e cadastro de alunos Ativos e Inativos (2-3 semanas sem treinar) ---');

  const agora = new Date();

  // 1. Garantir os 2 alunos de demonstração clássicos especificados:
  // Aluno Inativo 1: Lucas "Pedra" Silveira (ausente há 17 dias = ~2 semanas e meia)
  let alunoInativo1 = await prisma.aluno.findFirst({
    where: { nome: { contains: 'Lucas' } }
  });
  if (!alunoInativo1) {
    alunoInativo1 = await prisma.aluno.create({
      data: {
        nome: 'Lucas "Pedra" Silveira',
        email: 'lucas.pedra@ctboru.com.br',
        telefone: '(69) 99811-2233',
        cpf: '111.222.333-44',
        plano: '3x na semana',
        modalidade: 'Muay Thai',
        prajied: 'Vermelho e Azul',
        data_de_adesao: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Aluno Inativo 2: Mariana "Tigresa" Costa (ausente há 21 dias = 3 semanas)
  let alunoInativo2 = await prisma.aluno.findFirst({
    where: { nome: { contains: 'Mariana' } }
  });
  if (!alunoInativo2) {
    alunoInativo2 = await prisma.aluno.create({
      data: {
        nome: 'Mariana "Tigresa" Costa',
        email: 'mariana.costa@ctboru.com.br',
        telefone: '(69) 99744-5566',
        cpf: '555.666.777-88',
        plano: '2x na semana',
        modalidade: 'Muay Thai',
        prajied: 'Vermelho',
        data_de_adesao: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      }
    });
  }

  // Limpar e registrar presenças específicas para os dois alunos inativos
  await prisma.agendamentoPresenca.deleteMany({
    where: { alunoId: { in: [alunoInativo1.id, alunoInativo2.id] } }
  });

  // Lucas treinou há 17 dias (2.5 semanas)
  const dataLucasUltimoTreino = new Date(agora.getTime() - 17 * 24 * 60 * 60 * 1000);
  dataLucasUltimoTreino.setHours(19, 0, 0, 0);
  await prisma.agendamentoPresenca.create({
    data: {
      alunoId: alunoInativo1.id,
      status: 'PRESENTE',
      data: dataLucasUltimoTreino,
      shift: 'NOITE'
    }
  });

  // Mariana treinou há 21 dias (exatas 3 semanas)
  const dataMarianaUltimoTreino = new Date(agora.getTime() - 21 * 24 * 60 * 60 * 1000);
  dataMarianaUltimoTreino.setHours(18, 0, 0, 0);
  await prisma.agendamentoPresenca.create({
    data: {
      alunoId: alunoInativo2.id,
      status: 'PRESENTE',
      data: dataMarianaUltimoTreino,
      shift: 'NOITE'
    }
  });

  // Para os demais alunos da base:
  // Se não tiverem presenças cadastradas, distribuir entre Ativos (treinaram nos últimos 1-5 dias)
  // e alguns Inativos (treinaram há 15-22 dias).
  const todosAlunos = await prisma.aluno.findMany({
    where: {
      id: { notIn: [alunoInativo1.id, alunoInativo2.id] }
    },
    take: 40
  });

  console.log(`Atualizando amostra de ${todosAlunos.length} alunos com presenças realistas...`);
  for (let i = 0; i < todosAlunos.length; i++) {
    const a = todosAlunos[i];
    const presencasCount = await prisma.agendamentoPresenca.count({ where: { alunoId: a.id } });
    if (presencasCount === 0) {
      // 80% ativos, 20% inativos (2 a 3 semanas)
      const isInativo = (i % 5 === 0);
      const diasAtras = isInativo ? (15 + (i % 7)) : (1 + (i % 5));
      const dataTreino = new Date(agora.getTime() - diasAtras * 24 * 60 * 60 * 1000);
      dataTreino.setHours(19, 0, 0, 0);

      await prisma.agendamentoPresenca.create({
        data: {
          alunoId: a.id,
          status: 'PRESENTE',
          data: dataTreino,
          shift: 'NOITE'
        }
      });
    }
  }

  console.log('✅ Base configurada com sucesso!');
  console.log(`- Aluno Inativo 1: ${alunoInativo1.nome} (último treino há 17 dias)`);
  console.log(`- Aluno Inativo 2: ${alunoInativo2.nome} (último treino há 21 dias)`);
}

main()
  .catch((e) => {
    console.error('Erro ao ajustar alunos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

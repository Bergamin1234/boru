import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando dados antigos...');
  await prisma.agendamentoPresenca.deleteMany();
  await prisma.eventoDeAula.deleteMany();
  await prisma.mensalidade.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.agendamentoExperimental.deleteMany();

  console.log('Criando grade de horários de Muay Thai - Prof. Felipe Borü...');
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const eventosCriados = [];
  
  // Grade fixa: dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
  const gradeHorarios: Record<number, Array<{h: number, m: number, pub: string}>> = {
    1: [ // Segunda
      {h: 16, m: 0, pub: 'ADULTOS'}, {h: 18, m: 0, pub: 'KIDS'}, {h: 19, m: 0, pub: 'ADULTOS'}, {h: 20, m: 0, pub: 'ADULTOS'}
    ],
    2: [ // Terça
      {h: 15, m: 0, pub: 'ADULTOS'}, {h: 19, m: 0, pub: 'ADULTOS'}, {h: 20, m: 0, pub: 'ADULTOS'}, {h: 22, m: 30, pub: 'ADULTOS'}
    ],
    3: [ // Quarta
      {h: 16, m: 0, pub: 'ADULTOS'}, {h: 18, m: 0, pub: 'KIDS'}, {h: 19, m: 0, pub: 'ADULTOS'}, {h: 20, m: 0, pub: 'ADULTOS'}
    ],
    4: [ // Quinta
      {h: 15, m: 0, pub: 'ADULTOS'}, {h: 19, m: 0, pub: 'ADULTOS'}, {h: 20, m: 0, pub: 'ADULTOS'}, {h: 22, m: 30, pub: 'ADULTOS'}
    ],
    5: [ // Sexta
      {h: 16, m: 0, pub: 'ADULTOS'}, {h: 18, m: 0, pub: 'KIDS'}, {h: 19, m: 0, pub: 'ADULTOS'}, {h: 20, m: 0, pub: 'ADULTOS'}
    ],
    6: [ // Sábado
      {h: 8, m: 0, pub: 'ADULTOS'}, {h: 12, m: 30, pub: 'ADULTOS'}
    ]
  };

  // Gerar para 15 dias a partir de hoje
  for (let i = 0; i < 15; i++) {
    const dataAtual = new Date(hoje);
    dataAtual.setDate(hoje.getDate() + i);
    const diaDaSemana = dataAtual.getDay();

    if (gradeHorarios[diaDaSemana]) {
      const aulasDoDia = gradeHorarios[diaDaSemana];
      for (const aula of aulasDoDia) {
        const dataInicio = new Date(dataAtual);
        dataInicio.setHours(aula.h, aula.m, 0, 0);
        
        const dataFim = new Date(dataInicio);
        dataFim.setHours(aula.h + 1, aula.m, 0, 0);

        const evento = await prisma.eventoDeAula.create({
          data: {
            titulo: `Muay Thai (${aula.pub}) - Prof. Felipe Borü`,
            dataInicio,
            dataFim,
          }
        });
        eventosCriados.push(evento);
      }
    }
  }
  
  console.log('Criando alunos e mensalidades de teste...');
  
  const aluno1 = await prisma.aluno.create({
    data: {
      nome: 'João Pedro',
      cpf: '00000000000',
      telefone: '(69) 99311-2233',
      plano: '2x na semana',
      prajied: 'Branco e Vermelho',
      mensalidades: {
        create: {
          valor: 130.00,
          dataVencimento: new Date(hoje.getTime() + 12 * 24 * 60 * 60 * 1000), // Vence em 12 dias
          status: 'PAGO'
        }
      }
    }
  });

  const aluno2 = await prisma.aluno.create({
    data: {
      nome: 'Maria Silva',
      cpf: '12345678909',
      telefone: '(69) 98455-6677',
      plano: 'Todos os Horários',
      prajied: 'Azul Claro',
      mensalidades: {
        create: {
          valor: 280.00,
          dataVencimento: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000), // Atrasado 3 dias
          status: 'ATRASADO'
        }
      }
    }
  });

  const aluno3 = await prisma.aluno.create({
    data: {
      nome: 'Carlos Eduardo',
      cpf: '11122233344',
      telefone: '(69) 99122-3344',
      plano: '3x na semana',
      prajied: 'Vermelho',
      mensalidades: {
        create: {
          valor: 160.00,
          dataVencimento: new Date(hoje.getTime() + 5 * 24 * 60 * 60 * 1000),
          status: 'PAGO'
        }
      }
    }
  });

  console.log('Registrando presenças no calendário...');

  // Presenças no mês para João Pedro (Plano 2x na semana -> meta 8 aulas)
  // 5 presenças passadas + 1 falta justificada + 1 checkin pendente para hoje/próxima aula
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  // Dias passados do mês atual
  const diasPassados = [2, 5, 9, 12, 16];
  for (const dia of diasPassados) {
    const dataPresenca = new Date(anoAtual, mesAtual, dia, 19, 0, 0);
    await prisma.agendamentoPresenca.create({
      data: {
        alunoId: aluno1.id,
        data: dataPresenca,
        status: 'PRESENTE'
      }
    });
  }

  // Falta justificada (Comando 5)
  await prisma.agendamentoPresenca.create({
    data: {
      alunoId: aluno1.id,
      data: new Date(anoAtual, mesAtual, 19, 19, 0, 0),
      status: 'JUSTIFICADO',
      justificativa: 'Atestado médico - Consulta de rotina'
    }
  });

  // Check-in pendente de confirmação do professor (Comando 4)
  if (eventosCriados.length > 0) {
    await prisma.agendamentoPresenca.create({
      data: {
        alunoId: aluno1.id,
        eventoId: eventosCriados[0].id,
        data: eventosCriados[0].dataInicio,
        status: 'AGENDADO'
      }
    });

    await prisma.agendamentoPresenca.create({
      data: {
        alunoId: aluno3.id,
        eventoId: eventosCriados[0].id,
        data: eventosCriados[0].dataInicio,
        status: 'AGENDADO'
      }
    });
  }

  console.log('Criando leads de aulas experimentais (Comando 3)...');

  // Lead 1: Agendamento pendente (ainda não fez a aula)
  await prisma.agendamentoExperimental.create({
    data: {
      nome: 'Rafael Mendonça',
      telefone: '69992345678',
      data: 'Segunda-feira',
      horario: '19:00',
      status: 'PENDENTE'
    }
  });

  // Lead 2: Pós-Aula Experimental (Fez aula há 2 dias, aguardando fechar contrato)
  const doisDiasAtras = new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000);
  await prisma.agendamentoExperimental.create({
    data: {
      nome: 'Bruna Oliveira',
      telefone: '69981123456',
      data: 'Quarta-feira',
      horario: '18:00 (KIDS)',
      status: 'REALIZADA',
      dataRealizada: doisDiasAtras,
      observacao: 'Gostou bastante do treino. Ficou de conversar com os pais para fechar plano 3x.'
    }
  });

  // Lead 3: Pós-Aula Experimental (Fez aula há 5 dias - Follow-up urgente)
  const cincoDiasAtras = new Date(hoje.getTime() - 5 * 24 * 60 * 60 * 1000);
  await prisma.agendamentoExperimental.create({
    data: {
      nome: 'Gabriel Pires',
      telefone: '69993334455',
      data: 'Terça-feira',
      horario: '20:00',
      status: 'REALIZADA',
      dataRealizada: cincoDiasAtras,
      observacao: 'Interessado no plano Todos os Horários. Mandar mensagem convidando para fechar.'
    }
  });

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

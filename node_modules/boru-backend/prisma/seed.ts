import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando dados antigos...');
  await prisma.agendamentoPresenca.deleteMany();
  await prisma.eventoDeAula.deleteMany();
  await prisma.mensalidade.deleteMany();
  await prisma.aluno.deleteMany();

  console.log('Criando grade de horários de Muay Thai - Prof. Felipe Borü...');
  
  // Vamos gerar a grade para os próximos 15 dias a partir de hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const eventos = [];
  
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
        
        // Assumindo duração de 1h por padrão
        const dataFim = new Date(dataInicio);
        dataFim.setHours(aula.h + 1, aula.m, 0, 0);

        eventos.push({
          titulo: `Muay Thai (${aula.pub}) - Prof. Felipe Borü`,
          dataInicio,
          dataFim,
        });
      }
    }
  }

  await prisma.eventoDeAula.createMany({
    data: eventos,
  });

  console.log(`Seed executado com sucesso! ${eventos.length} aulas criadas para os próximos 15 dias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { evaluateStudentGamification } from './gamificationService';

// Grade horária padrão oficial do CT Borü
const GRADE_HORARIOS_SEMANA = [
  { horario: '07:00', horaFim: '08:00', titulo: 'Muay Thai Matutino', professor: 'Felipe Borü', modalidade: 'Muay Thai', capacidade: 25 },
  { horario: '08:30', horaFim: '09:30', titulo: 'Muay Thai & Boxe', professor: 'Felipe Borü', modalidade: 'Muay Thai / Boxe', capacidade: 25 },
  { horario: '12:00', horaFim: '13:00', titulo: 'Muay Thai Almoço', professor: 'Felipe Borü', modalidade: 'Muay Thai', capacidade: 20 },
  { horario: '16:00', horaFim: '17:00', titulo: 'Muay Thai Tarde (16h)', professor: 'Felipe Borü', modalidade: 'Muay Thai', capacidade: 25 },
  { horario: '17:00', horaFim: '18:00', titulo: 'Iniciantes & Kids', professor: 'Felipe Borü', modalidade: 'Iniciantes', capacidade: 25 },
  { horario: '18:00', horaFim: '19:30', titulo: 'Muay Thai Noite (18h)', professor: 'Felipe Borü', modalidade: 'Muay Thai', capacidade: 30 },
  { horario: '19:30', horaFim: '20:30', titulo: 'Muay Thai & Kickboxing', professor: 'Felipe Borü', modalidade: 'Kickboxing', capacidade: 25 },
  { horario: '20:00', horaFim: '21:30', titulo: 'Sparring & Competição (20h)', professor: 'Felipe Borü', modalidade: 'Sparring Avançado', capacidade: 30 },
];

const GRADE_HORARIOS_SABADO = [
  { horario: '09:00', horaFim: '10:30', titulo: 'Aulão Geral & Sparring', professor: 'Felipe Borü', modalidade: 'Muay Thai Geral', capacidade: 35 },
  { horario: '10:30', horaFim: '12:00', titulo: 'Sparring Livre & Treino Técnico', professor: 'Felipe Borü', modalidade: 'Treino Livre', capacidade: 30 },
];

export async function ensureMonthClassesCreated(prisma: PrismaClient, ano: number, mes: number) {
  try {
    const dataInicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const dataFimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const count = await prisma.eventoDeAula.count({
      where: {
        dataInicio: { gte: dataInicioMes, lte: dataFimMes }
      }
    });

    // Se já existirem aulas criadas para este mês, não duplica
    if (count > 0) return;

    const diasNoMes = new Date(ano, mes, 0).getDate();
    const eventosParaCriar: any[] = [];

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataDia = new Date(ano, mes - 1, dia);
      const diaDaSemana = dataDia.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sab

      // Domingo não tem aulas regulares
      if (diaDaSemana === 0) continue;

      const grade = diaDaSemana === 6 ? GRADE_HORARIOS_SABADO : GRADE_HORARIOS_SEMANA;

      for (const item of grade) {
        const [horaInicio, minInicio] = item.horario.split(':').map(Number);
        const [horaFim, minFim] = item.horaFim.split(':').map(Number);

        const dInicio = new Date(ano, mes - 1, dia, horaInicio, minInicio, 0, 0);
        const dFim = new Date(ano, mes - 1, dia, horaFim, minFim, 0, 0);

        eventosParaCriar.push({
          titulo: `${item.titulo} - ${item.professor}`,
          dataInicio: dInicio,
          dataFim: dFim,
          cancelada: false,
          professorNome: item.professor,
          modalidade: item.modalidade,
          capacidade: item.capacidade
        });
      }
    }

    if (eventosParaCriar.length > 0) {
      await prisma.eventoDeAula.createMany({
        data: eventosParaCriar
      });
      console.log(`✅ ${eventosParaCriar.length} aulas geradas para ${mes}/${ano} no CT Borü`);
    }
  } catch (error) {
    console.error('Erro ao auto-gerar aulas do mês:', error);
  }
}

export function registerClassScheduleRoutes(app: Express, prisma: PrismaClient) {
  // ========================================================
  // 1. CALENDÁRIO COMPLETO COM TODAS AS AULAS DO MÊS
  // ========================================================
  app.get('/api/calendario/aulas-mes', async (req: Request, res: Response) => {
    const agora = new Date();
    const mes = parseInt(req.query.mes as string) || (agora.getMonth() + 1);
    const ano = parseInt(req.query.ano as string) || agora.getFullYear();
    const alunoId = req.query.alunoId as string;

    try {
      // Garante que o mês tenha suas turmas populadas
      await ensureMonthClassesCreated(prisma, ano, mes);

      const dataInicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
      const dataFimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

      // Busca todos os eventos do mês
      const eventos = await prisma.eventoDeAula.findMany({
        where: {
          dataInicio: { gte: dataInicioMes, lte: dataFimMes }
        },
        include: {
          agendamentos: {
            include: {
              aluno: {
                select: { id: true, nome: true, prajied: true, telefone: true, plano: true }
              }
            }
          }
        },
        orderBy: { dataInicio: 'asc' }
      });

      // Busca agendamentos experimentais (leads) do mês
      const experimentais = await prisma.agendamentoExperimental.findMany({
        orderBy: { criadoEm: 'desc' }
      });

      // Agrupa por data (YYYY-MM-DD)
      const mapaPorDia: Record<string, any[]> = {};
      const diasNoMes = new Date(ano, mes, 0).getDate();

      for (let d = 1; d <= diasNoMes; d++) {
        const dataIso = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        mapaPorDia[dataIso] = [];
      }

      eventos.forEach(ev => {
        const d = new Date(ev.dataInicio);
        const dataIso = d.toISOString().split('T')[0];
        const horaStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const horaCurta = `${d.getHours()}h`;
        const profCurto = ev.professorNome ? ev.professorNome.split(' ')[0] : 'Felipe';
        const horarioFormatado = `${horaCurta} ${profCurto}`;

        // Alunos agendados / presentes
        const alunosValidos = ev.agendamentos.filter(a => a.status === 'AGENDADO' || a.status === 'PRESENTE');
        const totalAgendados = alunosValidos.length;

        // Aulas experimentais correspondentes à data e hora
        const leadsDoHorario = experimentais.filter(exp => {
          if (!exp.data) return false;
          const matchData = exp.data.includes(dataIso) || exp.data.includes(`${String(d.getDate()).padStart(2, '0')}/${String(mes).padStart(2, '0')}`);
          const matchHora = exp.horario ? exp.horario.includes(horaStr) || exp.horario.includes(horaCurta) : false;
          return matchData && matchHora;
        });

        const capacidade = ev.capacidade || 25;
        const lotado = totalAgendados >= capacidade;
        const haVagas = !lotado && !ev.cancelada;

        // Checkin específico deste aluno
        const meuCheckin = alunoId ? ev.agendamentos.find(a => a.alunoId === alunoId) : null;

        const aulaFormatada = {
          id: ev.id,
          dataIso,
          dia: d.getDate(),
          horario: horaStr,
          horarioCurto: horaCurta,
          horarioFormatado, // Ex: "16h Felipe" (como no desenho do guardanapo!)
          titulo: ev.titulo,
          professorNome: ev.professorNome || 'Felipe Borü',
          modalidade: ev.modalidade || 'Muay Thai',
          cancelada: ev.cancelada, // Se true, o frontend risca o horário!
          motivoCancelamento: ev.motivoCancelamento,
          capacidade,
          totalAgendados,
          totalAulasExp: leadsDoHorario.length,
          haVagas,
          lotado,
          meuCheckin: meuCheckin ? {
            id: meuCheckin.id,
            status: meuCheckin.status, // AGENDADO, PRESENTE, FALTA, DOENCA
            data: meuCheckin.data
          } : null,
          alunosAgendados: alunosValidos.map(a => ({
            id: a.aluno.id,
            nome: a.aluno.nome,
            prajied: a.aluno.prajied,
            telefone: a.aluno.telefone,
            status: a.status,
            presencaId: a.id
          })),
          leadsExp: leadsDoHorario.map(l => ({
            id: l.id,
            nome: l.nome,
            telefone: l.telefone,
            status: l.status
          }))
        };

        if (mapaPorDia[dataIso]) {
          mapaPorDia[dataIso].push(aulaFormatada);
        }
      });

      res.json({
        mes,
        ano,
        diasNoMes,
        aulasPorDia: mapaPorDia
      });
    } catch (error) {
      console.error('Erro ao consultar calendário de aulas:', error);
      res.status(500).json({ erro: 'Erro ao compilar calendário de aulas.' });
    }
  });

  // ========================================================
  // 1.1 AULAS DE HOJE (PARA CHECK-IN EXPRESSO E AÇÃO RÁPIDA)
  // ========================================================
  app.get('/api/aulas/hoje', async (req: Request, res: Response) => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;
    const dia = agora.getDate();
    const alunoId = req.query.alunoId as string;

    try {
      await ensureMonthClassesCreated(prisma, ano, mes);

      const inicioDia = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

      const eventos = await prisma.eventoDeAula.findMany({
        where: {
          dataInicio: { gte: inicioDia, lte: fimDia }
        },
        include: {
          agendamentos: {
            where: {
              status: { in: ['AGENDADO', 'PRESENTE'] }
            }
          }
        },
        orderBy: { dataInicio: 'asc' }
      });

      const aulasFormatadas = eventos.map(ev => {
        const d = new Date(ev.dataInicio);
        const horaStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const horaCurta = `${d.getHours()}h`;
        const profCurto = ev.professorNome ? ev.professorNome.split(' ')[0] : 'Felipe';
        const horarioFormatado = `${horaCurta} ${profCurto}`;

        const totalAgendados = ev.agendamentos.length;
        const capacidade = ev.capacidade || 25;
        const lotado = totalAgendados >= capacidade;
        const haVagas = !lotado && !ev.cancelada;

        const meuCheckin = alunoId ? ev.agendamentos.find(a => a.alunoId === alunoId) : null;

        return {
          id: ev.id,
          horario: horaStr,
          horarioCurto: horaCurta,
          horarioFormatado,
          titulo: ev.titulo,
          professorNome: ev.professorNome || 'Felipe Borü',
          modalidade: ev.modalidade || 'Muay Thai',
          cancelada: ev.cancelada,
          motivoCancelamento: ev.motivoCancelamento,
          capacidade,
          totalAgendados,
          haVagas,
          lotado,
          meuCheckin: meuCheckin ? {
            id: meuCheckin.id,
            status: meuCheckin.status,
            data: meuCheckin.data
          } : null
        };
      });

      res.json({
        dataIso: agora.toISOString().split('T')[0],
        aulas: aulasFormatadas
      });
    } catch (error) {
      console.error('Erro ao buscar aulas de hoje:', error);
      res.status(500).json({ erro: 'Erro ao buscar aulas de hoje.' });
    }
  });


  // ========================================================
  // 2. CHECK-IN COM ESCOLHA DE HORÁRIO ESPECÍFICO
  // ========================================================
  app.post('/api/checkin/horario', async (req: Request, res: Response) => {
    const { alunoId, eventoId, shift } = req.body;

    if (!alunoId || !eventoId) {
      return res.status(400).json({ erro: 'Aluno e Aula são obrigatórios para o check-in.' });
    }

    try {
      const evento = await prisma.eventoDeAula.findUnique({
        where: { id: eventoId },
        include: { agendamentos: true }
      });

      if (!evento) {
        return res.status(404).json({ erro: 'Aula não encontrada.' });
      }

      if (evento.cancelada) {
        return res.status(400).json({
          erro: `Esta aula foi cancelada pelo professor${evento.motivoCancelamento ? ` (${evento.motivoCancelamento})` : ''}. Escolha outro horário!`
        });
      }

      // Verifica lotação
      const agendadosAtuais = evento.agendamentos.filter(a => a.status === 'AGENDADO' || a.status === 'PRESENTE').length;
      if (agendadosAtuais >= (evento.capacidade || 25)) {
        return res.status(400).json({ erro: 'Esta turma já atingiu a capacidade máxima (Lotado)! Escolha outro horário.' });
      }

      // Verifica se o aluno já realizou check-in nesta aula
      const checkinExistente = await prisma.agendamentoPresenca.findFirst({
        where: { alunoId, eventoId }
      });

      if (checkinExistente) {
        return res.status(400).json({
          erro: 'Você já realizou check-in neste horário!',
          checkin: checkinExistente
        });
      }

      const dataAula = new Date(evento.dataInicio);
      const horaAula = dataAula.getHours();
      const turnoInferido = shift || (horaAula < 12 ? 'MANHA' : horaAula < 18 ? 'TARDE' : 'NOITE');

      const checkin = await prisma.agendamentoPresenca.create({
        data: {
          alunoId,
          eventoId,
          data: dataAula,
          status: 'AGENDADO',
          shift: turnoInferido
        }
      });

      // Avalia gamificação em background
      evaluateStudentGamification(prisma, alunoId).catch(() => null);

      res.status(201).json({
        mensagem: 'Check-in confirmado com sucesso! Seu lugar está reservado.',
        checkin
      });
    } catch (error) {
      console.error('Erro ao registrar check-in:', error);
      res.status(500).json({ erro: 'Erro ao registrar check-in.' });
    }
  });

  // ========================================================
  // 3. CANCELAMENTO DE CHECK-IN PELO ALUNO (SE AINDA NÃO ACEITO)
  // ========================================================
  app.post('/api/checkin/cancelar', async (req: Request, res: Response) => {
    const { checkinId, alunoId, eventoId } = req.body;

    if (!alunoId) {
      return res.status(400).json({ erro: 'ID do aluno é obrigatório.' });
    }

    try {
      let checkin = null;
      if (checkinId) {
        checkin = await prisma.agendamentoPresenca.findUnique({
          where: { id: String(checkinId) }
        });
      } else if (eventoId) {
        checkin = await prisma.agendamentoPresenca.findFirst({
          where: { eventoId: String(eventoId), alunoId: String(alunoId) }
        });
      }

      if (!checkin || checkin.alunoId !== alunoId) {
        return res.status(404).json({ erro: 'Check-in não encontrado para este aluno.' });
      }

      // Se o professor já validou a presença física no tatame, não pode cancelar
      if (checkin.status === 'PRESENTE') {
        return res.status(400).json({
          erro: 'Sua presença já foi aceita e validada pelo professor no tatame! Não é possível cancelar.'
        });
      }

      // Deleta o registro de checkin pendente
      await prisma.agendamentoPresenca.delete({
        where: { id: checkin.id }
      });

      return res.json({
        sucesso: true,
        mensagem: 'Check-in cancelado com sucesso! Sua vaga foi liberada para outros alunos.'
      });
    } catch (error) {
      console.error('Erro ao cancelar check-in:', error);
      res.status(500).json({ erro: 'Erro ao cancelar check-in.' });
    }
  });

  // ========================================================
  // 4. PROFESSOR / ADMIN: CANCELAR AULA (RISCADA NO CALENDÁRIO)
  // ========================================================
  app.post('/api/aulas/:id/cancelar', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { motivo } = req.body;

    try {
      const aula = await prisma.eventoDeAula.update({
        where: { id },
        data: {
          cancelada: true,
          motivoCancelamento: motivo || 'Aula cancelada pelo Professor'
        }
      });

      res.json({
        mensagem: 'Aula cancelada com sucesso! Ela aparecerá riscada no calendário de todos.',
        aula
      });
    } catch (error) {
      console.error('Erro ao cancelar aula:', error);
      res.status(500).json({ erro: 'Erro ao cancelar aula.' });
    }
  });

  // ========================================================
  // 5. PROFESSOR / ADMIN: REATIVAR AULA
  // ========================================================
  app.post('/api/aulas/:id/reativar', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const aula = await prisma.eventoDeAula.update({
        where: { id },
        data: {
          cancelada: false,
          motivoCancelamento: null
        }
      });

      res.json({
        mensagem: 'Aula reativada com sucesso!',
        aula
      });
    } catch (error) {
      console.error('Erro ao reativar aula:', error);
      res.status(500).json({ erro: 'Erro ao reativar aula.' });
    }
  });

  // ========================================================
  // 6. PROFESSOR / ADMIN: MARCAR PRESENÇA / FALTA NO HORÁRIO
  // ========================================================
  app.post('/api/aulas/:id/marcar-presenca', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { alunoId, status } = req.body; // status: 'PRESENTE' | 'FALTA' | 'DOENCA'

    if (!alunoId || !status) {
      return res.status(400).json({ erro: 'Aluno e status são obrigatórios.' });
    }

    try {
      const checkinExistente = await prisma.agendamentoPresenca.findFirst({
        where: { eventoId: id, alunoId }
      });

      let registro;
      if (checkinExistente) {
        registro = await prisma.agendamentoPresenca.update({
          where: { id: checkinExistente.id },
          data: { status }
        });
      } else {
        const evento = await prisma.eventoDeAula.findUnique({ where: { id } });
        registro = await prisma.agendamentoPresenca.create({
          data: {
            eventoId: id,
            alunoId,
            data: evento ? evento.dataInicio : new Date(),
            status
          }
        });
      }

      // Se virou PRESENTE, premia gamificação e points
      if (status === 'PRESENTE') {
        const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
        if (aluno) {
          const novoXp = aluno.total_xp + 10;
          const novosPoints = aluno.spendable_points + 5;
          await prisma.aluno.update({
            where: { id: alunoId },
            data: { total_xp: novoXp, spendable_points: novosPoints }
          });
          await prisma.pointsLedger.create({
            data: {
              alunoId,
              tipo: 'PRESENCA_TATAME',
              xp_delta: 10,
              points_delta: 5,
              saldo_pontos_apos: novosPoints,
              descricao: `Presença confirmada no treino de ${new Date(registro.data).toLocaleDateString('pt-BR')} (+10 XP & +5 Points)`
            }
          });
        }
      }

      res.json({ mensagem: 'Presença atualizada com sucesso!', registro });
    } catch (error) {
      console.error('Erro ao marcar presença na aula:', error);
      res.status(500).json({ erro: 'Erro ao registrar presença.' });
    }
  });
}

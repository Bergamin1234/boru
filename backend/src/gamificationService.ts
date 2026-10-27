import { PrismaClient } from '@prisma/client';

export interface DefaultRankSeed {
  name: string;
  required_checkins_min: number;
  required_checkins_max: number | null;
  badge_icon_url: string;
  reward_description: string;
  order_index: number;
  is_active: boolean;
}

export interface DefaultAchievementSeed {
  title: string;
  description: string;
  category: 'FREQUENCIA' | 'STREAKS' | 'HORARIOS' | 'SUPERACAO' | 'COMUNIDADE';
  badge_icon_url: string;
  trigger_type: string;
  trigger_value: string;
  xp_points: number;
  reward_text: string;
  is_secret: boolean;
  is_active: boolean;
}

export const DEFAULT_RANKS: DefaultRankSeed[] = [
  {
    name: 'Iniciante do Tatame',
    required_checkins_min: 1,
    required_checkins_max: 15,
    badge_icon_url: '🥊',
    reward_description: 'Boas-vindas à Trilha do Nak Muay! Insígnia Digital de Iniciante liberada.',
    order_index: 1,
    is_active: true,
  },
  {
    name: 'Calejador de Canela',
    required_checkins_min: 16,
    required_checkins_max: 40,
    badge_icon_url: '🦵',
    reward_description: 'Resiliência comprovada! Destaque no Mural de Evolução e acesso ao Sparring Supervisionado.',
    order_index: 2,
    is_active: true,
  },
  {
    name: 'Guerreiro da Disciplina',
    required_checkins_min: 41,
    required_checkins_max: 80,
    badge_icon_url: '🛡️',
    reward_description: 'Constância de aço! 5% de desconto em equipamentos ou eventos oficiais do CT.',
    order_index: 3,
    is_active: true,
  },
  {
    name: 'Nak Muay de Ferro',
    required_checkins_min: 81,
    required_checkins_max: 150,
    badge_icon_url: '⚔️',
    reward_description: 'Elite da frequência! Direito a 1 Mentoria Técnica Individual (30min) ou Patch Exclusivo.',
    order_index: 4,
    is_active: true,
  },
  {
    name: 'Muralha de Banguecoque',
    required_checkins_min: 151,
    required_checkins_max: 250,
    badge_icon_url: '🏯',
    reward_description: 'Referência no tatame! Prioridade em seminários e 10% OFF na loja da academia.',
    order_index: 5,
    is_active: true,
  },
  {
    name: 'Lenda do Campo',
    required_checkins_min: 251,
    required_checkins_max: null,
    badge_icon_url: '👑',
    reward_description: 'Hall da Fama Vitalício! Nome gravado no Quadro de Honra da Academia e Insígnia Suprema.',
    order_index: 6,
    is_active: true,
  },
];

export const DEFAULT_ACHIEVEMENTS: DefaultAchievementSeed[] = [
  // 1-8: FREQUÊNCIA & CONSISTÊNCIA
  {
    title: 'Primeiro Gongo',
    description: 'Concluiu o 1º treino oficial confirmado no tatame.',
    category: 'FREQUENCIA',
    badge_icon_url: '🔔',
    trigger_type: 'TOTAL_CHECKINS',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 50,
    reward_text: '+50 XP & Selo de Estreia',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Sem Desculpas',
    description: 'Realizou 3 treinos confirmados na mesma semana.',
    category: 'FREQUENCIA',
    badge_icon_url: '💪',
    trigger_type: 'WEEKLY_CHECKINS',
    trigger_value: JSON.stringify({ target: 3 }),
    xp_points: 80,
    reward_text: '+80 XP de Consistência',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Semana Perfeita',
    description: 'Completou 100% da meta semanal do seu plano de treinos.',
    category: 'FREQUENCIA',
    badge_icon_url: '🎯',
    trigger_type: 'PERFECT_WEEK',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 100,
    reward_text: '+100 XP & Destaque Semanal',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Hábito Forjado',
    description: 'Alcançou 12 treinos confirmados dentro de um único mês.',
    category: 'FREQUENCIA',
    badge_icon_url: '⚒️',
    trigger_type: 'MONTHLY_CHECKINS',
    trigger_value: JSON.stringify({ target: 12 }),
    xp_points: 150,
    reward_text: '+150 XP de Disciplina Mensal',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Máquina de Treino',
    description: 'Alcançou a marca impressionante de 16 treinos no mesmo mês.',
    category: 'FREQUENCIA',
    badge_icon_url: '⚙️',
    trigger_type: 'MONTHLY_CHECKINS',
    trigger_value: JSON.stringify({ target: 16 }),
    xp_points: 200,
    reward_text: '+200 XP & Status Máquina',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Centenário',
    description: 'Completou 100 treinos acumulados na sua jornada marcial.',
    category: 'FREQUENCIA',
    badge_icon_url: '💯',
    trigger_type: 'TOTAL_CHECKINS',
    trigger_value: JSON.stringify({ target: 100 }),
    xp_points: 350,
    reward_text: '+350 XP & Reconhecimento no Tatame',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Veterano',
    description: 'Completou 200 treinos acumulados com honra e suor.',
    category: 'FREQUENCIA',
    badge_icon_url: '🎖️',
    trigger_type: 'TOTAL_CHECKINS',
    trigger_value: JSON.stringify({ target: 200 }),
    xp_points: 600,
    reward_text: '+600 XP & Insígnia de Veterano',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Imortal',
    description: 'Alcançou a marca histórica de 365 treinos confirmados!',
    category: 'FREQUENCIA',
    badge_icon_url: '🐉',
    trigger_type: 'TOTAL_CHECKINS',
    trigger_value: JSON.stringify({ target: 365 }),
    xp_points: 1000,
    reward_text: '+1000 XP & Título Imortal do CT',
    is_secret: false,
    is_active: true,
  },

  // 9-14: SEQUÊNCIAS (STREAKS)
  {
    title: 'Aquecendo o Motor',
    description: 'Manteve frequência ativa por 2 semanas consecutivas.',
    category: 'STREAKS',
    badge_icon_url: '🔥',
    trigger_type: 'STREAK_WEEKS',
    trigger_value: JSON.stringify({ target: 2 }),
    xp_points: 75,
    reward_text: '+75 XP de Sequência',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Ritmo de Luta',
    description: 'Manteve frequência ativa por 4 semanas consecutivas.',
    category: 'STREAKS',
    badge_icon_url: '⚡',
    trigger_type: 'STREAK_WEEKS',
    trigger_value: JSON.stringify({ target: 4 }),
    xp_points: 150,
    reward_text: '+150 XP de Ritmo',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Blindagem Mental',
    description: 'Treinou por 8 semanas seguidas sem nenhuma falta injustificada.',
    category: 'STREAKS',
    badge_icon_url: '🧠',
    trigger_type: 'STREAK_WEEKS_NO_MISS',
    trigger_value: JSON.stringify({ target: 8 }),
    xp_points: 300,
    reward_text: '+300 XP & Mente Blindada',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Inabalável',
    description: 'Sequência implacável de 12 semanas consecutivas treinando.',
    category: 'STREAKS',
    badge_icon_url: '🗿',
    trigger_type: 'STREAK_WEEKS',
    trigger_value: JSON.stringify({ target: 12 }),
    xp_points: 450,
    reward_text: '+450 XP & Selo Inabalável',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Chuva ou Sol',
    description: 'Compareceu ao treino mesmo em dia de clima adverso ou tempestade.',
    category: 'STREAKS',
    badge_icon_url: '⛈️',
    trigger_type: 'ADVERSE_WEATHER',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 120,
    reward_text: '+120 XP de Resiliência Climática',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Retorno do Guerreiro',
    description: 'Voltou a treinar firme após período de lesão, atestado ou ausência.',
    category: 'STREAKS',
    badge_icon_url: '🦅',
    trigger_type: 'RETURN_AFTER_ABSENCE',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 150,
    reward_text: '+150 XP de Superação e Retorno',
    is_secret: false,
    is_active: true,
  },

  // 15-20: HORÁRIOS & ESPECIAIS
  {
    title: 'Primeiro Raio de Sol',
    description: 'Completou 10 treinos confirmados no turno da manhã.',
    category: 'HORARIOS',
    badge_icon_url: '🌅',
    trigger_type: 'SHIFT_MORNING',
    trigger_value: JSON.stringify({ target: 10, shift: 'MANHA' }),
    xp_points: 150,
    reward_text: '+150 XP Guerreiro Matinal',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Cavalheiro da Noite',
    description: 'Completou 10 treinos confirmados no turno da noite.',
    category: 'HORARIOS',
    badge_icon_url: '🌙',
    trigger_type: 'SHIFT_NIGHT',
    trigger_value: JSON.stringify({ target: 10, shift: 'NOITE' }),
    xp_points: 150,
    reward_text: '+150 XP Guardião Noturno',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Sextou',
    description: 'Trocou a folga pelo tatame em 5 sextas-feiras.',
    category: 'HORARIOS',
    badge_icon_url: '🎉',
    trigger_type: 'WEEKDAY_FRIDAY',
    trigger_value: JSON.stringify({ target: 5, weekday: 5 }),
    xp_points: 130,
    reward_text: '+130 XP Sextou no Tatame',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Guerreiro de Sábado',
    description: 'Compareceu a 4 treinos ou aulões realizados aos sábados.',
    category: 'HORARIOS',
    badge_icon_url: '🦁',
    trigger_type: 'WEEKDAY_SATURDAY',
    trigger_value: JSON.stringify({ target: 4, weekday: 6 }),
    xp_points: 160,
    reward_text: '+160 XP Fim de Semana de Luta',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Feriado de Batalha',
    description: 'Marcou presença em um treino de feriado ou aulão especial.',
    category: 'HORARIOS',
    badge_icon_url: '🚩',
    trigger_type: 'SPECIAL_EVENT',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 150,
    reward_text: '+150 XP Sem Feriado para Evoluir',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Pontualidade Sagrada',
    description: 'Chegou com antecedência e disciplina exemplar em 10 treinos.',
    category: 'HORARIOS',
    badge_icon_url: '⏱️',
    trigger_type: 'ARRIVED_EARLY',
    trigger_value: JSON.stringify({ target: 10 }),
    xp_points: 180,
    reward_text: '+180 XP Respeito ao Mestre',
    is_secret: false,
    is_active: true,
  },

  // 21-25: SUPERAÇÃO
  {
    title: 'Dose Dupla',
    description: 'Realizou 2 treinos confirmados no mesmo dia.',
    category: 'SUPERACAO',
    badge_icon_url: '💥',
    trigger_type: 'DOUBLE_DAY',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 180,
    reward_text: '+180 XP Gás Infinito',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Maratona',
    description: 'Completou 5 treinos intensos dentro da mesma semana.',
    category: 'SUPERACAO',
    badge_icon_url: '🏃',
    trigger_type: 'WEEKLY_CHECKINS',
    trigger_value: JSON.stringify({ target: 5 }),
    xp_points: 200,
    reward_text: '+200 XP Semana de Camp',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Mês de Ferro',
    description: 'Manteve frequência firme (8+ treinos) durante Dezembro ou Janeiro.',
    category: 'SUPERACAO',
    badge_icon_url: '🎄',
    trigger_type: 'IRON_MONTH_DEC_JAN',
    trigger_value: JSON.stringify({ target: 8 }),
    xp_points: 250,
    reward_text: '+250 XP Foco nas Festas',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Calejamento de Inverno',
    description: 'Venceu o frio completando 10 treinos durante o inverno (Junho a Agosto).',
    category: 'SUPERACAO',
    badge_icon_url: '❄️',
    trigger_type: 'WINTER_TRAINING',
    trigger_value: JSON.stringify({ target: 10 }),
    xp_points: 220,
    reward_text: '+220 XP Sangue Quente no Inverno',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Fiel ao Canto',
    description: 'Dedicação máxima (12+ treinos no mês) na preparação para exame de graduação.',
    category: 'SUPERACAO',
    badge_icon_url: '🥋',
    trigger_type: 'PRE_EXAM_DEDICATION',
    trigger_value: JSON.stringify({ target: 12 }),
    xp_points: 280,
    reward_text: '+280 XP Pronto para Graduar',
    is_secret: false,
    is_active: true,
  },

  // 26-30: COMUNIDADE
  {
    title: 'Novo Sparring',
    description: 'Trouxe um amigo para conhecer e treinar na academia.',
    category: 'COMUNIDADE',
    badge_icon_url: '🤝',
    trigger_type: 'BROUGHT_FRIEND',
    trigger_value: JSON.stringify({ target: 1 }),
    xp_points: 150,
    reward_text: '+150 XP Embaixador do Tatame',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Mestre de Cerimônia',
    description: 'Indicou ou trouxe amigos em 3 ocasiões para fortalecer a família.',
    category: 'COMUNIDADE',
    badge_icon_url: '📣',
    trigger_type: 'REFERRAL_ENROLLMENTS',
    trigger_value: JSON.stringify({ target: 3 }),
    xp_points: 350,
    reward_text: '+350 XP Líder de Comunidade',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Dupla Implacável',
    description: 'Completou 15 check-ins treinando acompanhado de parceiro de treino.',
    category: 'COMUNIDADE',
    badge_icon_url: '🤜',
    trigger_type: 'PARTNER_CHECKINS',
    trigger_value: JSON.stringify({ target: 15 }),
    xp_points: 300,
    reward_text: '+300 XP Irmandade Muay Thai',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Espírito Wai Kru',
    description: 'Participou de 3 eventos especiais, aulões ou seminários da academia.',
    category: 'COMUNIDADE',
    badge_icon_url: '🙏',
    trigger_type: 'SPECIAL_EVENT',
    trigger_value: JSON.stringify({ target: 3 }),
    xp_points: 250,
    reward_text: '+250 XP Tradição e Respeito',
    is_secret: false,
    is_active: true,
  },
  {
    title: 'Guardião do CT',
    description: '12 meses de história mantendo média superior a 10 treinos/mês (120+ treinos).',
    category: 'COMUNIDADE',
    badge_icon_url: '🏛️',
    trigger_type: 'GUARDIAN_CT',
    trigger_value: JSON.stringify({ target: 120 }),
    xp_points: 800,
    reward_text: '+800 XP & Honraria Guardião do CT',
    is_secret: false,
    is_active: true,
  },
];

let isSeededCache = false;

export async function ensureGamificationSeeded(prisma: PrismaClient, forceReset = false) {
  if (isSeededCache && !forceReset) return;

  if (forceReset) {
    await prisma.userAchievementProgress.deleteMany({});
    await prisma.gamificationAchievement.deleteMany({});
    await prisma.gamificationRank.deleteMany({});
  }

  const rankCount = await prisma.gamificationRank.count();
  if (rankCount === 0) {
    for (const r of DEFAULT_RANKS) {
      await prisma.gamificationRank.create({ data: r });
    }
  }

  const achCount = await prisma.gamificationAchievement.count();
  if (achCount === 0) {
    for (const a of DEFAULT_ACHIEVEMENTS) {
      await prisma.gamificationAchievement.create({ data: a });
    }
  }

  isSeededCache = true;
}

function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function inferShift(date: Date, explicitShift?: string | null): 'MANHA' | 'TARDE' | 'NOITE' {
  if (explicitShift === 'MANHA' || explicitShift === 'TARDE' || explicitShift === 'NOITE') {
    return explicitShift;
  }
  const h = date.getHours();
  if (h < 12) return 'MANHA';
  if (h < 18) return 'TARDE';
  return 'NOITE';
}

export async function evaluateStudentGamification(prisma: PrismaClient, alunoId: string) {
  await ensureGamificationSeeded(prisma);

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    include: {
      presencas: {
        orderBy: { data: 'asc' },
      },
      conquistasProgresso: true,
    },
  });

  if (!aluno) {
    throw new Error('Aluno não encontrado para avaliação de gamificação');
  }

  const ranks = await prisma.gamificationRank.findMany({
    where: { is_active: true },
    orderBy: { order_index: 'asc' },
  });

  const achievements = await prisma.gamificationAchievement.findMany({
    where: { is_active: true },
    orderBy: { criadoEm: 'asc' },
  });

  const todasPresencas = aluno.presencas || [];
  const presencasConfirmadas = todasPresencas.filter((p) => p.status === 'PRESENTE');
  const totalPresencas = presencasConfirmadas.length;

  // Meta semanal baseada no plano do aluno
  let metaSemanalPlano = 3;
  let metaMes = 12;
  if (aluno.plano?.includes('2x')) {
    metaSemanalPlano = 2;
    metaMes = 8;
  } else if (aluno.plano?.includes('Todos')) {
    metaSemanalPlano = 4;
    metaMes = 20;
  } else if (aluno.plano?.includes('DIARIA')) {
    metaSemanalPlano = 1;
    metaMes = 4;
  }

  // Cálculo de presenças no mês atual
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const presencasNoMes = presencasConfirmadas.filter(
    (p) => new Date(p.data) >= inicioMes
  ).length;
  const progressoMeta = Math.min(100, Math.round((presencasNoMes / metaMes) * 100));

  // Agrupamentos estatísticos para gatilhos das 30 conquistas
  const porDiaMap = new Map<string, number>();
  const porSemanaMap = new Map<string, number>();
  const porMesMap = new Map<string, number>();
  const porMesDecJanMap = new Map<string, number>();
  const parceiroCountMap = new Map<string, number>();

  let manhaCount = 0;
  let tardeCount = 0;
  let noiteCount = 0;
  let sextasCount = 0;
  let sabadosCount = 0;
  let eventosEspeciaisCount = 0;
  let chegouCedoCount = 0;
  let climaAdversoCount = 0;
  let invernoCount = 0;
  let trouxeAmigoCount = 0;
  let retornoPosAusenciaCount = 0;

  let prevPresenteDate: Date | null = null;
  let teveFaltaOuDoencaAntes = false;

  for (const reg of todasPresencas) {
    if (reg.status === 'DOENCA' || reg.status === 'JUSTIFICADO' || reg.status === 'FALTA') {
      teveFaltaOuDoencaAntes = true;
    }
    if (reg.status !== 'PRESENTE') continue;

    const d = new Date(reg.data);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekKey = getISOWeekKey(d);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    porDiaMap.set(dayKey, (porDiaMap.get(dayKey) || 0) + 1);
    porSemanaMap.set(weekKey, (porSemanaMap.get(weekKey) || 0) + 1);
    porMesMap.set(monthKey, (porMesMap.get(monthKey) || 0) + 1);

    const mesZero = d.getMonth(); // 0 = Jan, 11 = Dez
    if (mesZero === 0 || mesZero === 11) {
      porMesDecJanMap.set(monthKey, (porMesDecJanMap.get(monthKey) || 0) + 1);
    }
    if (mesZero === 5 || mesZero === 6 || mesZero === 7) {
      invernoCount++;
    }

    const shift = inferShift(d, reg.shift);
    if (shift === 'MANHA') manhaCount++;
    else if (shift === 'TARDE') tardeCount++;
    else noiteCount++;

    const diaSemana = d.getDay(); // 5 = Sexta, 6 = Sábado
    if (diaSemana === 5) sextasCount++;
    if (diaSemana === 6) sabadosCount++;

    if (reg.is_special_event) eventosEspeciaisCount++;
    if (reg.arrived_early) chegouCedoCount++;
    if (reg.adverse_weather) climaAdversoCount++;
    if (reg.accompanied_by_user_id) {
      trouxeAmigoCount++;
      parceiroCountMap.set(
        reg.accompanied_by_user_id,
        (parceiroCountMap.get(reg.accompanied_by_user_id) || 0) + 1
      );
    }

    if (teveFaltaOuDoencaAntes) {
      retornoPosAusenciaCount = Math.max(retornoPosAusenciaCount, 1);
    }
    if (prevPresenteDate) {
      const diffDays = (d.getTime() - prevPresenteDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 14) {
        retornoPosAusenciaCount = Math.max(retornoPosAusenciaCount, 1);
      }
    }
    prevPresenteDate = d;
  }

  const maxPorDia = Math.max(0, ...Array.from(porDiaMap.values()));
  const diasComDoseDupla = Array.from(porDiaMap.values()).filter((c) => c >= 2).length;
  const maxPorSemana = Math.max(0, ...Array.from(porSemanaMap.values()));
  const semanasPerfeitas = Array.from(porSemanaMap.values()).filter((c) => c >= metaSemanalPlano).length;
  const maxPorMes = Math.max(0, ...Array.from(porMesMap.values()));
  const maxDecJan = Math.max(0, ...Array.from(porMesDecJanMap.values()));
  const maxParceiro = Math.max(0, ...Array.from(parceiroCountMap.values()), trouxeAmigoCount);

  // Cálculo de semanas consecutivas (Streak Semanal) e Streak Geral
  const semanasComPresenca = Array.from(porSemanaMap.keys()).sort();
  let maxStreakWeeks = semanasComPresenca.length > 0 ? 1 : 0;
  let currentStreakWeeks = semanasComPresenca.length > 0 ? 1 : 0;

  // Para verificar consecutividade entre semanas ordenadas
  const datasPresencaOrdenadas = presencasConfirmadas.map((p) => new Date(p.data));
  if (datasPresencaOrdenadas.length > 0) {
    // Agrupa por início da semana (Segunda-feira)
    const weekStarts = Array.from(
      new Set(
        datasPresencaOrdenadas.map((d) => {
          const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const day = copy.getDay();
          const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
          copy.setDate(diff);
          copy.setHours(0, 0, 0, 0);
          return copy.getTime();
        })
      )
    ).sort((a, b) => a - b);

    let tempStreak = 1;
    maxStreakWeeks = 1;
    for (let i = 1; i < weekStarts.length; i++) {
      const diffWeeks = Math.round((weekStarts[i] - weekStarts[i - 1]) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks === 1) {
        tempStreak++;
        if (tempStreak > maxStreakWeeks) maxStreakWeeks = tempStreak;
      } else if (diffWeeks > 1) {
        tempStreak = 1;
      }
    }
    currentStreakWeeks = tempStreak;
  }

  // Semanas sem faltas injustificadas
  const faltasInjustificadas = todasPresencas.filter((p) => p.status === 'FALTA').length;
  const streakWeeksSemFalta = faltasInjustificadas === 0 ? maxStreakWeeks : Math.max(0, maxStreakWeeks - faltasInjustificadas);

  // Streak de presenças seguidas (para retrocompatibilidade com widget antigo)
  let streakPresencas = 0;
  const todasOrdenadasDesc = [...todasPresencas].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
  for (const reg of todasOrdenadasDesc) {
    if (reg.status === 'PRESENTE') streakPresencas++;
    else if (reg.status === 'FALTA') break;
  }

  // Determinação de Rank Atual e Próximo Rank ("Trilha do Nak Muay")
  let rankAtual = ranks[0] || null;
  let proximoRank = ranks.length > 1 ? ranks[1] : null;

  for (let i = 0; i < ranks.length; i++) {
    const r = ranks[i];
    const minOk = totalPresencas >= r.required_checkins_min;
    const maxOk = r.required_checkins_max === null || totalPresencas <= r.required_checkins_max;
    if (minOk && maxOk) {
      rankAtual = r;
      proximoRank = ranks[i + 1] || null;
      break;
    }
    if (totalPresencas >= r.required_checkins_min && r.required_checkins_max === null) {
      rankAtual = r;
      proximoRank = null;
    }
  }

  // Caso o aluno tenha 0 presenças, mostra o 1º Rank como meta inicial
  let progressoRank = 0;
  let checkinsFaltantesProximoRank = 0;
  if (totalPresencas === 0 && ranks.length > 0) {
    rankAtual = {
      ...ranks[0],
      name: 'Aspirante ao Tatame (0 treinos)',
    };
    proximoRank = ranks[0];
    progressoRank = 0;
    checkinsFaltantesProximoRank = ranks[0].required_checkins_min;
  } else if (rankAtual && proximoRank) {
    const base = rankAtual.required_checkins_min;
    const topo = proximoRank.required_checkins_min;
    const span = Math.max(1, topo - base);
    progressoRank = Math.min(100, Math.max(0, Math.round(((totalPresencas - base) / span) * 100)));
    checkinsFaltantesProximoRank = Math.max(0, topo - totalPresencas);
  } else if (rankAtual && !proximoRank) {
    progressoRank = 100;
    checkinsFaltantesProximoRank = 0;
  }

  // Avaliar todas as Conquistas Ativas e sincronizar UserAchievementProgress
  const progressoExistenteMap = new Map(
    aluno.conquistasProgresso.map((up) => [up.achievement_id, up])
  );

  const conquistasAvaliadas = [];
  const recemDesbloqueadas = [];
  let xpTotal = 0;

  for (const ach of achievements) {
    let parsedTrigger: any = {};
    try {
      parsedTrigger = JSON.parse(ach.trigger_value || '{}');
    } catch {
      parsedTrigger = { target: 1 };
    }
    const target = Number(parsedTrigger.target) || 1;
    let current = 0;

    switch (ach.trigger_type) {
      case 'TOTAL_CHECKINS':
      case 'GUARDIAN_CT':
        current = totalPresencas;
        break;
      case 'WEEKLY_CHECKINS':
        current = maxPorSemana;
        break;
      case 'PERFECT_WEEK':
        current = semanasPerfeitas;
        break;
      case 'MONTHLY_CHECKINS':
      case 'PRE_EXAM_DEDICATION':
        current = maxPorMes;
        break;
      case 'STREAK_WEEKS':
        current = maxStreakWeeks;
        break;
      case 'STREAK_WEEKS_NO_MISS':
        current = streakWeeksSemFalta;
        break;
      case 'ADVERSE_WEATHER':
        current = climaAdversoCount;
        break;
      case 'RETURN_AFTER_ABSENCE':
        current = retornoPosAusenciaCount;
        break;
      case 'SHIFT_MORNING':
        current = manhaCount;
        break;
      case 'SHIFT_AFTERNOON':
        current = tardeCount;
        break;
      case 'SHIFT_NIGHT':
        current = noiteCount;
        break;
      case 'WEEKDAY_FRIDAY':
        current = sextasCount;
        break;
      case 'WEEKDAY_SATURDAY':
        current = sabadosCount;
        break;
      case 'SPECIAL_EVENT':
        current = eventosEspeciaisCount;
        break;
      case 'ARRIVED_EARLY':
        current = chegouCedoCount;
        break;
      case 'DOUBLE_DAY':
        current = diasComDoseDupla > 0 ? diasComDoseDupla : (maxPorDia >= 2 ? 1 : 0);
        break;
      case 'IRON_MONTH_DEC_JAN':
        current = maxDecJan;
        break;
      case 'WINTER_TRAINING':
        current = invernoCount;
        break;
      case 'BROUGHT_FRIEND':
      case 'REFERRAL_ENROLLMENTS':
        current = trouxeAmigoCount;
        break;
      case 'PARTNER_CHECKINS':
        current = maxParceiro;
        break;
      default:
        current = 0;
        break;
    }

    const existing = progressoExistenteMap.get(ach.id);
    // Se o professor já desbloqueou manualmente ou o progresso salvo era maior, preserva!
    if (existing && existing.status === 'completed') {
      current = Math.max(current, target, existing.current_progress);
    } else if (existing) {
      current = Math.max(current, existing.current_progress);
    }

    const clampedProgress = Math.min(target, current);
    let newStatus: 'locked' | 'in_progress' | 'completed' = 'locked';
    if (current >= target) {
      newStatus = 'completed';
    } else if (current > 0) {
      newStatus = 'in_progress';
    }

    const wasCompletedBefore = existing?.status === 'completed';
    const unlockedAt =
      newStatus === 'completed'
        ? existing?.unlocked_at || new Date()
        : null;

    let savedRecord = existing;
    if (
      !existing ||
      existing.current_progress !== clampedProgress ||
      existing.target_progress !== target ||
      existing.status !== newStatus
    ) {
      savedRecord = await prisma.userAchievementProgress.upsert({
        where: {
          user_id_achievement_id: {
            user_id: alunoId,
            achievement_id: ach.id,
          },
        },
        update: {
          current_progress: clampedProgress,
          target_progress: target,
          status: newStatus,
          unlocked_at: unlockedAt,
        },
        create: {
          user_id: alunoId,
          achievement_id: ach.id,
          current_progress: clampedProgress,
          target_progress: target,
          status: newStatus,
          unlocked_at: unlockedAt,
          notified: newStatus === 'completed' ? false : false,
        },
      });
    }

    if (newStatus === 'completed') {
      xpTotal += ach.xp_points;
    }

    const itemFormatado = {
      id: ach.id,
      title: ach.title,
      description: ach.description,
      category: ach.category,
      badge_icon_url: ach.badge_icon_url,
      trigger_type: ach.trigger_type,
      trigger_value: ach.trigger_value,
      xp_points: ach.xp_points,
      reward_text: ach.reward_text,
      is_secret: ach.is_secret,
      current_progress: clampedProgress,
      target_progress: target,
      progress_percent: Math.min(100, Math.round((clampedProgress / target) * 100)),
      status: newStatus,
      unlocked_at: savedRecord?.unlocked_at || unlockedAt,
      notified: savedRecord?.notified ?? false,
    };

    conquistasAvaliadas.push(itemFormatado);
    if (newStatus === 'completed' && (!wasCompletedBefore || !savedRecord?.notified)) {
      recemDesbloqueadas.push(itemFormatado);
    }
  }

  // Bônus de XP por check-in confirmado (10 XP por treino)
  xpTotal += totalPresencas * 10;

  // Mantém também o array `medalhas` original para 100% de compatibilidade com o widget antigo do PortalAluno!
  const medalhasLegado = [
    {
      id: 'primeiro_passo',
      titulo: '1º Gongo',
      desc: '1º treino concluído',
      icone: '🥊',
      desbloqueada: totalPresencas >= 1,
    },
    {
      id: 'foco_total',
      titulo: 'Foco Total',
      desc: '5 treinos seguidos',
      icone: '🔥',
      desbloqueada: streakPresencas >= 5,
    },
    {
      id: ' guerreiro_mes',
      titulo: 'Guerreiro do Mês',
      desc: 'Meta mensal batida',
      icone: '🏆',
      desbloqueada: presencasNoMes >= metaMes,
    },
    {
      id: 'veterano_25',
      titulo: 'Casca Grossa',
      desc: '25 treinos no tatame',
      icone: '🦵',
      desbloqueada: totalPresencas >= 25,
    },
    {
      id: 'lenda_50',
      titulo: 'Nak Muay de Elite',
      desc: '50 treinos acumulados',
      icone: '👑',
      desbloqueada: totalPresencas >= 50,
    },
    {
      id: 'centuriao',
      titulo: 'Centurião Borü',
      desc: '100 treinos históricos',
      icone: '🐉',
      desbloqueada: totalPresencas >= 100,
    },
  ];

  return {
    // Campos legados (NÃO REMOVER - mantém compatibilidade com o card original na aba Treinos)
    streak: streakPresencas,
    presencasNoMes,
    metaMes,
    progressoMeta,
    totalPresencas,
    medalhas: medalhasLegado,

    // Novos campos completos da "Trilha do Nak Muay"
    xpTotal,
    streakSemanas: currentStreakWeeks,
    maxStreakSemanas: maxStreakWeeks,
    rankAtual,
    proximoRank,
    progressoRank,
    checkinsFaltantesProximoRank,
    ranks: ranks.map((r) => ({
      ...r,
      alcançado: totalPresencas >= r.required_checkins_min,
      atual: rankAtual?.id === r.id && totalPresencas >= r.required_checkins_min,
    })),
    conquistas: conquistasAvaliadas,
    resumoConquistas: {
      total: conquistasAvaliadas.length,
      desbloqueadas: conquistasAvaliadas.filter((c) => c.status === 'completed').length,
      emProgresso: conquistasAvaliadas.filter((c) => c.status === 'in_progress').length,
      bloqueadas: conquistasAvaliadas.filter((c) => c.status === 'locked').length,
    },
    recemDesbloqueadas,
    estatisticasTurnos: {
      manha: manhaCount,
      tarde: tardeCount,
      noite: noiteCount,
      sextas: sextasCount,
      sabados: sabadosCount,
      eventosEspeciais: eventosEspeciaisCount,
      chegouCedo: chegouCedoCount,
      climaAdverso: climaAdversoCount,
    },
  };
}

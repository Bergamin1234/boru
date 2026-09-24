// js/mockData.js - Banco de dados de Videoaulas, Professores, Estrutura e FAQ do BORÜ Centro de Combate

const INITIAL_LESSONS = [
  {
    id: "lesson-01",
    title: "Fundamentos do Jab-Direto e Bloqueio Cruzado no Muay Thai",
    discipline: "muay-thai",
    disciplineName: "Muay Thai",
    level: "Iniciante",
    instructor: "Kru Rafael Silva",
    duration: "18 min",
    videoUrl: "https://www.youtube.com/embed/n3Xv_g3g-mA",
    thumbnail: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
    description: "Nesta aula fundamental, o Kru Rafael destrincha o alinhamento corporal no jab e direto, a rotação de quadril e a transição rápida para defesa ativa com bloqueio cruzado de socos.",
    technicalKeypoints: [
      "Base sólida com calcanhar traseiro levemente elevado",
      "Rotação total do ombro protegendo o queixo",
      "Retorno rápido da mão à guarda antes de chutar"
    ],
    materials: [
      { name: "Guia de Postura e Ângulos (PDF)", size: "1.4 MB" }
    ],
    dateAdded: "2025-01-15"
  },
  {
    id: "lesson-02",
    title: "Passagem de Guarda Toureada com Controle de Lapela",
    discipline: "bjj",
    disciplineName: "Jiu-Jitsu (BJJ)",
    level: "Intermediário",
    instructor: "Prof. Marcos 'Tubarão' Prado",
    duration: "24 min",
    videoUrl: "https://www.youtube.com/embed/5a2d6F_Vq6o",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    description: "Aprenda a anular a guarda aberta do adversário aplicando a pressão correta com a pegada nas calças e o estourar de pegadas na manga usando torque no quadril.",
    technicalKeypoints: [
      "Domínio duplo na barra da calça",
      "Pressão lateral com mudança súbita de direção ('Bullfight')",
      "Estabilização imediata dos 100kg com peito no peito"
    ],
    materials: [
      { name: "Mapa Mental de Transições de Guarda (PDF)", size: "2.1 MB" }
    ],
    dateAdded: "2025-01-20"
  },
  {
    id: "lesson-03",
    title: "Transição de Grade para Queda Double Leg no MMA",
    discipline: "mma",
    disciplineName: "MMA",
    level: "Avançado",
    instructor: "Coach Diego Albuquerque",
    duration: "21 min",
    videoUrl: "https://www.youtube.com/embed/YxVbY1sV5f0",
    thumbnail: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=800&q=80",
    description: "Dominando o clinch contra a grade, quebrando a base do oponente através do controle de cabeça ('underhook') para a entrada explosiva no Double Leg.",
    technicalKeypoints: [
      "Manter a cabeça sob o queixo do oponente para controlar a postura",
      "Troca de nível com joelho tocando o tatame e puxada de calcanhar",
      "Finalização com corte de ângulo para evitar guilhotina"
    ],
    materials: [
      { name: "Checklist de Defesa e Ataque na Grade (PDF)", size: "950 KB" }
    ],
    dateAdded: "2025-02-01"
  },
  {
    id: "lesson-04",
    title: "Combinações Avançadas de Low Kick e Fintas de Chute",
    discipline: "kickboxing",
    disciplineName: "Kickboxing",
    level: "Intermediário",
    instructor: "Sensei Lucas Andrade",
    duration: "16 min",
    videoUrl: "https://www.youtube.com/embed/2vJ37Ye3Q60",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    description: "Como mascarar o chute na coxa usando socos em linha reta, quebrando a leitura do oponente e forçando a abertura da guarda defensiva.",
    technicalKeypoints: [
      "Cruzado de esquerda curto abrindo o ângulo do pé de apoio",
      "Chute com a canela mirando a inserção muscular acima do joelho",
      "Equilíbrio imediato para contra-ataque"
    ],
    materials: [
      { name: "Tabela de Drills de Chute em Dupla (PDF)", size: "1.2 MB" }
    ],
    dateAdded: "2025-02-05"
  },
  {
    id: "lesson-05",
    title: "Finalização Triângulo da Guarda Fechada com Ajuste de Ângulo",
    discipline: "bjj",
    disciplineName: "Jiu-Jitsu (BJJ)",
    level: "Iniciante",
    instructor: "Prof. Marcos 'Tubarão' Prado",
    duration: "20 min",
    videoUrl: "https://www.youtube.com/embed/eW3k7W5gO90",
    thumbnail: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=80",
    description: "Detalhes minuciosos para travar o triângulo sem cansar as pernas: quebra de postura, passagem do braço e pegada na canela para fechar o cadeado perfeito.",
    technicalKeypoints: [
      "Puxar a cabeça para baixo enquanto escala o quadril",
      "Ângulo de 90 graus em relação ao oponente",
      "Puxar a canela com a mão oposta antes de fechar o 4"
    ],
    materials: [
      { name: "Principais Erros no Triângulo (PDF)", size: "800 KB" }
    ],
    dateAdded: "2025-02-08"
  },
  {
    id: "lesson-06",
    title: "Condicionamento de Alta Intensidade para Esportes de Combate (HIIT)",
    discipline: "funcional",
    disciplineName: "Funcional de Luta",
    level: "Todos os Níveis",
    instructor: "Prep. Físico Bruno Castro",
    duration: "25 min",
    videoUrl: "https://www.youtube.com/embed/ml6cT4AZdqI",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    description: "Circuito focado em potência explosiva, resistência de 'gás' para rounds de 5 minutos, trabalho de medicine ball, corda naval e kettlebell swings.",
    technicalKeypoints: [
      "Manutenção da frequência cardíaca em zona 4 e 5",
      "Transferência de força do core para os membros superiores",
      "Respiração diafragmática sob estresse metabólico"
    ],
    materials: [
      { name: "Planilha de Periodização Semanal (PDF)", size: "3.0 MB" }
    ],
    dateAdded: "2025-02-10"
  },
  {
    id: "lesson-07",
    title: "Cotoveladas Cortantes e Clinch Tradicional Tailandês",
    discipline: "muay-thai",
    disciplineName: "Muay Thai",
    level: "Avançado",
    instructor: "Kru Rafael Silva",
    duration: "22 min",
    videoUrl: "https://www.youtube.com/embed/zFp4dUp5k2A",
    thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
    description: "Domínio no Plum com joelhadas frontais e entradas cirúrgicas de cotovelo diagonal e ascendente para romper bloqueios estreitos.",
    technicalKeypoints: [
      "Controle das duas mãos na nuca sem entrelaçar os dedos",
      "Tracionar o tronco do oponente para baixo ao desferir a joelhada",
      "Cotovelo passando em 45 graus com mão aberta junto ao peito"
    ],
    materials: [
      { name: "Manual de Regras e Pontuação do Muay Thai (PDF)", size: "1.8 MB" }
    ],
    dateAdded: "2025-02-12"
  },
  {
    id: "lesson-08",
    title: "Raspagem de Meia-Guarda 'Deep Half' com Ida para as Costas",
    discipline: "bjj",
    disciplineName: "Jiu-Jitsu (BJJ)",
    level: "Avançado",
    instructor: "Prof. Marcos 'Tubarão' Prado",
    duration: "27 min",
    videoUrl: "https://www.youtube.com/embed/7V9N4j_aWc0",
    thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    description: "Entre por baixo do centro de gravidade do oponente na meia guarda profunda, desequilibre o peso para frente e pegue as costas com ganchos firmes.",
    technicalKeypoints: [
      "Mergulhar sob a perna com a orelha colada no quadril adversário",
      "Manter o oponente desbalanceado sem permitir a esgrima",
      "Troca rápida para a pegada no quadril subindo nas costas"
    ],
    materials: [
      { name: "Esquema Tático de Meia Guarda (PDF)", size: "1.5 MB" }
    ],
    dateAdded: "2025-02-14"
  },
  {
    id: "lesson-09",
    title: "Defesa e Contra-Golpe de Overhand no MMA",
    discipline: "mma",
    disciplineName: "MMA",
    level: "Intermediário",
    instructor: "Coach Diego Albuquerque",
    duration: "19 min",
    videoUrl: "https://www.youtube.com/embed/9BqS5Zp4iUk",
    thumbnail: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80",
    description: "Como absorver ou esquivar por baixo da bomba de direita (overhand) e responder com cruzado de esquerda no queixo ou queda imediata.",
    technicalKeypoints: [
      "Esquiva com flexão de pernas mantendo a visão fixa no quadril do adversário",
      "Entrada em diagonal saindo do raio de ação do golpe pesado",
      "Contra-ataque instantâneo sem recuar em linha reta"
    ],
    materials: [
      { name: "Guia de Distâncias e Timing no MMA (PDF)", size: "1.1 MB" }
    ],
    dateAdded: "2025-02-16"
  }
];

const INSTRUCTORS_DATA = [
  {
    id: "felipe-boru",
    name: "Felipe Borü",
    role: "Head Coach de Muay Thai & Fundador",
    cref: "Prajied Azul Escuro e Preto",
    bio: "Mais de anos dedicados à arte marcial tailandesa. Formando atletas e transformando vidas através da disciplina e excelência técnica do Muay Thai.",
    image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=600&q=80",
    specialties: ["Muay Thai Tradicional", "Clinch & Cotovelos", "Defesa Pessoal"],
    achievements: [
      "Prajied Azul Escuro e Preto em Muay Thai",
      "Fundador do CT BORÜ",
      "Centenas de alunos formados no Norte do Brasil",
      "Especialista em Metodologia de Ensino"
    ]
  }
];

const FACILITIES_DATA = [
  {
    title: "Tatame Olímpico de Alta Densidade",
    desc: "Mais de 180m² de tatame profissional com sistema anti-impacto que protege articulações em quedas e treinos intensos.",
    icon: "layers"
  },
  {
    title: "Octógono & Área de Grade Oficial",
    desc: "Grade e cage construídos nos padrões de grandes eventos para prática real de transição e clinch no MMA.",
    icon: "shield"
  },
  {
    title: "Estação de Sacos Pesados & Manoplas",
    desc: "Sacos de couro de 60kg a 100kg, teto-solo, puching balls e manoplas tailandesas de primeira linha.",
    icon: "target"
  },
  {
    title: "Ambiente 100% Climatizado",
    desc: "Ar-condicionado central em todo o espaço de treino, garantindo conforto térmico ideal mesmo no calor de Rondônia.",
    icon: "wind"
  },
  {
    title: "Vestiários Premium com Duchas Quentes",
    desc: "Vestiários masculino e feminino com armários individuais, duchas pressurizadas e higiene impecável.",
    icon: "bath"
  },
  {
    title: "Lounge & Loja de Equipamentos",
    desc: "Espaço de convivência, hidratação e aquisição de luvas, bandagens, kimonos e roupas oficiais BORÜ.",
    icon: "coffee"
  }
];

const SCHEDULE_DATA = [
  {
    day: "Segunda, Quarta e Sexta",
    periods: [
      { time: "16:00 - 17:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "tarde" },
      { time: "18:00 - 19:00", modality: "Muay Thai (KIDS)", level: "Infantil", instructor: "Felipe Borü", shift: "noite" },
      { time: "19:00 - 20:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "noite" },
      { time: "20:00 - 21:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "noite" }
    ]
  },
  {
    day: "Terça e Quinta",
    periods: [
      { time: "15:00 - 16:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "tarde" },
      { time: "19:00 - 20:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "noite" },
      { time: "20:00 - 21:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "noite" },
      { time: "22:30 - 23:30", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "noite" }
    ]
  },
  {
    day: "Sábado",
    periods: [
      { time: "08:00 - 09:00", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "manha" },
      { time: "12:30 - 13:30", modality: "Muay Thai (ADULTOS)", level: "Todos os Níveis", instructor: "Felipe Borü", shift: "tarde" }
    ]
  }
];

const FAQ_DATA = [
  {
    question: "Nunca pratiquei artes marciais na vida. O BORÜ é para mim?",
    answer: "Com certeza! Mais de 70% dos nossos novos alunos começam do zero absoluto. Nossas turmas são divididas por níveis técnicos, e os professores acompanham individualmente seus primeiros passos com respeito ao seu ritmo e segurança total."
  },
  {
    question: "Preciso ter equipamentos (luvas, kimono, caneleira) na primeira aula?",
    answer: "Não! Para a sua aula experimental, basta vir com uma roupa esportiva confortável (bermuda e camiseta). Nós emprestamos luvas higienizadas e fornecemos toda a orientação."
  },
  {
    question: "Como funciona o agendamento da Aula Experimental Gratuita?",
    answer: "Basta clicar em qualquer botão de 'Agendar Aula Gratuita' no site, preencher seu nome, modalidade e turno de preferência. Você será direcionado para o WhatsApp da nossa recepção para confirmar o dia e horário."
  },
  {
    question: "O BORÜ aceita planos corporativos como Wellhub (Gympass) ou TotalPass?",
    answer: "Sim! Aceitamos os principais planos corporativos com check-in diário liberado para as modalidades de artes marciais e funcional."
  },
  {
    question: "Qual a diferença entre fazer 1 modalidade e o 'Passaporte Livre'?",
    answer: "Com o plano de 1 modalidade você foca exclusivamente naquela arte (ex: Muay Thai). Já com o Passaporte Livre, você tem acesso ilimitado a todas as modalidades (Muay Thai, BJJ, MMA, Kickboxing e Funcional) e pode treinar em qualquer horário e turno."
  }
];

window.BORU_DATA = {
  lessons: INITIAL_LESSONS,
  schedules: SCHEDULE_DATA,
  instructors: INSTRUCTORS_DATA,
  facilities: FACILITIES_DATA,
  faq: FAQ_DATA
};

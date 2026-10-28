import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface MatchItem {
  id: string;
  date: string;
  opponent: string;
  avatar: string;
  tier: string;
  modality: string;
  result: 'VITÓRIA' | 'DERROTA';
  method: string;
  score: string;
  event: string;
  coachNote: string;
}

const mockMatches: MatchItem[] = [
  {
    id: 'm-1',
    date: 'Ontem, 19:30',
    opponent: 'Alexandre "Viper" Ramos',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    tier: 'Prajied Vermelho e Branco',
    modality: 'Muay Thai Tradicional',
    result: 'VITÓRIA',
    method: 'KO / Round 2 (02:14)',
    score: '+35 MMR',
    event: 'Sparring Supervisionado #14',
    coachNote: 'Excelente pêndulo e contra-golpe de direita com cotovelo de encontro. Guarda alta e reflexos rápidos.'
  },
  {
    id: 'm-2',
    date: '24 Out, 20:15',
    opponent: 'Marcus "Titan" Miller',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    tier: 'Faixa Marrom',
    modality: 'Jiu-Jitsu / No-Gi',
    result: 'VITÓRIA',
    method: 'Finalização (Armlock / Solo)',
    score: '+28 MMR',
    event: 'Open Mat de Sexta CT Borü',
    coachNote: 'Transição da guarda laçada direta para a chave de braço. Pressão de quadril e técnica perfeita.'
  },
  {
    id: 'm-3',
    date: '19 Out, 18:45',
    opponent: 'Dmitri "The Bear" Volkov',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    tier: 'Prajied Vermelho',
    modality: 'Boxe & Striking',
    result: 'DERROTA',
    method: 'Decisão Dividida (29-28)',
    score: '-14 MMR',
    event: 'Torneio Preparatório Interno Borü',
    coachNote: 'Luta equilibradíssima. Ajustar esquiva lateral contra canhotos e velocidade de retorno do jab.'
  },
  {
    id: 'm-4',
    date: '15 Out, 20:00',
    opponent: 'Renato "Caveira" Silva',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    tier: 'Prajied Azul Escuro',
    modality: 'Kickboxing K-1',
    result: 'VITÓRIA',
    method: 'TKO / Round 1 (Low Kicks)',
    score: '+40 MMR',
    event: 'Desafio Noturno de Striking',
    coachNote: 'Sequência de chutes na coxa com calejamento impecável e saída em ângulo seguro.'
  }
];

const attendanceWeeklyData = [
  { dia: 'Seg', treinos: 2, meta: 2 },
  { dia: 'Ter', treinos: 1, meta: 1 },
  { dia: 'Qua', treinos: 2, meta: 2 },
  { dia: 'Qui', treinos: 1, meta: 1 },
  { dia: 'Sex', treinos: 2, meta: 2 },
  { dia: 'Sáb', treinos: 1, meta: 1 },
];

const mmrEvolutionData = [
  { mes: 'Mai', mmr: 1840 },
  { mes: 'Jun', mmr: 2020 },
  { mes: 'Jul', mmr: 2190 },
  { mes: 'Ago', mmr: 2410 },
  { mes: 'Set', mmr: 2650 },
  { mes: 'Out', mmr: 2840 },
];

export function StudentPerformanceStatsTab({ aluno }: { aluno?: any }) {
  const [filterPeriod, setFilterPeriod] = useState<'30dias' | 'trimestre' | 'ano'>('30dias');

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#141416] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Analytics de Combate // CT Borü</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Estatísticas de Desempenho &amp; Evolução
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Acompanhe métricas consolidadas de assiduidade, aproveitamento de golpes, taxa de vitórias em sparrings e seu ranking consolidado de MMR para impulsionar sua evolução sob supervisão do Mestre Felipe Borü.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-base font-mono font-black text-emerald-400">
              87.5%
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Taxa de Vitória</span>
          </div>

          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-base font-mono font-black text-red-500">
              2,840
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">MMR Atual</span>
          </div>
        </div>
      </div>

      {/* GRADE DE CARDS KPI (4 MÉTRICAS PRINCIPAIS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Vitórias / Derrotas */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Recorde (W / L)</span>
            <span className="text-emerald-400 font-bold">+12% mês</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-emerald-400">28V - 4D</p>
          <p className="text-[11px] text-zinc-400 font-medium">87.5% de aproveitamento em lutas</p>
        </div>

        {/* Card 2: Pontuação MMR */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Classificação MMR</span>
            <span className="text-red-400 font-bold">Top CT Borü</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-red-500">2,840 MMR</p>
          <p className="text-[11px] text-zinc-400 font-medium">Divisão Ouro // Nak Muay de Ferro</p>
        </div>

        {/* Card 3: Aproveitamento de Golpes */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Precisão de Golpes</span>
            <span className="text-cyan-400 font-bold">Excelente</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-cyan-400">78.4%</p>
          <p className="text-[11px] text-zinc-400 font-medium">Golpes contundentes conectados</p>
        </div>

        {/* Card 4: Assiduidade Mensal */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Assiduidade</span>
            <span className="text-amber-400 font-bold">🔥 14d streak</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-amber-400">94.2%</p>
          <p className="text-[11px] text-zinc-400 font-medium">22 treinos no mês (Meta: 20)</p>
        </div>
      </div>

      {/* GRÁFICOS: FREQUÊNCIA SEMANAL & EVOLUÇÃO DE MMR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Assiduidade Semanal */}
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-[#141416] shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>📅</span> Frequência Semanal (Check-ins Cumpridos)
              </h3>
              <p className="text-xs text-zinc-400">Distribuição de treinos presenciais no tatame do CT Borü.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              9/9 Treinos Cumpridos
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dia" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141416',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="treinos" fill="#DC2626" radius={[6, 6, 0, 0]} name="Treinos Feitos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Evolução de MMR nos Últimos 6 Meses */}
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-[#141416] shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>📈</span> Curva de Evolução de MMR (Últimos 6 Meses)
              </h3>
              <p className="text-xs text-zinc-400">Crescimento contínuo de pontuação marcial no CT Borü.</p>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30">
              +1,000 MMR (+54%)
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mmrEvolutionData}>
                <defs>
                  <linearGradient id="boruMmrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} domain={['dataMin - 200', 'dataMax + 200']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141416',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mmr"
                  stroke="#EF4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#boruMmrGradient)"
                  name="Pontuação MMR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE SPARRINGS E FEEDBACKS DE TATAME */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#141416] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>🥊</span> Prontuário de Sparrings &amp; Avaliações Técnicas
            </h3>
            <p className="text-xs text-zinc-400">
              Registros individuais com notas técnicas assinadas pelo Mestre Felipe Borü.
            </p>
          </div>

          {/* Filtro de Período */}
          <div className="flex rounded-xl bg-[#1A1A1E] p-1 border border-zinc-800 self-start sm:self-auto">
            {(['30dias', 'trimestre', 'ano'] as const).map((periodo) => (
              <button
                key={periodo}
                type="button"
                onClick={() => setFilterPeriod(periodo)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                  filterPeriod === periodo
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {periodo === '30dias' ? '30 Dias' : periodo === 'trimestre' ? '3 Meses' : 'Ano'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Sparrings */}
        <div className="space-y-3">
          {mockMatches.map((match) => (
            <div
              key={match.id}
              className="p-4 rounded-xl border border-zinc-800 bg-[#1A1A1E] hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Oponente + Dados da Luta */}
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={match.avatar}
                  alt={match.opponent}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-white truncate">
                      vs {match.opponent}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-300">
                      {match.tier}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">• {match.date}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">
                    {match.event} • <strong className="text-zinc-300">{match.modality}</strong>
                  </p>
                  <p className="text-xs text-zinc-400 italic mt-1 bg-[#141416] p-2 rounded-lg border border-zinc-800">
                    <strong className="text-red-400 not-italic">Mestre Felipe Borü:</strong> "{match.coachNote}"
                  </p>
                </div>
              </div>

              {/* Resultado + MMR */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      match.result === 'VITÓRIA'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {match.result}
                  </span>
                  <span className="block text-[11px] text-zinc-400 font-mono mt-0.5">
                    {match.method}
                  </span>
                </div>

                <div
                  className={`px-3 py-2 rounded-xl font-mono font-black text-sm border ${
                    match.score.startsWith('+')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {match.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

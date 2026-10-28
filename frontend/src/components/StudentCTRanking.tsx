import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export interface CombatAttribute {
  attribute: string;
  value: number;
  fullMark: number;
}

export interface FighterRank {
  rank: number;
  id: string;
  name: string;
  nickname?: string;
  avatar: string;
  league: string;
  xp: number;
  streak: number;
  isCurrentUser?: boolean;
}

const mockAttributes: CombatAttribute[] = [
  { attribute: 'FORÇA', value: 88, fullMark: 100 },
  { attribute: 'TÉCNICA', value: 94, fullMark: 100 },
  { attribute: 'RESISTÊNCIA', value: 82, fullMark: 100 },
  { attribute: 'FLEXIBILIDADE', value: 76, fullMark: 100 },
  { attribute: 'DISCIPLINA', value: 98, fullMark: 100 },
];

const mockCTLeaderboard: FighterRank[] = [
  {
    rank: 1,
    id: 'u-1',
    name: 'Gabriel "Pitbull" Costa',
    nickname: 'PITBULL',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    league: 'Prajied Vermelho // Liga Titânio Borü',
    xp: 5420,
    streak: 14,
  },
  {
    rank: 2,
    id: 'u-2',
    name: 'Lucas "Predador" Siqueira',
    nickname: 'PREDADOR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    league: 'Prajied Marrom // Liga Diamante Borü',
    xp: 4980,
    streak: 9,
  },
  {
    rank: 3,
    id: 'u-3',
    name: 'Matheus "Spartan" Rocha',
    nickname: 'SPARTAN',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    league: 'Prajied Azul Escuro // Liga Ouro Borü',
    xp: 4620,
    streak: 7,
  },
  {
    rank: 4,
    id: 'u-4',
    name: 'Renan Barreto',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Azul Claro',
    xp: 4120,
    streak: 5,
  },
  {
    rank: 5,
    id: 'u-5',
    name: 'Thiago "Demolidor" Martins',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Azul Claro',
    xp: 3890,
    streak: 4,
  },
  {
    rank: 6,
    id: 'u-6',
    name: 'Rafael "Sombra" Lima',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Verde e Branco',
    xp: 3640,
    streak: 6,
  },
  {
    rank: 7,
    id: 'u-7',
    name: 'Bruno "Trator" Alencar',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Verde',
    xp: 3410,
    streak: 3,
  },
  {
    rank: 8,
    id: 'u-8',
    name: 'Felipe Santana',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Branco e Vermelho',
    xp: 3200,
    streak: 2,
  },
  {
    rank: 9,
    id: 'u-9',
    name: 'Caio "Viper" Silveira',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Branco',
    xp: 2950,
    streak: 1,
  },
  {
    rank: 10,
    id: 'u-10',
    name: 'Diego Mendes',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Branco',
    xp: 2810,
    streak: 4,
  },
  {
    rank: 14,
    id: 'u-14',
    name: 'Rodrigo "Tanque" Neves',
    nickname: 'TANQUE',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    league: 'Prajied Azul // Liga Prata Borü',
    xp: 2540,
    streak: 3,
  },
  {
    rank: 15,
    id: 'u-current',
    name: 'Ítalo Bergamin',
    nickname: 'GUERREIRO BORÜ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    league: 'Prajied Azul // Liga Prata Borü',
    xp: 2420,
    streak: 8,
    isCurrentUser: true,
  },
];

export default function StudentCTRanking({ aluno }: { aluno?: any } = {}) {
  const [filterPeriod, setFilterPeriod] = useState<'semanal' | 'mensal' | 'temporada'>('temporada');

  // Identifica o usuário logado e o colega de treino imediatamente acima no CT
  const rawUser = mockCTLeaderboard.find((u) => u.isCurrentUser) || mockCTLeaderboard[mockCTLeaderboard.length - 1];
  const currentUser = {
    ...rawUser,
    name: aluno?.nome || rawUser.name,
    league: aluno?.prajied || aluno?.plano || rawUser.league,
    streak: aluno?.diasSeguidos || rawUser.streak,
  };
  const rivalAbove = mockCTLeaderboard.find((u) => u.rank === currentUser.rank - 1) || mockCTLeaderboard[mockCTLeaderboard.length - 2];
  const xpDifference = rivalAbove ? rivalAbove.xp - currentUser.xp : 120;

  // Próximo nível e XP
  const currentXP = currentUser.xp;
  const nextLevelXP = 3000;
  const currentLevelBaseXP = 2000;
  const levelProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentXP - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100))
  );

  const top1 = mockCTLeaderboard[0];
  const top2 = mockCTLeaderboard[1];
  const top3 = mockCTLeaderboard[2];
  const restOfLeaderboard = mockCTLeaderboard.slice(3);

  return (
    <div className="space-y-6 pb-28">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#141416] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-500/30">
            <span>🥋 Ranking Interno // Exclusivo CT Borü</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Classificação Interna dos Guerreiros do CT
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Pontuação consolidada baseada em assiduidade, check-ins no tatame, evolução técnica e desempenho nos sparrings sob supervisão do Mestre Felipe Borü.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-base font-mono font-black text-amber-400">
              #{currentUser.rank}º LUGAR
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Sua Posição no CT</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA 1: CARTÃO DO GUERREIRO + RADAR DE ATRIBUTOS (DAWG STYLE) */}
        <div className="space-y-6">
          {/* Card do Usuário */}
          <section className="relative overflow-hidden rounded-3xl bg-[#141416] border border-zinc-800 p-5 shadow-2xl">
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-400 shadow-lg shadow-red-600/30">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] tracking-wider italic shadow-md border border-red-400/40">
                  NVL 18
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-red-950/60 text-red-400 border border-red-500/40 truncate">
                    {currentUser.league}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white italic tracking-tight truncate mt-1">
                  {currentUser.name}
                </h3>
                <p className="text-xs font-mono font-bold text-red-500 tracking-wider">
                  CARTEL // {currentUser.streak} DIAS SEGUIDOS 🔥
                </p>
              </div>
            </div>

            {/* Barra de Progresso Grossa Estilizada de XP */}
            <div className="mt-5 space-y-2 relative z-10">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-mono text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  PROGRESSO DO RANK NO CT
                </span>
                <span className="font-mono font-black italic text-yellow-400 text-sm">
                  {currentXP} <span className="text-zinc-500 text-xs">/ {nextLevelXP} XP</span>
                </span>
              </div>

              <div className="w-full h-4 bg-[#0A0B0E] rounded-full overflow-hidden p-0.5 border border-zinc-800 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-1000 ease-out"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Gráfico Radar de Atributos Marciais */}
          <section className="relative overflow-hidden rounded-3xl bg-[#141416] border border-zinc-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <span>⚡</span> ATRIBUTOS MARCIAIS (TATAME CT BORÜ)
              </h4>
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                RADAR
              </span>
            </div>

            <div className="w-full h-64 -my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={mockAttributes}>
                  <PolarGrid stroke="#27272A" />
                  <PolarAngleAxis
                    dataKey="attribute"
                    tick={{ fill: '#A1A1AA', fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    stroke="#3F3F46"
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Atributos"
                    dataKey="value"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    fill="#DC2626"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-zinc-800/70 text-center">
              {mockAttributes.map((attr) => (
                <div key={attr.attribute} className="p-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <span className="block text-[8px] font-mono font-bold text-zinc-400 truncate">
                    {attr.attribute.slice(0, 4)}
                  </span>
                  <span className="text-xs font-black italic text-white">
                    {attr.value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-[10px] text-zinc-500 font-mono mt-3">
              Última avaliação de tatame: há 2 dias • Mestre Felipe Borü
            </p>
          </section>
        </div>

        {/* COLUNA 2 & 3: PÓDIO E TABELA DE RANKING DO CT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtro de Período */}
          <div className="flex rounded-2xl bg-[#141416] p-1 border border-zinc-800">
            {(['semanal', 'mensal', 'temporada'] as const).map((periodo) => (
              <button
                key={periodo}
                type="button"
                onClick={() => setFilterPeriod(periodo)}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition ${
                  filterPeriod === periodo
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 italic'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {periodo === 'semanal' ? 'Semanal' : periodo === 'mensal' ? 'Mensal' : 'Temporada CT Borü'}
              </button>
            ))}
          </div>

          {/* O PÓDIO (TOP 3 - CT BORÜ) */}
          <section className="p-6 rounded-3xl bg-[#141416] border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <span>🏆</span> PÓDIO DO CT BORÜ ({filterPeriod.toUpperCase()})
              </h3>
              <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">
                LIGA ELITE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 items-end pt-6">
              {/* 2º LUGAR (PRATA) */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-slate-400 to-slate-100 shadow-xl shadow-slate-500/10">
                    <img
                      src={top2.avatar}
                      alt={top2.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-black font-black text-xs flex items-center justify-center border-2 border-white shadow">
                    2
                  </span>
                </div>
                <p className="text-[11px] font-black text-white italic text-center truncate w-full px-1">
                  {top2.nickname || top2.name.split(' ')[0]}
                </p>
                <span className="text-[10px] font-mono font-black text-slate-300">
                  {top2.xp} XP
                </span>

                <div className="w-full mt-3 h-24 rounded-t-2xl bg-gradient-to-b from-slate-400/25 via-slate-800/60 to-transparent border-t-2 border-x-2 border-slate-300/50 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-xl font-black italic text-slate-300">#2</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">PRATA</span>
                </div>
              </div>

              {/* 1º LUGAR (OURO - MAIOR / COROA) */}
              <div className="flex flex-col items-center -mt-6">
                <div className="text-3xl mb-1 animate-bounce">👑</div>
                <div className="relative mb-2">
                  <div className="w-20 h-20 rounded-full p-1.5 bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-200 shadow-2xl shadow-yellow-500/30 ring-4 ring-yellow-500/20">
                    <img
                      src={top1.avatar}
                      alt={top1.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-2 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-black font-black text-xs flex items-center justify-center border-2 border-yellow-100 shadow-xl">
                    1
                  </span>
                </div>
                <p className="text-xs font-black text-yellow-400 italic text-center truncate w-full px-1">
                  {top1.nickname || top1.name.split(' ')[0]}
                </p>
                <span className="text-xs font-mono font-black text-white">
                  {top1.xp} XP
                </span>

                <div className="w-full mt-3 h-32 rounded-t-2xl bg-gradient-to-b from-yellow-500/30 via-yellow-950/60 to-transparent border-t-4 border-x-2 border-yellow-500 flex flex-col items-center justify-center shadow-2xl shadow-yellow-500/20">
                  <span className="text-2xl font-black italic text-yellow-400">#1</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-yellow-500 font-bold">CAMPEÃO</span>
                </div>
              </div>

              {/* 3º LUGAR (BRONZE) */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-amber-700 to-orange-400 shadow-xl shadow-amber-700/10">
                    <img
                      src={top3.avatar}
                      alt={top3.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-amber-400 shadow">
                    3
                  </span>
                </div>
                <p className="text-[11px] font-black text-white italic text-center truncate w-full px-1">
                  {top3.nickname || top3.name.split(' ')[0]}
                </p>
                <span className="text-[10px] font-mono font-black text-amber-500">
                  {top3.xp} XP
                </span>

                <div className="w-full mt-3 h-20 rounded-t-2xl bg-gradient-to-b from-amber-700/25 via-amber-950/60 to-transparent border-t-2 border-x-2 border-amber-700/50 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-lg font-black italic text-amber-500">#3</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-600">BRONZE</span>
                </div>
              </div>
            </div>
          </section>

          {/* LISTA DE INTEGRANTES DO CT NA ARENA (4º LUGAR EM DIANTE) */}
          <section className="p-6 rounded-3xl bg-[#141416] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400">
                GUERREIROS DO CT BORÜ NO TATAME
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">ORDEM POR XP</span>
            </div>

            <div className="space-y-2">
              {restOfLeaderboard.map((fighter) => {
                const isMe = fighter.isCurrentUser;
                return (
                  <div
                    key={fighter.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                      isMe
                        ? 'bg-gradient-to-r from-red-950/50 via-red-900/25 to-[#1A1A1E] border-red-500/70 shadow-lg shadow-red-600/10 ring-1 ring-red-500/30'
                        : 'bg-[#1A1A1E] border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Posição + Avatar + Nome */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 font-mono font-black italic text-sm ${
                          isMe ? 'text-red-400' : 'text-zinc-500'
                        }`}
                      >
                        #{fighter.rank}
                      </span>

                      <img
                        src={fighter.avatar}
                        alt={fighter.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700/80 shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white italic truncate">
                            {fighter.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-black uppercase tracking-wider text-white">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 block truncate">
                          {fighter.league}
                        </span>
                      </div>
                    </div>

                    {/* XP + Streak */}
                    <div className="text-right shrink-0 pl-2">
                      <span className="block font-mono font-black italic text-sm text-yellow-400">
                        {fighter.xp} <span className="text-[10px] text-zinc-500">XP</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        🔥 {fighter.streak}d streak
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* BARRA FIXA DO RIVAL TRACKER DO CT BORÜ (STICKY BOTTOM) */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-[#141416]/95 backdrop-blur-xl border-t-2 border-red-600 p-3.5 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-red-500"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-red-600 text-white font-black text-[10px] flex items-center justify-center font-mono">
                #{currentUser.rank}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-red-400 block">
                STATUS NO CT // {currentUser.xp} XP
              </span>
              <p className="text-xs font-black text-white italic truncate">
                Faltam <span className="text-yellow-400 font-mono font-bold">{xpDifference} XP</span> para ultrapassar{' '}
                <span className="text-red-400 underline decoration-red-500/50">
                  {rivalAbove?.name || 'o colega à frente'}
                </span>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[11px] font-bold text-zinc-400">
              Faça check-in no tatame para subir no ranking!
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('treinos-checkin-tab-btn');
                if (el) el.click();
                else alert('Acesse a aba Treinos & Check-in para registrar sua presença no tatame!');
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase italic tracking-wider shadow-lg shadow-red-900/30 active:scale-95 transition"
            >
              BATER CHECK-IN 🔥
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

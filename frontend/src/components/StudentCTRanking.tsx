import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
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
  totalPresencas?: number;
  conquistasCount?: number;
  mmr?: number;
  isCurrentUser?: boolean;
}

const defaultAttributes: CombatAttribute[] = [
  { attribute: 'FORÇA', value: 88, fullMark: 100 },
  { attribute: 'TÉCNICA', value: 94, fullMark: 100 },
  { attribute: 'RESISTÊNCIA', value: 82, fullMark: 100 },
  { attribute: 'FLEXIBILIDADE', value: 76, fullMark: 100 },
  { attribute: 'DISCIPLINA', value: 98, fullMark: 100 },
];

export default function StudentCTRanking({ aluno }: { aluno?: any } = {}) {
  const [filterPeriod, setFilterPeriod] = useState<'semanal' | 'mensal' | 'temporada'>('temporada');
  const [atributos, setAtributos] = useState<CombatAttribute[]>(defaultAttributes);
  const [evalData, setEvalData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<FighterRank[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega avaliação de desempenho dada pelo Mestre Felipe Borü
  useEffect(() => {
    if (aluno?.id) {
      studentApi.getEvaluation(aluno.id)
        .then((res: any) => {
          if (res?.data) {
            setEvalData(res.data);
            setAtributos([
              { attribute: 'FORÇA', value: res.data.forca ?? 88, fullMark: 100 },
              { attribute: 'TÉCNICA', value: res.data.tecnica ?? 94, fullMark: 100 },
              { attribute: 'RESISTÊNCIA', value: res.data.resistencia ?? 82, fullMark: 100 },
              { attribute: 'FLEXIBILIDADE', value: res.data.flexibilidade ?? 76, fullMark: 100 },
              { attribute: 'DISCIPLINA', value: res.data.disciplina ?? 98, fullMark: 100 },
            ]);
          }
        })
        .catch(() => {});
    }
  }, [aluno?.id]);

  // Carrega o ranking oficial com os alunos reais cadastrados no banco de dados
  useEffect(() => {
    studentApi.getLeaderboard()
      .then((res: any) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const list: FighterRank[] = res.data.map((item: any, idx: number) => {
            const isMe = aluno?.id 
              ? item.id === aluno.id 
              : (aluno?.nome ? item.name.toLowerCase() === aluno.nome.toLowerCase() : false);
            return {
              rank: idx + 1,
              id: item.id,
              name: item.name,
              nickname: item.nickname || item.name.split(' ')[0].toUpperCase(),
              avatar: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=18181b&color=ef4444&bold=true&size=128`,
              league: item.league || `Prajied ${item.prajied || 'Branco'} // CT Borü`,
              xp: item.xp,
              streak: item.streak,
              totalPresencas: item.totalPresencas || 0,
              conquistasCount: item.conquistasCount || 0,
              mmr: item.mmr || 1500,
              isCurrentUser: isMe,
            };
          });

          // Se o aluno logado não estiver no ranking, adiciona-o
          const jaTemEu = list.some(f => f.isCurrentUser);
          if (!jaTemEu && aluno?.nome) {
            const meuRank: FighterRank = {
              rank: list.length + 1,
              id: aluno.id || 'u-current',
              name: aluno.nome,
              nickname: aluno.nome.split(' ')[0].toUpperCase(),
              avatar: aluno.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(aluno.nome)}&background=18181b&color=ef4444&bold=true&size=128`,
              league: `Prajied ${aluno.prajied || 'Branco'} // ${aluno.plano || 'CT Borü'}`,
              xp: 2420,
              streak: aluno.diasSeguidos || 5,
              totalPresencas: aluno.presencasMes || 0,
              conquistasCount: 0,
              mmr: 1500,
              isCurrentUser: true,
            };
            list.push(meuRank);
          }

          setLeaderboard(list);
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar ranking dos alunos:', err);
      })
      .finally(() => setLoading(false));
  }, [aluno?.id, aluno?.nome]);

  // Identifica o aluno atual no ranking
  const currentUser: FighterRank = leaderboard.find((u) => u.isCurrentUser) || (leaderboard.length > 0 ? leaderboard[Math.min(14, leaderboard.length - 1)] : {
    rank: 15,
    id: aluno?.id || 'u-current',
    name: aluno?.nome || 'Guerreiro Borü',
    nickname: (aluno?.nome || 'Guerreiro').split(' ')[0].toUpperCase(),
    avatar: aluno?.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(aluno?.nome || 'Guerreiro')}&background=18181b&color=ef4444&bold=true&size=128`,
    league: `Prajied ${aluno?.prajied || 'Branco'} // ${aluno?.plano || 'CT Borü'}`,
    xp: 2420,
    streak: aluno?.diasSeguidos || 5,
    isCurrentUser: true,
  });

  const currentIndex = leaderboard.findIndex((u) => u.id === currentUser.id);
  const rivalAbove = currentIndex > 0 ? leaderboard[currentIndex - 1] : null;
  const xpDifference = rivalAbove ? Math.max(10, rivalAbove.xp - currentUser.xp) : 120;

  // Próximo nível e XP
  const currentXP = currentUser.xp;
  const nextLevelXP = Math.ceil((currentXP + 1) / 500) * 500;
  const currentLevelBaseXP = nextLevelXP - 500;
  const levelProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentXP - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100))
  );

  const top1 = leaderboard[0] || currentUser;
  const top2 = leaderboard[1] || leaderboard[0] || currentUser;
  const top3 = leaderboard[2] || leaderboard[1] || currentUser;
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <div className="space-y-6 pb-28">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#141416] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-500/30">
            <span>🥋 Ranking Oficial // Tatame CT Borü</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Classificação Interna dos Guerreiros do CT
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Critérios Oficiais do Top: 📅 Assiduidade & Check-ins reais (+100 XP/treino) + 🥋 Avaliação Técnica & MMR do Mestre Felipe Borü + 🏅 Conquistas Desbloqueadas na Trilha do Nak Muay.
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
                  NVL {Math.max(1, Math.floor(currentUser.xp / 150))}
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                {evalData?.avaliadoPor ? `Avaliado por: ${evalData.avaliadoPor}` : 'Avaliado por: Mestre Felipe Borü'}
              </span>
            </div>

            <div className="w-full h-64 -my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={atributos}>
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
              {atributos.map((attr) => (
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
              Última avaliação de tatame: {evalData?.avaliadoEm ? new Date(evalData.avaliadoEm).toLocaleDateString('pt-BR') : 'recente'} • {evalData?.avaliadoPor || 'Mestre Felipe Borü'}
            </p>

            {evalData?.parecerMestre && (
              <div className="mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/90 italic flex items-start gap-2.5">
                <span className="text-base not-italic">🥋</span>
                <div>
                  <span className="font-bold font-mono text-[10px] uppercase text-yellow-400 block not-italic">
                    Parecer do Professor:
                  </span>
                  <span>"{evalData.parecerMestre}"</span>
                </div>
              </div>
            )}
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

            {loading ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Carregando guerreiros do tatame...
              </div>
            ) : (
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
                  <span className="text-[9px] font-mono text-zinc-400 mt-0.5 text-center px-1 truncate">
                    📅 {top2.totalPresencas || 0} tr. • 🥋 {top2.mmr || 1500} MMR • 🏅 {top2.conquistasCount || 0} conq.
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
                  <span className="text-[9px] font-mono text-yellow-300/80 mt-0.5 text-center px-1 truncate font-bold">
                    📅 {top1.totalPresencas || 0} tr. • 🥋 {top1.mmr || 1500} MMR • 🏅 {top1.conquistasCount || 0} conq.
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
                  <span className="text-[9px] font-mono text-zinc-400 mt-0.5 text-center px-1 truncate">
                    📅 {top3.totalPresencas || 0} tr. • 🥋 {top3.mmr || 1500} MMR • 🏅 {top3.conquistasCount || 0} conq.
                  </span>

                  <div className="w-full mt-3 h-20 rounded-t-2xl bg-gradient-to-b from-amber-700/25 via-amber-950/60 to-transparent border-t-2 border-x-2 border-amber-700/50 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-lg font-black italic text-amber-500">#3</span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-amber-600">BRONZE</span>
                  </div>
                </div>
              </div>
            )}
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
                        <span className="text-[9px] font-mono text-zinc-500 block truncate mt-0.5">
                          📅 {fighter.totalPresencas || 0} treinos • 🥋 {fighter.mmr || 1500} MMR • 🏅 {fighter.conquistasCount || 0} conquistas
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
                  {rivalAbove?.name || 'o guerreiro à frente'}
                </span>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[11px] font-bold text-zinc-400">
              Presenças (+100 XP), Avaliação do Mestre & Conquistas definem o Top!
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

import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export function StudentPerformanceStatsTab({ aluno }: { aluno?: any }) {
  const [filterPeriod, setFilterPeriod] = useState<'30dias' | 'trimestre' | 'ano'>('30dias');
  const [evalData, setEvalData] = useState<any>(null);
  const [matches] = useState<MatchItem[]>([]);

  useEffect(() => {
    if (aluno?.id) {
      studentApi.getEvaluation(aluno.id)
        .then((res: any) => {
          if (res?.data) {
            setEvalData(res.data);
          }
        })
        .catch(() => {});
    }
  }, [aluno?.id]);

  // Cálculo de lutas e taxa de vitórias
  const totalLutas = matches.length;
  const vitorias = matches.filter((m) => m.result === 'VITÓRIA').length;
  const derrotas = matches.filter((m) => m.result === 'DERROTA').length;
  const taxaVitoria = totalLutas > 0 ? `${Math.round((vitorias / totalLutas) * 100)}%` : '--';

  // Frequência semanal calculada a partir de presenças reais
  const presencasAluno = Array.isArray(aluno?.presencas) ? aluno.presencas : [];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasAbbr = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const attendanceWeeklyData = diasAbbr.map((dia) => ({ dia, treinos: 0 }));

  let treinosEstaSemana = 0;
  if (presencasAluno.length > 0) {
    const agora = new Date();
    const day = agora.getDay();
    const diff = agora.getDate() - (day === 0 ? 6 : day - 1);
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(diff);
    inicioSemana.setHours(0, 0, 0, 0);

    presencasAluno.forEach((p: any) => {
      const d = new Date(p.data);
      if (d >= inicioSemana && p.status === 'PRESENTE') {
        const dayName = diasSemana[d.getDay()];
        const item = attendanceWeeklyData.find((x) => x.dia === dayName);
        if (item) {
          item.treinos += 1;
          treinosEstaSemana += 1;
        }
      }
    });
  }

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
            Acompanhe métricas consolidadas de assiduidade, aproveitamento técnico, taxa de vitórias em sparrings e seu prontuário individual sob supervisão do Mestre Felipe Borü.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-base font-mono font-black text-emerald-400">
              {taxaVitoria}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Taxa de Vitória</span>
          </div>

          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-base font-mono font-black text-red-500">
              {evalData?.mmr ? evalData.mmr.toLocaleString('pt-BR') : '--'}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-bold">MMR Atual</span>
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sparrings Registrados */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Sparrings Registrados</span>
            <span className="text-red-400 font-bold">Tatame</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-white">{totalLutas}</p>
          <p className="text-[11px] text-zinc-400 font-medium">Lutas no prontuário</p>
        </div>

        {/* Card 2: Vitórias / Derrotas */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Cartel de Sparring</span>
            <span className="text-emerald-400 font-bold">{taxaVitoria}</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
            {vitorias}V <span className="text-zinc-600 font-normal">/</span> {derrotas}D
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">{totalLutas > 0 ? 'Confrontos computados' : 'Nenhuma luta registrada'}</p>
        </div>

        {/* Card 3: Precisão Técnica */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Precisão Técnica</span>
            <span className="text-cyan-400 font-bold">{evalData?.precisaoGolpes ? 'Avaliado' : '--'}</span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-cyan-400">
            {evalData?.precisaoGolpes ? `${evalData.precisaoGolpes}%` : '--'}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">Aproveitamento nos treinos</p>
        </div>

        {/* Card 4: Assiduidade Mensal */}
        <div className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-[#141416] shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">Assiduidade</span>
            <span className="text-amber-400 font-bold">
              {aluno?.diasSeguidos ? `🔥 ${aluno.diasSeguidos}d streak` : '--'}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-amber-400">
            {aluno?.porcentagemPresenca !== undefined && aluno?.porcentagemPresenca !== null ? `${aluno.porcentagemPresenca}%` : '--'}
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">
            {aluno?.presencasMes !== undefined ? `${aluno.presencasMes} presenças no mês` : 'Frequência do aluno'}
          </p>
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
              {treinosEstaSemana > 0 ? `${treinosEstaSemana} Treino(s) esta semana` : '0 Treinos esta semana'}
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dia" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} allowDecimals={false} />
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
              {evalData?.mmr ? `${evalData.mmr} MMR` : '--'}
            </span>
          </div>

          <div className="h-56 w-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[#1A1A1E]/30 border border-zinc-800/60">
            <span className="text-3xl text-zinc-600 mb-2">📈</span>
            <p className="text-xs text-zinc-400 font-semibold">Sem histórico de evolução acumulado</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
              A curva de evolução será traçada conforme os sparrings e avaliações periódicas do Mestre Felipe Borü.
            </p>
            {evalData?.mmr && (
              <span className="mt-3 text-xs font-mono font-bold text-red-400 bg-red-950/40 px-3 py-1 rounded-full border border-red-500/30">
                MMR Atual: {evalData.mmr}
              </span>
            )}
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

        {/* Lista de Sparrings ou Estado Vazio */}
        {matches.length === 0 ? (
          <div className="p-10 sm:p-14 text-center rounded-2xl border border-zinc-800/80 bg-[#1A1A1E]/40 space-y-3">
            <span className="text-3xl block">🥊</span>
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Nenhum Sparring ou Combate Registrado
              </h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Seus registros individuais de sparrings técnicos e lutas supervisionadas pelo Mestre Felipe Borü aparecerão aqui no prontuário conforme forem realizados no tatame.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800">
                Participe dos treinos presenciais para preencher seu prontuário marcial.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
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
        )}
      </div>
    </div>
  );
}

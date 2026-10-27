import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';

interface RankItem {
  id: string;
  name: string;
  required_checkins_min: number;
  required_checkins_max: number | null;
  badge_icon_url: string;
  reward_description?: string;
  order_index: number;
  alcançado?: boolean;
  atual?: boolean;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: string;
  badge_icon_url: string;
  trigger_type: string;
  trigger_value: string;
  xp_points: number;
  reward_text?: string;
  is_secret: boolean;
  current_progress: number;
  target_progress: number;
  progress_percent: number;
  status: 'locked' | 'in_progress' | 'completed';
  unlocked_at?: string | null;
  notified?: boolean;
}

interface StudentGamificationProps {
  alunoId: string;
  alunoNome: string;
  gamificacaoData: any;
  onRefresh?: () => void;
  isCombatHub?: boolean;
  onOpenSandbox?: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  TODAS: { label: 'Todas as Categorias', icon: '🏆' },
  FREQUENCIA: { label: 'Frequência & Consistência', icon: '🥊' },
  STREAKS: { label: 'Sequências (Streaks)', icon: '🔥' },
  HORARIOS: { label: 'Horários & Especiais', icon: '🌅' },
  SUPERACAO: { label: 'Superação', icon: '⚡' },
  COMUNIDADE: { label: 'Comunidade', icon: '🤝' },
};

export const StudentGamificationTab: React.FC<StudentGamificationProps> = ({
  alunoId,
  alunoNome,
  gamificacaoData,
  onRefresh,
  isCombatHub = false,
  onOpenSandbox,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'in_progress' | 'locked'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [celebrationItem, setCelebrationItem] = useState<AchievementItem | null>(null);
  const [copiadoMsg, setCopiadoMsg] = useState(false);

  const ranks: RankItem[] = gamificacaoData?.ranks || [];
  const conquistas: AchievementItem[] = gamificacaoData?.conquistas || [];
  const rankAtual: RankItem | null = gamificacaoData?.rankAtual || null;
  const proximoRank: RankItem | null = gamificacaoData?.proximoRank || null;
  const progressoRank: number = gamificacaoData?.progressoRank ?? 0;
  const checkinsFaltantes: number = gamificacaoData?.checkinsFaltantesProximoRank ?? 0;
  const totalPresencas: number = gamificacaoData?.totalPresencas ?? 0;
  const streak: number = gamificacaoData?.streak ?? 0;
  const streakSemanas: number = gamificacaoData?.streakSemanas ?? 0;
  const xpTotal: number = gamificacaoData?.xpTotal ?? 0;
  const resumo = gamificacaoData?.resumoConquistas || {
    total: conquistas.length,
    desbloqueadas: conquistas.filter((c) => c.status === 'completed').length,
    emProgresso: conquistas.filter((c) => c.status === 'in_progress').length,
    bloqueadas: conquistas.filter((c) => c.status === 'locked').length,
  };

  // Dispara automaticamente o Modal de Celebração ("Level Up!") quando há conquistas recém-desbloqueadas
  useEffect(() => {
    const recem: AchievementItem[] = gamificacaoData?.recemDesbloqueadas || [];
    const naoNotificadas = recem.filter((r) => !r.notified);
    if (naoNotificadas.length > 0 && !celebrationItem) {
      setCelebrationItem(naoNotificadas[0]);
    }
  }, [gamificacaoData]);

  const handleCloseCelebration = async () => {
    if (celebrationItem && alunoId) {
      try {
        await studentApi.markGamificationNotified(alunoId, [celebrationItem.id]);
        if (onRefresh) onRefresh();
      } catch {
        // Silencioso
      }
    }
    setCelebrationItem(null);
  };

  const handleShareAchievement = async (item: AchievementItem) => {
    const textoShare = `🥊🔥 LEVEL UP NA TRILHA DO NAK MUAY!\n\nAcabei de desbloquear a conquista "${item.badge_icon_url} ${item.title}" (${item.description})!\n🏅 Rank Atual: ${rankAtual?.badge_icon_url || '🥊'} ${rankAtual?.name || 'Guerreiro'}\n⚡ XP Total: ${xpTotal} XP | 🔥 Sequência: ${streak} treinos!\n\n#MuayThai #TrilhaDoNakMuay #Disciplina`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Conquista Desbloqueada: ${item.title}`,
          text: textoShare,
        });
        return;
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(textoShare);
      setCopiadoMsg(true);
      setTimeout(() => setCopiadoMsg(false), 3000);
    } catch {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textoShare)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleShareWhatsApp = (item: AchievementItem) => {
    const textoShare = `🥊🔥 *LEVEL UP NA TRILHA DO NAK MUAY!*\n\n Guerreiro(a) *${alunoNome}* desbloqueou a conquista: *${item.badge_icon_url} ${item.title}*!\n_"${item.description}"_\n\n🏆 *Rank Atual:* ${rankAtual?.badge_icon_url || '🥊'} ${rankAtual?.name || 'Nak Muay'}\n⚡ *XP Acumulado:* ${xpTotal} XP\n🔥 *Streak Ativo:* ${streak} treinos seguidos!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(textoShare)}`, '_blank');
  };

  const conquistasFiltradas = conquistas.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'TODAS' && c.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Sandbox Exclusivo para Combat-Hub */}
      {isCombatHub && onOpenSandbox && (
        <div className="bg-gradient-to-r from-amber-500/20 via-red-600/20 to-purple-600/20 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
              🎮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500 text-black">
                  Combat-Hub Showcase
                </span>
                <h4 className="text-white font-black text-sm sm:text-base">
                  Modo Sandbox Interativo Disponível
                </h4>
              </div>
              <p className="text-zinc-300 text-xs mt-0.5">
                Simule check-ins em tempo real, avance semanas/meses e teste o desbloqueio instantâneo de Ranks e das 30 Conquistas.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSandbox}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 shrink-0"
          >
            🎮 Visualizar Demo Interativa
          </button>
        </div>
      )}

      {/* HERO CARD: RANK ATUAL & BARRA DE PROGRESSO DA TRILHA DO NAK MUAY */}
      <div className="bg-gradient-to-br from-[#1A1A1E] via-[#16161A] to-red-950/30 border border-zinc-800 rounded-2xl p-5 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Esquerda: Insígnia do Rank Atual */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-600/30 to-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-4xl sm:text-5xl shadow-xl shadow-red-950/40 shrink-0">
              {rankAtual?.badge_icon_url || '🥊'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  Trilha do Nak Muay
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ⚡ {xpTotal} XP
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
                {rankAtual?.name || 'Iniciante do Tatame'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
                {rankAtual?.reward_description ||
                  'Continue marcando presença confirmada no tatame para evoluir seu nível na Trilha do Nak Muay!'}
              </p>
            </div>
          </div>

          {/* Direita: Contadores de Streak, Presenças e Conquistas */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-[#121215]/90 border border-zinc-800/90 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xl sm:text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
                <span>🔥</span>
                <span>{streak}</span>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">
                Streak Ativo
              </p>
              <p className="text-[9px] text-zinc-500">{streakSemanas} sem. seguidas</p>
            </div>

            <div className="bg-[#121215]/90 border border-zinc-800/90 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-1">
                <span>🥋</span>
                <span>{totalPresencas}</span>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">
                Check-ins
              </p>
              <p className="text-[9px] text-zinc-500">Confirmados</p>
            </div>

            <div className="bg-[#121215]/90 border border-zinc-800/90 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <span>🏅</span>
                <span>
                  {resumo.desbloqueadas}/{resumo.total}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-1">
                Conquistas
              </p>
              <p className="text-[9px] text-zinc-500">{resumo.emProgresso} em curso</p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso para o Próximo Rank */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-300">
                Progresso para o próximo nível:
              </span>
              {proximoRank ? (
                <span className="font-black text-amber-400">
                  {proximoRank.badge_icon_url} {proximoRank.name} ({proximoRank.required_checkins_min} check-ins)
                </span>
              ) : (
                <span className="font-black text-emerald-400">
                  👑 Nível Máximo Alcançado (Lenda do Campo!)
                </span>
              )}
            </div>
            <span className="font-black text-white">
              {proximoRank
                ? `Faltam ${checkinsFaltantes} check-in${checkinsFaltantes === 1 ? '' : 's'} (${progressoRank}%)`
                : '100% Completo'}
            </span>
          </div>

          <div className="w-full h-3.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-700"
              style={{ width: `${Math.max(4, progressoRank)}%` }}
            />
          </div>
        </div>
      </div>

      {/* LINHA DO TEMPO DOS 6 RANKS DA TRILHA DO NAK MUAY */}
      <div className="bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>🗺️</span>
              <span>Níveis da Trilha do Nak Muay</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Evolua de Iniciante do Tatame até Lenda do Campo conforme acumula presenças confirmadas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ranks.map((r, idx) => {
            const atingido = totalPresencas >= r.required_checkins_min;
            const isCurrent =
              totalPresencas >= r.required_checkins_min &&
              (r.required_checkins_max === null || totalPresencas <= r.required_checkins_max);

            return (
              <div
                key={r.id || idx}
                className={`rounded-xl p-3.5 border transition relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-gradient-to-b from-amber-500/20 to-red-950/30 border-amber-500 shadow-lg shadow-amber-500/10'
                    : atingido
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-[#121215]/70 border-zinc-800/80 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-2xl">{r.badge_icon_url}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-amber-500 text-black'
                          : atingido
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isCurrent ? 'Atual' : atingido ? 'Concluído' : `Nível ${idx + 1}`}
                    </span>
                  </div>
                  <h4 className="font-black text-white text-xs sm:text-sm leading-snug">
                    {r.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/80">
                  <p className="text-[10px] font-bold text-zinc-400">
                    {r.required_checkins_max
                      ? `${r.required_checkins_min} a ${r.required_checkins_max} treinos`
                      : `${r.required_checkins_min}+ treinos`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VITRINE DE CONQUISTAS (30 CONQUISTAS DESBLOQUEÁVEIS) */}
      <div className="bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>🏆</span>
              <span>Vitrine de Conquistas ({conquistasFiltradas.length})</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Clique em qualquer conquista desbloqueada para abrir o certificado de celebração e compartilhar!
            </p>
          </div>

          {/* Filtro por Status */}
          <div className="flex flex-wrap gap-1.5 bg-[#121215] p-1.5 rounded-xl border border-zinc-800">
            {[
              { id: 'ALL', label: `Todas (${resumo.total})` },
              { id: 'completed', label: `✅ Desbloqueadas (${resumo.desbloqueadas})` },
              { id: 'in_progress', label: `⏳ Em Andamento (${resumo.emProgresso})` },
              { id: 'locked', label: `🔒 Bloqueadas (${resumo.bloqueadas})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Object.entries(CATEGORY_LABELS).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition flex items-center gap-1.5 ${
                categoryFilter === key
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          ))}
        </div>

        {/* Grid das Conquistas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {conquistasFiltradas.map((item) => {
            const isUnlocked = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isUnlocked) setCelebrationItem(item);
                }}
                className={`rounded-2xl p-4 border transition relative flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-emerald-950/30 via-[#141418] to-amber-950/20 border-emerald-500/50 cursor-pointer hover:border-amber-400 hover:scale-[1.01]'
                    : isInProgress
                    ? 'bg-[#141418] border-amber-500/30'
                    : 'bg-[#121215]/60 border-zinc-800/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                        isUnlocked
                          ? 'bg-emerald-500/20 border-emerald-500/40'
                          : isInProgress
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-zinc-900 border-zinc-800 grayscale'
                      }`}
                    >
                      {item.is_secret && !isUnlocked ? '❓' : item.badge_icon_url}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          {CATEGORY_LABELS[item.category]?.label || item.category}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isUnlocked
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isInProgress
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          +{item.xp_points} XP
                        </span>
                      </div>

                      <h4 className="font-black text-white text-sm mt-1 truncate">
                        {item.is_secret && !isUnlocked ? 'Conquista Secreta' : item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {item.is_secret && !isUnlocked
                          ? 'Continue treinando e superando seus limites para revelar este segredo.'
                          : item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progresso da Conquista */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span
                      className={`font-bold ${
                        isUnlocked
                          ? 'text-emerald-400'
                          : isInProgress
                          ? 'text-amber-300'
                          : 'text-zinc-500'
                      }`}
                    >
                      {isUnlocked
                        ? '✅ Conquista Desbloqueada!'
                        : isInProgress
                        ? '⏳ Em andamento'
                        : '🔒 Bloqueada'}
                    </span>
                    <span className="font-black text-zinc-300">
                      {item.current_progress} / {item.target_progress} ({item.progress_percent}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                          : isInProgress
                          ? 'bg-amber-500'
                          : 'bg-zinc-700'
                      }`}
                      style={{ width: `${item.progress_percent}%` }}
                    />
                  </div>

                  {isUnlocked && (
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-amber-300/90 font-semibold">
                        🎁 {item.reward_text || `+${item.xp_points} XP`}
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 underline">
                        Celebrar / Compartilhar →
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE CELEBRAÇÃO ("LEVEL UP!" / CONQUISTA DESBLOQUEADA) */}
      {celebrationItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#1E1E24] to-[#121215] border-2 border-amber-500 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center relative shadow-2xl shadow-amber-500/20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-widest mb-4">
              <span>🎉 LEVEL UP!</span>
              <span>•</span>
              <span>+{celebrationItem.xp_points} XP</span>
            </div>

            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/30 to-red-600/30 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-xl mb-4">
              {celebrationItem.badge_icon_url}
            </div>

            <h3 className="text-2xl font-black text-white">
              {celebrationItem.title}
            </h3>
            <p className="text-sm text-zinc-300 mt-2">
              {celebrationItem.description}
            </p>

            {celebrationItem.reward_text && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <p className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  🎁 Recompensa Desbloqueada
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {celebrationItem.reward_text}
                </p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-around text-xs text-zinc-400">
              <div>
                <p className="font-bold text-white">{rankAtual?.badge_icon_url} {rankAtual?.name}</p>
                <p className="text-[10px]">Rank Atual</p>
              </div>
              <div>
                <p className="font-bold text-amber-400">⚡ {xpTotal} XP</p>
                <p className="text-[10px]">Pontuação Total</p>
              </div>
              <div>
                <p className="font-bold text-orange-400">🔥 {streak} treinos</p>
                <p className="text-[10px]">Sequência</p>
              </div>
            </div>

            {copiadoMsg && (
              <div className="mt-3 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-1.5">
                ✅ Texto da conquista copiado para a área de transferência!
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => handleShareWhatsApp(celebrationItem)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <span>📲</span>
                <span>Compartilhar WhatsApp</span>
              </button>
              <button
                onClick={() => handleShareAchievement(celebrationItem)}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                📋 Copiar Card
              </button>
            </div>

            <button
              onClick={handleCloseCelebration}
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Continuar na Trilha do Nak Muay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

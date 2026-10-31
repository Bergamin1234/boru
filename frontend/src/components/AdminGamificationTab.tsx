import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { FileUploadInput, BadgeOrImagePreview } from './FileUploadInput';

interface AdminGamificationProps {
  cargoUsuario?: string; // 'ADMIN' | 'PROFESSOR'
  professorId?: string;
  alunosLista?: any[];
  isCombatHub?: boolean;
  onOpenSandbox?: () => void;
  onRefreshDashboard?: () => void;
}

const TRIGGER_TYPES = [
  { value: 'TOTAL_CHECKINS', label: 'Total Acumulado de Check-ins' },
  { value: 'WEEKLY_CHECKINS', label: 'Check-ins na Mesma Semana' },
  { value: 'PERFECT_WEEK', label: 'Semanas Perfeitas (100% do Plano)' },
  { value: 'MONTHLY_CHECKINS', label: 'Check-ins no Mesmo Mês' },
  { value: 'STREAK_WEEKS', label: 'Semanas Consecutivas (Streak)' },
  { value: 'STREAK_WEEKS_NO_MISS', label: 'Semanas Seguidas Sem Falta' },
  { value: 'ADVERSE_WEATHER', label: 'Treino em Clima Adverso (Chuva ou Sol)' },
  { value: 'RETURN_AFTER_ABSENCE', label: 'Retorno Pós-Lesão / Ausência' },
  { value: 'SHIFT_MORNING', label: 'Check-ins no Turno da Manhã' },
  { value: 'SHIFT_AFTERNOON', label: 'Check-ins no Turno da Tarde' },
  { value: 'SHIFT_NIGHT', label: 'Check-ins no Turno da Noite' },
  { value: 'WEEKDAY_FRIDAY', label: 'Treinos na Sexta-feira (Sextou)' },
  { value: 'WEEKDAY_SATURDAY', label: 'Treinos no Sábado (Guerreiro de Sábado)' },
  { value: 'SPECIAL_EVENT', label: 'Feriado / Evento Especial / Wai Kru' },
  { value: 'ARRIVED_EARLY', label: 'Chegou com Antecedência (Pontualidade)' },
  { value: 'DOUBLE_DAY', label: 'Dose Dupla (2 Treinos no Mesmo Dia)' },
  { value: 'IRON_MONTH_DEC_JAN', label: 'Mês de Ferro (Dezembro / Janeiro)' },
  { value: 'WINTER_TRAINING', label: 'Calejamento de Inverno (Junho a Agosto)' },
  { value: 'PRE_EXAM_DEDICATION', label: 'Dedicação Pré-Exame (Fiel ao Canto)' },
  { value: 'BROUGHT_FRIEND', label: 'Trouxe Amigo para Treinar (Novo Sparring)' },
  { value: 'REFERRAL_ENROLLMENTS', label: 'Indicações / Amigos (Mestre de Cerimônia)' },
  { value: 'PARTNER_CHECKINS', label: 'Check-ins com Parceiro (Dupla Implacável)' },
  { value: 'GUARDIAN_CT', label: 'Guardião do CT (12 Meses / 120+ Treinos)' },
];

const CATEGORIES = [
  { value: 'FREQUENCIA', label: 'Frequência & Consistência' },
  { value: 'STREAKS', label: 'Sequências (Streaks)' },
  { value: 'HORARIOS', label: 'Horários & Especiais' },
  { value: 'SUPERACAO', label: 'Superação' },
  { value: 'COMUNIDADE', label: 'Comunidade' },
];

export const AdminGamificationTab: React.FC<AdminGamificationProps> = ({
  cargoUsuario = 'ADMIN',
  professorId,
  isCombatHub = false,
  onOpenSandbox,
  onRefreshDashboard,
}) => {
  const isAdmin = cargoUsuario === 'ADMIN';

  const [subTab, setSubTab] = useState<'aprovacao' | 'ranks' | 'conquistas' | 'avaliacao'>('aprovacao');
  const [ranks, setRanks] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [resumoAlunos, setResumoAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Estado Aprovação Rápida do Professor
  const [selectedAlunoId, setSelectedAlunoId] = useState('');
  const [selectedAchievementId, setSelectedAchievementId] = useState('');
  const [registrarCheckinEsp, setRegistrarCheckinEsp] = useState(true);
  const [shiftEsp, setShiftEsp] = useState<'MANHA' | 'TARDE' | 'NOITE'>('NOITE');
  const [flagClima, setFlagClima] = useState(false);
  const [flagPontual, setFlagPontual] = useState(false);
  const [flagEvento, setFlagEvento] = useState(false);
  const [parceiroId, setParceiroId] = useState('');
  const [buscaAlunoRank, setBuscaAlunoRank] = useState('');
  const [buscaAlunoEspecial, setBuscaAlunoEspecial] = useState('');
  // Estado Avaliação de Desempenho e Radar de Combate
  const [alunoAvaliacaoId, setAlunoAvaliacaoId] = useState('');
  const [evalForca, setEvalForca] = useState(88);
  const [evalTecnica, setEvalTecnica] = useState(94);
  const [evalResistencia, setEvalResistencia] = useState(82);
  const [evalFlexibilidade, setEvalFlexibilidade] = useState(76);
  const [evalDisciplina, setEvalDisciplina] = useState(98);
  const [evalMmr, setEvalMmr] = useState(2840);
  const [evalPrecisao, setEvalPrecisao] = useState(78.4);
  const [evalParecer, setEvalParecer] = useState('Excelente foco nos sparrings e ótimo controle de distância.');
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [avaliacaoFeedback, setAvaliacaoFeedback] = useState<string | null>(null);
  const [buscaAlunoAvaliacao, setBuscaAlunoAvaliacao] = useState('');

  // Ao selecionar um aluno para avaliação, busca a nota atual dele no backend
  useEffect(() => {
    if (!alunoAvaliacaoId) return;
    adminApi.getStudentEvaluation(alunoAvaliacaoId)
      .then((res: any) => {
        if (res.data) {
          setEvalForca(res.data.forca ?? 85);
          setEvalTecnica(res.data.tecnica ?? 90);
          setEvalResistencia(res.data.resistencia ?? 82);
          setEvalFlexibilidade(res.data.flexibilidade ?? 76);
          setEvalDisciplina(res.data.disciplina ?? 95);
          setEvalMmr(res.data.mmr ?? 2840);
          setEvalPrecisao(res.data.precisaoGolpes ?? 78.4);
          setEvalParecer(res.data.parecerMestre ?? '');
        }
      })
      .catch((e: any) => console.error('Erro ao buscar avaliação do aluno:', e));
  }, [alunoAvaliacaoId]);

  const handleSalvarAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoAvaliacaoId) {
      alert('Selecione um aluno para avaliar.');
      return;
    }
    setSalvandoAvaliacao(true);
    try {
      await adminApi.saveStudentEvaluation(alunoAvaliacaoId, {
        forca: evalForca,
        tecnica: evalTecnica,
        resistencia: evalResistencia,
        flexibilidade: evalFlexibilidade,
        disciplina: evalDisciplina,
        mmr: evalMmr,
        precisaoGolpes: evalPrecisao,
        parecerMestre: evalParecer,
        avaliadoPor: cargoUsuario === 'ADMIN' ? 'Mestre / Coordenação Técnica' : 'Professor Responsável'
      });
      setAvaliacaoFeedback('Avaliação salva com sucesso! Os novos atributos já estão visíveis no Portal do Aluno.');
      setTimeout(() => setAvaliacaoFeedback(null), 5000);
    } catch (e) {
      alert('Erro ao salvar avaliação de desempenho do aluno.');
    } finally {
      setSalvandoAvaliacao(false);
    }
  };


  // Modal / Form de Rank (Admin CRUD)
  const [editingRank, setEditingRank] = useState<any | null>(null);
  const [rankForm, setRankForm] = useState({
    name: '',
    required_checkins_min: 1,
    required_checkins_max: '' as string | number,
    badge_icon_url: '🥊',
    reward_description: '',
    order_index: 1,
    is_active: true,
  });

  // Modal / Form de Conquista (Admin CRUD)
  const [editingAch, setEditingAch] = useState<any | null>(null);
  const [filtroCatConquista, setFiltroCatConquista] = useState('TODAS');
  const [achForm, setAchForm] = useState({
    title: '',
    description: '',
    category: 'FREQUENCIA',
    badge_icon_url: '🏅',
    trigger_type: 'TOTAL_CHECKINS',
    target: 1,
    xp_points: 100,
    reward_text: '+100 XP',
    is_secret: false,
    is_active: true,
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [configRes, resumoRes] = await Promise.all([
        adminApi.getGamificationConfig(),
        adminApi.getStudentsGamificationSummary(),
      ]);
      setRanks(configRes.data.ranks || []);
      setAchievements(configRes.data.achievements || []);
      setResumoAlunos(resumoRes.data || []);
      if (!selectedAlunoId && resumoRes.data?.length > 0) {
        setSelectedAlunoId(resumoRes.data[0].alunoId);
      }
    } catch {
      mostrarMsg('erro', 'Erro ao carregar dados de gamificação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarMsg = (tipo: 'ok' | 'erro', texto: string) => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleAprovarEspecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlunoId) {
      mostrarMsg('erro', 'Selecione um aluno.');
      return;
    }
    try {
      await adminApi.approveSpecialGamification({
        alunoId: selectedAlunoId,
        achievementId: selectedAchievementId || undefined,
        registrarCheckinEspecial: registrarCheckinEsp,
        shift: shiftEsp,
        adverse_weather: flagClima,
        arrived_early: flagPontual,
        is_special_event: flagEvento,
        accompanied_by_user_id: parceiroId || undefined,
        checked_by_teacher_id: professorId || 'PROFESSOR',
      });
      mostrarMsg('ok', 'Check-in especial / Conquista validada com sucesso na Trilha do Nak Muay!');
      setSelectedAchievementId('');
      setFlagClima(false);
      setFlagPontual(false);
      setFlagEvento(false);
      setParceiroId('');
      await carregarDados();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch {
      mostrarMsg('erro', 'Falha ao registrar aprovação especial.');
    }
  };

  // Handlers CRUD Ranks
  const handleEditRankClick = (r: any) => {
    setEditingRank(r);
    setRankForm({
      name: r.name,
      required_checkins_min: r.required_checkins_min,
      required_checkins_max: r.required_checkins_max ?? '',
      badge_icon_url: r.badge_icon_url || '🥊',
      reward_description: r.reward_description || '',
      order_index: r.order_index || 1,
      is_active: r.is_active ?? true,
    });
  };

  const handleSaveRank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...rankForm,
        required_checkins_min: Number(rankForm.required_checkins_min),
        required_checkins_max:
          rankForm.required_checkins_max === '' ? null : Number(rankForm.required_checkins_max),
        order_index: Number(rankForm.order_index),
      };

      if (editingRank?.id) {
        await adminApi.updateGamificationRank(editingRank.id, payload);
        mostrarMsg('ok', 'Rank atualizado com sucesso!');
      } else {
        await adminApi.createGamificationRank(payload);
        mostrarMsg('ok', 'Novo Rank criado na Trilha do Nak Muay!');
      }
      setEditingRank(null);
      setRankForm({
        name: '',
        required_checkins_min: 1,
        required_checkins_max: '',
        badge_icon_url: '🥊',
        reward_description: '',
        order_index: ranks.length + 1,
        is_active: true,
      });
      await carregarDados();
    } catch {
      mostrarMsg('erro', 'Erro ao salvar Rank.');
    }
  };

  const handleDeleteRank = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este Rank?')) return;
    try {
      await adminApi.deleteGamificationRank(id);
      mostrarMsg('ok', 'Rank excluído.');
      await carregarDados();
    } catch {
      mostrarMsg('erro', 'Erro ao excluir Rank.');
    }
  };

  // Handlers CRUD Conquistas
  const handleEditAchClick = (a: any) => {
    let targetVal = 1;
    try {
      const parsed = JSON.parse(a.trigger_value || '{}');
      targetVal = Number(parsed.target) || 1;
    } catch {
      targetVal = 1;
    }
    setEditingAch(a);
    setAchForm({
      title: a.title,
      description: a.description,
      category: a.category || 'FREQUENCIA',
      badge_icon_url: a.badge_icon_url || '🏅',
      trigger_type: a.trigger_type || 'TOTAL_CHECKINS',
      target: targetVal,
      xp_points: a.xp_points || 100,
      reward_text: a.reward_text || '',
      is_secret: Boolean(a.is_secret),
      is_active: a.is_active ?? true,
    });
  };

  const handleSaveAch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: achForm.title,
        description: achForm.description,
        category: achForm.category,
        badge_icon_url: achForm.badge_icon_url,
        trigger_type: achForm.trigger_type,
        trigger_value: JSON.stringify({ target: Number(achForm.target) || 1 }),
        xp_points: Number(achForm.xp_points) || 100,
        reward_text: achForm.reward_text,
        is_secret: achForm.is_secret,
        is_active: achForm.is_active,
      };

      if (editingAch?.id) {
        await adminApi.updateGamificationAchievement(editingAch.id, payload);
        mostrarMsg('ok', 'Conquista atualizada com sucesso!');
      } else {
        await adminApi.createGamificationAchievement(payload);
        mostrarMsg('ok', 'Nova Conquista adicionada ao sistema!');
      }
      setEditingAch(null);
      setAchForm({
        title: '',
        description: '',
        category: 'FREQUENCIA',
        badge_icon_url: '🏅',
        trigger_type: 'TOTAL_CHECKINS',
        target: 1,
        xp_points: 100,
        reward_text: '+100 XP',
        is_secret: false,
        is_active: true,
      });
      await carregarDados();
    } catch {
      mostrarMsg('erro', 'Erro ao salvar Conquista.');
    }
  };

  const handleDeleteAch = async (id: string) => {
    if (!window.confirm('Deseja realmente remover esta Conquista?')) return;
    try {
      await adminApi.deleteGamificationAchievement(id);
      mostrarMsg('ok', 'Conquista removida.');
      await carregarDados();
    } catch {
      mostrarMsg('erro', 'Erro ao excluir Conquista.');
    }
  };

  // Resetar para padrão e Exportar JSON
  const handleResetPadrao = async () => {
    if (
      !window.confirm(
        'Restaurar os 6 Ranks e 30 Conquistas padrão da Trilha do Nak Muay? (Customizações nas regras serão redefinidas para o template original)'
      )
    )
      return;
    try {
      await adminApi.resetGamificationDefault();
      mostrarMsg('ok', 'Template padrão restaurado com sucesso (6 Ranks e 30 Conquistas)!');
      await carregarDados();
    } catch {
      mostrarMsg('erro', 'Erro ao restaurar template padrão.');
    }
  };

  const handleExportJson = async () => {
    try {
      const res = await adminApi.exportGamificationJson();
      const jsonString = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'trilha-do-nak-muay-config.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      mostrarMsg('ok', 'Arquivo JSON de configuração exportado com sucesso!');
    } catch {
      mostrarMsg('erro', 'Erro ao exportar configuração JSON.');
    }
  };

  const alunosFiltrados = resumoAlunos.filter((a) =>
    a.nome.toLowerCase().includes(buscaAlunoRank.toLowerCase())
  );

  const achievementsFiltrados = achievements.filter(
    (a) => filtroCatConquista === 'TODAS' || a.category === filtroCatConquista
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header do Módulo */}
      <div className="bg-gradient-to-r from-[#1A1A1E] via-[#18181C] to-red-950/30 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
              Módulo de Gamificação
            </span>
            {isCombatHub && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500 text-black">
                Combat-Hub White-Label
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white mt-2">
            🏆 Trilha do Nak Muay — Gestão & Aprovação Rápida
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Acompanhe o Rank e Streak dos alunos, valide check-ins especiais e personalize os 6 Ranks e 30 Conquistas com upload de badges.
          </p>
        </div>

        {/* Botões de Ação Rápida (Sandbox, Export JSON, Reset) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isCombatHub && onOpenSandbox && (
            <button
              onClick={onOpenSandbox}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
            >
              🎮 Visualizar Demo Interativa
            </button>
          )}
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition border border-zinc-700"
          >
            📦 Exportar Configuração JSON
          </button>
          {isAdmin && (
            <button
              onClick={handleResetPadrao}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/50 text-zinc-300 hover:text-red-300 font-bold text-xs transition border border-zinc-800"
            >
              🔄 Resetar para Padrão
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          <span>{feedback.texto}</span>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Sub-navegação do Painel de Gamificação */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setSubTab('aprovacao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            subTab === 'aprovacao'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <span>⚡</span>
          <span>Aprovação Rápida & Ranking de Alunos</span>
        </button>

        <button
          onClick={() => setSubTab('ranks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            subTab === 'ranks'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <span>🥊</span>
          <span>Configurar Ranks ({ranks.length})</span>
        </button>

        <button
          onClick={() => setSubTab('conquistas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            subTab === 'conquistas'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
              : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <span>🏅</span>
          <span>Configurar Conquistas ({achievements.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('avaliacao');
            if (!alunoAvaliacaoId && resumoAlunos.length > 0) {
              setAlunoAvaliacaoId(resumoAlunos[0].alunoId);
            }
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
            subTab === 'avaliacao'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
              : 'bg-[#1A1A1E] text-amber-400 hover:text-white border border-amber-500/40'
          }`}
        >
          <span>🎯</span>
          <span>Avaliar Desempenho (Radar do Aluno)</span>
        </button>
      </div>

      {/* ABA 1: APROVAÇÃO RÁPIDA DO PROFESSOR & RANKING DE ALUNOS */}
      {subTab === 'aprovacao' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulário de Aprovação Rápida (Check-in Especial / Conquista) */}
          <div className="lg:col-span-5 bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-5 space-y-4 h-fit">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Ferramenta do Professor & Admin
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                ⚡ Aprovação Rápida de Conquista / Check-in Especial
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Valide presenças em condições especiais (Chuva, Feriado, Pontualidade, Dupla) ou conceda uma medalha diretamente.
              </p>
            </div>

            <form onSubmit={handleAprovarEspecial} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-300">
                  1. Selecionar Aluno(a)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={buscaAlunoEspecial}
                    onChange={(e) => setBuscaAlunoEspecial(e.target.value)}
                    placeholder="🔍 Digite para filtrar aluno por nome..."
                    className="w-full bg-[#121215] border border-zinc-800 focus:border-red-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                  {buscaAlunoEspecial && (
                    <button
                      type="button"
                      onClick={() => setBuscaAlunoEspecial('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {(() => {
                  const filtrados = resumoAlunos.filter((a) => {
                    if (!buscaAlunoEspecial.trim()) return true;
                    const t = buscaAlunoEspecial.trim().toLowerCase();
                    return a.nome.toLowerCase().includes(t);
                  });
                  return (
                    <select
                      value={selectedAlunoId}
                      onChange={(e) => setSelectedAlunoId(e.target.value)}
                      className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-red-500 outline-none"
                      required
                    >
                      <option value="">Selecione um aluno ({filtrados.length} encontrados)...</option>
                      {filtrados.map((a) => (
                        <option key={a.alunoId} value={a.alunoId}>
                          {a.nome} — {a.rankAtual?.name} ({a.totalPresencas} treinos)
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div className="bg-[#121215] border border-zinc-800/90 rounded-xl p-3.5 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registrarCheckinEsp}
                    onChange={(e) => setRegistrarCheckinEsp(e.target.checked)}
                    className="rounded accent-red-600"
                  />
                  <span className="text-xs font-black text-white">
                    Confirmar / Atualizar Check-in de Hoje com Atributos:
                  </span>
                </label>

                {registrarCheckinEsp && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <div>
                      <span className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Turno do Treino:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'MANHA', label: '🌅 Manhã' },
                          { id: 'TARDE', label: '☀️ Tarde' },
                          { id: 'NOITE', label: '🌙 Noite' },
                        ].map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setShiftEsp(t.id as any)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                              shiftEsp === t.id
                                ? 'bg-red-600/20 border-red-500 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 cursor-pointer text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={flagClima}
                          onChange={(e) => setFlagClima(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>⛈️ Chuva ou Sol (Clima)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 cursor-pointer text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={flagPontual}
                          onChange={(e) => setFlagPontual(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>⏱️ Chegou Cedo</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 cursor-pointer text-xs text-zinc-300 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={flagEvento}
                          onChange={(e) => setFlagEvento(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>🚩 Feriado de Batalha / Aulão / Evento Wai Kru</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        🤝 Treinou Acompanhado / Trouxe Amigo (Opcional):
                      </label>
                      <select
                        value={parceiroId}
                        onChange={(e) => setParceiroId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="">Nenhum parceiro / individual</option>
                        <option value="AMIGO_VISITANTE">🌟 Trouxe Amigo Visitante (Novo Sparring)</option>
                        {resumoAlunos
                          .filter((a) => a.alunoId !== selectedAlunoId)
                          .map((a) => (
                            <option key={a.alunoId} value={a.alunoId}>
                              Parceiro: {a.nome}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  2. Conceder Conquista Direta (Opcional — Desbloqueio Imediato)
                </label>
                <select
                  value={selectedAchievementId}
                  onChange={(e) => setSelectedAchievementId(e.target.value)}
                  className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                >
                  <option value="">Apenas avaliar regras automáticas do check-in</option>
                  {achievements.map((ach) => (
                    <option key={ach.id} value={ach.id}>
                      {ach.title} (+{ach.xp_points} XP) — {ach.category}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/20"
              >
                🏅 Validar & Atualizar Trilha do Aluno
              </button>
            </form>
          </div>

          {/* Visão Rápida da Turma (Rank, Presenças, XP e Badges de cada aluno) */}
          <div className="lg:col-span-7 bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">
                  🥋 Panorama da Turma na Trilha do Nak Muay
                </h3>
                <p className="text-xs text-zinc-400">
                  Visão rápida de Nível, Check-ins acumulados, XP e Conquistas de todos os alunos
                </p>
              </div>
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={buscaAlunoRank}
                onChange={(e) => setBuscaAlunoRank(e.target.value)}
                className="bg-[#121215] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-red-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-zinc-400 text-sm">
                Carregando ranking da turma...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {alunosFiltrados.map((aluno) => (
                  <div
                    key={aluno.alunoId}
                    className="bg-[#121215] border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        <BadgeOrImagePreview
                          src={aluno.rankAtual?.badge_icon_url}
                          fallbackText="🥊"
                          className="w-full h-full text-2xl"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-sm">{aluno.nome}</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {aluno.rankAtual?.name || 'Iniciante'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-1">
                          <span>🥋 <strong className="text-white">{aluno.totalPresencas}</strong> check-ins</span>
                          <span>⚡ <strong className="text-amber-400">{aluno.xpTotal} XP</strong></span>
                          <span>🏅 <strong className="text-emerald-400">{aluno.conquistasDesbloqueadas}</strong> conquistas</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {aluno.ultimasConquistas?.length > 0 && (
                        <div className="flex items-center -space-x-1">
                          {aluno.ultimasConquistas.map((uc: any) => (
                            <span
                              key={uc.id}
                              title={uc.title}
                              className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm overflow-hidden"
                            >
                              <BadgeOrImagePreview
                                src={uc.badge_icon_url}
                                className="w-full h-full text-xs"
                              />
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlunoId(aluno.alunoId);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white text-[11px] font-bold transition"
                      >
                        Selecionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: CRUD DE RANKS ("TRILHA DO NAK MUAY" COM UPLOAD DE BADGE) */}
      {subTab === 'ranks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {isAdmin && (
            <div className="lg:col-span-4 bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-5 h-fit">
              <h3 className="text-base font-black text-white mb-1">
                {editingRank ? `✏️ Editar Rank: ${editingRank.name}` : '➕ Novo Rank / Nível'}
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Defina o intervalo de check-ins necessários, recompensa e faça upload da imagem da Badge.
              </p>

              <form onSubmit={handleSaveRank} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Nome do Rank</label>
                  <input
                    type="text"
                    value={rankForm.name}
                    onChange={(e) => setRankForm({ ...rankForm, name: e.target.value })}
                    placeholder="Ex: Guerreiro da Disciplina"
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Check-ins Mín.</label>
                    <input
                      type="number"
                      value={rankForm.required_checkins_min}
                      onChange={(e) =>
                        setRankForm({ ...rankForm, required_checkins_min: Number(e.target.value) })
                      }
                      className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Check-ins Máx. (vazio = ∞)
                    </label>
                    <input
                      type="number"
                      value={rankForm.required_checkins_max}
                      onChange={(e) =>
                        setRankForm({ ...rankForm, required_checkins_max: e.target.value })
                      }
                      placeholder="Ex: 80 ou vazio"
                      className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* DIRETRIZ 3: UPLOAD REAL DE ARQUIVO LOCAL PARA BADGE DE RANK */}
                <FileUploadInput
                  label="Badge / Insígnia do Rank (Upload de Arquivo Local)"
                  value={rankForm.badge_icon_url}
                  onChange={(uploadedUrl) =>
                    setRankForm({ ...rankForm, badge_icon_url: uploadedUrl })
                  }
                  folder="rank_badges"
                  helperText="Faça upload da imagem PNG/JPG/SVG da Badge do Rank"
                />

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Ordem (1 a N)</label>
                  <input
                    type="number"
                    value={rankForm.order_index}
                    onChange={(e) =>
                      setRankForm({ ...rankForm, order_index: Number(e.target.value) })
                    }
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Descrição da Recompensa
                  </label>
                  <textarea
                    rows={2}
                    value={rankForm.reward_description}
                    onChange={(e) =>
                      setRankForm({ ...rankForm, reward_description: e.target.value })
                    }
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase"
                  >
                    {editingRank ? 'Salvar Alterações' : 'Criar Rank'}
                  </button>
                  {editingRank && (
                    <button
                      type="button"
                      onClick={() => setEditingRank(null)}
                      className="px-3 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3`}>
            {ranks.map((r) => (
              <div
                key={r.id}
                className="bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    <BadgeOrImagePreview
                      src={r.badge_icon_url}
                      fallbackText="🥊"
                      className="w-full h-full text-2xl"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Nível #{r.order_index}
                      </span>
                      <h4 className="font-black text-white text-base">{r.name}</h4>
                      <span className="text-xs font-bold text-amber-400">
                        ({r.required_checkins_min} a {r.required_checkins_max ?? '250+'} check-ins)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{r.reward_description}</p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditRankClick(r)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteRank(r.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-xs font-bold text-red-300 border border-red-800/40"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: CRUD DE CONQUISTAS (COM UPLOAD REAL DE BADGE) */}
      {subTab === 'conquistas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {isAdmin && (
            <div className="lg:col-span-4 bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-5 h-fit">
              <h3 className="text-base font-black text-white mb-1">
                {editingAch ? `✏️ Editar: ${editingAch.title}` : '➕ Criar Nova Conquista'}
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Personalize qualquer conquista e envie o arquivo de imagem da medalha/badge.
              </p>

              <form onSubmit={handleSaveAch} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Título</label>
                  <input
                    type="text"
                    value={achForm.title}
                    onChange={(e) => setAchForm({ ...achForm, title: e.target.value })}
                    placeholder="Ex: Guerreiro de Sábado"
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                {/* DIRETRIZ 3: UPLOAD REAL DE ARQUIVO LOCAL PARA ÍCONE DE CONQUISTA */}
                <FileUploadInput
                  label="Ícone / Badge da Conquista (Upload de Arquivo Local)"
                  value={achForm.badge_icon_url}
                  onChange={(uploadedUrl) =>
                    setAchForm({ ...achForm, badge_icon_url: uploadedUrl })
                  }
                  folder="achievement_badges"
                  helperText="Faça upload da imagem PNG/JPG/SVG do ícone da conquista"
                />

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={achForm.description}
                    onChange={(e) => setAchForm({ ...achForm, description: e.target.value })}
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Categoria</label>
                  <select
                    value={achForm.category}
                    onChange={(e) => setAchForm({ ...achForm, category: e.target.value })}
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Gatilho Lógico (Trigger Type)
                  </label>
                  <select
                    value={achForm.trigger_type}
                    onChange={(e) => setAchForm({ ...achForm, trigger_type: e.target.value })}
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {TRIGGER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Meta para Desbloqueio
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={achForm.target}
                      onChange={(e) => setAchForm({ ...achForm, target: Number(e.target.value) })}
                      className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Pontos XP</label>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={achForm.xp_points}
                      onChange={(e) =>
                        setAchForm({ ...achForm, xp_points: Number(e.target.value) })
                      }
                      className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Texto de Recompensa
                  </label>
                  <input
                    type="text"
                    value={achForm.reward_text}
                    onChange={(e) => setAchForm({ ...achForm, reward_text: e.target.value })}
                    className="w-full bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={achForm.is_secret}
                    onChange={(e) => setAchForm({ ...achForm, is_secret: e.target.checked })}
                    className="accent-amber-500"
                  />
                  <span>❓ Conquista Secreta (oculta até desbloquear)</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase"
                  >
                    {editingAch ? 'Salvar Conquista' : 'Criar Conquista'}
                  </button>
                  {editingAch && (
                    <button
                      type="button"
                      onClick={() => setEditingAch(null)}
                      className="px-3 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFiltroCatConquista('TODAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  filtroCatConquista === 'TODAS'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1A1A1E] text-zinc-400 border border-zinc-800'
                }`}
              >
                Todas ({achievements.length})
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFiltroCatConquista(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                    filtroCatConquista === c.value
                      ? 'bg-red-600 text-white'
                      : 'bg-[#1A1A1E] text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {achievementsFiltrados.map((a) => {
                let target = 1;
                try {
                  target = JSON.parse(a.trigger_value || '{}').target || 1;
                } catch {
                  target = 1;
                }
                return (
                  <div
                    key={a.id}
                    className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        <BadgeOrImagePreview
                          src={a.badge_icon_url}
                          fallbackText="🏅"
                          className="w-full h-full text-2xl"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black uppercase text-amber-400">
                            {a.category}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            +{a.xp_points} XP • Meta: {target}
                          </span>
                        </div>
                        <h4 className="font-black text-white text-sm mt-0.5">{a.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{a.description}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {a.trigger_type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditAchClick(a)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-white"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAch(a.id)}
                            className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-[11px] font-bold text-red-300"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

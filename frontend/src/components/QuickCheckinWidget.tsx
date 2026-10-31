import React, { useState, useEffect } from 'react';
import { publicApi, studentApi } from '../services/api';
import { BadgeOrImagePreview } from './FileUploadInput';

/**
 * Frente 1 (Módulo 3): Formulário minimalista de Check-in Rápido na Home / Tela de Login (Público)
 * Submete CPF, Senha e Horário Específico da aula de hoje, valida, registra o check-in no horário
 * (e Modal Level Up se houver nova conquista) e reseta os campos sem forçar login na aplicação.
 */
export const PublicQuickCheckinCard: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [aulasDeHoje, setAulasDeHoje] = useState<any[]>([]);
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<string>('');
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    tipo: 'ok' | 'erro';
    titulo: string;
    mensagem: string;
    alunoNome?: string;
    prajied?: string;
    horarioInfo?: string;
  } | null>(null);
  const [levelUpConquista, setLevelUpConquista] = useState<any | null>(null);

  const carregarAulasHoje = async () => {
    try {
      setLoadingAulas(true);
      const res = await publicApi.getTodayClasses();
      if (res.data?.aulas) {
        setAulasDeHoje(res.data.aulas);
        const disponivel = res.data.aulas.find((a: any) => !a.cancelada && !a.lotado);
        if (disponivel) {
          setEventoSelecionadoId(disponivel.id);
        } else if (res.data.aulas.length > 0) {
          setEventoSelecionadoId(res.data.aulas[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar aulas de hoje para check-in expresso:', err);
    } finally {
      setLoadingAulas(false);
    }
  };

  useEffect(() => {
    carregarAulasHoje();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf.trim() || !senha.trim()) return;

    if (!eventoSelecionadoId && aulasDeHoje.length > 0) {
      setToast({
        tipo: 'erro',
        titulo: '⚠️ Escolha um Horário de Aula',
        mensagem: 'Por favor, selecione em qual horário de aula você vai treinar hoje.'
      });
      return;
    }

    setLoading(true);
    setToast(null);

    const aulaEscolhida = aulasDeHoje.find(a => a.id === eventoSelecionadoId);

    try {
      const res = await publicApi.quickCheckIn({
        cpf,
        senha,
        eventoId: eventoSelecionadoId || undefined
      });
      const data = res.data;

      setToast({
        tipo: 'ok',
        titulo: '✅ CHECK-IN REALIZADO COM SUCESSO!',
        mensagem: data.mensagem || `Presença agendada para o treino de hoje${aulaEscolhida ? ` (${aulaEscolhida.horarioFormatado})` : ''}! Bom treino!`,
        alunoNome: data.aluno?.nome,
        prajied: data.aluno?.prajied,
        horarioInfo: aulaEscolhida ? `${aulaEscolhida.horarioFormatado} • ${aulaEscolhida.modalidade}` : undefined
      });

      if (data.novasConquistas && data.novasConquistas.length > 0) {
        setLevelUpConquista(data.novasConquistas[0]);
      }

      // Reseta os campos sem forçar o login na aplicação
      setCpf('');
      setSenha('');
      carregarAulasHoje();

      setTimeout(() => {
        setToast(null);
      }, 7000);
    } catch (err: any) {
      setToast({
        tipo: 'erro',
        titulo: '⚠️ Não foi possível registrar o Check-in',
        mensagem:
          err.response?.data?.erro || 'Verifique seu CPF e Senha e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#18181D] via-[#131316] to-red-950/30 border border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
            ⚡ Check-in Expresso (Sem Login)
          </span>
          <h3 className="text-sm sm:text-base font-black text-white mt-1">
            Bater Ponto de Presença de Hoje
          </h3>
          <p className="text-[11px] text-zinc-400">
            Escolha o horário da aula e confirme presença com seu CPF e senha.
          </p>
        </div>
        <span className="text-2xl">🥊</span>
      </div>

      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs animate-fadeIn ${
            toast.tipo === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}
        >
          <div className="font-black text-sm">{toast.titulo}</div>
          <p className="mt-0.5 font-medium">{toast.mensagem}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {toast.alunoNome && (
              <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold text-amber-300">
                🥋 Atleta: {toast.alunoNome} • Prajied {toast.prajied || 'Branco'}
              </span>
            )}
            {toast.horarioInfo && (
              <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-[10px] font-bold text-red-300">
                ⏰ Horário: {toast.horarioInfo}
              </span>
            )}
          </div>
        </div>
      )}

      {/* SELEÇÃO DO HORÁRIO DO TREINO DE HOJE */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300 flex items-center justify-between">
          <span>⏰ Escolha o Horário de Treino de Hoje:</span>
          {loadingAulas && <span className="text-[10px] text-zinc-500 font-normal">Carregando grade...</span>}
        </label>
        <select
          value={eventoSelecionadoId}
          onChange={(e) => setEventoSelecionadoId(e.target.value)}
          className="w-full bg-[#0E0E11] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none font-bold"
        >
          {aulasDeHoje.length === 0 ? (
            <option value="">{loadingAulas ? 'Carregando horários...' : 'Nenhum treino disponível hoje'}</option>
          ) : (
            aulasDeHoje.map((aula) => (
              <option
                key={aula.id}
                value={aula.id}
                disabled={aula.cancelada || aula.lotado}
                className={aula.cancelada ? 'text-zinc-500 line-through' : aula.lotado ? 'text-red-400' : 'text-white'}
              >
                {aula.horario} - {aula.professorNome} ({aula.titulo})
                {aula.cancelada ? ' [AULA CANCELADA PELO PROFESSOR]' : aula.lotado ? ' [TURMA LOTADA]' : ' [HÁ VAGAS]'}
              </option>
            ))
          )}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="CPF (apenas números)"
          required
          className="sm:col-span-5 bg-[#0E0E11] border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Sua Senha"
          required
          className="sm:col-span-4 bg-[#0E0E11] border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-3 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/25 flex items-center justify-center gap-1"
        >
          {loading ? 'Validando...' : '✓ Check-in'}
        </button>
      </form>

      {levelUpConquista && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E1E24] to-[#121215] border-2 border-amber-500 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-4xl">
              <BadgeOrImagePreview src={levelUpConquista.badge_icon_url} className="w-16 h-16 text-4xl" />
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-black">
              🎉 LEVEL UP! NOVA CONQUISTA!
            </span>
            <h4 className="text-xl font-black text-white">{levelUpConquista.title}</h4>
            <p className="text-xs text-zinc-300">{levelUpConquista.description}</p>
            <div className="text-sm font-black text-amber-400">
              +{levelUpConquista.xp_points} XP • {levelUpConquista.reward_text}
            </div>
            <button
              type="button"
              onClick={() => setLevelUpConquista(null)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase"
            >
              Oss! Continuar Evoluindo 🥊
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Frente 2 (Módulo 3): Banner de ação rápida no Dashboard do Aluno (Logado)
 * Exibe os horários do dia em formato interativo, permite ao aluno selecionar exatamente
 * em qual horário vai treinar, fazer check-in e cancelar se o professor ainda não tiver aceito.
 */
export const LoggedQuickCheckinBanner: React.FC<{
  aluno: any;
  onCheckinSuccess?: (gamificacaoData?: any) => void;
}> = ({ aluno, onCheckinSuccess }) => {
  const [aulasDeHoje, setAulasDeHoje] = useState<any[]>([]);
  const [aulaSelecionadaId, setAulaSelecionadaId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregarAulasHoje = async () => {
    if (!aluno?.id) return;
    try {
      setLoadingAulas(true);
      const res = await studentApi.getTodayClasses({ alunoId: aluno.id });
      if (res.data?.aulas) {
        setAulasDeHoje(res.data.aulas);
        // Se o aluno já tiver check-in em uma das aulas, seleciona ela como destaque
        const minha = res.data.aulas.find((a: any) => Boolean(a.meuCheckin));
        if (minha) {
          setAulaSelecionadaId(minha.id);
        } else {
          const disponivel = res.data.aulas.find((a: any) => !a.cancelada && !a.lotado);
          if (disponivel) {
            setAulaSelecionadaId(disponivel.id);
          } else if (res.data.aulas.length > 0) {
            setAulaSelecionadaId(res.data.aulas[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar treinos de hoje para o aluno:', err);
    } finally {
      setLoadingAulas(false);
    }
  };

  useEffect(() => {
    carregarAulasHoje();
  }, [aluno?.id]);

  const aulaAtiva = aulasDeHoje.find(a => a.id === aulaSelecionadaId) || (aulasDeHoje.length > 0 ? aulasDeHoje[0] : null);

  const handleQuickCheckinLogado = async () => {
    if (!aluno?.id || !aulaAtiva) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await studentApi.checkInBySchedule({
        alunoId: aluno.id,
        eventoId: aulaAtiva.id
      });
      setFeedback({
        tipo: 'ok',
        texto: res.data?.mensagem || `Check-in realizado com sucesso para às ${aulaAtiva.horario}! Presença agendada.`,
      });
      await carregarAulasHoje();
      if (onCheckinSuccess) {
        onCheckinSuccess();
      }
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.response?.data?.erro || 'Erro ao registrar check-in de hoje.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarCheckinLogado = async (checkinId?: string) => {
    if (!aluno?.id) return;
    if (!confirm('Deseja realmente cancelar seu check-in neste horário? Sua vaga será liberada.')) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await studentApi.cancelCheckIn({
        checkinId: checkinId || '',
        alunoId: aluno.id,
        eventoId: aulaAtiva?.id
      });
      setFeedback({
        tipo: 'ok',
        texto: res.data?.mensagem || 'Check-in cancelado e vaga liberada no tatame!',
      });
      await carregarAulasHoje();
      if (onCheckinSuccess) {
        onCheckinSuccess();
      }
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err.response?.data?.erro || 'Erro ao cancelar check-in.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-950/60 via-[#16161A] to-amber-950/30 border border-red-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600 text-white">
              ⚡ Ação Rápida de Hoje
            </span>
            <span className="text-xs font-bold text-amber-400">
              +10 XP na Trilha do Nak Muay
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white mt-1">
            Escolha o horário do seu treino de hoje no tatame:
          </h3>
          <p className="text-xs text-zinc-400">
            Selecione qual turma você vai treinar, marque seu check-in ou cancele se ainda não aceito pelo professor.
          </p>
        </div>

        {aulaAtiva && (
          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">Capacidade do Horário</span>
            <span className="text-xs font-black text-white">
              {aulaAtiva.totalAgendados} de {aulaAtiva.capacidade} alunos agendados
            </span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border animate-fadeIn ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/60 border-red-500/50 text-red-300'
          }`}
        >
          {feedback.texto}
        </div>
      )}

      {/* GRADE DE HORÁRIOS DE HOJE EM PILLS INTERATIVAS */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-2">
          <span>Horários Disponíveis Hoje ({aulasDeHoje.length}):</span>
          {loadingAulas && <span className="text-zinc-500">Atualizando horários...</span>}
        </div>

        {aulasDeHoje.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            Nenhum treino regular programado para hoje (tatame em manutenção ou domingo).
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {aulasDeHoje.map(aula => {
              const isSelected = aula.id === aulaAtiva?.id;
              const temMeuCheckin = Boolean(aula.meuCheckin);
              const statusCheckin = aula.meuCheckin?.status;

              return (
                <button
                  key={aula.id}
                  type="button"
                  onClick={() => setAulaSelecionadaId(aula.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/50 ring-1 ring-red-400'
                      : temMeuCheckin
                      ? 'bg-[#1E1A16] text-amber-300 border-amber-500/50 hover:border-amber-400'
                      : aula.cancelada
                      ? 'bg-zinc-900/50 text-zinc-600 border-zinc-800 line-through'
                      : 'bg-[#18181D] text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className={aula.cancelada ? 'line-through text-zinc-500' : ''}>
                    {aula.horarioCurto} {aula.professorNome.split(' ')[0]}
                  </span>

                  {aula.cancelada ? (
                    <span className="text-[8px] bg-red-950 text-red-400 px-1 py-0.2 rounded uppercase no-underline font-normal">
                      Canc.
                    </span>
                  ) : temMeuCheckin ? (
                    <span className={`text-[8px] px-1 py-0.2 rounded uppercase font-normal ${
                      statusCheckin === 'PRESENTE'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/30 text-amber-300'
                    }`}>
                      {statusCheckin === 'PRESENTE' ? '✓ OK' : '⏳ Pend.'}
                    </span>
                  ) : aula.lotado ? (
                    <span className="text-[8px] bg-red-950 text-red-400 px-1 py-0.2 rounded uppercase font-normal">
                      Lotado
                    </span>
                  ) : (
                    <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded uppercase font-normal">
                      Vagas
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* PAINEL DA AULA SELECIONADA E BOTÃO DE AÇÃO */}
      {aulaAtiva && (
        <div className="bg-[#121215] border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">
                ⏰ {aulaAtiva.horario} • {aulaAtiva.titulo}
              </span>
              {aulaAtiva.cancelada && (
                <span className="text-[10px] font-bold text-red-400 uppercase bg-red-950 px-2 py-0.5 rounded border border-red-500/30">
                  Cancelada pelo Professor
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Mestre: <strong className="text-zinc-200">{aulaAtiva.professorNome}</strong> • Modalidade: {aulaAtiva.modalidade} • Vagas: {aulaAtiva.totalAgendados}/{aulaAtiva.capacidade}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {aulaAtiva.meuCheckin ? (
              aulaAtiva.meuCheckin.status === 'PRESENTE' ? (
                <span className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase flex items-center gap-1.5 shadow-md">
                  <span>✓</span>
                  <span>Presença Confirmada no Tatame!</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase flex items-center gap-1.5 animate-pulse">
                    <span>⏳</span>
                    <span>Check-in Agendado (Aguardando Professor)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancelarCheckinLogado(aulaAtiva.meuCheckin.id)}
                    disabled={loading}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-400 border border-zinc-700 hover:border-red-500 text-xs font-bold transition flex items-center gap-1"
                    title="Cancelar meu agendamento neste horário e liberar vaga"
                  >
                    <span>❌ Cancelar Check-in</span>
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                disabled={loading || aulaAtiva.cancelada || aulaAtiva.lotado}
                onClick={handleQuickCheckinLogado}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 shrink-0 ${
                  aulaAtiva.cancelada || aulaAtiva.lotado
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/30'
                }`}
              >
                <span>🥊</span>
                <span>
                  {loading
                    ? 'Confirmando...'
                    : aulaAtiva.cancelada
                    ? 'Aula Cancelada'
                    : aulaAtiva.lotado
                    ? 'Turma Lotada'
                    : `Fazer Check-in em ${aulaAtiva.horarioCurto}`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

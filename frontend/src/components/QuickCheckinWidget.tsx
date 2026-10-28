import React, { useState } from 'react';
import { publicApi, studentApi } from '../services/api';
import { BadgeOrImagePreview } from './FileUploadInput';

/**
 * Frente 1 (Módulo 3): Formulário minimalista de Check-in Rápido na Home / Tela de Login (Público)
 * Submete CPF e Senha, valida, bate o ponto de presença no dia atual, exibe Toast/Alert de Sucesso
 * (e Modal Level Up se houver nova conquista) e reseta os campos sem forçar login na aplicação.
 */
export const PublicQuickCheckinCard: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    tipo: 'ok' | 'erro';
    titulo: string;
    mensagem: string;
    alunoNome?: string;
    prajied?: string;
  } | null>(null);
  const [levelUpConquista, setLevelUpConquista] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf.trim() || !senha.trim()) return;

    setLoading(true);
    setToast(null);

    try {
      const res = await publicApi.quickCheckIn({ cpf, senha });
      const data = res.data;

      setToast({
        tipo: 'ok',
        titulo: '✅ CHECK-IN DE HOJE CONFIRMADO!',
        mensagem: data.mensagem || 'Presença registrada com sucesso no tatame!',
        alunoNome: data.aluno?.nome,
        prajied: data.aluno?.prajied,
      });

      if (data.novasConquistas && data.novasConquistas.length > 0) {
        setLevelUpConquista(data.novasConquistas[0]);
      }

      // Reseta os campos sem forçar o login na aplicação
      setCpf('');
      setSenha('');

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
            Digite apenas seu CPF e Senha para confirmar presença imediata no treino de hoje.
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
          {toast.alunoNome && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold text-amber-300">
              🥋 Atleta: {toast.alunoNome} • Prajied {toast.prajied || 'Branco'}
            </span>
          )}
        </div>
      )}

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
          className="sm:col-span-3 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/25"
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
 * Frente 2 (Módulo 3): Botão de ação em destaque no Dashboard do Aluno (Logado)
 * Bate no mesmo endpoint (/api/quick-checkin) puxando o ID da sessão atual, sem pedir senha.
 */
export const LoggedQuickCheckinBanner: React.FC<{
  aluno: any;
  onCheckinSuccess?: (gamificacaoData?: any) => void;
}> = ({ aluno, onCheckinSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const handleQuickCheckinLogado = async () => {
    if (!aluno?.id) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await studentApi.quickCheckIn({ alunoId: aluno.id });
      setFeedback({
        tipo: 'ok',
        texto: res.data?.mensagem || 'Check-in de hoje registrado com sucesso!',
      });
      if (onCheckinSuccess) {
        onCheckinSuccess(res.data?.gamificacao);
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

  return (
    <div className="bg-gradient-to-r from-red-950/60 via-[#16161A] to-amber-950/30 border border-red-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
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
          Já está na academia para treinar hoje?
        </h3>
        <p className="text-xs text-zinc-400">
          Confirme sua presença em 1 clique usando sua sessão ativa (sem precisar digitar senha novamente).
        </p>
        {feedback && (
          <p
            className={`mt-2 text-xs font-bold ${
              feedback.tipo === 'ok' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {feedback.texto}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleQuickCheckinLogado}
        className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-red-600/30 shrink-0 flex items-center justify-center gap-2"
      >
        <span>🥊</span>
        <span>{loading ? 'Confirmando...' : 'Fazer Check-in de Hoje'}</span>
      </button>
    </div>
  );
};

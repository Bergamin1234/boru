import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicQuickCheckinCard } from '../components/QuickCheckinWidget';

export default function MobileAppHome() {
  const navigate = useNavigate();
  const [mostrarCheckinExpresso, setMostrarCheckinExpresso] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between px-4 py-6 sm:py-10 max-w-lg mx-auto select-none">
      {/* CABEÇALHO DO APLICATIVO MOBILE */}
      <header className="text-center space-y-2.5 pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-[10px] font-black uppercase tracking-widest text-red-400 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>APP OFICIAL • CT BORÜ PORTO VELHO</span>
        </div>

        <div className="flex flex-col items-center pt-1">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-red-600 opacity-70 blur-sm" />
            <img
              src="/logo-boru.jpg"
              alt="BORÜ Centro de Combate"
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-red-500 object-cover shadow-2xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white mt-3 uppercase">
            BORÜ <span className="text-red-500">APP</span>
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            Selecione seu perfil de acesso abaixo para entrar no sistema oficial do Centro de Treinamento.
          </p>
        </div>
      </header>

      {/* CENTRAL DE ACESSOS (AS 3 OPÇÕES OFICIAIS DO APP) */}
      <main className="my-6 space-y-4">
        {/* =========================================================
            OPÇÃO 1 (MAIOR DESTAQUE): ACESSO PARA ALUNOS
            ========================================================= */}
        <section className="relative rounded-3xl p-[2px] bg-gradient-to-br from-red-500 via-red-600 to-amber-500 shadow-2xl shadow-red-950/60 transition-transform">
          <div className="bg-gradient-to-b from-[#1A1416] via-[#131316] to-[#111114] rounded-[22px] p-5 sm:p-6 space-y-4 relative overflow-hidden">
            {/* Brilho de fundo decorativo */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-amber-500 text-white shadow">
                  🔥 DESTAQUE PRINCIPAL • ATLETAS
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                  Acesso para ALUNOS
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Portal completo do atleta: confirme sua presença, acompanhe sua frequência, conquistas Nak Muay, contratos, ranking e loja.
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/25 via-red-600/20 to-black/60 border border-amber-500/40 flex items-center justify-center p-2 shrink-0 shadow-xl shadow-red-950/60 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src="/icon-aluno.png"
                  alt="Lobo Borü - Aluno"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.55)] transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>

            {/* Pílulas de recursos do Portal do Aluno */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="bg-black/40 border border-zinc-800/90 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <span className="text-red-400">✓</span> Check-in & Treinos
              </div>
              <div className="bg-black/40 border border-zinc-800/90 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <span className="text-red-400">✓</span> Frequência & %
              </div>
              <div className="bg-black/40 border border-zinc-800/90 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <span>🏆</span> Conquistas & Rank
              </div>
              <div className="bg-black/40 border border-zinc-800/90 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <span className="text-emerald-400">💳</span> Plano & Contratos
              </div>
            </div>

            {/* Botão Principal de Entrada do Aluno */}
            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 active:scale-[0.98] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-red-600/30 transition flex items-center justify-center gap-2"
            >
              <span>ENTRAR NO PORTAL DO ALUNO</span>
              <span className="text-lg">→</span>
            </button>

            {/* Atalho opcional de Check-in Expresso direto na tela inicial */}
            <div className="pt-1 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setMostrarCheckinExpresso(!mostrarCheckinExpresso)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-400">⚡</span>
                  <span>Check-in Expresso Rápido (Sem abrir o painel)</span>
                </span>
                <span className="text-zinc-400 text-[11px]">
                  {mostrarCheckinExpresso ? '▲ Ocultar' : '▼ Abrir'}
                </span>
              </button>

              {mostrarCheckinExpresso && (
                <div className="mt-3">
                  <PublicQuickCheckinCard />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            OPÇÃO 2: ACESSO PARA PROFESSORES
            ========================================================= */}
        <section className="bg-[#141417]/95 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-xl transition">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/15 to-black/60 border border-emerald-500/40 flex items-center justify-center p-1.5 shrink-0 shadow-lg shadow-emerald-950/50 relative group overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src="/icon-professor.png"
                  alt="Texugo Guerreiro - Professor"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.5)] transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  MESTRES & INSTRUTORES
                </span>
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  Acesso para Professores
                </h3>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Chamada diária em duas colunas, presença de turmas, aulas experimentais e alunos.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/professor')}
            className="mt-3.5 w-full py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-black text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>ACESSAR PORTAL DO PROFESSOR</span>
            <span>→</span>
          </button>
        </section>

        {/* =========================================================
            OPÇÃO 3: ACESSO DE ADMINISTRADORES
            ========================================================= */}
        <section className="bg-[#141417]/95 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-xl transition">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 via-yellow-600/15 to-black/60 border border-amber-500/40 flex items-center justify-center p-1.5 shrink-0 shadow-lg shadow-amber-950/50 relative group overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src="/icon-admin.png"
                  alt="Lobo Dourado Real - Administrador"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)] transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400">
                  DIRETORIA & GESTÃO EXECUTIVA
                </span>
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  Acesso de Administradores
                </h3>
                <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                  Gestão financeira (Despesas & Investimentos), matrículas, equipe, loja e controle geral.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="mt-3.5 w-full py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 font-black text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>ACESSAR PAINEL DE ADMINISTRADORES</span>
            <span>→</span>
          </button>
        </section>
      </main>

      {/* RODAPÉ DO APP */}
      <footer className="text-center space-y-2 pt-2 pb-1 border-t border-zinc-800/70">
        <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 font-semibold">
          <button
            type="button"
            onClick={() => navigate('/agendar')}
            className="hover:text-red-400 transition"
          >
            🔥 Agendar Aula Experimental
          </button>
          <span className="text-zinc-700">•</span>
          <a
            href="https://wa.me/556992384491"
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-400 transition"
          >
            📲 Suporte Recepção
          </a>
        </div>
        <p className="text-[10px] text-zinc-600">
          BORÜ Centro de Treinamento • Versão Mobile App (Play Store & iOS)
        </p>
      </footer>
    </div>
  );
}

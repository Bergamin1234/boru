import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface SplitRollCallTabProps {
  professorId?: string;
  onRefreshDashboard?: () => void;
}

export const SplitRollCallTab: React.FC<SplitRollCallTabProps> = ({
  professorId,
  onRefreshDashboard,
}) => {
  const [dataReferencia, setDataReferencia] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [presentes, setPresentes] = useState<any[]>([]);
  const [ausentes, setAusentes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [marcandoIds, setMarcandoIds] = useState<string[]>([]);

  const carregarSplitList = async (dataAlvo = dataReferencia) => {
    setLoading(true);
    try {
      const res = await adminApi.getSplitDailyRollCall(dataAlvo);
      setPresentes(res.data.fizeramCheckinHoje || []);
      setAusentes(res.data.naoFizeramCheckinHoje || []);
    } catch {
      // fallback silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSplitList(dataReferencia);
  }, [dataReferencia]);

  // Baixa Manual Expressa do Professor com Optimistic UI (sem recarregar a página)
  const handleBaixaExpressa = async (aluno: any) => {
    if (marcandoIds.includes(aluno.id)) return;
    setMarcandoIds((prev) => [...prev, aluno.id]);

    const horarioAgora = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Optimistic UI: Move instantaneamente da coluna "Não fizeram" para "Fizeram check-in HOJE"
    setAusentes((prev) => prev.filter((a) => a.id !== aluno.id));
    setPresentes((prev) =>
      [...prev, { ...aluno, statusHoje: 'PRESENTE', horarioCheckin: horarioAgora }].sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
      )
    );

    try {
      await adminApi.markExpressDailyRollCall({
        alunoId: aluno.id,
        professorId: professorId || 'PROFESSOR',
        data: dataReferencia,
        status: 'PRESENTE',
      });
      if (onRefreshDashboard) onRefreshDashboard();
    } catch {
      // Reverte se houver falha de rede
      await carregarSplitList(dataReferencia);
    } finally {
      setMarcandoIds((prev) => prev.filter((id) => id !== aluno.id));
    }
  };

  const presentesFiltrados = presentes.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const ausentesFiltrados = ausentes.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* HEADER DA CHAMADA DIÁRIA SPLIT-LIST */}
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/30">
            📋 Módulo 6 — Split-List de Chamada Diária
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
            Chamada Diária em Duas Colunas (Presentes vs Pendentes)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Lista alfabética completa de alunos ativos dividida em tempo real. Clique em <strong className="text-emerald-400">[ ✓ ]</strong> para registrar presença expressa sem recarregar a tela.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-zinc-400">📅 Data:</span>
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              className="bg-transparent text-xs font-black text-white outline-none"
            />
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔍 Buscar aluno por nome..."
            className="bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />

          <button
            onClick={() => carregarSplitList(dataReferencia)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700"
          >
            🔄 Sincronizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-sm">
          Carregando Split-List da Chamada Diária...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* COLUNA 1: [✓] FIZERAM CHECK-IN HOJE */}
          <div className="bg-[#141416] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black flex items-center justify-center text-sm">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-emerald-400">
                    [✓] Fizeram check-in HOJE
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Alunos com presença confirmada na data selecionada
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {presentesFiltrados.length} presentes
              </span>
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {presentesFiltrados.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Nenhum aluno realizou check-in ainda nesta data.
                </div>
              ) : (
                presentesFiltrados.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{aluno.nome}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          PRESENTE
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {aluno.plano} • Prajied {aluno.prajied}
                        {aluno.horarioCheckin ? ` • Check-in às ${aluno.horarioCheckin}` : ''}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-black text-sm px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      [ ✓ ]
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUNA 2: [ ] NÃO FIZERAM CHECK-IN HOJE (COM BOTÃO EXPRESSO [ ✓ ]) */}
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 font-black flex items-center justify-center text-sm">
                  ☐
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    [ ] Não fizeram check-in HOJE
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Clique em [ ✓ ] ao lado do aluno para confirmar presença imediata
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-zinc-800 text-zinc-300 border border-zinc-700">
                {ausentesFiltrados.length} aguardando
              </span>
            </div>

            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {ausentesFiltrados.length === 0 ? (
                <div className="p-8 text-center text-emerald-400 text-xs font-bold">
                  🎉 Todos os alunos filtrados já estão presentes hoje!
                </div>
              ) : (
                ausentesFiltrados.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="bg-[#1A1A1E] border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{aluno.nome}</span>
                        {aluno.is_bolsista && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/20 text-purple-300">
                            BOLSISTA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {aluno.plano} • Prajied {aluno.prajied}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBaixaExpressa(aluno)}
                      disabled={marcandoIds.includes(aluno.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-black text-xs transition shrink-0 shadow-sm"
                      title="Forçar registro de presença expresso hoje"
                    >
                      [ ✓ ] Presente
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

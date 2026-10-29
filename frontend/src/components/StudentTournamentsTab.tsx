import React, { useState } from 'react';

interface Tournament {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  modality: string;
  date: string;
  location: string;
  divisions: string[];
  rules: string;
  prize: string;
  xpPoints: number;
  registeredCount: number;
  maxSlots: number;
  status: 'ABERTO' | 'CHAVES' | 'EM_BREVE';
  image: string;
}

export function StudentTournamentsTab({ aluno }: { aluno?: any }) {
  const [tournaments] = useState<Tournament[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('TODOS');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [inscricaoSucesso, setInscricaoSucesso] = useState<string | null>(null);
  const [minhasInscricoes, setMinhasInscricoes] = useState<string[]>([]);

  const modalidadesFiltro = ['TODOS', 'Muay Thai Tradicional', 'Sparrings Técnicos'];

  const torneiosFiltrados = tournaments.filter((t) => {
    if (selectedModality === 'TODOS') return true;
    return t.modality === selectedModality;
  });

  const handleConfirmarInscricao = () => {
    if (!selectedTournament) return;
    if (!selectedDivision) {
      alert('Por favor, selecione a categoria de peso/divisão desejada.');
      return;
    }
    setMinhasInscricoes((prev) => [...prev, selectedTournament.id]);
    setInscricaoSucesso(`Parabéns! Sua vaga no torneio "${selectedTournament.title}" na categoria "${selectedDivision}" foi confirmada pelo CT Borü!`);
    setSelectedTournament(null);
    setSelectedDivision('');
    setTimeout(() => setInscricaoSucesso(null), 7000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Sucesso */}
      {inscricaoSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 shadow-xl animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-black text-sm text-emerald-200">INSCRIÇÃO CONFIRMADA NA CHAVE!</p>
              <p className="text-xs text-emerald-300/90">{inscricaoSucesso}</p>
            </div>
          </div>
          <button
            onClick={() => setInscricaoSucesso(null)}
            className="text-zinc-400 hover:text-white font-bold text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#141416] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-500/30">
            <span>🏆 Circuito Oficial CT Borü</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Próximos Torneios, Copas &amp; Brackets
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Consulte as datas, regras, categorias de peso e inscreva-se para disputar pódios oficiais do CT Borü, acumular pontos de MMR e evoluir no ranking interno da academia sob supervisão do Mestre Felipe Borü.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-xs font-mono font-black text-zinc-400">
              {minhasInscricoes.length} ATIVA{minhasInscricoes.length === 1 ? '' : 'S'}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Minhas Inscrições</span>
          </div>
        </div>
      </div>

      {/* FILTROS DE MODALIDADE */}
      {tournaments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto boru-scrollbar pb-1">
          {modalidadesFiltro.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setSelectedModality(mod)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedModality === mod
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : 'bg-[#141416] text-zinc-400 border border-zinc-800 hover:border-red-500/60 hover:text-white'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {/* GRADE DE TORNEIOS OU ESTADO VAZIO */}
      {torneiosFiltrados.length === 0 ? (
        <div className="p-12 sm:p-16 text-center rounded-3xl border border-zinc-800/80 bg-[#141416] space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1E] border border-zinc-800 flex items-center justify-center mx-auto text-3xl shadow-inner">
            🏆
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              Nenhum Torneio ou Competição no Momento
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Não há campeonatos ou chaves de disputa abertas atualmente. Os próximos torneios e copas oficiais do CT Borü serão anunciados pelo Mestre Felipe Borü aqui no portal.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800">
              <span>🥊</span> Continue treinando e afiando seus golpes no tatame!
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {torneiosFiltrados.map((tournament) => {
            const jaInscrito = minhasInscricoes.includes(tournament.id);
            const percentVagas = Math.round((tournament.registeredCount / tournament.maxSlots) * 100);

            return (
              <div
                key={tournament.id}
                className="rounded-2xl border border-zinc-800 bg-[#141416] overflow-hidden shadow-xl flex flex-col justify-between hover:border-red-600/70 transition duration-300"
              >
                {/* Imagem de Capa do Torneio */}
                <div className="relative h-44 overflow-hidden bg-[#1A1A1E]">
                  <img
                    src={tournament.image}
                    alt={tournament.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${tournament.badgeColor}`}>
                      {tournament.badge}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 border border-white/20 backdrop-blur-md">
                      +{tournament.xpPoints} MMR XP
                    </span>
                  </div>

                  {jaInscrito && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider shadow-lg">
                      ✓ Vaga Confirmada
                    </span>
                  )}

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[11px] font-semibold text-red-400 drop-shadow block">
                      {tournament.modality}
                    </span>
                    <h3 className="text-lg font-black text-white leading-tight drop-shadow">
                      {tournament.title}
                    </h3>
                  </div>
                </div>

                {/* Informações Detalhadas */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-base">📅</span>
                        <span className="font-medium">{tournament.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-base">📍</span>
                        <span className="font-medium truncate">{tournament.location}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-zinc-800 bg-[#1A1A1E] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Regras &amp; Premiação:</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{tournament.rules}</span>
                      </div>
                      <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                        <span>🏆</span> {tournament.prize}
                      </p>
                    </div>

                    {/* Barra de Ocupação de Vagas */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Inscrições Realizadas</span>
                        <span className="font-mono font-bold text-white">
                          {tournament.registeredCount} / {tournament.maxSlots} atletas ({percentVagas}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-600 transition-all duration-500"
                          style={{ width: `${percentVagas}%` }}
                        />
                      </div>
                    </div>

                    {/* Divisões de Peso */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Categorias Disponíveis:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tournament.divisions.map((div) => (
                          <span
                            key={div}
                            className="px-2 py-0.5 rounded text-[10px] border border-zinc-800 bg-[#1A1A1E] text-zinc-300 font-medium"
                          >
                            {div}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-400 font-medium">
                      Atleta: <strong className="text-white">{aluno?.nome || 'Você'}</strong>
                    </span>

                    {jaInscrito ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-default"
                      >
                        <span>✓ Inscrito na Chave</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTournament(tournament)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase italic tracking-wider transition shadow-md shadow-red-900/30 active:scale-95 flex items-center gap-1.5"
                      >
                        <span>INSCREVER-SE</span>
                        <span>🥊</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE INSCRIÇÃO EM CATEGORIA */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">
                  Confirmar Inscrição // CT Borü
                </span>
                <h3 className="text-lg font-black text-white leading-snug">
                  {selectedTournament.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1A1A1E] border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Atleta:</span>
                <span className="font-bold text-white">{aluno?.nome || 'Você'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Prajied / Nível:</span>
                <span className="font-bold text-red-400">{aluno?.prajied || 'Prajied do Aluno'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pontuação em Disputa:</span>
                <span className="font-mono font-bold text-yellow-400">+{selectedTournament.xpPoints} MMR XP</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                Selecione sua Categoria de Peso:
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
              >
                <option value="">-- Escolha a Divisão de Peso --</option>
                {selectedTournament.divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarInscricao}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase italic tracking-wider transition shadow-lg shadow-red-900/30"
              >
                Confirmar Vaga 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

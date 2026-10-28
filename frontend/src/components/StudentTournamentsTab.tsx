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

const mockTournaments: Tournament[] = [
  {
    id: 't-1',
    title: 'Copa CT Borü de Muay Thai & K-1 (Estreantes & Graduados)',
    badge: 'Inscrições Abertas',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    modality: 'Muay Thai / K-1',
    date: '14 de Novembro de 2026 // 09:00H',
    location: 'Tatame Principal // CT Borü Porto Velho',
    divisions: ['Pena (-64kg)', 'Leve (-70kg)', 'Médio (-76kg)', 'Meio-Pesado (-82kg)', 'Pesado (+88kg)', 'Absoluto'],
    rules: 'Regras Oficiais K-1 / Muay Thai (3 Rounds com caneleira e protetor bucal)',
    prize: 'Troféu Ouro CT Borü + R$ 1.500 em premiação + Luva Profissional Borü',
    xpPoints: 500,
    registeredCount: 42,
    maxSlots: 64,
    status: 'ABERTO',
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 't-2',
    title: 'Desafio Interno dos Guerreiros Borü (Striking Fight Night)',
    badge: 'Pesagem & Chaves Prontas',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    modality: 'Muay Thai / Kickboxing',
    date: '28 de Novembro de 2026 // 19:30H',
    location: 'Ringue Central // Arena CT Borü',
    divisions: ['Galo (-61kg)', 'Pena (-66kg)', 'Leve (-71kg)', 'Meio-Médio (-77kg)', 'Médio (-84kg)'],
    rules: 'Muay Thai Tradicional // 3 Rounds de 3 Minutos com arbitragem oficial',
    prize: 'Cinturão de Campeão do Desafio Borü + Patrocínio de Equipamentos',
    xpPoints: 450,
    registeredCount: 28,
    maxSlots: 32,
    status: 'CHAVES',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 't-3',
    title: 'Sparring Supervisionado com Mestre Felipe Borü',
    badge: 'Vagas Limitadas',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    modality: 'Sparrings Técnicos',
    date: '05 de Dezembro de 2026 // 10:00H',
    location: 'Tatame de Alta Performance // CT Borü',
    divisions: ['Iniciantes / Intermediários', 'Avançados / Atletas de Competição'],
    rules: 'Sparring Técnico Controlado // Análise e Feedback Individual pós-treino',
    prize: 'Certificado Oficial de Sparring Técnico + Análise no Prontuário + 350 MMR XP',
    xpPoints: 350,
    registeredCount: 20,
    maxSlots: 24,
    status: 'ABERTO',
    image: 'https://images.unsplash.com/photo-1509563423944-b791c380791c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 't-4',
    title: 'Copa Porto Velho Submission & No-Gi (Parceria CT Borü)',
    badge: 'Inscrições em Breve',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    modality: 'Jiu-Jitsu / No-Gi',
    date: '19 de Dezembro de 2026 // 14:00H',
    location: 'Tatame Principal 1 e 2 // CT Borü',
    divisions: ['Pena (-66kg)', 'Leve (-73kg)', 'Médio (-82kg)', 'Pesado (+88kg)'],
    rules: 'Regras Oficiais CBJJ No-Gi (Eliminatória Simples)',
    prize: 'Medalha de Ouro Oficial + Kit Atleta CT Borü + 400 MMR XP',
    xpPoints: 400,
    registeredCount: 14,
    maxSlots: 32,
    status: 'EM_BREVE',
    image: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=800&auto=format&fit=crop&q=80'
  }
];

export function StudentTournamentsTab({ aluno }: { aluno?: any }) {
  const [selectedModality, setSelectedModality] = useState<string>('TODOS');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [inscricaoSucesso, setInscricaoSucesso] = useState<string | null>(null);
  const [minhasInscricoes, setMinhasInscricoes] = useState<string[]>(['t-1']);

  const modalidadesFiltro = ['TODOS', 'Muay Thai / K-1', 'Muay Thai / Kickboxing', 'Sparrings Técnicos', 'Jiu-Jitsu / No-Gi'];

  const torneiosFiltrados = mockTournaments.filter((t) => {
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
            <span>🏆 Circuito Oficial CT Borü 2026</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Próximos Torneios, Copas &amp; Brackets
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Consulte as datas, regras, categorias de peso e inscreva-se para disputar pódios oficiais do CT Borü, acumular pontos de MMR e evoluir no ranking interno da academia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] text-center">
            <span className="block text-xs font-mono font-black text-red-500">
              {minhasInscricoes.length} ATIVA{minhasInscricoes.length > 1 ? 'S' : ''}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Minhas Inscrições</span>
          </div>
        </div>
      </div>

      {/* FILTROS DE MODALIDADE */}
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

      {/* GRADE DE TORNEIOS */}
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
                  ) : tournament.status === 'EM_BREVE' ? (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-bold cursor-not-allowed"
                    >
                      Aguardando Abertura
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setSelectedDivision(tournament.divisions[0] || '');
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-red-600/20 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <span>Inscrever-se</span>
                      <span>🥊</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHAVES INTERATIVAS & BRACKET PREVIEW */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-[#141416] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>🥊</span> Exemplo de Chave de Lutas // Copa CT Borü (Categoria Leve -70kg)
            </h3>
            <p className="text-xs text-zinc-400">
              Visualização da árvore de combates (Bracket eliminatório) atualizada em tempo real.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 self-start sm:self-auto">
            Ao Vivo no CT
          </span>
        </div>

        {/* Árvore de Confrontos Simples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Quartas de Final */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block text-center border-b border-zinc-800 pb-1">
              Quartas de Final
            </span>
            <div className="p-3 rounded-xl border border-zinc-800 bg-[#1A1A1E] space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>1. {aluno?.nome || 'Ítalo Bergamin'}</span>
                <span className="font-mono">V (KO Round 2)</span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>8. Caio "Viper" Silveira</span>
                <span className="font-mono">D</span>
              </div>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-[#1A1A1E] space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>4. Renan Barreto</span>
                <span className="font-mono">V (Pontos 29-28)</span>
              </div>
              <div className="flex justify-between items-center text-zinc-500">
                <span>5. Thiago Martins</span>
                <span className="font-mono">D</span>
              </div>
            </div>
          </div>

          {/* Semifinal */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block text-center border-b border-zinc-800 pb-1">
              Semifinal
            </span>
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-[#1A1A1E] space-y-2.5 text-xs shadow-lg mt-5">
              <div className="flex justify-between items-center font-bold text-white">
                <span className="text-red-400">🥊 {aluno?.nome || 'Ítalo Bergamin'}</span>
                <span className="px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 text-[10px] font-mono">EM DISPUTA</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>🥊 Renan Barreto</span>
                <span className="font-mono text-[10px]">Aguardando Chamada</span>
              </div>
            </div>
          </div>

          {/* Grande Final */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block text-center border-b border-amber-500/30 pb-1">
              🏆 Grande Final &amp; Pódio
            </span>
            <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-[#1A1A1E] to-[#141416] space-y-3 text-xs shadow-2xl mt-5">
              <div className="text-center">
                <span className="text-2xl">🥇</span>
                <p className="font-black text-amber-300 uppercase tracking-widest text-xs mt-1">Troféu Campeão CT Borü</p>
                <p className="text-[10px] text-zinc-400">Vencedor Semifinal 1 vs Gabriel "Pitbull" Costa</p>
              </div>
              <div className="pt-2 border-t border-amber-500/20 text-center text-[10px] text-amber-400 font-mono font-bold">
                Premiação R$ 1.500 + 500 MMR XP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE INSCRIÇÃO */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#141416] p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-red-500">
                  Confirmação de Inscrição // CT Borü
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {selectedTournament.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTournament(null)}
                className="text-zinc-400 hover:text-white font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#1A1A1E] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Atleta:</span>
                <strong className="text-white">{aluno?.nome || 'Aluno Cadastrado'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Modalidade:</span>
                <strong className="text-white">{selectedTournament.modality}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Data &amp; Local:</span>
                <span className="text-white">{selectedTournament.date}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white">
                Selecione sua Categoria de Peso / Divisão:
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-[#1A1A1E] text-white focus:outline-none focus:border-red-500 text-sm font-medium"
              >
                {selectedTournament.divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarInscricao}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center gap-1.5"
              >
                <span>Confirmar Inscrição Oficial</span>
                <span>🏆</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { adminApi } from '../services/api';

interface FirstCheckinIdentificationBannerProps {
  presencas: any[];
  alunos: any[];
  filtroPerfil: 'TODOS' | 'PRIMEIRO_CHECKIN' | 'RECORRENTE';
  onChangeFiltroPerfil: (filtro: 'TODOS' | 'PRIMEIRO_CHECKIN' | 'RECORRENTE') => void;
}

export const FirstCheckinIdentificationBanner: React.FC<FirstCheckinIdentificationBannerProps> = ({
  presencas,
  alunos,
  filtroPerfil,
  onChangeFiltroPerfil,
}) => {
  const [showVerificador, setShowVerificador] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState('');
  const [identificacaoTexto, setIdentificacaoTexto] = useState('');
  const [qtdCheckinsAnteriores, setQtdCheckinsAnteriores] = useState<string>('');
  const [dataUltimoAcesso, setDataUltimoAcesso] = useState<string>('');
  const [dataHoraAtual, setDataHoraAtual] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [loadingVerificacao, setLoadingVerificacao] = useState(false);
  const [resultadoAvaliacao, setResultadoAvaliacao] = useState<any | null>(null);

  // Calcula quantos registros na lista de presenças são de 1º check-in vs recorrentes
  const registrosPrimeiroCheckin = presencas.filter(
    (p) => Boolean(p.isPrimeiroCheckin || p.tagPerfilAcesso === 'Fez seu primeiro check-in' || p.numeroAcesso === 1)
  );
  const registrosRecorrentes = presencas.filter(
    (p) => !(p.isPrimeiroCheckin || p.tagPerfilAcesso === 'Fez seu primeiro check-in' || p.numeroAcesso === 1)
  );

  const handleAvaliarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVerificacao(true);
    setResultadoAvaliacao(null);

    try {
      const alunoObj = alunos.find((a) => a.id === alunoSelecionadoId);
      const nomeFinal = alunoObj ? alunoObj.nome : identificacaoTexto.trim();
      const idFinal = alunoObj ? alunoObj.id : identificacaoTexto.trim();

      // Regra 1: Verificar variáveis obrigatórias (Identificação do aluno)
      if (!nomeFinal && !idFinal) {
        setResultadoAvaliacao({
          verificacaoHistoricoSolicitada: true,
          historicoVerificado: false,
          titulo: '⚠️ Identificação do Aluno/Usuário Ausente',
          mensagem:
            'Informe a identificação do aluno/usuário (ID, nome ou matrícula) e verifique o histórico de check-ins anteriores antes de aplicar a marcação.',
        });
        setLoadingVerificacao(false);
        return;
      }

      // Regra 3: Caso o histórico não seja fornecido na entrada manual, NÃO assumir automaticamente que é a 1ª vez
      if (modoManual && (qtdCheckinsAnteriores === '' || qtdCheckinsAnteriores === null)) {
        setResultadoAvaliacao({
          verificacaoHistoricoSolicitada: true,
          historicoVerificado: false,
          alunoNome: nomeFinal,
          registroAtualDataHora: dataHoraAtual ? new Date(dataHoraAtual).toISOString() : new Date().toISOString(),
          titulo: '⚠️ Verificação de Histórico Necessária (Não Assumir 1ª Vez)',
          mensagem:
            'O histórico de check-ins anteriores do usuário não foi fornecido na entrada de dados. Pela regra operacional, não é permitido assumir automaticamente que é o primeiro acesso — informe ou consulte o histórico antes de aplicar a marcação.',
        });
        setLoadingVerificacao(false);
        return;
      }

      const res = await adminApi.verifyCheckinProfile({
        alunoId: alunoObj?.id || undefined,
        nome: nomeFinal || undefined,
        cpf: alunoObj?.cpf || undefined,
        checkinsAnterioresCount: modoManual ? Number(qtdCheckinsAnteriores) : undefined,
        dataUltimoAcesso: modoManual && dataUltimoAcesso ? dataUltimoAcesso : undefined,
        registroAtualDataHora: dataHoraAtual ? new Date(dataHoraAtual).toISOString() : new Date().toISOString(),
        modoEntradaManualSemBanco: modoManual,
      });

      const data = res.data;
      if (data.verificacaoHistoricoSolicitada) {
        setResultadoAvaliacao({
          verificacaoHistoricoSolicitada: true,
          historicoVerificado: false,
          alunoNome: nomeFinal,
          titulo: '⚠️ Verificação de Histórico Solicitada',
          mensagem:
            data.mensagem ||
            data.erro ||
            'Verifique o histórico de check-ins do aluno antes de aplicar a marcação de primeiro acesso.',
        });
      } else if (data.perfilAcesso) {
        setResultadoAvaliacao({
          verificacaoHistoricoSolicitada: false,
          historicoVerificado: true,
          ...data.perfilAcesso,
        });
      } else if (data.historico) {
        const qtdAnt = Number(data.historico.totalCheckinsRegistrados || 0);
        const isPrimeiro = qtdAnt === 0;
        setResultadoAvaliacao({
          verificacaoHistoricoSolicitada: false,
          historicoVerificado: true,
          alunoIdentificacao: data.aluno,
          isPrimeiroCheckin: isPrimeiro,
          tagPerfilAcesso: isPrimeiro ? 'Fez seu primeiro check-in' : 'Check-in recorrente',
          checkinsAnterioresCount: qtdAnt,
          totalAcessos: qtdAnt + 1,
          registroAtualDataHora: dataHoraAtual ? new Date(dataHoraAtual).toISOString() : new Date().toISOString(),
          dataPrimeiroCheckin:
            data.historico.dataPrimeiroCheckin ||
            (dataHoraAtual ? new Date(dataHoraAtual).toISOString() : new Date().toISOString()),
          dataUltimoAcessoAnterior: data.historico.dataUltimoCheckin,
          resumoClassificacao: isPrimeiro
            ? 'Fez seu primeiro check-in (0 check-ins anteriores verificados no histórico)'
            : `Check-in recorrente (${qtdAnt + 1}º acesso • ${qtdAnt} check-in(s) anterior(es) no histórico)`,
          alertaOperacionalAcolhimento: isPrimeiro
            ? `ACOLHIMENTO INICIAL: ${data.aluno?.nome} (${data.aluno?.matricula}) está fazendo seu primeiro check-in na unidade! Realizar recepção de boas-vindas, apresentação do espaço/tatame e acompanhamento de entrada.`
            : null,
        });
      }
    } catch (err: any) {
      setResultadoAvaliacao({
        verificacaoHistoricoSolicitada: true,
        historicoVerificado: false,
        titulo: '⚠️ Verificação de Histórico Necessária',
        mensagem:
          err.response?.data?.erro ||
          'Não foi possível localizar o histórico automático deste usuário. Verifique o histórico de check-ins anteriores antes de aplicar a marcação de primeiro acesso.',
      });
    } finally {
      setLoadingVerificacao(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#17171C] via-[#141418] to-amber-950/20 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-black">
              🌟 Módulo de Identificação de Primeiro Check-in
            </span>
            <span className="text-[11px] font-bold text-amber-300">
              Rastreamento de Estreantes vs Alunos Recorrentes
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-white mt-1">
            Diferenciação Operacional de Acesso no Portal & Recepção do Tatame
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sinaliza automaticamente quem <strong className="text-amber-300">"Fez seu primeiro check-in"</strong> (0 acessos anteriores — acolhimento inicial e apresentação do espaço) e quem possui <strong className="text-emerald-300">"Check-in recorrente"</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              onChangeFiltroPerfil(filtroPerfil === 'PRIMEIRO_CHECKIN' ? 'TODOS' : 'PRIMEIRO_CHECKIN')
            }
            className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
              filtroPerfil === 'PRIMEIRO_CHECKIN'
                ? 'bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-500/20'
                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/40'
            }`}
          >
            <span>🌟 Fez seu primeiro check-in</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {registrosPrimeiroCheckin.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeFiltroPerfil(filtroPerfil === 'RECORRENTE' ? 'TODOS' : 'RECORRENTE')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
              filtroPerfil === 'RECORRENTE'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/20'
                : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <span>🔄 Check-in recorrente</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
              {registrosRecorrentes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowVerificador(!showVerificador)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition"
          >
            {showVerificador ? '✕ Fechar Verificador' : '🔍 Verificar / Simular Check-in'}
          </button>
        </div>
      </div>

      {/* ALERTA DE ESTREANTES DO DIA / RECENTES PARA ACOLHIMENTO DA EQUIPE */}
      {registrosPrimeiroCheckin.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-amber-200">
            <strong className="text-amber-300 uppercase tracking-wide">
              🤝 Atenção Equipe / Recepção ({registrosPrimeiroCheckin.length} estreante(s) identificado(s)):
            </strong>{' '}
            {registrosPrimeiroCheckin
              .slice(0, 4)
              .map((p) => p.aluno?.nome || 'Aluno')
              .join(', ')}
            {registrosPrimeiroCheckin.length > 4 ? ` e mais ${registrosPrimeiroCheckin.length - 4}` : ''} — realizar acolhimento inicial, apresentação do tatame e acompanhamento de entrada.
          </div>
          {filtroPerfil !== 'PRIMEIRO_CHECKIN' && (
            <button
              type="button"
              onClick={() => onChangeFiltroPerfil('PRIMEIRO_CHECKIN')}
              className="text-[11px] font-black text-amber-300 hover:text-amber-200 underline shrink-0"
            >
              Filtrar estreantes →
            </button>
          )}
        </div>
      )}

      {/* PAINEL INTERATIVO DE VERIFICAÇÃO & VALIDAÇÃO DE REGRAS (HISTÓRICO ANTERIOR VS 1º ACESSO) */}
      {showVerificador && (
        <div className="pt-3 border-t border-zinc-800 space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
              📋 Verificador de Histórico & Classificação de Check-in
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setModoManual(false);
                  setResultadoAvaliacao(null);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  !modoManual
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                1. Consulta Automática no Banco
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoManual(true);
                  setResultadoAvaliacao(null);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  modoManual
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                2. Entrada Manual de Dados
              </button>
            </div>
          </div>

          <form onSubmit={handleAvaliarPerfil} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
            {!modoManual ? (
              <div className="lg:col-span-5">
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  1. Identificação do Aluno (ID, Nome ou Matrícula):
                </label>
                <select
                  value={alunoSelecionadoId}
                  onChange={(e) => setAlunoSelecionadoId(e.target.value)}
                  className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="">Selecione um aluno cadastrado...</option>
                  {alunos.map((al) => (
                    <option key={al.id} value={al.id}>
                      {al.nome} ({al.matricula || `ID: ${al.id.slice(0, 6)}`}) — Histórico: {al.totalCheckinsHistorico ?? 0} check-in(s)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    1. Aluno (ID, Nome ou Matrícula):
                  </label>
                  <input
                    type="text"
                    value={identificacaoTexto}
                    onChange={(e) => setIdentificacaoTexto(e.target.value)}
                    placeholder="Ex: João Silva / BORU-2026-01"
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    2. Qtd. Check-ins Anteriores:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qtdCheckinsAnteriores}
                    onChange={(e) => setQtdCheckinsAnteriores(e.target.value)}
                    placeholder="Deixe vazio p/ testar falta de histórico"
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Último Acesso (Opcional):
                  </label>
                  <input
                    type="date"
                    value={dataUltimoAcesso}
                    onChange={(e) => setDataUltimoAcesso(e.target.value)}
                    className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  />
                </div>
              </>
            )}

            <div className={modoManual ? 'lg:col-span-2' : 'lg:col-span-4'}>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                3. Data e Hora do Check-in Atual:
              </label>
              <input
                type="datetime-local"
                value={dataHoraAtual}
                onChange={(e) => setDataHoraAtual(e.target.value)}
                className="w-full bg-[#0E0E11] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className={modoManual ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <button
                type="submit"
                disabled={loadingVerificacao}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow-md"
              >
                {loadingVerificacao ? 'Verificando...' : '✓ Avaliar Acesso'}
              </button>
            </div>
          </form>

          {resultadoAvaliacao && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                resultadoAvaliacao.verificacaoHistoricoSolicitada
                  ? 'bg-red-950/50 border-red-500/50 text-red-200'
                  : resultadoAvaliacao.isPrimeiroCheckin
                  ? 'bg-gradient-to-r from-amber-950/70 via-emerald-950/50 to-amber-950/40 border-amber-400/70 text-amber-100'
                  : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {resultadoAvaliacao.verificacaoHistoricoSolicitada ? (
                <div>
                  <div className="font-black text-sm text-red-300">{resultadoAvaliacao.titulo}</div>
                  <p className="mt-1">{resultadoAvaliacao.mensagem}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-black text-sm">
                      {resultadoAvaliacao.alunoIdentificacao?.nome || 'Aluno'}{' '}
                      {resultadoAvaliacao.alunoIdentificacao?.matricula
                        ? `(${resultadoAvaliacao.alunoIdentificacao.matricula})`
                        : ''}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                        resultadoAvaliacao.isPrimeiroCheckin
                          ? 'bg-amber-400 text-black border-amber-300 shadow'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {resultadoAvaliacao.isPrimeiroCheckin
                        ? '🌟 Fez seu primeiro check-in'
                        : `🔄 Check-in recorrente • ${resultadoAvaliacao.totalAcessos}º acesso`}
                    </span>
                  </div>

                  <p className="font-semibold">{resultadoAvaliacao.resumoClassificacao}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] opacity-90 pt-1">
                    <span>
                      📊 <strong>Check-ins anteriores:</strong> {resultadoAvaliacao.checkinsAnterioresCount}
                    </span>
                    <span>
                      🔢 <strong>Total de acessos (com o atual):</strong> {resultadoAvaliacao.totalAcessos}
                    </span>
                    {resultadoAvaliacao.registroAtualDataHora && (
                      <span>
                        🕒 <strong>Check-in atual:</strong>{' '}
                        {new Date(resultadoAvaliacao.registroAtualDataHora).toLocaleString('pt-BR')}
                      </span>
                    )}
                    {resultadoAvaliacao.dataPrimeiroCheckin && (
                      <span>
                        📅 <strong>Data do 1º check-in (salva no histórico):</strong>{' '}
                        {new Date(resultadoAvaliacao.dataPrimeiroCheckin).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {resultadoAvaliacao.dataUltimoAcessoAnterior && (
                      <span>
                        ⏮️ <strong>Último acesso anterior:</strong>{' '}
                        {new Date(resultadoAvaliacao.dataUltimoAcessoAnterior).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {resultadoAvaliacao.isPrimeiroCheckin && resultadoAvaliacao.alertaOperacionalAcolhimento && (
                    <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 font-bold">
                      🤝 {resultadoAvaliacao.alertaOperacionalAcolhimento}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

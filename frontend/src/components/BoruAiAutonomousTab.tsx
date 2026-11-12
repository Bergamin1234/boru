import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

interface BoruAiAutonomousTabProps {
  usuarioLogado?: any;
}

export const BoruAiAutonomousTab: React.FC<BoruAiAutonomousTabProps> = ({ usuarioLogado }) => {
  const [subTab, setSubTab] = useState<'inbox' | 'simulador' | 'followups' | 'relatorios' | 'config'>('inbox');
  const [periodo, setPeriodo] = useState<string>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingMaster, setTogglingMaster] = useState<boolean>(false);

  // Dados do Dashboard e Configuração Central
  const [config, setConfig] = useState<any>(null);
  const [indicadores, setIndicadores] = useState<any>(null);
  const [inteligenciaGestao, setInteligenciaGestao] = useState<any>(null);
  const [ultimasOperacoes, setUltimasOperacoes] = useState<any[]>([]);
  const [ticketsRecentes, setTicketsRecentes] = useState<any[]>([]);
  const [followUpsRecentes, setFollowUpsRecentes] = useState<any[]>([]);

  // Dados da Central de Conversas (Inbox)
  const [conversas, setConversas] = useState<any[]>([]);
  const [filtroStatusConv, setFiltroStatusConv] = useState<string>('TODAS');
  const [filtroTipoConv, setFiltroTipoConv] = useState<string>('TODOS');
  const [buscaConv, setBuscaConv] = useState<string>('');
  const [conversaSelecionadaId, setConversaSelecionadaId] = useState<string | null>(null);
  const [conversaDetalhe, setConversaDetalhe] = useState<any>(null);
  const [alunoVinculado, setAlunoVinculado] = useState<any>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState<boolean>(false);

  // Envio Manual e Aprovação Assistida
  const [mensagemManual, setMensagemManual] = useState<string>('');
  const [enviandoManual, setEnviandoManual] = useState<boolean>(false);
  const [textoEdicaoAssistida, setTextoEdicaoAssistida] = useState<Record<string, string>>({});

  // Simulador Sandbox (Fase 6)
  const [simTelefone, setSimTelefone] = useState<string>('(69) 99911-2233');
  const [simNome, setSimNome] = useState<string>('Lucas Martins');
  const [simConteudo, setSimConteudo] = useState<string>('');
  const [simTipoMidia, setSimTipoMidia] = useState<'TEXT' | 'AUDIO'>('TEXT');
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simUltimoResultado, setSimUltimoResultado] = useState<any>(null);

  // Formulário de Configurações
  const [configForm, setConfigForm] = useState<any>({
    whatsappPhoneNumber: '(69) 99238-4491',
    whatsappPhoneNumberId: '',
    whatsappVerifyToken: 'boru_ia_webhook_verify_2026',
    pixChaveOficial: 'borucentrodecombate@gmail.com',
    pixFavorecido: 'BORÜ Centro de Combate',
    linkPagamentoOficial: 'https://www.borucentrodecombate.com/portal',
    businessHoursOnlyFollowUp: true,
    followUpStartHour: 8,
    followUpEndHour: 20,
    maxFollowUpsPerContact: 3,
    minHoursBetweenFollowUps: 24
  });
  const [salvandoConfig, setSalvandoConfig] = useState<boolean>(false);

  const operadorNome = usuarioLogado?.nome || 'Administrador BORÜ';

  const carregarDadosGerais = useCallback(async () => {
    try {
      const [dashRes, convRes] = await Promise.all([
        adminApi.getAiDashboard(periodo),
        adminApi.getAiConversations({
          status: filtroStatusConv,
          tipo: filtroTipoConv,
          busca: buscaConv
        })
      ]);

      const d = dashRes.data;
      setConfig(d.config);
      setIndicadores(d.indicadores);
      setInteligenciaGestao(d.inteligenciaGestao);
      setUltimasOperacoes(d.ultimasOperacoes || []);
      setTicketsRecentes(d.ticketsRecentes || []);
      setFollowUpsRecentes(d.followUpsRecentes || []);

      if (d.config) {
        setConfigForm({
          whatsappPhoneNumber: d.config.whatsappPhoneNumber || '(69) 99238-4491',
          whatsappPhoneNumberId: d.config.whatsappPhoneNumberId || '',
          whatsappVerifyToken: d.config.whatsappVerifyToken || 'boru_ia_webhook_verify_2026',
          pixChaveOficial: d.config.pixChaveOficial || 'borucentrodecombate@gmail.com',
          pixFavorecido: d.config.pixFavorecido || 'BORÜ Centro de Combate',
          linkPagamentoOficial: d.config.linkPagamentoOficial || 'https://www.borucentrodecombate.com/portal',
          businessHoursOnlyFollowUp: Boolean(d.config.businessHoursOnlyFollowUp),
          followUpStartHour: d.config.followUpStartHour ?? 8,
          followUpEndHour: d.config.followUpEndHour ?? 20,
          maxFollowUpsPerContact: d.config.maxFollowUpsPerContact ?? 3,
          minHoursBetweenFollowUps: d.config.minHoursBetweenFollowUps ?? 24
        });
      }

      const listaConvs = convRes.data?.conversas || [];
      setConversas(listaConvs);

      if (!conversaSelecionadaId && listaConvs.length > 0) {
        setConversaSelecionadaId(listaConvs[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar painel BORÜ IA:', err);
    } finally {
      setLoading(false);
    }
  }, [periodo, filtroStatusConv, filtroTipoConv, buscaConv, conversaSelecionadaId]);

  const carregarDetalheConversa = useCallback(async (id: string) => {
    setLoadingDetalhe(true);
    try {
      const res = await adminApi.getAiConversationDetail(id);
      setConversaDetalhe(res.data.conversa);
      setAlunoVinculado(res.data.alunoVinculado || null);
    } catch (err) {
      console.error('Erro ao carregar conversa:', err);
    } finally {
      setLoadingDetalhe(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosGerais();
    const timer = setInterval(carregarDadosGerais, 12000);
    return () => clearInterval(timer);
  }, [carregarDadosGerais]);

  useEffect(() => {
    if (conversaSelecionadaId) {
      carregarDetalheConversa(conversaSelecionadaId);
    }
  }, [conversaSelecionadaId, carregarDetalheConversa]);

  // ==========================================================================
  // AÇÕES DE CONTROLE MESTRE (BOTÃO ÚNICO ON/OFF E MODOS)
  // ==========================================================================

  const handleToggleMasterIa = async (novoEstado: boolean) => {
    setTogglingMaster(true);
    try {
      const res = await adminApi.toggleAiMaster({
        enabled: novoEstado,
        mode: novoEstado ? (config?.mode === 'MODO_MANUAL' ? 'IA_AUTONOMA' : config?.mode || 'IA_AUTONOMA') : config?.mode,
        operador: operadorNome
      });
      setConfig(res.data.config);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao alterar estado da IA.');
    } finally {
      setTogglingMaster(false);
    }
  };

  const handleChangeOperatingMode = async (novoModo: 'IA_AUTONOMA' | 'IA_ASSISTIDA' | 'MODO_MANUAL') => {
    setTogglingMaster(true);
    try {
      const res = await adminApi.toggleAiMaster({
        enabled: novoModo === 'MODO_MANUAL' ? false : true,
        mode: novoModo,
        operador: operadorNome
      });
      setConfig(res.data.config);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao mudar modo de operação.');
    } finally {
      setTogglingMaster(false);
    }
  };

  // ==========================================================================
  // AÇÕES INDIVIDUAIS POR CONVERSA
  // ==========================================================================

  const handleAssumirConversa = async (id: string) => {
    try {
      await adminApi.assumeAiConversation(id, operadorNome);
      await carregarDetalheConversa(id);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao assumir conversa.');
    }
  };

  const handleDevolverParaIa = async (id: string) => {
    try {
      await adminApi.returnConversationToAi(id, operadorNome);
      await carregarDetalheConversa(id);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao devolver conversa para a IA.');
    }
  };

  const handleEnviarMensagemManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversaSelecionadaId || !mensagemManual.trim()) return;
    setEnviandoManual(true);
    try {
      await adminApi.sendManualWhatsAppMessage(conversaSelecionadaId, {
        conteudo: mensagemManual.trim(),
        atendenteNome: operadorNome,
        pausarIa: true
      });
      setMensagemManual('');
      await carregarDetalheConversa(conversaSelecionadaId);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao enviar mensagem.');
    } finally {
      setEnviandoManual(false);
    }
  };

  const handleAprovarMensagemAssistida = async (msgId: string) => {
    try {
      await adminApi.approveAssistedMessage(msgId, {
        textoEditado: textoEdicaoAssistida[msgId],
        aprovadoPor: operadorNome
      });
      if (conversaSelecionadaId) await carregarDetalheConversa(conversaSelecionadaId);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao aprovar resposta.');
    }
  };

  const handleRejeitarMensagemAssistida = async (msgId: string) => {
    try {
      await adminApi.rejectAssistedMessage(msgId);
      if (conversaSelecionadaId) await carregarDetalheConversa(conversaSelecionadaId);
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao descartar sugestão.');
    }
  };

  // ==========================================================================
  // SIMULADOR SANDBOX (FASE 6)
  // ==========================================================================

  const dispararSimulacao = async (payloadCustom?: {
    telefone: string;
    nomeContato: string;
    conteudo: string;
    tipoMidia?: 'TEXT' | 'AUDIO';
    transcricaoAudio?: string;
  }) => {
    const dados = payloadCustom || {
      telefone: simTelefone,
      nomeContato: simNome,
      conteudo: simConteudo,
      tipoMidia: simTipoMidia,
      transcricaoAudio: simTipoMidia === 'AUDIO' ? simConteudo : undefined
    };

    if (!dados.conteudo.trim()) {
      alert('Digite uma mensagem ou escolha um cenário de teste.');
      return;
    }

    setSimLoading(true);
    try {
      const res = await adminApi.simulateWhatsAppMessage(dados);
      setSimUltimoResultado(res.data.resultado);
      setSimConteudo('');
      const convId = res.data.resultado?.conversationId;
      if (convId) {
        setConversaSelecionadaId(convId);
        await carregarDetalheConversa(convId);
      }
      await carregarDadosGerais();
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao simular mensagem.');
    } finally {
      setSimLoading(false);
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    try {
      await adminApi.updateAiConfig({ ...configForm, updatedBy: operadorNome });
      await carregarDadosGerais();
      alert('Configurações da BORÜ IA AUTÔNOMA salvas com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao salvar configurações.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  const isIaAtiva = Boolean(config?.enabled);
  const modoAtual = config?.mode || 'IA_AUTONOMA';

  let dossieTransferencia: any = null;
  if (conversaDetalhe?.dossieTransferenciaJson) {
    try {
      dossieTransferencia = JSON.parse(conversaDetalhe.dossieTransferenciaJson);
    } catch {
      dossieTransferencia = null;
    }
  }

  return (
    <div className="space-y-6 text-zinc-100">
      {/* ====================================================================
          CABEÇALHO EXECUTIVO & BOTÃO PRINCIPAL ÚNICO (ATIVAR IA / DESATIVAR IA)
      ==================================================================== */}
      <div
        className={`rounded-2xl border-2 p-5 sm:p-6 transition-all shadow-2xl ${
          isIaAtiva
            ? 'bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border-emerald-500/70 shadow-emerald-950/30'
            : 'bg-gradient-to-r from-red-950/50 via-zinc-900 to-zinc-950 border-red-600/70 shadow-red-950/30'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Identidade do Sistema */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                  isIaAtiva
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isIaAtiva ? 'bg-emerald-400 animate-ping' : 'bg-red-500'
                  }`}
                />
                {isIaAtiva ? `ONLINE • ${modoAtual.replace('_', ' ')}` : 'OFFLINE • ATENDIMENTO HUMANO MANUAL'}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800/90 border border-zinc-700 text-zinc-300">
                📱 WhatsApp Oficial: <strong className="text-white">{config?.whatsappPhoneNumber || '(69) 99238-4491'}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              🐺 BORÜ IA AUTÔNOMA — <span className="text-amber-400">INTELLIGENT OPERATIONS</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              {isIaAtiva
                ? 'A Inteligência Artificial está ativa no backend: recebendo mensagens do WhatsApp, identificando alunos e interessados, consultando dados reais do banco, agendando aulas experimentais e registrando todas as operações.'
                : 'A Inteligência Artificial está DESATIVADA no backend. Nenhuma resposta automática ou follow-up será enviado até que você clique em ATIVAR IA. O histórico permanece 100% preservado para os atendentes humanos.'}
            </p>
          </div>

          {/* BOTÃO PRINCIPAL MESTRE (ATIVAR IA / DESATIVAR IA) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {!isIaAtiva ? (
              <button
                onClick={() => handleToggleMasterIa(true)}
                disabled={togglingMaster}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-900/50 border border-emerald-400/50 transition transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span className="text-xl">⚡</span>
                <div className="text-left">
                  <span className="block leading-none">{togglingMaster ? 'ATIVANDO...' : 'ATIVAR IA'}</span>
                  <span className="text-[10px] font-semibold text-emerald-100 block mt-0.5">
                    Iniciar Atendimento Autônomo
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => handleToggleMasterIa(false)}
                disabled={togglingMaster}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:brightness-110 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-red-900/50 border border-red-400/50 transition transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span className="text-xl">🛑</span>
                <div className="text-left">
                  <span className="block leading-none">{togglingMaster ? 'DESATIVANDO...' : 'DESATIVAR IA'}</span>
                  <span className="text-[10px] font-semibold text-red-100 block mt-0.5">
                    Parar Respostas e Devolver a Humanos
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* SELETOR DOS 3 MODOS DE OPERAÇÃO */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Modo de Operação no Backend:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
            <button
              onClick={() => handleChangeOperatingMode('IA_AUTONOMA')}
              disabled={togglingMaster}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                isIaAtiva && modoAtual === 'IA_AUTONOMA'
                  ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                IA AUTÔNOMA
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Responde e agenda sozinha 24/7</div>
            </button>

            <button
              onClick={() => handleChangeOperatingMode('IA_ASSISTIDA')}
              disabled={togglingMaster}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                isIaAtiva && modoAtual === 'IA_ASSISTIDA'
                  ? 'bg-amber-950/80 border-amber-500 text-white shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                IA ASSISTIDA
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Prepara resposta e humano aprova</div>
            </button>

            <button
              onClick={() => handleChangeOperatingMode('MODO_MANUAL')}
              disabled={togglingMaster}
              className={`px-3.5 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                !isIaAtiva || modoAtual === 'MODO_MANUAL'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-black uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                MODO MANUAL
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Somente atendentes humanos</div>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          GRADE DE INDICADORES OBRIGATÓRIOS EM TEMPO REAL (10 CARDS)
      ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Conversas Atendidas
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {indicadores?.conversasAtendidas ?? 0}
          </div>
          <span className="text-[11px] text-emerald-400">
            Tempo médio: {indicadores?.tempoMedioRespostaFormatado || '0.4s'}
          </span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Msgs Recebidas / Respondidas
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {indicadores?.mensagensRecebidas ?? 0}{' '}
            <span className="text-zinc-500 text-lg">/</span>{' '}
            <span className="text-emerald-400">{indicadores?.mensagensRespondidas ?? 0}</span>
          </div>
          <span className="text-[11px] text-amber-400">
            {indicadores?.mensagensAguardandoAprovacao ?? 0} aguardando aprovação
          </span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Interessados & Experimentais
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {indicadores?.interessadosCaptados ?? 0} <span className="text-xs text-zinc-400">leads</span> •{' '}
            <span className="text-white">{indicadores?.aulasExperimentaisAgendadas ?? 0}</span>{' '}
            <span className="text-xs text-zinc-400">aulas</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Comparecimento: {indicadores?.comparecimentoExperimentais ?? 0}
          </span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Matrículas & Conversão
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {indicadores?.matriculasOriginadas ?? 0}{' '}
            <span className="text-xs font-bold text-zinc-300">
              ({indicadores?.taxaConversaoPercent ?? 0}%)
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Inadimplência ativa: {indicadores?.inadimplenciaIdentificada ?? 0}
          </span>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Transferências & Saúde
          </span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {indicadores?.solicitacoesEncaminhadasHumanos ?? 0}{' '}
            <span className="text-xs text-zinc-400 font-normal">handoffs</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Falhas de integração: <strong className="text-white">{indicadores?.falhasIntegracao ?? 0}</strong>
          </span>
        </div>
      </div>

      {/* ====================================================================
          NAVEGAÇÃO DE MÓDULOS DA BORÜ IA AUTÔNOMA
      ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setSubTab('inbox')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            subTab === 'inbox'
              ? 'bg-red-600/20 border-red-500 text-white font-bold'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="text-xs uppercase font-black">💬 Conversas Ao Vivo</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Assumir, pausar ou aprovar</div>
        </button>

        <button
          onClick={() => setSubTab('simulador')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            subTab === 'simulador'
              ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="text-xs uppercase font-black">🧪 Testar IA (Sandbox)</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Simular clientes e alunos</div>
        </button>

        <button
          onClick={() => setSubTab('followups')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            subTab === 'followups'
              ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="text-xs uppercase font-black">🔁 Follow-ups & Tickets</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {indicadores?.followUpsPendentes ?? 0} fila • {indicadores?.ticketsAbertos ?? 0} protocolos
          </div>
        </button>

        <button
          onClick={() => setSubTab('relatorios')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            subTab === 'relatorios'
              ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="text-xs uppercase font-black">📊 Inteligência & Logs</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Auditoria de tools e CSV</div>
        </button>

        <button
          onClick={() => setSubTab('config')}
          className={`p-3 rounded-xl border text-left transition cursor-pointer col-span-2 sm:col-span-1 ${
            subTab === 'config'
              ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="text-xs uppercase font-black">⚙️ Conexão WhatsApp</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Webhook Cloud API & Regras</div>
        </button>
      </div>

      {/* ====================================================================
          ABA 1: CENTRAL DE CONVERSAS AO VIVO & CONTROLE INDIVIDUAL
      ==================================================================== */}
      {subTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Coluna Esquerda: Lista de Conversas */}
          <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[640px]">
            <div className="space-y-2.5 pb-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Atendimentos WhatsApp ({conversas.length})
                </h3>
                <button
                  onClick={() => setSubTab('simulador')}
                  className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  + Simular Conversa
                </button>
              </div>

              <input
                type="text"
                placeholder="Buscar por nome, telefone ou mensagem..."
                value={buscaConv}
                onChange={e => setBuscaConv(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filtroStatusConv}
                  onChange={e => setFiltroStatusConv(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300"
                >
                  <option value="TODAS">Status: Todas</option>
                  <option value="IA_ATIVA">🤖 IA Ativa</option>
                  <option value="AGUARDANDO_APROVACAO">🟡 Aguardando Aprovação</option>
                  <option value="TRANSFERIDA_HUMANO">🚨 Transferida p/ Humano</option>
                  <option value="PAUSADA_HUMANO">🖐️ Assumida por Humano</option>
                </select>

                <select
                  value={filtroTipoConv}
                  onChange={e => setFiltroTipoConv(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300"
                >
                  <option value="TODOS">Perfil: Todos</option>
                  <option value="LEAD">🔥 Interessados (Leads)</option>
                  <option value="ALUNO">🥋 Alunos Matriculados</option>
                  <option value="RESPONSAVEL">👨‍👦 Pais / Responsáveis</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 mt-2 pr-1">
              {conversas.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <p className="text-xs text-zinc-400">
                    Nenhuma conversa registrada neste filtro ainda.
                  </p>
                  <button
                    onClick={() => setSubTab('simulador')}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    🧪 Abrir Simulador de WhatsApp
                  </button>
                </div>
              ) : (
                conversas.map(c => {
                  const selecionada = c.id === conversaSelecionadaId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setConversaSelecionadaId(c.id)}
                      className={`p-3 rounded-xl transition cursor-pointer my-1 ${
                        selecionada
                          ? 'bg-red-950/50 border border-red-500/60'
                          : 'hover:bg-zinc-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white truncate">{c.nomeContato}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            c.statusAtendimento === 'TRANSFERIDA_HUMANO'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : c.statusAtendimento === 'AGUARDANDO_APROVACAO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : c.iaPausadaIndividual
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {c.statusAtendimento === 'TRANSFERIDA_HUMANO'
                            ? '🚨 Handoff Humano'
                            : c.statusAtendimento === 'AGUARDANDO_APROVACAO'
                            ? '🟡 Aprovar IA'
                            : c.iaPausadaIndividual
                            ? '🖐️ Manual'
                            : '🤖 IA Ativa'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                        <span>{c.telefoneExibicao || c.telefone}</span>
                        <span className="font-semibold text-amber-400">{c.tipoContato}</span>
                      </div>

                      <p className="text-[11px] text-zinc-300 truncate mt-1.5">
                        {c.ultimaMensagemTexto || 'Sem mensagens'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna Central: Chat Completo e Ações Manuais/Assistidas */}
          <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col h-[640px] overflow-hidden">
            {!conversaDetalhe ? (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 p-6 text-center">
                {loadingDetalhe
                  ? 'Carregando histórico da conversa...'
                  : 'Selecione uma conversa à esquerda ou simule um atendimento na aba Sandbox.'}
              </div>
            ) : (
              <>
                {/* Barra Superior da Conversa com Controles Individuais */}
                <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-white">{conversaDetalhe.nomeContato}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold">
                        {conversaDetalhe.tipoContato}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block">
                      {conversaDetalhe.telefoneExibicao || conversaDetalhe.telefone} • Etapa:{' '}
                      <strong className="text-zinc-200">{conversaDetalhe.etapaFunil}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!conversaDetalhe.iaPausadaIndividual &&
                    conversaDetalhe.statusAtendimento !== 'TRANSFERIDA_HUMANO' ? (
                      <button
                        onClick={() => handleAssumirConversa(conversaDetalhe.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition cursor-pointer"
                      >
                        🖐️ Assumir / Pausar IA
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDevolverParaIa(conversaDetalhe.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition cursor-pointer"
                      >
                        🤖 Devolver conversa à IA
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0c0c0e]">
                  {(conversaDetalhe.mensagens || []).map((msg: any) => {
                    const isContato = msg.remetente === 'CONTATO';
                    const isPendingApproval = msg.statusEnvio === 'PENDING_APPROVAL';
                    let toolsList: string[] = [];
                    if (msg.toolsAcionadasJson) {
                      try {
                        toolsList = JSON.parse(msg.toolsAcionadasJson);
                      } catch {
                        toolsList = [];
                      }
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isContato ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed border ${
                            isContato
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tl-none'
                              : isPendingApproval
                              ? 'bg-amber-950/60 border-amber-500/70 text-amber-100 rounded-tr-none'
                              : msg.remetente === 'HUMANO'
                              ? 'bg-blue-950/60 border-blue-500/50 text-blue-100 rounded-tr-none'
                              : 'bg-emerald-950/60 border-emerald-600/50 text-emerald-50 rounded-tr-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-bold">
                            <span>
                              {isContato
                                ? `👤 ${conversaDetalhe.nomeContato}`
                                : msg.remetente === 'HUMANO'
                                ? `👨‍💼 ${msg.remetenteNome || 'Atendente Humano'}`
                                : `🤖 ${msg.remetenteNome || 'BORÜ IA Autônoma'}`}
                            </span>
                            <span>
                              {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="whitespace-pre-wrap">{msg.conteudo}</div>

                          {/* Tags de Tools Acionadas pela IA */}
                          {toolsList.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-white/10 flex flex-wrap gap-1">
                              {toolsList.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-mono text-amber-300 border border-amber-500/30"
                                >
                                  🛠️ {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Caixa de Aprovação no Modo Assistido */}
                          {isPendingApproval && (
                            <div className="mt-3 pt-2.5 border-t border-amber-500/40 space-y-2">
                              <span className="text-[10px] font-black uppercase text-amber-300 block">
                                🟡 Modo Assistido — Revise ou aprove o envio:
                              </span>
                              <textarea
                                rows={3}
                                value={
                                  textoEdicaoAssistida[msg.id] !== undefined
                                    ? textoEdicaoAssistida[msg.id]
                                    : msg.conteudo
                                }
                                onChange={e =>
                                  setTextoEdicaoAssistida({
                                    ...textoEdicaoAssistida,
                                    [msg.id]: e.target.value
                                  })
                                }
                                className="w-full bg-zinc-950 border border-amber-500/50 rounded-lg p-2 text-xs text-white"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAprovarMensagemAssistida(msg.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  ✅ Aprovar e Enviar
                                </button>
                                <button
                                  onClick={() => handleRejeitarMensagemAssistida(msg.id)}
                                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-600/30 text-zinc-300 text-[11px] cursor-pointer"
                                >
                                  ❌ Descartar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barra de Envio Manual pelo Administrador / Atendente */}
                <form
                  onSubmit={handleEnviarMensagemManual}
                  className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Enviar mensagem manual como atendente (pausa a IA para este contato)..."
                    value={mensagemManual}
                    onChange={e => setMensagemManual(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-red-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={enviandoManual || !mensagemManual.trim()}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    {enviandoManual ? 'Enviando...' : 'Enviar Manual'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Coluna Direita: Dossiê de Transferência Humana, Contexto 360° e Operações Executadas */}
          <div className="lg:col-span-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 h-[640px] overflow-y-auto space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              🔎 Inspetor de Operações & Contexto
            </h3>

            {!conversaDetalhe ? (
              <p className="text-xs text-zinc-500">Nenhuma conversa selecionada.</p>
            ) : (
              <>
                {/* Dossiê de Transferência para Atendimento Humano (Se Handoff ativo) */}
                {dossieTransferencia && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border-2 border-red-500/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-300">
                        🚨 Dossiê de Handoff Humano
                      </span>
                      <span className="text-[10px] font-mono text-amber-300">
                        {dossieTransferencia.protocolo}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      Motivo: {dossieTransferencia.motivoAtendimento}
                    </p>
                    <p className="text-[11px] text-zinc-300">
                      <strong>Coletado:</strong> {dossieTransferencia.informacoesColetadas}
                    </p>
                    <p className="text-[11px] text-emerald-300">
                      <strong>Próxima Providência:</strong>{' '}
                      {dossieTransferencia.proximaProvidenciaRecomendada}
                    </p>
                  </div>
                )}

                {/* Vínculo com Aluno Cadastrado */}
                {alunoVinculado ? (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block">
                      🥋 Aluno Matriculado Identificado
                    </span>
                    <div>
                      <strong>Nome:</strong> {alunoVinculado.nome}
                    </div>
                    <div>
                      <strong>Plano:</strong> {alunoVinculado.plano} ({alunoVinculado.modalidade})
                    </div>
                    <div>
                      <strong>Graduação:</strong> {alunoVinculado.prajied}
                    </div>
                    <div>
                      <strong>XP / Pontos:</strong> {alunoVinculado.total_xp} XP •{' '}
                      {alunoVinculado.spendable_points} pts
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <span className="text-[10px] font-black uppercase text-amber-400 block">
                      🔥 Qualificação CRM (Lead)
                    </span>
                    <div>
                      <strong>Objetivo:</strong> {conversaDetalhe.objetivoTreino || 'Em identificação'}
                    </div>
                    <div>
                      <strong>Modalidade:</strong> {conversaDetalhe.modalidadeInteresse || 'Muay Thai'}
                    </div>
                    <div>
                      <strong>Experiência:</strong> {conversaDetalhe.experienciaPrevia || 'Não informada'}
                    </div>
                  </div>
                )}

                {/* Logs de Tools Executadas pela IA nesta conversa */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    🛠️ Operações Executadas pela IA ({conversaDetalhe.operacoes?.length || 0})
                  </span>
                  {(conversaDetalhe.operacoes || []).length === 0 ? (
                    <p className="text-[11px] text-zinc-500">Nenhuma tool acionada ainda.</p>
                  ) : (
                    (conversaDetalhe.operacoes || []).map((op: any) => (
                      <div
                        key={op.id}
                        className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-400">{op.toolName}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              op.sucesso
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {op.sucesso ? 'OK' : 'ERRO'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {new Date(op.criadoEm).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 2: SIMULADOR SANDBOX DE WHATSAPP (FASE 6 — HOMOLOGAÇÃO REAL)
      ==================================================================== */}
      {subTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Fase 6 — Homologação Segura antes da Produção
              </span>
              <h3 className="text-xl font-black text-white uppercase mt-1">
                🧪 Simulador de Atendimento WhatsApp BORÜ IA
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Dispare cenários reais com 1 clique para ver a IA consultando o banco de dados, agendando aulas experimentais, validando mensalidades ou transferindo para atendente humano.
              </p>
            </div>

            {/* Cenários Rápidos de 1 Clique */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-zinc-300 block">
                Cenários de Teste Rápido (1 Clique):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1001',
                      nomeContato: 'Rafael Oliveira',
                      conteudo: 'Opa, boa tarde! Quanto custa a mensalidade do Muay Thai e vcs aceitam Wellhub?'
                    })
                  }
                  disabled={simLoading}
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-amber-400">1. Lead Comercial (Planos & Wellhub)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Testa `consultar_plano` e `atualizar_crm`
                  </div>
                </button>

                <button
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1002',
                      nomeContato: 'Camila Rocha',
                      conteudo: 'Meu nome é Camila Rocha, nunca treinei antes e quero agendar uma aula experimental gratuita hoje às 19:00!'
                    })
                  }
                  disabled={simLoading}
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-emerald-400">
                    2. Agendar Aula Experimental (Hoje 19h)
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Testa `consultar_disponibilidade` e `agendar_aula_experimental`
                  </div>
                </button>

                <button
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99238-4491',
                      nomeContato: 'Aluno BORÜ',
                      conteudo: 'Fala mestre! Como está minha mensalidade e qual a chave PIX oficial para pagamento?'
                    })
                  }
                  disabled={simLoading}
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-400">
                    3. Consulta Financeira & Chave PIX
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Testa `consultar_financeiro` e `enviar_cobranca_autorizada`
                  </div>
                </button>

                <button
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1004',
                      nomeContato: 'Marcos Vinicius',
                      conteudo: 'Quero cancelar minha matrícula no plano e falar com uma pessoa da recepção.'
                    })
                  }
                  disabled={simLoading}
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-rose-400">
                    4. Cancelamento / Handoff Humano
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Testa `registrar_solicitacao` e `transferir_atendimento_humano`
                  </div>
                </button>
              </div>
            </div>

            {/* Simulador Personalizado */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <span className="text-xs font-bold uppercase text-zinc-300 block">
                Ou Envie uma Mensagem Personalizada de Teste:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Telefone Simulado</label>
                  <input
                    type="text"
                    value={simTelefone}
                    onChange={e => setSimTelefone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    value={simNome}
                    onChange={e => setSimNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Tipo de Mídia</label>
                  <select
                    value={simTipoMidia}
                    onChange={e => setSimTipoMidia(e.target.value as 'TEXT' | 'AUDIO')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="TEXT">💬 Texto WhatsApp</option>
                    <option value="AUDIO">🎧 Áudio Transcrito</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Digite como se fosse um cliente ou aluno no WhatsApp..."
                value={simConteudo}
                onChange={e => setSimConteudo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-500 outline-none"
              />

              <button
                onClick={() => dispararSimulacao()}
                disabled={simLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                {simLoading ? 'Processando no Cérebro da BORÜ IA...' : '🚀 Disparar Mensagem no Simulador'}
              </button>
            </div>
          </div>

          {/* Resultado da Última Simulação */}
          <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-black uppercase text-white border-b border-zinc-800 pb-2">
              ⚡ Resultado do Processamento em Tempo Real
            </h4>

            {!simUltimoResultado ? (
              <p className="text-xs text-zinc-500">
                Clique em qualquer cenário ao lado para inspecionar o raciocínio da IA, as ferramentas acionadas e a resposta gerada.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Processado pela IA:</span>
                  <span
                    className={`font-black uppercase ${
                      simUltimoResultado.processedByAi ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {simUltimoResultado.processedByAi
                      ? `SIM (${simUltimoResultado.modoOperacao})`
                      : `BLOQUEADO (${simUltimoResultado.motivoBloqueio})`}
                  </span>
                </div>

                {simUltimoResultado.brainResult && (
                  <>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-400 block">
                        Intenção & Ferramentas Acionadas
                      </span>
                      <div>
                        <strong>Intenção:</strong> {simUltimoResultado.brainResult.intencaoDetectada}
                      </div>
                      <div>
                        <strong>Tools:</strong>{' '}
                        {(simUltimoResultado.brainResult.toolsExecutadas || []).join(', ') || 'Nenhuma'}
                      </div>
                      <div>
                        <strong>Tempo de Resposta:</strong> {simUltimoResultado.brainResult.tempoRespostaMs} ms
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-emerald-300 block">
                        🤖 Resposta da BORÜ IA no WhatsApp:
                      </span>
                      <p className="whitespace-pre-wrap text-zinc-100 leading-relaxed">
                        {simUltimoResultado.brainResult.respostaTexto}
                      </p>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setSubTab('inbox')}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer"
                >
                  💬 Abrir esta conversa na Central Ao Vivo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: MOTOR DE FOLLOW-UP INTELIGENTE & SOLICITAÇÕES (TICKETS)
      ==================================================================== */}
      {subTab === 'followups' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fila de Follow-ups */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  🔁 Fila de Follow-up Inteligente
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Acompanhamento automático de leads, experimentais, alunos ausentes e vencimentos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const res = await adminApi.scanFollowUps();
                    alert(res.data.mensagem);
                    await carregarDadosGerais();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
                >
                  🔍 Varrer Sistema
                </button>
                <button
                  onClick={async () => {
                    const res = await adminApi.processFollowUps(true);
                    alert(res.data.mensagem);
                    await carregarDadosGerais();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                >
                  ⚡ Disparar Pendentes
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {followUpsRecentes.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">
                  Nenhuma tarefa de follow-up na fila. Clique em &quot;Varrer Sistema&quot; para identificar oportunidades.
                </p>
              ) : (
                followUpsRecentes.map((f: any) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">{f.tipoGatilho}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          f.status === 'ENVIADO'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : f.status === 'PENDENTE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-semibold">{f.descricaoMotivo}</p>
                    {f.mensagemSugerida && (
                      <p className="text-[11px] text-zinc-400 italic line-clamp-2">
                        &ldquo;{f.mensagemSugerida}&rdquo;
                      </p>
                    )}
                    {f.status === 'PENDENTE' && (
                      <button
                        onClick={async () => {
                          await adminApi.cancelFollowUp(f.id);
                          await carregarDadosGerais();
                        }}
                        className="text-[10px] text-red-400 hover:underline cursor-pointer"
                      >
                        Cancelar envio
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Protocolos Administrativos e Handoffs */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white">
                📋 Solicitações & Transferências Humanas ({ticketsRecentes.length})
              </h3>
              <p className="text-[11px] text-zinc-400">
                Pedidos de pausa, troca de plano, negociações e atendimentos transferidos pela IA.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {ticketsRecentes.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">
                  Nenhuma solicitação pendente no momento.
                </p>
              ) : (
                ticketsRecentes.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-red-400">
                        {t.protocolo} • {t.tipoSolicitacao}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          t.status === 'RESOLVIDO'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="font-bold text-white">
                      {t.nomeContato} ({t.telefone})
                    </div>
                    <p className="text-zinc-300">{t.descricao}</p>
                    {t.proximaProvidencia && (
                      <p className="text-[11px] text-amber-300">
                        <strong>Providência recomendada:</strong> {t.proximaProvidencia}
                      </p>
                    )}
                    {t.status !== 'RESOLVIDO' && (
                      <button
                        onClick={async () => {
                          await adminApi.updateAiTicket(t.id, {
                            status: 'RESOLVIDO',
                            resolvidoPor: operadorNome
                          });
                          await carregarDadosGerais();
                        }}
                        className="mt-1 px-3 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold cursor-pointer"
                      >
                        ✅ Marcar como Resolvido
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 4: INTELIGÊNCIA DE GESTÃO, RELATÓRIOS EXPORTÁVEIS E AUDITORIA
      ==================================================================== */}
      {subTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-zinc-400">Período de Análise:</span>
              {['hoje', '7d', '30d', '90d', 'all'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                    periodo === p
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {p === 'all' ? 'Todo o Histórico' : p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={adminApi.exportAiReportUrl('csv')}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                📥 Exportar Relatório CSV
              </a>
              <a
                href={adminApi.exportAiReportUrl('json')}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
              >
                📄 Exportar JSON
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Principais Intenções e Dúvidas */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-black uppercase text-white">
                📊 Principais Intenções & Dúvidas Identificadas
              </h4>
              <div className="space-y-2">
                {(inteligenciaGestao?.principaisDuvidas || []).length === 0 ? (
                  <p className="text-xs text-zinc-500">Sem registros suficientes no período.</p>
                ) : (
                  (inteligenciaGestao?.principaisDuvidas || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                    >
                      <span className="font-mono text-zinc-200">{item.intencao}</span>
                      <span className="font-black text-amber-400">{item.total} ocorrências</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ferramentas Mais Executadas pela IA */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-black uppercase text-white">
                🛠️ Operações Realizadas pela IA (Function Calling)
              </h4>
              <div className="space-y-2">
                {(inteligenciaGestao?.operacoesPorFerramenta || []).length === 0 ? (
                  <p className="text-xs text-zinc-500">Nenhuma ferramenta executada no período.</p>
                ) : (
                  (inteligenciaGestao?.operacoesPorFerramenta || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs"
                    >
                      <span className="font-mono text-emerald-400">{item.ferramenta}</span>
                      <span className="font-black text-white">{item.execucoes}x</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Log Imutável de Auditoria */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-black uppercase text-white">
              🛡️ Registro de Auditoria de Operações da IA (`AiOperationAuditLog`)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2 pr-3">Data/Hora</th>
                    <th className="py-2 pr-3">Ferramenta / Ação</th>
                    <th className="py-2 pr-3">Categoria</th>
                    <th className="py-2 pr-3">Executado Por</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {ultimasOperacoes.map((op: any) => (
                    <tr key={op.id}>
                      <td className="py-2 pr-3 text-zinc-400 whitespace-nowrap">
                        {new Date(op.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 pr-3 font-mono font-bold text-amber-400">{op.toolName}</td>
                      <td className="py-2 pr-3 text-zinc-300">{op.categoria}</td>
                      <td className="py-2 pr-3 text-zinc-300">{op.executadoPor}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            op.sucesso
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {op.sucesso ? 'SUCESSO' : 'FALHA / BLOQUEADO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 5: CONFIGURAÇÃO OFICIAL WHATSAPP CLOUD API & REGRAS DE NEGÓCIO
      ==================================================================== */}
      {subTab === 'config' && (
        <form
          onSubmit={handleSalvarConfig}
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-black uppercase text-white">
              ⚙️ Configuração WhatsApp Business Cloud API & Regras Financeiras/Follow-up
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Endpoint Oficial de Webhook para colar no painel Meta for Developers:{' '}
              <code className="text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                https://boru-api-fhdn.onrender.com/api/whatsapp/webhook
              </code>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                WhatsApp Comercial Exibido
              </label>
              <input
                type="text"
                value={configForm.whatsappPhoneNumber}
                onChange={e => setConfigForm({ ...configForm, whatsappPhoneNumber: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Phone Number ID (Meta Cloud API)
              </label>
              <input
                type="text"
                placeholder="Ex: 109283746512345"
                value={configForm.whatsappPhoneNumberId}
                onChange={e => setConfigForm({ ...configForm, whatsappPhoneNumberId: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Verify Token do Webhook
              </label>
              <input
                type="text"
                value={configForm.whatsappVerifyToken}
                onChange={e => setConfigForm({ ...configForm, whatsappVerifyToken: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Chave PIX Oficial Autorizada
              </label>
              <input
                type="text"
                value={configForm.pixChaveOficial}
                onChange={e => setConfigForm({ ...configForm, pixChaveOficial: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Nome do Favorecido PIX
              </label>
              <input
                type="text"
                value={configForm.pixFavorecido}
                onChange={e => setConfigForm({ ...configForm, pixFavorecido: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Link Oficial do Portal / Pagamento
              </label>
              <input
                type="text"
                value={configForm.linkPagamentoOficial}
                onChange={e => setConfigForm({ ...configForm, linkPagamentoOficial: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Horário Inicial de Follow-up (h)
              </label>
              <input
                type="number"
                min={6}
                max={22}
                value={configForm.followUpStartHour}
                onChange={e => setConfigForm({ ...configForm, followUpStartHour: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Horário Limite de Follow-up (h)
              </label>
              <input
                type="number"
                min={8}
                max={23}
                value={configForm.followUpEndHour}
                onChange={e => setConfigForm({ ...configForm, followUpEndHour: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Máximo de Follow-ups por Contato
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={configForm.maxFollowUpsPerContact}
                onChange={e =>
                  setConfigForm({ ...configForm, maxFollowUpsPerContact: Number(e.target.value) })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={salvandoConfig}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            {salvandoConfig ? 'Salvando...' : '💾 Salvar Configurações da BORÜ IA'}
          </button>
        </form>
      )}
    </div>
  );
};

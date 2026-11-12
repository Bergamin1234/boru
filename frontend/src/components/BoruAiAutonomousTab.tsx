import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

interface BoruAiAutonomousTabProps {
  usuarioLogado?: any;
}

const DEFAULT_CUSTOM_SETTINGS = {
  nomeAssistente: 'BORÜ IA Autônoma',
  saudacaoPadrao: 'Sawadee Krap!',
  delayRespostaSegundos: 2,
  instrucoesGeraisPrompt:
    'Você é o atendente digital oficial do BORÜ Centro de Combate em Porto Velho - RO. Converse com naturalidade, empatia e objetividade, sem menus robóticos. Consulte sempre os dados reais antes de informar preços, horários, vagas ou financeiro.',
  mensagensAtendimento: {
    boasVindasLead:
      'Sawadee Krap! Seja muito bem-vindo(a) ao **BORÜ Centro de Combate** em Porto Velho! 🥊🐺\n\nSou o atendimento inteligente do CT BORÜ. Para eu te atender da melhor forma:\n• Se você **quer começar a treinar ou agendar sua Aula Experimental Gratuita**, me conta o seu **nome** e qual o seu principal objetivo (condicionamento, perder peso, aprender Muay Thai do zero ou turma Kids)!\n• Se você **já é nosso aluno**, pode me pedir informações de horários, check-in, mensalidades ou enviar seu CPF para eu puxar sua ficha completa!',
    boasVindasAluno:
      'Sawadee Krap, **{nome}**! 🥊🐺 Que bom falar com você aqui no atendimento inteligente do **BORÜ Centro de Combate**!\n\nJá identifiquei sua matrícula ativa no plano **{plano}** ({graduacao}).\n\nComo posso te ajudar hoje? Posso consultar seus horários de treino de hoje, sua frequência e XP na Trilha do Nak Muay, situação de mensalidade ou registrar alguma solicitação para a coordenação!',
    apresentacaoPlanos:
      'Olá{nome_virgula}! Aqui estão as informações oficiais dos **Planos do BORÜ Centro de Combate** (Porto Velho - RO):\n\n{lista_planos}\n\n✅ **Convênios Aceitos:** {convenios}\n🥊 **Estrutura:** Tatame olímpico de 180m² 100% climatizado, octógono oficial e acompanhamento direto do Mestre Felipe Borü.\n\nQual é o seu principal objetivo com o treino? Se quiser conhecer na prática, posso agendar uma **Aula Experimental 100% Gratuita** para você! Qual turno prefere (Tarde ou Noite)?',
    confirmacaoExperimental:
      'Tudo pronto, **{nome}**! 🥊🐺 Sua **Aula Experimental Gratuita** no **BORÜ Centro de Combate** está oficialmente agendada!\n\n📅 **Data:** {data}\n⏰ **Horário:** {horario}\n🥋 **Modalidade:** {modalidade}\n📍 **Local:** Porto Velho - RO (180m² 100% climatizado)\n\n💡 **O que levar:** Apenas roupa esportiva confortável e garrafinha de água. Nós emprestamos luvas higienizadas na recepção!\n\nEstamos te esperando no tatame!',
    cobrancaPixPadrao:
      'Aqui estão os dados oficiais autorizados para pagamento da sua mensalidade no **BORÜ Centro de Combate**:\n\n💰 **Valor de referência:** {valor}\n📅 **Vencimento:** {vencimento}\n🔑 **Chave PIX Oficial:** `{chave_pix}`\n🏢 **Favorecido:** {favorecido}\n🌐 **Portal do Aluno:** {link_portal}\n\nAssim que realizar o pagamento, o status é atualizado na nossa secretaria!',
    transferenciaHumana:
      'Entendi perfeitamente{nome_virgula}. Já registrei sua solicitação sob o protocolo *{protocolo}* e passei todo o histórico da nossa conversa para a administração do BORÜ.\n\nVocê não precisará repetir nada — um responsável da nossa equipe já vai te responder por aqui em instantes! 🤝🐺'
  },
  regrasFollowUp: {
    LEAD_PRECO_SUMIU: {
      ativo: true,
      titulo: 'Lead Comercial (Perguntou Preço e Sumiu)',
      descricao: 'Disparado quando um interessado consulta planos/preços mas não agenda aula experimental.',
      prazoValor: 24,
      prazoUnidade: 'HORAS',
      mensagemTemplate:
        'Olá, {nome}! Passando para saber se ficou alguma dúvida sobre os planos do BORÜ Centro de Combate. Que tal agendarmos sua Aula Experimental 100% Gratuita essa semana para você conhecer nosso tatame climatizado e treinar com o Mestre Felipe Borü? 🥊🐺'
    },
    INTERESSE_EXPERIMENTAL: {
      ativo: true,
      titulo: 'Agendamento Experimental Incompleto',
      descricao: 'Disparado quando o lead pede aula experimental mas para de responder antes de escolher o horário.',
      prazoValor: 18,
      prazoUnidade: 'HORAS',
      mensagemTemplate:
        'Fala, {nome}! Ainda temos vagas nas turmas das 16h, 19h e 20h para a sua Aula Experimental Gratuita aqui no BORÜ. Qual dia fica melhor para eu reservar sua vaga e deixarmos um par de luvas separado pra você? 🥊'
    },
    POS_EXPERIMENTAL_NAO_MATRICULOU: {
      ativo: true,
      titulo: 'Pós-Aula Experimental (Conversão em Matrícula)',
      descricao: 'Disparado após o visitante realizar a aula experimental e ainda não ter fechado matrícula.',
      prazoValor: 12,
      prazoUnidade: 'HORAS',
      mensagemTemplate:
        'Fala, {nome}! Tudo bem? 🥊 Aqui é do BORÜ Centro de Combate! O Mestre Felipe Borü comentou da sua aula experimental. O que você achou do treino e da nossa estrutura? Se quiser garantir sua vaga oficial no tatame, nossos planos começam a partir de R$ 140/mês (2x) e R$ 160/mês (3x). Posso te ajudar a finalizar sua matrícula hoje? 🐺🔥'
    },
    FALTOU_EXPERIMENTAL: {
      ativo: true,
      titulo: 'Reagendamento de Falta na Experimental',
      descricao: 'Disparado quando a data da aula experimental passa e o lead não compareceu.',
      prazoValor: 6,
      prazoUnidade: 'HORAS',
      mensagemTemplate:
        'Olá, {nome}! Tudo bem? Sentimos sua falta na aula experimental no BORÜ Centro de Combate ({data} às {horario}). Imprevistos acontecem! Qual dia e horário desta semana fica melhor para reagendarmos seu treino gratuito? 🥊🐺'
    },
    MENSALIDADE_PROXIMA_VENCIMENTO: {
      ativo: true,
      titulo: 'Aviso Preventivo Antes do Vencimento',
      descricao: 'Disparado X dias antes da mensalidade do aluno vencer.',
      prazoValor: 3,
      prazoUnidade: 'DIAS',
      mensagemTemplate:
        'Fala, {nome}! Bons treinos! 🥊 Passando para lembrar que a mensalidade do seu plano no BORÜ Centro de Combate ({valor}) vence no dia {vencimento}. Para sua comodidade, nossa Chave PIX oficial é {chave_pix} ou acesse {link_portal}. Oss! 🐺'
    },
    MENSALIDADE_PENDENTE: {
      ativo: true,
      titulo: 'Cobrança Amigável de Mensalidade em Atraso',
      descricao: 'Disparado quando a mensalidade ultrapassa a data de vencimento pelo prazo definido.',
      prazoValor: 1,
      prazoUnidade: 'DIAS',
      mensagemTemplate:
        'Olá, {nome}! Tudo bem? 🥊 Passando pelo atendimento do BORÜ Centro de Combate para lembrar que consta em aberto a sua mensalidade com vencimento em {vencimento} ({valor}). Você pode regularizar via Chave PIX oficial ({chave_pix}) ou pelo Portal do Aluno: {link_portal}. Caso já tenha efetuado o pagamento, basta nos enviar o comprovante por aqui! 🤝🐺'
    },
    ALUNO_SUMIDO_TREINO: {
      ativo: true,
      titulo: 'Reativação de Aluno Ausente (Retenção)',
      descricao: 'Disparado quando o aluno fica X dias sem registrar presença no tatame.',
      prazoValor: 10,
      prazoUnidade: 'DIAS',
      mensagemTemplate:
        'Fala, {nome}! Tudo certo com você? 🥊 Sentimos sua falta nos últimos treinos aqui no tatame do BORÜ! Lembre-se que a constância é o segredo da evolução na Trilha do Nak Muay. Estamos te esperando essa semana para treinar com a família BORÜ! Bora voltar? 🐺🔥'
    }
  } as Record<string, any>
};

export const BoruAiAutonomousTab: React.FC<BoruAiAutonomousTabProps> = ({ usuarioLogado }) => {
  const [subTab, setSubTab] = useState<'inbox' | 'simulador' | 'editor' | 'followups' | 'relatorios' | 'config'>('inbox');
  const [periodo, setPeriodo] = useState<string>('30d');
  const [, setLoading] = useState<boolean>(true);
  const [togglingMaster, setTogglingMaster] = useState<boolean>(false);

  // Dados do Dashboard e Configuração Central
  const [config, setConfig] = useState<any>(null);
  const [customSettings, setCustomSettings] = useState<any>(DEFAULT_CUSTOM_SETTINGS);
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

  // Modo Simulação Interativo
  const [simTelefone, setSimTelefone] = useState<string>('(69) 99911-2233');
  const [simNome, setSimNome] = useState<string>('Lucas Martins (Simulação)');
  const [simConteudo, setSimConteudo] = useState<string>('');
  const [simTipoMidia, setSimTipoMidia] = useState<'TEXT' | 'AUDIO'>('TEXT');
  const [simForcarAtiva, setSimForcarAtiva] = useState<boolean>(true);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simUltimoResultado, setSimUltimoResultado] = useState<any>(null);

  // Edição Individual de Follow-up e Criação de Mensagem Programada
  const [editandoFollowUpId, setEditandoFollowUpId] = useState<string | null>(null);
  const [editFollowUpTexto, setEditFollowUpTexto] = useState<string>('');
  const [editFollowUpPrazo, setEditFollowUpPrazo] = useState<string>('');
  const [novoFollowUpModal, setNovoFollowUpModal] = useState<boolean>(false);
  const [novoFollowUpForm, setNovoFollowUpForm] = useState({
    telefone: '',
    nomeContato: '',
    descricaoMotivo: 'Acompanhamento Personalizado',
    prazoHoras: 24,
    agendadoPara: '',
    mensagemSugerida: ''
  });

  // Formulário de Configurações Técnicas e Operacionais
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

  const operadorNome = usuarioLogado?.nome || 'Administração BORÜ';

  const carregarDadosGerais = useCallback(async (silencioso = false) => {
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

      if (!silencioso && d.customSettings) {
        setCustomSettings({
          ...DEFAULT_CUSTOM_SETTINGS,
          ...d.customSettings,
          mensagensAtendimento: {
            ...DEFAULT_CUSTOM_SETTINGS.mensagensAtendimento,
            ...(d.customSettings.mensagensAtendimento || {})
          },
          regrasFollowUp: {
            ...DEFAULT_CUSTOM_SETTINGS.regrasFollowUp,
            ...(d.customSettings.regrasFollowUp || {})
          }
        });
      }

      if (!silencioso && d.config) {
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
      console.error('Erro ao carregar painel WhatsApp & IA:', err);
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
    carregarDadosGerais(false);
    const timer = setInterval(() => carregarDadosGerais(true), 12000);
    return () => clearInterval(timer);
  }, [carregarDadosGerais]);

  useEffect(() => {
    if (conversaSelecionadaId) {
      carregarDetalheConversa(conversaSelecionadaId);
    }
  }, [conversaSelecionadaId, carregarDetalheConversa]);

  // ==========================================================================
  // AÇÕES DE CONTROLE DISCRETO (ATIVAR/DESATIVAR E MODOS)
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
      await carregarDadosGerais(true);
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
      await carregarDadosGerais(true);
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
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao assumir conversa.');
    }
  };

  const handleDevolverParaIa = async (id: string) => {
    try {
      await adminApi.returnConversationToAi(id, operadorNome);
      await carregarDetalheConversa(id);
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao devolver conversa para a IA.');
    }
  };

  const handleLimparConversa = async (id: string) => {
    if (!window.confirm('Deseja apagar/resetar o histórico desta conversa de teste?')) return;
    try {
      await adminApi.deleteAiConversation(id);
      if (conversaSelecionadaId === id) {
        setConversaSelecionadaId(null);
        setConversaDetalhe(null);
      }
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao remover conversa.');
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
      await carregarDadosGerais(true);
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
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao aprovar resposta.');
    }
  };

  const handleRejeitarMensagemAssistida = async (msgId: string) => {
    try {
      await adminApi.rejectAssistedMessage(msgId);
      if (conversaSelecionadaId) await carregarDetalheConversa(conversaSelecionadaId);
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao descartar sugestão.');
    }
  };

  // ==========================================================================
  // MODO SIMULAÇÃO INTERATIVO
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

    if (payloadCustom) {
      setSimTelefone(payloadCustom.telefone);
      setSimNome(payloadCustom.nomeContato);
    }

    setSimLoading(true);
    try {
      const res = await adminApi.simulateWhatsAppMessage({
        ...dados,
        forcarSimulacaoAtiva: simForcarAtiva
      });
      setSimUltimoResultado(res.data.resultado);
      setSimConteudo('');
      const convId = res.data.resultado?.conversationId;
      if (convId) {
        setConversaSelecionadaId(convId);
        await carregarDetalheConversa(convId);
      }
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao simular mensagem.');
    } finally {
      setSimLoading(false);
    }
  };

  // ==========================================================================
  // SALVAMENTO GERAL (CONFIGURAÇÕES, MENSAGENS EDITÁVEIS E PRAZOS)
  // ==========================================================================

  const handleSalvarTudo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvandoConfig(true);
    try {
      const res = await adminApi.updateAiConfig({
        ...configForm,
        customSettings,
        updatedBy: operadorNome
      });
      if (res.data.customSettings) {
        setCustomSettings(res.data.customSettings);
      }
      await carregarDadosGerais(true);
      alert('Configurações, mensagens da IA e prazos salvos com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao salvar configurações.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  const handleRestaurarPadroes = async () => {
    if (!window.confirm('Deseja restaurar todas as mensagens e prazos para o texto padrão original do BORÜ?')) return;
    setSalvandoConfig(true);
    try {
      const res = await adminApi.updateAiConfig({
        resetCustomSettings: true,
        updatedBy: operadorNome
      });
      if (res.data.customSettings) {
        setCustomSettings(res.data.customSettings);
      }
      await carregarDadosGerais(false);
      alert('Mensagens e prazos restaurados para o padrão original!');
    } catch (err: any) {
      alert('Erro ao restaurar padrões.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  const handleSalvarEdicaoFollowUpIndividual = async (id: string) => {
    try {
      await adminApi.updateFollowUp(id, {
        mensagemSugerida: editFollowUpTexto,
        agendadoPara: editFollowUpPrazo || undefined
      });
      setEditandoFollowUpId(null);
      await carregarDadosGerais(true);
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao atualizar follow-up.');
    }
  };

  const handleCriarFollowUpProgramado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createFollowUp(novoFollowUpForm);
      setNovoFollowUpModal(false);
      setNovoFollowUpForm({
        telefone: '',
        nomeContato: '',
        descricaoMotivo: 'Acompanhamento Personalizado',
        prazoHoras: 24,
        agendadoPara: '',
        mensagemSugerida: ''
      });
      await carregarDadosGerais(true);
      alert('Mensagem programada adicionada à fila com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.erro || 'Erro ao programar mensagem.');
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
    <div className="space-y-4 text-zinc-100">
      {/* ====================================================================
          BARRA ADMINISTRATIVA DISCRETA (CABEÇALHO + NAVEGAÇÃO DE SUB-ABAS)
      ==================================================================== */}
      <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>💬 Central de Conversas WhatsApp & Atendimento IA</span>
              </h2>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isIaAtiva
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isIaAtiva ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                {isIaAtiva ? `IA Ativa (${modoAtual.replace('_', ' ')})` : 'IA Desativada (Modo Manual)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acompanhe todas as conversas do WhatsApp ({config?.whatsappPhoneNumber || '(69) 99238-4491'}), teste no Modo Simulação e edite mensagens e prazos.
            </p>
          </div>

          {/* Controle Discreto Rápido + Atalho para Opções */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#1A1A1E] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-zinc-400 font-semibold">Auto-Atendimento:</span>
              <button
                type="button"
                disabled={togglingMaster}
                onClick={() => handleToggleMasterIa(!isIaAtiva)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer border ${
                  isIaAtiva
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-red-600/20 hover:text-red-300 hover:border-red-500/40'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500/40'
                }`}
              >
                {togglingMaster ? '...' : isIaAtiva ? 'Ativado (Desligar)' : 'Desativado (Ativar)'}
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Abas do Módulo WhatsApp & IA */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setSubTab('inbox')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'inbox'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-[#1A1A1E] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>💬</span>
            <span>Todas as Conversas ({conversas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('simulador')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'simulador'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-[#1A1A1E] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🧪</span>
            <span>Modo Simulação</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('editor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'editor'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-[#1A1A1E] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>✏️</span>
            <span>Editar Mensagens & Prazos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('followups')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'followups'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-[#1A1A1E] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🔁</span>
            <span>Fila de Envios ({indicadores?.followUpsPendentes ?? 0}) & Protocolos ({indicadores?.ticketsAbertos ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('relatorios')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'relatorios'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-[#1A1A1E] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>📊</span>
            <span>Métricas & Auditoria</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('config')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'config'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-[#1A1A1E] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>⚙️</span>
            <span>Opções Administrativas & Ativação</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          ABA 1: TODAS AS CONVERSAS DO WHATSAPP (MONITORAMENTO COMPLETO)
      ==================================================================== */}
      {subTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Coluna Esquerda: Lista de Todas as Conversas */}
          <div className="lg:col-span-4 bg-[#141416] border border-zinc-800 rounded-xl p-4 flex flex-col h-[650px]">
            <div className="space-y-2.5 pb-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Histórico de Conversas ({conversas.length})
                </h3>
                <button
                  onClick={() => setSubTab('simulador')}
                  className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  + Testar no Simulador
                </button>
              </div>

              <input
                type="text"
                placeholder="🔍 Buscar por nome, telefone ou mensagem..."
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
                  <option value="IA_ATIVA">🤖 Atendidas pela IA</option>
                  <option value="AGUARDANDO_APROVACAO">🟡 Aguardando Aprovação</option>
                  <option value="TRANSFERIDA_HUMANO">🚨 Aguardando Humano</option>
                  <option value="PAUSADA_HUMANO">🖐️ Assumidas Manualmente</option>
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
                    Nenhuma conversa encontrada com este filtro.
                  </p>
                  <button
                    onClick={() => setSubTab('simulador')}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                  >
                    🧪 Ir para o Modo Simulação
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
                          ? 'bg-red-950/40 border border-red-500/60'
                          : 'hover:bg-zinc-800/40 border border-transparent'
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
                            ? '🚨 Pede Humano'
                            : c.statusAtendimento === 'AGUARDANDO_APROVACAO'
                            ? '🟡 Aprovar'
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

          {/* Coluna Central: Chat Completo do WhatsApp */}
          <div className="lg:col-span-5 bg-[#141416] border border-zinc-800 rounded-xl flex flex-col h-[650px] overflow-hidden">
            {!conversaDetalhe ? (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 p-6 text-center">
                {loadingDetalhe
                  ? 'Carregando mensagens da conversa...'
                  : 'Selecione uma conversa à esquerda para visualizar todas as mensagens trocadas.'}
              </div>
            ) : (
              <>
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

                  <div className="flex items-center gap-1.5">
                    {!conversaDetalhe.iaPausadaIndividual &&
                    conversaDetalhe.statusAtendimento !== 'TRANSFERIDA_HUMANO' ? (
                      <button
                        onClick={() => handleAssumirConversa(conversaDetalhe.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        🖐️ Pausar IA e Assumir
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDevolverParaIa(conversaDetalhe.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        🤖 Devolver p/ IA
                      </button>
                    )}

                    <button
                      onClick={() => handleLimparConversa(conversaDetalhe.id)}
                      title="Apagar/Resetar conversa"
                      className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 text-zinc-400 hover:text-red-300 text-[11px] transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Balões de Mensagem */}
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
                                : `🤖 ${msg.remetenteNome || customSettings.nomeAssistente}`}
                            </span>
                            <span>
                              {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="whitespace-pre-wrap">{msg.conteudo}</div>

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

                          {isPendingApproval && (
                            <div className="mt-3 pt-2.5 border-t border-amber-500/40 space-y-2">
                              <span className="text-[10px] font-black uppercase text-amber-300 block">
                                🟡 Modo Assistido — Revise ou edite antes de enviar:
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

                {/* Envio de Mensagem Manual */}
                <form
                  onSubmit={handleEnviarMensagemManual}
                  className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Responder manualmente como humano (pausa a IA nesta conversa)..."
                    value={mensagemManual}
                    onChange={e => setMensagemManual(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-red-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={enviandoManual || !mensagemManual.trim()}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    {enviandoManual ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Coluna Direita: Ficha do Contato, Follow-ups Agendados e Ações */}
          <div className="lg:col-span-3 bg-[#141416] border border-zinc-800 rounded-xl p-4 h-[650px] overflow-y-auto space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              🔎 Contexto do Contato & Ações da IA
            </h3>

            {!conversaDetalhe ? (
              <p className="text-xs text-zinc-500">Nenhuma conversa selecionada.</p>
            ) : (
              <>
                {dossieTransferencia && (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-300">
                        🚨 Dossiê de Transferência
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
                      <strong>Recomendação:</strong> {dossieTransferencia.proximaProvidenciaRecomendada}
                    </p>
                  </div>
                )}

                {alunoVinculado ? (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block">
                      🥋 Aluno Matriculado Identificado
                    </span>
                    <div><strong>Nome:</strong> {alunoVinculado.nome}</div>
                    <div><strong>Plano:</strong> {alunoVinculado.plano} ({alunoVinculado.modalidade})</div>
                    <div><strong>Graduação:</strong> {alunoVinculado.prajied}</div>
                    <div><strong>XP / Pontos:</strong> {alunoVinculado.total_xp} XP • {alunoVinculado.spendable_points} pts</div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <span className="text-[10px] font-black uppercase text-amber-400 block">
                      🔥 Ficha Comercial (CRM)
                    </span>
                    <div><strong>Objetivo:</strong> {conversaDetalhe.objetivoTreino || 'Em identificação'}</div>
                    <div><strong>Modalidade:</strong> {conversaDetalhe.modalidadeInteresse || 'Muay Thai'}</div>
                    <div><strong>Experiência:</strong> {conversaDetalhe.experienciaPrevia || 'Não informada'}</div>
                  </div>
                )}

                {/* Atalho para programar uma mensagem para este contato */}
                <button
                  type="button"
                  onClick={() => {
                    setNovoFollowUpForm({
                      telefone: conversaDetalhe.telefoneExibicao || conversaDetalhe.telefone,
                      nomeContato: conversaDetalhe.nomeContato,
                      descricaoMotivo: 'Mensagem programada pela administração',
                      prazoHoras: 24,
                      agendadoPara: '',
                      mensagemSugerida: `Olá, ${conversaDetalhe.nomeContato.split(' ')[0]}! Passando para acompanhar seu atendimento no BORÜ Centro de Combate. Como podemos te ajudar hoje? 🥊`
                    });
                    setNovoFollowUpModal(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-amber-300 transition cursor-pointer"
                >
                  ⏰ Programar Mensagem / Prazo p/ este Contato
                </button>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    🛠️ Operações Executadas ({conversaDetalhe.operacoes?.length || 0})
                  </span>
                  {(conversaDetalhe.operacoes || []).length === 0 ? (
                    <p className="text-[11px] text-zinc-500">Nenhuma ferramenta acionada ainda.</p>
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
                              op.sucesso ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
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
          ABA 2: MODO SIMULAÇÃO INTERATIVO (CHAT AO VIVO + TESTE DE CENÁRIOS)
      ==================================================================== */}
      {subTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Painel Esquerdo: Controles de Simulação & Cenários Prontos */}
          <div className="lg:col-span-5 bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Ambiente de Homologação Interativo
                </span>
                <h3 className="text-base font-black text-white uppercase mt-0.5">
                  🧪 Modo Simulação da IA
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Converse como se fosse um cliente ou aluno no WhatsApp e veja como a IA responde em tempo real com as mensagens e prazos configurados.
                </p>
              </div>
            </div>

            {/* Opção para testar a IA mesmo enquanto o botão de produção está desligado */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={simForcarAtiva}
                onChange={e => setSimForcarAtiva(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Simular IA ligada mesmo com WhatsApp real desativado
                </span>
                <span className="text-[11px] text-zinc-400">
                  Permite testar todas as respostas da IA sem precisar ativá-la para clientes reais ainda.
                </span>
              </div>
            </label>

            {/* Cenários Rápidos de 1 Clique */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-zinc-300 block">
                Disparar Cenário de Teste (1 Clique):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1001',
                      nomeContato: 'Rafael Oliveira (Lead)',
                      conteudo: 'Olá! Gostaria de começar a treinar Muay Thai para perder peso, nunca lutei antes.'
                    })
                  }
                  disabled={simLoading}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-amber-400">1. Novo Interessado (Iniciante)</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Recepção consultiva + Cadastro CRM</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1001',
                      nomeContato: 'Rafael Oliveira (Lead)',
                      conteudo: 'Quanto custa a mensalidade do Muay Thai e vocês aceitam Wellhub?'
                    })
                  }
                  disabled={simLoading}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-emerald-400">2. Dúvida de Preços & Wellhub</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Consulta planos + Agenda follow-up</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1002',
                      nomeContato: 'Camila Rocha (Experimental)',
                      conteudo: 'Meu nome é Camila Rocha e quero agendar uma aula experimental gratuita hoje às 19:00!'
                    })
                  }
                  disabled={simLoading}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-cyan-400">3. Agendar Experimental (19h)</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Checa vagas reais e grava no banco</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99238-4491',
                      nomeContato: 'Aluno BORÜ',
                      conteudo: 'Fala mestre! Como está minha mensalidade e qual a chave PIX oficial?'
                    })
                  }
                  disabled={simLoading}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-blue-400">4. Aluno: Mensalidade & PIX</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Consulta financeiro + Envia PIX</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1003',
                      nomeContato: 'Juliana Mendes (Mãe)',
                      conteudo: 'Vocês têm turma infantil de Muay Thai Kids para meu filho de 8 anos? Quais os horários?'
                    })
                  }
                  disabled={simLoading}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-purple-400">5. Turma Kids & Grade Horária</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Consulta horários Seg/Qua/Sex 18h</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    dispararSimulacao({
                      telefone: '(69) 99911-1004',
                      nomeContato: 'Marcos Vinicius',
                      conteudo: 'Quero cancelar minha matrícula e falar com um atendente humano da recepção.'
                    })
                  }
                  disabled={simLoading}
                  className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-rose-400">6. Cancelamento / Handoff</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Gera protocolo e transfere p/ humano</div>
                </button>
              </div>
            </div>

            {/* Perfil Simulado */}
            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <span className="text-xs font-bold uppercase text-zinc-300 block">
                Identidade do Contato Simulado:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Telefone</label>
                  <input
                    type="text"
                    value={simTelefone}
                    onChange={e => setSimTelefone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    value={simNome}
                    onChange={e => setSimNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Mídia</label>
                  <select
                    value={simTipoMidia}
                    onChange={e => setSimTipoMidia(e.target.value as 'TEXT' | 'AUDIO')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="TEXT">💬 Texto</option>
                    <option value="AUDIO">🎧 Áudio</option>
                  </select>
                </div>
              </div>

              {simUltimoResultado?.brainResult && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-400">
                      Diagnóstico da Última Resposta
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {simUltimoResultado.brainResult.tempoRespostaMs}ms
                    </span>
                  </div>
                  <div>
                    <strong>Intenção:</strong> {simUltimoResultado.brainResult.intencaoDetectada}
                  </div>
                  <div>
                    <strong>Tools Executadas:</strong>{' '}
                    {(simUltimoResultado.brainResult.toolsExecutadas || []).join(', ') || 'Nenhuma'}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSubTab('editor')}
                className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-amber-300 transition cursor-pointer"
              >
                ✏️ Quer mudar como ela responde? Abrir Editor de Mensagens & Prazos
              </button>
            </div>
          </div>

          {/* Painel Direito: Tela de Chat WhatsApp ao Vivo da Simulação */}
          <div className="lg:col-span-7 bg-[#141416] border border-zinc-800 rounded-xl flex flex-col h-[640px] overflow-hidden">
            <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-sm">
                  🐺
                </div>
                <div>
                  <div className="text-xs font-black text-white">
                    Simulador WhatsApp — Conversando como: <span className="text-amber-400">{simNome}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Telefone: {simTelefone} • {conversaDetalhe ? `${conversaDetalhe.mensagens?.length || 0} mensagens na conversa` : 'Pronto para iniciar'}
                  </div>
                </div>
              </div>

              {conversaDetalhe && (
                <div className="flex items-center gap-1.5">
                  {conversaDetalhe.iaPausadaIndividual || conversaDetalhe.statusAtendimento === 'TRANSFERIDA_HUMANO' ? (
                    <button
                      type="button"
                      onClick={() => handleDevolverParaIa(conversaDetalhe.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer"
                    >
                      🤖 Reativar IA nesta conversa
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleLimparConversa(conversaDetalhe.id)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 text-zinc-400 hover:text-red-300 text-[10px] font-bold cursor-pointer"
                  >
                    🗑️ Limpar / Reiniciar Chat
                  </button>
                </div>
              )}
            </div>

            {/* Histórico de Mensagens da Simulação */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b0b0d]">
              {!conversaDetalhe || (conversaDetalhe.mensagens || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="text-3xl">💬</div>
                  <p className="text-xs font-bold text-zinc-300">
                    Envie uma mensagem abaixo ou clique em um dos 6 cenários ao lado
                  </p>
                  <p className="text-[11px] text-zinc-500 max-w-md">
                    Você verá exatamente a mensagem enviada pelo cliente, quais ferramentas a IA consultou no banco de dados e a resposta enviada pela IA.
                  </p>
                </div>
              ) : (
                (conversaDetalhe.mensagens || []).map((msg: any) => {
                  const isContato = msg.remetente === 'CONTATO';
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
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed border ${
                          isContato
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tl-none'
                            : 'bg-emerald-950/70 border-emerald-600/50 text-emerald-50 rounded-tr-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-bold">
                          <span>
                            {isContato
                              ? `👤 ${conversaDetalhe.nomeContato} (Cliente Simulado)`
                              : `🤖 ${msg.remetenteNome || customSettings.nomeAssistente}`}
                          </span>
                          <span>
                            {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.conteudo}</div>
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Caixa de Digitação do Cliente Simulado */}
            <form
              onSubmit={e => {
                e.preventDefault();
                dispararSimulacao();
              }}
              className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Digite aqui uma mensagem como ${simNome}...`}
                value={simConteudo}
                onChange={e => setSimConteudo(e.target.value)}
                disabled={simLoading}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-red-500 outline-none"
              />
              <button
                type="submit"
                disabled={simLoading || !simConteudo.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-black text-xs uppercase transition cursor-pointer shrink-0"
              >
                {simLoading ? 'Respondendo...' : 'Enviar no Simulador'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: EDITOR COMPLETO DE MENSAGENS, PRAZOS E COMPORTAMENTO DA IA
      ==================================================================== */}
      {subTab === 'editor' && (
        <form onSubmit={handleSalvarTudo} className="space-y-6">
          {/* Cabeçalho de Salvamento Rápido */}
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase text-white">
                ✏️ Editor Geral da IA — Mensagens, Prazos e Comportamento
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Edite exatamente quais mensagens a IA envia em cada situação, os prazos de cada acompanhamento (em horas ou dias) e as instruções gerais.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestaurarPadroes}
                disabled={salvandoConfig}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                ↺ Restaurar Padrão
              </button>
              <button
                type="submit"
                disabled={salvandoConfig}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/50 cursor-pointer"
              >
                {salvandoConfig ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </div>

          {/* BLOCO 1: REGRAS E PRAZOS DE ENVIO AUTOMÁTICO (FOLLOW-UPS, VENCIMENTOS E RETENÇÃO) */}
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-black uppercase text-amber-400">
                ⏰ 1. Prazos e Mensagens de Acompanhamento Automático (Follow-ups e Cobranças)
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defina se cada envio está ativo, o <strong>prazo exato</strong> (em horas ou dias) e o <strong>texto da mensagem</strong>. Variáveis disponíveis: <code>{'{nome}'}</code>, <code>{'{valor}'}</code>, <code>{'{vencimento}'}</code>, <code>{'{chave_pix}'}</code>, <code>{'{link_portal}'}</code>, <code>{'{data}'}</code>, <code>{'{horario}'}</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(customSettings.regrasFollowUp || {}).map(([key, regra]: [string, any]) => (
                <div
                  key={key}
                  className={`p-4 rounded-xl border space-y-3 transition ${
                    regra.ativo
                      ? 'bg-zinc-950/90 border-zinc-800'
                      : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-white block">{regra.titulo}</span>
                      <span className="text-[11px] text-zinc-400 block">{regra.descricao}</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(regra.ativo)}
                        onChange={e =>
                          setCustomSettings({
                            ...customSettings,
                            regrasFollowUp: {
                              ...customSettings.regrasFollowUp,
                              [key]: { ...regra, ativo: e.target.checked }
                            }
                          })
                        }
                        className="accent-red-600 w-4 h-4"
                      />
                      <span>{regra.ativo ? 'Ativo' : 'Pausado'}</span>
                    </label>
                  </div>

                  {/* Editor de Prazo */}
                  <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5">
                    <span className="text-xs font-bold text-amber-400">⏱️ Prazo de Disparo:</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={regra.prazoValor}
                      onChange={e =>
                        setCustomSettings({
                          ...customSettings,
                          regrasFollowUp: {
                            ...customSettings.regrasFollowUp,
                            [key]: { ...regra, prazoValor: Number(e.target.value) }
                          }
                        })
                      }
                      className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-xs font-bold text-white text-center"
                    />
                    <select
                      value={regra.prazoUnidade}
                      onChange={e =>
                        setCustomSettings({
                          ...customSettings,
                          regrasFollowUp: {
                            ...customSettings.regrasFollowUp,
                            [key]: { ...regra, prazoUnidade: e.target.value }
                          }
                        })
                      }
                      className="bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white font-semibold"
                    >
                      <option value="HORAS">Horas</option>
                      <option value="DIAS">Dias</option>
                    </select>
                  </div>

                  {/* Editor da Mensagem */}
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Mensagem que a IA vai enviar:
                    </label>
                    <textarea
                      rows={4}
                      value={regra.mensagemTemplate}
                      onChange={e =>
                        setCustomSettings({
                          ...customSettings,
                          regrasFollowUp: {
                            ...customSettings.regrasFollowUp,
                            [key]: { ...regra, mensagemTemplate: e.target.value }
                          }
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-red-500 outline-none leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCO 2: MENSAGENS PADRÃO DE ATENDIMENTO IMEDIATO */}
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-black uppercase text-emerald-400">
                💬 2. Mensagens de Recepção, Confirmação, PIX e Transferência Humana
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Personalize os textos que a IA utiliza durante o atendimento imediato no WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-200 block">
                  Boas-vindas para Novo Interessado (Lead Comercial)
                </label>
                <textarea
                  rows={5}
                  value={customSettings.mensagensAtendimento?.boasVindasLead || ''}
                  onChange={e =>
                    setCustomSettings({
                      ...customSettings,
                      mensagensAtendimento: {
                        ...customSettings.mensagensAtendimento,
                        boasVindasLead: e.target.value
                      }
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-200 block">
                  Boas-vindas para Aluno Já Matriculado (Variáveis: <code>{'{nome}'}</code>, <code>{'{plano}'}</code>, <code>{'{graduacao}'}</code>)
                </label>
                <textarea
                  rows={5}
                  value={customSettings.mensagensAtendimento?.boasVindasAluno || ''}
                  onChange={e =>
                    setCustomSettings({
                      ...customSettings,
                      mensagensAtendimento: {
                        ...customSettings.mensagensAtendimento,
                        boasVindasAluno: e.target.value
                      }
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-200 block">
                  Mensagem de Transferência para Atendente Humano (Variáveis: <code>{'{nome_virgula}'}</code>, <code>{'{protocolo}'}</code>)
                </label>
                <textarea
                  rows={4}
                  value={customSettings.mensagensAtendimento?.transferenciaHumana || ''}
                  onChange={e =>
                    setCustomSettings({
                      ...customSettings,
                      mensagensAtendimento: {
                        ...customSettings.mensagensAtendimento,
                        transferenciaHumana: e.target.value
                      }
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-200 block">
                  Instruções Gerais de Comportamento e Tom de Voz da IA (Prompt Mestre)
                </label>
                <textarea
                  rows={4}
                  value={customSettings.instrucoesGeraisPrompt || ''}
                  onChange={e =>
                    setCustomSettings({
                      ...customSettings,
                      instrucoesGeraisPrompt: e.target.value
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-800">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Nome Exibido pela IA nas Conversas
                </label>
                <input
                  type="text"
                  value={customSettings.nomeAssistente || ''}
                  onChange={e => setCustomSettings({ ...customSettings, nomeAssistente: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Tempo de Digitação / Resposta (Segundos)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={customSettings.delayRespostaSegundos ?? 2}
                  onChange={e =>
                    setCustomSettings({ ...customSettings, delayRespostaSegundos: Number(e.target.value) })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  {salvandoConfig ? 'Salvando...' : '💾 Salvar Todas as Mensagens e Prazos'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ====================================================================
          ABA 4: FILA DE ENVIOS PROGRAMADOS (COM EDIÇÃO DE TEXTO/PRAZO) & PROTOCOLOS
      ==================================================================== */}
      {subTab === 'followups' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Fila de Follow-ups com Edição Individual */}
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  🔁 Fila de Mensagens Programadas & Follow-ups
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Você pode editar a mensagem, mudar o prazo de qualquer item da fila ou programar um novo envio.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNovoFollowUpModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold cursor-pointer"
                >
                  + Programar Mensagem
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await adminApi.scanFollowUps();
                    alert(res.data.mensagem);
                    await carregarDadosGerais(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-white cursor-pointer"
                >
                  🔍 Varrer Sistema
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await adminApi.processFollowUps(true);
                    alert(res.data.mensagem);
                    await carregarDadosGerais(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white cursor-pointer"
                >
                  ⚡ Disparar Pendentes
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {followUpsRecentes.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">
                  Nenhuma mensagem programada na fila. Clique em &quot;Varrer Sistema&quot; ou &quot;+ Programar Mensagem&quot;.
                </p>
              ) : (
                followUpsRecentes.map((f: any) => {
                  const isEditing = editandoFollowUpId === f.id;
                  return (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-amber-400">{f.tipoGatilho}</span>
                          {f.conversation && (
                            <span className="text-zinc-300 font-bold ml-2">
                              • {f.conversation.nomeContato} ({f.conversation.telefoneExibicao || f.conversation.telefone})
                            </span>
                          )}
                        </div>
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

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{f.descricaoMotivo}</span>
                        <span>
                          ⏰ Prazo:{' '}
                          <strong className="text-zinc-200">
                            {new Date(f.agendadoPara).toLocaleString('pt-BR')}
                          </strong>
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                              Novo Prazo (Data e Hora do Envio):
                            </label>
                            <input
                              type="datetime-local"
                              value={editFollowUpPrazo}
                              onChange={e => setEditFollowUpPrazo(e.target.value)}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                              Editar Mensagem que será enviada:
                            </label>
                            <textarea
                              rows={3}
                              value={editFollowUpTexto}
                              onChange={e => setEditFollowUpTexto(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSalvarEdicaoFollowUpIndividual(f.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
                            >
                              💾 Salvar Mensagem e Prazo
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditandoFollowUpId(null)}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {f.mensagemSugerida && (
                            <p className="text-[11px] text-zinc-300 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/80 whitespace-pre-wrap">
                              {f.mensagemSugerida}
                            </p>
                          )}

                          {f.status === 'PENDENTE' && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditandoFollowUpId(f.id);
                                  setEditFollowUpTexto(f.mensagemSugerida || '');
                                  const dt = new Date(f.agendadoPara);
                                  const isoLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                                    .toISOString()
                                    .slice(0, 16);
                                  setEditFollowUpPrazo(isoLocal);
                                }}
                                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] font-bold cursor-pointer"
                              >
                                ✏️ Editar Mensagem / Prazo
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await adminApi.dispatchSingleFollowUp(f.id);
                                  await carregarDadosGerais(true);
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer"
                              >
                                ⚡ Enviar Agora
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await adminApi.cancelFollowUp(f.id);
                                  await carregarDadosGerais(true);
                                }}
                                className="px-2.5 py-1 rounded bg-red-600/15 text-red-400 text-[10px] font-bold cursor-pointer"
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Protocolos Administrativos e Handoffs */}
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white">
                📋 Solicitações & Transferências Humanas ({ticketsRecentes.length})
              </h3>
              <p className="text-[11px] text-zinc-400">
                Pedidos de pausa, troca de plano, negociações e atendimentos encaminhados pela IA.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
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
                        type="button"
                        onClick={async () => {
                          await adminApi.updateAiTicket(t.id, {
                            status: 'RESOLVIDO',
                            resolvidoPor: operadorNome
                          });
                          await carregarDadosGerais(true);
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
          ABA 5: MÉTRICAS, RELATÓRIOS EXPORTÁVEIS E AUDITORIA
      ==================================================================== */}
      {subTab === 'relatorios' && (
        <div className="space-y-5">
          {/* Resumo de Indicadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Conversas Atendidas</span>
              <div className="text-2xl font-black text-white mt-1">{indicadores?.conversasAtendidas ?? 0}</div>
              <span className="text-[11px] text-emerald-400">
                Tempo médio: {indicadores?.tempoMedioRespostaFormatado || '0.4s'}
              </span>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Recebidas / Respondidas</span>
              <div className="text-2xl font-black text-white mt-1">
                {indicadores?.mensagensRecebidas ?? 0} /{' '}
                <span className="text-emerald-400">{indicadores?.mensagensRespondidas ?? 0}</span>
              </div>
              <span className="text-[11px] text-amber-400">
                {indicadores?.mensagensAguardandoAprovacao ?? 0} aguardando aprovação
              </span>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Leads & Experimentais</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {indicadores?.interessadosCaptados ?? 0} leads •{' '}
                <span className="text-white">{indicadores?.aulasExperimentaisAgendadas ?? 0}</span> exp.
              </div>
              <span className="text-[11px] text-zinc-400">
                Comparecimento: {indicadores?.comparecimentoExperimentais ?? 0}
              </span>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Matrículas & Conversão</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {indicadores?.matriculasOriginadas ?? 0} ({indicadores?.taxaConversaoPercent ?? 0}%)
              </div>
              <span className="text-[11px] text-zinc-400">
                Inadimplência: {indicadores?.inadimplenciaIdentificada ?? 0}
              </span>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400 block">Handoffs Humanos</span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {indicadores?.solicitacoesEncaminhadasHumanos ?? 0}
              </div>
              <span className="text-[11px] text-zinc-400">
                Falhas: {indicadores?.falhasIntegracao ?? 0}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141416] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-zinc-400">Período:</span>
              {['hoje', '7d', '30d', '90d', 'all'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                    periodo === p ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {p === 'all' ? 'Tudo' : p}
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
                📥 Exportar CSV
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-black uppercase text-white">
                📊 Principais Assuntos & Intenções
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
                      <span className="font-black text-amber-400">{item.total}x</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-black uppercase text-white">
                🛠️ Ferramentas Internas Acionadas pela IA
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

          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-black uppercase text-white">
              🛡️ Log de Auditoria de Operações (`AiOperationAuditLog`)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2 pr-3">Data/Hora</th>
                    <th className="py-2 pr-3">Operação</th>
                    <th className="py-2 pr-3">Categoria</th>
                    <th className="py-2 pr-3">Responsável</th>
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
                            op.sucesso ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {op.sucesso ? 'SUCESSO' : 'BLOQUEADO'}
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
          ABA 6: OPÇÕES ADMINISTRATIVAS, ATIVAÇÃO DISCRETA E CONEXÃO WHATSAPP
      ==================================================================== */}
      {subTab === 'config' && (
        <div className="space-y-5">
          {/* Controle Administrativo Discreto de Ativação e Modo de Operação */}
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  ⚙️ Status do Auto-Atendimento no WhatsApp Oficial
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Controle administrativo centralizado no backend. Ao desativar, nenhuma mensagem automática é enviada e os atendentes humanos respondem normalmente.
                </p>
              </div>

              <button
                type="button"
                disabled={togglingMaster}
                onClick={() => handleToggleMasterIa(!isIaAtiva)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                  isIaAtiva
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                }`}
              >
                {togglingMaster
                  ? 'Atualizando...'
                  : isIaAtiva
                  ? 'Desativar Atendimento Automático'
                  : 'Ativar Atendimento Automático'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleChangeOperatingMode('IA_AUTONOMA')}
                disabled={togglingMaster}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  isIaAtiva && modoAtual === 'IA_AUTONOMA'
                    ? 'bg-zinc-900 border-emerald-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Modo Autônomo
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  A IA responde clientes, tira dúvidas e agenda aulas experimentais sozinha.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChangeOperatingMode('IA_ASSISTIDA')}
                disabled={togglingMaster}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  isIaAtiva && modoAtual === 'IA_ASSISTIDA'
                    ? 'bg-zinc-900 border-amber-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Modo Assistido (Co-Piloto)
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  A IA prepara a sugestão de resposta e aguarda aprovação humana antes de enviar.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChangeOperatingMode('MODO_MANUAL')}
                disabled={togglingMaster}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  !isIaAtiva || modoAtual === 'MODO_MANUAL'
                    ? 'bg-zinc-900 border-red-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Modo Manual (IA Desligada)
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Apenas registra o histórico das conversas para a recepção responder manualmente.
                </div>
              </button>
            </div>
          </div>

          {/* Parâmetros de Horário Comercial, PIX e Webhook */}
          <form
            onSubmit={handleSalvarTudo}
            className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-5"
          >
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                🔗 Credenciais WhatsApp Cloud API, Dados PIX & Horário de Envio
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Webhook Oficial para Meta for Developers:{' '}
                <code className="text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  https://boru-api-fhdn.onrender.com/api/whatsapp/webhook
                </code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  WhatsApp Comercial Oficial
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
                  Favorecido PIX
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
                  Link Oficial do Portal do Aluno
                </label>
                <input
                  type="text"
                  value={configForm.linkPagamentoOficial}
                  onChange={e => setConfigForm({ ...configForm, linkPagamentoOficial: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Início da Janela de Envio (h)
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
                  Fim da Janela de Envio (h)
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
                  Máx. Follow-ups por Contato
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={configForm.maxFollowUpsPerContact}
                  onChange={e => setConfigForm({ ...configForm, maxFollowUpsPerContact: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Intervalo Mínimo entre Envios (h)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={configForm.minHoursBetweenFollowUps}
                  onChange={e => setConfigForm({ ...configForm, minHoursBetweenFollowUps: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={salvandoConfig}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              {salvandoConfig ? 'Salvando...' : '💾 Salvar Opções Administrativas'}
            </button>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL PARA PROGRAMAR NOVA MENSAGEM / PRAZO PERSONALIZADO
      ==================================================================== */}
      {novoFollowUpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white">
                ⏰ Programar Mensagem e Prazo de Envio
              </h3>
              <button
                type="button"
                onClick={() => setNovoFollowUpModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarFollowUpProgramado} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="(69) 99999-9999"
                    value={novoFollowUpForm.telefone}
                    onChange={e => setNovoFollowUpForm({ ...novoFollowUpForm, telefone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Nome do Contato</label>
                  <input
                    type="text"
                    placeholder="Nome do aluno/lead"
                    value={novoFollowUpForm.nomeContato}
                    onChange={e => setNovoFollowUpForm({ ...novoFollowUpForm, nomeContato: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Enviar daqui a (Horas)</label>
                  <input
                    type="number"
                    min={0}
                    max={720}
                    value={novoFollowUpForm.prazoHoras}
                    onChange={e =>
                      setNovoFollowUpForm({ ...novoFollowUpForm, prazoHoras: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Ou Data/Hora Exata</label>
                  <input
                    type="datetime-local"
                    value={novoFollowUpForm.agendadoPara}
                    onChange={e => setNovoFollowUpForm({ ...novoFollowUpForm, agendadoPara: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Motivo / Identificação</label>
                <input
                  type="text"
                  value={novoFollowUpForm.descricaoMotivo}
                  onChange={e => setNovoFollowUpForm({ ...novoFollowUpForm, descricaoMotivo: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Mensagem que será enviada</label>
                <textarea
                  rows={4}
                  required
                  value={novoFollowUpForm.mensagemSugerida}
                  onChange={e => setNovoFollowUpForm({ ...novoFollowUpForm, mensagemSugerida: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNovoFollowUpModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase"
                >
                  Agendar Envio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

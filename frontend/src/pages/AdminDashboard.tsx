import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  
  const [metricas, setMetricas] = useState({ totalAlunos: 0, assinaturasAtivas: 0, inadimplentes: 0 });
  const [alunos, setAlunos] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any>({ pendentes: [], posAula: [], finalizados: [] });
  const [presencas, setPresencas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Aba ativa: 'alunos' | 'agendamentos' | 'presencas'
  const [abaAtiva, setAbaAtiva] = useState('alunos');
  // Sub-aba de agendamentos experimentais: 'pendentes' | 'posAula'
  const [subAbaExperimental, setSubAbaExperimental] = useState<'pendentes' | 'posAula'>('pendentes');

  // Modal Novo Aluno
  const [showModal, setShowModal] = useState(false);
  const [novoAluno, setNovoAluno] = useState({ nome: '', cpf: '', email: '', telefone: '', plano: '2x na semana' });

  // Modal Calendário / Presença do Aluno (Comando 2 e 5)
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [calendarioDados, setCalendarioDados] = useState<any>(null);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth() + 1);
  const [anoCalendario, setAnoCalendario] = useState(new Date().getFullYear());

  // Modal de Ação do Dia no Calendário (Marcar presença / Falta Justificada)
  const [diaSelecionadoAcao, setDiaSelecionadoAcao] = useState<string | null>(null);
  const [justificativaInput, setJustificativaInput] = useState('');
  const [modalAcaoDia, setModalAcaoDia] = useState(false);

  // Modal Converter Experimental em Aluno
  const [leadParaConverter, setLeadParaConverter] = useState<any>(null);
  const [planoConversao, setPlanoConversao] = useState('2x na semana');
  const [valorConversao, setValorConversao] = useState('130');

  useEffect(() => {
    if (isLoggedIn) {
      carregarDashboard();
    }
  }, [isLoggedIn]);

  const carregarDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, agendRes, presencasRes] = await Promise.all([
        axios.get(`${API_URL}/admin/dashboard`),
        axios.get(`${API_URL}/admin/agendamentos`),
        axios.get(`${API_URL}/admin/presencas`)
      ]);
      setMetricas(dashRes.data.metricas);
      setAlunos(dashRes.data.alunos);
      setAgendamentos(agendRes.data);
      setPresencas(presencasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Senha incorreta! (Dica: a senha é admin123)');
    }
  };

  const criarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/admin/alunos`, novoAluno);
      alert(`Aluno criado com sucesso!\n\nSenha temporária gerada: ${response.data.senhaTemporaria}\n(Envie isso para o aluno acessar o portal)`);
      carregarDashboard();
      setShowModal(false);
      setNovoAluno({ nome: '', cpf: '', email: '', telefone: '', plano: '2x na semana' });
    } catch (error: any) {
      const msg = error.response?.data?.erro 
        || (error.message?.includes('Network Error') ? 'Não foi possível conectar ao servidor (Backend offline). Verifique se o servidor está rodando.' : null)
        || error.message
        || 'Erro ao criar aluno.';
      alert(msg);
    }
  };

  const formatarWhatsUrl = (telefone: string, mensagem: string) => {
    let limpo = (telefone || '').replace(/\D/g, '');
    if (!limpo) return '#';
    if (!limpo.startsWith('55') && (limpo.length === 10 || limpo.length === 11)) {
      limpo = '55' + limpo;
    }
    return `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`;
  };

  const handleCobrar = (aluno: any) => {
    if (!aluno.telefone) {
      alert(`O aluno ${aluno.nome} não possui número de telefone cadastrado no registro.`);
      return;
    }
    const dias = aluno.diasVencimento;
    let msg = '';
    if (dias === null) {
      msg = `Olá ${aluno.nome}, aqui é o Professor Felipe do CT BORÜ Muay Thai (+55 69 9238-4491)! Tudo bem? Passando para regularizar sua matrícula no plano ${aluno.plano}.`;
    } else if (dias < 0) {
      msg = `Olá ${aluno.nome}, tudo bem? Aqui é o Professor Felipe do CT BORÜ Muay Thai. Sua mensalidade venceu há ${Math.abs(dias)} dias. Por favor, nos envie o comprovante de pagamento assim que possível! Qualquer dúvida, fale no WhatsApp (+55 69 9238-4491).`;
    } else if (dias === 0) {
      msg = `Olá ${aluno.nome}, aqui é do CT BORÜ Muay Thai! Sua mensalidade vence hoje. Caso já tenha realizado o pagamento, desconsidere! Contato Professor: +55 69 9238-4491.`;
    } else {
      msg = `Olá ${aluno.nome}, tudo bem? Passando para lembrar que sua mensalidade no CT BORÜ vence em ${dias} dias. Bons treinos! Contato Professor: +55 69 9238-4491.`;
    }
    window.open(formatarWhatsUrl(aluno.telefone, msg), '_blank');
  };

  const handleRegistrarPagamento = async (aluno: any) => {
    if (confirm(`Deseja registrar o pagamento de ${aluno.nome} e renovar por +30 dias?`)) {
      try {
        const response = await axios.post(`${API_URL}/admin/alunos/${aluno.id}/pagar`);
        alert(response.data.mensagem);
        carregarDashboard();
        if (alunoSelecionado && alunoSelecionado.id === aluno.id) {
          abrirCalendarioAluno(alunoSelecionado);
        }
      } catch (error: any) {
        alert(error.response?.data?.erro || 'Erro ao registrar pagamento.');
      }
    }
  };

  const atualizarPrajied = async (alunoId: string, prajied: string) => {
    try {
      await axios.patch(`${API_URL}/admin/alunos/${alunoId}/prajied`, { prajied });
      alert(`Graduação alterada para ${prajied} com sucesso!`);
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao atualizar Prajied.');
    }
  };

  // ==========================================
  // CONFIRMAÇÃO DE CHECK-IN (Comando 4)
  // ==========================================
  const handleAlterarStatusPresenca = async (presencaId: string, novoStatus: string, justificativa?: string) => {
    try {
      await axios.patch(`${API_URL}/admin/presencas/${presencaId}/status`, {
        status: novoStatus,
        justificativa
      });
      // Atualiza estado local de presenças
      setPresencas(prev => prev.map(p => p.id === presencaId ? { ...p, status: novoStatus, justificativa } : p));
      // Se o calendário estiver aberto, recarrega
      if (alunoSelecionado) {
        carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
      }
    } catch (error) {
      alert('Erro ao atualizar presença.');
    }
  };

  // ==========================================
  // CALENDÁRIO DO ALUNO (Comando 2 e 5)
  // ==========================================
  const abrirCalendarioAluno = async (aluno: any) => {
    setAlunoSelecionado(aluno);
    setMesCalendario(new Date().getMonth() + 1);
    setAnoCalendario(new Date().getFullYear());
    await carregarDadosCalendario(aluno.id, new Date().getMonth() + 1, new Date().getFullYear());
  };

  const carregarDadosCalendario = async (alunoId: string, mes: number, ano: number) => {
    setLoadingCalendario(true);
    try {
      const res = await axios.get(`${API_URL}/admin/alunos/${alunoId}/calendario`, {
        params: { mes, ano }
      });
      setCalendarioDados(res.data);
    } catch (error) {
      console.error('Erro ao carregar calendário do aluno', error);
    } finally {
      setLoadingCalendario(false);
    }
  };

  const mudarMesCalendario = (delta: number) => {
    let novoMes = mesCalendario + delta;
    let novoAno = anoCalendario;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }
    setMesCalendario(novoMes);
    setAnoCalendario(novoAno);
    if (alunoSelecionado) {
      carregarDadosCalendario(alunoSelecionado.id, novoMes, novoAno);
    }
  };

  const abrirAcaoDia = (dataIso: string) => {
    setDiaSelecionadoAcao(dataIso);
    const presencasDoDia = calendarioDados?.presencasPorDia?.[dataIso] || [];
    const presencaAtual = presencasDoDia[0];
    setJustificativaInput(presencaAtual?.justificativa || '');
    setModalAcaoDia(true);
  };

  const salvarPresencaNoDia = async (status: string) => {
    if (!alunoSelecionado || !diaSelecionadoAcao) return;
    try {
      await axios.post(`${API_URL}/admin/alunos/${alunoSelecionado.id}/presenca`, {
        data: diaSelecionadoAcao,
        status,
        justificativa: status === 'JUSTIFICADO' ? (justificativaInput || 'Falta Justificada') : null
      });
      setModalAcaoDia(false);
      carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
      carregarDashboard();
    } catch (error) {
      alert('Erro ao salvar presença no calendário.');
    }
  };

  const removerPresencaDoDia = async () => {
    if (!alunoSelecionado || !diaSelecionadoAcao) return;
    if (confirm('Deseja remover o registro deste dia?')) {
      try {
        await axios.delete(`${API_URL}/admin/alunos/${alunoSelecionado.id}/presenca`, {
          data: { data: diaSelecionadoAcao }
        });
        setModalAcaoDia(false);
        carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
        carregarDashboard();
      } catch (error) {
        alert('Erro ao remover registro.');
      }
    }
  };

  // ==========================================
  // AULAS EXPERIMENTAIS (Comando 3)
  // ==========================================
  const marcarAulaRealizada = async (agendamentoId: string) => {
    if (confirm('Confirmar que a pessoa realizou a aula experimental? Ela irá para a tabela de Follow-up para fechar contrato!')) {
      try {
        await axios.patch(`${API_URL}/admin/agendamentos/${agendamentoId}`, {
          status: 'REALIZADA'
        });
        carregarDashboard();
        setSubAbaExperimental('posAula'); // Direciona para a nova tabela
      } catch (error) {
        alert('Erro ao atualizar agendamento.');
      }
    }
  };

  const abrirModalConversao = (lead: any) => {
    setLeadParaConverter(lead);
    setPlanoConversao('2x na semana');
    setValorConversao('130');
  };

  const converterLeadEmAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadParaConverter) return;

    try {
      const res = await axios.post(`${API_URL}/admin/agendamentos/${leadParaConverter.id}/converter`, {
        plano: planoConversao,
        valorMensalidade: valorConversao
      });
      alert(`${res.data.mensagem}\n\nSenha temporária: ${res.data.senhaTemporaria}`);
      setLeadParaConverter(null);
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao matricular aluno.');
    }
  };

  const marcarComoDesistente = async (agendamentoId: string) => {
    if (confirm('Deseja arquivar este contato como desistente?')) {
      try {
        await axios.patch(`${API_URL}/admin/agendamentos/${agendamentoId}`, {
          status: 'DESISTIU'
        });
        carregarDashboard();
      } catch (error) {
        alert('Erro ao arquivar contato.');
      }
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setNovoAluno({ ...novoAluno, cpf: v });
  };

  // Contagem de check-ins pendentes
  const checkinsPendentesCount = presencas.filter(p => p.status === 'AGENDADO').length;

  // TELA DE LOGIN
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-widest mb-1">BORÜ</h1>
            <p className="text-red-500 font-bold text-sm tracking-widest uppercase">Acesso Professor</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-2">Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30">
              Entrar no Painel
            </button>
          </form>
          <Link to="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition">
            ← Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  // Meses para o calendário
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-4 sm:p-6 z-[9999]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
              PAINEL <span className="text-red-600">DO PROFESSOR</span>
            </h1>
            <p className="text-zinc-400 mt-1">CT BORÜ Muay Thai — Gestão de Alunos, Presenças e Follow-up</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" onClick={() => setIsLoggedIn(false)} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition">
              Sair (Logout)
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Carregando dados do servidor...</div>
        ) : (
          <>
            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-400 text-sm font-semibold mb-1">Total de Alunos Matriculados</p>
                <p className="text-4xl font-black text-white">{metricas.totalAlunos}</p>
              </div>
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-400 text-sm font-semibold mb-1">Mensalidades em Dia</p>
                <p className="text-4xl font-black text-green-500">{metricas.assinaturasAtivas}</p>
              </div>
              <div className="bg-[#141416] border border-red-900/30 rounded-xl p-6">
                <p className="text-zinc-400 text-sm font-semibold mb-1">Mensalidades em Atraso</p>
                <p className="text-4xl font-black text-red-500">{metricas.inadimplentes}</p>
              </div>
            </div>

            {/* AVISO DE CHECK-INS PENDENTES */}
            {checkinsPendentesCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <h4 className="font-bold text-amber-400">
                      Você tem {checkinsPendentesCount} check-in(s) aguardando confirmação de presença!
                    </h4>
                    <p className="text-xs text-zinc-400">Alunos deram check-in no aplicativo. Dê o OK para confirmar que estavam presentes no treino.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAbaAtiva('presencas')} 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-lg uppercase tracking-wider transition whitespace-nowrap"
                >
                  Confirmar Presenças Agora
                </button>
              </div>
            )}

            {/* MODAL NOVO ALUNO */}
            {showModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] px-4">
                <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6">Cadastrar Novo Aluno</h2>
                  <form onSubmit={criarAluno} className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Nome Completo</label>
                      <input required type="text" value={novoAluno.nome} onChange={(e) => setNovoAluno({...novoAluno, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">CPF</label>
                      <input required type="text" maxLength={14} value={novoAluno.cpf} onChange={handleCpfChange} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">WhatsApp</label>
                      <input type="text" value={novoAluno.telefone} onChange={(e) => setNovoAluno({...novoAluno, telefone: e.target.value})} placeholder="(69) 99999-9999" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">E-mail (Opcional)</label>
                      <input type="email" value={novoAluno.email} onChange={(e) => setNovoAluno({...novoAluno, email: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Plano Escolhido</label>
                      <select value={novoAluno.plano} onChange={(e) => setNovoAluno({...novoAluno, plano: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500">
                        <option value="2x na semana">2x na semana (R$ 130)</option>
                        <option value="3x na semana">3x na semana (R$ 160)</option>
                        <option value="Todos os Horários">Todos os Horários (R$ 280)</option>
                        <option value="Diária">Diária (R$ 40)</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition">Cancelar</button>
                      <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-bold transition shadow-lg shadow-red-600/30">Cadastrar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL MATRICULAR LEAD EXPERIMENTAL */}
            {leadParaConverter && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] px-4">
                <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white shadow-2xl">
                  <h2 className="text-2xl font-bold mb-2">Matricular Lead</h2>
                  <p className="text-sm text-zinc-400 mb-6">
                    Convertendo <strong>{leadParaConverter.nome}</strong> da aula experimental em Aluno Oficial.
                  </p>
                  <form onSubmit={converterLeadEmAluno} className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">WhatsApp</label>
                      <input disabled type="text" value={leadParaConverter.telefone} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-400" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Plano Escolhido</label>
                      <select 
                        value={planoConversao} 
                        onChange={(e) => {
                          setPlanoConversao(e.target.value);
                          if (e.target.value === '2x na semana') setValorConversao('130');
                          else if (e.target.value === '3x na semana') setValorConversao('160');
                          else if (e.target.value === 'Todos os Horários') setValorConversao('280');
                          else setValorConversao('40');
                        }} 
                        className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="2x na semana">2x na semana (R$ 130)</option>
                        <option value="3x na semana">3x na semana (R$ 160)</option>
                        <option value="Todos os Horários">Todos os Horários (R$ 280)</option>
                        <option value="Diária">Diária (R$ 40)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Valor da Mensalidade (R$)</label>
                      <input type="number" value={valorConversao} onChange={(e) => setValorConversao(e.target.value)} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setLeadParaConverter(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition">Cancelar</button>
                      <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold transition shadow-lg shadow-green-600/30">Confirmar Matrícula</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL CALENDÁRIO / PRESENÇA DO ALUNO (Comando 2 e 5) */}
            {alunoSelecionado && (
              <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
                <div className="bg-[#141416] border border-zinc-800 rounded-2xl w-full max-w-4xl p-6 sm:p-8 text-white max-h-[95vh] overflow-y-auto shadow-2xl">
                  
                  {/* HEADER DO MODAL */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5 mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white">{alunoSelecionado.nome}</h2>
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-950/60 text-red-400 border border-red-800/40 uppercase">
                          {alunoSelecionado.plano}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Prajied: <strong className="text-white">{alunoSelecionado.prajied || 'Branco'}</strong> | WhatsApp: {alunoSelecionado.telefone || 'Não informado'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setAlunoSelecionado(null)} 
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition self-end sm:self-auto"
                    >
                      ✕ Fechar
                    </button>
                  </div>

                  {loadingCalendario ? (
                    <div className="py-20 text-center text-zinc-500">Carregando calendário de frequência...</div>
                  ) : calendarioDados && (
                    <div className="space-y-6">
                      
                      {/* STATS DE FREQUÊNCIA E PORCENTAGEM (Comando 2) */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4">
                          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Frequência no Mês</p>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-black ${
                              calendarioDados.estatisticas.porcentagemPresenca >= 80 ? 'text-green-500' :
                              calendarioDados.estatisticas.porcentagemPresenca >= 50 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {calendarioDados.estatisticas.porcentagemPresenca}%
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                calendarioDados.estatisticas.porcentagemPresenca >= 80 ? 'bg-green-500' :
                                calendarioDados.estatisticas.porcentagemPresenca >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${calendarioDados.estatisticas.porcentagemPresenca}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2">
                            {calendarioDados.estatisticas.porcentagemPresenca === 100 
                              ? '✓ 100% de presença atingida!' 
                              : `Meta: ${calendarioDados.estatisticas.aulasEsperadasNoMes} aulas`}
                          </p>
                        </div>

                        <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4">
                          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Presenças Confirmadas</p>
                          <p className="text-3xl font-black text-green-400">{calendarioDados.estatisticas.presentes}</p>
                          <p className="text-[11px] text-zinc-400 mt-2">
                            De {calendarioDados.estatisticas.aulasEsperadasNoMes} aulas esperadas ({calendarioDados.estatisticas.aulasPorSemana}x/sem)
                          </p>
                        </div>

                        <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4">
                          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Faltas Justificadas</p>
                          <p className="text-3xl font-black text-blue-400">{calendarioDados.estatisticas.justificadas}</p>
                          <p className="text-[11px] text-blue-400/80 mt-2">Abonadas na porcentagem</p>
                        </div>

                        {/* STATUS DE PAGAMENTO */}
                        <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Status Mensalidade</p>
                            {calendarioDados.mensalidade.diasParaVencer === null ? (
                              <p className="text-lg font-bold text-zinc-500">Sem mensalidade</p>
                            ) : calendarioDados.mensalidade.diasParaVencer < 0 ? (
                              <p className="text-lg font-black text-red-500">Atrasado há {Math.abs(calendarioDados.mensalidade.diasParaVencer)} dias</p>
                            ) : (
                              <p className="text-lg font-black text-green-500">Em dia (Faltam {calendarioDados.mensalidade.diasParaVencer} dias)</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button 
                              onClick={() => handleCobrar(alunoSelecionado)}
                              className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded transition border border-zinc-700 text-center"
                            >
                              📲 Notificar Whats
                            </button>
                            <button 
                              onClick={() => handleRegistrarPagamento(alunoSelecionado)}
                              className="py-1.5 px-2 bg-green-600 hover:bg-green-700 text-[10px] font-bold rounded transition text-center"
                            >
                              +30d
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* NAVEGAÇÃO DO MÊS */}
                      <div className="flex justify-between items-center bg-[#1A1A1E] p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          <h3 className="text-base font-bold text-white">
                            {mesesNomes[mesCalendario - 1]} de {anoCalendario}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => mudarMesCalendario(-1)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition"
                          >
                            ← Anterior
                          </button>
                          <button 
                            onClick={() => mudarMesCalendario(1)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition"
                          >
                            Próximo →
                          </button>
                        </div>
                      </div>

                      {/* GRADE DO CALENDÁRIO DA VIDA REAL */}
                      <div>
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                          <div>Dom</div>
                          <div>Seg</div>
                          <div>Ter</div>
                          <div>Qua</div>
                          <div>Qui</div>
                          <div>Sex</div>
                          <div>Sáb</div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {(() => {
                            const primeiroDiaSemana = new Date(anoCalendario, mesCalendario - 1, 1).getDay();
                            const totalDiasNoMes = new Date(anoCalendario, mesCalendario, 0).getDate();
                            const items = [];

                            for (let i = 0; i < primeiroDiaSemana; i++) {
                              items.push(<div key={`empty-${i}`} className="h-24 rounded-xl bg-zinc-900/30"></div>);
                            }

                            for (let d = 1; d <= totalDiasNoMes; d++) {
                              const dataIso = `${anoCalendario}-${String(mesCalendario).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                              const presencasDoDia = calendarioDados.presencasPorDia?.[dataIso] || [];
                              const ehHoje = new Date().toISOString().split('T')[0] === dataIso;

                              const presencaConfirmada = presencasDoDia.find((p: any) => p.status === 'PRESENTE');
                              const faltaJustificada = presencasDoDia.find((p: any) => p.status === 'JUSTIFICADO');
                              const checkinPendente = presencasDoDia.find((p: any) => p.status === 'AGENDADO');
                              const ausente = presencasDoDia.find((p: any) => p.status === 'AUSENTE');

                              items.push(
                                <div 
                                  key={`day-${d}`}
                                  onClick={() => abrirAcaoDia(dataIso)}
                                  className={`min-h-[96px] p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition hover:border-red-500/80 hover:scale-[1.02] ${
                                    presencaConfirmada
                                      ? 'bg-green-500/15 border-green-500/40 text-white'
                                      : faltaJustificada
                                      ? 'bg-blue-500/15 border-blue-500/40 text-white'
                                      : checkinPendente
                                      ? 'bg-amber-500/15 border-amber-500/40 text-white'
                                      : ausente
                                      ? 'bg-red-500/15 border-red-500/30 text-white'
                                      : ehHoje
                                      ? 'bg-[#1A1A1E] border-red-500 text-white shadow-md shadow-red-500/10'
                                      : 'bg-[#1A1A1E] border-zinc-800/80 text-zinc-400 hover:bg-[#202025]'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className={`text-sm font-black ${ehHoje ? 'text-red-500' : 'text-zinc-200'}`}>{d}</span>
                                    {ehHoje && <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-bold uppercase">Hoje</span>}
                                  </div>

                                  <div className="space-y-1 mt-1">
                                    {presencaConfirmada && (
                                      <div className="text-[10px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate">
                                        <span>✓</span> Presente
                                      </div>
                                    )}
                                    {faltaJustificada && (
                                      <div className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate" title={faltaJustificada.justificativa || 'Falta Justificada'}>
                                        <span>ℹ️</span> {faltaJustificada.justificativa || 'Justificada'}
                                      </div>
                                    )}
                                    {checkinPendente && (
                                      <div className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate animate-pulse">
                                        <span>⏳</span> Aguardando OK
                                      </div>
                                    )}
                                    {ausente && (
                                      <div className="text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate">
                                        <span>✗</span> Falta
                                      </div>
                                    )}
                                    {!presencaConfirmada && !faltaJustificada && !checkinPendente && !ausente && (
                                      <span className="text-[10px] text-zinc-600 opacity-0 hover:opacity-100 transition block text-center">
                                        + Registrar
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return items;
                          })()}
                        </div>
                      </div>

                      {/* LEGENDA E INSTRUÇÃO */}
                      <div className="bg-[#1A1A1E] p-4 rounded-xl border border-zinc-800 flex flex-wrap justify-between items-center gap-4 text-xs text-zinc-400">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            <span>Presença Confirmada</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                            <span>Falta Justificada (Abonada)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                            <span>Check-in Pendente</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span>Falta (Ausente)</span>
                          </div>
                        </div>
                        <p className="text-zinc-500 text-[11px]">
                          💡 Clique em qualquer dia do calendário para marcar <strong>Presença</strong> ou <strong>Falta Justificada</strong>.
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* MODAL DE AÇÃO DO DIA (Comando 5: Falta Justificada / Presença) */}
            {modalAcaoDia && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10001] px-4">
                <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-sm text-white shadow-2xl">
                  <h3 className="text-lg font-bold mb-1">
                    Gerenciar Dia: {diaSelecionadoAcao?.split('-').reverse().join('/')}
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    Aluno: <strong>{alunoSelecionado?.nome}</strong>
                  </p>

                  <div className="space-y-3">
                    <button 
                      onClick={() => salvarPresencaNoDia('PRESENTE')}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md shadow-green-600/20"
                    >
                      ✓ Marcar como Presente
                    </button>

                    <div className="bg-[#1A1A1E] p-3 rounded-xl border border-zinc-800 space-y-2">
                      <label className="block text-xs font-semibold text-blue-400">
                        📋 Falta Justificada (Atestado / Motivo)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: Atestado médico, trabalho..." 
                        value={justificativaInput}
                        onChange={(e) => setJustificativaInput(e.target.value)}
                        className="w-full bg-[#141416] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => salvarPresencaNoDia('JUSTIFICADO')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-xs transition"
                      >
                        Salvar Falta Justificada
                      </button>
                    </div>

                    <button 
                      onClick={() => salvarPresencaNoDia('AUSENTE')}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-xs transition"
                    >
                      Marcar como Falta (Não Compareceu)
                    </button>

                    <button 
                      onClick={removerPresencaDoDia}
                      className="w-full py-2 text-red-500 hover:text-red-400 text-xs font-bold transition"
                    >
                      🗑️ Limpar / Remover Registro Deste Dia
                    </button>

                    <button 
                      onClick={() => setModalAcaoDia(false)}
                      className="w-full py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition mt-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TABS PRINCIPAIS */}
            <div className="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto">
              <button 
                onClick={() => setAbaAtiva('alunos')} 
                className={`font-bold pb-2 transition whitespace-nowrap ${abaAtiva === 'alunos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                🥊 Alunos e Mensalidades
              </button>
              <button 
                onClick={() => setAbaAtiva('agendamentos')} 
                className={`font-bold pb-2 transition flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'agendamentos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                🥋 Aulas Experimentais
                {(agendamentos?.pendentes?.length > 0 || agendamentos?.posAula?.length > 0) && (
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {(agendamentos?.pendentes?.length || 0) + (agendamentos?.posAula?.length || 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setAbaAtiva('presencas')} 
                className={`font-bold pb-2 transition flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'presencas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                📋 Frequência e Check-ins
                {checkinsPendentesCount > 0 && (
                  <span className="bg-amber-500 text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                    {checkinsPendentesCount}
                  </span>
                )}
              </button>
            </div>

            {/* ABA 1: ALUNOS E MENSALIDADES */}
            {abaAtiva === 'alunos' ? (
              <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Alunos Matriculados</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Clique em "Calendário" para ver a frequência em tempo real e justificar faltas.</p>
                  </div>
                  <button onClick={() => setShowModal(true)} className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition shadow-md shadow-red-600/30">
                    + Novo Aluno
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Plano</th>
                        <th className="px-6 py-4">Prajied</th>
                        <th className="px-6 py-4">Vencimento</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {alunos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                            Nenhum aluno cadastrado no banco de dados ainda.
                          </td>
                        </tr>
                      )}
                      {alunos.map((aluno) => (
                        <tr key={aluno.id} className="hover:bg-[#1A1A1E]/50 transition">
                          <td className="px-6 py-4">
                            <p className="font-bold text-white">{aluno.nome}</p>
                            <p className="text-xs text-zinc-500">{aluno.telefone || aluno.cpf}</p>
                          </td>
                          <td className="px-6 py-4 text-zinc-300 font-semibold">{aluno.plano}</td>
                          <td className="px-6 py-4">
                            <select 
                              value={aluno.prajied || 'Branco'}
                              onChange={(e) => atualizarPrajied(aluno.id, e.target.value)}
                              className="bg-[#1A1A1E] border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500"
                            >
                              <option value="Branco">Branco</option>
                              <option value="Branco e Vermelho">Branco e Vermelho</option>
                              <option value="Vermelho">Vermelho</option>
                              <option value="Vermelho e Azul">Vermelho e Azul</option>
                              <option value="Azul Claro">Azul Claro</option>
                              <option value="Azul Escuro">Azul Escuro (Instrutor)</option>
                              <option value="Preto">Preto (Mestre)</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            {aluno.diasVencimento === null ? (
                              <span className="text-zinc-600">-</span>
                            ) : aluno.diasVencimento < 0 ? (
                              <span className="text-red-500 font-bold">Atrasado há {Math.abs(aluno.diasVencimento)} dias</span>
                            ) : aluno.diasVencimento === 0 ? (
                              <span className="text-amber-500 font-bold">Vence hoje!</span>
                            ) : (
                              <span className="text-zinc-300 font-semibold">Faltam {aluno.diasVencimento} dias</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {aluno.status === 'PAGO' ? (
                              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase">
                                Em Dia
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase">
                                Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {/* BOTÃO CALENDÁRIO / FREQUÊNCIA (Comando 2) */}
                              <button 
                                onClick={() => abrirCalendarioAluno(aluno)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition flex items-center gap-1 shadow-sm"
                                title="Abrir Calendário de Frequência"
                              >
                                📅 Calendário
                              </button>
                              <button 
                                onClick={() => handleRegistrarPagamento(aluno)} 
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded transition"
                                title="Registrar Pagamento de Mensalidade"
                              >
                                Pago
                              </button>
                              <button 
                                onClick={() => handleCobrar(aluno)} 
                                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium text-xs rounded transition"
                                title="Cobrar / Lembrete via WhatsApp"
                              >
                                Cobrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : abaAtiva === 'agendamentos' ? (
              /* ABA 2: AULAS EXPERIMENTAIS COM 2 TABELAS (Comando 3) */
              <div className="space-y-6">
                
                {/* SUB-TABS */}
                <div className="flex gap-3 bg-[#141416] p-2 rounded-xl border border-zinc-800 w-fit">
                  <button 
                    onClick={() => setSubAbaExperimental('pendentes')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      subAbaExperimental === 'pendentes' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    1. Aulas a Realizar (Agendamentos)
                    {agendamentos?.pendentes?.length > 0 && (
                      <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">
                        {agendamentos.pendentes.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setSubAbaExperimental('posAula')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      subAbaExperimental === 'posAula' ? 'bg-amber-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    2. Pós-Aula (Aguardando Fechar Contrato)
                    {agendamentos?.posAula?.length > 0 && (
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                        {agendamentos.posAula.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* TABELA 1: PENDENTES (A REALIZAR) */}
                {subAbaExperimental === 'pendentes' ? (
                  <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-zinc-800">
                      <h2 className="text-xl font-bold text-white">Agendamentos de Aula Experimental (Aguardando Treino)</h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Pessoas que agendaram pelo site. Quando a pessoa comparecer ao treino, clique em <strong>"Fez a Aula"</strong> para acompanhar o fechamento de contrato.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                          <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">WhatsApp</th>
                            <th className="px-6 py-4">Dia Marcado</th>
                            <th className="px-6 py-4">Horário</th>
                            <th className="px-6 py-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {(!agendamentos?.pendentes || agendamentos.pendentes.length === 0) && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                Nenhum agendamento experimental pendente no momento.
                              </td>
                            </tr>
                          )}
                          {agendamentos?.pendentes?.map((ag: any) => (
                            <tr key={ag.id} className="hover:bg-[#1A1A1E]/50 transition">
                              <td className="px-6 py-4 font-bold text-white">{ag.nome}</td>
                              <td className="px-6 py-4 text-zinc-400">{ag.telefone}</td>
                              <td className="px-6 py-4 font-bold text-amber-500">{ag.data}</td>
                              <td className="px-6 py-4 font-bold text-white">{ag.horario}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  <a 
                                    href={formatarWhatsUrl(
                                      ag.telefone,
                                      `Olá ${ag.nome}, confirmamos seu agendamento para a aula experimental de Muay Thai no CT BORÜ na ${ag.data} às ${ag.horario}! Estamos ansiosos para te receber no tatame. Contato do Professor: +55 69 9238-4491.`
                                    )} 
                                    target="_blank" 
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition flex items-center gap-1"
                                  >
                                    📲 Whats
                                  </a>
                                  <button 
                                    onClick={() => marcarAulaRealizada(ag.id)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm"
                                  >
                                    ✓ Fez a Aula
                                  </button>
                                  <button 
                                    onClick={() => marcarComoDesistente(ag.id)}
                                    className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition"
                                    title="Não compareceu / Cancelar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : (
                  /* TABELA 2: PÓS-AULA EXPERIMENTAL (Comando 3: Dias desde a aula para mandar msg e chamar para o CT) */
                  <section className="bg-[#141416] border border-amber-500/20 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-zinc-800 bg-amber-500/5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🔥</span> Leads Pós-Aula Experimental (Aguardando Fechar Contrato)
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1">
                            Pessoas que já treinaram no CT mas ainda não fecharam plano. Acompanhe os dias e mande mensagem pelo WhatsApp para fechar a matrícula!
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold">
                          {agendamentos?.posAula?.length || 0} em negociação
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                          <tr>
                            <th className="px-6 py-4">Nome do Lead</th>
                            <th className="px-6 py-4">WhatsApp</th>
                            <th className="px-6 py-4">Data que Treinou</th>
                            <th className="px-6 py-4">Dias Desde a Aula</th>
                            <th className="px-6 py-4 text-right">Ação / Follow-up</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {(!agendamentos?.posAula || agendamentos.posAula.length === 0) && (
                            <tr>
                              <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                                Nenhum lead aguardando fechamento de contrato no momento.
                              </td>
                            </tr>
                          )}
                          {agendamentos?.posAula?.map((lead: any) => {
                            const dias = lead.diasDesdeAula;
                            const msgFollowUp = `Olá ${lead.nome}, tudo bem? Aqui é o Professor Felipe do CT BORÜ Muay Thai (+55 69 9238-4491)! Vimos que você fez sua aula experimental com a gente ${dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}. O que achou do treino? Temos uma condição muito bacana para você começar seus treinos essa semana! Bora voltar pro tatame?`;

                            return (
                              <tr key={lead.id} className="hover:bg-[#1A1A1E]/50 transition">
                                <td className="px-6 py-4 font-bold text-white text-base">{lead.nome}</td>
                                <td className="px-6 py-4 text-zinc-300 font-mono">{lead.telefone}</td>
                                <td className="px-6 py-4 text-zinc-400 text-xs">{lead.dataRealizadaFormatada}</td>
                                <td className="px-6 py-4">
                                  {dias === 0 ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                      Treinou Hoje (0 dias)
                                    </span>
                                  ) : dias === 1 ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      Treinou Ontem (1 dia)
                                    </span>
                                  ) : dias <= 4 ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      Fez há {dias} dias
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                      Fez há {dias} dias (Chamar Urgente!)
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex gap-2 justify-end">
                                    {/* MENSAGEM WHATSAPP FOLLOW-UP (Comando 3) */}
                                    <a 
                                      href={formatarWhatsUrl(lead.telefone, msgFollowUp)}
                                      target="_blank" 
                                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-green-600/20"
                                      title="Mandar mensagem no WhatsApp convidando para fechar o plano"
                                    >
                                      📲 Mandar Mensagem
                                    </a>
                                    {/* FECHAR CONTRATO / MATRICULAR */}
                                    <button 
                                      onClick={() => abrirModalConversao(lead)}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                      title="Converter em Aluno Matriculado"
                                    >
                                      🥋 Fechar Contrato
                                    </button>
                                    <button 
                                      onClick={() => marcarComoDesistente(lead.id)}
                                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs transition"
                                      title="Desistiu / Arquivar"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              </div>
            ) : abaAtiva === 'presencas' ? (
              /* ABA 3: FREQUÊNCIA E CHECK-INS (Comando 4: Dar OK para confirmar presença) */
              <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Check-ins & Presenças no Tatame</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Sempre que o aluno der check-in no aplicativo, dê o <strong>OK (Confirmar)</strong> para validar a presença na aula ou marque falta justificada.
                    </p>
                  </div>
                  <button onClick={carregarDashboard} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition font-semibold">
                    ↻ Atualizar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Data / Hora</th>
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Plano</th>
                        <th className="px-6 py-4">Aula</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ação do Professor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {presencas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                            Nenhum check-in registrado ainda.
                          </td>
                        </tr>
                      )}
                      {presencas.map((p) => {
                        const ehPendente = p.status === 'AGENDADO';
                        const ehPresente = p.status === 'PRESENTE';
                        const ehJustificado = p.status === 'JUSTIFICADO';

                        return (
                          <tr key={p.id} className={`transition ${ehPendente ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[#1A1A1E]/50'}`}>
                            <td className="px-6 py-4 text-zinc-400 text-xs">
                              {new Date(p.data || p.criadoEm).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-white">{p.aluno?.nome || 'Aluno'}</p>
                              {p.justificativa && (
                                <p className="text-[11px] text-blue-400">Obs: {p.justificativa}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-zinc-400 text-xs">{p.aluno?.plano || '2x na semana'}</td>
                            <td className="px-6 py-4 font-semibold text-zinc-200">
                              {p.evento?.titulo || 'Muay Thai Tradicional'}
                            </td>
                            <td className="px-6 py-4">
                              {ehPresente ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30 uppercase">
                                  ✓ Presença Confirmada
                                </span>
                              ) : ehJustificado ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
                                  ℹ️ Falta Justificada
                                </span>
                              ) : ehPendente ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase animate-pulse">
                                  ⏳ Aguardando OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase">
                                  ✗ Não Compareceu
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {/* DAR OK / CONFIRMAR PRESENÇA (Comando 4) */}
                                {ehPendente ? (
                                  <>
                                    <button 
                                      onClick={() => handleAlterarStatusPresenca(p.id, 'PRESENTE')}
                                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition shadow-sm flex items-center gap-1"
                                      title="Dar OK e confirmar que o aluno compareceu ao treino"
                                    >
                                      ✓ Confirmar Presença (OK)
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const motivo = prompt('Informe a justificativa da falta (ex: Atestado médico, trabalho):', 'Falta justificada');
                                        if (motivo !== null) {
                                          handleAlterarStatusPresenca(p.id, 'JUSTIFICADO', motivo);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition"
                                      title="Marcar como Falta Justificada"
                                    >
                                      Justificada
                                    </button>
                                    <button 
                                      onClick={() => handleAlterarStatusPresenca(p.id, 'AUSENTE')}
                                      className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition"
                                      title="Não veio"
                                    >
                                      Não Veio
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      if (p.aluno) {
                                        abrirCalendarioAluno(p.aluno);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition"
                                  >
                                    📅 Ver Calendário
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

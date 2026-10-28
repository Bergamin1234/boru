import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { StudentTournamentsTab } from '../components/StudentTournamentsTab';
import { StudentPerformanceStatsTab } from '../components/StudentPerformanceStatsTab';
import StudentCTRanking from '../components/StudentCTRanking';
import NoticeCard from '../components/NoticeCard';
import { publicApi, studentApi } from '../services/api';
import { StudentGamificationTab } from '../components/StudentGamificationTab';
import { ContractBlockingModal, MyContractsTab } from '../components/ContractModalAndTab';
import { PublicQuickCheckinCard, LoggedQuickCheckinBanner } from '../components/QuickCheckinWidget';
import { isImageSource } from '../components/FileUploadInput';

export default function PortalAluno() {
  const [aulas, setAulas] = useState<any[]>([]);
  const [alunoLogado, setAlunoLogado] = useState<any>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [erroCpf, setErroCpf] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Controle de primeiro acesso
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Controle de recuperação de senha
  const [showRecuperarSenha, setShowRecuperarSenha] = useState(false);
  const [contatoRecuperacao, setContatoRecuperacao] = useState('');

  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Abas do Portal: 'treinos' | 'frequencia' | 'conquistas' | 'contratos' | 'avisos' | 'mercado' | 'financeiro' | 'torneios' | 'ranking' | 'desempenho'
  const [abaAtiva, setAbaAtiva] = useState('treinos');

  // Sincroniza aba via query param (?tab=...) ou rota direta (/ranking, /dashboard-lutador, /torneios)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['treinos', 'frequencia', 'conquistas', 'contratos', 'avisos', 'mercado', 'financeiro', 'torneios', 'ranking', 'desempenho'].includes(tabParam)) {
      setAbaAtiva(tabParam);
    } else if (location.pathname === '/ranking') {
      setAbaAtiva('ranking');
    } else if (location.pathname === '/dashboard-lutador') {
      setAbaAtiva('desempenho');
    } else if (location.pathname === '/torneios') {
      setAbaAtiva('torneios');
    }
  }, [searchParams, location.pathname]);
  
  // Frequência & Calendário
  const [dadosFrequencia, setDadosFrequencia] = useState<any>(null);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  // Gamificação / Estímulo ao Check-in
  const [gamificacao, setGamificacao] = useState<any>(null);
  const [checkinSucessoAnim, setCheckinSucessoAnim] = useState<string | null>(null);

  // Modal Justificar Ausência / Doença
  const [showModalJustificar, setShowModalJustificar] = useState(false);
  const [aulaParaJustificar, setAulaParaJustificar] = useState<any>(null);
  const [motivoJustificativa, setMotivoJustificativa] = useState('DOENCA');
  const [detalheJustificativa, setDetalheJustificativa] = useState('');

  // Mural de Avisos
  const [avisos, setAvisos] = useState<any[]>([]);

  // Loja / Mercado Borü (Beta)
  const [produtos, setProdutos] = useState<any[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  // Módulo 1: Horários e Graduações dos Professores
  const [professoresHorarios, setProfessoresHorarios] = useState<any[]>([]);

  // Restauração de sessão salva
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('boru_aluno_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          setAlunoLogado(parsed);
          setIsLoggedIn(true);
          carregarTudo(parsed.id);
        }
      }
    } catch (e) {}
  }, []);




  const validarCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCPF(cpf)) {
      setErroCpf('CPF Inválido. Verifique os números e tente novamente.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await studentApi.login({ cpf, senha });
      setAlunoLogado(response.data);
      try { sessionStorage.setItem('boru_aluno_session', JSON.stringify(response.data)); } catch (e) {}
      setErroCpf('');
      setIsLoggedIn(true);
      if (!response.data.primeiroAcesso) {
        carregarTudo(response.data.id);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setErroCpf('CPF não encontrado no sistema. Fale com a recepção.');
      } else if (error.response && error.response.status === 401) {
        setErroCpf(error.response.data.erro);
      } else {
        setErroCpf('Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contatoRecuperacao) {
      alert('Preencha seu E-mail, CPF ou Telefone.');
      return;
    }
    setLoading(true);
    try {
      const response = await studentApi.recoverPassword({
        contato: contatoRecuperacao
      });
      alert(response.data.mensagem);
      setShowRecuperarSenha(false);
      setContatoRecuperacao('');
      setSenha('');
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao recuperar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await studentApi.changePassword({
        id: alunoLogado.id, 
        novaSenha 
      });
      setAlunoLogado({ ...alunoLogado, primeiroAcesso: false });
      alert('Senha atualizada com sucesso! Bem-vindo(a) ao portal.');
      carregarTudo(alunoLogado.id);
    } catch (error) {
      alert('Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const carregarTudo = async (idDoAluno: string) => {
    carregarAulas(idDoAluno);
    carregarFrequencia(idDoAluno, mesAtual, anoAtual);
    carregarGamificacao(idDoAluno);
    carregarAvisos();
    carregarProdutos();
    carregarProfessoresHorarios();
  };

  const carregarProfessoresHorarios = async () => {
    try {
      const res = await studentApi.getTeacherSchedules();
      setProfessoresHorarios(res.data || []);
    } catch (error) {
      console.error('Erro ao carregar horários dos professores:', error);
    }
  };

  const carregarAulas = async (idDoAluno?: string) => {
    const alunoId = idDoAluno || alunoLogado?.id;
    try {
      const response = await studentApi.getClasses(alunoId ? { alunoId } : {});

      const aulasFormatadas = response.data.map((aula: any) => {
        const d = new Date(aula.dataInicio);
        const horario = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}H`;
        const diaDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const tipo = aula.titulo.includes('KIDS') ? 'KIDS' : 'ADULTOS';

        return {
          id: aula.id,
          horario,
          diaDaSemana,
          dataOriginal: aula.dataInicio,
          tipo,
          titulo: 'Muay Thai Tradicional',
          checkinFeito: aula.checkinFeito,
          checkinStatus: aula.checkinStatus,
          tipoJustificativa: aula.tipoJustificativa
        };
      });
      setAulas(aulasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const carregarFrequencia = async (idDoAluno: string, mes: number, ano: number) => {
    try {
      const res = await studentApi.getCalendar(idDoAluno, { mes, ano });
      setDadosFrequencia(res.data);
    } catch (error) {
      console.error('Erro ao carregar frequência:', error);
    }
  };

  const carregarGamificacao = async (idDoAluno: string) => {
    try {
      const res = await studentApi.getGamification(idDoAluno);
      setGamificacao(res.data);
    } catch (error) {
      console.error('Erro ao carregar gamificação:', error);
    }
  };

  const carregarAvisos = async () => {
    try {
      const res = await publicApi.getNotices();
      setAvisos(res.data);
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      const res = await publicApi.getProducts();
      setProdutos(res.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const formatarCpf = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  // CHECK-IN ESTIMULANTE / GAMIFICADO
  const fazerCheckin = async (id: string) => {
    try {
      await studentApi.checkIn({
        alunoId: alunoLogado.id,
        eventoId: id
      });
      
      setAulas(aulas.map(aula => 
        aula.id === id ? { ...aula, checkinFeito: true, checkinStatus: 'AGENDADO' } : aula
      ));

      if (alunoLogado?.id) {
        carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
        carregarGamificacao(alunoLogado.id);
      }

      setCheckinSucessoAnim('Oss! Presença agendada com sucesso. Mantenha o foco e bom treino, guerreiro!');
      setTimeout(() => setCheckinSucessoAnim(null), 5000);
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao realizar check-in.');
    }
  };

  // JUSTIFICAR AUSÊNCIA / INFORMAR DOENÇA
  const handleSalvarJustificativa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aulaParaJustificar) return;

    try {
      await studentApi.justifyAbsence({
        alunoId: alunoLogado.id,
        eventoId: aulaParaJustificar.id,
        data: aulaParaJustificar.dataOriginal,
        motivo: motivoJustificativa,
        justificativa: detalheJustificativa
      });

      alert('Ausência comunicada! Desejamos melhoras rápidas.');
      setShowModalJustificar(false);
      setAulaParaJustificar(null);
      setDetalheJustificativa('');
      carregarAulas(alunoLogado.id);
      carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
    } catch (error) {
      alert('Erro ao enviar justificativa.');
    }
  };

  const isDiariaOuConvenio = (plano?: string) => {
    if (!plano) return false;
    const p = plano.toLowerCase();
    return p.includes('diária') || p.includes('diaria') || p.includes('wellhub') || p.includes('totalpass') || p.includes('gympass');
  };

  const calcularDiasVencimento = () => {
    if (alunoLogado?.is_bolsista) return 999;
    if (isDiariaOuConvenio(alunoLogado?.plano)) return null;
    if (!alunoLogado?.mensalidades || alunoLogado.mensalidades.length === 0) return null;
    const ultima = alunoLogado.mensalidades[0];
    const agora = new Date();
    const venc = new Date(ultima.dataVencimento);
    const diff = venc.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const dias = calcularDiasVencimento();

  // TELA DE LOGIN DO ALUNO + MÓDULO 3: CHECK-IN RÁPIDO PÚBLICO
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C]/75 backdrop-blur-[2px] flex items-center justify-center z-[9999] px-4 py-6 relative overflow-y-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-start my-auto relative z-10">
          {/* Card de Login */}
          <div className="bg-[#141416]/95 backdrop-blur-md border border-zinc-800 p-7 sm:p-8 rounded-2xl w-full shadow-2xl">
            <div className="text-center mb-6">
              <img 
                src="/logo-boru.jpg" 
                alt="BORÜ Centro de Combate" 
                className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-red-600 shadow-xl object-cover" 
              />
              <h1 className="text-3xl font-black text-white tracking-widest mb-1">BORÜ</h1>
              <p className="text-red-500 font-bold text-xs uppercase tracking-widest">
                {showRecuperarSenha ? 'Recuperar Acesso' : 'Portal do Aluno'}
              </p>
            </div>
            
            
            {showRecuperarSenha ? (
              <form onSubmit={handleRecuperarSenha} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">E-mail, CPF ou Telefone</label>
                  <input 
                    type="text" 
                    value={contatoRecuperacao}
                    onChange={(e) => setContatoRecuperacao(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                    placeholder="Insira seu contato"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30 text-sm">
                  {loading ? 'Buscando...' : 'Recuperar Acesso'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowRecuperarSenha(false)} 
                  className="w-full text-zinc-500 hover:text-white text-xs transition font-semibold"
                >
                  Voltar para Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">Seu CPF</label>
                  <input 
                    type="text" 
                    value={cpf}
                    onChange={(e) => formatarCpf(e.target.value)}
                    maxLength={14}
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-zinc-400 text-xs font-semibold">Senha</label>
                    <button 
                      type="button" 
                      onClick={() => setShowRecuperarSenha(true)} 
                      className="text-xs text-red-500 hover:text-red-400 font-bold transition"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                    placeholder="Sua senha"
                    required
                  />
                  {erroCpf && <p className="text-red-500 text-xs mt-2 font-semibold">{erroCpf}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30 text-sm uppercase tracking-wider">
                  {loading ? 'Entrando...' : 'Acessar Portal'}
                </button>
              </form>
            )}

            <Link to="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-xs transition">
              ← Voltar ao site principal
            </Link>
          </div>

          {/* MÓDULO 3: CHECK-IN RÁPIDO NA TELA DE LOGIN (PÚBLICO) */}
          <div className="w-full">
            <PublicQuickCheckinCard />
          </div>
        </div>
      </div>
    );
  }

  // TELA DE PRIMEIRO ACESSO (MUDAR SENHA)
  if (alunoLogado?.primeiroAcesso) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white mb-2">Bem-vindo(a), {alunoLogado.nome.split(' ')[0]}!</h1>
            <p className="text-zinc-400 text-xs">Este é o seu primeiro acesso. Crie uma senha definitiva para continuar.</p>
          </div>
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1">Nova Senha</label>
              <input 
                type="password" 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1">Confirme a Senha</label>
              <input 
                type="password" 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                placeholder="Repita a senha"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 text-sm uppercase">
              {loading ? 'Salvando...' : 'Salvar e Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA DO PORTAL PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0B0B0C]/80 backdrop-blur-[1px] text-zinc-100 font-sans p-3 sm:p-6 pb-28 sm:pb-12 relative z-10">
      {/* MÓDULO 2: MIDDLEWARE DE BLOQUEIO DO CONTRATO ELETRÔNICO */}
      <ContractBlockingModal
        aluno={alunoLogado}
        onContractSigned={(alunoAtualizado) => {
          setAlunoLogado({ ...alunoLogado, ...alunoAtualizado, has_signed_contract: true });
        }}
      />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* FEEDBACK DE CHECK-IN COM SUCESSO (ESTÍMULO VISUAL) */}
        {checkinSucessoAnim && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-600/30 to-amber-500/30 border border-red-500/50 text-white flex items-center justify-between shadow-xl animate-bounce">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="font-black text-sm text-amber-300">CHECK-IN CONFIRMADO!</p>
                <p className="text-xs text-zinc-200">{checkinSucessoAnim}</p>
              </div>
            </div>
            <button onClick={() => setCheckinSucessoAnim(null)} className="text-zinc-400 hover:text-white font-bold text-sm">✕</button>
          </div>
        )}

        {/* HEADER SUPERIOR */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <img src="/logo-boru.jpg" alt="BORÜ" className="w-12 h-12 rounded-full border-2 border-red-600 shadow-md object-cover flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                  ÁREA DO <span className="text-red-600">ALUNO</span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  BORÜ CT
                </span>
                {alunoLogado?.is_bolsista && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-black uppercase">
                    🎓 Aluno Bolsista
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">Sawasdee Krap, <strong className="text-white">{alunoLogado?.nome}</strong>!</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a 
              href={`https://wa.me/556992384491?text=${encodeURIComponent(`Olá Professor Felipe, sou o aluno(a) ${alunoLogado?.nome} e gostaria de tirar uma dúvida!`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
            >
              <span>📲 WhatsApp Recepção</span>
            </a>
            <button 
              onClick={() => { setIsLoggedIn(false); setAlunoLogado(null); try { sessionStorage.removeItem('boru_aluno_session'); } catch (e) {} }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
            >
              Sair
            </button>
          </div>
        </header>

        {/* NAVEGAÇÃO DE ABAS NO DESKTOP */}
        <div className="hidden sm:flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto boru-scrollbar">
          <button 
            id="treinos-checkin-tab-btn" onClick={() => setAbaAtiva('treinos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'treinos' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🥊 Treinos & Check-in
          </button>
          <button 
            onClick={() => setAbaAtiva('frequencia')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'frequencia' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📅 Minha Frequência & %
          </button>
          <button 
            onClick={() => setAbaAtiva('conquistas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'conquistas' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-[#141416] text-amber-400 hover:text-white border border-amber-500/40'
            }`}
          >
            🏆 Minhas Conquistas {gamificacao?.rankAtual ? `(${isImageSource(gamificacao.rankAtual.badge_icon_url) ? '🥇' : gamificacao.rankAtual.badge_icon_url} ${gamificacao.rankAtual.name})` : ''}
          </button>
          <button 
            onClick={() => setAbaAtiva('contratos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'contratos' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📄 Meus Contratos
          </button>
          <button 
            onClick={() => setAbaAtiva('avisos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'avisos' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📢 Mural de Avisos ({avisos.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('mercado')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'mercado' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🛍️ Loja & Lanches (Beta)
          </button>
          <button 
            onClick={() => setAbaAtiva('financeiro')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'financeiro' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {alunoLogado?.is_bolsista ? '🎓 Bolsa & Acesso' : isDiariaOuConvenio(alunoLogado?.plano) ? '🎫 Status do Acesso (Diária/Convênio)' : '💳 Mensalidade'}
          </button>
          <button 
            onClick={() => setAbaAtiva('torneios')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'torneios' ? 'bg-red-600 text-white shadow-md shadow-red-900/30' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🏆 Torneios do CT
          </button>
          <button 
            onClick={() => setAbaAtiva('ranking')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'ranking' ? 'bg-red-600 text-white shadow-md shadow-red-900/30' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🥋 Ranking do CT
          </button>
          <button 
            onClick={() => setAbaAtiva('desempenho')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'desempenho' ? 'bg-red-600 text-white shadow-md shadow-red-900/30' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📊 Desempenho & Analytics
          </button>
        </div>

        {/* BARRA DE ATALHOS RÁPIDOS NO MOBILE (ACESSO DIRETO AO CALENDÁRIO E CONQUISTAS) */}
        <div className="flex sm:hidden items-center gap-2 overflow-x-auto boru-scrollbar pb-1">
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('frequencia');
              setTimeout(() => {
                document.getElementById('calendario-mensal-aluno')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0 ${
              abaAtiva === 'frequencia'
                ? 'bg-red-600 text-white shadow-red-900/40'
                : 'bg-[#141416] text-red-400 hover:text-white border border-red-500/30'
            }`}
          >
            <span>📅</span>
            <span>Meu Calendário</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('conquistas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0 ${
              abaAtiva === 'conquistas'
                ? 'bg-amber-500 text-black shadow-amber-500/40'
                : 'bg-[#141416] text-amber-400 hover:text-white border border-amber-500/30'
            }`}
          >
            <span>🏆</span>
            <span>Minhas Conquistas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('treinos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0 ${
              abaAtiva === 'treinos'
                ? 'bg-red-600 text-white'
                : 'bg-[#141416] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🥊</span>
            <span>Check-in & Treinos</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('contratos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm shrink-0 ${
              abaAtiva === 'contratos'
                ? 'bg-red-600 text-white'
                : 'bg-[#141416] text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>📄</span>
            <span>Contrato</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA: TREINOS & CHECK-IN (ESTÍMULO / GAMIFICAÇÃO) */}
        {abaAtiva === 'treinos' && (
          <div className="space-y-6">

            {/* MÓDULO 3: BOTÃO EM DESTAQUE DE CHECK-IN DE HOJE (LOGADO) */}
            <LoggedQuickCheckinBanner
              aluno={alunoLogado}
              onCheckinSuccess={() => {
                if (alunoLogado?.id) {
                  carregarAulas(alunoLogado.id);
                  carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
                  carregarGamificacao(alunoLogado.id);
                }
              }}
            />

            {/* CARDS DE GRADUAÇÃO & PLANO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card Prajied */}
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className={`w-14 h-14 rounded-full flex justify-center items-center shadow-lg border-2 border-zinc-700 text-white font-black text-xl ${
                  alunoLogado?.prajied === 'Branco' ? 'bg-white text-zinc-900' :
                  alunoLogado?.prajied === 'Branco e Vermelho' ? 'bg-gradient-to-r from-white to-red-500' :
                  alunoLogado?.prajied === 'Vermelho' ? 'bg-red-500' :
                  alunoLogado?.prajied === 'Vermelho e Azul' ? 'bg-gradient-to-r from-red-500 to-blue-500' :
                  alunoLogado?.prajied === 'Azul Claro' ? 'bg-blue-400' :
                  alunoLogado?.prajied === 'Azul Escuro' ? 'bg-blue-800' :
                  alunoLogado?.prajied === 'Preto' ? 'bg-black border-red-500' : 'bg-red-600'
                }`}>
                  🥋
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sua Graduação</span>
                  <h3 className="text-lg font-black text-white">{alunoLogado?.prajied || 'Branco'}</h3>
                  <p className="text-[11px] text-zinc-500">Reconhecida pelo Mestre Felipe Borü</p>
                </div>
              </div>

              {/* Card Plano & Status */}
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    {alunoLogado?.is_bolsista ? 'Modalidade Bolsista' : isDiariaOuConvenio(alunoLogado?.plano) ? 'Tipo de Acesso' : 'Plano Atual'}
                  </span>
                  <h3 className="text-lg font-black text-red-500">
                    {alunoLogado?.is_bolsista ? 'Bolsista Integral' : (alunoLogado?.plano || '2x na semana')}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {alunoLogado?.is_bolsista
                      ? 'Isento de faturas mensais • Acesso garantido'
                      : isDiariaOuConvenio(alunoLogado?.plano)
                      ? (alunoLogado?.plano?.toLowerCase().includes('wellhub') || alunoLogado?.plano?.toLowerCase().includes('gympass')
                          ? 'Validação de check-in via app parceiro'
                          : alunoLogado?.plano?.toLowerCase().includes('totalpass')
                          ? 'Validação de check-in via app TotalPass'
                          : 'R$ 40,00 por treino presencial')
                      : 'Pagamento presencial na recepção'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  {alunoLogado?.is_bolsista ? '🎓 Bolsista Ativo' : isDiariaOuConvenio(alunoLogado?.plano) ? '⚡ Acesso Liberado' : 'Matrícula Ativa'}
                </span>
              </div>
            </div>

            {/* MÓDULO 1: QUADRO DE PROFESSORES, PRAJIED E HORÁRIOS DE AULA */}
            {professoresHorarios.length > 0 && (
              <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    🥋 Corpo Docente & Horários de Aula
                  </h3>
                  <span className="text-[11px] text-zinc-500">Borü Centro de Combate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professoresHorarios.map((prof: any) => (
                    <div key={prof.id} className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3.5 flex items-center gap-3">
                      <img
                        src={prof.fotoPerfilUrl || '/logo-boru.jpg'}
                        alt={prof.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-red-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white truncate">{prof.nome}</h4>
                          <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                            {prof.prajied_faixa || 'Kruang Preto'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          🕒 Horários: <strong className="text-zinc-200">{Array.isArray(prof.horarios_aula) ? prof.horarios_aula.join(' • ') : prof.horarios_aula}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GAMIFICAÇÃO & ESTÍMULO AO CHECK-IN */}
            {gamificacao && (
              <div className="bg-gradient-to-br from-[#141416] via-[#1A1A1E] to-[#141416] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl animate-pulse">🔥</span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        Fogo do Guerreiro: <span className="text-amber-400">{gamificacao.streak} treinos seguidos!</span>
                      </h3>
                      <p className="text-xs text-zinc-400">Não quebre sua sequência. Cada treino conta para sua graduação.</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-zinc-400">Meta do Mês: </span>
                    <strong className="text-white text-sm">{gamificacao.presencasNoMes} de {gamificacao.metaMes} treinos</strong>
                  </div>
                </div>

                {/* Barra de progresso da meta mensal */}
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 font-bold mb-1">
                    <span>Progresso Mensal</span>
                    <span className="text-amber-400 font-black">{gamificacao.progressoMeta}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${gamificacao.progressoMeta}%` }}
                    ></div>
                  </div>
                </div>

                {/* Medalhas / Badges conquistadas */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Suas Conquistas Marciais:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {gamificacao.medalhas.map((m: any) => (
                      <div 
                        key={m.id} 
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                          m.desbloqueada 
                            ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-600 opacity-50'
                        }`}
                      >
                        <span className="text-xl">{m.icone}</span>
                        <div>
                          <p className="text-xs font-black leading-tight">{m.titulo}</p>
                          <p className="text-[9px] text-zinc-400 leading-none mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Atalho para a nova aba completa Trilha do Nak Muay */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-zinc-300">
                    <span className="font-black text-amber-400">
                      🥊 Rank Atual: {gamificacao.rankAtual?.name || 'Iniciante do Tatame'}
                    </span>
                    <span className="text-zinc-400 ml-2">
                      • {gamificacao.resumoConquistas?.desbloqueadas ?? 0}/{gamificacao.resumoConquistas?.total ?? 30} Conquistas Desbloqueadas • ⚡ {gamificacao.xpTotal ?? 0} XP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('conquistas')}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-black transition shrink-0"
                  >
                    🏆 Ver Trilha do Nak Muay (30 Conquistas) →
                  </button>
                </div>
              </div>
            )}

            {/* GRADE DE AULAS PARA CHECK-IN */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🥊 Próximos Treinos Disponíveis
                </h3>
                <span className="text-xs text-zinc-400">Faça check-in antes de entrar no tatame!</span>
              </div>

              {aulas.length === 0 ? (
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                  Nenhum treino agendado para os próximos dias.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aulas.map(aula => (
                    <div key={aula.id} className="bg-[#141416] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                            {aula.tipo}
                          </span>
                          <span className="text-base font-black text-white">{aula.horario}</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-200">{aula.titulo}</h4>
                        <p className="text-xs text-zinc-400 mt-1">Dia: <strong className="text-zinc-200">{aula.diaDaSemana}</strong></p>
                        <p className="text-[11px] text-zinc-500">Instrutor: Felipe Borü</p>
                      </div>

                      <div className="space-y-2">
                        {aula.checkinFeito ? (
                          aula.checkinStatus === 'PRESENTE' ? (
                            <div className="w-full py-2 rounded-lg bg-green-500/20 text-green-400 font-bold text-xs text-center border border-green-500/30">
                              ✓ Presença Confirmada!
                            </div>
                          ) : aula.checkinStatus === 'DOENCA' ? (
                            <div className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs text-center border border-blue-500/30">
                              🩺 Ausência por Doença
                            </div>
                          ) : (
                            <div className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs text-center border border-amber-500/30">
                              ⏳ Check-in Feito (Aguardando Professor)
                            </div>
                          )
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => fazerCheckin(aula.id)}
                              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition transform active:scale-95 shadow-md shadow-red-900/30 uppercase tracking-wider"
                            >
                              Fazer Check-in
                            </button>
                            <button 
                              onClick={() => { setAulaParaJustificar(aula); setShowModalJustificar(true); }}
                              className="px-2.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                              title="Informar ausência por doença ou imprevisto"
                            >
                              🩺
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* CONTEÚDO DA ABA: MINHAS CONQUISTAS (TRILHA DO NAK MUAY) */}
        {abaAtiva === 'conquistas' && (
          <StudentGamificationTab
            alunoId={alunoLogado?.id}
            alunoNome={alunoLogado?.nome || 'Guerreiro(a)'}
            gamificacaoData={gamificacao}
            onRefresh={() => alunoLogado?.id && carregarGamificacao(alunoLogado.id)}
            isCombatHub={false}
          />
        )}

        {/* MÓDULO 2: CONTEÚDO DA ABA MEUS CONTRATOS */}
        {abaAtiva === 'contratos' && (
          <MyContractsTab aluno={alunoLogado} />
        )}

        {/* CONTEÚDO DA ABA: MINHA FREQUÊNCIA & CALENDÁRIO */}
        {abaAtiva === 'frequencia' && (
          <div className="space-y-6">
            {dadosFrequencia && (
              <>
                {/* BOTÃO DE SALTO RÁPIDO PARA O CALENDÁRIO NO MOBILE */}
                <div className="flex sm:hidden justify-between items-center bg-[#141416] p-3 rounded-xl border border-zinc-800 shadow-md">
                  <div>
                    <span className="text-xs text-zinc-200 font-bold block">Frequência Mensal</span>
                    <span className="text-[10px] text-zinc-400">Pule as estatísticas direto para os dias:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('calendario-mensal-aluno')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-1 shadow-md shadow-red-900/40"
                  >
                    <span>📅 Ver Calendário ↓</span>
                  </button>
                </div>
                {/* DESTAQUE DE FREQUÊNCIA SEMANAL PARA ALUNOS DE DIÁRIA OU CONVÊNIO */}
                {isDiariaOuConvenio(alunoLogado?.plano) ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-red-950/40 via-[#141416] to-[#1A1A1E] border border-red-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">⚡</span>
                            <h3 className="text-lg font-black text-white">Frequência Individual da Semana</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {alunoLogado?.plano}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 mt-1">
                            Seu acesso é individual por aula/diária. Acompanhe a quantidade e os dias que você compareceu nesta semana:
                          </p>
                        </div>
                        <div className="bg-black/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-center sm:text-right min-w-[140px]">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Treinos Esta Semana</span>
                          <span className="text-3xl font-black text-amber-400">
                            {dadosFrequencia.estatisticas?.frequenciaSemanal?.totalNaSemana || 0}
                          </span>
                          <span className="text-xs text-zinc-400 ml-1">treino(s)</span>
                        </div>
                      </div>

                      {/* Dias frequentados na semana */}
                      <div className="pt-3 border-t border-zinc-800">
                        <span className="text-xs font-bold text-zinc-300 block mb-2">
                          Dias Frequentados Nesta Semana (Segunda a Domingo):
                        </span>
                        {dadosFrequencia.estatisticas?.frequenciaSemanal?.diasFrequentados && dadosFrequencia.estatisticas.frequenciaSemanal.diasFrequentados.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {dadosFrequencia.estatisticas.frequenciaSemanal.diasFrequentados.map((d: any, idx: number) => (
                              <span key={idx} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                <span>✓</span>
                                <span>{d.diaSemana}</span>
                                <span className="text-zinc-400 text-[11px]">({d.dataFormatada})</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">
                            Nenhum treino realizado ainda nesta semana. Garanta sua vaga agendando seu treino na aba "Treinos"!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CARDS RESUMO DO ALUNO DE DIÁRIA */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-amber-400 mb-0.5">⚡ Treinos Esta Semana</p>
                        <p className="text-2xl font-black text-white">{dadosFrequencia.estatisticas?.frequenciaSemanal?.totalNaSemana || 0}</p>
                        <span className="text-[10px] text-zinc-500">Semana atual</span>
                      </div>

                      <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-green-400 mb-0.5">🟢 Treinos no Mês</p>
                        <p className="text-2xl font-black text-green-400">{dadosFrequencia.estatisticas.presentes}</p>
                        <span className="text-[10px] text-zinc-500">Presenças confirmadas</span>
                      </div>

                      <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">🔵 Ausências Informadas</p>
                        <p className="text-2xl font-black text-blue-400">{dadosFrequencia.estatisticas.doenca}</p>
                        <span className="text-[10px] text-zinc-500">Com atestado / aviso</span>
                      </div>

                      <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] uppercase font-bold text-red-400 mb-0.5">🥋 Graduação Prajied</p>
                        <p className="text-xl font-black text-white truncate">{alunoLogado?.prajied || 'Branco'}</p>
                        <span className="text-[10px] text-zinc-500">Nível reconhecido</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 4 CARDS COM AS PORCENTAGENS ESPECÍFICAS REQUISITADAS PARA MENSALISTAS */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-green-400 mb-0.5">🟢 Presença Real</p>
                      <p className="text-2xl font-black text-white">{dadosFrequencia.estatisticas.porcentagemPresenca}%</p>
                      <span className="text-[10px] text-zinc-500">{dadosFrequencia.estatisticas.presentes} de {dadosFrequencia.estatisticas.aulasEsperadasNoMes} aulas</span>
                    </div>

                    <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">🔵 Ausência Doença</p>
                      <p className="text-2xl font-black text-blue-400">{dadosFrequencia.estatisticas.porcentagemDoenca}%</p>
                      <span className="text-[10px] text-zinc-500">{dadosFrequencia.estatisticas.doenca} aula(s) c/ atestado</span>
                    </div>

                    <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-red-400 mb-0.5">🔴 Falta Comum</p>
                      <p className="text-2xl font-black text-red-500">{dadosFrequencia.estatisticas.porcentagemFalta}%</p>
                      <span className="text-[10px] text-zinc-500">{dadosFrequencia.estatisticas.faltasNaoJustificadas} sem justificativa</span>
                    </div>

                    <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-amber-400 mb-0.5">⭐ Presença Efetiva</p>
                      <p className="text-2xl font-black text-amber-400">{dadosFrequencia.estatisticas.porcentagemGeral}%</p>
                      <span className="text-[10px] text-zinc-500">Base para Prajied</span>
                    </div>
                  </div>
                )}

                {/* CALENDÁRIO */}
                <div id="calendario-mensal-aluno" className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-24">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      📅 Frequência Mensal ({mesAtual}/{anoAtual})
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const novo = mesAtual === 1 ? 12 : mesAtual - 1;
                          setMesAtual(novo);
                          carregarFrequencia(alunoLogado.id, novo, anoAtual);
                        }} 
                        className="px-2.5 py-1 bg-[#1A1A1E] border border-zinc-700 text-xs font-bold rounded"
                      >
                        ← Mês Anterior
                      </button>
                      <button 
                        onClick={() => {
                          const novo = mesAtual === 12 ? 1 : mesAtual + 1;
                          setMesAtual(novo);
                          carregarFrequencia(alunoLogado.id, novo, anoAtual);
                        }} 
                        className="px-2.5 py-1 bg-[#1A1A1E] border border-zinc-700 text-xs font-bold rounded"
                      >
                        Próximo →
                      </button>
                    </div>
                  </div>

                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-zinc-500">
                    <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: new Date(anoAtual, mesAtual - 1, 1).getDay() }).map((_, i) => (
                      <div key={`emp-${i}`} className="h-16 rounded bg-zinc-900/20"></div>
                    ))}
                    {Array.from({ length: new Date(anoAtual, mesAtual, 0).getDate() }).map((_, i) => {
                      const dia = i + 1;
                      const dataIso = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                      const pres = dadosFrequencia.presencasPorDia?.[dataIso]?.[0];
                      const ehHoje = new Date().toISOString().split('T')[0] === dataIso;

                      return (
                        <div 
                          key={`d-${dia}`}
                          className={`h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between ${
                            pres?.status === 'PRESENTE' ? 'bg-green-500/15 border-green-500/40 text-white' :
                            pres?.status === 'DOENCA' ? 'bg-blue-500/15 border-blue-500/40 text-white' :
                            pres?.status === 'FALTA' ? 'bg-red-500/15 border-red-500/40 text-white' :
                            pres?.status === 'AGENDADO' ? 'bg-amber-500/15 border-amber-500/40 text-white' :
                            ehHoje ? 'bg-[#1A1A1E] border-red-500 text-white' :
                            'bg-[#1A1A1E] border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">{dia}</span>
                            {ehHoje && <span className="text-[8px] bg-red-600 px-1 rounded text-white font-bold">HOJE</span>}
                          </div>
                          <span className="text-[9px] font-bold truncate">
                            {pres?.status === 'PRESENTE' ? '✓ Presente' :
                             pres?.status === 'DOENCA' ? '🩺 Doença' :
                             pres?.status === 'FALTA' ? '✗ Falta' :
                             pres?.status === 'AGENDADO' ? '⏳ Agendado' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Presença Confirmada</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Ausência por Doença (Atestado)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Falta Não Justificada</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Check-in Pendente</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA: MURAL DE AVISOS */}
        {abaAtiva === 'avisos' && (
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-xl font-bold text-white">📢 Mural de Avisos do CT</h2>
              <p className="text-xs text-zinc-400">Fique atento aos recados oficiais do Professor Felipe Borü e da administração.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {avisos.map(aviso => (
                <NoticeCard key={aviso.id} aviso={aviso} variant="student" />
              ))}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: LOJA & MERCADO BORÜ (BETA) */}
        {abaAtiva === 'mercado' && (
          <div className="space-y-4">
            
            {/* Banner Beta Exclusivo Solicitado */}
            <div className="bg-gradient-to-r from-red-950/40 via-[#1A1A1E] to-zinc-900 border border-red-500/30 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <h3 className="text-base font-black text-white">Mercado Borü - Versão BETA</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Em breve compras pelo app!
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Todos os equipamentos oficiais (Luvas, Protetores, Bandagens) e alimentos/suplementos para o treino estão disponíveis para retirada e compra <strong>presencial no balcão da recepção</strong> com o mestre!
              </p>
            </div>

            {/* Abas de Categorias Solicitadas */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['TODOS', 'PROTETOR_BUCAL', 'LUVAS', 'CANELEIRAS', 'BANDAGENS', 'ALIMENTOS'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    filtroCategoria === cat ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat === 'TODOS' ? 'Todos os Produtos' :
                   cat === 'PROTETOR_BUCAL' ? 'Protetor Bucal' :
                   cat === 'LUVAS' ? 'Luvas' :
                   cat === 'CANELEIRAS' ? 'Caneleiras' :
                   cat === 'BANDAGENS' ? 'Bandagens' : 'Alimentos & Bebidas'}
                </button>
              ))}
            </div>

            {/* Grid da Vitrine */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtos
                .filter(p => filtroCategoria === 'TODOS' || p.categoria === filtroCategoria)
                .map(prod => (
                  <div key={prod.id} className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition">
                    <div className="h-44 bg-zinc-900 relative overflow-hidden">
                      <img 
                        src={prod.imagemUrl || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=500&q=80'} 
                        alt={prod.nome} 
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-emerald-400 border border-emerald-500/30">
                        Disponível na Recepção
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-red-500">
                          {prod.categoria.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{prod.nome}</h4>
                        {prod.descricao && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{prod.descricao}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-base font-black text-white">
                          R$ {prod.preco.toFixed(2).replace('.', ',')}
                        </span>
                        <a 
                          href={`https://wa.me/556992384491?text=${encodeURIComponent(`Olá Professor Felipe, gostaria de reservar o item "${prod.nome}" na recepção!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition flex items-center gap-1"
                        >
                          Reservar no Balcão
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: MENSALIDADE OU STATUS DE ACESSO (BOLSISTA / DIÁRIA / CONVÊNIO) */}
        {abaAtiva === 'financeiro' && (
          alunoLogado?.is_bolsista ? (
            <div className="bg-[#141416] border border-purple-500/40 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <span className="text-3xl">🎓</span>
                <div>
                  <h2 className="text-xl font-black text-white">Benefício de Aluno Bolsista</h2>
                  <p className="text-xs text-zinc-400">Regra de Isenção Ativa — Você não gera faturas mensais automáticas.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A1A1E] border border-purple-500/30 rounded-xl p-5">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Status do Portal</span>
                  <p className="text-2xl font-black text-emerald-400 mt-2">SEMPRE LIBERADO</p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Como aluno bolsista do Borü Centro de Combate, seu acesso nunca é bloqueado por inadimplência.
                  </p>
                </div>
                <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Valor Mensal</span>
                  <p className="text-2xl font-black text-purple-300 mt-2">ISENTO (R$ 0,00)</p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Mantenha sua frequência exemplar e dedicação máxima nos treinos! Oss!
                  </p>
                </div>
              </div>
            </div>
          ) : isDiariaOuConvenio(alunoLogado?.plano) ? (
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
              <div className="border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎫</span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Status de Acesso / Diária & Convênio</h2>
                    <p className="text-xs text-zinc-400">Modalidade com cobrança individual por treino (sem renovação ou fatura mensal fixa).</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Situação do Seu Acesso</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      ACESSO LIBERADO
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    Seu cadastro está ativo. Você tem acesso liberado para reservar horários e treinar normalmente.
                  </p>
                </div>

                <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Tipo de Ingresso / Passe</span>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-2">
                    {alunoLogado?.plano?.toLowerCase().includes('wellhub') ? 'Wellhub (Gympass)' :
                     alunoLogado?.plano?.toLowerCase().includes('totalpass') ? 'TotalPass' :
                     alunoLogado?.plano?.toLowerCase().includes('gympass') ? 'Gympass' :
                     'R$ 40,00'}
                    {!alunoLogado?.plano?.toLowerCase().includes('wellhub') && 
                     !alunoLogado?.plano?.toLowerCase().includes('totalpass') && 
                     !alunoLogado?.plano?.toLowerCase().includes('gympass') && (
                      <span className="text-xs font-normal text-zinc-400 ml-1.5">/treino</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    {alunoLogado?.plano?.toLowerCase().includes('wellhub') || alunoLogado?.plano?.toLowerCase().includes('gympass')
                      ? 'Validação de check-in diário através do app parceiro na recepção.'
                      : alunoLogado?.plano?.toLowerCase().includes('totalpass')
                      ? 'Validação de check-in diário através do app TotalPass na recepção.'
                      : 'Pagamento avulso acertado diretamente na recepção a cada treino realizado.'}
                  </p>
                </div>
              </div>

              {/* Frequência da semana no painel financeiro */}
              <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Frequência da Semana Atual</span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      {dadosFrequencia?.estatisticas?.frequenciaSemanal?.totalNaSemana || 0} treino(s) nesta semana
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300">
                    Sem cobrança mensal recorrente
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Dias frequentados: <strong className="text-zinc-200">{dadosFrequencia?.estatisticas?.frequenciaSemanal?.diasFormatadosTexto || 'Nenhum treino registrado nesta semana'}</strong>
                </p>
              </div>

              {/* Como funciona o acesso */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-red-950/30 via-[#1A1A1E] to-zinc-900 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥋</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Como Funciona Seu Acesso</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Por ser um formato de diária/passe corporativo, não há cobrança por mês ou vencimento fixo. Cada treino é computado de forma individual:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-zinc-300">
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                    <strong className="text-white block mb-1">1. Agendamento</strong>
                    Reserve sua vaga no tatame com antecedência na aba <em>Treinos</em>.
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                    <strong className="text-white block mb-1">2. Na Recepção</strong>
                    Faça o check-in no aplicativo parceiro ou acerte o valor avulso no balcão.
                  </div>
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                    <strong className="text-white block mb-1">3. Graduação</strong>
                    Todas as presenças registradas somam na sua evolução marcial (Prajied)!
                  </div>
                </div>
                <div className="pt-2">
                  <a 
                    href={`https://wa.me/556992384491?text=${encodeURIComponent(`Olá Professor Felipe, gostaria de tirar uma dúvida sobre meu acesso por diária / passe no CT BORÜ!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30"
                  >
                    <span>📲 Falar com a Recepção no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white">Status da Mensalidade</h2>
                  <p className="text-xs text-zinc-400">Acompanhe sua vigência e datas de renovação.</p>
                </div>
                {alunoLogado?.data_de_adesao && (
                  <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-bold">
                    📅 Dia Fixo de Vencimento: Todo dia {new Date(alunoLogado.data_de_adesao).getDate()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Situação Atual</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${
                      dias !== null && dias >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {dias !== null && dias >= 0 ? 'EM DIA' : 'PENDENTE'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {dias === null ? 'Nenhum registro encontrado.' :
                     dias < 0 ? `Vencimento expirado há ${Math.abs(dias)} dias.` :
                     `Restam ${dias} dias para a próxima renovação.`}
                  </p>
                </div>

                <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Valor do Seu Plano</span>
                  <p className="text-3xl font-black text-white mt-2">
                    {alunoLogado?.plano === 'Todos os Horários' ? 'R$ 280,00' :
                     alunoLogado?.plano === '3x na semana' ? 'R$ 160,00' :
                     alunoLogado?.plano === 'Diária' ? 'R$ 40,00' : 'R$ 130,00'}
                    <span className="text-xs font-normal text-zinc-500 ml-1">/mês</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">Plano: {alunoLogado?.plano || '2x na semana'}</p>
                </div>
              </div>

              {/* AVISO EXCLUSIVO DE PAGAMENTO PRESENCIAL CONFORME SOLICITADO */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-red-950/30 via-[#1A1A1E] to-zinc-900 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥋</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Pagamento Presencial na Recepção</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  As mensalidades são acertadas diretamente no balcão de atendimento da academia com o Professor Felipe ou com a nossa recepção antes do início do seu treino.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-zinc-400">
                  <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">✓ PIX Presencial no Balcão</span>
                  <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">✓ Cartão de Débito/Crédito na Maquininha</span>
                  <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">✓ Dinheiro em Espécie</span>
                </div>
                <div className="pt-2">
                  <a 
                    href={`https://wa.me/556992384491?text=${encodeURIComponent(`Olá Professor Felipe, gostaria de tirar uma dúvida sobre a minha mensalidade do CT BORÜ!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30"
                  >
                    <span>📲 Falar com a Recepção no WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>
          )
        )}

        {/* CONTEÚDO DA ABA: TORNEIOS & BRACKETS DO CT */}
        {abaAtiva === 'torneios' && (
          <StudentTournamentsTab aluno={alunoLogado} />
        )}

        {/* CONTEÚDO DA ABA: RANKING INTERNO DO CT BORÜ */}
        {abaAtiva === 'ranking' && (
          <StudentCTRanking aluno={alunoLogado} />
        )}

        {/* CONTEÚDO DA ABA: DESEMPENHO & ANALYTICS */}
        {abaAtiva === 'desempenho' && (
          <StudentPerformanceStatsTab aluno={alunoLogado} />
        )}

      </div>

      {/* MODAL JUSTIFICAR AUSÊNCIA / INFORMAR DOENÇA */}
      {showModalJustificar && aulaParaJustificar && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Informar Ausência</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Aula: {aulaParaJustificar.diaDaSemana} às {aulaParaJustificar.horario}. O aviso prévio ajuda o mestre a ajustar o treino e não prejudica sua graduação!
            </p>

            <form onSubmit={handleSalvarJustificativa} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Motivo da Ausência</label>
                <select 
                  value={motivoJustificativa} 
                  onChange={(e) => setMotivoJustificativa(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="DOENCA">🔵 Doença / Atestado Médico</option>
                  <option value="TRABALHO">💼 Motivo Profissional / Trabalho</option>
                  <option value="PESSOAL">🏠 Imprevisto Pessoal / Familiar</option>
                  <option value="OUTRO">ℹ️ Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Detalhes (Opcional)</label>
                <textarea 
                  rows={3} 
                  value={detalheJustificativa} 
                  onChange={(e) => setDetalheJustificativa(e.target.value)}
                  placeholder="Ex: Sintomas gripais, consulta médica..."
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModalJustificar(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Enviar Aviso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FIXA PARA CELULAR (BOTTOM NAVIGATION BAR MOBILE) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#141416]/95 backdrop-blur-md border-t border-zinc-800 px-2 py-2 flex items-center gap-2 overflow-x-auto boru-scrollbar z-[9999]">
        <button 
          onClick={() => setAbaAtiva('treinos')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'treinos' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">🥊</span>
          <span>Treinos</span>
        </button>

        <button 
          onClick={() => {
            setAbaAtiva('frequencia');
            setTimeout(() => {
              document.getElementById('calendario-mensal-aluno')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'frequencia' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">📅</span>
          <span>Presença</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('conquistas')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'conquistas' ? 'text-amber-400' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">🏆</span>
          <span>Conquistas</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('contratos')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'contratos' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">📄</span>
          <span>Contrato</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('avisos')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'avisos' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">📢</span>
          <span>Mural</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('mercado')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'mercado' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">🛍️</span>
          <span>Loja</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('financeiro')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'financeiro' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">{alunoLogado?.is_bolsista ? '🎓' : isDiariaOuConvenio(alunoLogado?.plano) ? '🎫' : '💳'}</span>
          <span>{alunoLogado?.is_bolsista ? 'Bolsa' : isDiariaOuConvenio(alunoLogado?.plano) ? 'Acesso' : 'Plano'}</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('torneios')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'torneios' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">🏆</span>
          <span>Torneios</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('ranking')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'ranking' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">🥋</span>
          <span>Ranking CT</span>
        </button>

        <button 
          onClick={() => setAbaAtiva('desempenho')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
            abaAtiva === 'desempenho' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span className="text-base">📊</span>
          <span>Analytics</span>
        </button>
      </nav>

    </div>
  );
}

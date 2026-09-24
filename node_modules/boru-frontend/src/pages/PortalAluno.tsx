import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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

  // TELA DO PORTAL (LOGADO) - Aba ativa e Chatbot
  const [abaAtiva, setAbaAtiva] = useState('aulas');
  
  // Estado do Chatbot IA
  const [chatMessages, setChatMessages] = useState([{ sender: 'bot', text: 'Sawasdee Krap! Sou o Tutor IA do CT BORÜ. Como posso ajudar no seu treino hoje?' }]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages([...chatMessages, { sender: 'user', text: userMessage }]);
    setChatInput('');
    
    // Adiciona uma mensagem de "pensando..." temporária
    setChatMessages(prev => [...prev, { sender: 'bot', text: 'Pensando...', isTyping: true }]);
    
    try {
      const response = await axios.post(`${API_URL}/chat`, { mensagem: userMessage });
      setChatMessages(prev => {
        const historico = [...prev];
        historico.pop(); // Remove o "Pensando..."
        return [...historico, { sender: 'bot', text: response.data.text }];
      });
    } catch (error) {
      setChatMessages(prev => {
        const historico = [...prev];
        historico.pop();
        return [...historico, { sender: 'bot', text: 'Desculpe, meu servidor AI está fora do ar no momento.' }];
      });
    }
  };

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
      const response = await axios.post(`${API_URL}/alunos/login`, { cpf, senha });
      setAlunoLogado(response.data);
      setErroCpf('');
      setIsLoggedIn(true);
      if (!response.data.primeiroAcesso) {
        carregarAulas();
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setErroCpf('CPF não encontrado no sistema. Por favor, fale com o administrador.');
      } else if (error.response && error.response.status === 401) {
        setErroCpf(error.response.data.erro);
      } else {
        setErroCpf('Erro de conexão com o servidor.');
      }
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
      await axios.post(`${API_URL}/alunos/alterar-senha`, { 
        id: alunoLogado.id, 
        novaSenha 
      });
      setAlunoLogado({ ...alunoLogado, primeiroAcesso: false });
      alert('Senha atualizada com sucesso! Bem-vindo(a) ao portal.');
      carregarAulas();
    } catch (error) {
      alert('Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const carregarAulas = async () => {
    try {
      const response = await axios.get(`${API_URL}/aulas`);
      // Adaptar para a UI (adicionando campo checkinFeito temporário para UI responsiva)
      const aulasFormatadas = response.data.map((aula: any) => {
        const d = new Date(aula.dataInicio);
        const horario = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}H`;
        const tipo = aula.titulo.includes('KIDS') ? 'KIDS' : 'ADULTOS';
        return {
          id: aula.id,
          horario,
          tipo,
          titulo: 'Muay Thai',
          checkinFeito: false
        };
      });
      setAulas(aulasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const formatarCpf = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  const fazerCheckin = async (id: string) => {
    try {
      await axios.post(`${API_URL}/checkin`, {
        alunoId: alunoLogado.id,
        eventoId: id
      });
      setAulas(aulas.map(aula => 
        aula.id === id ? { ...aula, checkinFeito: true } : aula
      ));
      alert('Check-in realizado com sucesso! Aguardando o professor confirmar a presença.');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('Você já fez check-in nesta aula.');
      } else {
        alert('Erro ao realizar check-in.');
      }
    }
  };

  // TELA DE LOGIN DO ALUNO
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-widest mb-1">BORÜ</h1>
            <p className="text-red-500 font-bold text-sm tracking-widest uppercase">Área do Aluno</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-2">Seu CPF</label>
              <input 
                type="text" 
                value={cpf}
                onChange={(e) => formatarCpf(e.target.value)}
                maxLength={14}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-2">Senha</label>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="Sua senha"
              />
              {erroCpf && <p className="text-red-500 text-xs mt-2 font-semibold">{erroCpf}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95">
              {loading ? 'Verificando...' : 'Acessar Portal'}
            </button>
          </form>
          <Link to="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition">
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  // TELA DE PRIMEIRO ACESSO (MUDAR SENHA)
  if (alunoLogado?.primeiroAcesso) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">Bem-vindo(a), {alunoLogado.nome.split(' ')[0]}!</h1>
            <p className="text-zinc-400 text-sm">Este é o seu primeiro acesso. Por favor, crie uma senha segura para sua conta.</p>
          </div>
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-2">Nova Senha</label>
              <input 
                type="password" 
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-2">Confirme a Nova Senha</label>
              <input 
                type="password" 
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="Repita a senha"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 mt-4">
              {loading ? 'Salvando...' : 'Salvar e Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TELA DO PORTAL (LOGADO)
  const renovarMensalidade = async (metodo: string = 'pix') => {
    setLoading(true);
    // Simular delay do Gateway
    await new Promise(r => setTimeout(r, 1500));
    try {
      await axios.post(`${API_URL}/pagamentos/processar`, {
        alunoId: alunoLogado.id,
        valor: 160, // mock genérico para renovação, idealmente puxa do plano
        metodoPagamento: metodo,
        cartaoToken: metodo === 'cartao' ? 'tok_mock123' : undefined
      });
      alert(`Pagamento via ${metodo.toUpperCase()} aprovado com sucesso! Mensalidade renovada.`);
      
      // Atualiza o estado local para refletir (mock simples)
      const novaMensalidade = { dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'PAGO' };
      setAlunoLogado({
        ...alunoLogado,
        mensalidades: [novaMensalidade, ...(alunoLogado.mensalidades || [])]
      });
    } catch (error) {
      alert('Erro ao processar pagamento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const calcularDiasVencimento = () => {
    if (!alunoLogado?.mensalidades || alunoLogado.mensalidades.length === 0) return null;
    const ultima = alunoLogado.mensalidades[0];
    const agora = new Date();
    const venc = new Date(ultima.dataVencimento);
    const diff = venc.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const dias = calcularDiasVencimento();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-6 z-[9999]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-wider text-white">
              ÁREA DO <span className="text-red-600">ALUNO</span>
            </h1>
            <p className="text-zinc-400 mt-1">Bem-vindo de volta, {alunoLogado?.nome}!</p>
          </div>
          <Link to="/" onClick={() => setIsLoggedIn(false)} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition text-center">
            Sair (Logout)
          </Link>
        </header>

        {/* TABS */}
        <div className="flex gap-4 border-b border-zinc-800 pb-4">
          <button 
            onClick={() => setAbaAtiva('aulas')} 
            className={`font-bold pb-2 transition ${abaAtiva === 'aulas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Meu Plano & Aulas
          </button>
          <button 
            onClick={() => setAbaAtiva('financeiro')} 
            className={`font-bold pb-2 transition ${abaAtiva === 'financeiro' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Financeiro (Pagamentos)
          </button>
          <button 
            onClick={() => setAbaAtiva('chatbot')} 
            className={`font-bold pb-2 transition flex items-center gap-2 ${abaAtiva === 'chatbot' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            Tutor Virtual (IA)
          </button>
        </div>

        {abaAtiva === 'aulas' ? (
          <>
            {/* MEU PLANO E GAMIFICAÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <section className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📋 Meu Plano
                </h2>
                <div className="flex flex-col gap-2">
                  <p className="text-zinc-400 text-sm">Plano Atual</p>
                  <p className="text-2xl font-bold text-red-500">{alunoLogado?.plano || 'Sem Plano Fixo'}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Ativo
                    </span>
                  </div>
                </div>
              </section>

              {/* PRAJIED / GRADUAÇÃO */}
              <section className="bg-[#141416] border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                  ⭐ Sua Graduação
                </h2>
                <div className="flex items-center gap-4 relative z-10">
                  {/* Círculo com a cor do Prajied */}
                  <div className={`w-14 h-14 rounded-full flex justify-center items-center shadow-lg border-2 border-[#1A1A1E] ${
                    alunoLogado?.prajied === 'Branco' ? 'bg-white text-zinc-900' :
                    alunoLogado?.prajied === 'Branco e Vermelho' ? 'bg-gradient-to-r from-white to-red-500' :
                    alunoLogado?.prajied === 'Vermelho' ? 'bg-red-500 text-white' :
                    alunoLogado?.prajied === 'Vermelho e Azul' ? 'bg-gradient-to-r from-red-500 to-blue-500 text-white' :
                    alunoLogado?.prajied === 'Azul Claro' ? 'bg-blue-400 text-white' :
                    alunoLogado?.prajied === 'Azul Escuro' ? 'bg-blue-800 text-white' :
                    alunoLogado?.prajied === 'Preto' ? 'bg-black border-2 border-zinc-500 text-white' :
                    'bg-white text-zinc-900'
                  }`}>
                    {/* Pode adicionar um iconezinho dentro se quiser */}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider">Prajied</span>
                    </div>
                    <p className="text-lg font-black text-white">{alunoLogado?.prajied || 'Branco'}</p>
                    <p className="text-[10px] text-zinc-500 mt-2">Apenas os professores podem atualizar sua graduação.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* AULAS E CHECK-IN */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🥊 Aulas Agendadas (Próximos 3 Dias)
              </h2>
              {aulas.length === 0 ? (
                <p className="text-zinc-500">Nenhuma aula encontrada para os próximos dias.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {aulas.map((aula) => (
                    <div key={aula.id} className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-zinc-500">{aula.tipo}</span>
                          <span className="text-lg font-black text-white">{aula.horario}</span>
                        </div>
                        <h3 className="text-base font-semibold text-zinc-300">{aula.titulo}</h3>
                        <p className="text-xs text-zinc-500 mt-1">Prof. Felipe Borü</p>
                      </div>
                      
                      <div className="mt-6">
                        {aula.checkinFeito ? (
                          <button disabled className="w-full py-2.5 rounded-lg bg-green-600/20 text-green-500 font-bold text-sm border border-green-600/30 cursor-not-allowed">
                            ✓ Check-in Confirmado
                          </button>
                        ) : (
                          <button 
                            onClick={() => fazerCheckin(aula.id)}
                            className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition transform active:scale-95"
                          >
                            Fazer Check-in
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : abaAtiva === 'financeiro' ? (
          <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Renovação e Pagamentos</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
                <div className="text-center md:text-left">
                  <p className="text-zinc-400 text-sm mb-1">Dias restantes para renovação</p>
                  {dias === null ? (
                    <p className="text-3xl font-black text-zinc-500">Nenhuma mensalidade</p>
                  ) : dias < 0 ? (
                    <p className="text-3xl font-black text-red-500">Atrasado há {Math.abs(dias)} dias</p>
                  ) : (
                    <p className="text-4xl font-black text-green-500">{dias} <span className="text-lg font-semibold text-zinc-500">dias</span></p>
                  )}
                  <p className="text-zinc-500 text-xs mt-2">Valor atual do seu plano: <strong className="text-zinc-300">R$ 160,00</strong></p>
                </div>
                
                <div className="w-full md:w-1/2 bg-[#1A1A1E] p-5 rounded-xl border border-zinc-800">
                  <h3 className="text-white font-bold mb-4">Escolha a forma de pagamento</h3>
                  
                  {/* --- INÍCIO DA INTEGRAÇÃO DO GATEWAY DE PAGAMENTO --- */}
                  <div className="space-y-4">
                    <button 
                      onClick={() => renovarMensalidade('cartao')}
                      disabled={loading || (dias !== null && dias > 5)} 
                      className={`w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${dias !== null && dias > 5 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      {loading ? 'Processando...' : 'Pagar com Cartão (Stripe/MercadoPago)'}
                    </button>

                    <button 
                      onClick={() => renovarMensalidade('pix')}
                      disabled={loading || (dias !== null && dias > 5)} 
                      className={`w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${dias !== null && dias > 5 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#00B1EA] hover:bg-[#0098C7] text-white shadow-lg'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                      {loading ? 'Gerando...' : 'Gerar PIX Copia e Cola'}
                    </button>
                    
                    <p className="text-[10px] text-zinc-500 text-center">
                      * Desenvolvedor: Insira os elementos do seu Gateway de Pagamento aqui. A rota de backend já está em <code>/api/pagamentos/processar</code>.
                    </p>
                  </div>
                  {/* --- FIM DA INTEGRAÇÃO DO GATEWAY --- */}

                </div>
              </div>
            </div>
          </section>
        ) : abaAtiva === 'chatbot' ? (
          <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
            <div className="bg-red-600 p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex justify-center items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              </div>
              <div>
                <h3 className="font-bold">Boru Tutor Virtual</h3>
                <p className="text-[10px] uppercase tracking-wider text-red-200">Inteligência Artificial de Treino</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0B0B0C]">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-[#1A1A1E] border border-zinc-800 text-zinc-300 rounded-bl-none shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#141416] border-t border-zinc-800 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pergunte sobre técnicas de Muay Thai..."
                className="flex-1 px-4 py-3 bg-[#1A1A1E] text-white border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-red-500 transition"
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
              />
              <button onClick={handleSendChat} className="px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
                Enviar
              </button>
            </div>
          </section>
        ) : null}

      </div>
    </div>
  );
}

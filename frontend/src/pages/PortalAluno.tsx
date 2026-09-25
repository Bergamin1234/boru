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

  // Controle de recuperação de senha
  const [showRecuperarSenha, setShowRecuperarSenha] = useState(false);
  const [contatoRecuperacao, setContatoRecuperacao] = useState('');

  // TELA DO PORTAL (LOGADO) - Aba ativa: 'aulas' | 'frequencia' | 'financeiro'
  const [abaAtiva, setAbaAtiva] = useState('aulas');
  
  // Dados de Frequência & Calendário do Aluno
  const [dadosFrequencia, setDadosFrequencia] = useState<any>(null);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

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
        carregarAulas(response.data.id);
        carregarFrequencia(response.data.id, mesAtual, anoAtual);
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

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contatoRecuperacao) {
      alert('Preencha seu E-mail, CPF ou Telefone.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/alunos/recuperar-senha`, {
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
      await axios.post(`${API_URL}/alunos/alterar-senha`, { 
        id: alunoLogado.id, 
        novaSenha 
      });
      setAlunoLogado({ ...alunoLogado, primeiroAcesso: false });
      alert('Senha atualizada com sucesso! Bem-vindo(a) ao portal.');
      carregarAulas(alunoLogado.id);
      carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
    } catch (error) {
      alert('Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const carregarAulas = async (idDoAluno?: string) => {
    const alunoId = idDoAluno || alunoLogado?.id;
    try {
      const response = await axios.get(`${API_URL}/aulas`, {
        params: alunoId ? { alunoId } : {}
      });

      const aulasFormatadas = response.data.map((aula: any) => {
        const d = new Date(aula.dataInicio);
        const horario = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}H`;
        const diaDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const tipo = aula.titulo.includes('KIDS') ? 'KIDS' : 'ADULTOS';

        return {
          id: aula.id,
          horario,
          diaDaSemana,
          tipo,
          titulo: 'Muay Thai Tradicional',
          checkinFeito: aula.checkinFeito,
          checkinStatus: aula.checkinStatus
        };
      });
      setAulas(aulasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const carregarFrequencia = async (idDoAluno: string, mes: number, ano: number) => {
    try {
      const res = await axios.get(`${API_URL}/admin/alunos/${idDoAluno}/calendario`, {
        params: { mes, ano }
      });
      setDadosFrequencia(res.data);
    } catch (error) {
      console.error('Erro ao carregar frequência:', error);
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
      
      // Atualiza lista de aulas
      setAulas(aulas.map(aula => 
        aula.id === id ? { ...aula, checkinFeito: true, checkinStatus: 'AGENDADO' } : aula
      ));

      if (alunoLogado?.id) {
        carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
      }

      alert('Check-in realizado com sucesso! Aguardando o professor confirmar sua presença.');
    } catch (error: any) {
      if (error.response?.data?.erro) {
        alert(error.response.data.erro);
      } else {
        alert('Erro ao realizar check-in.');
      }
    }
  };

  // TELA DE LOGIN DO ALUNO
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-widest mb-1">BORÜ</h1>
            <p className="text-red-500 font-bold text-sm tracking-widest uppercase">
              {showRecuperarSenha ? 'Recuperar Senha' : 'Área do Aluno'}
            </p>
          </div>
          
          {showRecuperarSenha ? (
            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm font-semibold mb-2">E-mail, CPF ou Telefone</label>
                <input 
                  type="text" 
                  value={contatoRecuperacao}
                  onChange={(e) => setContatoRecuperacao(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                  placeholder="Insira seu contato"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30">
                {loading ? 'Buscando...' : 'Recuperar Acesso'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowRecuperarSenha(false)} 
                className="w-full mt-2 text-zinc-500 hover:text-white text-sm transition font-semibold"
              >
                Voltar para Login
              </button>
            </form>
          ) : (
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-zinc-400 text-sm font-semibold">Senha</label>
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
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                  placeholder="Sua senha"
                />
                {erroCpf && <p className="text-red-500 text-xs mt-2 font-semibold">{erroCpf}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30">
                {loading ? 'Verificando...' : 'Acessar Portal'}
              </button>
            </form>
          )}

          <Link to="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition">
            ← Voltar ao site principal
          </Link>
        </div>
      </div>
    );
  }

  // TELA DE PRIMEIRO ACESSO (MUDAR SENHA)
  if (alunoLogado?.primeiroAcesso) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
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
    await new Promise(r => setTimeout(r, 1200));
    try {
      await axios.post(`${API_URL}/pagamentos/processar`, {
        alunoId: alunoLogado.id,
        valor: 160,
        metodoPagamento: metodo,
        cartaoToken: metodo === 'cartao' ? 'tok_mock123' : undefined
      });
      alert(`Pagamento via ${metodo.toUpperCase()} aprovado com sucesso! Mensalidade renovada.`);
      
      const novaMensalidade = { dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'PAGO' };
      setAlunoLogado({
        ...alunoLogado,
        mensalidades: [novaMensalidade, ...(alunoLogado.mensalidades || [])]
      });
      carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
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

  // Render do calendário mensal na Área do Aluno
  const renderCalendarioAluno = () => {
    const primeiroDiaSemana = new Date(anoAtual, mesAtual - 1, 1).getDay();
    const totalDiasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
    const diasArray = [];

    // Células vazias até o primeiro dia do mês
    for (let i = 0; i < primeiroDiaSemana; i++) {
      diasArray.push(null);
    }
    // Dias do mês
    for (let d = 1; d <= totalDiasNoMes; d++) {
      diasArray.push(d);
    }

    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const mudarMes = (delta: number) => {
      let novoMes = mesAtual + delta;
      let novoAno = anoAtual;
      if (novoMes > 12) {
        novoMes = 1;
        novoAno += 1;
      } else if (novoMes < 1) {
        novoMes = 12;
        novoAno -= 1;
      }
      setMesAtual(novoMes);
      setAnoAtual(novoAno);
      if (alunoLogado?.id) {
        carregarFrequencia(alunoLogado.id, novoMes, novoAno);
      }
    };

    return (
      <div className="space-y-6">
        {/* STATS DE FREQUÊNCIA */}
        {dadosFrequencia && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Presença no Mês</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${
                  dadosFrequencia.estatisticas.porcentagemPresenca >= 80 ? 'text-green-500' :
                  dadosFrequencia.estatisticas.porcentagemPresenca >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {dadosFrequencia.estatisticas.porcentagemPresenca}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dadosFrequencia.estatisticas.porcentagemPresenca >= 80 ? 'bg-green-500' :
                    dadosFrequencia.estatisticas.porcentagemPresenca >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${dadosFrequencia.estatisticas.porcentagemPresenca}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Aulas Feitas</p>
              <p className="text-3xl font-black text-white">
                {dadosFrequencia.estatisticas.presentes} 
                <span className="text-sm font-semibold text-zinc-500 ml-1">
                  / {dadosFrequencia.estatisticas.aulasEsperadasNoMes} previstas
                </span>
              </p>
              <p className="text-[11px] text-zinc-500 mt-2">Plano: {alunoLogado?.plano || '2x na semana'}</p>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Faltas Justificadas</p>
              <p className="text-3xl font-black text-blue-400">{dadosFrequencia.estatisticas.justificadas}</p>
              <p className="text-[11px] text-blue-400/80 mt-2">Abonadas na presença</p>
            </div>

            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Aguardando OK</p>
              <p className="text-3xl font-black text-amber-500">{dadosFrequencia.estatisticas.agendadasPendentes}</p>
              <p className="text-[11px] text-amber-400/80 mt-2">Check-in feito pelo app</p>
            </div>
          </div>
        )}

        {/* CALENDÁRIO */}
        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📅 {mesesNomes[mesAtual - 1]} de {anoAtual}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => mudarMes(-1)} 
                className="px-3 py-1.5 bg-[#1A1A1E] hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-white transition"
              >
                ← Mês Anterior
              </button>
              <button 
                onClick={() => mudarMes(1)} 
                className="px-3 py-1.5 bg-[#1A1A1E] hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-white transition"
              >
                Próximo Mês →
              </button>
            </div>
          </div>

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
            {diasArray.map((dia, idx) => {
              if (dia === null) {
                return <div key={`empty-${idx}`} className="h-20 rounded-lg bg-zinc-900/30"></div>;
              }

              const dataIso = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
              const presencasDoDia = dadosFrequencia?.presencasPorDia?.[dataIso] || [];
              const ehHoje = new Date().toISOString().split('T')[0] === dataIso;

              const temPresente = presencasDoDia.some((p: any) => p.status === 'PRESENTE');
              const temJustificada = presencasDoDia.some((p: any) => p.status === 'JUSTIFICADO');
              const temAgendado = presencasDoDia.some((p: any) => p.status === 'AGENDADO');
              const temAusente = presencasDoDia.some((p: any) => p.status === 'AUSENTE');

              return (
                <div 
                  key={`day-${dia}`} 
                  className={`min-h-[80px] p-2 rounded-xl border flex flex-col justify-between transition text-left ${
                    temPresente 
                      ? 'bg-green-500/10 border-green-500/40 text-white' 
                      : temJustificada 
                      ? 'bg-blue-500/10 border-blue-500/40 text-white'
                      : temAgendado 
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : temAusente 
                      ? 'bg-red-500/10 border-red-500/30 text-white'
                      : ehHoje 
                      ? 'bg-[#1A1A1E] border-red-500 text-white shadow-sm shadow-red-500/20' 
                      : 'bg-[#1A1A1E] border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-black ${ehHoje ? 'text-red-500' : 'text-zinc-200'}`}>{dia}</span>
                    {ehHoje && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">HOJE</span>}
                  </div>

                  <div className="space-y-1 mt-1">
                    {temPresente && (
                      <span className="block text-[10px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded truncate">
                        ✓ Presente
                      </span>
                    )}
                    {temJustificada && (
                      <span className="block text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded truncate" title="Falta Justificada pelo Professor">
                        ℹ️ Justificada
                      </span>
                    )}
                    {temAgendado && (
                      <span className="block text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded truncate">
                        ⏳ Aguardando OK
                      </span>
                    )}
                    {temAusente && (
                      <span className="block text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded truncate">
                        ✗ Ausente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Presença Confirmada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span>Falta Justificada (Atestado/Abonada)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span>Check-in Pendente (Aguardando Professor)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-4 sm:p-6 z-[9999]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-wider text-white">
              ÁREA DO <span className="text-red-600">ALUNO</span>
            </h1>
            <p className="text-zinc-400 mt-1">Sawasdee Krap, {alunoLogado?.nome}!</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a 
              href={`https://wa.me/556992384491?text=${encodeURIComponent(`Olá Professor Felipe, aqui é o aluno(a) ${alunoLogado?.nome}!`)}`}
              target="_blank"
              className="px-3.5 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Falar com o Professor / Administrador"
            >
              <span>📲 Falar com Professor (+55 69 9238-4491)</span>
            </a>
            <Link to="/" onClick={() => setIsLoggedIn(false)} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition text-center">
              Sair (Logout)
            </Link>
          </div>
        </header>

        {/* TABS (SEM CHATBOT COM IA) */}
        <div className="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto">
          <button 
            onClick={() => setAbaAtiva('aulas')} 
            className={`font-bold pb-2 transition whitespace-nowrap ${abaAtiva === 'aulas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            🥊 Treinos & Check-in
          </button>
          <button 
            onClick={() => setAbaAtiva('frequencia')} 
            className={`font-bold pb-2 transition flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'frequencia' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            📅 Minha Frequência & Calendário
          </button>
          <button 
            onClick={() => setAbaAtiva('financeiro')} 
            className={`font-bold pb-2 transition whitespace-nowrap ${abaAtiva === 'financeiro' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            💳 Mensalidade
          </button>
        </div>

        {abaAtiva === 'aulas' ? (
          <>
            {/* MEU PLANO E GRADUAÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <section className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📋 Meu Plano
                </h2>
                <div className="flex flex-col gap-2">
                  <p className="text-zinc-400 text-sm">Plano Atual</p>
                  <p className="text-2xl font-bold text-red-500">{alunoLogado?.plano || '2x na semana'}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Matrícula Ativa
                    </span>
                  </div>
                </div>
              </section>

              {/* PRAJIED / GRADUAÇÃO */}
              <section className="bg-[#141416] border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                  ⭐ Sua Graduação (Prajied)
                </h2>
                <div className="flex items-center gap-4 relative z-10">
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
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400 font-bold uppercase tracking-wider">Prajied Atual</span>
                    </div>
                    <p className="text-lg font-black text-white">{alunoLogado?.prajied || 'Branco'}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Graduações reconhecidas pelo Mestre Felipe Borü.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* AULAS E CHECK-IN */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🥊 Próximas Aulas de Muay Thai
                </h2>
                <button 
                  onClick={() => carregarAulas(alunoLogado.id)}
                  className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
                >
                  ↻ Atualizar
                </button>
              </div>

              {aulas.length === 0 ? (
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
                  Nenhuma aula encontrada para os próximos dias na grade.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {aulas.map((aula) => (
                    <div key={aula.id} className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-red-500 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 uppercase">
                            {aula.tipo}
                          </span>
                          <span className="text-lg font-black text-white">{aula.horario}</span>
                        </div>
                        <h3 className="text-base font-semibold text-zinc-200">{aula.titulo}</h3>
                        <p className="text-xs text-zinc-400 mt-1">Data: {aula.diaDaSemana}</p>
                        <p className="text-xs text-zinc-500">Professor: Felipe Borü</p>
                      </div>
                      
                      <div className="mt-6">
                        {aula.checkinFeito ? (
                          aula.checkinStatus === 'PRESENTE' ? (
                            <div className="w-full py-2.5 rounded-lg bg-green-500/20 text-green-400 font-bold text-xs border border-green-500/30 text-center flex items-center justify-center gap-1.5 shadow-sm">
                              <span>✓</span> Presença Confirmada pelo Professor!
                            </div>
                          ) : aula.checkinStatus === 'JUSTIFICADO' ? (
                            <div className="w-full py-2.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30 text-center">
                              ℹ️ Falta Justificada
                            </div>
                          ) : (
                            <div className="w-full py-2.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 text-center flex items-center justify-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                              Check-in Feito (Aguardando Professor)
                            </div>
                          )
                        ) : (
                          <button 
                            onClick={() => fazerCheckin(aula.id)}
                            className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition transform active:scale-95 shadow-md shadow-red-600/30"
                          >
                            Fazer Check-in no Treino
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : abaAtiva === 'frequencia' ? (
          renderCalendarioAluno()
        ) : abaAtiva === 'financeiro' ? (
          <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Status da Mensalidade</h2>
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
                  <h3 className="text-white font-bold mb-4">Renovar Mensalidade</h3>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => renovarMensalidade('cartao')}
                      disabled={loading} 
                      className="w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      {loading ? 'Processando...' : 'Pagar com Cartão'}
                    </button>

                    <button 
                      onClick={() => renovarMensalidade('pix')}
                      disabled={loading} 
                      className="w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 bg-[#00B1EA] hover:bg-[#0098C7] text-white shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                      {loading ? 'Gerando...' : 'Gerar PIX Copia e Cola'}
                    </button>
                    
                    <p className="text-[11px] text-zinc-500 text-center">
                      Ou faça o pagamento presencialmente na recepção com o Professor Felipe ou via WhatsApp: <strong className="text-zinc-300">(69) 99238-4491</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  
  const [metricas, setMetricas] = useState({ totalAlunos: 0, assinaturasAtivas: 0, inadimplentes: 0 });
  const [alunos, setAlunos] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Aba ativa: 'alunos' | 'agendamentos' | 'presencas'
  const [abaAtiva, setAbaAtiva] = useState('alunos');

  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [novoAluno, setNovoAluno] = useState({ nome: '', cpf: '', email: '', plano: '3x na semana' });

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
      setNovoAluno({ nome: '', cpf: '', email: '', plano: '3x na semana' }); // Reseta o form
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao criar aluno.');
    }
  };

  const handleCobrar = (aluno: any) => {
    const tel = aluno.telefone || '5569999999999';
    const msg = encodeURIComponent(`Olá ${aluno.nome}, sua mensalidade do plano ${aluno.plano} consta como pendente no nosso sistema. Caso já tenha realizado o pagamento, desconsidere!`);
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
  };

  const handleRegistrarPagamento = async (aluno: any) => {
    if (confirm(`Deseja registrar o pagamento de ${aluno.nome} e renovar por +30 dias?`)) {
      try {
        const response = await axios.post(`${API_URL}/admin/alunos/${aluno.id}/pagar`);
        alert(response.data.mensagem);
        carregarDashboard();
      } catch (error: any) {
        alert(error.response?.data?.erro || 'Erro ao registrar pagamento.');
      }
    }
  };

  // Formatação de CPF no formulário do Admin
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setNovoAluno({ ...novoAluno, cpf: v });
  };

  // TELA DE LOGIN
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm">
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
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95">
              Entrar no Painel
            </button>
          </form>
          <Link to="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition">
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  // PAINEL DO ADMINISTRADOR
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-6 z-[9999]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
              PAINEL <span className="text-red-600">DO PROFESSOR</span>
            </h1>
            <p className="text-zinc-400 mt-1">Gestão de Alunos, Mensalidades e Triagem</p>
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
                <p className="text-zinc-400 text-sm font-semibold mb-1">Total de Alunos</p>
                <p className="text-4xl font-black text-white">{metricas.totalAlunos}</p>
              </div>
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
                <p className="text-zinc-400 text-sm font-semibold mb-1">Assinaturas Ativas</p>
                <p className="text-4xl font-black text-green-500">{metricas.assinaturasAtivas}</p>
              </div>
              <div className="bg-[#141416] border border-red-900/30 rounded-xl p-6">
                <p className="text-zinc-400 text-sm font-semibold mb-1">Alunos em Atraso</p>
                <p className="text-4xl font-black text-red-500">{metricas.inadimplentes}</p>
              </div>
            </div>

            {/* MODAL NOVO ALUNO */}
            {showModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] px-4">
                <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white">
                  <h2 className="text-2xl font-bold mb-6">Novo Aluno</h2>
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
                      <label className="block text-sm text-zinc-400 mb-1">E-mail (Opcional)</label>
                      <input type="email" value={novoAluno.email} onChange={(e) => setNovoAluno({...novoAluno, email: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Plano</label>
                      <select value={novoAluno.plano} onChange={(e) => setNovoAluno({...novoAluno, plano: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500">
                        <option value="2x na semana">2x na semana (R$ 130)</option>
                        <option value="3x na semana">3x na semana (R$ 160)</option>
                        <option value="Todos os Horários">Todos os Horários (R$ 280)</option>
                        <option value="Diária">Diária (R$ 40)</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition">Cancelar</button>
                      <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-bold transition">Cadastrar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TABS */}
            <div className="flex gap-4 border-b border-zinc-800 pb-4">
              <button 
                onClick={() => setAbaAtiva('alunos')} 
                className={`font-bold pb-2 transition ${abaAtiva === 'alunos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Alunos e Mensalidades
              </button>
              <button 
                onClick={() => setAbaAtiva('agendamentos')} 
                className={`font-bold pb-2 transition flex items-center gap-2 ${abaAtiva === 'agendamentos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Aulas Experimentais
                {agendamentos.length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{agendamentos.length}</span>
                )}
              </button>
              <button 
                onClick={() => setAbaAtiva('presencas')} 
                className={`font-bold pb-2 transition flex items-center gap-2 ${abaAtiva === 'presencas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Frequência e Check-ins
              </button>
            </div>

            {/* CONTEÚDO DAS TABS */}
            {abaAtiva === 'alunos' ? (
              <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Controle de Mensalidades</h2>
                  <button onClick={() => setShowModal(true)} className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition">
                    + Novo Aluno
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Plano</th>
                        <th className="px-6 py-4">Vencimento</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {alunos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                            Nenhum aluno cadastrado no banco de dados ainda.
                          </td>
                        </tr>
                      )}
                      {alunos.map((aluno) => (
                        <tr key={aluno.id} className="hover:bg-[#1A1A1E]/50 transition">
                          <td className="px-6 py-4 font-bold text-white">{aluno.nome}</td>
                          <td className="px-6 py-4 text-zinc-400">{aluno.plano}</td>
                          <td className="px-6 py-4">
                            {aluno.diasVencimento === null ? (
                              <span className="text-zinc-600">-</span>
                            ) : aluno.diasVencimento < 0 ? (
                              <span className="text-red-500 font-bold">Atrasado há {Math.abs(aluno.diasVencimento)} dias</span>
                            ) : (
                              <span className="text-yellow-500 font-bold">Faltam {aluno.diasVencimento} dias</span>
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
                              <button 
                                onClick={() => handleRegistrarPagamento(aluno)} 
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded transition"
                                title="Registrar Pagamento"
                              >
                                Pago
                              </button>
                              <button 
                                onClick={() => handleCobrar(aluno)} 
                                className="px-3 py-1 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium text-xs rounded transition"
                                title="Cobrar via WhatsApp"
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
              <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Agendamentos Experimentais</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">WhatsApp</th>
                        <th className="px-6 py-4">Dia</th>
                        <th className="px-6 py-4">Horário</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {agendamentos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                            Nenhum agendamento experimental pendente.
                          </td>
                        </tr>
                      )}
                      {agendamentos.map((ag) => (
                        <tr key={ag.id} className="hover:bg-[#1A1A1E]/50 transition">
                          <td className="px-6 py-4 font-bold text-white">{ag.nome}</td>
                          <td className="px-6 py-4 text-zinc-400">{ag.telefone}</td>
                          <td className="px-6 py-4 font-bold text-amber-500">{ag.data}</td>
                          <td className="px-6 py-4 font-bold text-white">{ag.horario}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, '')}`} target="_blank" className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition">
                              Chamar no Whats
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : abaAtiva === 'presencas' ? (
              <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Últimos Check-ins (Presenças)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Data do Check-in</th>
                        <th className="px-6 py-4">Aluno</th>
                        <th className="px-6 py-4">Plano</th>
                        <th className="px-6 py-4">Aula</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {presencas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                            Nenhum check-in registrado ainda.
                          </td>
                        </tr>
                      )}
                      {presencas.map((p) => (
                        <tr key={p.id} className="hover:bg-[#1A1A1E]/50 transition">
                          <td className="px-6 py-4 text-zinc-400">
                            {new Date(p.criadoEm).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">{p.aluno.nome}</td>
                          <td className="px-6 py-4 text-zinc-400">{p.aluno.plano}</td>
                          <td className="px-6 py-4 font-bold text-white">{p.evento.titulo}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase">
                              AGENDADO
                            </span>
                          </td>
                        </tr>
                      ))}
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

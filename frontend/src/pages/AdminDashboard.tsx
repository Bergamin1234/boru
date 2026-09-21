import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  
  const [metricas, setMetricas] = useState({ totalAlunos: 0, assinaturasAtivas: 0, inadimplentes: 0 });
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      carregarDashboard();
    }
  }, [isLoggedIn]);

  const carregarDashboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard`);
      setMetricas(response.data.metricas);
      setAlunos(response.data.alunos);
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
    const nome = (document.getElementById('nomeNovo') as HTMLInputElement).value;
    const cpf = (document.getElementById('cpfNovo') as HTMLInputElement).value;
    const email = (document.getElementById('emailNovo') as HTMLInputElement).value;
    const plano = (document.getElementById('planoNovo') as HTMLSelectElement).value;

    try {
      const response = await axios.post(`${API_URL}/admin/alunos`, { nome, cpf, email, plano });
      alert(`Aluno criado com sucesso!\n\nUm email foi simulado no terminal do servidor.\n\nSenha temporária gerada: ${response.data.senhaTemporaria}\n(Envie isso para o aluno acessar o portal)`);
      carregarDashboard();
      (document.getElementById('modalNovoAluno') as HTMLDialogElement).close();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao criar aluno.');
    }
  };

  // TELA DE LOGIN
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-widest mb-1">BORÜ</h1>
            <p className="text-red-500 font-bold text-sm tracking-widest uppercase">Admin</p>
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
          <a href="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition">
            Voltar ao site
          </a>
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
              PAINEL <span className="text-red-600">ADMINISTRATIVO</span>
            </h1>
            <p className="text-zinc-400 mt-1">Gestão de Alunos, Mensalidades e Triagem</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsLoggedIn(false)} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition">
              Sair (Logout)
            </button>
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
            <dialog id="modalNovoAluno" className="bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white backdrop:bg-black/80">
              <h2 className="text-2xl font-bold mb-6">Novo Aluno</h2>
              <form onSubmit={criarAluno} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nome Completo</label>
                  <input id="nomeNovo" required type="text" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">CPF</label>
                  <input id="cpfNovo" required type="text" maxLength={14} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">E-mail (Para enviar senha)</label>
                  <input id="emailNovo" required type="email" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Plano</label>
                  <select id="planoNovo" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white">
                    <option value="2x na semana">2x na semana (R$ 130)</option>
                    <option value="3x na semana">3x na semana (R$ 160)</option>
                    <option value="Todos os Horários">Todos os Horários (R$ 280)</option>
                    <option value="Diária">Diária (R$ 40)</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => (document.getElementById('modalNovoAluno') as HTMLDialogElement).close()} className="flex-1 bg-zinc-800 py-2 rounded-lg font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 bg-red-600 py-2 rounded-lg font-bold">Cadastrar Aluno</button>
                </div>
              </form>
            </dialog>

            {/* ALUNOS E MENSALIDADES */}
            <section className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Controle de Mensalidades</h2>
                <button onClick={() => (document.getElementById('modalNovoAluno') as HTMLDialogElement).showModal()} className="text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition">
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
                          <button className="text-zinc-400 hover:text-white transition">
                            Cobrar / Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

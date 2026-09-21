import React, { useState } from 'react';

// Dados falsos (Mock) temporários até conectarmos com o Banco de Dados (Prisma)
const MOCK_ALUNO = {
  nome: 'Bergamin',
  plano: '3x na semana',
  status: 'Ativo',
};

const MOCK_AULAS = [
  { id: 1, horario: '15:00H', tipo: 'ADULTOS', checkinFeito: false },
  { id: 2, horario: '19:00H', tipo: 'ADULTOS', checkinFeito: false },
  { id: 3, horario: '20:00H', tipo: 'ADULTOS', checkinFeito: false },
];

export default function PortalAluno() {
  const [aulas, setAulas] = useState(MOCK_AULAS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cpf, setCpf] = useState('');
  const [erroCpf, setErroCpf] = useState('');

  // Função clássica para validação matemática real de CPF
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validarCPF(cpf)) {
      setErroCpf('');
      setIsLoggedIn(true);
    } else {
      setErroCpf('CPF Inválido. Verifique os números e tente novamente.');
    }
  };

  const formatarCpf = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  const fazerCheckin = (id: number) => {
    setAulas(aulas.map(aula => 
      aula.id === id ? { ...aula, checkinFeito: true } : aula
    ));
    alert('Check-in realizado com sucesso! Aguardando o professor confirmar a presença (Triagem).');
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
              <label className="block text-zinc-400 text-sm font-semibold mb-2">Digite seu CPF</label>
              <input 
                type="text" 
                value={cpf}
                onChange={(e) => formatarCpf(e.target.value)}
                maxLength={14}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                placeholder="000.000.000-00"
              />
              {erroCpf && <p className="text-red-500 text-xs mt-2 font-semibold">{erroCpf}</p>}
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95">
              Acessar Portal
            </button>
          </form>
          <a href="/" className="block text-center mt-6 text-zinc-500 hover:text-white text-sm transition">
            Voltar ao site
          </a>
        </div>
      </div>
    );
  }

  // TELA DO PORTAL (LOGADO)
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-6 z-[9999]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-wider text-white">
              ÁREA DO <span className="text-red-600">ALUNO</span>
            </h1>
            <p className="text-zinc-400 mt-1">Bem-vindo de volta, {MOCK_ALUNO.nome}!</p>
          </div>
          <a href="/" className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition">
            Voltar ao Início
          </a>
        </header>

        {/* MEU PLANO */}
        <section className="bg-[#141416] border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📋 Meu Plano
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <p className="text-zinc-400 text-sm">Plano Atual</p>
              <p className="text-2xl font-bold text-red-500">{MOCK_ALUNO.plano}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {MOCK_ALUNO.status}
              </span>
            </div>
          </div>
        </section>

        {/* AULAS E CHECK-IN */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🥊 Aulas de Hoje (Muay Thai)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aulas.map((aula) => (
              <div key={aula.id} className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-zinc-500">{aula.tipo}</span>
                    <span className="text-lg font-black text-white">{aula.horario}</span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-300">Muay Thai</h3>
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
        </section>
      </div>
    </div>
  );
}

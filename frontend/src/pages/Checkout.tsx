import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const planoNome = searchParams.get('plano') || 'Plano 3x na semana';
  const planoValorStr = searchParams.get('valor') || '160';
  const planoValor = parseFloat(planoValorStr);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: ''
  });

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFormData({ ...formData, cpf: v });
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome && formData.cpf && formData.senha) {
      setStep(2);
    } else {
      alert("Por favor, preencha nome, CPF e crie uma senha.");
    }
  };

  const concluirCadastroPresencial = async () => {
    setLoading(true);
    try {
      const response = await publicApi.checkout({
        ...formData,
        plano: planoNome,
        valor: planoValor
      });
      alert(response.data.mensagem || "Pré-matrícula concluída com sucesso! Efetue o pagamento presencialmente na recepção antes do treino.");
      navigate('/portal');
    } catch (error: any) {
      alert(error.response?.data?.erro || "Erro ao processar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C]/80 backdrop-blur-[2px] text-zinc-100 p-4 font-sans z-[9999] relative overflow-hidden">
      <div className="max-w-4xl mx-auto py-8 relative z-10">
        
        {/* Header Voltar */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-2">
          <Link to="/" className="text-zinc-500 hover:text-white transition flex items-center gap-2 text-xs sm:text-sm font-semibold">
            ← Voltar para o site principal
          </Link>
          <a href="https://wa.me/556992384491" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white text-xs transition">
            Dúvidas? Recepção Borü: <strong className="text-emerald-400">+55 69 9238-4491</strong>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Lado Esquerdo: Formulário */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src="/logo-boru.jpg" alt="BORÜ" className="w-12 h-12 rounded-full border-2 border-red-600 shadow-md object-cover" />
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">
                Matrícula <span className="text-red-600">Borü</span>
              </h1>
            </div>
            
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
              
              {/* Stepper */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${step === 1 ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-green-500 transition-all ${step === 2 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${step === 2 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
              </div>

              {step === 1 ? (
                <form onSubmit={nextStep} className="space-y-3">
                  <h2 className="text-base font-bold text-white mb-2">1. Seus Dados Pessoais</h2>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-1">Nome Completo</label>
                    <input required type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-1">WhatsApp / Celular</label>
                    <input required type="tel" placeholder="(69) 99999-9999" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-1">E-mail</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 text-xs font-semibold mb-1">CPF (Obrigatório)</label>
                      <input required type="text" maxLength={14} value={formData.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-semibold mb-1">Crie sua Senha</label>
                      <div className="relative">
                        <input 
                          required 
                          type={mostrarSenha ? "text" : "password"} 
                          value={formData.senha} 
                          onChange={(e) => setFormData({...formData, senha: e.target.value})} 
                          placeholder="Para acessar o portal" 
                          className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2.5 pr-9 text-sm text-white focus:border-red-500 outline-none" 
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1"
                          title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                          aria-label={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                        >
                          {mostrarSenha ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold uppercase tracking-wider text-xs transition">
                    Próximo Passo →
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-white mb-1">2. Confirmação & Pagamento</h2>

                  {/* AVISO EXCLUSIVO: PAGAMENTO PRESENCIAL */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-500/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥋</span>
                      <h3 className="text-sm font-bold text-white">Pagamento Presencial na Recepção</h3>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Sua vaga ficará pré-reservada no sistema! Para começar a treinar, o pagamento da 1ª mensalidade é feito <strong>diretamente no balcão da academia</strong> com o Mestre Felipe ou na recepção.
                    </p>
                    <div className="text-[11px] text-zinc-400 pt-1 space-y-1">
                      <p>✓ Aceitamos PIX presencial com chave na recepção</p>
                      <p>✓ Aceitamos Cartão de Crédito e Débito na maquininha</p>
                      <p>✓ Aceitamos Dinheiro em espécie</p>
                    </div>
                  </div>

                  <div className="bg-[#1A1A1E] p-3 rounded-xl border border-zinc-800 text-xs space-y-1 text-zinc-300">
                    <p><strong>Nome:</strong> {formData.nome}</p>
                    <p><strong>CPF:</strong> {formData.cpf}</p>
                    <p><strong>Telefone:</strong> {formData.telefone}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                    >
                      ← Voltar
                    </button>
                    <button 
                      type="button" 
                      onClick={concluirCadastroPresencial}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-900/30"
                    >
                      {loading ? 'Cadastrando...' : 'Confirmar Matrícula e Ir para Portal'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Lado Direito: Resumo do Plano */}
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-5">Resumo do Plano</h2>
            
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">{planoNome}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Muay Thai Tradicional com Felipe Borü</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-red-500">R$ {planoValor.toFixed(2).replace('.', ',')}</span>
                  <span className="text-zinc-500 text-xs block">/mês</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <p className="flex items-center gap-2">✓ Acesso às aulas da grade semanal</p>
                <p className="flex items-center gap-2">✓ Graduação oficial de Prajied pelo Mestre</p>
                <p className="flex items-center gap-2">✓ Check-in e controle de frequência pelo app</p>
                <p className="flex items-center gap-2">✓ Acesso ao Mural de Avisos e Eventos</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
                Endereço: Centro de Treinamento Borü - Muay Thai & Artes Marciais.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pegar os dados do plano via query string ou estado
  const searchParams = new URLSearchParams(location.search);
  const planoNome = searchParams.get('plano') || 'Plano 3x na semana';
  const planoValorStr = searchParams.get('valor') || '160';
  const planoValor = parseFloat(planoValorStr);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
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
      alert("Preencha nome, CPF e crie uma senha.");
    }
  };

  const finalizarPagamento = async (metodo: string) => {
    setLoading(true);
    // Simular delay do gateway de pagamento
    await new Promise(r => setTimeout(r, 1500));

    try {
      await axios.post('http://localhost:3001/api/checkout', {
        ...formData,
        plano: planoNome,
        valor: planoValor
      });
      alert(`Pagamento via ${metodo} aprovado!\nSeja bem-vindo(a) ao BORÜ Centro de Combate.`);
      navigate('/portal');
    } catch (error: any) {
      alert(error.response?.data?.erro || "Erro ao processar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 p-4 font-sans z-[9999] relative">
      <div className="max-w-4xl mx-auto py-10">
        
        {/* Header Voltar */}
        <div className="mb-8">
          <Link to="/" className="text-zinc-500 hover:text-white transition flex items-center gap-2 text-sm font-semibold">
            ← Voltar para os Planos
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Lado Esquerdo: Formulário */}
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider mb-6">Checkout</h1>
            
            <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6">
              
              {/* Stepper Visual */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 1 ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-green-500 transition-all ${step === 2 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 2 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
              </div>

              {step === 1 ? (
                <form onSubmit={nextStep} className="space-y-4">
                  <h2 className="text-lg font-bold mb-4">Seus Dados Pessoais</h2>
                  <div>
                    <label className="block text-zinc-400 text-sm font-semibold mb-1">Nome Completo</label>
                    <input required type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-sm font-semibold mb-1">E-mail</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-sm font-semibold mb-1">CPF (Obrigatório)</label>
                      <input required type="text" maxLength={14} value={formData.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-sm font-semibold mb-1">Crie sua Senha</label>
                      <input required type="password" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} placeholder="Para acessar o portal" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 font-bold uppercase tracking-widest text-sm transition">
                    Ir para Pagamento
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold mb-4">Escolha a Forma de Pagamento</h2>
                  
                  {/* --- INÍCIO DA INTEGRAÇÃO DO GATEWAY DE PAGAMENTO (UI) --- */}
                  {/* Desenvolvedor: Aqui você pode inserir os Elementos do Stripe (Elements) ou do Mercado Pago (CardForm) */}
                  
                  <div className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Pagar com Cartão de Crédito</p>
                    
                    <div>
                      <label className="block text-zinc-400 text-xs font-semibold mb-1">Número do Cartão</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 text-xs font-semibold mb-1">Validade</label>
                        <input type="text" placeholder="MM/AA" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-xs font-semibold mb-1">CVC</label>
                        <input type="text" placeholder="123" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-semibold mb-1">Nome no Cartão</label>
                      <input type="text" placeholder="Nome impresso" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" />
                    </div>
                    
                    <button disabled={loading} onClick={() => finalizarPagamento('Cartão de Crédito')} className="w-full mt-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold uppercase tracking-widest text-sm transition">
                      Confirmar Assinatura
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-800"></div>
                    <span className="flex-shrink-0 mx-4 text-zinc-600 text-xs">OU</span>
                    <div className="flex-grow border-t border-zinc-800"></div>
                  </div>

                  <button disabled={loading} onClick={() => finalizarPagamento('PIX')} className="w-full flex items-center justify-between p-4 rounded-xl border border-emerald-900/50 hover:border-emerald-500 bg-emerald-900/10 hover:bg-emerald-500/10 transition group text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-500 group-hover:text-emerald-400 transition">Gerar PIX Copia e Cola</p>
                        <p className="text-xs text-emerald-500/70">Aprovação imediata</p>
                      </div>
                    </div>
                  </button>
                  {/* --- FIM DA INTEGRAÇÃO DO GATEWAY --- */}

                  <button onClick={() => setStep(1)} className="w-full text-center text-sm font-semibold text-zinc-500 hover:text-white pt-2">
                    Voltar e editar dados
                  </button>
                  
                  {loading && <p className="text-center text-amber-500 font-bold mt-2 animate-pulse">Processando pagamento no gateway...</p>}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Resumo */}
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6">Resumo da Compra</h3>
              
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-800">
                <div>
                  <h4 className="font-bold text-xl text-white">{planoNome}</h4>
                  <p className="text-sm text-zinc-500">Cobrança recorrente mensal</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">R$ {planoValor.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>R$ {planoValor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-500 font-medium">
                  <span>Taxa de Matrícula</span>
                  <span>Grátis</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
                <span className="font-bold text-lg text-white">Total a Pagar</span>
                <span className="text-3xl font-black text-red-500">R$ {planoValor.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AgendarAula() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    data: '',
    horario: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Grade fixa de Muay Thai conforme passado pelo usuário
  const horariosPorDia: Record<string, string[]> = {
    'Segunda-feira': ['16:00', '18:00 (KIDS)', '19:00', '20:00'],
    'Terça-feira': ['15:00', '19:00', '20:00', '22:30'],
    'Quarta-feira': ['16:00', '18:00 (KIDS)', '19:00', '20:00'],
    'Quinta-feira': ['15:00', '19:00', '20:00', '22:30'],
    'Sexta-feira': ['16:00', '18:00 (KIDS)', '19:00', '20:00'],
    'Sábado': ['08:00', '12:30'],
    'Domingo': []
  };

  const [diaSelecionado, setDiaSelecionado] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/api/agendamentos', {
        ...formData,
        data: diaSelecionado // Usando o dia da semana como "data" para a aula experimental
      });
      setSuccess(true);
    } catch (error) {
      alert('Erro ao agendar aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 flex items-center justify-center p-4 z-[9999] relative">
        <div className="bg-[#141416] border border-green-500/30 p-8 rounded-2xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase">Agendamento Concluído!</h2>
          <p className="text-zinc-400">
            Sua aula experimental foi marcada para <strong>{diaSelecionado}</strong> às <strong>{formData.horario}</strong>.
            <br/><br/>Nossa equipe confirmará com você pelo WhatsApp em breve!
          </p>
          <a 
            href={`https://wa.me/556992384491?text=${encodeURIComponent(`Olá Professor Felipe, agendei minha aula experimental de Muay Thai no CT BORÜ para ${diaSelecionado} às ${formData.horario}! Nome: ${formData.nome}`)}`}
            target="_blank"
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/30"
          >
            <span>📲 Confirmar direto no WhatsApp (+55 69 9238-4491)</span>
          </a>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl transition text-zinc-300">
            Voltar ao Site Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-zinc-100 p-4 font-sans z-[9999] relative flex items-center justify-center">
      <div className="max-w-xl w-full">
        
        <div className="mb-6">
          <Link to="/" className="text-zinc-500 hover:text-white transition flex items-center gap-2 text-sm font-semibold">
            ← Voltar
          </Link>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">Aula Experimental</h1>
            <p className="text-zinc-400 text-sm">Preencha os dados abaixo para agendar seu primeiro treino de Muay Thai no CT BORÜ.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Dados de Contato */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm font-semibold mb-1">Seu Nome Completo</label>
                <input required type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm font-semibold mb-1">WhatsApp</label>
                <input required type="text" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" />
              </div>
            </div>

            {/* Escolha do Dia */}
            <div>
              <label className="block text-zinc-400 text-sm font-semibold mb-3">Escolha o Dia da Semana</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Object.keys(horariosPorDia).filter(dia => (horariosPorDia[dia]?.length || 0) > 0).map(dia => (
                  <button 
                    key={dia} 
                    type="button"
                    onClick={() => { setDiaSelecionado(dia); setFormData({...formData, horario: ''}) }}
                    className={`p-2 rounded-lg text-xs font-bold transition border ${diaSelecionado === dia ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                  >
                    {dia.split('-')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Escolha do Horário */}
            {diaSelecionado && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-zinc-400 text-sm font-semibold mb-3">Horários disponíveis ({diaSelecionado})</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(horariosPorDia[diaSelecionado] || []).map(hora => (
                    <button 
                      key={hora} 
                      type="button"
                      onClick={() => setFormData({...formData, horario: hora})}
                      className={`p-3 rounded-lg text-sm font-bold transition border ${formData.horario === hora ? 'bg-amber-500 text-red-950 border-amber-400' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !formData.horario}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition mt-4 ${formData.horario ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

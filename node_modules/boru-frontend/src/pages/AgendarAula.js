import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const horariosPorDia = {
        'Segunda-feira': ['16:00', '18:00 (KIDS)', '19:00', '20:00'],
        'Terça-feira': ['15:00', '19:00', '20:00', '22:30'],
        'Quarta-feira': ['16:00', '18:00 (KIDS)', '19:00', '20:00'],
        'Quinta-feira': ['15:00', '19:00', '20:00', '22:30'],
        'Sexta-feira': ['16:00', '18:00 (KIDS)', '19:00', '20:00'],
        'Sábado': ['08:00', '12:30'],
        'Domingo': []
    };
    const [diaSelecionado, setDiaSelecionado] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:3001/api/agendamentos', {
                ...formData,
                data: diaSelecionado // Usando o dia da semana como "data" para a aula experimental
            });
            setSuccess(true);
        }
        catch (error) {
            alert('Erro ao agendar aula. Tente novamente.');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsx("div", { className: "min-h-screen bg-[#0B0B0C] text-zinc-100 flex items-center justify-center p-4 z-[9999] relative", children: _jsxs("div", { className: "bg-[#141416] border border-green-500/30 p-8 rounded-2xl max-w-md w-full text-center space-y-6", children: [_jsx("div", { className: "w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto", children: _jsx("svg", { className: "w-10 h-10", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-2xl font-black text-white uppercase", children: "Agendamento Conclu\u00EDdo!" }), _jsxs("p", { className: "text-zinc-400", children: ["Sua aula experimental foi marcada para ", _jsx("strong", { children: diaSelecionado }), " \u00E0s ", _jsx("strong", { children: formData.horario }), ".", _jsx("br", {}), _jsx("br", {}), "Nossa equipe confirmar\u00E1 com voc\u00EA pelo WhatsApp em breve!"] }), _jsx("button", { onClick: () => navigate('/'), className: "w-full py-3 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl transition", children: "Voltar ao Site Inicial" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-[#0B0B0C] text-zinc-100 p-4 font-sans z-[9999] relative flex items-center justify-center", children: _jsxs("div", { className: "max-w-xl w-full", children: [_jsx("div", { className: "mb-6", children: _jsx(Link, { to: "/", className: "text-zinc-500 hover:text-white transition flex items-center gap-2 text-sm font-semibold", children: "\u2190 Voltar" }) }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-black text-white uppercase tracking-wider mb-2", children: "Aula Experimental" }), _jsx("p", { className: "text-zinc-400 text-sm", children: "Preencha os dados abaixo para agendar seu primeiro treino de Muay Thai no CT BOR\u00DC." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-1", children: "Seu Nome Completo" }), _jsx("input", { required: true, type: "text", value: formData.nome, onChange: (e) => setFormData({ ...formData, nome: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-1", children: "WhatsApp" }), _jsx("input", { required: true, type: "text", value: formData.telefone, onChange: (e) => setFormData({ ...formData, telefone: e.target.value }), placeholder: "(00) 00000-0000", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-3", children: "Escolha o Dia da Semana" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2", children: Object.keys(horariosPorDia).filter(dia => horariosPorDia[dia].length > 0).map(dia => (_jsx("button", { type: "button", onClick: () => { setDiaSelecionado(dia); setFormData({ ...formData, horario: '' }); }, className: `p-2 rounded-lg text-xs font-bold transition border ${diaSelecionado === dia ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`, children: dia.split('-')[0] }, dia))) })] }), diaSelecionado && (_jsxs("div", { className: "animate-in fade-in slide-in-from-top-4 duration-300", children: [_jsxs("label", { className: "block text-zinc-400 text-sm font-semibold mb-3", children: ["Hor\u00E1rios dispon\u00EDveis (", diaSelecionado, ")"] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: horariosPorDia[diaSelecionado].map(hora => (_jsx("button", { type: "button", onClick: () => setFormData({ ...formData, horario: hora }), className: `p-3 rounded-lg text-sm font-bold transition border ${formData.horario === hora ? 'bg-amber-500 text-red-950 border-amber-400' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`, children: hora }, hora))) })] })), _jsx("button", { type: "submit", disabled: loading || !formData.horario, className: `w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition mt-4 ${formData.horario ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`, children: loading ? 'Agendando...' : 'Confirmar Agendamento' })] })] })] }) }));
}
//# sourceMappingURL=AgendarAula.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const handleCpfChange = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        setFormData({ ...formData, cpf: v });
    };
    const nextStep = (e) => {
        e.preventDefault();
        if (formData.nome && formData.cpf && formData.senha) {
            setStep(2);
        }
        else {
            alert("Preencha nome, CPF e crie uma senha.");
        }
    };
    const finalizarPagamento = async (metodo) => {
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
        }
        catch (error) {
            alert(error.response?.data?.erro || "Erro ao processar pagamento.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-[#0B0B0C] text-zinc-100 p-4 font-sans z-[9999] relative", children: _jsxs("div", { className: "max-w-4xl mx-auto py-10", children: [_jsx("div", { className: "mb-8", children: _jsx(Link, { to: "/", className: "text-zinc-500 hover:text-white transition flex items-center gap-2 text-sm font-semibold", children: "\u2190 Voltar para os Planos" }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-black uppercase tracking-wider mb-6", children: "Checkout" }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-2xl p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-8", children: [_jsx("div", { className: `flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 1 ? 'bg-red-600 text-white' : 'bg-green-500 text-white'}`, children: "1" }), _jsx("div", { className: "flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full bg-green-500 transition-all ${step === 2 ? 'w-full' : 'w-0'}` }) }), _jsx("div", { className: `flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 2 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`, children: "2" })] }), step === 1 ? (_jsxs("form", { onSubmit: nextStep, className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "Seus Dados Pessoais" }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-1", children: "Nome Completo" }), _jsx("input", { required: true, type: "text", value: formData.nome, onChange: (e) => setFormData({ ...formData, nome: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-1", children: "E-mail" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-1", children: "CPF (Obrigat\u00F3rio)" }), _jsx("input", { required: true, type: "text", maxLength: 14, value: formData.cpf, onChange: handleCpfChange, placeholder: "000.000.000-00", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-1", children: "Crie sua Senha" }), _jsx("input", { required: true, type: "password", value: formData.senha, onChange: (e) => setFormData({ ...formData, senha: e.target.value }), placeholder: "Para acessar o portal", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-500 outline-none" })] })] }), _jsx("button", { type: "submit", className: "w-full mt-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 font-bold uppercase tracking-widest text-sm transition", children: "Ir para Pagamento" })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "Escolha a Forma de Pagamento" }), _jsxs("div", { className: "space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800", children: [_jsx("p", { className: "text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2", children: "Pagar com Cart\u00E3o de Cr\u00E9dito" }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-xs font-semibold mb-1", children: "N\u00FAmero do Cart\u00E3o" }), _jsx("input", { type: "text", placeholder: "0000 0000 0000 0000", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-xs font-semibold mb-1", children: "Validade" }), _jsx("input", { type: "text", placeholder: "MM/AA", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-xs font-semibold mb-1", children: "CVC" }), _jsx("input", { type: "text", placeholder: "123", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-xs font-semibold mb-1", children: "Nome no Cart\u00E3o" }), _jsx("input", { type: "text", placeholder: "Nome impresso", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" })] }), _jsx("button", { disabled: loading, onClick: () => finalizarPagamento('Cartão de Crédito'), className: "w-full mt-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold uppercase tracking-widest text-sm transition", children: "Confirmar Assinatura" })] }), _jsxs("div", { className: "relative flex py-2 items-center", children: [_jsx("div", { className: "flex-grow border-t border-zinc-800" }), _jsx("span", { className: "flex-shrink-0 mx-4 text-zinc-600 text-xs", children: "OU" }), _jsx("div", { className: "flex-grow border-t border-zinc-800" })] }), _jsx("button", { disabled: loading, onClick: () => finalizarPagamento('PIX'), className: "w-full flex items-center justify-between p-4 rounded-xl border border-emerald-900/50 hover:border-emerald-500 bg-emerald-900/10 hover:bg-emerald-500/10 transition group text-left", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500", children: _jsx("svg", { className: "w-6 h-6", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" }) }) }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-emerald-500 group-hover:text-emerald-400 transition", children: "Gerar PIX Copia e Cola" }), _jsx("p", { className: "text-xs text-emerald-500/70", children: "Aprova\u00E7\u00E3o imediata" })] })] }) }), _jsx("button", { onClick: () => setStep(1), className: "w-full text-center text-sm font-semibold text-zinc-500 hover:text-white pt-2", children: "Voltar e editar dados" }), loading && _jsx("p", { className: "text-center text-amber-500 font-bold mt-2 animate-pulse", children: "Processando pagamento no gateway..." })] }))] })] }), _jsx("div", { children: _jsxs("div", { className: "bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-6", children: [_jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6", children: "Resumo da Compra" }), _jsxs("div", { className: "flex justify-between items-start mb-6 pb-6 border-b border-zinc-800", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-xl text-white", children: planoNome }), _jsx("p", { className: "text-sm text-zinc-500", children: "Cobran\u00E7a recorrente mensal" })] }), _jsx("div", { className: "text-right", children: _jsxs("p", { className: "text-2xl font-black text-white", children: ["R$ ", planoValor.toFixed(2)] }) })] }), _jsxs("div", { className: "space-y-3 text-sm mb-6", children: [_jsxs("div", { className: "flex justify-between text-zinc-400", children: [_jsx("span", { children: "Subtotal" }), _jsxs("span", { children: ["R$ ", planoValor.toFixed(2)] })] }), _jsxs("div", { className: "flex justify-between text-green-500 font-medium", children: [_jsx("span", { children: "Taxa de Matr\u00EDcula" }), _jsx("span", { children: "Gr\u00E1tis" })] })] }), _jsxs("div", { className: "flex justify-between items-center pt-6 border-t border-zinc-800", children: [_jsx("span", { className: "font-bold text-lg text-white", children: "Total a Pagar" }), _jsxs("span", { className: "text-3xl font-black text-red-500", children: ["R$ ", planoValor.toFixed(2)] })] })] }) })] })] }) }));
}
//# sourceMappingURL=Checkout.js.map
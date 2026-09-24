import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
const API_URL = 'http://localhost:3001/api';
export default function AdminDashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [metricas, setMetricas] = useState({ totalAlunos: 0, assinaturasAtivas: 0, inadimplentes: 0 });
    const [alunos, setAlunos] = useState([]);
    const [agendamentos, setAgendamentos] = useState([]);
    const [presencas, setPresencas] = useState([]);
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
        }
        catch (error) {
            console.error('Erro ao carregar dashboard', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsLoggedIn(true);
        }
        else {
            alert('Senha incorreta! (Dica: a senha é admin123)');
        }
    };
    const criarAluno = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/admin/alunos`, novoAluno);
            alert(`Aluno criado com sucesso!\n\nSenha temporária gerada: ${response.data.senhaTemporaria}\n(Envie isso para o aluno acessar o portal)`);
            carregarDashboard();
            setShowModal(false);
            setNovoAluno({ nome: '', cpf: '', email: '', plano: '3x na semana' }); // Reseta o form
        }
        catch (error) {
            alert(error.response?.data?.erro || 'Erro ao criar aluno.');
        }
    };
    const handleCobrar = (aluno) => {
        const tel = aluno.telefone || '5569999999999';
        const msg = encodeURIComponent(`Olá ${aluno.nome}, sua mensalidade do plano ${aluno.plano} consta como pendente no nosso sistema. Caso já tenha realizado o pagamento, desconsidere!`);
        window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
    };
    const handleRegistrarPagamento = async (aluno) => {
        if (confirm(`Deseja registrar o pagamento de ${aluno.nome} e renovar por +30 dias?`)) {
            try {
                const response = await axios.post(`${API_URL}/admin/alunos/${aluno.id}/pagar`);
                alert(response.data.mensagem);
                carregarDashboard();
            }
            catch (error) {
                alert(error.response?.data?.erro || 'Erro ao registrar pagamento.');
            }
        }
    };
    const atualizarPrajied = async (alunoId, prajied) => {
        try {
            await axios.patch(`${API_URL}/admin/alunos/${alunoId}/prajied`, { prajied });
            alert(`Graduação alterada para ${prajied} com sucesso!`);
            carregarDashboard();
        }
        catch (error) {
            alert(error.response?.data?.erro || 'Erro ao atualizar Prajied.');
        }
    };
    // Formatação de CPF no formulário do Admin
    const handleCpfChange = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        setNovoAluno({ ...novoAluno, cpf: v });
    };
    // TELA DE LOGIN
    if (!isLoggedIn) {
        return (_jsx("div", { className: "fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-black text-white tracking-widest mb-1", children: "BOR\u00DC" }), _jsx("p", { className: "text-red-500 font-bold text-sm tracking-widest uppercase", children: "Acesso Professor" })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Senha de Acesso" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", className: "w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95", children: "Entrar no Painel" })] }), _jsx(Link, { to: "/", className: "block text-center mt-6 text-zinc-500 hover:text-white text-sm transition", children: "Voltar ao site" })] }) }));
    }
    // PAINEL DO ADMINISTRADOR
    return (_jsx("div", { className: "fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-6 z-[9999]", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-8", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl sm:text-3xl font-black tracking-wider text-white", children: ["PAINEL ", _jsx("span", { className: "text-red-600", children: "DO PROFESSOR" })] }), _jsx("p", { className: "text-zinc-400 mt-1", children: "Gest\u00E3o de Alunos, Mensalidades e Triagem" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(Link, { to: "/", onClick: () => setIsLoggedIn(false), className: "px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition", children: "Sair (Logout)" }) })] }), loading ? (_jsx("div", { className: "text-center py-20 text-zinc-500", children: "Carregando dados do servidor..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsx("p", { className: "text-zinc-400 text-sm font-semibold mb-1", children: "Total de Alunos" }), _jsx("p", { className: "text-4xl font-black text-white", children: metricas.totalAlunos })] }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsx("p", { className: "text-zinc-400 text-sm font-semibold mb-1", children: "Assinaturas Ativas" }), _jsx("p", { className: "text-4xl font-black text-green-500", children: metricas.assinaturasAtivas })] }), _jsxs("div", { className: "bg-[#141416] border border-red-900/30 rounded-xl p-6", children: [_jsx("p", { className: "text-zinc-400 text-sm font-semibold mb-1", children: "Alunos em Atraso" }), _jsx("p", { className: "text-4xl font-black text-red-500", children: metricas.inadimplentes })] })] }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Novo Aluno" }), _jsxs("form", { onSubmit: criarAluno, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "Nome Completo" }), _jsx("input", { required: true, type: "text", value: novoAluno.nome, onChange: (e) => setNovoAluno({ ...novoAluno, nome: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "CPF" }), _jsx("input", { required: true, type: "text", maxLength: 14, value: novoAluno.cpf, onChange: handleCpfChange, className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500", placeholder: "000.000.000-00" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "E-mail (Opcional)" }), _jsx("input", { type: "email", value: novoAluno.email, onChange: (e) => setNovoAluno({ ...novoAluno, email: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "Plano" }), _jsxs("select", { value: novoAluno.plano, onChange: (e) => setNovoAluno({ ...novoAluno, plano: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500", children: [_jsx("option", { value: "2x na semana", children: "2x na semana (R$ 130)" }), _jsx("option", { value: "3x na semana", children: "3x na semana (R$ 160)" }), _jsx("option", { value: "Todos os Hor\u00E1rios", children: "Todos os Hor\u00E1rios (R$ 280)" }), _jsx("option", { value: "Di\u00E1ria", children: "Di\u00E1ria (R$ 40)" })] })] }), _jsxs("div", { className: "flex gap-4 pt-4", children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), className: "flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition", children: "Cancelar" }), _jsx("button", { type: "submit", className: "flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-bold transition", children: "Cadastrar" })] })] })] }) })), _jsxs("div", { className: "flex gap-4 border-b border-zinc-800 pb-4", children: [_jsx("button", { onClick: () => setAbaAtiva('alunos'), className: `font-bold pb-2 transition ${abaAtiva === 'alunos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "Alunos e Mensalidades" }), _jsxs("button", { onClick: () => setAbaAtiva('agendamentos'), className: `font-bold pb-2 transition flex items-center gap-2 ${abaAtiva === 'agendamentos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: ["Aulas Experimentais", agendamentos.length > 0 && (_jsx("span", { className: "bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full", children: agendamentos.length }))] }), _jsx("button", { onClick: () => setAbaAtiva('presencas'), className: `font-bold pb-2 transition flex items-center gap-2 ${abaAtiva === 'presencas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "Frequ\u00EAncia e Check-ins" })] }), abaAtiva === 'alunos' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "p-6 border-b border-zinc-800 flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Controle de Mensalidades" }), _jsx("button", { onClick: () => setShowModal(true), className: "text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition", children: "+ Novo Aluno" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Aluno" }), _jsx("th", { className: "px-6 py-4", children: "Plano" }), _jsx("th", { className: "px-6 py-4", children: "Prajied" }), _jsx("th", { className: "px-6 py-4", children: "Vencimento" }), _jsx("th", { className: "px-6 py-4", children: "Status" }), _jsx("th", { className: "px-6 py-4 text-right", children: "A\u00E7\u00E3o" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [alunos.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-zinc-500", children: "Nenhum aluno cadastrado no banco de dados ainda." }) })), alunos.map((aluno) => (_jsxs("tr", { className: "hover:bg-[#1A1A1E]/50 transition", children: [_jsx("td", { className: "px-6 py-4 font-bold text-white", children: aluno.nome }), _jsx("td", { className: "px-6 py-4 text-zinc-400", children: aluno.plano }), _jsx("td", { className: "px-6 py-4", children: _jsxs("select", { value: aluno.prajied || 'Branco', onChange: (e) => atualizarPrajied(aluno.id, e.target.value), className: "bg-[#1A1A1E] border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500", children: [_jsx("option", { value: "Branco", children: "Branco" }), _jsx("option", { value: "Branco e Vermelho", children: "Branco e Vermelho" }), _jsx("option", { value: "Vermelho", children: "Vermelho" }), _jsx("option", { value: "Vermelho e Azul", children: "Vermelho e Azul" }), _jsx("option", { value: "Azul Claro", children: "Azul Claro" }), _jsx("option", { value: "Azul Escuro", children: "Azul Escuro (Instrutor)" }), _jsx("option", { value: "Preto", children: "Preto (Mestre)" })] }) }), _jsx("td", { className: "px-6 py-4", children: aluno.diasVencimento === null ? (_jsx("span", { className: "text-zinc-600", children: "-" })) : aluno.diasVencimento < 0 ? (_jsxs("span", { className: "text-red-500 font-bold", children: ["Atrasado h\u00E1 ", Math.abs(aluno.diasVencimento), " dias"] })) : (_jsxs("span", { className: "text-yellow-500 font-bold", children: ["Faltam ", aluno.diasVencimento, " dias"] })) }), _jsx("td", { className: "px-6 py-4", children: aluno.status === 'PAGO' ? (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase", children: "Em Dia" })) : (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase", children: "Pendente" })) }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("button", { onClick: () => handleRegistrarPagamento(aluno), className: "px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded transition", title: "Registrar Pagamento", children: "Pago" }), _jsx("button", { onClick: () => handleCobrar(aluno), className: "px-3 py-1 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium text-xs rounded transition", title: "Cobrar via WhatsApp", children: "Cobrar" })] }) })] }, aluno.id)))] })] }) })] })) : abaAtiva === 'agendamentos' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-zinc-800 flex justify-between items-center", children: _jsx("h2", { className: "text-xl font-bold text-white", children: "Agendamentos Experimentais" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Nome" }), _jsx("th", { className: "px-6 py-4", children: "WhatsApp" }), _jsx("th", { className: "px-6 py-4", children: "Dia" }), _jsx("th", { className: "px-6 py-4", children: "Hor\u00E1rio" }), _jsx("th", { className: "px-6 py-4 text-right", children: "A\u00E7\u00E3o" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [agendamentos.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-zinc-500", children: "Nenhum agendamento experimental pendente." }) })), agendamentos.map((ag) => (_jsxs("tr", { className: "hover:bg-[#1A1A1E]/50 transition", children: [_jsx("td", { className: "px-6 py-4 font-bold text-white", children: ag.nome }), _jsx("td", { className: "px-6 py-4 text-zinc-400", children: ag.telefone }), _jsx("td", { className: "px-6 py-4 font-bold text-amber-500", children: ag.data }), _jsx("td", { className: "px-6 py-4 font-bold text-white", children: ag.horario }), _jsx("td", { className: "px-6 py-4 text-right flex justify-end gap-2", children: _jsx("a", { href: `https://wa.me/55${ag.telefone.replace(/\D/g, '')}`, target: "_blank", className: "px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition", children: "Chamar no Whats" }) })] }, ag.id)))] })] }) })] })) : abaAtiva === 'presencas' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-zinc-800 flex justify-between items-center", children: _jsx("h2", { className: "text-xl font-bold text-white", children: "\u00DAltimos Check-ins (Presen\u00E7as)" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Data do Check-in" }), _jsx("th", { className: "px-6 py-4", children: "Aluno" }), _jsx("th", { className: "px-6 py-4", children: "Plano" }), _jsx("th", { className: "px-6 py-4", children: "Aula" }), _jsx("th", { className: "px-6 py-4", children: "Status" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [presencas.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-zinc-500", children: "Nenhum check-in registrado ainda." }) })), presencas.map((p) => (_jsxs("tr", { className: "hover:bg-[#1A1A1E]/50 transition", children: [_jsx("td", { className: "px-6 py-4 text-zinc-400", children: new Date(p.criadoEm).toLocaleString('pt-BR') }), _jsx("td", { className: "px-6 py-4 font-bold text-white", children: p.aluno.nome }), _jsx("td", { className: "px-6 py-4 text-zinc-400", children: p.aluno.plano }), _jsx("td", { className: "px-6 py-4 font-bold text-white", children: p.evento.titulo }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase", children: "AGENDADO" }) })] }, p.id)))] })] }) })] })) : null] }))] }) }));
}
//# sourceMappingURL=AdminDashboard.js.map
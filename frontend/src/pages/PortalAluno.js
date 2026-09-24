import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
const API_URL = 'http://localhost:3001/api';
export default function PortalAluno() {
    const [aulas, setAulas] = useState([]);
    const [alunoLogado, setAlunoLogado] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [erroCpf, setErroCpf] = useState('');
    const [loading, setLoading] = useState(false);
    // Controle de primeiro acesso
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    // TELA DO PORTAL (LOGADO) - Aba ativa e Chatbot
    const [abaAtiva, setAbaAtiva] = useState('aulas');
    // Estado do Chatbot IA
    const [chatMessages, setChatMessages] = useState([{ sender: 'bot', text: 'Sawasdee Krap! Sou o Tutor IA do CT BORÜ. Como posso ajudar no seu treino hoje?' }]);
    const [chatInput, setChatInput] = useState('');
    const handleSendChat = async () => {
        if (!chatInput.trim())
            return;
        const userMessage = chatInput;
        setChatMessages([...chatMessages, { sender: 'user', text: userMessage }]);
        setChatInput('');
        // Adiciona uma mensagem de "pensando..." temporária
        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Pensando...', isTyping: true }]);
        try {
            const response = await axios.post(`${API_URL}/chat`, { mensagem: userMessage });
            setChatMessages(prev => {
                const historico = [...prev];
                historico.pop(); // Remove o "Pensando..."
                return [...historico, { sender: 'bot', text: response.data.text }];
            });
        }
        catch (error) {
            setChatMessages(prev => {
                const historico = [...prev];
                historico.pop();
                return [...historico, { sender: 'bot', text: 'Desculpe, meu servidor AI está fora do ar no momento.' }];
            });
        }
    };
    const validarCPF = (cpf) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf))
            return false;
        let add = 0;
        for (let i = 0; i < 9; i++)
            add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(9)))
            return false;
        add = 0;
        for (let i = 0; i < 10; i++)
            add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(10)))
            return false;
        return true;
    };
    const handleLogin = async (e) => {
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
                carregarAulas();
            }
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                setErroCpf('CPF não encontrado no sistema. Por favor, fale com o administrador.');
            }
            else if (error.response && error.response.status === 401) {
                setErroCpf(error.response.data.erro);
            }
            else {
                setErroCpf('Erro de conexão com o servidor.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleAlterarSenha = async (e) => {
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
            carregarAulas();
        }
        catch (error) {
            alert('Erro ao atualizar a senha.');
        }
        finally {
            setLoading(false);
        }
    };
    const carregarAulas = async () => {
        try {
            const response = await axios.get(`${API_URL}/aulas`);
            // Adaptar para a UI (adicionando campo checkinFeito temporário para UI responsiva)
            const aulasFormatadas = response.data.map((aula) => {
                const d = new Date(aula.dataInicio);
                const horario = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}H`;
                const tipo = aula.titulo.includes('KIDS') ? 'KIDS' : 'ADULTOS';
                return {
                    id: aula.id,
                    horario,
                    tipo,
                    titulo: 'Muay Thai',
                    checkinFeito: false
                };
            });
            setAulas(aulasFormatadas);
        }
        catch (error) {
            console.error('Erro ao carregar aulas:', error);
        }
    };
    const formatarCpf = (v) => {
        v = v.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        setCpf(v);
    };
    const fazerCheckin = async (id) => {
        try {
            await axios.post(`${API_URL}/checkin`, {
                alunoId: alunoLogado.id,
                eventoId: id
            });
            setAulas(aulas.map(aula => aula.id === id ? { ...aula, checkinFeito: true } : aula));
            alert('Check-in realizado com sucesso! Aguardando o professor confirmar a presença.');
        }
        catch (error) {
            if (error.response?.status === 400) {
                alert('Você já fez check-in nesta aula.');
            }
            else {
                alert('Erro ao realizar check-in.');
            }
        }
    };
    // TELA DE LOGIN DO ALUNO
    if (!isLoggedIn) {
        return (_jsx("div", { className: "fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-black text-white tracking-widest mb-1", children: "BOR\u00DC" }), _jsx("p", { className: "text-red-500 font-bold text-sm tracking-widest uppercase", children: "\u00C1rea do Aluno" })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Seu CPF" }), _jsx("input", { type: "text", value: cpf, onChange: (e) => formatarCpf(e.target.value), maxLength: 14, className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "000.000.000-00" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Senha" }), _jsx("input", { type: "password", value: senha, onChange: (e) => setSenha(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "Sua senha" }), erroCpf && _jsx("p", { className: "text-red-500 text-xs mt-2 font-semibold", children: erroCpf })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95", children: loading ? 'Verificando...' : 'Acessar Portal' })] }), _jsx(Link, { to: "/", className: "block text-center mt-6 text-zinc-500 hover:text-white text-sm transition", children: "Voltar ao site" })] }) }));
    }
    // TELA DE PRIMEIRO ACESSO (MUDAR SENHA)
    if (alunoLogado?.primeiroAcesso) {
        return (_jsx("div", { className: "fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs("h1", { className: "text-2xl font-black text-white mb-2", children: ["Bem-vindo(a), ", alunoLogado.nome.split(' ')[0], "!"] }), _jsx("p", { className: "text-zinc-400 text-sm", children: "Este \u00E9 o seu primeiro acesso. Por favor, crie uma senha segura para sua conta." })] }), _jsxs("form", { onSubmit: handleAlterarSenha, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Nova Senha" }), _jsx("input", { type: "password", value: novaSenha, onChange: (e) => setNovaSenha(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "M\u00EDnimo 6 caracteres" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Confirme a Nova Senha" }), _jsx("input", { type: "password", value: confirmarSenha, onChange: (e) => setConfirmarSenha(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "Repita a senha" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 mt-4", children: loading ? 'Salvando...' : 'Salvar e Entrar' })] })] }) }));
    }
    // TELA DO PORTAL (LOGADO)
    const renovarMensalidade = async (metodo = 'pix') => {
        setLoading(true);
        // Simular delay do Gateway
        await new Promise(r => setTimeout(r, 1500));
        try {
            await axios.post(`${API_URL}/pagamentos/processar`, {
                alunoId: alunoLogado.id,
                valor: 160, // mock genérico para renovação, idealmente puxa do plano
                metodoPagamento: metodo,
                cartaoToken: metodo === 'cartao' ? 'tok_mock123' : undefined
            });
            alert(`Pagamento via ${metodo.toUpperCase()} aprovado com sucesso! Mensalidade renovada.`);
            // Atualiza o estado local para refletir (mock simples)
            const novaMensalidade = { dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'PAGO' };
            setAlunoLogado({
                ...alunoLogado,
                mensalidades: [novaMensalidade, ...(alunoLogado.mensalidades || [])]
            });
        }
        catch (error) {
            alert('Erro ao processar pagamento. Tente novamente mais tarde.');
        }
        finally {
            setLoading(false);
        }
    };
    const calcularDiasVencimento = () => {
        if (!alunoLogado?.mensalidades || alunoLogado.mensalidades.length === 0)
            return null;
        const ultima = alunoLogado.mensalidades[0];
        const agora = new Date();
        const venc = new Date(ultima.dataVencimento);
        const diff = venc.getTime() - agora.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };
    const dias = calcularDiasVencimento();
    return (_jsx("div", { className: "fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-6 z-[9999]", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-black tracking-wider text-white", children: ["\u00C1REA DO ", _jsx("span", { className: "text-red-600", children: "ALUNO" })] }), _jsxs("p", { className: "text-zinc-400 mt-1", children: ["Bem-vindo de volta, ", alunoLogado?.nome, "!"] })] }), _jsx(Link, { to: "/", onClick: () => setIsLoggedIn(false), className: "px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition text-center", children: "Sair (Logout)" })] }), _jsxs("div", { className: "flex gap-4 border-b border-zinc-800 pb-4", children: [_jsx("button", { onClick: () => setAbaAtiva('aulas'), className: `font-bold pb-2 transition ${abaAtiva === 'aulas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "Meu Plano & Aulas" }), _jsx("button", { onClick: () => setAbaAtiva('financeiro'), className: `font-bold pb-2 transition ${abaAtiva === 'financeiro' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "Financeiro (Pagamentos)" }), _jsxs("button", { onClick: () => setAbaAtiva('chatbot'), className: `font-bold pb-2 transition flex items-center gap-2 ${abaAtiva === 'chatbot' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-bot", children: [_jsx("path", { d: "M12 8V4H8" }), _jsx("rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }), _jsx("path", { d: "M2 14h2" }), _jsx("path", { d: "M20 14h2" }), _jsx("path", { d: "M15 13v2" }), _jsx("path", { d: "M9 13v2" })] }), "Tutor Virtual (IA)"] })] }), abaAtiva === 'aulas' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", children: [_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4 flex items-center gap-2", children: "\uD83D\uDCCB Meu Plano" }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("p", { className: "text-zinc-400 text-sm", children: "Plano Atual" }), _jsx("p", { className: "text-2xl font-bold text-red-500", children: alunoLogado?.plano || 'Sem Plano Fixo' }), _jsx("div", { className: "mt-2", children: _jsxs("span", { className: "inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500" }), "Ativo"] }) })] })] }), _jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "64", height: "64", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-award", children: [_jsx("circle", { cx: "12", cy: "8", r: "7" }), _jsx("polyline", { points: "8.21 13.89 7 23 12 20 17 23 15.79 13.88" })] }) }), _jsx("h2", { className: "text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10", children: "\u2B50 Sua Gradua\u00E7\u00E3o" }), _jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [_jsx("div", { className: `w-14 h-14 rounded-full flex justify-center items-center shadow-lg border-2 border-[#1A1A1E] ${alunoLogado?.prajied === 'Branco' ? 'bg-white text-zinc-900' :
                                                        alunoLogado?.prajied === 'Branco e Vermelho' ? 'bg-gradient-to-r from-white to-red-500' :
                                                            alunoLogado?.prajied === 'Vermelho' ? 'bg-red-500 text-white' :
                                                                alunoLogado?.prajied === 'Vermelho e Azul' ? 'bg-gradient-to-r from-red-500 to-blue-500 text-white' :
                                                                    alunoLogado?.prajied === 'Azul Claro' ? 'bg-blue-400 text-white' :
                                                                        alunoLogado?.prajied === 'Azul Escuro' ? 'bg-blue-800 text-white' :
                                                                            alunoLogado?.prajied === 'Preto' ? 'bg-black border-2 border-zinc-500 text-white' :
                                                                                'bg-white text-zinc-900'}` }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex justify-between text-xs mb-1", children: _jsx("span", { className: "text-zinc-400 font-bold uppercase tracking-wider", children: "Prajied" }) }), _jsx("p", { className: "text-lg font-black text-white", children: alunoLogado?.prajied || 'Branco' }), _jsx("p", { className: "text-[10px] text-zinc-500 mt-2", children: "Apenas os professores podem atualizar sua gradua\u00E7\u00E3o." })] })] })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4 flex items-center gap-2", children: "\uD83E\uDD4A Aulas Agendadas (Pr\u00F3ximos 3 Dias)" }), aulas.length === 0 ? (_jsx("p", { className: "text-zinc-500", children: "Nenhuma aula encontrada para os pr\u00F3ximos dias." })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: aulas.map((aula) => (_jsxs("div", { className: "bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("span", { className: "text-sm font-bold text-zinc-500", children: aula.tipo }), _jsx("span", { className: "text-lg font-black text-white", children: aula.horario })] }), _jsx("h3", { className: "text-base font-semibold text-zinc-300", children: aula.titulo }), _jsx("p", { className: "text-xs text-zinc-500 mt-1", children: "Prof. Felipe Bor\u00FC" })] }), _jsx("div", { className: "mt-6", children: aula.checkinFeito ? (_jsx("button", { disabled: true, className: "w-full py-2.5 rounded-lg bg-green-600/20 text-green-500 font-bold text-sm border border-green-600/30 cursor-not-allowed", children: "\u2713 Check-in Confirmado" })) : (_jsx("button", { onClick: () => fazerCheckin(aula.id), className: "w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition transform active:scale-95", children: "Fazer Check-in" })) })] }, aula.id))) }))] })] })) : abaAtiva === 'financeiro' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-zinc-800", children: _jsx("h2", { className: "text-xl font-bold text-white", children: "Renova\u00E7\u00E3o e Pagamentos" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-8 justify-between items-start", children: [_jsxs("div", { className: "text-center md:text-left", children: [_jsx("p", { className: "text-zinc-400 text-sm mb-1", children: "Dias restantes para renova\u00E7\u00E3o" }), dias === null ? (_jsx("p", { className: "text-3xl font-black text-zinc-500", children: "Nenhuma mensalidade" })) : dias < 0 ? (_jsxs("p", { className: "text-3xl font-black text-red-500", children: ["Atrasado h\u00E1 ", Math.abs(dias), " dias"] })) : (_jsxs("p", { className: "text-4xl font-black text-green-500", children: [dias, " ", _jsx("span", { className: "text-lg font-semibold text-zinc-500", children: "dias" })] })), _jsxs("p", { className: "text-zinc-500 text-xs mt-2", children: ["Valor atual do seu plano: ", _jsx("strong", { className: "text-zinc-300", children: "R$ 160,00" })] })] }), _jsxs("div", { className: "w-full md:w-1/2 bg-[#1A1A1E] p-5 rounded-xl border border-zinc-800", children: [_jsx("h3", { className: "text-white font-bold mb-4", children: "Escolha a forma de pagamento" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("button", { onClick: () => renovarMensalidade('cartao'), disabled: loading || (dias !== null && dias > 5), className: `w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${dias !== null && dias > 5 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'}`, children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { width: "20", height: "14", x: "2", y: "5", rx: "2" }), _jsx("line", { x1: "2", x2: "22", y1: "10", y2: "10" })] }), loading ? 'Processando...' : 'Pagar com Cartão (Stripe/MercadoPago)'] }), _jsxs("button", { onClick: () => renovarMensalidade('pix'), disabled: loading || (dias !== null && dias > 5), className: `w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${dias !== null && dias > 5 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-[#00B1EA] hover:bg-[#0098C7] text-white shadow-lg'}`, children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 2 2 7l10 5 10-5-10-5z" }), _jsx("path", { d: "m2 17 10 5 10-5" }), _jsx("path", { d: "m2 12 10 5 10-5" })] }), loading ? 'Gerando...' : 'Gerar PIX Copia e Cola'] }), _jsxs("p", { className: "text-[10px] text-zinc-500 text-center", children: ["* Desenvolvedor: Insira os elementos do seu Gateway de Pagamento aqui. A rota de backend j\u00E1 est\u00E1 em ", _jsx("code", { children: "/api/pagamentos/processar" }), "."] })] })] })] }) })] })) : abaAtiva === 'chatbot' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden flex flex-col", style: { height: '600px' }, children: [_jsxs("div", { className: "bg-red-600 p-4 text-white flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-white/20 rounded-full flex justify-center items-center", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "lucide lucide-bot", children: [_jsx("path", { d: "M12 8V4H8" }), _jsx("rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }), _jsx("path", { d: "M2 14h2" }), _jsx("path", { d: "M20 14h2" }), _jsx("path", { d: "M15 13v2" }), _jsx("path", { d: "M9 13v2" })] }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold", children: "Boru Tutor Virtual" }), _jsx("p", { className: "text-[10px] uppercase tracking-wider text-red-200", children: "Intelig\u00EAncia Artificial de Treino" })] })] }), _jsx("div", { className: "flex-1 p-6 overflow-y-auto space-y-4 bg-[#0B0B0C]", children: chatMessages.map((m, i) => (_jsx("div", { className: `flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-[#1A1A1E] border border-zinc-800 text-zinc-300 rounded-bl-none shadow-sm'}`, children: m.text }) }, i))) }), _jsxs("div", { className: "p-4 bg-[#141416] border-t border-zinc-800 flex gap-2", children: [_jsx("input", { type: "text", value: chatInput, onChange: (e) => setChatInput(e.target.value), placeholder: "Pergunte sobre t\u00E9cnicas de Muay Thai...", className: "flex-1 px-4 py-3 bg-[#1A1A1E] text-white border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-red-500 transition", onKeyPress: (e) => e.key === 'Enter' && handleSendChat() }), _jsx("button", { onClick: handleSendChat, className: "px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition", children: "Enviar" })] })] })) : null] }) }));
}
//# sourceMappingURL=PortalAluno.js.map
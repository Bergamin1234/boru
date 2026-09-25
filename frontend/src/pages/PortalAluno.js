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
    // TELA DO PORTAL (LOGADO) - Aba ativa: 'aulas' | 'frequencia' | 'financeiro'
    const [abaAtiva, setAbaAtiva] = useState('aulas');
    // Dados de Frequência & Calendário do Aluno
    const [dadosFrequencia, setDadosFrequencia] = useState(null);
    const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
    const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
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
                carregarAulas(response.data.id);
                carregarFrequencia(response.data.id, mesAtual, anoAtual);
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
            carregarAulas(alunoLogado.id);
            carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
        }
        catch (error) {
            alert('Erro ao atualizar a senha.');
        }
        finally {
            setLoading(false);
        }
    };
    const carregarAulas = async (idDoAluno) => {
        const alunoId = idDoAluno || alunoLogado?.id;
        try {
            const response = await axios.get(`${API_URL}/aulas`, {
                params: alunoId ? { alunoId } : {}
            });
            const aulasFormatadas = response.data.map((aula) => {
                const d = new Date(aula.dataInicio);
                const horario = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}H`;
                const diaDaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                const tipo = aula.titulo.includes('KIDS') ? 'KIDS' : 'ADULTOS';
                return {
                    id: aula.id,
                    horario,
                    diaDaSemana,
                    tipo,
                    titulo: 'Muay Thai Tradicional',
                    checkinFeito: aula.checkinFeito,
                    checkinStatus: aula.checkinStatus
                };
            });
            setAulas(aulasFormatadas);
        }
        catch (error) {
            console.error('Erro ao carregar aulas:', error);
        }
    };
    const carregarFrequencia = async (idDoAluno, mes, ano) => {
        try {
            const res = await axios.get(`${API_URL}/admin/alunos/${idDoAluno}/calendario`, {
                params: { mes, ano }
            });
            setDadosFrequencia(res.data);
        }
        catch (error) {
            console.error('Erro ao carregar frequência:', error);
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
            // Atualiza lista de aulas
            setAulas(aulas.map(aula => aula.id === id ? { ...aula, checkinFeito: true, checkinStatus: 'AGENDADO' } : aula));
            if (alunoLogado?.id) {
                carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
            }
            alert('Check-in realizado com sucesso! Aguardando o professor confirmar sua presença.');
        }
        catch (error) {
            if (error.response?.data?.erro) {
                alert(error.response.data.erro);
            }
            else {
                alert('Erro ao realizar check-in.');
            }
        }
    };
    // TELA DE LOGIN DO ALUNO
    if (!isLoggedIn) {
        return (_jsx("div", { className: "fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-black text-white tracking-widest mb-1", children: "BOR\u00DC" }), _jsx("p", { className: "text-red-500 font-bold text-sm tracking-widest uppercase", children: "\u00C1rea do Aluno" })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Seu CPF" }), _jsx("input", { type: "text", value: cpf, onChange: (e) => formatarCpf(e.target.value), maxLength: 14, className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "000.000.000-00" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Senha" }), _jsx("input", { type: "password", value: senha, onChange: (e) => setSenha(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "Sua senha" }), erroCpf && _jsx("p", { className: "text-red-500 text-xs mt-2 font-semibold", children: erroCpf })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30", children: loading ? 'Verificando...' : 'Acessar Portal' })] }), _jsx(Link, { to: "/", className: "block text-center mt-6 text-zinc-500 hover:text-white text-sm transition", children: "\u2190 Voltar ao site principal" })] }) }));
    }
    // TELA DE PRIMEIRO ACESSO (MUDAR SENHA)
    if (alunoLogado?.primeiroAcesso) {
        return (_jsx("div", { className: "fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs("h1", { className: "text-2xl font-black text-white mb-2", children: ["Bem-vindo(a), ", alunoLogado.nome.split(' ')[0], "!"] }), _jsx("p", { className: "text-zinc-400 text-sm", children: "Este \u00E9 o seu primeiro acesso. Por favor, crie uma senha segura para sua conta." })] }), _jsxs("form", { onSubmit: handleAlterarSenha, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Nova Senha" }), _jsx("input", { type: "password", value: novaSenha, onChange: (e) => setNovaSenha(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "M\u00EDnimo 6 caracteres" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Confirme a Nova Senha" }), _jsx("input", { type: "password", value: confirmarSenha, onChange: (e) => setConfirmarSenha(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "Repita a senha" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 mt-4", children: loading ? 'Salvando...' : 'Salvar e Entrar' })] })] }) }));
    }
    // TELA DO PORTAL (LOGADO)
    const renovarMensalidade = async (metodo = 'pix') => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        try {
            await axios.post(`${API_URL}/pagamentos/processar`, {
                alunoId: alunoLogado.id,
                valor: 160,
                metodoPagamento: metodo,
                cartaoToken: metodo === 'cartao' ? 'tok_mock123' : undefined
            });
            alert(`Pagamento via ${metodo.toUpperCase()} aprovado com sucesso! Mensalidade renovada.`);
            const novaMensalidade = { dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'PAGO' };
            setAlunoLogado({
                ...alunoLogado,
                mensalidades: [novaMensalidade, ...(alunoLogado.mensalidades || [])]
            });
            carregarFrequencia(alunoLogado.id, mesAtual, anoAtual);
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
    // Render do calendário mensal na Área do Aluno
    const renderCalendarioAluno = () => {
        const primeiroDiaSemana = new Date(anoAtual, mesAtual - 1, 1).getDay();
        const totalDiasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
        const diasArray = [];
        // Células vazias até o primeiro dia do mês
        for (let i = 0; i < primeiroDiaSemana; i++) {
            diasArray.push(null);
        }
        // Dias do mês
        for (let d = 1; d <= totalDiasNoMes; d++) {
            diasArray.push(d);
        }
        const mesesNomes = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const mudarMes = (delta) => {
            let novoMes = mesAtual + delta;
            let novoAno = anoAtual;
            if (novoMes > 12) {
                novoMes = 1;
                novoAno += 1;
            }
            else if (novoMes < 1) {
                novoMes = 12;
                novoAno -= 1;
            }
            setMesAtual(novoMes);
            setAnoAtual(novoAno);
            if (alunoLogado?.id) {
                carregarFrequencia(alunoLogado.id, novoMes, novoAno);
            }
        };
        return (_jsxs("div", { className: "space-y-6", children: [dadosFrequencia && (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-5", children: [_jsx("p", { className: "text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1", children: "Presen\u00E7a no M\u00EAs" }), _jsx("div", { className: "flex items-baseline gap-2", children: _jsxs("span", { className: `text-4xl font-black ${dadosFrequencia.estatisticas.porcentagemPresenca >= 80 ? 'text-green-500' :
                                            dadosFrequencia.estatisticas.porcentagemPresenca >= 50 ? 'text-yellow-500' : 'text-red-500'}`, children: [dadosFrequencia.estatisticas.porcentagemPresenca, "%"] }) }), _jsx("div", { className: "w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${dadosFrequencia.estatisticas.porcentagemPresenca >= 80 ? 'bg-green-500' :
                                            dadosFrequencia.estatisticas.porcentagemPresenca >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`, style: { width: `${dadosFrequencia.estatisticas.porcentagemPresenca}%` } }) })] }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-5", children: [_jsx("p", { className: "text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1", children: "Aulas Feitas" }), _jsxs("p", { className: "text-3xl font-black text-white", children: [dadosFrequencia.estatisticas.presentes, _jsxs("span", { className: "text-sm font-semibold text-zinc-500 ml-1", children: ["/ ", dadosFrequencia.estatisticas.aulasEsperadasNoMes, " previstas"] })] }), _jsxs("p", { className: "text-[11px] text-zinc-500 mt-2", children: ["Plano: ", alunoLogado?.plano || '2x na semana'] })] }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-5", children: [_jsx("p", { className: "text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1", children: "Faltas Justificadas" }), _jsx("p", { className: "text-3xl font-black text-blue-400", children: dadosFrequencia.estatisticas.justificadas }), _jsx("p", { className: "text-[11px] text-blue-400/80 mt-2", children: "Abonadas na presen\u00E7a" })] }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-5", children: [_jsx("p", { className: "text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1", children: "Aguardando OK" }), _jsx("p", { className: "text-3xl font-black text-amber-500", children: dadosFrequencia.estatisticas.agendadasPendentes }), _jsx("p", { className: "text-[11px] text-amber-400/80 mt-2", children: "Check-in feito pelo app" })] })] })), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("h3", { className: "text-lg font-bold text-white flex items-center gap-2", children: ["\uD83D\uDCC5 ", mesesNomes[mesAtual - 1], " de ", anoAtual] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => mudarMes(-1), className: "px-3 py-1.5 bg-[#1A1A1E] hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-white transition", children: "\u2190 M\u00EAs Anterior" }), _jsx("button", { onClick: () => mudarMes(1), className: "px-3 py-1.5 bg-[#1A1A1E] hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-white transition", children: "Pr\u00F3ximo M\u00EAs \u2192" })] })] }), _jsxs("div", { className: "grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2", children: [_jsx("div", { children: "Dom" }), _jsx("div", { children: "Seg" }), _jsx("div", { children: "Ter" }), _jsx("div", { children: "Qua" }), _jsx("div", { children: "Qui" }), _jsx("div", { children: "Sex" }), _jsx("div", { children: "S\u00E1b" })] }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: diasArray.map((dia, idx) => {
                                if (dia === null) {
                                    return _jsx("div", { className: "h-20 rounded-lg bg-zinc-900/30" }, `empty-${idx}`);
                                }
                                const dataIso = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                                const presencasDoDia = dadosFrequencia?.presencasPorDia?.[dataIso] || [];
                                const ehHoje = new Date().toISOString().split('T')[0] === dataIso;
                                const temPresente = presencasDoDia.some((p) => p.status === 'PRESENTE');
                                const temJustificada = presencasDoDia.some((p) => p.status === 'JUSTIFICADO');
                                const temAgendado = presencasDoDia.some((p) => p.status === 'AGENDADO');
                                const temAusente = presencasDoDia.some((p) => p.status === 'AUSENTE');
                                return (_jsxs("div", { className: `min-h-[80px] p-2 rounded-xl border flex flex-col justify-between transition text-left ${temPresente
                                        ? 'bg-green-500/10 border-green-500/40 text-white'
                                        : temJustificada
                                            ? 'bg-blue-500/10 border-blue-500/40 text-white'
                                            : temAgendado
                                                ? 'bg-amber-500/10 border-amber-500/40 text-white'
                                                : temAusente
                                                    ? 'bg-red-500/10 border-red-500/30 text-white'
                                                    : ehHoje
                                                        ? 'bg-[#1A1A1E] border-red-500 text-white shadow-sm shadow-red-500/20'
                                                        : 'bg-[#1A1A1E] border-zinc-800 text-zinc-400'}`, children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: `text-sm font-black ${ehHoje ? 'text-red-500' : 'text-zinc-200'}`, children: dia }), ehHoje && _jsx("span", { className: "text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold", children: "HOJE" })] }), _jsxs("div", { className: "space-y-1 mt-1", children: [temPresente && (_jsx("span", { className: "block text-[10px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded truncate", children: "\u2713 Presente" })), temJustificada && (_jsx("span", { className: "block text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded truncate", title: "Falta Justificada pelo Professor", children: "\u2139\uFE0F Justificada" })), temAgendado && (_jsx("span", { className: "block text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded truncate", children: "\u23F3 Aguardando OK" })), temAusente && (_jsx("span", { className: "block text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded truncate", children: "\u2717 Ausente" }))] })] }, `day-${dia}`));
                            }) }), _jsxs("div", { className: "flex flex-wrap gap-4 mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-400", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsx("span", { children: "Presen\u00E7a Confirmada" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-blue-400" }), _jsx("span", { children: "Falta Justificada (Atestado/Abonada)" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-amber-400" }), _jsx("span", { children: "Check-in Pendente (Aguardando Professor)" })] })] })] })] }));
    };
    return (_jsx("div", { className: "fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-4 sm:p-6 z-[9999]", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-black tracking-wider text-white", children: ["\u00C1REA DO ", _jsx("span", { className: "text-red-600", children: "ALUNO" })] }), _jsxs("p", { className: "text-zinc-400 mt-1", children: ["Sawasdee Krap, ", alunoLogado?.nome, "!"] })] }), _jsx(Link, { to: "/", onClick: () => setIsLoggedIn(false), className: "px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition text-center", children: "Sair (Logout)" })] }), _jsxs("div", { className: "flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto", children: [_jsx("button", { onClick: () => setAbaAtiva('aulas'), className: `font-bold pb-2 transition whitespace-nowrap ${abaAtiva === 'aulas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "\uD83E\uDD4A Treinos & Check-in" }), _jsx("button", { onClick: () => setAbaAtiva('frequencia'), className: `font-bold pb-2 transition flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'frequencia' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "\uD83D\uDCC5 Minha Frequ\u00EAncia & Calend\u00E1rio" }), _jsx("button", { onClick: () => setAbaAtiva('financeiro'), className: `font-bold pb-2 transition whitespace-nowrap ${abaAtiva === 'financeiro' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "\uD83D\uDCB3 Mensalidade" })] }), abaAtiva === 'aulas' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", children: [_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4 flex items-center gap-2", children: "\uD83D\uDCCB Meu Plano" }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("p", { className: "text-zinc-400 text-sm", children: "Plano Atual" }), _jsx("p", { className: "text-2xl font-bold text-red-500", children: alunoLogado?.plano || '2x na semana' }), _jsx("div", { className: "mt-2", children: _jsxs("span", { className: "inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500" }), "Matr\u00EDcula Ativa"] }) })] })] }), _jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6 relative overflow-hidden", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10", children: "\u2B50 Sua Gradua\u00E7\u00E3o (Prajied)" }), _jsxs("div", { className: "flex items-center gap-4 relative z-10", children: [_jsx("div", { className: `w-14 h-14 rounded-full flex justify-center items-center shadow-lg border-2 border-[#1A1A1E] ${alunoLogado?.prajied === 'Branco' ? 'bg-white text-zinc-900' :
                                                        alunoLogado?.prajied === 'Branco e Vermelho' ? 'bg-gradient-to-r from-white to-red-500' :
                                                            alunoLogado?.prajied === 'Vermelho' ? 'bg-red-500 text-white' :
                                                                alunoLogado?.prajied === 'Vermelho e Azul' ? 'bg-gradient-to-r from-red-500 to-blue-500 text-white' :
                                                                    alunoLogado?.prajied === 'Azul Claro' ? 'bg-blue-400 text-white' :
                                                                        alunoLogado?.prajied === 'Azul Escuro' ? 'bg-blue-800 text-white' :
                                                                            alunoLogado?.prajied === 'Preto' ? 'bg-black border-2 border-zinc-500 text-white' :
                                                                                'bg-white text-zinc-900'}` }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex justify-between text-xs mb-1", children: _jsx("span", { className: "text-zinc-400 font-bold uppercase tracking-wider", children: "Prajied Atual" }) }), _jsx("p", { className: "text-lg font-black text-white", children: alunoLogado?.prajied || 'Branco' }), _jsx("p", { className: "text-[11px] text-zinc-500 mt-1", children: "Gradua\u00E7\u00F5es reconhecidas pelo Mestre Felipe Bor\u00FC." })] })] })] })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-white flex items-center gap-2", children: "\uD83E\uDD4A Pr\u00F3ximas Aulas de Muay Thai" }), _jsx("button", { onClick: () => carregarAulas(alunoLogado.id), className: "text-xs text-zinc-400 hover:text-white transition flex items-center gap-1", children: "\u21BB Atualizar" })] }), aulas.length === 0 ? (_jsx("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-8 text-center text-zinc-500", children: "Nenhuma aula encontrada para os pr\u00F3ximos dias na grade." })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: aulas.map((aula) => (_jsxs("div", { className: "bg-[#1A1A1E] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-red-500/50 transition", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("span", { className: "text-xs font-bold text-red-500 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40 uppercase", children: aula.tipo }), _jsx("span", { className: "text-lg font-black text-white", children: aula.horario })] }), _jsx("h3", { className: "text-base font-semibold text-zinc-200", children: aula.titulo }), _jsxs("p", { className: "text-xs text-zinc-400 mt-1", children: ["Data: ", aula.diaDaSemana] }), _jsx("p", { className: "text-xs text-zinc-500", children: "Professor: Felipe Bor\u00FC" })] }), _jsx("div", { className: "mt-6", children: aula.checkinFeito ? (aula.checkinStatus === 'PRESENTE' ? (_jsxs("div", { className: "w-full py-2.5 rounded-lg bg-green-500/20 text-green-400 font-bold text-xs border border-green-500/30 text-center flex items-center justify-center gap-1.5 shadow-sm", children: [_jsx("span", { children: "\u2713" }), " Presen\u00E7a Confirmada pelo Professor!"] })) : aula.checkinStatus === 'JUSTIFICADO' ? (_jsx("div", { className: "w-full py-2.5 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30 text-center", children: "\u2139\uFE0F Falta Justificada" })) : (_jsxs("div", { className: "w-full py-2.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 text-center flex items-center justify-center gap-1.5", children: [_jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" }), "Check-in Feito (Aguardando Professor)"] }))) : (_jsx("button", { onClick: () => fazerCheckin(aula.id), className: "w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition transform active:scale-95 shadow-md shadow-red-600/30", children: "Fazer Check-in no Treino" })) })] }, aula.id))) }))] })] })) : abaAtiva === 'frequencia' ? (renderCalendarioAluno()) : abaAtiva === 'financeiro' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl", children: [_jsx("div", { className: "p-6 border-b border-zinc-800", children: _jsx("h2", { className: "text-xl font-bold text-white", children: "Status da Mensalidade" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-8 justify-between items-start", children: [_jsxs("div", { className: "text-center md:text-left", children: [_jsx("p", { className: "text-zinc-400 text-sm mb-1", children: "Dias restantes para renova\u00E7\u00E3o" }), dias === null ? (_jsx("p", { className: "text-3xl font-black text-zinc-500", children: "Nenhuma mensalidade" })) : dias < 0 ? (_jsxs("p", { className: "text-3xl font-black text-red-500", children: ["Atrasado h\u00E1 ", Math.abs(dias), " dias"] })) : (_jsxs("p", { className: "text-4xl font-black text-green-500", children: [dias, " ", _jsx("span", { className: "text-lg font-semibold text-zinc-500", children: "dias" })] })), _jsxs("p", { className: "text-zinc-500 text-xs mt-2", children: ["Valor atual do seu plano: ", _jsx("strong", { className: "text-zinc-300", children: "R$ 160,00" })] })] }), _jsxs("div", { className: "w-full md:w-1/2 bg-[#1A1A1E] p-5 rounded-xl border border-zinc-800", children: [_jsx("h3", { className: "text-white font-bold mb-4", children: "Renovar Mensalidade" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("button", { onClick: () => renovarMensalidade('cartao'), disabled: loading, className: "w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { width: "20", height: "14", x: "2", y: "5", rx: "2" }), _jsx("line", { x1: "2", x2: "22", y1: "10", y2: "10" })] }), loading ? 'Processando...' : 'Pagar com Cartão'] }), _jsxs("button", { onClick: () => renovarMensalidade('pix'), disabled: loading, className: "w-full px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 bg-[#00B1EA] hover:bg-[#0098C7] text-white shadow-lg", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 2 2 7l10 5 10-5-10-5z" }), _jsx("path", { d: "m2 17 10 5 10-5" }), _jsx("path", { d: "m2 12 10 5 10-5" })] }), loading ? 'Gerando...' : 'Gerar PIX Copia e Cola'] }), _jsx("p", { className: "text-[11px] text-zinc-500 text-center", children: "Ou fa\u00E7a o pagamento presencialmente na recep\u00E7\u00E3o com o Professor Felipe." })] })] })] }) })] })) : null] }) }));
}
//# sourceMappingURL=PortalAluno.js.map
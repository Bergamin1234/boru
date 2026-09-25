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
    const [agendamentos, setAgendamentos] = useState({ pendentes: [], posAula: [], finalizados: [] });
    const [presencas, setPresencas] = useState([]);
    const [loading, setLoading] = useState(true);
    // Aba ativa: 'alunos' | 'agendamentos' | 'presencas'
    const [abaAtiva, setAbaAtiva] = useState('alunos');
    // Sub-aba de agendamentos experimentais: 'pendentes' | 'posAula'
    const [subAbaExperimental, setSubAbaExperimental] = useState('pendentes');
    // Modal Novo Aluno
    const [showModal, setShowModal] = useState(false);
    const [novoAluno, setNovoAluno] = useState({ nome: '', cpf: '', email: '', telefone: '', plano: '2x na semana' });
    // Modal Calendário / Presença do Aluno (Comando 2 e 5)
    const [alunoSelecionado, setAlunoSelecionado] = useState(null);
    const [calendarioDados, setCalendarioDados] = useState(null);
    const [loadingCalendario, setLoadingCalendario] = useState(false);
    const [mesCalendario, setMesCalendario] = useState(new Date().getMonth() + 1);
    const [anoCalendario, setAnoCalendario] = useState(new Date().getFullYear());
    // Modal de Ação do Dia no Calendário (Marcar presença / Falta Justificada)
    const [diaSelecionadoAcao, setDiaSelecionadoAcao] = useState(null);
    const [justificativaInput, setJustificativaInput] = useState('');
    const [modalAcaoDia, setModalAcaoDia] = useState(false);
    // Modal Converter Experimental em Aluno
    const [leadParaConverter, setLeadParaConverter] = useState(null);
    const [planoConversao, setPlanoConversao] = useState('2x na semana');
    const [valorConversao, setValorConversao] = useState('130');
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
            setNovoAluno({ nome: '', cpf: '', email: '', telefone: '', plano: '2x na semana' });
        }
        catch (error) {
            alert(error.response?.data?.erro || 'Erro ao criar aluno.');
        }
    };
    const handleCobrar = (aluno) => {
        const tel = (aluno.telefone || '').replace(/\D/g, '') || '5569999999999';
        const dias = aluno.diasVencimento;
        let msg = '';
        if (dias === null) {
            msg = `Olá ${aluno.nome}, aqui é do CT BORÜ Muay Thai! Tudo bem? Passando para regularizar sua matrícula no plano ${aluno.plano}.`;
        }
        else if (dias < 0) {
            msg = `Olá ${aluno.nome}, tudo bem? Aqui é do CT BORÜ Muay Thai. Sua mensalidade venceu há ${Math.abs(dias)} dias. Por favor, nos envie o comprovante de pagamento assim que possível! Chave Pix: financeiro@ctboru.com.br`;
        }
        else if (dias === 0) {
            msg = `Olá ${aluno.nome}, aqui é do CT BORÜ Muay Thai! Sua mensalidade vence hoje. Caso já tenha realizado o pagamento, desconsidere!`;
        }
        else {
            msg = `Olá ${aluno.nome}, tudo bem? Passando para lembrar que sua mensalidade no CT BORÜ vence em ${dias} dias. Bons treinos!`;
        }
        window.open(`https://wa.me/${tel.startsWith('55') ? tel : '55' + tel}?text=${encodeURIComponent(msg)}`, '_blank');
    };
    const handleRegistrarPagamento = async (aluno) => {
        if (confirm(`Deseja registrar o pagamento de ${aluno.nome} e renovar por +30 dias?`)) {
            try {
                const response = await axios.post(`${API_URL}/admin/alunos/${aluno.id}/pagar`);
                alert(response.data.mensagem);
                carregarDashboard();
                if (alunoSelecionado && alunoSelecionado.id === aluno.id) {
                    abrirCalendarioAluno(alunoSelecionado);
                }
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
    // ==========================================
    // CONFIRMAÇÃO DE CHECK-IN (Comando 4)
    // ==========================================
    const handleAlterarStatusPresenca = async (presencaId, novoStatus, justificativa) => {
        try {
            await axios.patch(`${API_URL}/admin/presencas/${presencaId}/status`, {
                status: novoStatus,
                justificativa
            });
            // Atualiza estado local de presenças
            setPresencas(prev => prev.map(p => p.id === presencaId ? { ...p, status: novoStatus, justificativa } : p));
            // Se o calendário estiver aberto, recarrega
            if (alunoSelecionado) {
                carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
            }
        }
        catch (error) {
            alert('Erro ao atualizar presença.');
        }
    };
    // ==========================================
    // CALENDÁRIO DO ALUNO (Comando 2 e 5)
    // ==========================================
    const abrirCalendarioAluno = async (aluno) => {
        setAlunoSelecionado(aluno);
        setMesCalendario(new Date().getMonth() + 1);
        setAnoCalendario(new Date().getFullYear());
        await carregarDadosCalendario(aluno.id, new Date().getMonth() + 1, new Date().getFullYear());
    };
    const carregarDadosCalendario = async (alunoId, mes, ano) => {
        setLoadingCalendario(true);
        try {
            const res = await axios.get(`${API_URL}/admin/alunos/${alunoId}/calendario`, {
                params: { mes, ano }
            });
            setCalendarioDados(res.data);
        }
        catch (error) {
            console.error('Erro ao carregar calendário do aluno', error);
        }
        finally {
            setLoadingCalendario(false);
        }
    };
    const mudarMesCalendario = (delta) => {
        let novoMes = mesCalendario + delta;
        let novoAno = anoCalendario;
        if (novoMes > 12) {
            novoMes = 1;
            novoAno += 1;
        }
        else if (novoMes < 1) {
            novoMes = 12;
            novoAno -= 1;
        }
        setMesCalendario(novoMes);
        setAnoCalendario(novoAno);
        if (alunoSelecionado) {
            carregarDadosCalendario(alunoSelecionado.id, novoMes, novoAno);
        }
    };
    const abrirAcaoDia = (dataIso) => {
        setDiaSelecionadoAcao(dataIso);
        const presencasDoDia = calendarioDados?.presencasPorDia?.[dataIso] || [];
        const presencaAtual = presencasDoDia[0];
        setJustificativaInput(presencaAtual?.justificativa || '');
        setModalAcaoDia(true);
    };
    const salvarPresencaNoDia = async (status) => {
        if (!alunoSelecionado || !diaSelecionadoAcao)
            return;
        try {
            await axios.post(`${API_URL}/admin/alunos/${alunoSelecionado.id}/presenca`, {
                data: diaSelecionadoAcao,
                status,
                justificativa: status === 'JUSTIFICADO' ? (justificativaInput || 'Falta Justificada') : null
            });
            setModalAcaoDia(false);
            carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
            carregarDashboard();
        }
        catch (error) {
            alert('Erro ao salvar presença no calendário.');
        }
    };
    const removerPresencaDoDia = async () => {
        if (!alunoSelecionado || !diaSelecionadoAcao)
            return;
        if (confirm('Deseja remover o registro deste dia?')) {
            try {
                await axios.delete(`${API_URL}/admin/alunos/${alunoSelecionado.id}/presenca`, {
                    data: { data: diaSelecionadoAcao }
                });
                setModalAcaoDia(false);
                carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
                carregarDashboard();
            }
            catch (error) {
                alert('Erro ao remover registro.');
            }
        }
    };
    // ==========================================
    // AULAS EXPERIMENTAIS (Comando 3)
    // ==========================================
    const marcarAulaRealizada = async (agendamentoId) => {
        if (confirm('Confirmar que a pessoa realizou a aula experimental? Ela irá para a tabela de Follow-up para fechar contrato!')) {
            try {
                await axios.patch(`${API_URL}/admin/agendamentos/${agendamentoId}`, {
                    status: 'REALIZADA'
                });
                carregarDashboard();
                setSubAbaExperimental('posAula'); // Direciona para a nova tabela
            }
            catch (error) {
                alert('Erro ao atualizar agendamento.');
            }
        }
    };
    const abrirModalConversao = (lead) => {
        setLeadParaConverter(lead);
        setPlanoConversao('2x na semana');
        setValorConversao('130');
    };
    const converterLeadEmAluno = async (e) => {
        e.preventDefault();
        if (!leadParaConverter)
            return;
        try {
            const res = await axios.post(`${API_URL}/admin/agendamentos/${leadParaConverter.id}/converter`, {
                plano: planoConversao,
                valorMensalidade: valorConversao
            });
            alert(`${res.data.mensagem}\n\nSenha temporária: ${res.data.senhaTemporaria}`);
            setLeadParaConverter(null);
            carregarDashboard();
        }
        catch (error) {
            alert(error.response?.data?.erro || 'Erro ao matricular aluno.');
        }
    };
    const marcarComoDesistente = async (agendamentoId) => {
        if (confirm('Deseja arquivar este contato como desistente?')) {
            try {
                await axios.patch(`${API_URL}/admin/agendamentos/${agendamentoId}`, {
                    status: 'DESISTIU'
                });
                carregarDashboard();
            }
            catch (error) {
                alert('Erro ao arquivar contato.');
            }
        }
    };
    const handleCpfChange = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        setNovoAluno({ ...novoAluno, cpf: v });
    };
    // Contagem de check-ins pendentes
    const checkinsPendentesCount = presencas.filter(p => p.status === 'AGENDADO').length;
    // TELA DE LOGIN
    if (!isLoggedIn) {
        return (_jsx("div", { className: "fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-black text-white tracking-widest mb-1", children: "BOR\u00DC" }), _jsx("p", { className: "text-red-500 font-bold text-sm tracking-widest uppercase", children: "Acesso Professor" })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 text-sm font-semibold mb-2", children: "Senha de Acesso" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", className: "w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30", children: "Entrar no Painel" })] }), _jsx(Link, { to: "/", className: "block text-center mt-6 text-zinc-500 hover:text-white text-sm transition", children: "\u2190 Voltar ao site" })] }) }));
    }
    // Meses para o calendário
    const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return (_jsx("div", { className: "fixed inset-0 overflow-y-auto bg-[#0B0B0C] text-zinc-100 font-sans p-4 sm:p-6 z-[9999]", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-8", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl sm:text-3xl font-black tracking-wider text-white", children: ["PAINEL ", _jsx("span", { className: "text-red-600", children: "DO PROFESSOR" })] }), _jsx("p", { className: "text-zinc-400 mt-1", children: "CT BOR\u00DC Muay Thai \u2014 Gest\u00E3o de Alunos, Presen\u00E7as e Follow-up" })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(Link, { to: "/", onClick: () => setIsLoggedIn(false), className: "px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition", children: "Sair (Logout)" }) })] }), loading ? (_jsx("div", { className: "text-center py-20 text-zinc-500", children: "Carregando dados do servidor..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsx("p", { className: "text-zinc-400 text-sm font-semibold mb-1", children: "Total de Alunos Matriculados" }), _jsx("p", { className: "text-4xl font-black text-white", children: metricas.totalAlunos })] }), _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-xl p-6", children: [_jsx("p", { className: "text-zinc-400 text-sm font-semibold mb-1", children: "Mensalidades em Dia" }), _jsx("p", { className: "text-4xl font-black text-green-500", children: metricas.assinaturasAtivas })] }), _jsxs("div", { className: "bg-[#141416] border border-red-900/30 rounded-xl p-6", children: [_jsx("p", { className: "text-zinc-400 text-sm font-semibold mb-1", children: "Mensalidades em Atraso" }), _jsx("p", { className: "text-4xl font-black text-red-500", children: metricas.inadimplentes })] })] }), checkinsPendentesCount > 0 && (_jsxs("div", { className: "bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: "\u23F3" }), _jsxs("div", { children: [_jsxs("h4", { className: "font-bold text-amber-400", children: ["Voc\u00EA tem ", checkinsPendentesCount, " check-in(s) aguardando confirma\u00E7\u00E3o de presen\u00E7a!"] }), _jsx("p", { className: "text-xs text-zinc-400", children: "Alunos deram check-in no aplicativo. D\u00EA o OK para confirmar que estavam presentes no treino." })] })] }), _jsx("button", { onClick: () => setAbaAtiva('presencas'), className: "px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-lg uppercase tracking-wider transition whitespace-nowrap", children: "Confirmar Presen\u00E7as Agora" })] })), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white shadow-2xl", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Cadastrar Novo Aluno" }), _jsxs("form", { onSubmit: criarAluno, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "Nome Completo" }), _jsx("input", { required: true, type: "text", value: novoAluno.nome, onChange: (e) => setNovoAluno({ ...novoAluno, nome: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "CPF" }), _jsx("input", { required: true, type: "text", maxLength: 14, value: novoAluno.cpf, onChange: handleCpfChange, className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500", placeholder: "000.000.000-00" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "WhatsApp" }), _jsx("input", { type: "text", value: novoAluno.telefone, onChange: (e) => setNovoAluno({ ...novoAluno, telefone: e.target.value }), placeholder: "(69) 99999-9999", className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "E-mail (Opcional)" }), _jsx("input", { type: "email", value: novoAluno.email, onChange: (e) => setNovoAluno({ ...novoAluno, email: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "Plano Escolhido" }), _jsxs("select", { value: novoAluno.plano, onChange: (e) => setNovoAluno({ ...novoAluno, plano: e.target.value }), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500", children: [_jsx("option", { value: "2x na semana", children: "2x na semana (R$ 130)" }), _jsx("option", { value: "3x na semana", children: "3x na semana (R$ 160)" }), _jsx("option", { value: "Todos os Hor\u00E1rios", children: "Todos os Hor\u00E1rios (R$ 280)" }), _jsx("option", { value: "Di\u00E1ria", children: "Di\u00E1ria (R$ 40)" })] })] }), _jsxs("div", { className: "flex gap-4 pt-4", children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), className: "flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition", children: "Cancelar" }), _jsx("button", { type: "submit", className: "flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-bold transition shadow-lg shadow-red-600/30", children: "Cadastrar" })] })] })] }) })), leadParaConverter && (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-8 rounded-2xl w-full max-w-md text-white shadow-2xl", children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Matricular Lead" }), _jsxs("p", { className: "text-sm text-zinc-400 mb-6", children: ["Convertendo ", _jsx("strong", { children: leadParaConverter.nome }), " da aula experimental em Aluno Oficial."] }), _jsxs("form", { onSubmit: converterLeadEmAluno, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "WhatsApp" }), _jsx("input", { disabled: true, type: "text", value: leadParaConverter.telefone, className: "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-400" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "Plano Escolhido" }), _jsxs("select", { value: planoConversao, onChange: (e) => {
                                                            setPlanoConversao(e.target.value);
                                                            if (e.target.value === '2x na semana')
                                                                setValorConversao('130');
                                                            else if (e.target.value === '3x na semana')
                                                                setValorConversao('160');
                                                            else if (e.target.value === 'Todos os Horários')
                                                                setValorConversao('280');
                                                            else
                                                                setValorConversao('40');
                                                        }, className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500", children: [_jsx("option", { value: "2x na semana", children: "2x na semana (R$ 130)" }), _jsx("option", { value: "3x na semana", children: "3x na semana (R$ 160)" }), _jsx("option", { value: "Todos os Hor\u00E1rios", children: "Todos os Hor\u00E1rios (R$ 280)" }), _jsx("option", { value: "Di\u00E1ria", children: "Di\u00E1ria (R$ 40)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-zinc-400 mb-1", children: "Valor da Mensalidade (R$)" }), _jsx("input", { type: "number", value: valorConversao, onChange: (e) => setValorConversao(e.target.value), className: "w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500" })] }), _jsxs("div", { className: "flex gap-4 pt-4", children: [_jsx("button", { type: "button", onClick: () => setLeadParaConverter(null), className: "flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg font-bold transition", children: "Cancelar" }), _jsx("button", { type: "submit", className: "flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold transition shadow-lg shadow-green-600/30", children: "Confirmar Matr\u00EDcula" })] })] })] }) })), alunoSelecionado && (_jsx("div", { className: "fixed inset-0 bg-black/85 flex items-center justify-center z-[10000] p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 rounded-2xl w-full max-w-4xl p-6 sm:p-8 text-white max-h-[95vh] overflow-y-auto shadow-2xl", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5 mb-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h2", { className: "text-2xl font-black text-white", children: alunoSelecionado.nome }), _jsx("span", { className: "px-2.5 py-0.5 rounded text-xs font-bold bg-red-950/60 text-red-400 border border-red-800/40 uppercase", children: alunoSelecionado.plano })] }), _jsxs("p", { className: "text-xs text-zinc-400 mt-1", children: ["Prajied: ", _jsx("strong", { className: "text-white", children: alunoSelecionado.prajied || 'Branco' }), " | WhatsApp: ", alunoSelecionado.telefone || 'Não informado'] })] }), _jsx("button", { onClick: () => setAlunoSelecionado(null), className: "px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition self-end sm:self-auto", children: "\u2715 Fechar" })] }), loadingCalendario ? (_jsx("div", { className: "py-20 text-center text-zinc-500", children: "Carregando calend\u00E1rio de frequ\u00EAncia..." })) : calendarioDados && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4", children: [_jsx("p", { className: "text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1", children: "Frequ\u00EAncia no M\u00EAs" }), _jsx("div", { className: "flex items-baseline gap-2", children: _jsxs("span", { className: `text-4xl font-black ${calendarioDados.estatisticas.porcentagemPresenca >= 80 ? 'text-green-500' :
                                                                        calendarioDados.estatisticas.porcentagemPresenca >= 50 ? 'text-yellow-500' : 'text-red-500'}`, children: [calendarioDados.estatisticas.porcentagemPresenca, "%"] }) }), _jsx("div", { className: "w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${calendarioDados.estatisticas.porcentagemPresenca >= 80 ? 'bg-green-500' :
                                                                        calendarioDados.estatisticas.porcentagemPresenca >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`, style: { width: `${calendarioDados.estatisticas.porcentagemPresenca}%` } }) }), _jsx("p", { className: "text-[10px] text-zinc-500 mt-2", children: calendarioDados.estatisticas.porcentagemPresenca === 100
                                                                    ? '✓ 100% de presença atingida!'
                                                                    : `Meta: ${calendarioDados.estatisticas.aulasEsperadasNoMes} aulas` })] }), _jsxs("div", { className: "bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4", children: [_jsx("p", { className: "text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1", children: "Presen\u00E7as Confirmadas" }), _jsx("p", { className: "text-3xl font-black text-green-400", children: calendarioDados.estatisticas.presentes }), _jsxs("p", { className: "text-[11px] text-zinc-400 mt-2", children: ["De ", calendarioDados.estatisticas.aulasEsperadasNoMes, " aulas esperadas (", calendarioDados.estatisticas.aulasPorSemana, "x/sem)"] })] }), _jsxs("div", { className: "bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4", children: [_jsx("p", { className: "text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1", children: "Faltas Justificadas" }), _jsx("p", { className: "text-3xl font-black text-blue-400", children: calendarioDados.estatisticas.justificadas }), _jsx("p", { className: "text-[11px] text-blue-400/80 mt-2", children: "Abonadas na porcentagem" })] }), _jsxs("div", { className: "bg-[#1A1A1E] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1", children: "Status Mensalidade" }), calendarioDados.mensalidade.diasParaVencer === null ? (_jsx("p", { className: "text-lg font-bold text-zinc-500", children: "Sem mensalidade" })) : calendarioDados.mensalidade.diasParaVencer < 0 ? (_jsxs("p", { className: "text-lg font-black text-red-500", children: ["Atrasado h\u00E1 ", Math.abs(calendarioDados.mensalidade.diasParaVencer), " dias"] })) : (_jsxs("p", { className: "text-lg font-black text-green-500", children: ["Em dia (Faltam ", calendarioDados.mensalidade.diasParaVencer, " dias)"] }))] }), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx("button", { onClick: () => handleCobrar(alunoSelecionado), className: "flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded transition border border-zinc-700 text-center", children: "\uD83D\uDCF2 Notificar Whats" }), _jsx("button", { onClick: () => handleRegistrarPagamento(alunoSelecionado), className: "py-1.5 px-2 bg-green-600 hover:bg-green-700 text-[10px] font-bold rounded transition text-center", children: "+30d" })] })] })] }), _jsxs("div", { className: "flex justify-between items-center bg-[#1A1A1E] p-4 rounded-xl border border-zinc-800", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: "\uD83D\uDCC5" }), _jsxs("h3", { className: "text-base font-bold text-white", children: [mesesNomes[mesCalendario - 1], " de ", anoCalendario] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => mudarMesCalendario(-1), className: "px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition", children: "\u2190 Anterior" }), _jsx("button", { onClick: () => mudarMesCalendario(1), className: "px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition", children: "Pr\u00F3ximo \u2192" })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2", children: [_jsx("div", { children: "Dom" }), _jsx("div", { children: "Seg" }), _jsx("div", { children: "Ter" }), _jsx("div", { children: "Qua" }), _jsx("div", { children: "Qui" }), _jsx("div", { children: "Sex" }), _jsx("div", { children: "S\u00E1b" })] }), _jsx("div", { className: "grid grid-cols-7 gap-2", children: (() => {
                                                            const primeiroDiaSemana = new Date(anoCalendario, mesCalendario - 1, 1).getDay();
                                                            const totalDiasNoMes = new Date(anoCalendario, mesCalendario, 0).getDate();
                                                            const items = [];
                                                            for (let i = 0; i < primeiroDiaSemana; i++) {
                                                                items.push(_jsx("div", { className: "h-24 rounded-xl bg-zinc-900/30" }, `empty-${i}`));
                                                            }
                                                            for (let d = 1; d <= totalDiasNoMes; d++) {
                                                                const dataIso = `${anoCalendario}-${String(mesCalendario).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                                const presencasDoDia = calendarioDados.presencasPorDia?.[dataIso] || [];
                                                                const ehHoje = new Date().toISOString().split('T')[0] === dataIso;
                                                                const presencaConfirmada = presencasDoDia.find((p) => p.status === 'PRESENTE');
                                                                const faltaJustificada = presencasDoDia.find((p) => p.status === 'JUSTIFICADO');
                                                                const checkinPendente = presencasDoDia.find((p) => p.status === 'AGENDADO');
                                                                const ausente = presencasDoDia.find((p) => p.status === 'AUSENTE');
                                                                items.push(_jsxs("div", { onClick: () => abrirAcaoDia(dataIso), className: `min-h-[96px] p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition hover:border-red-500/80 hover:scale-[1.02] ${presencaConfirmada
                                                                        ? 'bg-green-500/15 border-green-500/40 text-white'
                                                                        : faltaJustificada
                                                                            ? 'bg-blue-500/15 border-blue-500/40 text-white'
                                                                            : checkinPendente
                                                                                ? 'bg-amber-500/15 border-amber-500/40 text-white'
                                                                                : ausente
                                                                                    ? 'bg-red-500/15 border-red-500/30 text-white'
                                                                                    : ehHoje
                                                                                        ? 'bg-[#1A1A1E] border-red-500 text-white shadow-md shadow-red-500/10'
                                                                                        : 'bg-[#1A1A1E] border-zinc-800/80 text-zinc-400 hover:bg-[#202025]'}`, children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: `text-sm font-black ${ehHoje ? 'text-red-500' : 'text-zinc-200'}`, children: d }), ehHoje && _jsx("span", { className: "text-[8px] bg-red-600 text-white px-1 py-0.5 rounded font-bold uppercase", children: "Hoje" })] }), _jsxs("div", { className: "space-y-1 mt-1", children: [presencaConfirmada && (_jsxs("div", { className: "text-[10px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate", children: [_jsx("span", { children: "\u2713" }), " Presente"] })), faltaJustificada && (_jsxs("div", { className: "text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate", title: faltaJustificada.justificativa || 'Falta Justificada', children: [_jsx("span", { children: "\u2139\uFE0F" }), " ", faltaJustificada.justificativa || 'Justificada'] })), checkinPendente && (_jsxs("div", { className: "text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate animate-pulse", children: [_jsx("span", { children: "\u23F3" }), " Aguardando OK"] })), ausente && (_jsxs("div", { className: "text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 truncate", children: [_jsx("span", { children: "\u2717" }), " Falta"] })), !presencaConfirmada && !faltaJustificada && !checkinPendente && !ausente && (_jsx("span", { className: "text-[10px] text-zinc-600 opacity-0 hover:opacity-100 transition block text-center", children: "+ Registrar" }))] })] }, `day-${d}`));
                                                            }
                                                            return items;
                                                        })() })] }), _jsxs("div", { className: "bg-[#1A1A1E] p-4 rounded-xl border border-zinc-800 flex flex-wrap justify-between items-center gap-4 text-xs text-zinc-400", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-green-500" }), _jsx("span", { children: "Presen\u00E7a Confirmada" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-blue-400" }), _jsx("span", { children: "Falta Justificada (Abonada)" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-amber-400" }), _jsx("span", { children: "Check-in Pendente" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-red-500" }), _jsx("span", { children: "Falta (Ausente)" })] })] }), _jsxs("p", { className: "text-zinc-500 text-[11px]", children: ["\uD83D\uDCA1 Clique em qualquer dia do calend\u00E1rio para marcar ", _jsx("strong", { children: "Presen\u00E7a" }), " ou ", _jsx("strong", { children: "Falta Justificada" }), "."] })] })] }))] }) })), modalAcaoDia && (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-[10001] px-4", children: _jsxs("div", { className: "bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-sm text-white shadow-2xl", children: [_jsxs("h3", { className: "text-lg font-bold mb-1", children: ["Gerenciar Dia: ", diaSelecionadoAcao?.split('-').reverse().join('/')] }), _jsxs("p", { className: "text-xs text-zinc-400 mb-4", children: ["Aluno: ", _jsx("strong", { children: alunoSelecionado?.nome })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: () => salvarPresencaNoDia('PRESENTE'), className: "w-full py-2.5 bg-green-600 hover:bg-green-700 font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md shadow-green-600/20", children: "\u2713 Marcar como Presente" }), _jsxs("div", { className: "bg-[#1A1A1E] p-3 rounded-xl border border-zinc-800 space-y-2", children: [_jsx("label", { className: "block text-xs font-semibold text-blue-400", children: "\uD83D\uDCCB Falta Justificada (Atestado / Motivo)" }), _jsx("input", { type: "text", placeholder: "Ex: Atestado m\u00E9dico, trabalho...", value: justificativaInput, onChange: (e) => setJustificativaInput(e.target.value), className: "w-full bg-[#141416] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500" }), _jsx("button", { onClick: () => salvarPresencaNoDia('JUSTIFICADO'), className: "w-full py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-xs transition", children: "Salvar Falta Justificada" })] }), _jsx("button", { onClick: () => salvarPresencaNoDia('AUSENTE'), className: "w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-xs transition", children: "Marcar como Falta (N\u00E3o Compareceu)" }), _jsx("button", { onClick: removerPresencaDoDia, className: "w-full py-2 text-red-500 hover:text-red-400 text-xs font-bold transition", children: "\uD83D\uDDD1\uFE0F Limpar / Remover Registro Deste Dia" }), _jsx("button", { onClick: () => setModalAcaoDia(false), className: "w-full py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition mt-2", children: "Cancelar" })] })] }) })), _jsxs("div", { className: "flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto", children: [_jsx("button", { onClick: () => setAbaAtiva('alunos'), className: `font-bold pb-2 transition whitespace-nowrap ${abaAtiva === 'alunos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: "\uD83E\uDD4A Alunos e Mensalidades" }), _jsxs("button", { onClick: () => setAbaAtiva('agendamentos'), className: `font-bold pb-2 transition flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'agendamentos' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: ["\uD83E\uDD4B Aulas Experimentais", (agendamentos?.pendentes?.length > 0 || agendamentos?.posAula?.length > 0) && (_jsx("span", { className: "bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full", children: (agendamentos?.pendentes?.length || 0) + (agendamentos?.posAula?.length || 0) }))] }), _jsxs("button", { onClick: () => setAbaAtiva('presencas'), className: `font-bold pb-2 transition flex items-center gap-2 whitespace-nowrap ${abaAtiva === 'presencas' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`, children: ["\uD83D\uDCCB Frequ\u00EAncia e Check-ins", checkinsPendentesCount > 0 && (_jsx("span", { className: "bg-amber-500 text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-full animate-bounce", children: checkinsPendentesCount }))] })] }), abaAtiva === 'alunos' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl", children: [_jsxs("div", { className: "p-6 border-b border-zinc-800 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Alunos Matriculados" }), _jsx("p", { className: "text-xs text-zinc-400 mt-0.5", children: "Clique em \"Calend\u00E1rio\" para ver a frequ\u00EAncia em tempo real e justificar faltas." })] }), _jsx("button", { onClick: () => setShowModal(true), className: "text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition shadow-md shadow-red-600/30", children: "+ Novo Aluno" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Aluno" }), _jsx("th", { className: "px-6 py-4", children: "Plano" }), _jsx("th", { className: "px-6 py-4", children: "Prajied" }), _jsx("th", { className: "px-6 py-4", children: "Vencimento" }), _jsx("th", { className: "px-6 py-4", children: "Status" }), _jsx("th", { className: "px-6 py-4 text-right", children: "A\u00E7\u00F5es" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [alunos.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-zinc-500", children: "Nenhum aluno cadastrado no banco de dados ainda." }) })), alunos.map((aluno) => (_jsxs("tr", { className: "hover:bg-[#1A1A1E]/50 transition", children: [_jsxs("td", { className: "px-6 py-4", children: [_jsx("p", { className: "font-bold text-white", children: aluno.nome }), _jsx("p", { className: "text-xs text-zinc-500", children: aluno.telefone || aluno.cpf })] }), _jsx("td", { className: "px-6 py-4 text-zinc-300 font-semibold", children: aluno.plano }), _jsx("td", { className: "px-6 py-4", children: _jsxs("select", { value: aluno.prajied || 'Branco', onChange: (e) => atualizarPrajied(aluno.id, e.target.value), className: "bg-[#1A1A1E] border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500", children: [_jsx("option", { value: "Branco", children: "Branco" }), _jsx("option", { value: "Branco e Vermelho", children: "Branco e Vermelho" }), _jsx("option", { value: "Vermelho", children: "Vermelho" }), _jsx("option", { value: "Vermelho e Azul", children: "Vermelho e Azul" }), _jsx("option", { value: "Azul Claro", children: "Azul Claro" }), _jsx("option", { value: "Azul Escuro", children: "Azul Escuro (Instrutor)" }), _jsx("option", { value: "Preto", children: "Preto (Mestre)" })] }) }), _jsx("td", { className: "px-6 py-4", children: aluno.diasVencimento === null ? (_jsx("span", { className: "text-zinc-600", children: "-" })) : aluno.diasVencimento < 0 ? (_jsxs("span", { className: "text-red-500 font-bold", children: ["Atrasado h\u00E1 ", Math.abs(aluno.diasVencimento), " dias"] })) : aluno.diasVencimento === 0 ? (_jsx("span", { className: "text-amber-500 font-bold", children: "Vence hoje!" })) : (_jsxs("span", { className: "text-zinc-300 font-semibold", children: ["Faltam ", aluno.diasVencimento, " dias"] })) }), _jsx("td", { className: "px-6 py-4", children: aluno.status === 'PAGO' ? (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase", children: "Em Dia" })) : (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase", children: "Pendente" })) }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("button", { onClick: () => abrirCalendarioAluno(aluno), className: "px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition flex items-center gap-1 shadow-sm", title: "Abrir Calend\u00E1rio de Frequ\u00EAncia", children: "\uD83D\uDCC5 Calend\u00E1rio" }), _jsx("button", { onClick: () => handleRegistrarPagamento(aluno), className: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded transition", title: "Registrar Pagamento de Mensalidade", children: "Pago" }), _jsx("button", { onClick: () => handleCobrar(aluno), className: "px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium text-xs rounded transition", title: "Cobrar / Lembrete via WhatsApp", children: "Cobrar" })] }) })] }, aluno.id)))] })] }) })] })) : abaAtiva === 'agendamentos' ? (
                        /* ABA 2: AULAS EXPERIMENTAIS COM 2 TABELAS (Comando 3) */
                        _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex gap-3 bg-[#141416] p-2 rounded-xl border border-zinc-800 w-fit", children: [_jsxs("button", { onClick: () => setSubAbaExperimental('pendentes'), className: `px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${subAbaExperimental === 'pendentes' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`, children: ["1. Aulas a Realizar (Agendamentos)", agendamentos?.pendentes?.length > 0 && (_jsx("span", { className: "bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]", children: agendamentos.pendentes.length }))] }), _jsxs("button", { onClick: () => setSubAbaExperimental('posAula'), className: `px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${subAbaExperimental === 'posAula' ? 'bg-amber-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'}`, children: ["2. P\u00F3s-Aula (Aguardando Fechar Contrato)", agendamentos?.posAula?.length > 0 && (_jsx("span", { className: "bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px]", children: agendamentos.posAula.length }))] })] }), subAbaExperimental === 'pendentes' ? (_jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl", children: [_jsxs("div", { className: "p-6 border-b border-zinc-800", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Agendamentos de Aula Experimental (Aguardando Treino)" }), _jsxs("p", { className: "text-xs text-zinc-400 mt-1", children: ["Pessoas que agendaram pelo site. Quando a pessoa comparecer ao treino, clique em ", _jsx("strong", { children: "\"Fez a Aula\"" }), " para acompanhar o fechamento de contrato."] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Nome" }), _jsx("th", { className: "px-6 py-4", children: "WhatsApp" }), _jsx("th", { className: "px-6 py-4", children: "Dia Marcado" }), _jsx("th", { className: "px-6 py-4", children: "Hor\u00E1rio" }), _jsx("th", { className: "px-6 py-4 text-right", children: "A\u00E7\u00E3o" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [(!agendamentos?.pendentes || agendamentos.pendentes.length === 0) && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-8 text-center text-zinc-500", children: "Nenhum agendamento experimental pendente no momento." }) })), agendamentos?.pendentes?.map((ag) => (_jsxs("tr", { className: "hover:bg-[#1A1A1E]/50 transition", children: [_jsx("td", { className: "px-6 py-4 font-bold text-white", children: ag.nome }), _jsx("td", { className: "px-6 py-4 text-zinc-400", children: ag.telefone }), _jsx("td", { className: "px-6 py-4 font-bold text-amber-500", children: ag.data }), _jsx("td", { className: "px-6 py-4 font-bold text-white", children: ag.horario }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("a", { href: `https://wa.me/55${ag.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${ag.nome}, confirmamos seu agendamento para a aula experimental de Muay Thai no CT BORÜ na ${ag.data} às ${ag.horario}! Estamos ansiosos para te receber no tatame.`)}`, target: "_blank", className: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition flex items-center gap-1", children: "\uD83D\uDCF2 Whats" }), _jsx("button", { onClick: () => marcarAulaRealizada(ag.id), className: "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm", children: "\u2713 Fez a Aula" }), _jsx("button", { onClick: () => marcarComoDesistente(ag.id), className: "px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition", title: "N\u00E3o compareceu / Cancelar", children: "\u2715" })] }) })] }, ag.id)))] })] }) })] })) : (
                                /* TABELA 2: PÓS-AULA EXPERIMENTAL (Comando 3: Dias desde a aula para mandar msg e chamar para o CT) */
                                _jsxs("section", { className: "bg-[#141416] border border-amber-500/20 rounded-xl overflow-hidden shadow-2xl", children: [_jsx("div", { className: "p-6 border-b border-zinc-800 bg-amber-500/5", children: _jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-bold text-white flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDD25" }), " Leads P\u00F3s-Aula Experimental (Aguardando Fechar Contrato)"] }), _jsx("p", { className: "text-xs text-zinc-400 mt-1", children: "Pessoas que j\u00E1 treinaram no CT mas ainda n\u00E3o fecharam plano. Acompanhe os dias e mande mensagem pelo WhatsApp para fechar a matr\u00EDcula!" })] }), _jsxs("span", { className: "px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold", children: [agendamentos?.posAula?.length || 0, " em negocia\u00E7\u00E3o"] })] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Nome do Lead" }), _jsx("th", { className: "px-6 py-4", children: "WhatsApp" }), _jsx("th", { className: "px-6 py-4", children: "Data que Treinou" }), _jsx("th", { className: "px-6 py-4", children: "Dias Desde a Aula" }), _jsx("th", { className: "px-6 py-4 text-right", children: "A\u00E7\u00E3o / Follow-up" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [(!agendamentos?.posAula || agendamentos.posAula.length === 0) && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-10 text-center text-zinc-500", children: "Nenhum lead aguardando fechamento de contrato no momento." }) })), agendamentos?.posAula?.map((lead) => {
                                                                const dias = lead.diasDesdeAula;
                                                                const tel = lead.telefone.replace(/\D/g, '');
                                                                const msgFollowUp = encodeURIComponent(`Olá ${lead.nome}, tudo bem? Aqui é o Professor Felipe do CT BORÜ Muay Thai! Vimos que você fez sua aula experimental com a gente ${dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`}. O que achou do treino? Temos uma condição muito bacana para você começar seus treinos essa semana! Bora voltar pro tatame?`);
                                                                return (_jsxs("tr", { className: "hover:bg-[#1A1A1E]/50 transition", children: [_jsx("td", { className: "px-6 py-4 font-bold text-white text-base", children: lead.nome }), _jsx("td", { className: "px-6 py-4 text-zinc-300 font-mono", children: lead.telefone }), _jsx("td", { className: "px-6 py-4 text-zinc-400 text-xs", children: lead.dataRealizadaFormatada }), _jsx("td", { className: "px-6 py-4", children: dias === 0 ? (_jsx("span", { className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30", children: "Treinou Hoje (0 dias)" })) : dias === 1 ? (_jsx("span", { className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30", children: "Treinou Ontem (1 dia)" })) : dias <= 4 ? (_jsxs("span", { className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30", children: ["Fez h\u00E1 ", dias, " dias"] })) : (_jsxs("span", { className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30", children: ["Fez h\u00E1 ", dias, " dias (Chamar Urgente!)"] })) }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("a", { href: `https://wa.me/55${tel}?text=${msgFollowUp}`, target: "_blank", className: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-green-600/20", title: "Mandar mensagem no WhatsApp convidando para fechar o plano", children: "\uD83D\uDCF2 Mandar Mensagem" }), _jsx("button", { onClick: () => abrirModalConversao(lead), className: "px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm", title: "Converter em Aluno Matriculado", children: "\uD83E\uDD4B Fechar Contrato" }), _jsx("button", { onClick: () => marcarComoDesistente(lead.id), className: "px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs transition", title: "Desistiu / Arquivar", children: "\u2715" })] }) })] }, lead.id));
                                                            })] })] }) })] }))] })) : abaAtiva === 'presencas' ? (
                        /* ABA 3: FREQUÊNCIA E CHECK-INS (Comando 4: Dar OK para confirmar presença) */
                        _jsxs("section", { className: "bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl", children: [_jsxs("div", { className: "p-6 border-b border-zinc-800 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Check-ins & Presen\u00E7as no Tatame" }), _jsxs("p", { className: "text-xs text-zinc-400 mt-1", children: ["Sempre que o aluno der check-in no aplicativo, d\u00EA o ", _jsx("strong", { children: "OK (Confirmar)" }), " para validar a presen\u00E7a na aula ou marque falta justificada."] })] }), _jsx("button", { onClick: carregarDashboard, className: "text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition font-semibold", children: "\u21BB Atualizar" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { className: "bg-[#1A1A1E] text-zinc-400 uppercase text-xs font-semibold", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4", children: "Data / Hora" }), _jsx("th", { className: "px-6 py-4", children: "Aluno" }), _jsx("th", { className: "px-6 py-4", children: "Plano" }), _jsx("th", { className: "px-6 py-4", children: "Aula" }), _jsx("th", { className: "px-6 py-4", children: "Status" }), _jsx("th", { className: "px-6 py-4 text-right", children: "A\u00E7\u00E3o do Professor" })] }) }), _jsxs("tbody", { className: "divide-y divide-zinc-800", children: [presencas.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-zinc-500", children: "Nenhum check-in registrado ainda." }) })), presencas.map((p) => {
                                                        const ehPendente = p.status === 'AGENDADO';
                                                        const ehPresente = p.status === 'PRESENTE';
                                                        const ehJustificado = p.status === 'JUSTIFICADO';
                                                        return (_jsxs("tr", { className: `transition ${ehPendente ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[#1A1A1E]/50'}`, children: [_jsx("td", { className: "px-6 py-4 text-zinc-400 text-xs", children: new Date(p.data || p.criadoEm).toLocaleString('pt-BR') }), _jsxs("td", { className: "px-6 py-4", children: [_jsx("p", { className: "font-bold text-white", children: p.aluno?.nome || 'Aluno' }), p.justificativa && (_jsxs("p", { className: "text-[11px] text-blue-400", children: ["Obs: ", p.justificativa] }))] }), _jsx("td", { className: "px-6 py-4 text-zinc-400 text-xs", children: p.aluno?.plano || '2x na semana' }), _jsx("td", { className: "px-6 py-4 font-semibold text-zinc-200", children: p.evento?.titulo || 'Muay Thai Tradicional' }), _jsx("td", { className: "px-6 py-4", children: ehPresente ? (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30 uppercase", children: "\u2713 Presen\u00E7a Confirmada" })) : ehJustificado ? (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase", children: "\u2139\uFE0F Falta Justificada" })) : ehPendente ? (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase animate-pulse", children: "\u23F3 Aguardando OK" })) : (_jsx("span", { className: "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase", children: "\u2717 N\u00E3o Compareceu" })) }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsx("div", { className: "flex gap-2 justify-end", children: ehPendente ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleAlterarStatusPresenca(p.id, 'PRESENTE'), className: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition shadow-sm flex items-center gap-1", title: "Dar OK e confirmar que o aluno compareceu ao treino", children: "\u2713 Confirmar Presen\u00E7a (OK)" }), _jsx("button", { onClick: () => {
                                                                                        const motivo = prompt('Informe a justificativa da falta (ex: Atestado médico, trabalho):', 'Falta justificada');
                                                                                        if (motivo !== null) {
                                                                                            handleAlterarStatusPresenca(p.id, 'JUSTIFICADO', motivo);
                                                                                        }
                                                                                    }, className: "px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition", title: "Marcar como Falta Justificada", children: "Justificada" }), _jsx("button", { onClick: () => handleAlterarStatusPresenca(p.id, 'AUSENTE'), className: "px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs transition", title: "N\u00E3o veio", children: "N\u00E3o Veio" })] })) : (_jsx("button", { onClick: () => {
                                                                                if (p.aluno) {
                                                                                    abrirCalendarioAluno(p.aluno);
                                                                                }
                                                                            }, className: "px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition", children: "\uD83D\uDCC5 Ver Calend\u00E1rio" })) }) })] }, p.id));
                                                    })] })] }) })] })) : null] }))] }) }));
}
//# sourceMappingURL=AdminDashboard.js.map
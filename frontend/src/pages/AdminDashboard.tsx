import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NoticeCard from '../components/NoticeCard';
import { adminApi, publicApi } from '../services/api';
import { AdminGamificationTab } from '../components/AdminGamificationTab';

const graduacoesPorModalidade: Record<string, string[]> = {
  'Muay Thai': [
    'Prajied Branco',
    'Prajied Branco e Amarelo',
    'Prajied Amarelo',
    'Prajied Amarelo e Branco Ponta',
    'Prajied Laranja',
    'Prajied Verde',
    'Prajied Azul Claro',
    'Prajied Azul Escuro',
    'Prajied Azul Escuro e Preto',
    'Prajied Marrom',
    'Prajied Vermelho',
    'Prajied Vermelho e Preto',
    'Prajied Preto'
  ],
  'Jiu-Jitsu': [
    'Faixa Branca',
    'Faixa Azul',
    'Faixa Roxa',
    'Faixa Marrom',
    'Faixa Preta 1º Grau',
    'Faixa Preta 2º Grau',
    'Faixa Preta 3º Grau',
    'Faixa Coral (Vermelha e Preta)',
    'Faixa Vermelha'
  ],
  'Taekwondo': [
    'Faixa Branca',
    'Faixa Amarela',
    'Faixa Verde',
    'Faixa Azul',
    'Faixa Vermelha',
    'Faixa Ponta Preta',
    'Faixa Preta 1º Dan',
    'Faixa Preta 2º Dan',
    'Faixa Preta 3º Dan',
    'Faixa Preta 4º Dan',
    'Faixa Preta 5º Dan'
  ],
  'Boxe': [
    'Sem faixa (Graduação por experiência e cartel)',
    '1 a 3 anos de prática',
    '3 a 5 anos de prática',
    '5 a 10 anos de prática',
    'Mais de 10 anos / Veterano',
    'Ex-Atleta Profissional'
  ],
  'MMA': [
    'Sem faixa (Graduação por experiência e cartel)',
    '1 a 3 anos de prática',
    '3 a 5 anos de prática',
    '5 a 10 anos de prática',
    'Mais de 10 anos / Veterano',
    'Ex-Atleta Profissional'
  ]
};

const temposDeAula = ['45 min', '60 min', '75 min', '90 min', '120 min'];
const opcoesTempoDocencia = [
  'Iniciando docência (menos de 1 ano)',
  '1 a 3 anos dando aulas',
  '3 a 5 anos dando aulas',
  '5 a 10 anos lecionando',
  'Mais de 10 anos como professor / Mestre'
];

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [metricas, setMetricas] = useState<any>({
    totalAlunos: 0,
    assinaturasAtivas: 0,
    inadimplentes: 0,
    taxaPresencaMedia: 100,
    alunosEmRisco: 0,
    presencasHoje: 0
  });
  const [alunos, setAlunos] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any>({ pendentes: [], posAula: [], finalizados: [] });
  const [presencas, setPresencas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categoriaFiltroLoja, setCategoriaFiltroLoja] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // Abas: 'alunos' | 'calendario_geral' | 'presencas' | 'avisos' | 'loja' | 'agendamentos' | 'professores'
  const [abaAtiva, setAbaAtiva] = useState('alunos');
  const [subAbaExperimental, setSubAbaExperimental] = useState<'pendentes' | 'posAula'>('pendentes');

  // Filtros e busca de Alunos
  const [buscaAluno, setBuscaAluno] = useState('');
  const [filtroAssiduidade, setFiltroAssiduidade] = useState<'TODOS' | 'ALTA' | 'REGULAR' | 'RISCO' | 'DIARIA'>('TODOS');

  // Filtros e lote em Chamada & Presenças
  const [filtroChamada, setFiltroChamada] = useState<'TODOS' | 'PRESENTE' | 'FALTA' | 'DOENCA' | 'AGENDADO'>('TODOS');
  const [selecionadosLote, setSelecionadosLote] = useState<string[]>([]);
  const [loteLoading, setLoteLoading] = useState(false);

  // Calendário Geral da Academia & Frequência Coletiva
  const [frequenciaGeral, setFrequenciaGeral] = useState<any>(null);
  const [loadingFrequenciaGeral, setLoadingFrequenciaGeral] = useState(false);
  const [mesFrequenciaGeral, setMesFrequenciaGeral] = useState(new Date().getMonth() + 1);
  const [anoFrequenciaGeral, setAnoFrequenciaGeral] = useState(new Date().getFullYear());
  const [diaSelecionadoGeral, setDiaSelecionadoGeral] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal Lançar Aluno no Dia do Calendário Geral
  const [modalLancarDia, setModalLancarDia] = useState(false);
  const [alunoLancarDia, setAlunoLancarDia] = useState('');
  const [statusLancarDia, setStatusLancarDia] = useState('PRESENTE');
  const [justificativaLancarDia, setJustificativaLancarDia] = useState('');

  // Modal Novo Aluno
  const [showModal, setShowModal] = useState(false);
  const [novoAluno, setNovoAluno] = useState({ nome: '', cpf: '', email: '', telefone: '', plano: '2x na semana' });

  // Modal Novo Professor (Apenas Admin)
  const [showModalProf, setShowModalProf] = useState(false);
  const [novoProfessor, setNovoProfessor] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    cargo: 'PROFESSOR',
    telefone: '',
    modalidade: 'Muay Thai',
    graduacao: 'Prajied Azul Escuro e Preto',
    tempoPratica: '',
    tempoDocencia: '3 a 5 anos dando aulas',
    tempoAula: '60 min',
    horariosAula: '',
    cargaHorariaSemanal: ''
  });

  // Modal Editar Professor
  const [showModalEditarProf, setShowModalEditarProf] = useState(false);
  const [professorParaEditar, setProfessorParaEditar] = useState<any>(null);

  // Modal Novo Aviso no Mural
  const [showModalAviso, setShowModalAviso] = useState(false);
  const [novoAviso, setNovoAviso] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'GERAL',
    fixado: false
  });

  // Modal Novo Produto na Loja
  const [showModalProduto, setShowModalProduto] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    categoria: 'PROTETOR_BUCAL',
    preco: '',
    estoque: '10',
    descricao: '',
    imagemUrl: ''
  });

  // Modal Calendário / Presença Detalhada do Aluno Individual
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [calendarioDados, setCalendarioDados] = useState<any>(null);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth() + 1);
  const [anoCalendario, setAnoCalendario] = useState(new Date().getFullYear());

  // Modal de Ação do Dia no Calendário Individual
  const [diaSelecionadoAcao, setDiaSelecionadoAcao] = useState<string | null>(null);
  const [statusAcaoDia, setStatusAcaoDia] = useState('PRESENTE');
  const [justificativaInput, setJustificativaInput] = useState('');
  const [tipoJustificativaInput, setTipoJustificativaInput] = useState('DOENCA');
  const [modalAcaoDia, setModalAcaoDia] = useState(false);

  // Modal Converter Experimental em Aluno
  const [leadParaConverter, setLeadParaConverter] = useState<any>(null);
  const [planoConversao, setPlanoConversao] = useState('2x na semana');
  const [valorConversao, setValorConversao] = useState('130');

  useEffect(() => {
    if (isLoggedIn) {
      carregarDashboard();
      carregarFrequenciaGeral(mesFrequenciaGeral, anoFrequenciaGeral);
    }
  }, [isLoggedIn]);

  const carregarDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, agendRes, presencasRes, avisosRes, produtosRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getAppointments(),
        adminApi.getAttendance(),
        publicApi.getNotices(),
        publicApi.getProducts()
      ]);
      setMetricas(dashRes.data.metricas);
      setAlunos(dashRes.data.alunos);
      setAgendamentos(agendRes.data);
      setPresencas(presencasRes.data);
      setAvisos(avisosRes.data);
      setProdutos(produtosRes.data);

      if (usuarioLogado?.cargo === 'ADMIN') {
        const profsRes = await adminApi.getTeachers();
        setProfessores(profsRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await adminApi.login({
        emailOuUsuario: loginInput,
        senha: password
      });
      setUsuarioLogado(response.data.usuario);
      setIsLoggedIn(true);
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao realizar login.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // PROFESSORES (Exclusivo Admin)
  // ==========================================
  const criarProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoProfessor.cargo === 'PROFESSOR' && !novoProfessor.cpf) {
      alert('O CPF do professor é obrigatório para que ele possa acessar o sistema.');
      return;
    }
    try {
      await adminApi.createTeacher(novoProfessor);
      alert(`Professor ${novoProfessor.nome} cadastrado com sucesso!\n\nEle poderá acessar o painel informando o CPF e a senha cadastrada.`);
      setShowModalProf(false);
      setNovoProfessor({
        nome: '',
        email: '',
        cpf: '',
        senha: '',
        cargo: 'PROFESSOR',
        telefone: '',
        modalidade: 'Muay Thai',
        graduacao: 'Prajied Azul Escuro e Preto',
        tempoPratica: '',
        tempoDocencia: '3 a 5 anos dando aulas',
        tempoAula: '60 min',
        horariosAula: '',
        cargaHorariaSemanal: ''
      });
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao criar professor.');
    }
  };

  const handleRedefinirSenhaProfessor = async (prof: any) => {
    const nova = prompt(`Definir NOVA SENHA para o professor ${prof.nome} (Login CPF: ${prof.cpf || 'Não informado'}):\n\n(Apenas o Administrador pode redefinir esta senha caso o professor tenha esquecido)`);
    if (!nova) return;
    if (nova.trim().length < 4) {
      alert('A senha deve conter no mínimo 4 caracteres.');
      return;
    }
    try {
      await adminApi.resetTeacherPassword(prof.id, nova.trim());
      alert(`Senha do professor ${prof.nome} alterada com sucesso para: "${nova.trim()}"!\nInforme ao professor para ele acessar com seu CPF.`);
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao redefinir senha do professor.');
    }
  };

  const abrirModalEdicaoProf = (prof: any) => {
    const mod = prof.modalidade || 'Muay Thai';
    setProfessorParaEditar({
      id: prof.id,
      nome: prof.nome,
      email: prof.email,
      cpf: prof.cpf || '',
      telefone: prof.telefone || '',
      cargo: prof.cargo || 'PROFESSOR',
      modalidade: mod,
      graduacao: prof.graduacao || prof.prajied || (graduacoesPorModalidade[mod]?.[0] || ''),
      tempoPratica: prof.tempoPratica || '',
      tempoDocencia: prof.tempoDocencia || '',
      tempoAula: prof.tempoAula || '60 min',
      horariosAula: prof.horariosAula || '',
      cargaHorariaSemanal: prof.cargaHorariaSemanal || '',
      senha: ''
    });
    setShowModalEditarProf(true);
  };

  const salvarEdicaoProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorParaEditar) return;
    try {
      const payload: any = {
        nome: professorParaEditar.nome,
        cpf: professorParaEditar.cpf,
        telefone: professorParaEditar.telefone,
        cargo: professorParaEditar.cargo,
        modalidade: professorParaEditar.modalidade,
        graduacao: professorParaEditar.graduacao,
        tempoPratica: professorParaEditar.tempoPratica,
        tempoDocencia: professorParaEditar.tempoDocencia,
        tempoAula: professorParaEditar.tempoAula,
        horariosAula: professorParaEditar.horariosAula,
        cargaHorariaSemanal: professorParaEditar.cargaHorariaSemanal
      };
      if (professorParaEditar.senha && professorParaEditar.senha.trim().length > 0) {
        payload.senha = professorParaEditar.senha.trim();
      }
      await adminApi.updateTeacher(professorParaEditar.id, payload);
      alert('Dados do professor atualizados com sucesso!');
      setShowModalEditarProf(false);
      setProfessorParaEditar(null);
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao atualizar dados do professor.');
    }
  };

  const removerProfessor = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o professor(a) ${nome}?`)) {
      try {
        await adminApi.deleteTeacher(id);
        alert('Professor removido.');
        carregarDashboard();
      } catch (error) {
        alert('Erro ao remover professor.');
      }
    }
  };

  // ==========================================
  // MURAL DE AVISOS
  // ==========================================
  const criarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createNotice({
        ...novoAviso,
        autorNome: usuarioLogado?.nome || 'Felipe Borü',
        autorCargo: usuarioLogado?.cargo === 'ADMIN' ? 'Administrador' : 'Professor'
      });
      alert('Aviso publicado no mural com sucesso!');
      setShowModalAviso(false);
      setNovoAviso({ titulo: '', conteudo: '', tipo: 'GERAL', fixado: false });
      carregarDashboard();
    } catch (error) {
      alert('Erro ao criar aviso.');
    }
  };

  const removerAviso = async (id: string) => {
    if (confirm('Deseja excluir este comunicado do mural?')) {
      try {
        await adminApi.deleteNotice(id);
        carregarDashboard();
      } catch (error) {
        alert('Erro ao excluir aviso.');
      }
    }
  };

  // ==========================================
  // LOJA & MERCADO (BETA)
  // ==========================================
  const criarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createProduct(novoProduto);
      alert('Produto adicionado ao catálogo da loja!');
      setShowModalProduto(false);
      setNovoProduto({ nome: '', categoria: 'PROTETOR_BUCAL', preco: '', estoque: '10', descricao: '', imagemUrl: '' });
      carregarDashboard();
    } catch (error) {
      alert('Erro ao cadastrar produto.');
    }
  };

  const removerProduto = async (id: string) => {
    if (confirm('Deseja excluir este produto do estoque?')) {
      try {
        await adminApi.deleteProduct(id);
        carregarDashboard();
      } catch (error) {
        alert('Erro ao remover produto.');
      }
    }
  };

  // ==========================================
  // ALUNOS & MENSALIDADES
  // ==========================================
  const criarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminApi.createStudent(novoAluno);
      alert(`Aluno criado com sucesso!\n\nSenha temporária gerada: ${response.data.senhaTemporaria}\n(Envie isso para o aluno acessar o portal)`);
      carregarDashboard();
      setShowModal(false);
      setNovoAluno({ nome: '', cpf: '', email: '', telefone: '', plano: '2x na semana' });
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao criar aluno.');
    }
  };

  const handleRegistrarPagamento = async (aluno: any) => {
    if (confirm(`Confirmar recebimento presencial da mensalidade de ${aluno.nome} (Dinheiro/PIX/Cartão no balcão) e renovar por +30 dias?`)) {
      try {
        const response = await adminApi.registerPayment(aluno.id);
        alert(response.data.mensagem);
        carregarDashboard();
        if (alunoSelecionado && alunoSelecionado.id === aluno.id) {
          abrirCalendarioAluno(alunoSelecionado);
        }
      } catch (error: any) {
        alert(error.response?.data?.erro || 'Erro ao registrar pagamento.');
      }
    }
  };

  const atualizarPrajied = async (alunoId: string, prajied: string) => {
    try {
      await adminApi.updateStudentGrade(alunoId, { prajied });
      alert(`Graduação alterada para ${prajied} com sucesso!`);
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao atualizar Prajied.');
    }
  };

  const isDiariaOuConvenio = (plano?: string) => {
    if (!plano) return false;
    const p = plano.toLowerCase();
    return p.includes('diária') || p.includes('diaria') || p.includes('wellhub') || p.includes('totalpass') || p.includes('gympass');
  };

  const atualizarPlanoAluno = async (alunoId: string, plano: string) => {
    try {
      await adminApi.updateStudent(alunoId, { plano });
      alert(`Plano do aluno alterado para "${plano}" com sucesso!`);
      carregarDashboard();
    } catch (error: any) {
      alert(error.response?.data?.erro || 'Erro ao atualizar plano do aluno.');
    }
  };

  const formatarWhatsUrl = (telefone: string, mensagem: string) => {
    let limpo = (telefone || '').replace(/\D/g, '');
    if (!limpo) return '#';
    if (!limpo.startsWith('55') && (limpo.length === 10 || limpo.length === 11)) {
      limpo = '55' + limpo;
    }
    return `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`;
  };

  const handleCobrar = (aluno: any) => {
    if (!aluno.telefone) {
      alert(`O aluno ${aluno.nome} não possui número de telefone cadastrado.`);
      return;
    }
    const dias = aluno.diasVencimento;
    let msg = '';
    if (isDiariaOuConvenio(aluno.plano)) {
      msg = `Olá ${aluno.nome}, aqui é do CT BORÜ Muay Thai! Tudo bem? Passando para saber quando você vem treinar conosco esta semana! Qualquer dúvida sobre os horários ou validação de passe (Wellhub/TotalPass/Diária), estamos à disposição. Oss!`;
    } else if (dias === null) {
      msg = `Olá ${aluno.nome}, aqui é do CT BORÜ Muay Thai! Tudo bem? Passando para regularizar sua matrícula presencialmente no balcão.`;
    } else if (dias < 0) {
      msg = `Olá ${aluno.nome}, tudo bem? Aqui é do CT BORÜ. Sua mensalidade venceu há ${Math.abs(dias)} dias. Por favor, acerte presencialmente na recepção ou via PIX (+55 69 9238-4491) para manter seu acesso aos treinos!`;
    } else if (dias === 0) {
      msg = `Olá ${aluno.nome}, passando para avisar que sua mensalidade no CT BORÜ vence hoje! O acerto pode ser feito na recepção no início do treino.`;
    } else {
      msg = `Olá ${aluno.nome}, tudo bem? Passando para lembrar que sua mensalidade no CT BORÜ vence em ${dias} dias. Bons treinos!`;
    }
    window.open(formatarWhatsUrl(aluno.telefone, msg), '_blank');
  };

  // ==========================================
  // CALENDÁRIO & FREQUÊNCIA DETALHADA
  // ==========================================
  const abrirCalendarioAluno = async (aluno: any) => {
    setAlunoSelecionado(aluno);
    setMesCalendario(new Date().getMonth() + 1);
    setAnoCalendario(new Date().getFullYear());
    await carregarDadosCalendario(aluno.id, new Date().getMonth() + 1, new Date().getFullYear());
  };

  const carregarDadosCalendario = async (alunoId: string, mes: number, ano: number) => {
    setLoadingCalendario(true);
    try {
      const res = await adminApi.getStudentCalendar(alunoId, { mes, ano });
      setCalendarioDados(res.data);
    } catch (error) {
      console.error('Erro ao carregar calendário do aluno', error);
    } finally {
      setLoadingCalendario(false);
    }
  };

  const mudarMesCalendario = (delta: number) => {
    let novoMes = mesCalendario + delta;
    let novoAno = anoCalendario;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }
    setMesCalendario(novoMes);
    setAnoCalendario(novoAno);
    if (alunoSelecionado) {
      carregarDadosCalendario(alunoSelecionado.id, novoMes, novoAno);
    }
  };

  const abrirAcaoDia = (dataIso: string) => {
    setDiaSelecionadoAcao(dataIso);
    const presencasDoDia = calendarioDados?.presencasPorDia?.[dataIso] || [];
    const presencaAtual = presencasDoDia[0];
    setStatusAcaoDia(presencaAtual?.status || 'PRESENTE');
    setJustificativaInput(presencaAtual?.justificativa || '');
    setTipoJustificativaInput(presencaAtual?.tipoJustificativa || 'DOENCA');
    setModalAcaoDia(true);
  };

  const salvarPresencaNoDia = async () => {
    if (!alunoSelecionado || !diaSelecionadoAcao) return;
    try {
      await adminApi.saveStudentAttendance(alunoSelecionado.id, {
        data: diaSelecionadoAcao,
        status: statusAcaoDia,
        justificativa: justificativaInput || null,
        tipoJustificativa: statusAcaoDia === 'DOENCA' ? 'DOENCA' : (statusAcaoDia === 'JUSTIFICADO' ? tipoJustificativaInput : null)
      });
      setModalAcaoDia(false);
      carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
      carregarDashboard();
    } catch (error) {
      alert('Erro ao salvar frequência.');
    }
  };

  const removerPresencaDoDia = async () => {
    if (!alunoSelecionado || !diaSelecionadoAcao) return;
    if (confirm('Deseja remover o registro de frequência deste dia?')) {
      try {
        await adminApi.deleteStudentAttendance(alunoSelecionado.id, { data: diaSelecionadoAcao });
        setModalAcaoDia(false);
        carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
        carregarDashboard();
      } catch (error) {
        alert('Erro ao remover registro.');
      }
    }
  };

  // ==========================================
  // CONFIRMAÇÃO DE CHECK-IN RÁPIDO & EM LOTE
  // ==========================================
  const handleAlterarStatusPresenca = async (presencaId: string, novoStatus: string) => {
    try {
      await adminApi.updateAttendanceStatus(presencaId, {
        status: novoStatus
      });
      setPresencas(prev => prev.map(p => p.id === presencaId ? { ...p, status: novoStatus } : p));
      if (alunoSelecionado) {
        carregarDadosCalendario(alunoSelecionado.id, mesCalendario, anoCalendario);
      }
      if (frequenciaGeral) {
        carregarFrequenciaGeral(mesFrequenciaGeral, anoFrequenciaGeral);
      }
    } catch (error) {
      alert('Erro ao atualizar presença.');
    }
  };

  const handleMarcarTodosAgendados = async () => {
    const agendados = presencas.filter(p => p.status === 'AGENDADO');
    if (agendados.length === 0) {
      alert('Não há presenças pendentes com status "AGENDADO" para marcar.');
      return;
    }
    if (confirm(`Confirmar presença de TODOS os ${agendados.length} alunos agendados em 1 clique?`)) {
      setLoteLoading(true);
      try {
        await adminApi.batchUpdateAttendance({
          presencaIds: agendados.map(p => p.id),
          status: 'PRESENTE'
        });
        alert(`Sucesso! ${agendados.length} presenças foram validadas como PRESENTES!`);
        carregarDashboard();
        carregarFrequenciaGeral(mesFrequenciaGeral, anoFrequenciaGeral);
      } catch (error) {
        alert('Erro ao confirmar lote de presenças.');
      } finally {
        setLoteLoading(false);
      }
    }
  };

  const handleMarcarLoteStatus = async (status: string) => {
    if (selecionadosLote.length === 0) {
      alert('Selecione pelo menos um registro na tabela.');
      return;
    }
    setLoteLoading(true);
    try {
      await adminApi.batchUpdateAttendance({
        presencaIds: selecionadosLote,
        status
      });
      alert(`${selecionadosLote.length} presenças atualizadas para ${status}!`);
      setSelecionadosLote([]);
      carregarDashboard();
      carregarFrequenciaGeral(mesFrequenciaGeral, anoFrequenciaGeral);
    } catch (error) {
      alert('Erro ao atualizar presenças em lote.');
    } finally {
      setLoteLoading(false);
    }
  };

  // ==========================================
  // CALENDÁRIO GERAL DA ACADEMIA
  // ==========================================
  const carregarFrequenciaGeral = async (mes: number, ano: number) => {
    setLoadingFrequenciaGeral(true);
    try {
      const res = await adminApi.getGeneralAttendance({ mes, ano });
      setFrequenciaGeral(res.data);
    } catch (error) {
      console.error('Erro ao carregar frequência geral da academia', error);
    } finally {
      setLoadingFrequenciaGeral(false);
    }
  };

  const mudarMesFrequenciaGeral = (delta: number) => {
    let novoMes = mesFrequenciaGeral + delta;
    let novoAno = anoFrequenciaGeral;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    } else if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }
    setMesFrequenciaGeral(novoMes);
    setAnoFrequenciaGeral(novoAno);
    carregarFrequenciaGeral(novoMes, novoAno);
  };

  const handleLancarPresencaDiaGeral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoLancarDia || !diaSelecionadoGeral) return;
    try {
      await adminApi.saveStudentAttendance(alunoLancarDia, {
        data: diaSelecionadoGeral,
        status: statusLancarDia,
        justificativa: justificativaLancarDia || null,
        tipoJustificativa: statusLancarDia === 'DOENCA' ? 'DOENCA' : (statusLancarDia === 'JUSTIFICADO' ? 'TRABALHO' : null)
      });
      alert('Presença lançada com sucesso no calendário da academia!');
      setModalLancarDia(false);
      setAlunoLancarDia('');
      setJustificativaLancarDia('');
      carregarFrequenciaGeral(mesFrequenciaGeral, anoFrequenciaGeral);
      carregarDashboard();
    } catch (error) {
      alert('Erro ao registrar presença no calendário.');
    }
  };

  const handleMensagemAssiduidade = (aluno: any) => {
    if (!aluno.telefone) {
      alert(`O aluno ${aluno.nome} não possui telefone cadastrado.`);
      return;
    }
    const msg = `Olá ${aluno.nome}, tudo bem? Aqui é da equipe do CT BORÜ Muay Thai! Sentimos sua falta nos treinos recentemente. Tá tudo certinho por aí? Esperamos você de volta ao tatame para continuarmos evoluindo juntos! Se precisar de algum ajuste nos seus horários, estamos à disposição. Oss! 🥊`;
    window.open(formatarWhatsUrl(aluno.telefone, msg), '_blank');
  };

  // ==========================================
  // LEADS & AULAS EXPERIMENTAIS
  // ==========================================
  const marcarAulaRealizada = async (agendamentoId: string) => {
    if (confirm('Confirmar que a pessoa realizou a aula experimental?')) {
      try {
        await adminApi.updateAppointment(agendamentoId, { status: 'REALIZADA' });
        carregarDashboard();
        setSubAbaExperimental('posAula');
      } catch (error) {
        alert('Erro ao atualizar agendamento.');
      }
    }
  };

  const converterLeadEmAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadParaConverter) return;
    try {
      const response = await adminApi.convertAppointment(leadParaConverter.id, {
        plano: planoConversao,
        valorMensalidade: valorConversao
      });
      alert(`Parabéns! ${leadParaConverter.nome} agora é um aluno matriculado!\n\nSenha temporária: ${response.data.senhaTemporaria}`);
      setLeadParaConverter(null);
      carregarDashboard();
      setAbaAtiva('alunos');
    } catch (error) {
      alert('Erro ao converter lead em aluno.');
    }
  };

  // ==========================================
  // TELA DE LOGIN DO ADMIN / PROFESSOR
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C]/75 backdrop-blur-[2px] flex items-center justify-center z-[9999] px-4 relative overflow-hidden">
        <div className="bg-[#141416]/95 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <img 
              src="/logo-boru.jpg" 
              alt="BORÜ Centro de Combate" 
              className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-red-600 shadow-xl object-cover" 
            />
            <h1 className="text-3xl font-black text-white tracking-widest mb-1">BORÜ</h1>
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest">Painel Administrativo & Professores</p>
            <p className="text-zinc-400 text-xs mt-1">Controle de Alunos, Aulas, Modalidades e Equipe</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1">Login de Acesso</label>
              <input 
                type="text" 
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                placeholder="Usuário ou CPF do Professor"
                required
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                * Professores acessam informando o seu <strong>CPF</strong> (com ou sem pontuação) e senha cadastrada.
              </p>
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1">Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition text-sm"
                placeholder="Sua senha de acesso"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform active:scale-95 shadow-lg shadow-red-600/30 text-sm uppercase tracking-wider"
            >
              {loginLoading ? 'Verificando...' : 'Entrar no Painel'}
            </button>
            <p className="text-[11px] text-zinc-500 text-center mt-3">
              Esqueceu a senha de professor? A redefinição de senha é feita diretamente com a Administração.
            </p>
          </form>

          <Link to="/" className="block text-center mt-5 text-zinc-500 hover:text-white text-xs transition">
            ← Voltar ao site principal
          </Link>
        </div>
      </div>
    );
  }

  // Coleções filtradas para renderização ágil
  const alunosFiltrados = alunos.filter(a => {
    const termo = buscaAluno.trim().toLowerCase();
    const bateTexto = !termo ||
      (a.nome && a.nome.toLowerCase().includes(termo)) ||
      (a.cpf && a.cpf.toLowerCase().includes(termo)) ||
      (a.telefone && a.telefone.includes(termo));
    if (!bateTexto) return false;

    if (filtroAssiduidade === 'TODOS') return true;
    if (filtroAssiduidade === 'DIARIA') return isDiariaOuConvenio(a.plano);
    if (filtroAssiduidade === 'ALTA') return a.statusAssiduidade === 'ALTA';
    if (filtroAssiduidade === 'REGULAR') return a.statusAssiduidade === 'REGULAR';
    if (filtroAssiduidade === 'RISCO') return a.statusAssiduidade === 'RISCO';
    return true;
  });

  const presencasFiltradas = presencas.filter(p => {
    if (filtroChamada === 'TODOS') return true;
    return p.status === filtroChamada;
  });

  // ==========================================
  // PAINEL LOGADO
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0B0B0C]/80 backdrop-blur-[1px] text-zinc-100 font-sans p-3 sm:p-6 pb-20 relative z-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* BARRA SUPERIOR & PERFIL DO USUÁRIO */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <img src="/logo-boru.jpg" alt="BORÜ" className="w-12 h-12 rounded-full border-2 border-red-600 shadow-md object-cover flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                  PAINEL <span className="text-red-600">BORÜ</span>
                </h1>
                {usuarioLogado?.cargo === 'ADMIN' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    👑 ADMINISTRADOR
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    🥋 PROFESSOR
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                Olá, <strong className="text-white">{usuarioLogado?.nome}</strong> ({usuarioLogado?.prajied || 'Prajied Oficial'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {usuarioLogado?.cargo === 'ADMIN' && (
              <button 
                onClick={() => setShowModalProf(true)}
                className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-900/30"
              >
                <span>➕ Criar Novo Professor</span>
              </button>
            )}
            <button 
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-900/30"
            >
              <span>➕ Novo Aluno</span>
            </button>
            <button 
              onClick={() => { setIsLoggedIn(false); setUsuarioLogado(null); }}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
            >
              Sair
            </button>
          </div>
        </header>

        {/* CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 sm:p-4">
            <p className="text-zinc-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Total de Alunos</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{metricas.totalAlunos}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Matriculados ativos</span>
          </div>
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 sm:p-4">
            <p className="text-zinc-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Em Dia</p>
            <p className="text-2xl sm:text-3xl font-black text-green-500">{metricas.assinaturasAtivas}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Mensalidade vigente</span>
          </div>
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 sm:p-4">
            <p className="text-zinc-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Atrasados / Pendentes</p>
            <p className="text-2xl sm:text-3xl font-black text-red-500">{metricas.inadimplentes}</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Vencidas ou sem plano</span>
          </div>
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Assiduidade Geral</p>
              <span className="text-xs">📊</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-cyan-400">{metricas.taxaPresencaMedia ?? 100}%</p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Taxa de presença no mês</span>
          </div>
          <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">Alunos em Risco</p>
              <span className="text-xs">⚠️</span>
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${(metricas.alunosEmRisco || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {metricas.alunosEmRisco || 0}
            </p>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Frequência menor que 50%</span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS (TOUCH-FRIENDLY & RESPONSIVO) */}
        <div className="flex gap-2 sm:gap-3 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setAbaAtiva('alunos')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'alunos' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            👥 Alunos ({alunos.length})
          </button>
          <button 
            onClick={() => {
              setAbaAtiva('calendario_geral');
              if (!frequenciaGeral) {
                carregarFrequenciaGeral(mesFrequenciaGeral, anoFrequenciaGeral);
              }
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'calendario_geral' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📅 Calendário & Frequência Geral
          </button>
          <button 
            onClick={() => setAbaAtiva('presencas')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'presencas' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📋 Chamada Rápida ({presencas.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('avisos')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'avisos' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📢 Mural de Avisos ({avisos.length})
          </button>
          <button 
            onClick={() => setAbaAtiva('loja')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'loja' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🛍️ Loja & Mercado (Beta)
          </button>
          <button 
            onClick={() => setAbaAtiva('agendamentos')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'agendamentos' ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🎯 Leads & Aulas Exp.
          </button>
          <button 
            onClick={() => setAbaAtiva('gamificacao')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              abaAtiva === 'gamificacao' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-[#141416] text-amber-400 hover:text-white border border-amber-500/40'
            }`}
          >
            🏆 Gestão de Gamificação
          </button>
          {usuarioLogado?.cargo === 'ADMIN' && (
            <button 
              onClick={() => setAbaAtiva('professores')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                abaAtiva === 'professores' ? 'bg-amber-600 text-white' : 'bg-[#141416] text-amber-400 hover:text-white border border-amber-900/50'
              }`}
            >
              👑 Professores & Equipe
            </button>
          )}
        </div>

        {/* CONTEÚDO DA ABA: ALUNOS */}
        {abaAtiva === 'alunos' && (
          <div className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>👥 Alunos Matriculados</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {alunosFiltrados.length} de {alunos.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Acompanhe frequência individual mensal, retenção de alunos e planos ativos.
                </p>
              </div>

              {/* BARRA DE PESQUISA RÁPIDA */}
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={buscaAluno}
                  onChange={(e) => setBuscaAluno(e.target.value)}
                  placeholder="🔍 Buscar aluno por nome, CPF ou telefone..."
                  className="w-full bg-[#1A1A1E] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
                />
              </div>
            </div>

            {/* FILTROS DE ASSIDUIDADE E CATEGORIA */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setFiltroAssiduidade('TODOS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                  filtroAssiduidade === 'TODOS'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Todos ({alunos.length})
              </button>
              <button
                onClick={() => setFiltroAssiduidade('ALTA')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filtroAssiduidade === 'ALTA'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#1A1A1E] text-green-400 hover:text-white border border-green-900/40'
                }`}
              >
                <span>🟢 Alta Presença (≥ 75%)</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
                  {alunos.filter(a => a.statusAssiduidade === 'ALTA').length}
                </span>
              </button>
              <button
                onClick={() => setFiltroAssiduidade('REGULAR')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filtroAssiduidade === 'REGULAR'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#1A1A1E] text-amber-400 hover:text-white border border-amber-900/40'
                }`}
              >
                <span>🟡 Regular (50% a 74%)</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
                  {alunos.filter(a => a.statusAssiduidade === 'REGULAR').length}
                </span>
              </button>
              <button
                onClick={() => setFiltroAssiduidade('RISCO')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filtroAssiduidade === 'RISCO'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1A1A1E] text-red-400 hover:text-white border border-red-900/40'
                }`}
              >
                <span>🔴 Em Risco (&lt; 50%)</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
                  {alunos.filter(a => a.statusAssiduidade === 'RISCO').length}
                </span>
              </button>
              <button
                onClick={() => setFiltroAssiduidade('DIARIA')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filtroAssiduidade === 'DIARIA'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-[#1A1A1E] text-cyan-400 hover:text-white border border-cyan-900/40'
                }`}
              >
                <span>⚡ Diárias & Passes</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
                  {alunos.filter(a => isDiariaOuConvenio(a.plano)).length}
                </span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3 sm:p-4">Aluno</th>
                    <th className="p-3 sm:p-4">Plano</th>
                    <th className="p-3 sm:p-4">Prajied</th>
                    <th className="p-3 sm:p-4">Mensalidade</th>
                    <th className="p-3 sm:p-4">Frequência no Mês</th>
                    <th className="p-3 sm:p-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {alunosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        Nenhum aluno encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    alunosFiltrados.map(aluno => (
                      <tr key={aluno.id} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3 sm:p-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{aluno.nome}</span>
                            {aluno.statusAssiduidade === 'RISCO' && !isDiariaOuConvenio(aluno.plano) && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-950 text-red-400 border border-red-500/40" title="Aluno com frequência menor que 50%">
                                RISCO
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                            {aluno.telefone || 'Sem telefone'} {aluno.cpf ? `• CPF: ${aluno.cpf}` : ''}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-zinc-300 font-medium">
                          <select 
                            value={aluno.plano || '2x na semana'}
                            onChange={(e) => atualizarPlanoAluno(aluno.id, e.target.value)}
                            className="bg-[#1A1A1E] border border-zinc-700 text-white text-xs rounded-lg px-2 py-1 font-semibold focus:border-red-500 outline-none"
                          >
                            <option value="2x na semana">2x na semana (R$ 130)</option>
                            <option value="3x na semana">3x na semana (R$ 160)</option>
                            <option value="Todos os Horários">Todos os Horários (R$ 280)</option>
                            <option value="Diária">Diária Avulsa (R$ 40/aula)</option>
                            <option value="Wellhub">Wellhub / Gympass</option>
                            <option value="TotalPass">TotalPass</option>
                          </select>
                        </td>
                        <td className="p-3 sm:p-4">
                          <select 
                            value={aluno.prajied || 'Branco'}
                            onChange={(e) => atualizarPrajied(aluno.id, e.target.value)}
                            className="bg-[#1A1A1E] border border-zinc-700 text-white text-xs rounded-lg px-2 py-1 font-semibold focus:border-red-500 outline-none"
                          >
                            <option value="Branco">Branco</option>
                            <option value="Branco e Vermelho">Branco e Vermelho</option>
                            <option value="Vermelho">Vermelho</option>
                            <option value="Vermelho e Azul">Vermelho e Azul</option>
                            <option value="Azul Claro">Azul Claro</option>
                            <option value="Azul Escuro">Azul Escuro</option>
                            <option value="Preto">Preto</option>
                          </select>
                        </td>
                        <td className="p-3 sm:p-4">
                          {isDiariaOuConvenio(aluno.plano) ? (
                            <>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                ⚡ Diária / Convênio
                              </span>
                              <span className="block text-[10px] text-zinc-400 mt-0.5 font-medium">
                                {aluno.plano?.toLowerCase().includes('wellhub') ? 'Check-in Wellhub' :
                                 aluno.plano?.toLowerCase().includes('totalpass') ? 'Check-in TotalPass' :
                                 'R$ 40 avulso p/ treino'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                aluno.status === 'PAGO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {aluno.status}
                              </span>
                              {aluno.diasVencimento !== null && (
                                <span className="block text-[10px] text-zinc-400 mt-0.5">
                                  {aluno.diasVencimento < 0 ? `Venceu há ${Math.abs(aluno.diasVencimento)}d` : `Vence em ${aluno.diasVencimento}d`}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        {/* FREQUÊNCIA & PORCENTAGEM DE PRESENÇA NO MÊS */}
                        <td className="p-3 sm:p-4">
                          {isDiariaOuConvenio(aluno.plano) ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-cyan-300">
                                  ⚡ {aluno.treinosSemana || 0} treino(s)
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">esta semana</span>
                              </div>
                              <span className="block text-[10px] text-zinc-400 mt-0.5">
                                Total no mês: <strong className="text-zinc-200">{aluno.presencasMes || 0}</strong>
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className={
                                  aluno.statusAssiduidade === 'RISCO' ? 'text-red-400' :
                                  aluno.statusAssiduidade === 'REGULAR' ? 'text-amber-400' : 'text-green-400'
                                }>
                                  {aluno.porcentagemPresenca ?? 100}%
                                </span>
                                <span className="text-[10px] text-zinc-400 font-normal">
                                  {aluno.presencasMes || 0} presenças
                                  {aluno.faltasMes > 0 && <span className="text-red-400 ml-1">({aluno.faltasMes} faltas)</span>}
                                </span>
                              </div>
                              <div className="w-28 sm:w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    aluno.statusAssiduidade === 'RISCO' ? 'bg-red-500' :
                                    aluno.statusAssiduidade === 'REGULAR' ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(aluno.porcentagemPresenca ?? 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button 
                              onClick={() => abrirCalendarioAluno(aluno)}
                              className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center gap-1"
                              title="Ver frequência e calendário detalhado"
                            >
                              <span>📅 Calendário</span>
                            </button>
                            <button 
                              onClick={() => handleRegistrarPagamento(aluno)}
                              className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold transition"
                              title="Confirmar pagamento presencial (balcão)"
                            >
                              💵 Pago (+30d)
                            </button>
                            {aluno.statusAssiduidade === 'RISCO' && !isDiariaOuConvenio(aluno.plano) ? (
                              <button 
                                onClick={() => handleMensagemAssiduidade(aluno)}
                                className="px-2.5 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40 text-xs font-bold transition flex items-center gap-1"
                                title="Enviar mensagem de incentivo e reengajamento via WhatsApp"
                              >
                                <span>⚠️ Resgatar</span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleCobrar(aluno)}
                                className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold transition"
                                title="Enviar lembrete via WhatsApp"
                              >
                                📲 WhatsApp
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: CALENDÁRIO DA ACADEMIA & FREQUÊNCIA GERAL */}
        {abaAtiva === 'calendario_geral' && (
          <div className="space-y-5">
            {/* CABEÇALHO DO CALENDÁRIO GERAL */}
            <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>📅 Calendário Geral da Academia</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    Visão Coletiva
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Acompanhe a assiduidade diária de todas as turmas, faltas coletivas e confirme presenças em lote.
                </p>
              </div>

              {/* SELETOR DE MÊS & AÇÃO RÁPIDA */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-[#1A1A1E] border border-zinc-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => mudarMesFrequenciaGeral(-1)}
                    className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold text-xs transition"
                  >
                    ← Mês Anterior
                  </button>
                  <span className="px-3 py-2 text-white font-black text-xs border-x border-zinc-700">
                    {new Date(anoFrequenciaGeral, mesFrequenciaGeral - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </span>
                  <button 
                    onClick={() => mudarMesFrequenciaGeral(1)}
                    className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold text-xs transition"
                  >
                    Próximo Mês →
                  </button>
                </div>

                <button 
                  onClick={() => setModalLancarDia(true)}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-900/30"
                >
                  <span>➕ Lançar Aluno neste Dia</span>
                </button>
              </div>
            </div>

            {/* BANNER DE RESUMO DO MÊS COLETIVO */}
            {frequenciaGeral?.resumo && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aulas Realizadas</p>
                  <p className="text-2xl font-black text-green-400 mt-0.5">{frequenciaGeral.resumo.totalPresentes}</p>
                  <span className="text-[10px] text-zinc-500">Presenças confirmadas</span>
                </div>
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Taxa de Assiduidade</p>
                  <p className="text-2xl font-black text-cyan-400 mt-0.5">{frequenciaGeral.resumo.taxaGeral}%</p>
                  <span className="text-[10px] text-zinc-500">Média geral do mês</span>
                </div>
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Faltas no Mês</p>
                  <p className="text-2xl font-black text-red-400 mt-0.5">{frequenciaGeral.resumo.totalFaltas}</p>
                  <span className="text-[10px] text-zinc-500">Ausências sem atestado</span>
                </div>
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Atestados Médicos</p>
                  <p className="text-2xl font-black text-blue-400 mt-0.5">{frequenciaGeral.resumo.totalDoenca}</p>
                  <span className="text-[10px] text-zinc-500">Doença / justificados</span>
                </div>
                <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3.5 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dias com Treino</p>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">{frequenciaGeral.resumo.diasComTreino}</p>
                  <span className="text-[10px] text-zinc-500">Dias ativos na academia</span>
                </div>
              </div>
            )}

            {/* GRID DO CALENDÁRIO COLETIVO + PAINEL DO DIA SELECIONADO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* COLUNA ESQUERDA: GRADE MENSAL (2/3) */}
              <div className="lg:col-span-2 bg-[#141416] border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Grade do Mês</span>
                    <span className="text-xs text-zinc-400 font-normal">
                      (Clique em qualquer dia para ver a lista de presença e lançar notas)
                    </span>
                  </h3>
                </div>

                {loadingFrequenciaGeral ? (
                  <div className="py-16 text-center text-zinc-400 text-sm">
                    Carregando frequência do mês...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      <div className="text-red-400">Dom</div>
                      <div>Seg</div>
                      <div>Ter</div>
                      <div>Qua</div>
                      <div>Qui</div>
                      <div>Sex</div>
                      <div>Sáb</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: new Date(anoFrequenciaGeral, mesFrequenciaGeral - 1, 1).getDay() }).map((_, i) => (
                        <div key={`emp-g-${i}`} className="min-h-[75px] rounded-lg bg-zinc-900/30 border border-zinc-900"></div>
                      ))}

                      {Array.from({ length: new Date(anoFrequenciaGeral, mesFrequenciaGeral, 0).getDate() }).map((_, i) => {
                        const dia = i + 1;
                        const dataIso = `${anoFrequenciaGeral}-${String(mesFrequenciaGeral).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                        const diaInfo = frequenciaGeral?.mapaDias?.[dataIso];
                        const hojeIso = new Date().toISOString().split('T')[0];
                        const ehHoje = dataIso === hojeIso;
                        const estaSelecionado = diaSelecionadoGeral === dataIso;

                        return (
                          <button
                            key={`dia-g-${dia}`}
                            onClick={() => setDiaSelecionadoGeral(dataIso)}
                            className={`min-h-[78px] p-2 rounded-lg border text-left flex flex-col justify-between transition group relative ${
                              estaSelecionado
                                ? 'bg-red-950/40 border-red-500 shadow-md shadow-red-950/50 ring-1 ring-red-500'
                                : diaInfo?.total && diaInfo.total > 0
                                  ? 'bg-[#1A1A1E] border-zinc-700/80 hover:border-zinc-500'
                                  : 'bg-[#141416] border-zinc-800/80 hover:border-zinc-700 text-zinc-600'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-black ${
                                estaSelecionado ? 'text-white' : ehHoje ? 'text-red-400' : 'text-zinc-300'
                              }`}>
                                {dia}
                              </span>
                              {ehHoje && (
                                <span className="text-[9px] font-black bg-red-600 text-white px-1 py-0.2 rounded">
                                  Hoje
                                </span>
                              )}
                            </div>

                            {diaInfo?.total && diaInfo.total > 0 ? (
                              <div className="space-y-1 w-full mt-1">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-green-400">✓ {diaInfo.presentes}</span>
                                  {diaInfo.faltas > 0 && <span className="text-red-400">✗ {diaInfo.faltas}</span>}
                                  {diaInfo.doenca > 0 && <span className="text-blue-400">🩺 {diaInfo.doenca}</span>}
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-zinc-400">
                                  <span>{diaInfo.taxaPresenca}% freq.</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-600 italic mt-auto">
                                Sem registros
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* COLUNA DIREITA: ROSTER DO DIA SELECIONADO (1/3) */}
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col">
                <div className="border-b border-zinc-800 pb-3 mb-4 flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-500 block">Chamada do Dia</span>
                    <h3 className="text-base font-black text-white">
                      {new Date(diaSelecionadoGeral + 'T12:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long'
                      })}
                    </h3>
                  </div>

                  <button 
                    onClick={() => setModalLancarDia(true)}
                    className="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    <span>➕ Lançar Aluno</span>
                  </button>
                </div>

                {/* RESUMO DO DIA */}
                {frequenciaGeral?.mapaDias?.[diaSelecionadoGeral] ? (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="bg-[#1A1A1E] border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Total de Treinos</span>
                        <strong className="text-white text-base">
                          {frequenciaGeral.mapaDias[diaSelecionadoGeral].total}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 block text-[10px]">Presença do Dia</span>
                        <strong className="text-green-400 text-base">
                          {frequenciaGeral.mapaDias[diaSelecionadoGeral].taxaPresenca}%
                        </strong>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2 pr-1">
                      {frequenciaGeral.mapaDias[diaSelecionadoGeral].alunos.map((item: any) => (
                        <div 
                          key={item.id}
                          className="bg-[#1A1A1E] border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 transition"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <h4 className="text-xs font-bold text-white">{item.nome}</h4>
                              <p className="text-[10px] text-zinc-400">{item.plano} • Prajied {item.prajied}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'PRESENTE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              item.status === 'DOENCA' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              item.status === 'FALTA' || item.status === 'AUSENTE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          {item.justificativa && (
                            <p className="text-[10px] text-zinc-400 italic mb-2 bg-black/40 p-1.5 rounded">
                              Motivo: {item.justificativa}
                            </p>
                          )}

                          {/* BOTÕES DE AÇÃO RÁPIDA NO ROSTER */}
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 gap-1">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAlterarStatusPresenca(item.id, 'PRESENTE')}
                                className="px-2 py-0.5 rounded bg-green-950 text-green-300 hover:bg-green-800 text-[10px] font-bold border border-green-700/40"
                                title="Marcar como presente"
                              >
                                ✓ Presente
                              </button>
                              <button
                                onClick={() => handleAlterarStatusPresenca(item.id, 'DOENCA')}
                                className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 hover:bg-blue-800 text-[10px] font-bold border border-blue-700/40"
                                title="Falta por doença / atestado"
                              >
                                🩺 Doença
                              </button>
                              <button
                                onClick={() => handleAlterarStatusPresenca(item.id, 'FALTA')}
                                className="px-2 py-0.5 rounded bg-red-950 text-red-300 hover:bg-red-800 text-[10px] font-bold border border-red-700/40"
                                title="Marcar falta"
                              >
                                ✗ Falta
                              </button>
                            </div>

                            {item.telefone && (
                              <button
                                onClick={() => window.open(formatarWhatsUrl(item.telefone, `Olá ${item.nome}, equipe CT BORÜ entrando em contato sobre o treino do dia ${diaSelecionadoGeral}.`), '_blank')}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                                title="Enviar WhatsApp"
                              >
                                📲
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                    <span className="text-3xl mb-2">🥋</span>
                    <p className="text-xs font-semibold text-zinc-400">Nenhum treino registrado neste dia.</p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                      Clique no botão abaixo para adicionar a presença de um aluno ou registrar check-ins.
                    </p>
                    <button
                      onClick={() => setModalLancarDia(true)}
                      className="mt-4 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                    >
                      ➕ Lançar Primeiro Check-in
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: CHAMADA RÁPIDA & PRESENÇAS EM LOTE */}
        {abaAtiva === 'presencas' && (
          <div className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>📋 Chamada Rápida dos Treinos</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {presencasFiltradas.length} registros
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Valide os check-ins individuais ou confirme toda a turma em 1 clique.
                </p>
              </div>

              {/* BOTÃO MÁGICO DE 1 CLIQUE: CONFIRMAR TODOS AGENDADOS */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <button
                  onClick={handleMarcarTodosAgendados}
                  disabled={loteLoading}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 uppercase tracking-wider"
                >
                  <span>⚡ Confirmar Todos Agendados (1 Clique)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAbaAtiva('gamificacao')}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-black transition flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <span>🏅 Check-in Especial / Trilha Nak Muay</span>
                </button>
              </div>
            </div>

            {/* FILTROS DE STATUS E AÇÕES EM LOTE SELECIONADOS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 border-t border-zinc-800/80">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['TODOS', 'AGENDADO', 'PRESENTE', 'DOENCA', 'FALTA'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFiltroChamada(st as any)}
                    className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      filtroChamada === st
                        ? 'bg-red-600 text-white'
                        : 'bg-[#1A1A1E] text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {st === 'TODOS' ? `Todos (${presencas.length})` :
                     st === 'AGENDADO' ? `⏳ Agendados (${presencas.filter(p => p.status === 'AGENDADO').length})` :
                     st === 'PRESENTE' ? `✓ Presentes (${presencas.filter(p => p.status === 'PRESENTE').length})` :
                     st === 'DOENCA' ? `🩺 Doença (${presencas.filter(p => p.status === 'DOENCA').length})` :
                     `✗ Faltas (${presencas.filter(p => p.status === 'FALTA' || p.status === 'AUSENTE').length})`}
                  </button>
                ))}
              </div>

              {/* BARRA DE AÇÃO EM LOTE SE TIVER ITENS MARCADOS */}
              {selecionadosLote.length > 0 && (
                <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs">
                  <span className="text-zinc-300 font-bold">{selecionadosLote.length} selecionado(s):</span>
                  <button
                    onClick={() => handleMarcarLoteStatus('PRESENTE')}
                    disabled={loteLoading}
                    className="px-2 py-0.5 rounded bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    ✓ Presente
                  </button>
                  <button
                    onClick={() => handleMarcarLoteStatus('DOENCA')}
                    disabled={loteLoading}
                    className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    🩺 Doença
                  </button>
                  <button
                    onClick={() => handleMarcarLoteStatus('FALTA')}
                    disabled={loteLoading}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    ✗ Falta
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selecionadosLote.length > 0 && selecionadosLote.length === presencasFiltradas.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelecionadosLote(presencasFiltradas.map(p => p.id));
                          } else {
                            setSelecionadosLote([]);
                          }
                        }}
                        className="rounded bg-zinc-800 border-zinc-700 text-red-600"
                      />
                    </th>
                    <th className="p-3 sm:p-4">Aluno</th>
                    <th className="p-3 sm:p-4">Aula / Data</th>
                    <th className="p-3 sm:p-4">Status Atual</th>
                    <th className="p-3 sm:p-4 text-right">Lançar Chamada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {presencasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500">
                        Nenhuma presença encontrada para este filtro.
                      </td>
                    </tr>
                  ) : (
                    presencasFiltradas.map(p => {
                      const estaMarcado = selecionadosLote.includes(p.id);
                      return (
                        <tr key={p.id} className={`hover:bg-zinc-800/30 transition ${estaMarcado ? 'bg-red-950/20' : ''}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={estaMarcado}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelecionadosLote(prev => [...prev, p.id]);
                                } else {
                                  setSelecionadosLote(prev => prev.filter(id => id !== p.id));
                                }
                              }}
                              className="rounded bg-zinc-800 border-zinc-700 text-red-600"
                            />
                          </td>
                          <td className="p-3 sm:p-4 font-bold text-white">
                            {p.aluno?.nome}
                            <span className="block text-[11px] text-zinc-400 font-normal">
                              {p.aluno?.plano} • Prajied {p.aluno?.prajied || 'Branco'}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 text-zinc-300">
                            {p.evento?.titulo || 'Treino de Muay Thai'}
                            <span className="block text-[11px] text-zinc-500">
                              {new Date(p.data).toLocaleDateString('pt-BR')} às {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.status === 'PRESENTE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              p.status === 'DOENCA' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              p.status === 'JUSTIFICADO' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                              p.status === 'FALTA' || p.status === 'AUSENTE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {p.status}
                            </span>
                            {p.justificativa && (
                              <span className="block text-[10px] text-zinc-400 mt-1 italic">
                                Motivo: {p.justificativa}
                              </span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button 
                                onClick={() => handleAlterarStatusPresenca(p.id, 'PRESENTE')}
                                className="px-2 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-500/30 text-xs font-bold transition"
                              >
                                ✓ Presente
                              </button>
                              <button 
                                onClick={() => handleAlterarStatusPresenca(p.id, 'DOENCA')}
                                className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-bold transition"
                                title="Registrar falta por motivo de doença / atestado"
                              >
                                🩺 Doença
                              </button>
                              <button 
                                onClick={() => handleAlterarStatusPresenca(p.id, 'FALTA')}
                                className="px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs font-bold transition"
                              >
                                ✗ Falta
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: GESTÃO DE GAMIFICAÇÃO & APROVAÇÃO RÁPIDA (TRILHA DO NAK MUAY) */}
        {abaAtiva === 'gamificacao' && (
          <AdminGamificationTab
            cargoUsuario={usuarioLogado?.cargo || 'ADMIN'}
            professorId={usuarioLogado?.id}
            alunosLista={alunos}
            isCombatHub={false}
            
            onRefreshDashboard={carregarDashboard}
          />
        )}

        {/* CONTEÚDO DA ABA: MURAL DE AVISOS */}
        {abaAtiva === 'avisos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">Mural de Avisos da Academia</h2>
                <p className="text-xs text-zinc-400">Publicações e recados oficiais vistos por todos os alunos no portal.</p>
              </div>
              <button 
                onClick={() => setShowModalAviso(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-900/30"
              >
                <span>➕ Publicar Novo Aviso</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {avisos.map(aviso => (
                <NoticeCard
                  key={aviso.id}
                  aviso={aviso}
                  variant="admin"
                  onDelete={removerAviso}
                />
              ))}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: LOJA & MERCADO (BETA) */}
        {abaAtiva === 'loja' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Mercado & Loja Borü</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    VERSÃO BETA
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Controle de estoque dos itens físicos vendidos presencialmente na recepção.</p>
              </div>
              <button 
                onClick={() => setShowModalProduto(true)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-900/30"
              >
                <span>➕ Adicionar Produto</span>
              </button>
            </div>

            {/* Categorias */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['TODOS', 'PROTETOR_BUCAL', 'LUVAS', 'CANELEIRAS', 'BANDAGENS', 'ALIMENTOS'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltroLoja(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    categoriaFiltroLoja === cat ? 'bg-red-600 text-white' : 'bg-[#141416] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat === 'TODOS' ? 'Todos os Produtos' :
                   cat === 'PROTETOR_BUCAL' ? 'Protetor Bucal' :
                   cat === 'LUVAS' ? 'Luvas' :
                   cat === 'CANELEIRAS' ? 'Caneleiras' :
                   cat === 'BANDAGENS' ? 'Bandagens' : 'Alimentos & Bebidas'}
                </button>
              ))}
            </div>

            {/* Grid de produtos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {produtos
                .filter(p => categoriaFiltroLoja === 'TODOS' || p.categoria === categoriaFiltroLoja)
                .map(prod => (
                  <div key={prod.id} className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition">
                    <div className="h-40 bg-zinc-900 relative overflow-hidden">
                      <img 
                        src={prod.imagemUrl || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=500&q=80'} 
                        alt={prod.nome} 
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                        Estoque: {prod.estoque}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-red-500">
                          {prod.categoria.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 leading-snug">{prod.nome}</h4>
                        {prod.descricao && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{prod.descricao}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-base font-black text-white">
                          R$ {prod.preco.toFixed(2).replace('.', ',')}
                        </span>
                        <button 
                          onClick={() => removerProduto(prod.id)}
                          className="text-xs text-red-500 hover:text-red-400 transition font-semibold"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: PROFESSORES & EQUIPE (ADMIN) */}
        {abaAtiva === 'professores' && usuarioLogado?.cargo === 'ADMIN' && (
          <div className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Professores e Membros da Equipe</h2>
                <p className="text-xs text-zinc-400">Gestão completa de instrutores, modalidades marciais, graduações e tempo de aula/docência.</p>
              </div>
              <button 
                onClick={() => setShowModalProf(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-900/30"
              >
                <span>➕ Cadastrar Professor</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3 sm:p-4">Professor / Contato</th>
                    <th className="p-3 sm:p-4">Modalidade</th>
                    <th className="p-3 sm:p-4">Graduação / Prática</th>
                    <th className="p-3 sm:p-4">Tempo de Aulas (Docência)</th>
                    <th className="p-3 sm:p-4">Grade & Duração de Aula</th>
                    <th className="p-3 sm:p-4">Cargo</th>
                    <th className="p-3 sm:p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {professores.map(prof => (
                    <tr key={prof.id} className="hover:bg-zinc-800/30 transition">
                      <td className="p-3 sm:p-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-amber-400">
                            {prof.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-white font-bold">{prof.nome}</span>
                            <span className="block text-[11px] text-amber-400 font-bold">
                              CPF Login: {prof.cpf || 'Não cadastrado'}
                            </span>
                            <span className="block text-[10px] text-zinc-500 font-normal">
                              {prof.telefone || 'Sem telefone'} • {prof.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${
                          prof.modalidade === 'Jiu-Jitsu' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                          prof.modalidade === 'Boxe' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          prof.modalidade === 'MMA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          prof.modalidade === 'Taekwondo' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                          'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {prof.modalidade || 'Muay Thai'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-zinc-200">
                        <div className="font-semibold text-xs text-white">
                          {prof.graduacao || prof.prajied || 'Sem faixa'}
                        </div>
                        {prof.tempoPratica && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            🥋 Treino: {prof.tempoPratica}
                          </div>
                        )}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="text-xs font-bold text-amber-300">
                          {prof.tempoDocencia || 'Tempo de docência não informado'}
                        </div>
                        {prof.cargaHorariaSemanal && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            ⏱️ {prof.cargaHorariaSemanal}
                          </div>
                        )}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/80">
                          <span>⏱️ {prof.tempoAula || '60 min'}</span>
                        </div>
                        {prof.horariosAula && (
                          <div className="text-[11px] text-zinc-400 mt-1 max-w-[200px] leading-tight line-clamp-2" title={prof.horariosAula}>
                            📅 {prof.horariosAula}
                          </div>
                        )}
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          prof.cargo === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {prof.cargo}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleRedefinirSenhaProfessor(prof)}
                            className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold transition border border-amber-800/40 flex items-center gap-1"
                            title="Redefinir Senha do Professor"
                          >
                            <span>🔑</span> Trocar Senha
                          </button>
                          <button
                            onClick={() => abrirModalEdicaoProf(prof)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 flex items-center gap-1"
                            title="Editar Dados do Professor"
                          >
                            <span>✏️</span> Editar
                          </button>
                          {prof.id !== usuarioLogado?.id && (
                            <button 
                              onClick={() => removerProfessor(prof.id, prof.nome)}
                              className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold transition border border-red-800/40"
                              title="Excluir Professor"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA: LEADS & AGENDAMENTOS EXPERIMENTAIS */}
        {abaAtiva === 'agendamentos' && (
          <div className="bg-[#141416] border border-zinc-800 rounded-xl overflow-hidden shadow-xl p-4 sm:p-6 space-y-4">
            <div className="flex gap-2 border-b border-zinc-800 pb-3">
              <button 
                onClick={() => setSubAbaExperimental('pendentes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  subAbaExperimental === 'pendentes' ? 'bg-red-600 text-white' : 'bg-[#1A1A1E] text-zinc-400'
                }`}
              >
                Aulas Agendadas ({agendamentos.pendentes?.length || 0})
              </button>
              <button 
                onClick={() => setSubAbaExperimental('posAula')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  subAbaExperimental === 'posAula' ? 'bg-red-600 text-white' : 'bg-[#1A1A1E] text-zinc-400'
                }`}
              >
                Pós-Aula / Fechar Contrato ({agendamentos.posAula?.length || 0})
              </button>
            </div>

            {subAbaExperimental === 'pendentes' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3">Nome</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">Data Prevista</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {agendamentos.pendentes?.map((ag: any) => (
                      <tr key={ag.id} className="hover:bg-zinc-800/30">
                        <td className="p-3 font-bold text-white">{ag.nome}</td>
                        <td className="p-3 text-zinc-300">{ag.telefone}</td>
                        <td className="p-3 text-zinc-300">{ag.data} às {ag.horario}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => marcarAulaRealizada(ag.id)}
                            className="px-2.5 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition"
                          >
                            ✓ Fez a Aula
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#1A1A1E] text-zinc-400 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3">Lead (Fez Aula)</th>
                      <th className="p-3">Dias Desde o Treino</th>
                      <th className="p-3">Observação</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {agendamentos.posAula?.map((ag: any) => (
                      <tr key={ag.id} className="hover:bg-zinc-800/30">
                        <td className="p-3 font-bold text-white">
                          {ag.nome}
                          <span className="block text-[11px] text-zinc-400 font-normal">{ag.telefone}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            ag.diasDesdeAula > 3 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {ag.diasDesdeAula} dias atrás
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400 text-xs italic">{ag.observacao || 'Sem observação'}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => setLeadParaConverter(ag)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                          >
                            Matricular Aluno
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL NOVO ALUNO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Matricular Novo Aluno</h3>
            <form onSubmit={criarAluno} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Nome Completo</label>
                <input required type="text" value={novoAluno.nome} onChange={(e) => setNovoAluno({...novoAluno, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">CPF (Obrigatório)</label>
                <input required type="text" value={novoAluno.cpf} onChange={(e) => setNovoAluno({...novoAluno, cpf: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="000.000.000-00" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">WhatsApp</label>
                  <input type="text" value={novoAluno.telefone} onChange={(e) => setNovoAluno({...novoAluno, telefone: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">Plano</label>
                  <select value={novoAluno.plano} onChange={(e) => setNovoAluno({...novoAluno, plano: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white">
                    <option value="2x na semana">2x na semana (R$ 130/mês)</option>
                    <option value="3x na semana">3x na semana (R$ 160/mês)</option>
                    <option value="Todos os Horários">Todos os Horários (R$ 280/mês)</option>
                    <option value="Diária">Diária Avulsa (R$ 40/treino)</option>
                    <option value="Wellhub">Wellhub / Gympass (Individual)</option>
                    <option value="TotalPass">TotalPass (Individual)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Salvar Matrícula</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PROFESSOR (EXCLUSIVO ADMIN) */}
      {showModalProf && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-[99999] overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-800 p-5 sm:p-6 rounded-2xl w-full max-w-xl shadow-2xl my-6">
            <h3 className="text-xl font-bold text-amber-400 mb-1">Cadastrar Professor / Usuário</h3>
            <p className="text-zinc-400 text-xs mb-4">Adicione um novo instrutor com permissão de lançar chamadas, gerenciar horários e graduar alunos.</p>
            
            <form onSubmit={criarProfessor} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Nome Completo</label>
                <input required type="text" value={novoProfessor.nome} onChange={(e) => setNovoProfessor({...novoProfessor, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: Felipe Borü" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-amber-400 text-xs font-bold mb-1">CPF (Login do Professor - Obrigatório)</label>
                  <input required type="text" value={novoProfessor.cpf} onChange={(e) => setNovoProfessor({...novoProfessor, cpf: e.target.value})} className="w-full bg-[#1A1A1E] border border-amber-500/50 rounded-lg p-2.5 text-sm text-white font-mono" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">WhatsApp / Telefone</label>
                  <input type="text" value={novoProfessor.telefone} onChange={(e) => setNovoProfessor({...novoProfessor, telefone: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="(69) 99999-9999" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">E-mail (Contato / Opcional)</label>
                  <input type="email" value={novoProfessor.email} onChange={(e) => setNovoProfessor({...novoProfessor, email: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="professor@boru.com" />
                </div>
                <div>
                  <label className="block text-amber-400 text-xs font-bold mb-1">Senha Inicial (Registrada pelo Admin)</label>
                  <input required type="password" value={novoProfessor.senha} onChange={(e) => setNovoProfessor({...novoProfessor, senha: e.target.value})} className="w-full bg-[#1A1A1E] border border-amber-500/50 rounded-lg p-2.5 text-sm text-white" placeholder="Senha do professor" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Cargo no Sistema</label>
                <select value={novoProfessor.cargo} onChange={(e) => setNovoProfessor({...novoProfessor, cargo: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white">
                  <option value="PROFESSOR">Professor / Instrutor</option>
                  <option value="ADMIN">Administrador Geral</option>
                </select>
              </div>

              {/* SELEÇÃO DA ARTE MARCIAL E DURAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-amber-400 text-xs font-bold mb-1">Arte Marcial / Modalidade</label>
                  <select 
                    value={novoProfessor.modalidade} 
                    onChange={(e) => {
                      const mod = e.target.value;
                      const primeiraGrad = graduacoesPorModalidade[mod]?.[0] || '';
                      setNovoProfessor({
                        ...novoProfessor,
                        modalidade: mod,
                        graduacao: primeiraGrad,
                        tempoPratica: (mod === 'Boxe' || mod === 'MMA') ? primeiraGrad : ''
                      });
                    }} 
                    className="w-full bg-[#1A1A1E] border border-amber-500/50 rounded-lg p-2.5 text-sm text-white font-bold"
                  >
                    <option value="Muay Thai">🥊 Muay Thai</option>
                    <option value="Jiu-Jitsu">🥋 Jiu-Jitsu</option>
                    <option value="Boxe">🥊 Boxe</option>
                    <option value="MMA">🤼 MMA</option>
                    <option value="Taekwondo">🥋 Taekwondo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 text-xs font-semibold mb-1">Duração de Cada Aula</label>
                  <select 
                    value={novoProfessor.tempoAula} 
                    onChange={(e) => setNovoProfessor({...novoProfessor, tempoAula: e.target.value})} 
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white font-medium"
                  >
                    {temposDeAula.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GRADUAÇÃO DINÂMICA OU TEMPO DE PRÁTICA */}
              <div>
                <label className="block text-zinc-300 text-xs font-semibold mb-1">
                  {novoProfessor.modalidade === 'Boxe' || novoProfessor.modalidade === 'MMA'
                    ? `Tempo de Prática / Experiência (${novoProfessor.modalidade})`
                    : `Graduação de Faixa / Prajied (${novoProfessor.modalidade})`}
                </label>
                
                <select 
                  value={novoProfessor.graduacao} 
                  onChange={(e) => setNovoProfessor({
                    ...novoProfessor, 
                    graduacao: e.target.value,
                    tempoPratica: (novoProfessor.modalidade === 'Boxe' || novoProfessor.modalidade === 'MMA') ? e.target.value : novoProfessor.tempoPratica
                  })} 
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white font-medium"
                >
                  {(graduacoesPorModalidade[novoProfessor.modalidade] || []).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                {(novoProfessor.modalidade === 'Boxe' || novoProfessor.modalidade === 'MMA') && (
                  <div className="mt-2">
                    <input 
                      type="text" 
                      value={novoProfessor.tempoPratica} 
                      onChange={(e) => setNovoProfessor({...novoProfessor, tempoPratica: e.target.value, graduacao: e.target.value})} 
                      placeholder="Ou digite o cartel / experiência (Ex: 8 anos de ringue, 12 lutas profissionais)"
                      className="w-full bg-[#1A1A1E] border border-zinc-700/80 rounded-lg p-2 text-xs text-zinc-300 placeholder-zinc-500"
                    />
                  </div>
                )}
              </div>

              {/* TEMPO QUE O PROFESSOR TEM DE AULAS (DOCÊNCIA) E CARGA HORÁRIA */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-amber-300 text-xs font-bold mb-1">
                      Tempo de Aulas / Docência
                    </label>
                    <select
                      value={novoProfessor.tempoDocencia}
                      onChange={(e) => setNovoProfessor({...novoProfessor, tempoDocencia: e.target.value})}
                      className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    >
                      {opcoesTempoDocencia.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-1">
                      Carga Horária Semanal
                    </label>
                    <input 
                      type="text" 
                      value={novoProfessor.cargaHorariaSemanal} 
                      onChange={(e) => setNovoProfessor({...novoProfessor, cargaHorariaSemanal: e.target.value})} 
                      placeholder="Ex: 8 horas/semana, 12h/sem"
                      className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">
                    Grade de Horários das Aulas do Professor no CT
                  </label>
                  <input 
                    type="text" 
                    value={novoProfessor.horariosAula} 
                    onChange={(e) => setNovoProfessor({...novoProfessor, horariosAula: e.target.value})} 
                    placeholder="Ex: Seg, Qua e Sex (18h e 19h30) | Ter e Qui (07h)"
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModalProf(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold">Criar Professor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PROFESSOR (EXCLUSIVO ADMIN) */}
      {showModalEditarProf && professorParaEditar && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-[99999] overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-800 p-5 sm:p-6 rounded-2xl w-full max-w-xl shadow-2xl my-6">
            <h3 className="text-xl font-bold text-white mb-1">Editar Dados do Professor</h3>
            <p className="text-zinc-400 text-xs mb-4">Altere modalidade, faixa, tempo de aulas/docência e horários de {professorParaEditar.nome}.</p>
            
            <form onSubmit={salvarEdicaoProfessor} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Nome Completo</label>
                <input required type="text" value={professorParaEditar.nome} onChange={(e) => setProfessorParaEditar({...professorParaEditar, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-amber-400 text-xs font-bold mb-1">CPF (Login do Professor - Obrigatório)</label>
                  <input required type="text" value={professorParaEditar.cpf || ''} onChange={(e) => setProfessorParaEditar({...professorParaEditar, cpf: e.target.value})} className="w-full bg-[#1A1A1E] border border-amber-500/50 rounded-lg p-2.5 text-sm text-white font-mono" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">WhatsApp / Telefone</label>
                  <input type="text" value={professorParaEditar.telefone} onChange={(e) => setProfessorParaEditar({...professorParaEditar, telefone: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Cargo</label>
                <select value={professorParaEditar.cargo} onChange={(e) => setProfessorParaEditar({...professorParaEditar, cargo: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white">
                  <option value="PROFESSOR">Professor / Instrutor</option>
                  <option value="ADMIN">Administrador Geral</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800">
                <div>
                  <label className="block text-amber-400 text-xs font-bold mb-1">Arte Marcial / Modalidade</label>
                  <select 
                    value={professorParaEditar.modalidade} 
                    onChange={(e) => {
                      const mod = e.target.value;
                      const primeiraGrad = graduacoesPorModalidade[mod]?.[0] || '';
                      setProfessorParaEditar({
                        ...professorParaEditar,
                        modalidade: mod,
                        graduacao: primeiraGrad,
                        tempoPratica: (mod === 'Boxe' || mod === 'MMA') ? primeiraGrad : ''
                      });
                    }} 
                    className="w-full bg-[#1A1A1E] border border-amber-500/50 rounded-lg p-2.5 text-sm text-white font-bold"
                  >
                    <option value="Muay Thai">🥊 Muay Thai</option>
                    <option value="Jiu-Jitsu">🥋 Jiu-Jitsu</option>
                    <option value="Boxe">🥊 Boxe</option>
                    <option value="MMA">🤼 MMA</option>
                    <option value="Taekwondo">🥋 Taekwondo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">Duração de Cada Aula</label>
                  <select 
                    value={professorParaEditar.tempoAula || '60 min'} 
                    onChange={(e) => setProfessorParaEditar({...professorParaEditar, tempoAula: e.target.value})} 
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
                  >
                    {temposDeAula.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 text-xs font-semibold mb-1">
                  {professorParaEditar.modalidade === 'Boxe' || professorParaEditar.modalidade === 'MMA'
                    ? `Tempo de Prática / Experiência (${professorParaEditar.modalidade})`
                    : `Graduação de Faixa / Prajied (${professorParaEditar.modalidade})`}
                </label>
                
                <select 
                  value={professorParaEditar.graduacao} 
                  onChange={(e) => setProfessorParaEditar({
                    ...professorParaEditar, 
                    graduacao: e.target.value,
                    tempoPratica: (professorParaEditar.modalidade === 'Boxe' || professorParaEditar.modalidade === 'MMA') ? e.target.value : professorParaEditar.tempoPratica
                  })} 
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white font-medium"
                >
                  {(graduacoesPorModalidade[professorParaEditar.modalidade] || []).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                {(professorParaEditar.modalidade === 'Boxe' || professorParaEditar.modalidade === 'MMA') && (
                  <div className="mt-2">
                    <input 
                      type="text" 
                      value={professorParaEditar.tempoPratica || ''} 
                      onChange={(e) => setProfessorParaEditar({...professorParaEditar, tempoPratica: e.target.value, graduacao: e.target.value})} 
                      placeholder="Ou digite o cartel / tempo personalizado"
                      className="w-full bg-[#1A1A1E] border border-zinc-700/80 rounded-lg p-2 text-xs text-zinc-300 placeholder-zinc-500"
                    />
                  </div>
                )}
              </div>

              {/* TEMPO QUE O PROFESSOR TEM DE AULAS (DOCÊNCIA) E CARGA HORÁRIA */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-amber-300 text-xs font-bold mb-1">
                      Tempo de Aulas / Docência
                    </label>
                    <input
                      type="text"
                      value={professorParaEditar.tempoDocencia || ''}
                      onChange={(e) => setProfessorParaEditar({...professorParaEditar, tempoDocencia: e.target.value})}
                      placeholder="Ex: 6 anos ministrando aulas"
                      className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-xs font-semibold mb-1">
                      Carga Horária Semanal
                    </label>
                    <input 
                      type="text" 
                      value={professorParaEditar.cargaHorariaSemanal || ''} 
                      onChange={(e) => setProfessorParaEditar({...professorParaEditar, cargaHorariaSemanal: e.target.value})} 
                      placeholder="Ex: 8 horas/semana"
                      className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">
                    Grade de Horários das Aulas do Professor no CT
                  </label>
                  <input 
                    type="text" 
                    value={professorParaEditar.horariosAula || ''} 
                    onChange={(e) => setProfessorParaEditar({...professorParaEditar, horariosAula: e.target.value})} 
                    placeholder="Ex: Seg, Qua e Sex (18h e 19h30)"
                    className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <label className="block text-amber-300 text-xs font-bold mb-1">🔑 Alterar Senha do Professor (Exclusivo Administrador)</label>
                <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                  Caso o professor tenha esquecido a senha ou precise de uma nova, digite abaixo. Se deixar em branco, a senha atual continuará a mesma.
                </p>
                <input 
                  type="password" 
                  value={professorParaEditar.senha || ''} 
                  onChange={(e) => setProfessorParaEditar({...professorParaEditar, senha: e.target.value})} 
                  placeholder="Digite a nova senha (ou deixe em branco)"
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModalEditarProf(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO AVISO */}
      {showModalAviso && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Publicar no Mural</h3>
            <form onSubmit={criarAviso} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Título do Aviso</label>
                <input required type="text" value={novoAviso.titulo} onChange={(e) => setNovoAviso({...novoAviso, titulo: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: Exame de Graduação" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Categoria / Tipo</label>
                <select value={novoAviso.tipo} onChange={(e) => setNovoAviso({...novoAviso, tipo: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white">
                  <option value="GERAL">Geral</option>
                  <option value="URGENTE">Urgente</option>
                  <option value="GRADUACAO">Graduação / Prajied</option>
                  <option value="EVENTO">Evento / Workshop</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Conteúdo da Mensagem</label>
                <textarea required rows={4} value={novoAviso.conteudo} onChange={(e) => setNovoAviso({...novoAviso, conteudo: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="Escreva o comunicado para os alunos..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="fixarAviso" checked={novoAviso.fixado} onChange={(e) => setNovoAviso({...novoAviso, fixado: e.target.checked})} className="rounded bg-zinc-800 border-zinc-700 text-red-600" />
                <label htmlFor="fixarAviso" className="text-xs text-zinc-300 font-semibold cursor-pointer">Fixar no topo do mural</label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModalAviso(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO PRODUTO NA LOJA */}
      {showModalProduto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Adicionar Produto na Loja</h3>
            <form onSubmit={criarProduto} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Nome do Produto</label>
                <input required type="text" value={novoProduto.nome} onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: Luva Muay Thai 14oz" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">Categoria</label>
                  <select value={novoProduto.categoria} onChange={(e) => setNovoProduto({...novoProduto, categoria: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white">
                    <option value="PROTETOR_BUCAL">Protetor Bucal</option>
                    <option value="LUVAS">Luvas</option>
                    <option value="CANELEIRAS">Caneleiras</option>
                    <option value="BANDAGENS">Bandagens</option>
                    <option value="ALIMENTOS">Alimentos & Bebidas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">Preço (R$)</label>
                  <input required type="number" step="0.5" value={novoProduto.preco} onChange={(e) => setNovoProduto({...novoProduto, preco: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="Ex: 45.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">Estoque</label>
                  <input type="number" value={novoProduto.estoque} onChange={(e) => setNovoProduto({...novoProduto, estoque: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-1">URL Imagem</label>
                  <input type="text" value={novoProduto.imagemUrl} onChange={(e) => setNovoProduto({...novoProduto, imagemUrl: e.target.value})} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-sm text-white" placeholder="Opcional" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowModalProduto(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CALENDÁRIO & FREQUÊNCIA DETALHADA COM PORCENTAGENS */}
      {alunoSelecionado && calendarioDados && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-6 z-[99999] overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  📅 Frequência: {alunoSelecionado.nome}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Plano: <strong className="text-white">{alunoSelecionado.plano}</strong> • Prajied: <strong className="text-red-400">{alunoSelecionado.prajied}</strong>
                </p>
              </div>
              <button 
                onClick={() => setAlunoSelecionado(null)}
                className="text-zinc-500 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* DESTAQUE DE FREQUÊNCIA SEMANAL PARA ALUNOS DE DIÁRIA OU CONVÊNIO */}
            {isDiariaOuConvenio(alunoSelecionado.plano) && (
              <div className="bg-gradient-to-r from-red-950/40 via-[#1A1A1E] to-[#141416] border border-red-500/30 rounded-xl p-4 mb-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <h4 className="text-sm font-bold text-white">Frequência Individual da Semana Atual</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {alunoSelecionado.plano}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Dias frequentados nesta semana: <strong className="text-zinc-200">{calendarioDados.estatisticas?.frequenciaSemanal?.diasFormatadosTexto || 'Nenhum treino registrado'}</strong>
                    </p>
                  </div>
                  <div className="bg-black/50 px-4 py-2 rounded-lg border border-zinc-800 text-center sm:text-right min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Nesta Semana</span>
                    <span className="text-2xl font-black text-amber-400">
                      {calendarioDados.estatisticas?.frequenciaSemanal?.totalNaSemana || 0}
                    </span>
                    <span className="text-xs text-zinc-400 ml-1">treino(s)</span>
                  </div>
                </div>
              </div>
            )}

            {/* CARDS COM AS PORCENTAGENS REQUISITADAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-green-400 mb-0.5">🟢 Presença Real</p>
                <p className="text-2xl font-black text-white">{calendarioDados.estatisticas.porcentagemPresenca}%</p>
                <span className="text-[10px] text-zinc-500">{calendarioDados.estatisticas.presentes} aulas feitas</span>
              </div>
              <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">🔵 Ausência Doença</p>
                <p className="text-2xl font-black text-blue-400">{calendarioDados.estatisticas.porcentagemDoenca}%</p>
                <span className="text-[10px] text-zinc-500">{calendarioDados.estatisticas.doenca} com atestado</span>
              </div>
              <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-red-400 mb-0.5">🔴 Falta Comum</p>
                <p className="text-2xl font-black text-red-500">{calendarioDados.estatisticas.porcentagemFalta}%</p>
                <span className="text-[10px] text-zinc-500">{calendarioDados.estatisticas.faltasNaoJustificadas} sem aviso</span>
              </div>
              <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-amber-400 mb-0.5">⭐ Presença Efetiva</p>
                <p className="text-2xl font-black text-amber-400">{calendarioDados.estatisticas.porcentagemGeral}%</p>
                <span className="text-[10px] text-zinc-500">Considera atestados</span>
              </div>
            </div>

            {/* MÊS E DIAS */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm sm:text-base font-bold text-white">
                Mês: {mesCalendario} / {anoCalendario}
              </h4>
              <div className="flex gap-2">
                <button onClick={() => mudarMesCalendario(-1)} className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded">← Anterior</button>
                <button onClick={() => mudarMesCalendario(1)} className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded">Próximo →</button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mb-2">Clique em qualquer dia para registrar Presença, Falta ou Doença:</p>

            {/* Grid dos dias */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-zinc-500 mb-1">
              <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: new Date(anoCalendario, mesCalendario - 1, 1).getDay() }).map((_, i) => (
                <div key={`emp-${i}`} className="h-16 rounded bg-zinc-900/20"></div>
              ))}
              {Array.from({ length: new Date(anoCalendario, mesCalendario, 0).getDate() }).map((_, i) => {
                const dia = i + 1;
                const dataIso = `${anoCalendario}-${String(mesCalendario).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const pres = calendarioDados.presencasPorDia?.[dataIso]?.[0];
                return (
                  <button
                    key={`d-${dia}`}
                    onClick={() => abrirAcaoDia(dataIso)}
                    className={`h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition hover:scale-105 ${
                      pres?.status === 'PRESENTE' ? 'bg-green-500/20 border-green-500/50 text-white' :
                      pres?.status === 'DOENCA' ? 'bg-blue-500/20 border-blue-500/50 text-white' :
                      pres?.status === 'FALTA' ? 'bg-red-500/20 border-red-500/50 text-white' :
                      'bg-[#1A1A1E] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="font-bold text-xs">{dia}</span>
                    <span className="text-[9px] font-bold truncate">
                      {pres?.status === 'PRESENTE' ? '✓ Presente' :
                       pres?.status === 'DOENCA' ? '🩺 Doença' :
                       pres?.status === 'FALTA' ? '✗ Falta' : '+ Marcar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AÇÃO DO DIA (PRESENÇA / FALTA / DOENÇA) */}
      {modalAcaoDia && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[999999]">
          <div className="bg-[#141416] border border-zinc-800 p-5 rounded-2xl w-full max-w-sm shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2">Lançar Registro para {diaSelecionadoAcao}</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Status da Chamada</label>
                <select 
                  value={statusAcaoDia} 
                  onChange={(e) => setStatusAcaoDia(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="PRESENTE">🟢 PRESENTE (Treinou normalmente)</option>
                  <option value="DOENCA">🔵 FALTA POR DOENÇA (Com atestado médico)</option>
                  <option value="FALTA">🔴 FALTA NÃO JUSTIFICADA (Sem comparecimento)</option>
                  <option value="JUSTIFICADO">ℹ️ OUTRA JUSTIFICATIVA (Trabalho/Viagem)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Motivo / Detalhes (Opcional)</label>
                <input 
                  type="text" 
                  value={justificativaInput} 
                  onChange={(e) => setJustificativaInput(e.target.value)}
                  placeholder="Ex: Gripe forte, Atestado de 2 dias..."
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white" 
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={removerPresencaDoDia}
                  className="text-red-500 hover:text-red-400 text-xs font-bold"
                >
                  Limpar Dia
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModalAcaoDia(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                  <button type="button" onClick={salvarPresencaNoDia} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">Salvar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONVERTER LEAD EM ALUNO */}
      {leadParaConverter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Matricular {leadParaConverter.nome}</h3>
            <p className="text-zinc-400 text-xs mb-4">A pessoa já fez a aula experimental e agora será inserida como aluno ativo.</p>
            <form onSubmit={converterLeadEmAluno} className="space-y-3">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Plano Escolhido</label>
                <select value={planoConversao} onChange={(e) => setPlanoConversao(e.target.value)} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white">
                  <option value="2x na semana">2x na semana (R$ 130/mês)</option>
                  <option value="3x na semana">3x na semana (R$ 160/mês)</option>
                  <option value="Todos os Horários">Todos os Horários (R$ 280/mês)</option>
                  <option value="Diária">Diária Avulsa (R$ 40/treino)</option>
                  <option value="Wellhub">Wellhub / Gympass (Individual)</option>
                  <option value="TotalPass">TotalPass (Individual)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Valor da Mensalidade (R$)</label>
                <input type="number" value={valorConversao} onChange={(e) => setValorConversao(e.target.value)} className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setLeadParaConverter(null)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">Concluir Matrícula</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LANÇAR ALUNO NO DIA DO CALENDÁRIO GERAL */}
      {modalLancarDia && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[999999] overflow-y-auto">
          <div className="bg-[#141416] border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Lançar Presença na Turma</h3>
                <p className="text-xs text-zinc-400">
                  Data: <strong className="text-red-400">
                    {new Date(diaSelecionadoGeral + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </strong>
                </p>
              </div>
              <button 
                onClick={() => setModalLancarDia(false)}
                className="text-zinc-500 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLancarPresencaDiaGeral} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Selecione o Aluno</label>
                <select
                  required
                  value={alunoLancarDia}
                  onChange={(e) => setAlunoLancarDia(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white font-medium"
                >
                  <option value="">-- Escolha um aluno --</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.plano || 'Geral'}) - {a.prajied || 'Branco'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Status da Presença</label>
                <select
                  value={statusLancarDia}
                  onChange={(e) => setStatusLancarDia(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white font-medium"
                >
                  <option value="PRESENTE">🟢 PRESENTE (Treinou normalmente)</option>
                  <option value="DOENCA">🔵 FALTA POR DOENÇA (Com atestado)</option>
                  <option value="FALTA">🔴 FALTA NÃO JUSTIFICADA</option>
                  <option value="JUSTIFICADO">ℹ️ OUTRA JUSTIFICATIVA (Trabalho/Viagem)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Observação / Justificativa (Opcional)</label>
                <input
                  type="text"
                  value={justificativaLancarDia}
                  onChange={(e) => setJustificativaLancarDia(e.target.value)}
                  placeholder="Ex: Treino das 18h, Atestado de 2 dias, etc."
                  className="w-full bg-[#1A1A1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalLancarDia(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Salvar Presença
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

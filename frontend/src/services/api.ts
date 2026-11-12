import axios from 'axios';

const defaultApiUrl =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://boru-api-fhdn.onrender.com/api';

const rawApiUrl = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(
  'boru-api-lkdn.onrender.com',
  'boru-api-fhdn.onrender.com'
);

const api = axios.create({
  baseURL: rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`
});

export const publicApi = {
  createAppointment: (data: unknown) => api.post('/agendamentos', data),
  checkout: (data: unknown) => api.post('/checkout', data),
  getNotices: () => api.get('/avisos'),
  getGallery: () => api.get('/galeria'),
  getProducts: () => api.get('/produtos'),
  getTeacherSchedules: () => api.get('/professores/horarios'),
  getTodayClasses: (params?: { alunoId?: string }) => api.get('/aulas/hoje', { params }),
  quickCheckIn: (data: { cpf?: string; senha?: string; alunoId?: string; shift?: string; eventoId?: string; horario?: string }) =>
    api.post('/quick-checkin', data),
  uploadFile: (data: { fileName: string; mimeType: string; base64Data: string; folder?: string }) =>
    api.post('/upload', data)
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAppointments: () => api.get('/admin/agendamentos'),
  getAttendance: () => api.get('/admin/presencas'),
  getTeachers: () => api.get('/admin/professores'),
  login: (data: unknown) => api.post('/auth/login', data),
  createTeacher: (data: unknown) => api.post('/admin/professores', data),
  updateTeacher: (id: string, data: unknown) => api.patch(`/admin/professores/${id}`, data),
  resetTeacherPassword: (id: string, novaSenha: string) => api.post(`/admin/professores/${id}/alterar-senha`, { novaSenha }),
  deleteTeacher: (id: string) => api.delete(`/admin/professores/${id}`),
  createNotice: (data: unknown) => api.post('/admin/avisos', data),
  deleteNotice: (id: string) => api.delete(`/admin/avisos/${id}`),
  getGallery: () => api.get('/galeria'),
  addGalleryPhoto: (data: { url: string; titulo?: string; subtitulo?: string; fileira?: string }) => api.post('/admin/galeria', data),
  deleteGalleryPhoto: (id: string) => api.delete(`/admin/galeria/${id}`),
  restoreGalleryDefault: () => api.post('/admin/galeria/restaurar'),
  createProduct: (data: unknown) => api.post('/admin/produtos', data),
  updateProduct: (id: string, data: unknown) => api.put(`/admin/produtos/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/produtos/${id}`),
  createStudent: (data: unknown) => api.post('/admin/alunos', data),
  updateStudent: (studentId: string, data: unknown) => api.patch(`/admin/alunos/${studentId}`, data),
  toggleStudentBolsista: (studentId: string, is_bolsista: boolean) =>
    api.patch(`/admin/alunos/${studentId}/bolsista`, { is_bolsista }),
  registerPayment: (studentId: string, data?: { dataPagamento?: string; valor?: number | string; metodoPagamento?: string }) =>
    api.post(`/admin/alunos/${studentId}/pagar`, data || {}),
  updateStudentGrade: (studentId: string, data: unknown) =>
    api.patch(`/admin/alunos/${studentId}/prajied`, data),
  getStudentCalendar: (studentId: string, params: { mes: number; ano: number }) =>
    api.get(`/admin/alunos/${studentId}/calendario`, { params }),
  saveStudentAttendance: (studentId: string, data: unknown) =>
    api.post(`/admin/alunos/${studentId}/presenca`, data),
  deleteStudentAttendance: (studentId: string, data: unknown) =>
    api.delete(`/admin/alunos/${studentId}/presenca`, { data }),
  updateAttendanceStatus: (attendanceId: string, data: unknown) =>
    api.patch(`/admin/presencas/${attendanceId}/status`, data),
  batchUpdateAttendance: (data: { presencaIds: string[]; status: string }) =>
    api.post('/admin/presencas/marcar-lote', data),
  getGeneralAttendance: (params?: { mes?: number; ano?: number }) =>
    api.get('/admin/frequencia-geral', { params }),
  batchSaveGeneralAttendance: (data: {
    alunoIds: string[];
    data: string;
    status: string;
    justificativa?: string | null;
    tipoJustificativa?: string | null;
  }) => api.post('/admin/frequencia-geral/lote', data),
  updateAppointment: (appointmentId: string, data: unknown) =>
    api.patch(`/admin/agendamentos/${appointmentId}`, data),
  convertAppointment: (appointmentId: string, data: unknown) =>
    api.post(`/admin/agendamentos/${appointmentId}/converter`, data),

  // Módulo 1: Dev Dashboard (Exclusivo AdminDev / BrgAdmin)
  getDevDashboard: (userEmail?: string, userId?: string) =>
    api.get('/dev/dashboard', {
      headers: {
        'x-admin-dev': 'true',
        'x-user-email': userEmail || 'brgadmin@boru.com',
        'x-user-id': userId || ''
      }
    }),
  createDevLog: (data: { level?: string; service?: string; message: string; metadata?: unknown }) =>
    api.post('/dev/logs', data, { headers: { 'x-admin-dev': 'true' } }),
  clearDevLogs: () => api.delete('/dev/logs', { headers: { 'x-admin-dev': 'true' } }),

  // Módulo 5 (Super ERP Financeiro): Assinaturas, Mercado, Gastos, Lucro, Gráficos e Tabelas
  getFinancialDashboard: (params?: { mes?: number; ano?: number }) =>
    api.get('/admin/financeiro', { params }),
  batchRegisterPayment: (data: {
    alunoIds: string[];
    dataPagamento: string;
    valorCustom?: number | string;
    metodoPagamento?: string;
    registradoPor?: string;
  }) => api.post('/admin/financeiro/baixa-lote', data),
  createFinancialTransaction: (data: unknown) =>
    api.post('/admin/financeiro/transacoes', data),
  updateFinancialTransaction: (id: string, data: unknown) =>
    api.patch(`/admin/financeiro/transacoes/${id}`, data),
  deleteFinancialTransaction: (id: string) =>
    api.delete(`/admin/financeiro/transacoes/${id}`),

  // Módulo 6: Split-List de Chamada Diária
  getSplitDailyRollCall: (data?: string) =>
    api.get('/admin/chamada-diaria', { params: data ? { data } : undefined }),
  markExpressDailyRollCall: (data: { alunoId: string; professorId?: string; data?: string; status?: string }) =>
    api.post('/admin/chamada-diaria/marcar', data),

  // Upload de Arquivo Local (Storage Real)
  uploadFile: (data: { fileName: string; mimeType: string; base64Data: string; folder?: string }) =>
    api.post('/upload', data),

  // Módulo 7: Gamificação ("Trilha do Nak Muay")
  getGamificationConfig: () => api.get('/admin/gamificacao/config'),
  getStudentsGamificationSummary: () => api.get('/admin/gamificacao/resumo-alunos'),
  approveSpecialGamification: (data: unknown) => api.post('/admin/gamificacao/aprovar-especial', data),
  createGamificationRank: (data: unknown) => api.post('/admin/gamificacao/ranks', data),
  updateGamificationRank: (id: string, data: unknown) => api.put(`/admin/gamificacao/ranks/${id}`, data),
  deleteGamificationRank: (id: string) => api.delete(`/admin/gamificacao/ranks/${id}`),
  createGamificationAchievement: (data: unknown) => api.post('/admin/gamificacao/conquistas', data),
  updateGamificationAchievement: (id: string, data: unknown) => api.put(`/admin/gamificacao/conquistas/${id}`, data),
  deleteGamificationAchievement: (id: string) => api.delete(`/admin/gamificacao/conquistas/${id}`),
  resetGamificationDefault: () => api.post('/admin/gamificacao/reset-padrao'),
  exportGamificationJson: () => api.get('/admin/gamificacao/export-json'),

  // Avaliação física e marcial do aluno
  getStudentEvaluation: (studentId: string) => api.get(`/admin/alunos/${studentId}/avaliacao`),
  saveStudentEvaluation: (studentId: string, data: any) => api.post(`/admin/alunos/${studentId}/avaliacao`, data),

  // Módulo Next-Gen Fase 1: Loja & Resgates na Recepção
  getStoreRedemptions: (status?: string) =>
    api.get('/admin/loja/resgates', { params: status ? { status } : undefined }),
  deliverStoreRedemption: (id: string, entreguePor?: string) =>
    api.post(`/admin/loja/resgates/${id}/entregar`, { entreguePor }),

  // Módulo Next-Gen Fase 1: Exames de Graduação
  registerGraduation: (alunoId: string, data: unknown) =>
    api.post(`/admin/alunos/${alunoId}/graduacoes`, data),

  // Módulo Next-Gen Fase 1: Fechamento de Caixa Diário Obrigatório
  getCashRegisterStatus: () => api.get('/admin/caixa/status'),
  openCashRegister: (data: { saldo_inicial_dinheiro: number; operador_id?: string; operador_nome?: string }) =>
    api.post('/admin/caixa/abrir', data),
  closeCashRegister: (data: {
    caixaId: string;
    saldo_dinheiro_contado: number;
    justificativa_diferenca?: string;
    operador_fechamento_id?: string;
    operador_fechamento_nome?: string;
  }) => api.post('/admin/caixa/fechar', data),
  getCashRegisterReports: () => api.get('/admin/caixa/relatorios'),

  // Módulo Next-Gen Fase 1: Gestão de Contratos Longos (3, 6, 12 meses)
  getStudentContracts: (alunoId: string) => api.get(`/admin/alunos/${alunoId}/contratos`),
  createStudentContract: (alunoId: string, data: unknown) =>
    api.post(`/admin/alunos/${alunoId}/contratos`, data),

  // Módulo Next-Gen Fase 1: Comissionamento Dinâmico de Professores
  getTeacherCommissionConfigs: () => api.get('/admin/professores/comissoes/config'),
  saveTeacherCommissionConfig: (data: unknown) =>
    api.post('/admin/professores/comissoes/config', data),
  getTeacherCommissionReport: (params?: { mes?: number; ano?: number }) =>
    api.get('/admin/professores/comissoes/relatorio', { params }),

  // Módulo Next-Gen Fase 1: Dashboard de Ocupação & Visão 360 do Aluno
  getOccupancyDashboard: () => api.get('/admin/dashboard/ocupacao'),
  getStudent360: (alunoId: string) => api.get(`/admin/alunos/${alunoId}/visao360`),

  // Módulo de Grade de Aulas, Horários e Calendário Geral (Sketch do Guardanapo)
  getMonthSchedule: (params: { mes: number; ano: number; alunoId?: string }) =>
    api.get('/calendario/aulas-mes', { params }),
  cancelClass: (eventoId: string, motivo?: string) =>
    api.post(`/aulas/${eventoId}/cancelar`, { motivo }),
  reactivateClass: (eventoId: string) =>
    api.post(`/aulas/${eventoId}/reativar`),
  markClassAttendance: (eventoId: string, data: { alunoId: string; status: string }) =>
    api.post(`/aulas/${eventoId}/marcar-presenca`, data),

  // ============================================================================
  // BORÜ IA AUTÔNOMA — INTELLIGENT OPERATIONS
  // ============================================================================
  getAiStatus: () => api.get('/admin/ia/status'),
  toggleAiMaster: (data: { enabled?: boolean; mode?: 'IA_AUTONOMA' | 'IA_ASSISTIDA' | 'MODO_MANUAL'; operador?: string }) =>
    api.post('/admin/ia/toggle', data),
  updateAiConfig: (data: Record<string, unknown>) =>
    api.patch('/admin/ia/config', data),
  getAiDashboard: (periodo: string = '30d') =>
    api.get('/admin/ia/dashboard', { params: { periodo } }),
  exportAiReportUrl: (formato: 'csv' | 'json' = 'csv') =>
    `${api.defaults.baseURL}/admin/ia/relatorios/exportar?formato=${formato}`,
  getAiConversations: (params?: { status?: string; tipo?: string; busca?: string }) =>
    api.get('/admin/ia/conversas', { params }),
  getAiConversationDetail: (id: string) =>
    api.get(`/admin/ia/conversas/${id}`),
  assumeAiConversation: (id: string, atendenteNome?: string) =>
    api.post(`/admin/ia/conversas/${id}/assumir`, { atendenteNome }),
  returnConversationToAi: (id: string, operadorNome?: string) =>
    api.post(`/admin/ia/conversas/${id}/devolver-ia`, { operadorNome }),
  sendManualWhatsAppMessage: (id: string, data: { conteudo: string; atendenteNome?: string; pausarIa?: boolean }) =>
    api.post(`/admin/ia/conversas/${id}/mensagem-manual`, data),
  approveAssistedMessage: (msgId: string, data?: { textoEditado?: string; aprovadoPor?: string }) =>
    api.post(`/admin/ia/mensagens/${msgId}/aprovar`, data || {}),
  rejectAssistedMessage: (msgId: string) =>
    api.post(`/admin/ia/mensagens/${msgId}/rejeitar`),
  scanFollowUps: () =>
    api.post('/admin/ia/followups/varrer'),
  processFollowUps: (forcarEnvioImediato = true) =>
    api.post('/admin/ia/followups/processar', { forcarEnvioImediato }),
  cancelFollowUp: (id: string) =>
    api.post(`/admin/ia/followups/${id}/cancelar`),
  updateFollowUp: (id: string, data: { mensagemSugerida?: string; agendadoPara?: string; descricaoMotivo?: string; status?: string }) =>
    api.patch(`/admin/ia/followups/${id}`, data),
  createFollowUp: (data: {
    telefone: string;
    nomeContato?: string;
    tipoGatilho?: string;
    descricaoMotivo?: string;
    mensagemSugerida: string;
    agendadoPara?: string;
    prazoHoras?: number;
  }) => api.post('/admin/ia/followups/criar', data),
  dispatchSingleFollowUp: (id: string, mensagemCustomizada?: string) =>
    api.post(`/admin/ia/followups/${id}/disparar`, { mensagemCustomizada }),
  deleteAiConversation: (id: string) =>
    api.delete(`/admin/ia/conversas/${id}`),
  updateAiTicket: (id: string, data: { status: string; resolvidoPor?: string }) =>
    api.patch(`/admin/ia/tickets/${id}`, data),
  simulateWhatsAppMessage: (data: {
    telefone: string;
    nomeContato?: string;
    conteudo: string;
    tipoMidia?: 'TEXT' | 'AUDIO' | 'IMAGE';
    transcricaoAudio?: string;
    forcarSimulacaoAtiva?: boolean;
  }) => api.post('/admin/ia/simular-mensagem', data),
};

export const studentApi = {
  login: (data: unknown) => api.post('/alunos/login', data),
  recoverPassword: (data: unknown) => api.post('/alunos/recuperar-senha', data),
  changePassword: (data: unknown) => api.post('/alunos/alterar-senha', data),
  getClasses: (params: { alunoId?: string }) => api.get('/aulas', { params }),
  getTeacherSchedules: () => api.get('/professores/horarios'),
  getCalendar: (studentId: string, params: { mes: number; ano: number }) =>
    api.get(`/admin/alunos/${studentId}/calendario`, { params }),
  getGamification: (studentId: string) => api.get(`/alunos/${studentId}/gamificacao`),
  markGamificationNotified: (studentId: string, achievementIds?: string[]) =>
    api.post(`/alunos/${studentId}/gamificacao/notificar`, { achievementIds }),
  checkIn: (data: unknown) => api.post('/checkin', data),
  getTodayClasses: (params?: { alunoId?: string }) => api.get('/aulas/hoje', { params }),
  quickCheckIn: (data: { cpf?: string; senha?: string; alunoId?: string; shift?: string; eventoId?: string; horario?: string }) =>
    api.post('/quick-checkin', data),
  justifyAbsence: (data: unknown) => api.post('/alunos/justificar-ausencia', data),
  getContract: (studentId: string) => api.get(`/alunos/${studentId}/contrato`),
  signContract: (studentId: string, data: { aceitoTermos: boolean; dataDeAdesaoCustom?: string }) =>
    api.post(`/alunos/${studentId}/assinar-contrato`, data),

  getEvaluation: (studentId: string) => api.get(`/alunos/${studentId}/avaliacao`),
  getLeaderboard: (periodo?: string) => api.get(`/alunos/ranking${periodo ? `?periodo=${periodo}` : ''}`),

  // Módulo Next-Gen Fase 1: Carteira de Points, Loja de Recompensas & Graduações
  getPointsWallet: (studentId: string) => api.get(`/alunos/${studentId}/carteira-pontos`),
  getRewardStoreItems: () => api.get('/loja/recompensas'),
  redeemStoreItem: (studentId: string, itemId: string) =>
    api.post(`/alunos/${studentId}/loja/resgatar`, { itemId }),
  getGraduations: (studentId: string) => api.get(`/alunos/${studentId}/graduacoes`),

  // Módulo de Grade de Aulas, Escolha de Horário e Cancelamento (Sketch do Guardanapo)
  getMonthSchedule: (params: { mes: number; ano: number; alunoId?: string }) =>
    api.get('/calendario/aulas-mes', { params }),
  checkInBySchedule: (data: { alunoId: string; eventoId: string; shift?: string }) =>
    api.post('/checkin/horario', data),
  cancelCheckIn: (data: { checkinId?: string; alunoId: string; eventoId?: string }) =>
    api.post('/checkin/cancelar', data),
};

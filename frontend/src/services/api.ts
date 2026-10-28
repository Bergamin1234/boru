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
  getProducts: () => api.get('/produtos'),
  getTeacherSchedules: () => api.get('/professores/horarios'),
  quickCheckIn: (data: { cpf?: string; senha?: string; alunoId?: string; shift?: string }) =>
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
  createProduct: (data: unknown) => api.post('/admin/produtos', data),
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

  // Módulo 5: Gestão Financeira & Baixa Manual com DatePicker
  getFinancialDashboard: () => api.get('/admin/financeiro'),
  batchRegisterPayment: (data: { alunoIds: string[]; dataPagamento: string; valorCustom?: number | string }) =>
    api.post('/admin/financeiro/baixa-lote', data),

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
  quickCheckIn: (data: { cpf?: string; senha?: string; alunoId?: string; shift?: string }) =>
    api.post('/quick-checkin', data),
  justifyAbsence: (data: unknown) => api.post('/alunos/justificar-ausencia', data),
  getContract: (studentId: string) => api.get(`/alunos/${studentId}/contrato`),
  signContract: (studentId: string, data: { aceitoTermos: boolean; dataDeAdesaoCustom?: string }) =>
    api.post(`/alunos/${studentId}/assinar-contrato`, data),
};

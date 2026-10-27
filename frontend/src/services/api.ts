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
  getProducts: () => api.get('/produtos')
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
  registerPayment: (studentId: string) => api.post(`/admin/alunos/${studentId}/pagar`),
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

  // Módulo de Gamificação ("Trilha do Nak Muay")
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
  getCalendar: (studentId: string, params: { mes: number; ano: number }) =>
    api.get(`/admin/alunos/${studentId}/calendario`, { params }),
  getGamification: (studentId: string) => api.get(`/alunos/${studentId}/gamificacao`),
  markGamificationNotified: (studentId: string, achievementIds?: string[]) =>
    api.post(`/alunos/${studentId}/gamificacao/notificar`, { achievementIds }),
  checkIn: (data: unknown) => api.post('/checkin', data),
  justifyAbsence: (data: unknown) => api.post('/alunos/justificar-ausencia', data)
};

import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 90000 });

api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      if (!isLoginPage) {
        Cookies.remove('token');
        Cookies.remove('user_roles');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('permissions');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authService = {
  login: (data: { email: string; password: string }) => api.post('/api/v1/auth/login', data),
  logout: () => api.post('/api/v1/auth/logout'),
  me: () => api.get('/api/v1/auth/me'),
  refresh: () => api.post('/api/v1/auth/refresh'),
  setTelegram: (telegram_chat_id: string) => api.post('/api/v1/auth/telegram', { telegram_chat_id }),
  updateMe: (data: any) => api.put(`/api/v1/users/${data.id || ''}`, data),
};

export const userService = {
  list: (params?: any) => api.get('/api/v1/users', { params }),
  show: (id: string) => api.get(`/api/v1/users/${id}`),
  assignRole: (id: string, role: string) => api.post(`/api/v1/users/${id}/roles`, { role }),
};

// ── Admin Services ────────────────────────────────────────────────────────────

export const adminUserService = {
  list:         (params?: any)              => api.get('/api/v1/admin/users', { params }),
  stats:        ()                          => api.get('/api/v1/admin/users/stats'),
  show:         (id: string)                => api.get(`/api/v1/admin/users/${id}`),
  create:       (data: any)                 => api.post('/api/v1/admin/users', data),
  update:       (id: string, data: any)     => api.patch(`/api/v1/admin/users/${id}`, data),
  updateRole:   (id: string, role: string)  => api.patch(`/api/v1/admin/users/${id}/role`, { role }),
  updateStatus: (id: string, is_active: boolean) => api.patch(`/api/v1/admin/users/${id}/status`, { is_active }),
  destroy:      (id: string)                => api.delete(`/api/v1/admin/users/${id}`),
};

export const adminProjectService = {
  list:    (params?: any)          => api.get('/api/v1/admin/projects', { params }),
  stats:   ()                      => api.get('/api/v1/admin/projects/stats'),
  show:    (id: string)            => api.get(`/api/v1/admin/projects/${id}`),
  update:  (id: string, data: any) => api.patch(`/api/v1/admin/projects/${id}`, data),
  destroy: (id: string)            => api.delete(`/api/v1/admin/projects/${id}`),
  tasks:   (id: string, params?: any) => api.get(`/api/v1/admin/projects/${id}/tasks`, { params }),
  members: (id: string)            => api.get(`/api/v1/admin/projects/${id}/members`),
  allTasks:(params?: any)          => api.get('/api/v1/admin/tasks', { params }),
};

export const adminWorkloadService = {
  summary:         (sprint_id: string)   => api.get('/api/v1/admin/workload/summary', { params: { sprint_id } }),
  capacityOverview:(sprint_id: string)   => api.get('/api/v1/admin/workload/capacity', { params: { sprint_id } }),
  setCapacity:     (data: any)           => api.post('/api/v1/admin/workload/capacity', data),
  burndown:        (sprint_id: string)   => api.get('/api/v1/admin/workload/burndown', { params: { sprint_id } }),
  velocity:        (project_id: string)  => api.get('/api/v1/admin/workload/velocity', { params: { project_id } }),
  userSummary:     (userId: string, sprint_id: string) => api.get(`/api/v1/admin/workload/users/${userId}`, { params: { sprint_id } }),
  userAssignments: (userId: string)      => api.get(`/api/v1/admin/workload/users/${userId}/assignments`),
  projectWorkload: (projectId: string)   => api.get(`/api/v1/admin/workload/projects/${projectId}`),
};

export const adminCalendarService = {
  list:             (params: any)             => api.get('/api/v1/admin/calendar', { params }),
  create:           (data: any)               => api.post('/api/v1/admin/calendar', data),
  show:             (id: string)              => api.get(`/api/v1/admin/calendar/${id}`),
  update:           (id: string, data: any)   => api.put(`/api/v1/admin/calendar/${id}`, data),
  destroy:          (id: string)              => api.delete(`/api/v1/admin/calendar/${id}`),
  participants:     (id: string)              => api.get(`/api/v1/admin/calendar/${id}/participants`),
  addParticipants:  (id: string, user_ids: string[]) => api.post(`/api/v1/admin/calendar/${id}/participants`, { user_ids }),
  removeParticipant:(id: string, userId: string)     => api.delete(`/api/v1/admin/calendar/${id}/participants/${userId}`),
};

// ── Regular Services ──────────────────────────────────────────────────────────

export const projectService = {
  list: () => api.get('/api/v1/projects'),
  create: (data: any) => api.post('/api/v1/projects', data),
  show: (id: string) => api.get(`/api/v1/projects/${id}`),
  update: (id: string, data: any) => api.put(`/api/v1/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/projects/${id}`),
  members: (id: string) => api.get(`/api/v1/projects/${id}/members`),
  addMember: (id: string, data: any) => api.post(`/api/v1/projects/${id}/members`, data),
  removeMember: (id: string, userId: string) => api.delete(`/api/v1/projects/${id}/members/${userId}`),
  board: (id: string, sprintId?: string) => api.get(`/api/v1/projects/${id}/board`, { params: { sprint_id: sprintId } }),
  roadmap: (id: string) => api.get(`/api/v1/projects/${id}/roadmap`),
};

export const sprintService = {
  list: (projectId: string) => api.get(`/api/v1/projects/${projectId}/sprints`),
  stories: (sprintId: string) => api.get(`/api/v1/sprints/${sprintId}/stories`),
  create: (projectId: string, data: any) => api.post(`/api/v1/projects/${projectId}/sprints`, data),
  start: (projectId: string, sprintId: string) => api.post(`/api/v1/projects/${projectId}/sprints/${sprintId}/start`),
  complete: (projectId: string, sprintId: string) => api.post(`/api/v1/projects/${projectId}/sprints/${sprintId}/complete`),
};

export const epicService = {
  list: (projectId: string) => api.get(`/api/v1/projects/${projectId}/epics`),
  create: (projectId: string, data: any) => api.post(`/api/v1/projects/${projectId}/epics`, data),
  show: (epicId: string) => api.get(`/api/v1/epics/${epicId}`),
  update: (epicId: string, data: any) => api.put(`/api/v1/epics/${epicId}`, data),
  delete: (epicId: string) => api.delete(`/api/v1/epics/${epicId}`),
};

export const storyService = {
  list: (epicId: string) => api.get(`/api/v1/epics/${epicId}/stories`),
  create: (epicId: string, data: any) => api.post(`/api/v1/epics/${epicId}/stories`, data),
  update: (storyId: string, data: any) => api.put(`/api/v1/stories/${storyId}`, data),
  delete: (storyId: string) => api.delete(`/api/v1/stories/${storyId}`),
};

export const taskService = {
  list: (params?: any) => api.get('/api/v1/tasks', { params }),
  create: (data: any) => api.post('/api/v1/tasks', data),
  show: (id: string) => api.get(`/api/v1/tasks/${id}`),
  update: (id: string, data: any) => api.put(`/api/v1/tasks/${id}`, data),
  assign: (id: string, assignee_id: string) => api.post(`/api/v1/tasks/${id}/assign`, { assignee_id }),
  logTime: (id: string, data: any) => api.post(`/api/v1/tasks/${id}/log-time`, data),
  move: (id: string, status: string) => api.patch(`/api/v1/tasks/${id}/move`, { status }),
  removeAssignee: (id: string, userId: string) => api.delete(`/api/v1/tasks/${id}/assignees/${userId}`),
  delete: (id: string) => api.delete(`/api/v1/tasks/${id}`),
  comments: (id: string) => api.get(`/api/v1/tasks/${id}/comments`),
  addComment: (id: string, data: any) => api.post(`/api/v1/tasks/${id}/comments`, data),
};

export const workloadService = {
  summary: (sprint_id: string) => api.get('/api/v1/workload/summary', { params: { sprint_id } }),
  me: (sprint_id: string) => api.get('/api/v1/workload/me', { params: { sprint_id } }),
  setCapacity: (data: any) => api.post('/api/v1/workload/capacity', data),
  burndown: (sprint_id: string) => api.get('/api/v1/workload/burndown', { params: { sprint_id } }),
  velocity: (project_id: string) => api.get('/api/v1/workload/velocity', { params: { project_id } }),
  calendar: (params: any) => api.get('/api/v1/workload/calendar', { params }),
};

export const calendarService = {
  list: (from: string, to: string) => api.get('/api/v1/calendar', { params: { from, to } }),
  create: (data: any) => api.post('/api/v1/calendar', data),
  update: (id: string, data: any) => api.put(`/api/v1/calendar/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/calendar/${id}`),
  participants: (id: string) => api.get(`/api/v1/calendar/${id}/participants`),
  addParticipants: (id: string, user_ids: string[]) => api.post(`/api/v1/calendar/${id}/participants`, { user_ids }),
  removeParticipant: (id: string, userId: string) => api.delete(`/api/v1/calendar/${id}/participants/${userId}`),
};

export const reportExportService = {
  workload: (sprint_id?: string) => api.get('/api/v1/reports/export/workload', { params: sprint_id ? { sprint_id } : {}, responseType: 'blob' }),
  sprint: (sprint_id: string) => api.get(`/api/v1/reports/export/sprint/${sprint_id}`, { responseType: 'blob' }),
  velocity: (project_id: string) => api.get('/api/v1/reports/export/velocity', { params: { project_id }, responseType: 'blob' }),
  timeTracking: (params: any) => api.get('/api/v1/reports/export/time-tracking', { params, responseType: 'blob' }),
};

export const reportService = {
  workload: (sprint_id: string) => api.get('/api/v1/reports/workload', { params: { sprint_id } }),
  division: (sprint_id: string) => api.get('/api/v1/reports/division', { params: { sprint_id } }),
  timeTracking: (params: any) => api.get('/api/v1/reports/time', { params }),
  sprint: (sprintId: string) => api.get(`/api/v1/reports/sprint/${sprintId}`),
  velocity: (project_id: string) => api.get('/api/v1/reports/velocity', { params: { project_id } }),
};

export const notificationService = {
  list: (page = 1) => api.get('/api/v1/notifications', { params: { page } }),
  markRead: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
  settings: () => api.get('/api/v1/notifications/settings'),
  updateSettings: (data: any) => api.put('/api/v1/notifications/settings', data),
  markAllRead: () => api.post('/api/v1/notifications/read-all'),
};

export const storageService = {
  upload: (formData: FormData) => api.post('/api/v1/storage/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => api.get('/api/v1/storage'),
  download: (fileId: string) => api.get(`/api/v1/storage/${fileId}/download`),
  delete: (fileId: string) => api.delete(`/api/v1/storage/${fileId}`),
};

export default api;

export const permissionService = {
  definitions: () => api.get('/api/v1/permissions/definitions'),
  getUserPermissions: (userId: string) => api.get(`/api/v1/permissions/users/${userId}`),
  setPermission: (userId: string, permission: string, granted: boolean) =>
    api.post(`/api/v1/permissions/users/${userId}`, { permission, granted }),
  resetPermissions: (userId: string) => api.delete(`/api/v1/permissions/users/${userId}/reset`),
  myPermissions: () => api.get('/api/v1/auth/me/permissions'),
};


export const assetService = {
  list: (params?: any) => api.get('/api/v1/assets', { params }),
  create: (data: any) => api.post('/api/v1/assets', data),
  show: (id: string) => api.get(`/api/v1/assets/${id}`),
  update: (id: string, data: any) => api.put(`/api/v1/assets/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/assets/${id}`),
};

export const documentService = {
  list: (params?: any) => api.get('/api/v1/documents', { params }),
  create: (formData: FormData) => api.post('/api/v1/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  show: (id: string) => api.get(`/api/v1/documents/${id}`),
  update: (id: string, formData: FormData) => api.put(`/api/v1/documents/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id: string) => api.get(`/api/v1/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/api/v1/documents/${id}`),
};

export const changeRequestService = {
  list: (params?: any) => api.get('/api/v1/change-requests', { params }),
  create: (data: any) => api.post('/api/v1/change-requests', data),
  show: (id: string) => api.get(`/api/v1/change-requests/${id}`),
  update: (id: string, data: any) => api.put(`/api/v1/change-requests/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/change-requests/${id}`),
  submit: (id: string) => api.post(`/api/v1/change-requests/${id}/submit`),
  approve: (id: string, note?: string) => api.post(`/api/v1/change-requests/${id}/approve`, { note }),
  reject: (id: string, note: string) => api.post(`/api/v1/change-requests/${id}/reject`, { note }),
  implement: (id: string, catatan?: string) => api.post(`/api/v1/change-requests/${id}/implement`, { catatan }),
  logs: (id: string) => api.get(`/api/v1/change-requests/${id}/logs`),
  getUsers: () => api.get('/api/v1/admin/users', { params: { per_page: 100 } }),
};

export const crAttachmentService = {
  list: (crId: string) => api.get(`/api/v1/change-requests/${crId}/attachments`),
  upload: (crId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/v1/change-requests/${crId}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  download: (crId: string, attachId: string) => api.get(`/api/v1/change-requests/${crId}/attachments/${attachId}/download`, { responseType: 'blob' }),
  delete: (crId: string, attachId: string) => api.delete(`/api/v1/change-requests/${crId}/attachments/${attachId}`),
};

export const esignService = {
  list: () => api.get('/api/v1/esign'),
  sign: (formData: FormData) => api.post('/api/v1/esign/sign', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id: string) => api.get(`/api/v1/esign/${id}/download`, { responseType: 'blob' }),
  verify: (id: string) => api.post(`/api/v1/esign/${id}/verify`),
};

export const dailyBriefService = {
  get: () => api.get('/api/v1/reports/daily-brief'),
};

export const adminNotifService = {
  telegramUsers: () => api.get('/api/v1/notifications/telegram/users'),
};

export const adminReportExportService = {
  users:    () =>
    api.get('/api/v1/admin/reports/export/users', { responseType: 'blob' }),
  projects: () =>
    api.get('/api/v1/admin/reports/export/projects', { responseType: 'blob' }),
  calendar: (from: string, to: string) =>
    api.get('/api/v1/admin/reports/export/calendar', { params: { from, to }, responseType: 'blob' }),
  workload: (project_id: string, sprint_id?: string) =>
    api.get('/api/v1/admin/reports/export/workload', {
      params: { project_id, ...(sprint_id ? { sprint_id } : {}) },
      responseType: 'blob',
    }),
};

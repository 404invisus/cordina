import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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
};

export const userService = {
  list: (params?: any) => api.get('/api/v1/users', { params }),
  show: (id: string) => api.get(`/api/v1/users/${id}`),
  assignRole: (id: string, role: string) => api.post(`/api/v1/users/${id}/roles`, { role }),
};

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
  assignmentsByUser: (userId: string) => api.get(`/api/v1/workload/assignments/user/${userId}`),
  assignmentsByProject: (projectId: string) => api.get(`/api/v1/workload/assignments/project/${projectId}`),
};

export const reportService = {
  workload: (sprint_id: string) => api.get('/api/v1/reports/workload', { params: { sprint_id } }),
  division: (sprint_id: string) => api.get('/api/v1/reports/division', { params: { sprint_id } }),
  timeTracking: (params: any) => api.get('/api/v1/reports/time', { params }),
  sprint: (sprintId: string) => api.get(`/api/v1/reports/sprint/${sprintId}`),
  velocity: (project_id: string) => api.get('/api/v1/reports/velocity', { params: { project_id } }),
};

export const notificationService = {
  list: () => api.get('/api/v1/notifications'),
  markRead: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
  settings: () => api.get('/api/v1/notifications/settings'),
  updateSettings: (data: any) => api.put('/api/v1/notifications/settings', data),
};

export const storageService = {
  upload: (formData: FormData) => api.post('/api/v1/storage/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => api.get('/api/v1/storage'),
  download: (fileId: string) => api.get(`/api/v1/storage/${fileId}/download`),
  delete: (fileId: string) => api.delete(`/api/v1/storage/${fileId}`),
};

export default api;

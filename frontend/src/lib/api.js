import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Students
export const studentsApi = {
  getAll: () => api.get('/students'),
  getOne: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Lessons
export const lessonsApi = {
  getAll: (studentId) => api.get('/lessons', { params: { student_id: studentId } }),
  getOne: (id) => api.get(`/lessons/${id}`),
  create: (data) => api.post('/lessons', data),
  update: (id, data) => api.put(`/lessons/${id}`, data),
  delete: (id) => api.delete(`/lessons/${id}`),
};

// Schedule Overrides
export const scheduleApi = {
  getOverrides: (lessonId, date) => api.get('/schedule-overrides', { params: { lesson_id: lessonId, date } }),
  createOverride: (data) => api.post('/schedule-overrides', data),
  deleteOverride: (id) => api.delete(`/schedule-overrides/${id}`),
  reschedule: (lessonId, originalDate, newDate, newTime, reason) => 
    api.post('/lessons/reschedule', null, { 
      params: { lesson_id: lessonId, original_date: originalDate, new_date: newDate, new_time: newTime, reason } 
    }),
};

// One-time Lessons (manual entries)
export const oneTimeLessonsApi = {
  getAll: (studentId, month) => api.get('/one-time-lessons', { params: { student_id: studentId, month } }),
  create: (data) => api.post('/one-time-lessons', data),
  update: (id, data) => api.put(`/one-time-lessons/${id}`, data),
  delete: (id) => api.delete(`/one-time-lessons/${id}`),
};

// Completed Lessons (Attendance)
export const completedLessonsApi = {
  getAll: (studentId, month) => api.get('/completed-lessons', { params: { student_id: studentId, month } }),
  create: (data) => api.post('/completed-lessons', data),
  delete: (id) => api.delete(`/completed-lessons/${id}`),
  getMonthlySummary: (studentId, month) => api.get(`/completed-lessons/summary/${studentId}`, { params: { month } }),
};

// Fees
export const feesApi = {
  getAll: (studentId, status) => api.get('/fees', { params: { student_id: studentId, status } }),
  getOne: (id) => api.get(`/fees/${id}`),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  markPaid: (id) => api.put(`/fees/${id}/mark-paid`),
  delete: (id) => api.delete(`/fees/${id}`),
};

// Notes
export const notesApi = {
  getAll: (studentId) => api.get('/notes', { params: { student_id: studentId } }),
  create: (data) => api.post('/notes', data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getUpcomingLessons: () => api.get('/dashboard/upcoming-lessons'),
  getPendingFees: () => api.get('/dashboard/pending-fees'),
};

// Expenses
export const expensesApi = {
  getAll: (category, month) => api.get('/expenses', { params: { category, month } }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Finances
export const financesApi = {
  getSummary: () => api.get('/finances/summary'),
  getMonthly: () => api.get('/finances/monthly'),
  getExpenseBreakdown: () => api.get('/finances/expense-breakdown'),
  exportExcel: () => api.get('/finances/export-excel', { responseType: 'blob' }),
};

export default api;

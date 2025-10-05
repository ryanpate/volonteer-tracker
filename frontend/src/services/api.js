import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/token/`, { username, password }),
  
  getCurrentUser: () => api.get('/auth/me/'),
  
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirm: newPassword,
    }),
};

// Volunteers API
export const volunteersAPI = {
  getAll: (params) => api.get('/volunteers/', { params }),
  getById: (id) => api.get(`/volunteers/${id}/`),
  getHistory: (id) => api.get(`/volunteers/${id}/history/`),
  getSummary: (id) => api.get(`/volunteers/${id}/summary/`),
  getTeams: (id) => api.get(`/volunteers/${id}/teams/`),
  create: (data) => api.post('/volunteers/', data),
  update: (id, data) => api.put(`/volunteers/${id}/`, data),
  delete: (id) => api.delete(`/volunteers/${id}/`),
  sync: () => api.post('/volunteers/sync/'),
};

// Interactions API
export const interactionsAPI = {
  getAll: (params) => api.get('/interactions/', { params }),
  getById: (id) => api.get(`/interactions/${id}/`),
  create: (data) => api.post('/interactions/', data),
  update: (id, data) => api.put(`/interactions/${id}/`, data),
  delete: (id) => api.delete(`/interactions/${id}/`),
  completeFollowup: (id) => api.post(`/interactions/${id}/complete_followup/`),
  getPendingFollowups: () => api.get('/interactions/pending_followups/'),
  getOverdueFollowups: () => api.get('/interactions/overdue_followups/'),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview/'),
  getTrends: () => api.get('/dashboard/trends/'),
  getTeamActivity: () => api.get('/dashboard/team-activity/'),
  getVolunteersNeedCheckin: () => api.get('/dashboard/volunteers-need-checkin/'),
  getRecentInteractions: (limit = 10) => api.get('/dashboard/recent-interactions/', { params: { limit } }),
  getUpcomingFollowups: (days = 7) => api.get('/dashboard/upcoming-followups/', { params: { days } }),
  getMyStats: () => api.get('/dashboard/my-stats/'),
  getEngagementMetrics: () => api.get('/dashboard/engagement-metrics/'),
};

// Team Members API (Admin only)
export const teamAPI = {
  getAll: () => api.get('/team-members/'),
  getById: (id) => api.get(`/team-members/${id}/`),
  create: (data) => api.post('/team-members/', data),
  update: (id, data) => api.put(`/team-members/${id}/`, data),
  delete: (id) => api.delete(`/team-members/${id}/`),
  deactivate: (id) => api.post(`/team-members/${id}/deactivate/`),
  activate: (id) => api.post(`/team-members/${id}/activate/`),
  resetPassword: (id, newPassword) =>
    api.post(`/team-members/${id}/reset_password/`, { new_password: newPassword }),
};

export default api;
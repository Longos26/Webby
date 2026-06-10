import axios from 'axios';

// ============================================================
// COMPLETE API CONFIGURATION - ALL METHODS FIXED
// ============================================================

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://webby-1osa.onrender.com';
  }
  return 'http://localhost:8000';
};

const API_URL = getApiUrl();

console.log(`🔧 API Base URL: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 90000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// NOTIFICATION SERVICE - FIXED
// ============================================================

export const notificationService = {
  getNotifications: async (limit = 50, offset = 0) => {
    const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  },
  
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
  
  deleteAllNotifications: async () => {
    const response = await api.delete('/notifications/clear');
    return response.data;
  },
};

// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return { success: true };
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// ============================================================
// JOB SERVICE
// ============================================================

export const jobService = {
  getAllJobs: async (statusFilter = 'all') => {
    const params = statusFilter !== 'all' ? { status: statusFilter } : {};
    const response = await api.get('/api/jobs', { params });
    return response.data;
  },

  getJob: async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
  },

  updateJob: async (jobId, updateData) => {
    const response = await api.put(`/api/jobs/${jobId}`, updateData);
    return response.data;
  },

  deleteJob: async (jobId) => {
    const response = await api.delete(`/api/jobs/${jobId}`);
    return response.data;
  },

  startJob: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/start`);
    return response.data;
  },

  pauseJob: async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/pause`);
    return response.data;
  },
};

// ============================================================
// DASHBOARD SERVICE
// ============================================================

export const dashboardService = {
  getSuccessRate: async (days = 7) => {
    const response = await api.get(`/api/dashboard/success-rate?days=${days}`);
    return response.data;
  },

  getRealtimeMetrics: async () => {
    const response = await api.get('/api/dashboard/realtime');
    return response.data;
  },

  getRecentJobs: async (limit = 10) => {
    const response = await api.get(`/api/dashboard/recent?limit=${limit}`);
    return response.data;
  },

  getPerformanceMetrics: async () => {
    const response = await api.get('/api/dashboard/performance');
    return response.data;
  },
};

// ============================================================
// ACTIVITY SERVICE
// ============================================================

export const activityService = {
  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/api/activity/recent?limit=${limit}`);
    return response.data;
  },
};

// ============================================================
// EXPORT SERVICE
// ============================================================

export const exportService = {
  // This endpoint is now GET, not POST
  getJobsWithResults: async () => {
    const response = await api.get('/api/export/jobs-with-results');  // Changed to GET
    return response.data;
  },

  generateExport: async (exportConfig) => {
    const response = await api.post('/api/export/generate', exportConfig, {
      responseType: 'blob',
    });
    return response;
  },

  previewExport: async (jobId, limit = 10) => {
    const response = await api.post(`/api/export/preview/${jobId}`, { limit });
    return response.data;
  },

  bulkExport: async (bulkConfig) => {
    const response = await api.post('/api/export/bulk', bulkConfig, {
      responseType: 'blob',
    });
    return response;
  },

  getExportStats: async (jobId) => {
    const response = await api.get(`/api/export/stats/${jobId}`);
    return response.data;
  },
};

// ============================================================
// LLM SERVICE
// ============================================================

export const llmService = {
  getProviders: async () => {
    const response = await api.get('/api/llm/providers');
    return response.data;
  },

  parseContent: async (domContent, parseDescription, provider = 'openrouter', model = null) => {
    const response = await api.post('/api/llm/parse', {
      dom_content: domContent,
      parse_description: parseDescription,
      provider: provider,
      model: model,
    });
    return response.data;
  },

  testConnection: async (provider, model, apiKey = null, baseUrl = null) => {
    const response = await api.post('/api/llm/test', {
      provider,
      model,
      api_key: apiKey,
      base_url: baseUrl,
    });
    return response.data;
  },

  getConfig: async (provider) => {
    const response = await api.get(`/api/llm/config/${provider}`);
    return response.data;
  },

  saveConfig: async (provider, config) => {
    const response = await api.post(`/api/llm/config/${provider}`, config);
    return response.data;
  },

  getStats: async (provider = null) => {
    const params = provider ? { provider } : {};
    const response = await api.get('/api/llm/stats', { params });
    return response.data;
  },
};

// ============================================================
// SETTINGS SERVICE
// ============================================================

export const settingsService = {
  getProfile: async () => {
    const response = await api.get('/api/settings/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/settings/profile', profileData);
    return response.data;
  },

  updatePassword: async (passwordData) => {
    const response = await api.put('/api/settings/password', passwordData);
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await api.get('/api/settings/notifications');
    return response.data;
  },

  updateNotificationPreferences: async (preferences) => {
    const response = await api.put('/api/settings/notifications', preferences);
    return response.data;
  },

  getApiKeys: async () => {
    const response = await api.get('/api/settings/api-keys');
    return response.data;
  },

  createApiKey: async (name, scopes) => {
    const response = await api.post('/api/settings/api-keys', { name, scopes });
    return response.data;
  },

  deleteApiKey: async (keyId) => {
    const response = await api.delete(`/api/settings/api-keys/${keyId}`);
    return response.data;
  },

  getApiUsage: async () => {
    const response = await api.get('/api/settings/api-keys/usage');
    return response.data;
  },
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

// Attach all services to default export
api.auth = authService;
api.jobs = jobService;
api.dashboard = dashboardService;
api.activity = activityService;
api.export = exportService;
api.llm = llmService;
api.settings = settingsService;
api.notifications = notificationService;

export default api;
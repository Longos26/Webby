import axios from 'axios';

// ============================================================
// FIXED API CONFIGURATION FOR VERCEL + RENDER DEPLOYMENT
// ============================================================

// Get API URL based on environment
const getApiUrl = () => {
  // Production: Use your Render backend URL
  if (process.env.NODE_ENV === 'production') {
    // IMPORTANT: Replace with your actual Render backend URL
    return 'https://webby-1osa.onrender.com';
  }
  // Development: Use local backend
  return 'http://localhost:8000';
};

const API_URL = getApiUrl();

console.log(`🔧 API Base URL: ${API_URL} (Environment: ${process.env.NODE_ENV})`);

// Create axios instance with enhanced config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 90000,
  withCredentials: true,  // Important for CORS
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Try both token keys for compatibility
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
        console.log('🔐 Token expired or invalid, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberedEmail');
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Cannot connect to backend');
      console.error(`   Backend URL: ${API_URL}`);
      console.error('   Make sure your Render backend is running and CORS is configured');
      error.userMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🔍 Testing connection to:', `${API_URL}/health`);
    const response = await api.get('/health');
    console.log('✅ Connection test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Auto-test connection on module load (non-blocking)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().then(result => {
      if (result.success) {
        console.log('🎉 Backend connection established!');
      } else {
        console.warn('⚠️ Backend connection failed. Check your API_URL configuration.');
      }
    });
  }, 1000);
}

// Auth Service
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('token', response.data.access_token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
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
    } catch (e) {
      // Ignore logout errors
    }
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

// Job Service
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
    const response = await api.post('/api/jobs', {
      ...jobData,
      auto_start: true,
    });
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

  getParsedResults: async (jobId) => {
    const response = await api.get(`/api/scraping/jobs/${jobId}/parsed-results`);
    return response.data;
  },

  parseJobContent: async (jobId, parseDescription) => {
    const response = await api.post(`/api/scraping/jobs/${jobId}/parse`, {
      parse_description: parseDescription,
    });
    return response.data;
  },
};

// Scraping Service
export const scrapingService = {
  scrapeWebsite: async (url, useSelenium = false) => {
    const response = await api.post('/api/scraping/scrape', { url, use_selenium: useSelenium });
    return response.data;
  },

  parseContent: async (domContent, parseDescription) => {
    const response = await api.post('/api/scraping/parse', {
      dom_content: domContent,
      parse_description: parseDescription,
    });
    return response.data;
  },

  createJob: async (name, url, frequency = 'one-time') => {
    const response = await api.post('/api/scraping/jobs', { name, url, frequency });
    return response.data;
  },

  getJobs: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/api/scraping/jobs', { params });
    return response.data;
  },

  getJob: async (jobId) => {
    const response = await api.get(`/api/scraping/jobs/${jobId}`);
    return response.data;
  },
};

// LLM Service
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

// Dashboard Service
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

  getExportStats: async (days = 30) => {
    const response = await api.get(`/api/dashboard/export-stats?days=${days}`);
    return response.data;
  },
};

// Activity Service
export const activityService = {
  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/api/activity/recent?limit=${limit}`);
    return response.data;
  },
};

// Export Service
export const exportService = {
  getJobsWithResults: async () => {
    const response = await api.get('/api/export/jobs');
    return response.data;
  },

  getParseResults: async (jobId) => {
    const response = await api.get(`/api/export/parse-results/${jobId}`);
    return response.data;
  },

  generateExport: async (exportConfig) => {
    const response = await api.post('/api/export/generate', exportConfig, {
      responseType: 'blob',
    });
    return response;
  },

  getExportHistory: async () => {
    const response = await api.get('/api/export/history');
    return response.data;
  },

  downloadExport: async (exportId) => {
    const response = await api.get(`/api/export/download/${exportId}`, {
      responseType: 'blob',
    });
    return response;
  },

  previewExport: async (jobId) => {
    const response = await api.get(`/api/export/preview/${jobId}`);
    return response.data;
  },
};

// Settings Service
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

  getTwoFactorStatus: async () => {
    const response = await api.get('/api/settings/security/2fa');
    return response.data;
  },

  setupTwoFactor: async () => {
    const response = await api.post('/api/settings/security/2fa/setup');
    return response.data;
  },

  verifyTwoFactor: async (code) => {
    const response = await api.post('/api/settings/security/2fa/verify', { code });
    return response.data;
  },

  disableTwoFactor: async () => {
    const response = await api.post('/api/settings/security/2fa/disable');
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get('/api/settings/security/sessions');
    return response.data;
  },

  revokeSession: async (sessionId) => {
    const response = await api.delete(`/api/settings/security/sessions/${sessionId}`);
    return response.data;
  },

  getCurrentPlan: async () => {
    const response = await api.get('/api/settings/billing/plan');
    return response.data;
  },

  upgradePlan: async (plan) => {
    const response = await api.post('/api/settings/billing/plan/upgrade', { plan });
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/api/settings/billing/plan/cancel');
    return response.data;
  },

  getUsageStats: async () => {
    const response = await api.get('/api/settings/billing/usage');
    return response.data;
  },

  getPaymentMethod: async () => {
    const response = await api.get('/api/settings/billing/payment-method');
    return response.data;
  },
};

export default api;
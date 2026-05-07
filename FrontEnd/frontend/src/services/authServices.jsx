// src/services/authService.js - WORKING VERSION
import api from './api';

export const authService = {
  signup: async (userData) => {
    try {
      console.log('[Signup] Attempting signup for:', userData.email);
      const response = await api.post('/api/auth/signup', {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,
      });
      console.log('[Signup] Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Signup] Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  signin: async (email, password) => {
    try {
      console.log('[Signin] Attempting signin for:', email);
      const response = await api.post('/api/auth/signin', { 
        email, 
        password 
      });
      console.log('[Signin] Success, token received');
      return response.data;
    } catch (error) {
      console.error('[Signin] Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rememberedEmail');
    console.log('[Logout] User logged out');
  },
  
  getCurrentUser: async () => {
    try {
      console.log('[GetCurrentUser] Fetching current user');
      const response = await api.get('/api/auth/me');
      console.log('[GetCurrentUser] Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('[GetCurrentUser] Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};
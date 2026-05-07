import api from '../api';

export const userService = {
  async getUsers(skip = 0, limit = 20) {
    const response = await api.get(`/api/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async CreateUser(userData) {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};
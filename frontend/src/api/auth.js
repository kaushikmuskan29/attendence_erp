import api from './axiosInstance';

export const login  = (credentials) => api.post('/auth/login',  credentials);
export const logout = ()             => api.post('/auth/logout');
export const getMe  = ()             => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/update', data);

import api from './axiosInstance';

export const getDashboard = (month) => api.get('/dashboard', { params: { month } });

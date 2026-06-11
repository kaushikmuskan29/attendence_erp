/**
 * api/axiosInstance.js
 * Configured Axios instance with JWT auth and 401 redirect.
 */
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://attendence-erp-1.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 – clear session and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

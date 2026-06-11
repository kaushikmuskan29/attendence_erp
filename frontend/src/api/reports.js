import api from './axiosInstance';

export const getAllReports = (month) =>
  api.get('/reports', { params: { month } });

export const getEmployeeReport = (employeeId, month) =>
  api.get(`/reports/${employeeId}`, { params: { month } });

export const exportEmployeeCSV = (employeeId, month) =>
  api.get(`/reports/${employeeId}`, {
    params:       { month, export: 'csv' },
    responseType: 'blob',
  });

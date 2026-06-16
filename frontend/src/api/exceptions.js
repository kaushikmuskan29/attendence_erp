import api from './axiosInstance';

export const getActiveExceptions = (date) =>
  api.get('/employees/exceptions/active', { params: { date } });

export const getExceptions   = (empId)         => api.get(`/employees/${empId}/exceptions`);
export const createException = (empId, data)   => api.post(`/employees/${empId}/exceptions`, data);
export const deleteException = (empId, excId)  => api.delete(`/employees/${empId}/exceptions/${excId}`);

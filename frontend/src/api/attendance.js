import api from './axiosInstance';

export const uploadAttendanceCSV = (formData) =>
  api.post('/attendance/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: undefined, // caller can pass via config
  });

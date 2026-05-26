import axios from 'axios';
import { getToken } from './token';

const apiClient = axios.create({
  // 🔥 CRITICAL: Jangan pake localhost! Ganti pakai IPv4 laptop lo saat ini
  baseURL: 'http://172.16.0.93:8000/api', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor to inject Sanctum token dynamically
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
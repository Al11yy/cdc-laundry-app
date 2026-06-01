import axios from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { getToken, removeToken } from './token';

const getBaseURL = () => {
  // Ambil IP host secara dinamis agar berjalan mulus di physical device maupun emulator
  const hostUri = Constants.expoConfig?.hostUri; 
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api`;
  }
  // Fallback ke IP manual jika hostUri tidak terdeteksi
  return 'http://192.168.0.110:8000/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor request untuk menyuntikkan Sanctum token secara dinamis
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    // Pastikan token valid dan bukan string 'null' / 'undefined'
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers = config.headers || {};
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response untuk otomatis redirect ke login saat token tidak valid (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Hapus token yang invalid
      await removeToken();
      // Redirect ke halaman login
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
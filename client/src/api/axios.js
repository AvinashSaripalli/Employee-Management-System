import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(
  (config) => {
    // Read directly from Redux store with fallback to storage
    const token = store.getState()?.auth?.token || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginPage = window.location.pathname.includes('/login');
    if (status === 401 && !isLoginPage) {
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';
import { usarAutenticacionStore } from '../store/usarAutenticacionStore';

const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${hostname}:8081`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = usarAutenticacionStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;


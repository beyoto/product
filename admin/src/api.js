import axios from 'axios';

const TOKEN_KEY = 'superAdminToken';

// sessionStorage: вход сбрасывается, когда закрывается вкладка.
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const errorText = (err) => err.response?.data?.error || 'Ошибка сервера, попробуй позже';

export default api;

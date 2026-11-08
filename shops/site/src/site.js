import axios from 'axios';

// Магазин определяется по первому сегменту пути: kg-shop.vercel.app/<slug>/...
export const SLUG = window.location.pathname.split('/')[1] || '';
export const isValidSlug = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/.test(SLUG);
export const STORE_KEY = `site:${SLUG}`;
export const BASENAME = `/${SLUG}`;

// Все магазины на одном домене, поэтому ключи хранилища с префиксом магазина.
// В приватном режиме хранилище может быть недоступно — тогда просто ничего не помним.
function makeStorage(getStore) {
  const key = (name) => `${STORE_KEY}:${name}`;
  return {
    get(name) {
      try {
        return getStore().getItem(key(name));
      } catch {
        return null;
      }
    },
    set(name, value) {
      try {
        getStore().setItem(key(name), value);
      } catch {
        // хранилище недоступно
      }
    },
    remove(name) {
      try {
        getStore().removeItem(key(name));
      } catch {
        // хранилище недоступно
      }
    },
  };
}

export const storage = makeStorage(() => window.localStorage);
export const session = makeStorage(() => window.sessionStorage);

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const authApi = axios.create({ baseURL: `${API_URL}/auth` });

const api = axios.create({ baseURL: `${API_URL}/sites/${SLUG}` });

api.interceptors.request.use((config) => {
  const token = storage.get('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Истёкший или отозванный токен: выходим на страницу входа.
api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && storage.get('adminToken')) {
    storage.remove('adminToken');
    window.location.assign(`${BASENAME}/admin/login`);
  }
  return Promise.reject(error);
});

export const errorText = (err, fallback = 'Ошибка сервера, попробуй позже') => {
  if (err.response?.status === 403) return 'Нет доступа к этому магазину';
  return err.response?.data?.error || fallback;
};

export default api;

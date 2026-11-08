import { createContext, useContext, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(`${import.meta.env.VITE_STORE}:adminToken`) || null);

  const login = (newToken) => {
    localStorage.setItem(`${import.meta.env.VITE_STORE}:adminToken`, newToken);
    setToken(newToken);
  };

  const logout = () => {
    // Токен передаём явно: к моменту отправки он уже будет удалён из хранилища.
    api.post('/auth/logout', { store: import.meta.env.VITE_STORE_KEY }, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    localStorage.removeItem(`${import.meta.env.VITE_STORE}:adminToken`);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
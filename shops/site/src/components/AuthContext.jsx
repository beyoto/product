import { createContext, useContext, useState } from 'react';
import { STORE_KEY, authApi, storage } from '../site.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => storage.get('adminToken'));

  const login = (newToken) => {
    storage.set('adminToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    // Токен передаём явно: к моменту отправки он уже будет удалён из хранилища.
    authApi.post('/logout', { store: STORE_KEY }, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    storage.remove('adminToken');
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

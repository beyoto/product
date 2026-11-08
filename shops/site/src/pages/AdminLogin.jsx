import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { STORE_KEY, authApi } from '../site.js';
import { useSite } from '../SiteContext.jsx';
import { useAuth } from '../components/AuthContext.jsx';
import './AdminLogin.css';

function AdminLogin() {
  const { name } = useSite();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `Вход — ${name}`;
  }, [name]);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.post('/login', { username, password, store: STORE_KEY });
      login(res.data.token);
      navigate('/admin');
    } catch (err) {
      if (err.response?.status === 401) setError('Неверный логин или пароль');
      else if (err.response?.status === 429) setError('Слишком много попыток. Попробуй через 15 минут');
      else setError('Ошибка сервера, попробуй позже');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h1>Вход для администратора</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Логин"
          aria-label="Логин"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          aria-label="Пароль"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="admin-login__error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Входим...' : 'Войти'}</button>
      </form>
    </div>
  );
}

export default AdminLogin;

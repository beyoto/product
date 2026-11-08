import { useCallback, useEffect, useState } from 'react';
import api, { clearToken, errorText, getToken, saveToken } from './api.js';
import Admins from './pages/Admins.jsx';
import Security from './pages/Security.jsx';
import Sites from './pages/Sites.jsx';

function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      onSuccess(res.data.token);
    } catch (err) {
      setError(err.response?.status === 401 ? 'Неверный логин или пароль' : errorText(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page page--narrow">
      <h1>Панель управления</h1>
      <form className="form" onSubmit={handleSubmit}>
        <input
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
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Входим...' : 'Войти'}</button>
      </form>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(getToken);
  const [me, setMe] = useState(null);
  const [stores, setStores] = useState([]);
  const [tab, setTab] = useState('sites');
  const [error, setError] = useState('');

  const clearSession = useCallback(() => {
    clearToken();
    setToken(null);
    setMe(null);
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    clearSession();
  };

  // Список магазинов для фильтров и прав админов; после создания магазина обновляется.
  const reloadStores = useCallback(async () => {
    const res = await api.get('/super/stores');
    setStores(res.data);
  }, []);

  const handleLogin = (newToken) => {
    saveToken(newToken);
    setError('');
    setToken(newToken);
  };

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const meRes = await api.get('/auth/me');
        if (cancelled) return;

        if (meRes.data.role === 'super_admin') {
          const storesRes = await api.get('/super/stores');
          if (cancelled) return;
          setStores(storesRes.data);
        }
        setMe(meRes.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) clearSession();
        else setError(errorText(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  if (!token) return <LoginForm onSuccess={handleLogin} />;

  if (error) {
    return (
      <main className="page page--narrow">
        <p className="error">{error}</p>
        <button type="button" onClick={clearSession}>Выйти</button>
      </main>
    );
  }

  if (!me) return <main className="page page--narrow"><p>Загрузка...</p></main>;

  if (me.role !== 'super_admin') {
    return (
      <main className="page page--narrow">
        <h1>Нет доступа</h1>
        <p>Эта панель только для суперадмина.</p>
        <button type="button" onClick={logout}>Выйти</button>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="top">
        <h1>Панель управления</h1>
        <div className="top__who">
          <span>{me.username}</span>
          <button type="button" onClick={logout}>Выйти</button>
        </div>
      </header>

      <nav className="tabs" aria-label="Разделы">
        <button
          type="button"
          aria-current={tab === 'sites' ? 'page' : undefined}
          onClick={() => setTab('sites')}
        >
          Магазины
        </button>
        <button
          type="button"
          aria-current={tab === 'security' ? 'page' : undefined}
          onClick={() => setTab('security')}
        >
          Журнал безопасности
        </button>
        <button
          type="button"
          aria-current={tab === 'admins' ? 'page' : undefined}
          onClick={() => setTab('admins')}
        >
          Админы
        </button>
      </nav>

      {tab === 'sites' && <Sites onStoresChanged={reloadStores} />}
      {tab === 'security' && <Security stores={stores} />}
      {tab === 'admins' && <Admins stores={stores} />}
    </main>
  );
}

export default App;

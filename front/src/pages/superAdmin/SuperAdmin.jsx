import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

import './SuperAdmin.css';

const errorText = (err) => err.response?.data?.error || 'Ошибка сервера, попробуй позже';

function StorePicker({ stores, selected, onChange }) {
  const toggle = (key) => {
    onChange(selected.includes(key)
      ? selected.filter((item) => item !== key)
      : [...selected, key]);
  };

  return (
    <div className="super__stores">
      {stores.map((store) => (
        <label key={store.key} className="super__store">
          <input
            type="checkbox"
            checked={selected.includes(store.key)}
            onChange={() => toggle(store.key)}
          />
          {store.label}
        </label>
      ))}
    </div>
  );
}

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
    <div className="super super--narrow">
      <h1>Суперадминка</h1>
      <form className="super__form" onSubmit={handleSubmit}>
        <input
          placeholder="Логин"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="super__error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Входим...' : 'Войти'}</button>
      </form>
    </div>
  );
}

function CreateAdminForm({ stores, onCreated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.post('/super/admins', { username, password, stores: selected });
      setUsername('');
      setPassword('');
      setSelected([]);
      await onCreated();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="super__panel">
      <h2>Новый админ</h2>
      <form className="super__form" onSubmit={handleSubmit}>
        <input
          placeholder="Логин"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль, минимум 8 символов"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <StorePicker stores={stores} selected={selected} onChange={setSelected} />
        {error && <p className="super__error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Создаём...' : 'Создать админа'}</button>
      </form>
    </section>
  );
}

function AdminCard({ admin, stores, onChanged }) {
  const [selected, setSelected] = useState(admin.stores);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isSuper = admin.role === 'super_admin';
  const storesChanged = [...selected].sort().join() !== [...admin.stores].sort().join();

  const run = async (request) => {
    setError('');
    setSaving(true);

    try {
      await request();
      setPassword('');
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const update = (data) => run(() => api.patch(`/super/admins/${admin.id}`, data));

  const remove = () => {
    if (window.confirm(`Удалить админа ${admin.username}?`)) {
      run(() => api.delete(`/super/admins/${admin.id}`));
    }
  };

  return (
    <article className={`super__card${admin.is_active ? '' : ' super__card--blocked'}`}>
      <header className="super__card-head">
        <strong>{admin.username}</strong>
        <span className="super__badge">
          {isSuper ? 'Суперадмин' : admin.is_active ? 'Активен' : 'Заблокирован'}
        </span>
      </header>

      {isSuper ? (
        <p className="super__muted">Доступ ко всем магазинам</p>
      ) : (
        <>
          <StorePicker stores={stores} selected={selected} onChange={setSelected} />
          <div className="super__actions">
            <button
              type="button"
              disabled={saving || !storesChanged}
              onClick={() => update({ stores: selected })}
            >
              Сохранить магазины
            </button>
            <input
              type="password"
              placeholder="Новый пароль"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              disabled={saving || !password}
              onClick={() => update({ password })}
            >
              Сменить пароль
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => update({ is_active: !admin.is_active })}
            >
              {admin.is_active ? 'Заблокировать' : 'Разблокировать'}
            </button>
            <button
              type="button"
              className="super__danger"
              disabled={saving}
              onClick={remove}
            >
              Удалить
            </button>
          </div>
        </>
      )}
      {error && <p className="super__error">{error}</p>}
    </article>
  );
}

function SuperAdmin() {
  const { token, login, logout } = useAuth();
  const [me, setMe] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(token));

  const loadAdmins = useCallback(async () => {
    const res = await api.get('/super/admins');
    setAdmins(res.data);
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const meRes = await api.get('/auth/me');
        if (cancelled) return;
        setMe(meRes.data);

        if (meRes.data.role === 'super_admin') {
          const [storesRes, adminsRes] = await Promise.all([
            api.get('/super/stores'),
            api.get('/super/admins'),
          ]);
          if (cancelled) return;
          setStores(storesRes.data);
          setAdmins(adminsRes.data);
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) logout();
        else setError(errorText(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const visibleAdmins = useMemo(
    () => admins.filter((admin) => !filter
      || admin.role === 'super_admin'
      || admin.stores.includes(filter)),
    [admins, filter]
  );

  if (!token) return <LoginForm onSuccess={login} />;

  if (loading) return <div className="super super--narrow"><p>Загрузка...</p></div>;

  if (error) {
    return (
      <div className="super super--narrow">
        <p className="super__error">{error}</p>
        <button type="button" onClick={logout}>Выйти</button>
      </div>
    );
  }

  if (me?.role !== 'super_admin') {
    return (
      <div className="super super--narrow">
        <h1>Нет доступа</h1>
        <p>Эта страница только для суперадмина.</p>
        <button type="button" onClick={logout}>Выйти</button>
      </div>
    );
  }

  return (
    <div className="super">
      <header className="super__top">
        <h1>Суперадминка</h1>
        <div className="super__who">
          <span>{me.username}</span>
          <button type="button" onClick={logout}>Выйти</button>
        </div>
      </header>

      <CreateAdminForm stores={stores} onCreated={loadAdmins} />

      <section className="super__panel">
        <div className="super__list-head">
          <h2>Админы ({visibleAdmins.length})</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Все магазины</option>
            {stores.map((store) => (
              <option key={store.key} value={store.key}>{store.label}</option>
            ))}
          </select>
        </div>
        <div className="super__list">
          {visibleAdmins.map((admin) => (
            <AdminCard
              key={`${admin.id}:${admin.stores.join()}`}
              admin={admin}
              stores={stores}
              onChanged={loadAdmins}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default SuperAdmin;

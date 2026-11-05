import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { errorText } from '../api.js';

function StorePicker({ stores, selected, onChange }) {
  const toggle = (key) => {
    onChange(selected.includes(key)
      ? selected.filter((item) => item !== key)
      : [...selected, key]);
  };

  return (
    <div className="stores">
      {stores.map((store) => (
        <label key={store.key} className="stores__item">
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
    <section className="panel">
      <h2>Новый админ</h2>
      <form className="form" onSubmit={handleSubmit}>
        <input
          placeholder="Логин"
          aria-label="Логин нового админа"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль, минимум 8 символов"
          aria-label="Пароль нового админа"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <StorePicker stores={stores} selected={selected} onChange={setSelected} />
        {error && <p className="error">{error}</p>}
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
    <article className={`card${admin.is_active ? '' : ' card--blocked'}`}>
      <header className="card__head">
        <strong>{admin.username}</strong>
        <span className="muted">
          {isSuper ? 'Суперадмин' : admin.is_active ? 'Активен' : 'Заблокирован'}
        </span>
      </header>

      {isSuper ? (
        <p className="muted">Доступ ко всем магазинам</p>
      ) : (
        <>
          <StorePicker stores={stores} selected={selected} onChange={setSelected} />
          <div className="actions">
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
              aria-label={`Новый пароль для ${admin.username}`}
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
            <button type="button" className="danger" disabled={saving} onClick={remove}>
              Удалить
            </button>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </article>
  );
}

function Admins({ stores }) {
  const [admins, setAdmins] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/super/admins');
    setAdmins(res.data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get('/super/admins');
        if (!cancelled) setAdmins(res.data);
      } catch (err) {
        if (!cancelled) setError(errorText(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => admins.filter((admin) => !filter
      || admin.role === 'super_admin'
      || admin.stores.includes(filter)),
    [admins, filter]
  );

  return (
    <>
      <CreateAdminForm stores={stores} onCreated={load} />

      <section className="panel">
        <div className="row">
          <h2>Админы ({visible.length})</h2>
          <select
            aria-label="Фильтр по магазину"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Все магазины</option>
            {stores.map((store) => (
              <option key={store.key} value={store.key}>{store.label}</option>
            ))}
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="list">
          {visible.map((admin) => (
            <AdminCard
              key={`${admin.id}:${admin.stores.join()}`}
              admin={admin}
              stores={stores}
              onChanged={load}
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default Admins;

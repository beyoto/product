import { useCallback, useEffect, useState } from 'react';
import api, { errorText } from '../api.js';

const PAGE_SIZE = 50;
const REFRESH_MS = 30 * 1000;
const EMPTY_FILTERS = { severity: '', event_type: '', store: '', username: '', ip: '' };

const EVENT_LABELS = {
  login_success: 'Успешный вход',
  login_failed: 'Неудачный вход',
  login_blocked: 'Вход заблокирован',
  login_success_after_failures: 'Вход после серии ошибок',
  login_new_ip: 'Вход с нового IP',
  logout: 'Выход',
  access_denied: 'Отказ: чужой магазин',
  token_missing: 'Запрос без токена',
  token_expired: 'Токен истёк',
  token_invalid: 'Неверный токен',
  register_probe: 'Попытка регистрации',
  admin_action: 'Изменение в магазине',
  admin_created: 'Админ создан',
  admin_updated: 'Админ изменён',
  admin_deleted: 'Админ удалён',
};

const SEVERITY_LABELS = { info: 'Инфо', warning: 'Внимание', critical: 'Критично' };

const REASON_LABELS = {
  bad_password: 'неверный пароль',
  unknown_user: 'логин не существует',
  account_blocked: 'аккаунт заблокирован',
};

const TILES = [
  { key: 'login_success', label: 'Успешные входы' },
  { key: 'login_failed', label: 'Неудачные входы' },
  { key: 'login_blocked', label: 'Блокировки' },
  { key: 'access_denied', label: 'Отказы в доступе' },
  { key: 'login_success_after_failures', label: 'Подозрительные входы' },
];

const formatTime = (value) => new Date(value).toLocaleString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function EventRow({ event, storeLabel, onFilter }) {
  const { reason, target } = event.details;
  const note = [
    REASON_LABELS[reason],
    target && `цель: ${target}`,
    event.details.origin === window.location.origin && 'через панель',
    event.method !== 'GET' && event.event_type === 'admin_action' && `${event.method} ${event.path}`,
  ].filter(Boolean).join(' · ');

  return (
    <article className={`event event--${event.severity}`}>
      <div className="event__head">
        <span className="event__severity">{SEVERITY_LABELS[event.severity]}</span>
        <strong>{EVENT_LABELS[event.event_type] || event.event_type}</strong>
        <time className="muted" dateTime={event.created_at}>{formatTime(event.created_at)}</time>
      </div>
      <div className="event__meta">
        {event.username && (
          <button type="button" className="link" onClick={() => onFilter('username', event.username)}>
            {event.username}
          </button>
        )}
        {event.ip && (
          <button type="button" className="link" onClick={() => onFilter('ip', event.ip)}>
            {event.ip}
          </button>
        )}
        {event.store && <span>{storeLabel(event.store)}</span>}
        {note && <span className="muted">{note}</span>}
      </div>
      {event.user_agent && <p className="event__agent muted">{event.user_agent}</p>}
    </article>
  );
}

function Security({ stores }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [eventsRes, summaryRes] = await Promise.all([
        api.get('/super/events', { params: { ...filters, limit: PAGE_SIZE } }),
        api.get('/super/events/summary'),
      ]);
      setEvents(eventsRes.data);
      setHasMore(eventsRes.data.length === PAGE_SIZE);
      setSummary(summaryRes.data);
      setError('');
    } catch (err) {
      setError(errorText(err));
    }
  }, [filters]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = autoRefresh ? setInterval(load, REFRESH_MS) : null;

    return () => {
      clearTimeout(first);
      if (timer) clearInterval(timer);
    };
  }, [load, autoRefresh]);

  const loadMore = async () => {
    try {
      const res = await api.get('/super/events', {
        params: { ...filters, limit: PAGE_SIZE, before: events.at(-1).id },
      });
      setEvents((current) => [...current, ...res.data]);
      setHasMore(res.data.length === PAGE_SIZE);
    } catch (err) {
      setError(errorText(err));
    }
  };

  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const storeLabel = (key) => stores.find((store) => store.key === key)?.label || key;

  return (
    <>
      <section className="tiles" aria-label="Сводка за 24 часа">
        {TILES.map((tile) => (
          <div key={tile.key} className="tile">
            <span className="tile__value">{summary?.counts[tile.key] ?? 0}</span>
            <span className="muted">{tile.label}</span>
          </div>
        ))}
      </section>

      {summary?.topIps.length > 0 && (
        <section className="panel">
          <h2>Подозрительные IP за 24 часа</h2>
          <div className="ips">
            {summary.topIps.map((item) => (
              <button
                key={item.ip}
                type="button"
                className="link"
                onClick={() => setFilter('ip', item.ip)}
              >
                {item.ip}: {item.count}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="filters">
          <select
            aria-label="Важность"
            value={filters.severity}
            onChange={(e) => setFilter('severity', e.target.value)}
          >
            <option value="">Любая важность</option>
            {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            aria-label="Событие"
            value={filters.event_type}
            onChange={(e) => setFilter('event_type', e.target.value)}
          >
            <option value="">Все события</option>
            {Object.entries(EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            aria-label="Магазин"
            value={filters.store}
            onChange={(e) => setFilter('store', e.target.value)}
          >
            <option value="">Все магазины</option>
            {stores.map((store) => (
              <option key={store.key} value={store.key}>{store.label}</option>
            ))}
          </select>
          <input
            placeholder="Логин"
            aria-label="Логин"
            value={filters.username}
            onChange={(e) => setFilter('username', e.target.value.trim())}
          />
          <input
            placeholder="IP"
            aria-label="IP-адрес"
            value={filters.ip}
            onChange={(e) => setFilter('ip', e.target.value.trim())}
          />
        </div>
        <div className="row row--small">
          <label className="stores__item">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Обновлять каждые 30 секунд
          </label>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Сбросить фильтры</button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="list">
          {events.map((event) => (
            <EventRow key={event.id} event={event} storeLabel={storeLabel} onFilter={setFilter} />
          ))}
          {events.length === 0 && !error && <p className="muted">Событий пока нет.</p>}
        </div>

        {hasMore && (
          <button type="button" className="more" onClick={loadMore}>Показать ещё</button>
        )}
      </section>
    </>
  );
}

export default Security;

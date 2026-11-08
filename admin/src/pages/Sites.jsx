import { useCallback, useEffect, useState } from 'react';
import api, { errorText } from '../api.js';

const MAX_ADDRESSES = 5;

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ң: 'n', ө: 'o', ү: 'u',
};

// «Цветы Нур» → «tsvety-nur»: так же проверяет бэкенд (латиница, цифры, дефис).
const slugify = (text) => [...text.toLowerCase()]
  .map((char) => TRANSLIT[char] ?? char)
  .join('')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40)
  .replace(/-+$/, '');

const emptyInfo = () => ({
  tagline: '',
  description: '',
  heroTitle: '',
  heroText: '',
  badges: ['', '', ''],
  phone: '',
  whatsapp: '',
  instagram: '',
  hours: '',
  currency: 'сом',
  addresses: [],
});

// Пустые преимущества сохраняем пустой строкой: на сайте подставится текст типа магазина.
const infoFromSite = (info) => ({
  ...emptyInfo(),
  ...info,
  badges: [0, 1, 2].map((index) => info.badges?.[index] || ''),
  addresses: info.addresses || [],
});

function ThemePreview({ theme, name }) {
  const c = theme.colors;
  return (
    <div className="theme-preview" style={{ background: c.bg, borderColor: c.border }} aria-hidden="true">
      <div className="theme-preview__header" style={{ background: c.headerBg, color: c.headerText }}>
        {name || 'Магазин'}
      </div>
      <div className="theme-preview__body">
        <div className="theme-preview__card" style={{ background: c.surface, borderColor: c.border }}>
          <span style={{ color: c.muted }}>Категория</span>
          <strong style={{ color: c.text }}>Товар</strong>
          <span style={{ color: c.text }}>12 000 сом</span>
        </div>
        <span className="theme-preview__button" style={{ background: c.accent, color: c.onAccent }}>Купить</span>
      </div>
      <div className="theme-preview__footer" style={{ background: c.footerBg, color: c.footerText }}>Контакты</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

function SiteForm({ meta, site, onSaved, onCancel }) {
  const isEdit = Boolean(site);
  const [type, setType] = useState(site?.type || meta.types[0].key);
  const [theme, setTheme] = useState(site?.theme || meta.themes[0].key);
  const [name, setName] = useState(site?.name || '');
  const [slug, setSlug] = useState(site?.slug || '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [info, setInfo] = useState(() => (site ? infoFromSite(site.info) : emptyInfo()));
  const [withAdmin, setWithAdmin] = useState(!isEdit);
  const [admin, setAdmin] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const typeDef = meta.types.find((item) => item.key === type);
  const setInfoField = (field) => (e) => setInfo((prev) => ({ ...prev, [field]: e.target.value }));

  const setBadge = (index, value) => setInfo((prev) => ({
    ...prev,
    badges: prev.badges.map((badge, i) => (i === index ? value : badge)),
  }));

  const setAddress = (index, field, value) => setInfo((prev) => ({
    ...prev,
    addresses: prev.addresses.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
  }));

  const handleName = (e) => {
    setName(e.target.value);
    if (!slugTouched) setSlug(slugify(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = isEdit
        ? await api.patch(`/super/sites/${site.id}`, { name, theme, info })
        : await api.post('/super/sites', {
          slug,
          type,
          theme,
          name,
          info,
          admin: withAdmin ? admin : undefined,
        });
      onSaved(res.data, isEdit ? null : withAdmin && admin.username);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form site-form" onSubmit={handleSubmit}>
      <section className="panel">
        <h2>1. Тип магазина</h2>
        {isEdit ? (
          <p className="muted">{typeDef.label}. Тип не меняется после создания: от него зависят поля товаров.</p>
        ) : (
          <div className="choice-grid">
            {meta.types.map((item) => (
              <label key={item.key} className={`choice${item.key === type ? ' choice--active' : ''}`}>
                <input type="radio" name="type" value={item.key} checked={item.key === type} onChange={() => setType(item.key)} />
                <strong>{item.label}</strong>
                <span className="muted">{item.categories.slice(0, 4).map((c) => c.label).join(', ')}…</span>
              </label>
            ))}
          </div>
        )}
        {typeDef && (
          <p className="muted type-fields">
            Поля карточки товара: название, описание, цена, категория
            {typeDef.fields.length > 0 && `, ${typeDef.fields.map((f) => f.label.toLowerCase()).join(', ')}`}.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>2. Цветовая тема</h2>
        <div className="choice-grid choice-grid--themes">
          {meta.themes.map((item) => (
            <label key={item.key} className={`choice${item.key === theme ? ' choice--active' : ''}`}>
              <input type="radio" name="theme" value={item.key} checked={item.key === theme} onChange={() => setTheme(item.key)} />
              <ThemePreview theme={item} name={name} />
              <strong>{item.label}</strong>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>3. Название и тексты</h2>
        <div className="field-grid">
          <Field label="Название *">
            <input value={name} onChange={handleName} maxLength={80} required />
          </Field>
          <Field
            label="Адрес сайта *"
            hint={isEdit ? 'Адрес не меняется после создания' : `${meta.shopUrl}/${slug || '...'}/`}
          >
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              pattern="[a-z0-9](?:[a-z0-9\-]{0,38}[a-z0-9])"
              title="Латиница в нижнем регистре, цифры и дефис, 2–40 символов"
              disabled={isEdit}
              required
            />
          </Field>
          <Field label="Подзаголовок в шапке" hint="Например: Цветы и букеты · Бишкек">
            <input value={info.tagline} onChange={setInfoField('tagline')} maxLength={120} />
          </Field>
          <Field label="Валюта">
            <input value={info.currency} onChange={setInfoField('currency')} maxLength={10} />
          </Field>
          <Field label="О магазине" hint="Показывается на странице контактов">
            <textarea value={info.description} onChange={setInfoField('description')} maxLength={600} rows={3} />
          </Field>
          <Field label="Заголовок на главной" hint="Пусто — стандартный текст для этого типа">
            <textarea value={info.heroTitle} onChange={setInfoField('heroTitle')} maxLength={80} rows={2} placeholder={typeDef?.hero[0].title} />
          </Field>
          <Field label="Текст под заголовком">
            <input value={info.heroText} onChange={setInfoField('heroText')} maxLength={200} placeholder={typeDef?.hero[0].text} />
          </Field>
        </div>
        <h3>Преимущества под баннером</h3>
        <div className="field-grid">
          {info.badges.map((badge, index) => (
            <input
              key={index}
              aria-label={`Преимущество ${index + 1}`}
              value={badge}
              onChange={(e) => setBadge(index, e.target.value)}
              maxLength={60}
              placeholder={typeDef?.badges[index]?.text}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>4. Контакты</h2>
        <div className="field-grid">
          <Field label="Телефон" hint="Как показывать: +996 700 123 456">
            <input value={info.phone} onChange={setInfoField('phone')} maxLength={30} inputMode="tel" />
          </Field>
          <Field label="WhatsApp" hint="Если номер другой. Пусто — берём телефон">
            <input value={info.whatsapp} onChange={setInfoField('whatsapp')} maxLength={30} inputMode="tel" />
          </Field>
          <Field label="Instagram" hint="Полная ссылка https://instagram.com/...">
            <input value={info.instagram} onChange={setInfoField('instagram')} maxLength={600} type="url" />
          </Field>
          <Field label="Режим работы" hint="Например: Ежедневно 9:00–20:00">
            <input value={info.hours} onChange={setInfoField('hours')} maxLength={120} />
          </Field>
        </div>

        <h3>Адреса</h3>
        <div className="list">
          {info.addresses.map((item, index) => (
            <div key={index} className="address-row">
              <input aria-label="Город" placeholder="Город" value={item.city} onChange={(e) => setAddress(index, 'city', e.target.value)} maxLength={60} />
              <input aria-label="Адрес" placeholder="Улица, дом" value={item.address} onChange={(e) => setAddress(index, 'address', e.target.value)} maxLength={200} />
              <input aria-label="Ссылка на карту" placeholder="https://2gis.kg/..." type="url" value={item.mapUrl} onChange={(e) => setAddress(index, 'mapUrl', e.target.value)} maxLength={600} />
              <button
                type="button"
                className="danger"
                onClick={() => setInfo((prev) => ({ ...prev, addresses: prev.addresses.filter((_, i) => i !== index) }))}
              >
                Убрать
              </button>
            </div>
          ))}
          {info.addresses.length < MAX_ADDRESSES && (
            <button
              type="button"
              onClick={() => setInfo((prev) => ({ ...prev, addresses: [...prev.addresses, { city: '', address: '', mapUrl: '' }] }))}
            >
              + Добавить адрес
            </button>
          )}
        </div>
      </section>

      {!isEdit && (
        <section className="panel">
          <h2>5. Админ магазина</h2>
          <label className="stores__item">
            <input type="checkbox" checked={withAdmin} onChange={(e) => setWithAdmin(e.target.checked)} />
            Сразу создать вход для владельца магазина
          </label>
          {withAdmin && (
            <div className="field-grid">
              <Field label="Логин *">
                <input
                  value={admin.username}
                  onChange={(e) => setAdmin((prev) => ({ ...prev, username: e.target.value }))}
                  autoComplete="off"
                  minLength={3}
                  maxLength={50}
                  required
                />
              </Field>
              <Field label="Пароль *" hint="Минимум 8 символов">
                <input
                  type="password"
                  value={admin.password}
                  onChange={(e) => setAdmin((prev) => ({ ...prev, password: e.target.value }))}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </Field>
            </div>
          )}
        </section>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Сохраняем...' : isEdit ? 'Сохранить изменения' : 'Создать магазин'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>Отмена</button>
      </div>
    </form>
  );
}

function SiteCard({ site, meta, onEdit, onChanged }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const typeLabel = meta.types.find((item) => item.key === site.type)?.label || site.type;
  const theme = meta.themes.find((item) => item.key === site.theme);

  const run = async (request) => {
    setError('');
    setBusy(true);
    try {
      await request();
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    const answer = window.prompt(
      `Удалить «${site.name}» вместе со всеми товарами (${site.products_count})? Это необратимо.\n` +
      `Чтобы подтвердить, введи адрес магазина: ${site.slug}`
    );
    if (answer === null) return;
    run(() => api.delete(`/super/sites/${site.id}`, { data: { confirm: answer.trim() } }));
  };

  return (
    <article className={`card site-card${site.is_active ? '' : ' card--blocked'}`}>
      <header className="card__head">
        <div>
          <strong>{site.name}</strong>
          <p className="muted">{typeLabel} · {theme?.label || site.theme} · товаров: {site.products_count}</p>
        </div>
        <span className="muted">{site.is_active ? 'Работает' : 'Отключён'}</span>
      </header>
      <a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a>
      <p className="muted">
        Админка: <a href={`${site.url}admin`} target="_blank" rel="noopener noreferrer">{site.url}admin</a>
        {' · '}
        {site.admins.length ? `входят: ${site.admins.join(', ')}` : 'админов нет — добавь во вкладке «Админы»'}
      </p>
      <div className="actions">
        <button type="button" onClick={() => onEdit(site)} disabled={busy}>Изменить</button>
        <button type="button" onClick={() => run(() => api.patch(`/super/sites/${site.id}`, { is_active: !site.is_active }))} disabled={busy}>
          {site.is_active ? 'Отключить' : 'Включить'}
        </button>
        <button type="button" className="danger" onClick={remove} disabled={busy}>Удалить</button>
      </div>
      {error && <p className="error">{error}</p>}
    </article>
  );
}

function Sites({ onStoresChanged }) {
  const [meta, setMeta] = useState(null);
  const [sites, setSites] = useState([]);
  const [mode, setMode] = useState(null); // null | 'create' | site (редактирование)
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/super/sites');
    setSites(res.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [metaRes, sitesRes] = await Promise.all([api.get('/super/sites/meta'), api.get('/super/sites')]);
        if (cancelled) return;
        setMeta(metaRes.data);
        setSites(sitesRes.data);
      } catch (err) {
        if (!cancelled) setError(errorText(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    await load();
    await onStoresChanged();
  };

  const handleSaved = async (site, adminUsername) => {
    setMode(null);
    if (adminUsername !== null) setCreated({ site, adminUsername });
    await refresh();
  };

  if (error) return <p className="error">{error}</p>;
  if (!meta) return <p className="muted">Загрузка...</p>;

  if (mode) {
    return (
      <SiteForm
        key={mode === 'create' ? 'create' : mode.id}
        meta={meta}
        site={mode === 'create' ? null : mode}
        onSaved={handleSaved}
        onCancel={() => setMode(null)}
      />
    );
  }

  return (
    <>
      {created && (
        <section className="panel panel--success">
          <h2>Магазин «{created.site.name}» создан</h2>
          <p>Сайт уже работает: <a href={created.site.url} target="_blank" rel="noopener noreferrer">{created.site.url}</a></p>
          <p>
            Товары добавляются в админке магазина:{' '}
            <a href={`${created.site.url}admin`} target="_blank" rel="noopener noreferrer">{created.site.url}admin</a>
            {created.adminUsername && <> — логин <strong>{created.adminUsername}</strong></>}
          </p>
          <button type="button" onClick={() => setCreated(null)}>Понятно</button>
        </section>
      )}

      <section className="panel">
        <div className="row">
          <h2>Магазины из конструктора ({sites.length})</h2>
          <button type="button" onClick={() => {
            setCreated(null);
            setMode('create');
          }}
          >
            + Создать магазин
          </button>
        </div>
        <p className="muted">
          Старые магазины (Baha, Nova и др.) живут в коде и здесь не показываются — их меняем через разработку.
        </p>
        <div className="list">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} meta={meta} onEdit={setMode} onChanged={refresh} />
          ))}
          {sites.length === 0 && <p className="muted">Пока нет ни одного. Нажми «Создать магазин».</p>}
        </div>
      </section>
    </>
  );
}

export default Sites;

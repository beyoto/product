import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import api, { isValidSlug } from './site.js';
import { applyFavicon, applyTheme } from './theme.js';
import { SiteContext } from './SiteContext.jsx';

const root = createRoot(document.getElementById('root'));

function Status({ title, text }) {
  return (
    <main className="page-status">
      <h1>{title}</h1>
      <p>{text}</p>
    </main>
  );
}

async function start() {
  if (!isValidSlug) {
    root.render(<Status title="Магазин не найден" text="Проверьте адрес страницы." />);
    return;
  }

  try {
    const { data: site } = await api.get('/');
    applyTheme(site.theme);
    applyFavicon(site.name, site.theme);
    document.title = site.name;

    root.render(
      <StrictMode>
        <SiteContext.Provider value={site}>
          <App />
        </SiteContext.Provider>
      </StrictMode>
    );
  } catch (err) {
    root.render(err.response?.status === 404
      ? <Status title="Магазин не найден" text="Проверьте адрес страницы." />
      : <Status title="Не удалось загрузить магазин" text="Проверьте подключение и обновите страницу." />);
  }
}

start();

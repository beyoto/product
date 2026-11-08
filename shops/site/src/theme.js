const VARS = {
  bg: '--color-bg',
  surface: '--color-surface',
  surfaceHover: '--color-surface-hover',
  text: '--color-ivory',
  muted: '--color-muted',
  accent: '--color-gold',
  accentStrong: '--color-bronze',
  onAccent: '--color-on-accent',
  border: '--color-border',
  headerBg: '--header-bg',
  headerText: '--header-text',
  footerBg: '--footer-bg',
  footerText: '--footer-text',
};

// Иконка вкладки: первая буква названия в цветах темы.
export function applyFavicon(name, theme) {
  const c = theme?.colors || {};
  const letter = (name.trim()[0] || '•').toUpperCase().replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.accent || '#555'}"/><text x="32" y="44" font-family="Georgia,serif" font-size="36" text-anchor="middle" fill="${c.onAccent || '#fff'}">${letter}</text></svg>`;
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.appendChild(link);
}

export function applyTheme(theme) {
  const root = document.documentElement;
  for (const [name, cssVar] of Object.entries(VARS)) {
    const value = theme?.colors?.[name];
    if (value) root.style.setProperty(cssVar, value);
  }
  root.style.colorScheme = theme?.dark ? 'dark' : 'light';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && theme?.colors?.headerBg) meta.setAttribute('content', theme.colors.headerBg);
}

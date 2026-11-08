import { useState } from 'react';
import { Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useFavorites } from './FavoritesContext.jsx';
import { useSite } from '../SiteContext.jsx';
import './Header.css';

function Header() {
  const site = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const { favorites } = useFavorites();
  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <button className="site-header__icon-btn" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 18H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className="site-header__brand">
        <h1><Link to="/">{site.name}</Link></h1>
        {site.info.tagline && <p>{site.info.tagline}</p>}
      </div>

      <Link to="/favorites" className="site-header__icon-btn site-header__heart" aria-label="Избранное">
        {favorites.length > 0
          ? <FavoriteIcon sx={{ fontSize: 22, color: 'var(--color-gold)' }} />
          : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
        {favorites.length > 0 && <span className="site-header__badge">{favorites.length}</span>}
      </Link>

      {menuOpen && (
        <div className="site-header__overlay" onClick={close}>
          <nav className="site-header__menu" onClick={(e) => e.stopPropagation()}>
            <button className="site-header__close-btn" onClick={close} aria-label="Закрыть меню">✕</button>
            <Link to="/" onClick={close}>Главная</Link>
            <Link to="/favorites" onClick={close}>Избранное</Link>
            <Link to="/contacts" onClick={close}>Контакты</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;

import { Link } from 'react-router-dom';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import './Footer.css';
import { STORE, WHATSAPP_URL } from '../config/store.js';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <h3>{STORE.name}</h3>
          {STORE.footerTagline && <p>{STORE.footerTagline}</p>}
        </div>

        <nav className="site-footer__links">
          <Link to="/">Главная</Link>
          <Link to="/favorites">Избранное</Link>
        </nav>

        <div className="site-footer__contacts">
          {STORE.phone.digits && (
            <a href={`tel:+${STORE.phone.digits}`}>{STORE.phone.display}</a>
          )}
          {WHATSAPP_URL && (
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon fontSize="small" />
              WhatsApp
            </a>
          )}
          {STORE.instagram.url && (
            <a href={STORE.instagram.url} target="_blank" rel="noopener noreferrer">
              <InstagramIcon fontSize="small" />
              Instagram
            </a>
          )}
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {year} {STORE.name}. Все права защищены.</p>
      </div>
    </footer>
  );
}

export default Footer;
import { Link } from 'react-router-dom';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import './Footer.css';
import { STORE } from '../constants/store.js';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <h3>{STORE.name}</h3>
          <p>Этно-одежда с характером</p>
        </div>

        <nav className="site-footer__links">
          <Link to="/">Главная</Link>
          <Link to="/favorites">Избранное</Link>
        </nav>

        <div className="site-footer__contacts">
          <a href={STORE.phoneHref}>
            <PhoneIcon fontSize="small" />
            {STORE.phone}
          </a>
          <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon fontSize="small" />
            WhatsApp
          </a>
          <a href={STORE.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramIcon fontSize="small" />
            Instagram
          </a>
          <a href={STORE.map} target="_blank" rel="noopener noreferrer">
            <PlaceIcon fontSize="small" />
            {STORE.address} · 2ГИС
          </a>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {year} {STORE.name}. Все права защищены.</p>
      </div>
    </footer>
  );
}

export default Footer;

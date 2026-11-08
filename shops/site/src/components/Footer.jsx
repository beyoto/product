import { Link } from 'react-router-dom';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useSite } from '../SiteContext.jsx';
import { whatsappUrl } from '../catalog.js';
import './Footer.css';

function Footer() {
  const { name, info } = useSite();
  const whatsapp = whatsappUrl(info);

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <h3>{name}</h3>
          {(info.tagline || info.hours) && <p>{[info.tagline, info.hours].filter(Boolean).join(' · ')}</p>}
        </div>

        <nav className="site-footer__links">
          <Link to="/">Главная</Link>
          <Link to="/favorites">Избранное</Link>
          <Link to="/contacts">Контакты</Link>
        </nav>

        <div className="site-footer__contacts">
          {info.phoneDigits && <a href={`tel:+${info.phoneDigits}`}>{info.phone}</a>}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon fontSize="small" />
              WhatsApp
            </a>
          )}
          {info.instagram && (
            <a href={info.instagram} target="_blank" rel="noopener noreferrer">
              <InstagramIcon fontSize="small" />
              Instagram
            </a>
          )}
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} {name}. Все права защищены.</p>
      </div>
    </footer>
  );
}

export default Footer;

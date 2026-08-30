import { Link } from 'react-router-dom';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <h3>AVELINE</h3>
          <p>Украшения, созданные для тебя</p>
        </div>

        <nav className="site-footer__links">
          <Link to="/">Главная</Link>
          <Link to="/favorites">Избранное</Link>
        </nav>

        <div className="site-footer__contacts">
          <a href="tel:+996707780048">
            <PhoneIcon fontSize="small" />
            +996500778797
          </a>
          <a href="https://wa.me/996500776797" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon fontSize="small" />
            WhatsApp
          </a>
          <a href="https://www.instagram.com/aveline_silver_/" target="_blank" rel="noopener noreferrer">
            <InstagramIcon fontSize="small" />
            Instagram
          </a>
          <a href="https://2gis.kg/bishkek/твоя_ссылка" target="_blank" rel="noopener noreferrer">
            <PlaceIcon fontSize="small" />
            2ГИС
          </a>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {year} AVELINE. Все права защищены.</p>
      </div>
    </footer>
  );
}

export default Footer;
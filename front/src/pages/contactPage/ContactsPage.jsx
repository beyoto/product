import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';

import './ContactsPage.css';
import { useEffect } from 'react';


function ContactsPage() {

  useEffect(() => {
    document.title = 'AVELINE | Магазин украшений';
  }, []);

  return (
    <>
      <div className="home-page">
        <Header />

        <main className="contacts-page__main">
          <div className="contacts-page__intro">

            <h1>Свяжитесь с нами</h1>

            <p>
              Есть вопросы по украшениям, хотите оформить заказ или просто хотите узнать больше?
              <br className="contacts-page__mobile-break" /> Мы всегда на связи.
            </p>
          </div>

          <div className="contacts-page__grid">
            <a
              href="tel:+996707780048"
              className="contact-card"
            >
              <div className="contact-card__icon">
                <PhoneIcon />
              </div>

              <div className="contact-card__content">
                <span className="contact-card__label">
                  Телефон
                </span>

                <h2>+996 500 778 797</h2>

                <p>
                  Позвонить нам
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>

            <a
              href="https://wa.me/996500778797"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card"
            >
              <div className="contact-card__icon">
                <WhatsAppIcon />
              </div>

              <div className="contact-card__content">
                <span className="contact-card__label">
                  WhatsApp
                </span>

                <h2>Написать нам</h2>

                <p>
                  Ответим на ваши вопросы
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>

            <a
              href="https://www.instagram.com/aveline_silver_/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card"
            >
              <div className="contact-card__icon">
                <InstagramIcon />
              </div>

              <div className="contact-card__content">
                <span className="contact-card__label">
                  Instagram
                </span>

                <h2>Наш Instagram</h2>

                <p>
                  Смотрите новинки и украшения
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>

            <a
              href="https://2gis.kg/bishkek/твоя_ссылка"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card"
            >
              <div className="contact-card__icon">
                <PlaceIcon />
              </div>

              <div className="contact-card__content">
                <span className="contact-card__label">
                  2ГИС
                </span>

                <h2>Мы на карте</h2>

                <p>
                  Найдите нас в Бишкеке
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>
          </div>

          <div className="contacts-page__bottom">
            <p>
              Будем рады помочь вам выбрать украшение ✦
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default ContactsPage;
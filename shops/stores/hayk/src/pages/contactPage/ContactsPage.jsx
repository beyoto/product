import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';

import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';

import './ContactsPage.css';
import { useEffect } from 'react';
import { STORE, WHATSAPP_URL } from '../../config/store.js';

function ContactsPage() {

  useEffect(() => {
    document.title = `${STORE.name} | ${STORE.category}`;
  }, []);

  return (
    <>
      <div className="home-page">
        <Header />

        <main className="contacts-page__main">
          <div className="contacts-page__intro">

            <h1>Свяжитесь с нами</h1>

            <p>
              Ищете автомобиль и нужна помощь с выбором?
              <br className="contacts-page__mobile-break" /> Мы всегда на связи.
            </p>
          </div>

          <div className="contacts-page__grid">
            <a
              href={WHATSAPP_URL}
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

                <h2>{STORE.whatsapp.display}</h2>

                <p>
                  Написать нам
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>

            <a
              href={STORE.instagram.url}
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
                  Новости и автомобили
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>

            {[STORE.telegram, STORE.telegramChannel].map(({ label, url }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
              >
                <div className="contact-card__icon">
                  <TelegramIcon />
                </div>

                <div className="contact-card__content">
                  <span className="contact-card__label">Telegram</span>
                  <h2>{label}</h2>
                  <p>{url === STORE.telegram.url ? 'Связаться напрямую' : 'Подписаться на канал'}</p>
                </div>

                <ArrowOutwardIcon className="contact-card__arrow" />
              </a>
            ))}
          </div>

          <div className="contacts-page__bottom">
            <p>
              Будем рады ответить на ваши вопросы и помочь с выбором автомобиля.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default ContactsPage;

import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import PlaceIcon from '@mui/icons-material/Place';
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

            <h1>Контакты</h1>

            <p>
              Информация для связи появится здесь позже.
            </p>
          </div>

          <div className="contacts-page__grid">
            {STORE.phone.digits && <a href={`tel:+${STORE.phone.digits}`} className="contact-card">
              <div className="contact-card__icon">
                <PhoneIcon />
              </div>

              <div className="contact-card__content">
                <span className="contact-card__label">
                  Телефон
                </span>

                <h2>{STORE.phone.display}</h2>

                <p>
                  Позвонить нам
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>}

            {WHATSAPP_URL && <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="contact-card">
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
            </a>}

            {STORE.instagram.url && <a href={STORE.instagram.url} target="_blank" rel="noopener noreferrer" className="contact-card">
              <div className="contact-card__icon">
                <InstagramIcon />
              </div>

              <div className="contact-card__content">
                <span className="contact-card__label">
                  Instagram
                </span>

                <h2>Наш Instagram</h2>

                <p>
                  Новости и фотографии Flowers
                </p>
              </div>

              <ArrowOutwardIcon className="contact-card__arrow" />
            </a>}

            {STORE.stores.map(({ city, address, mapUrl }) => (
              <a
                key={city}
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
              >
                <div className="contact-card__icon">
                  <PlaceIcon />
                </div>

                <div className="contact-card__content">
                  <span className="contact-card__label">2ГИС</span>
                  <h2>{city}</h2>
                  <p>{address}</p>
                </div>

                <ArrowOutwardIcon className="contact-card__arrow" />
              </a>
            ))}
          </div>

          {STORE.phone.digits || WHATSAPP_URL || STORE.instagram.url || STORE.stores.length > 0 ? (
            <div className="contacts-page__bottom">
              <p>Будем рады помочь вам выбрать цветы ✿</p>
            </div>
          ) : null}
        </main>
      </div>
      <Footer />
    </>
  );
}

export default ContactsPage;

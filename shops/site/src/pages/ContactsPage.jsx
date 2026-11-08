import { useEffect } from 'react';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { useSite } from '../SiteContext.jsx';
import { whatsappUrl } from '../catalog.js';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import './HomePage.css';
import './ContactsPage.css';

function ContactCard({ href, icon, label, title, text }) {
  const content = (
    <>
      <div className="contact-card__icon">{icon}</div>
      <div className="contact-card__content">
        <span className="contact-card__label">{label}</span>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {href && <ArrowOutwardIcon className="contact-card__arrow" />}
    </>
  );

  if (!href) return <div className="contact-card">{content}</div>;

  const external = href.startsWith('https://');
  return (
    <a
      href={href}
      className="contact-card"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </a>
  );
}

function ContactsPage() {
  const { name, info } = useSite();
  const whatsapp = whatsappUrl(info);
  const hasContacts = info.phoneDigits || whatsapp || info.instagram || info.hours || info.addresses.length > 0;

  useEffect(() => {
    document.title = `Контакты — ${name}`;
  }, [name]);

  return (
    <>
      <div className="home-page">
        <Header />

        <main className="contacts-page__main">
          <div className="contacts-page__intro">
            <h1>Контакты</h1>
            <p>{info.description || 'Свяжитесь с нами удобным способом.'}</p>
          </div>

          <div className="contacts-page__grid">
            {info.phoneDigits && (
              <ContactCard href={`tel:+${info.phoneDigits}`} icon={<PhoneIcon />} label="Телефон" title={info.phone} text="Позвонить нам" />
            )}
            {whatsapp && (
              <ContactCard href={whatsapp} icon={<WhatsAppIcon />} label="WhatsApp" title="Написать нам" text="Ответим на ваши вопросы" />
            )}
            {info.instagram && (
              <ContactCard href={info.instagram} icon={<InstagramIcon />} label="Instagram" title="Наш Instagram" text="Новости и фото" />
            )}
            {info.hours && (
              <ContactCard icon={<ScheduleIcon />} label="Режим работы" title={info.hours} />
            )}
            {info.addresses.map(({ city, address, mapUrl }) => (
              <ContactCard
                key={`${city}-${address}`}
                href={mapUrl || undefined}
                icon={<PlaceIcon />}
                label="Адрес"
                title={city || address}
                text={city ? address : ''}
              />
            ))}
          </div>

          {!hasContacts && <p className="contacts-page__empty">Контакты скоро появятся.</p>}
        </main>
      </div>
      <Footer />
    </>
  );
}

export default ContactsPage;

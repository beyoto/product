import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../SiteContext.jsx';
import './HeroCarousel.css';

// Тексты слайдов — из типа магазина; первый слайд можно заменить своим в панели.
export default function HeroCarousel({ products = [] }) {
  const { name, info, type } = useSite();
  const slides = type.hero.map((slide, index) => (
    index === 0 && info.heroTitle
      ? { title: info.heroTitle, text: info.heroText || slide.text }
      : slide
  ));
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[active];
  const featured = products.length > 0 ? products[active % products.length] : null;
  const eyebrow = (active === 0 ? name : type.label).toUpperCase();

  return (
    <section className={`hero-carousel hero-carousel--${active}`} aria-label={name}>
      <div className="hero-carousel__glow" />
      <div className="hero-carousel__ring" aria-hidden="true" />
      <div className="hero-carousel__content">
        <span>{eyebrow}</span>
        <h2>
          {slide.title.split('\n').map((line, index) => <span key={index}>{line}<br /></span>)}
        </h2>
        <p>{slide.text}</p>
        {featured ? (
          <Link to={`/product/${featured.id}`} className="hero-carousel__cta">Смотреть <b>→</b></Link>
        ) : (
          <a href="#catalog" className="hero-carousel__cta">В каталог <b>→</b></a>
        )}
      </div>
      <div className="hero-carousel__controls">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={i === active ? 'is-active' : ''}
            aria-label={`Слайд ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

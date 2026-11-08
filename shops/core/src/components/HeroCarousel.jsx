import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';

const slides = [
  { eyebrow: 'CROWN CARAT', title: 'Скажите «да»\nсиянию', text: 'Помолвочные кольца, созданные для самых важных слов.', cta: 'Смотреть коллекцию' },
  { eyebrow: 'ВЫБОР НАВСЕГДА', title: 'Бриллиант\nвашей истории', text: 'Деликатный блеск, выразительный характер, безупречная посадка.', cta: 'Выбрать кольцо' },
  { eyebrow: 'БИШКЕК · ФРУНЗЕ, 587', title: 'Любовь в каждой\nграни', text: 'Поможем найти кольцо, которое будет говорить за вас.', cta: 'В каталог' },
];

export default function HeroCarousel({ products = [] }) {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), 5500); return () => clearInterval(timer); }, []);
  const slide = slides[active];
  const featuredProduct = products[active % products.length];
  const destination = featuredProduct ? `/product/${featuredProduct.id}` : '#catalog';
  return <section className={`hero-carousel hero-carousel--${active}`} aria-label="Коллекция Crown Carat">
    <div className="hero-carousel__glow" /><div className="hero-carousel__ring" aria-hidden="true" />
    <div className="hero-carousel__content"><span>{slide.eyebrow}</span><h2>{slide.title.split('\n').map((line, index) => <span key={index}>{line}<br /></span>)}</h2><p>{featuredProduct ? featuredProduct.name : slide.text}</p><Link to={destination} className="hero-carousel__cta">{featuredProduct ? 'Смотреть кольцо' : slide.cta} <b>→</b></Link></div>
    <div className="hero-carousel__controls">{slides.map((_, i) => <button key={i} onClick={() => setActive(i)} className={i === active ? 'is-active' : ''} aria-label={`Слайд ${i + 1}`} />)}</div>
  </section>;
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { useFavorites } from './FavoritesContext.jsx';
import { useSite } from '../SiteContext.jsx';
import { categoryLabel, formatPrice, productFacts } from '../catalog.js';
import './ProductCard.css';

function ProductCard({ product }) {
  const { info, type } = useSite();
  const images = product.images || [];
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);
  const facts = productFacts(type, product, { cardOnly: true });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return undefined;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card__image-wrap">
        {images.length > 0 ? (
          <div className="product-card__embla" ref={emblaRef}>
            <div className="product-card__embla-container">
              {images.map((src, i) => (
                <div className="product-card__embla-slide" key={src}>
                  <img src={src} alt={`${product.name} ${i + 1}`} className="product-card__image" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="product-card__no-image">Нет фото</div>
        )}

        <button
          className={`product-card__heart ${favorite ? 'product-card__heart--active' : ''}`}
          onClick={(e) => {
            stop(e);
            toggleFavorite(product.id);
          }}
          aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} aria-hidden="true">
            <path
              d="M12 21s-7-4.35-9.5-8.5C0.7 9 2 5 5.5 5c2 0 3.5 1.2 4.5 2.8C11 6.2 12.5 5 14.5 5 18 5 19.3 9 17.5 12.5 15 16.65 12 21 12 21z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        {images.length > 1 && (
          <>
            <button
              className="product-card__arrow product-card__arrow--prev"
              onClick={(e) => {
                stop(e);
                emblaApi?.scrollPrev();
              }}
              aria-label="Предыдущее фото"
            >
              ‹
            </button>
            <button
              className="product-card__arrow product-card__arrow--next"
              onClick={(e) => {
                stop(e);
                emblaApi?.scrollNext();
              }}
              aria-label="Следующее фото"
            >
              ›
            </button>
            <div className="product-card__dots">
              {images.map((src, i) => (
                <button
                  key={src}
                  className={`product-card__dot ${i === selectedIndex ? 'product-card__dot--active' : ''}`}
                  onClick={(e) => {
                    stop(e);
                    emblaApi?.scrollTo(i);
                  }}
                  aria-label={`Фото ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-card__body">
        <span className="product-card__category">{categoryLabel(type, product.category)}</span>
        <h3 className="product-card__name">{product.name}</h3>
        {facts.length > 0 && (
          <p className="product-card__facts">{facts.map((fact) => fact.value).join(' · ')}</p>
        )}
        <p className="product-card__price">{formatPrice(product.price, info.currency)}</p>
      </div>
    </Link>
  );
}

export default ProductCard;

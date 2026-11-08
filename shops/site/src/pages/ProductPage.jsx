import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import api from '../site.js';
import { useSite } from '../SiteContext.jsx';
import { categoryLabel, formatPrice, productFacts, whatsappUrl } from '../catalog.js';
import './ProductPage.css';

function ProductPage() {
  const { id } = useParams();
  const { name: siteName, info, type } = useSite();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [shareModal, setShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const onSelect = useCallback(() => {
    if (emblaApi) setActiveImage(emblaApi.selectedScrollSnap());
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api.get(`/products/${id}`)
      .then((res) => {
        if (!active) return;
        setProduct(res.data);
        setActiveImage(0);
      })
      .catch(() => {
        if (active) setError('Товар не найден');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (product) document.title = `${product.name} — ${siteName}`;
  }, [product, siteName]);

  if (loading) return <p className="page-status">Загрузка...</p>;
  if (error) {
    return (
      <main className="page-status">
        <p>{error}</p>
        <p><Link to="/">← Назад в каталог</Link></p>
      </main>
    );
  }
  if (!product) return null;

  const images = product.images || [];
  const facts = productFacts(type, product);
  const price = formatPrice(product.price, info.currency);
  const productUrl = window.location.href;
  const whatsapp = whatsappUrl(info);
  const whatsappLink = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(`Здравствуйте! Интересует «${product.name}» (${price}).\n\n🔗 ${productUrl}`)}`
    : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `${product.name} — ${price}`, url: productUrl });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Ошибка открытия меню поделиться:', err);
      }
    } else {
      setShareModal(true);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Не удалось скопировать ссылку:', err);
    }
  };

  return (
    <div className="product-page">
      <Link to="/" className="product-page__back">&larr; Назад в каталог</Link>

      <div className="product-page__content">
        <div className="product-page__gallery">
          {images.length > 0 ? (
            <div className="product-page__main-image-wrap">
              <div className="product-page__embla" ref={emblaRef}>
                <div className="product-page__embla-container">
                  {images.map((img, index) => (
                    <div className="product-page__embla-slide" key={img}>
                      <img src={img} alt={`${product.name} ${index + 1}`} className="product-page__main-image" />
                    </div>
                  ))}
                </div>
              </div>

              {images.length > 1 && (
                <div className="product-page__dots">
                  {images.map((img, index) => (
                    <button
                      key={img}
                      className={`product-page__dot ${index === activeImage ? 'product-page__dot--active' : ''}`}
                      onClick={() => emblaApi?.scrollTo(index)}
                      aria-label={`Фото ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="product-page__no-image">Нет фото</div>
          )}
        </div>

        <div className="product-page__info">
          <span className="product-page__category">{categoryLabel(type, product.category)}</span>
          <h1>{product.name}</h1>
          <p className="product-page__price">{price}</p>

          {facts.length > 0 && (
            <dl className="product-page__specs">
              {facts.map((fact) => (
                <div key={fact.key} className="product-page__spec">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.description && <p className="product-page__description">{product.description}</p>}

          <div className="product-page__actions">
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="product-page__contact-btn">
                Написать в WhatsApp
              </a>
            )}
            {!whatsappLink && info.phoneDigits && (
              <a href={`tel:+${info.phoneDigits}`} className="product-page__contact-btn">Позвонить</a>
            )}
            <button type="button" className="product-page__share-btn" onClick={handleShare}>
              <ShareIcon fontSize="small" />
              Поделиться
            </button>
          </div>
        </div>
      </div>

      {shareModal && (
        <div className="share-modal" onClick={() => setShareModal(false)}>
          <div className="share-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="share-modal__close" onClick={() => setShareModal(false)} aria-label="Закрыть">
              <CloseIcon />
            </button>
            <h2>Поделиться</h2>
            <p>Отправьте ссылку на этот товар</p>
            <button className="share-modal__copy" onClick={copyLink}>
              <ContentCopyIcon fontSize="small" />
              {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;

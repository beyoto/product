import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import ProductCard from '../../components/ProductCard.jsx';
import './HomePage.css'
import Header from '../../components/Header.jsx';
import TrustBadges from '../../components/TrustBadges.jsx';
import Footer from '../../components/Footer.jsx';
import { CATEGORIES } from '../../constants/catalog.js';
import { STORE } from '../../config/store.js';
import { API_PATHS } from '../../config/api.js';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `${STORE.name} | ${STORE.category}`;
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    const params = {};
    if (category) params.category = category;
    if (sort) params.sort = sort;

    api
      .get(API_PATHS.products, { params })
      .then((res) => {
        if (!Array.isArray(res.data)) {
          throw new TypeError('API returned an invalid product catalog');
        }
        setProducts(res.data);
      }).catch((err) => {
        console.error('Ошибка загрузки товаров:', err);
        setError('Не удалось загрузить каталог. Проверьте подключение и попробуйте позже.');
      })
      .finally(() => setLoading(false));
  }, [category, sort]);

  return (
    <>
      <div className="home-page">
        <Header />
        {/* <section className="store-hero">
          <div className="store-hero__content">
            <p className="store-hero__eyebrow">ERNIS COSTUMES · БИШКЕК</p>
            <h2>Мужской стиль<br /><span>для важных моментов</span></h2>
            <p className="store-hero__description">
              Мужские костюмы, рубашки и аксессуары — на продажу и напрокат.
            </p>
            <a className="store-hero__button" href="#catalog">Смотреть каталог</a>
          </div>
          <div className="store-hero__seal" aria-hidden="true">
            <span>EC</span>
            <small>МУЖСКАЯ<br />КЛАССИКА</small>
          </div>
        </section> */}
        <TrustBadges />
        <div className="filters" id="catalog">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Все категории</option>
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">По дате (сначала новые)</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : products.length === 0 ? (
          <p>Товары не найдены</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
      <Footer />
    </>
  );
}

export default HomePage;

import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import ProductCard from '../../components/ProductCard.jsx';
import './HomePage.css'
import Header from '../../components/Header.jsx';
import TrustBadges from '../../components/TrustBadges.jsx';
import Footer from '../../components/Footer.jsx';
import { CATEGORIES, CURRENCY } from '../../constants/catalog.js';
import { STORE } from '../../config/store.js';
import { API_PATHS } from '../../config/api.js';
import HeroCarousel from '../../components/HeroCarousel.jsx';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ category: '', price_from: '', price_to: '' });
  const [sort, setSort] = useState('');
  const [loadedRequest, setLoadedRequest] = useState(null);
  const [error, setError] = useState('');
  const requestKey = JSON.stringify({ filters, sort });
  const loading = loadedRequest !== requestKey;

  useEffect(() => {
    document.title = `${STORE.name} | ${STORE.category}`;
  }, []);

  useEffect(() => {
    let active = true;

    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') params[key] = value;
    });
    if (sort) params.sort = sort;

    api
      .get(API_PATHS.products, { params })
      .then((res) => {
        if (!Array.isArray(res.data)) {
          throw new TypeError('API returned an invalid flower catalog');
        }
        if (!active) return;
        setProducts(res.data);
        setError('');
      }).catch((err) => {
        if (!active) return;
        console.error('Ошибка загрузки каталога цветов:', err);
        setError('Не удалось загрузить каталог. Проверьте подключение и попробуйте позже.');
      })
      .finally(() => {
        if (active) setLoadedRequest(requestKey);
      });

    return () => {
      active = false;
    };
  }, [filters, sort, requestKey]);

  const setFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const resetFilters = () => {
    setFilters({ category: '', price_from: '', price_to: '' });
    setSort('');
  };

  return (
    <>
      <div className="home-page">
        <Header />
        <HeroCarousel products={products} />
        <TrustBadges />
        <section className="flower-catalog" id="catalog">
          <div className="flower-catalog__heading">
            <div>
              <span>ЦВЕТЫ И БУКЕТЫ</span>
              <h2>Найдите свой букет</h2>
            </div>
            <button type="button" onClick={resetFilters}>Сбросить фильтры</button>
          </div>

          <div className="flower-catalog__filters">
            <label>
              <span>Вид цветов</span>
              <select name="category" value={filters.category} onChange={setFilter}>
                <option value="">Все цветы</option>
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Цена от</span>
              <input type="number" name="price_from" value={filters.price_from} onChange={setFilter} min="0" placeholder={`От, ${CURRENCY}`} />
            </label>

            <label>
              <span>Цена до</span>
              <input type="number" name="price_to" value={filters.price_to} onChange={setFilter} min="0" placeholder={`До, ${CURRENCY}`} />
            </label>

            <label>
              <span>Сортировка</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="">Сначала новые</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
              </select>
            </label>
          </div>
        </section>

        {loading ? (
          <p>Загрузка...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : products.length === 0 ? (
          <p>Цветы не найдены</p>
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

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
import HeroCarousel from '../../components/HeroCarousel.jsx';
import { VEHICLE_OPTIONS } from '../../constants/vehicle.js';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ category: '', brand: '', fuel: '', transmission: '', drive: '', steering: '', condition: '', year_from: '', year_to: '', price_from: '', price_to: '' });
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = `${STORE.name} | ${STORE.category}`;
  }, []);

  useEffect(() => {
    setLoading(true);

    const params = {};
    Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });
    if (sort) params.sort = sort;

    api
      .get(API_PATHS.products, { params })
      .then((res) => {
        console.log('Ответ API:', res.data);
        setProducts(res.data);
      }).catch((err) => console.error('Ошибка загрузки товаров:', err))
      .finally(() => setLoading(false));
  }, [filters, sort]);

  const setFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const clearFilters = () => setFilters({ category: '', brand: '', fuel: '', transmission: '', drive: '', steering: '', condition: '', year_from: '', year_to: '', price_from: '', price_to: '' });

  return (
    <>
      <div className="home-page">
        <Header />
        {/* <HeroCarousel products={products} /> */}
        <TrustBadges />
        <section className="car-filters" id="catalog">
          <div className="car-filters__heading"><div><span>БЫСТРЫЙ ПОИСК</span><h2>Подобрать автомобиль</h2></div><div><button type="button" onClick={clearFilters}>Сбросить</button><button type="button" className="car-filters__toggle" onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? 'Скрыть параметры' : 'Все параметры'}</button></div></div>
          <div className="car-filters__grid">
          <select name="category" value={filters.category} onChange={setFilter}>
            <option value="">Любой кузов</option>
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input name="brand" value={filters.brand} onChange={setFilter} placeholder="Марка: Toyota, BMW..." />
          <input type="number" name="year_from" value={filters.year_from} onChange={setFilter} placeholder="Год от" />
          <input type="number" name="year_to" value={filters.year_to} onChange={setFilter} placeholder="Год до" />
          <input type="number" name="price_from" value={filters.price_from} onChange={setFilter} placeholder="Цена от, сом" />
          <input type="number" name="price_to" value={filters.price_to} onChange={setFilter} placeholder="Цена до, сом" />
          {filtersOpen && ['fuel', 'transmission', 'drive', 'steering', 'condition'].map((field) => <select name={field} value={filters[field]} onChange={setFilter} key={field}><option value="">{{ fuel: 'Любое топливо', transmission: 'Любая коробка', drive: 'Любой привод', steering: 'Любой руль', condition: 'Любое состояние' }[field]}</option>{VEHICLE_OPTIONS[field].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>)}

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">По дате (сначала новые)</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
          </div>
          <div className="car-filters__scroll-hint" aria-hidden="true">
            <span className="car-filters__scroll-arrows">
              <i />
              <i />
            </span>
            <span>Прокрутите вниз</span>
          </div>
        </section>

        {loading ? (
          <p>Загрузка...</p>
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

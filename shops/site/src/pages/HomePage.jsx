import { useEffect, useMemo, useState } from 'react';
import api from '../site.js';
import { useSite } from '../SiteContext.jsx';
import Header from '../components/Header.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Footer from '../components/Footer.jsx';
import './HomePage.css';

function HomePage() {
  const { name, info, type } = useSite();
  const filterFields = useMemo(() => type.fields.filter((field) => field.filter), [type]);
  const emptyFilters = useMemo(() => ({
    category: '',
    price_from: '',
    price_to: '',
    ...Object.fromEntries(filterFields.map((field) => [`attr.${field.key}`, ''])),
  }), [filterFields]);

  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadedRequest, setLoadedRequest] = useState(null);
  const [error, setError] = useState('');
  const requestKey = JSON.stringify({ filters, sort });
  const loading = loadedRequest !== requestKey;

  useEffect(() => {
    document.title = info.seoTitle || (info.tagline ? `${name} — ${info.tagline}` : name);
  }, [name, info.seoTitle, info.tagline]);

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    if (sort) params.sort = sort;

    api.get('/products', { params })
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        console.error('Ошибка загрузки каталога:', err);
        setError('Не удалось загрузить каталог. Проверьте подключение и попробуйте позже.');
      })
      .finally(() => {
        if (active) setLoadedRequest(requestKey);
      });

    return () => {
      active = false;
    };
  }, [filters, sort, requestKey]);

  const setFilter = (e) => setFilters((current) => ({ ...current, [e.target.name]: e.target.value }));

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSort('');
  };

  return (
    <>
      <div className="home-page">
        <Header />
        <TrustBadges />

        <section className={`catalog-panel${filtersOpen ? ' catalog-panel--open' : ''}`} id="catalog">
          <div className="catalog-panel__heading">
            <div>
              <span>{type.label.toUpperCase()}</span>
              <h2>{type.catalogTitle}</h2>
            </div>
            <div className="catalog-panel__buttons">
              <button
                type="button"
                className="catalog-panel__toggle"
                aria-expanded={filtersOpen}
                aria-controls="catalog-filters"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                {filtersOpen ? 'Скрыть фильтры' : 'Фильтры'}
              </button>
              <button type="button" onClick={resetFilters}>Сбросить</button>
            </div>
          </div>

          <div className="catalog-panel__filters" id="catalog-filters">
            <label>
              <span>Категория</span>
              <select name="category" value={filters.category} onChange={setFilter}>
                <option value="">Все</option>
                {type.categories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            {filterFields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <select name={`attr.${field.key}`} value={filters[`attr.${field.key}`]} onChange={setFilter}>
                  <option value="">Любой</option>
                  {field.options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            ))}

            <label>
              <span>Цена от</span>
              <input type="number" name="price_from" value={filters.price_from} onChange={setFilter} min="0" placeholder={`От, ${info.currency}`} />
            </label>

            <label>
              <span>Цена до</span>
              <input type="number" name="price_to" value={filters.price_to} onChange={setFilter} min="0" placeholder={`До, ${info.currency}`} />
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
          <p>Ничего не найдено</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default HomePage;

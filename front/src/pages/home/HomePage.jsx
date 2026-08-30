import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import ProductCard from '../../components/ProductCard.jsx';
import './HomePage.css'
import Header from '../../components/Header.jsx';
import TrustBadges from '../../components/TrustBadges.jsx';
import Footer from '../../components/Footer.jsx';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const params = {};
    if (category) params.category = category;
    if (sort) params.sort = sort;

    api
      .get('/products', { params })
      .then((res) => setProducts(res.data))
      .catch((err) => console.error('Ошибка загрузки товаров:', err))
      .finally(() => setLoading(false));
  }, [category, sort]);

  return (
    <>
      <div className="home-page">
        <Header />
        <TrustBadges />
        <div className="filters">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Все категории</option>
            <option value="ring">Кольца</option>
            <option value="bracelet">Браслеты</option>
            <option value="chain">Цепочки</option>
            <option value="set">Наборы</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">По дате (сначала новые)</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>

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
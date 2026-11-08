import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../site.js';
import { useSite } from '../SiteContext.jsx';
import { useFavorites } from '../components/FavoritesContext.jsx';
import Header from '../components/Header.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Footer from '../components/Footer.jsx';
import './HomePage.css';

function FavoritesPage() {
  const { name } = useSite();
  const { favorites, syncFavorites } = useFavorites();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Избранное — ${name}`;
  }, [name]);

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        setProducts(res.data);
        syncFavorites(res.data);
      })
      .catch((err) => console.error('Ошибка загрузки товаров:', err))
      .finally(() => setLoading(false));
  }, [syncFavorites]);

  const favoriteProducts = products.filter((product) => favorites.includes(product.id));

  return (
    <>
      <div className="home-page">
        <Header />
        <h2 className="home-page__title">Избранное</h2>

        {loading ? (
          <p>Загрузка...</p>
        ) : favoriteProducts.length === 0 ? (
          <p>Пока пусто. <Link className="home-page__link" to="/">Перейти в каталог</Link></p>
        ) : (
          <div className="products-grid">
            {favoriteProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default FavoritesPage;

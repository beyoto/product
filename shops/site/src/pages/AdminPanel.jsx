import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LogoutIcon from '@mui/icons-material/Logout';
import api, { errorText } from '../site.js';
import { useSite } from '../SiteContext.jsx';
import { useAuth } from '../components/AuthContext.jsx';
import { categoryLabel, formatPrice } from '../catalog.js';
import './AdminPanel.css';

function AdminPanel() {
  const { name, info, type } = useSite();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data);
      setError('');
    } catch (err) {
      setError(errorText(err, 'Не удалось загрузить товары'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = `Админка — ${name}`;
  }, [name]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const run = async (request, failMessage) => {
    try {
      await request();
      await loadProducts();
    } catch (err) {
      alert(errorText(err, failMessage));
    }
  };

  const toggleActive = (product) => run(
    () => api.put(`/products/${product.id}`, { is_active: !product.is_active }),
    'Не удалось изменить статус товара'
  );

  const deleteProduct = (product) => {
    if (!window.confirm(`Точно удалить «${product.name}»? Это необратимо.`)) return;
    run(() => api.delete(`/products/${product.id}`), 'Не удалось удалить товар');
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>{name}: товары</h1>
        <button className="admin-panel__logout" onClick={handleLogout}>
          <LogoutIcon fontSize="small" />
          Выйти
        </button>
        <button onClick={() => navigate('/admin/analytics')}>Аналитика</button>
        <Link to="/" className="admin-panel__site-link">Открыть сайт</Link>
      </div>

      <button className="admin-panel__add-btn" onClick={() => navigate('/admin/add')}>
        <AddIcon fontSize="small" />
        Добавить товар
      </button>

      {loading && <p className="admin-panel__status">Загрузка...</p>}
      {error && <p className="admin-panel__status admin-panel__status--error">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="admin-panel__status">Товаров пока нет. Нажми «Добавить товар».</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="admin-list">
          <div className="admin-list__header">
            <span>Фото</span>
            <span>Товар</span>
            <span>Цена</span>
            <span>Статус</span>
            <span>Действия</span>
          </div>

          {products.map((product) => (
            <div className="admin-list__row" key={product.id}>
              <div className="admin-list__photo">
                {product.images.length > 0
                  ? <img src={product.images[0]} alt={product.name} />
                  : <div className="admin-list__no-photo">Нет фото</div>}
              </div>

              <div className="admin-list__info">
                <span className="admin-list__category">{categoryLabel(type, product.category)}</span>
                <span className="admin-list__name">{product.name}</span>
              </div>

              <div className="admin-list__price">{formatPrice(product.price, info.currency)}</div>

              <div className="admin-list__status">
                <span className={`admin-list__badge ${product.is_active ? 'admin-list__badge--active' : 'admin-list__badge--hidden'}`}>
                  {product.is_active ? 'Активен' : 'Скрыт'}
                </span>
              </div>

              <div className="admin-list__actions">
                <button className="admin-list__action-btn" onClick={() => navigate(`/admin/edit/${product.id}`)} aria-label="Редактировать">
                  <EditIcon fontSize="small" />
                </button>
                <button className="admin-list__action-btn" onClick={() => toggleActive(product)} aria-label={product.is_active ? 'Скрыть' : 'Показать'}>
                  {product.is_active ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </button>
                <button className="admin-list__action-btn admin-list__action-btn--danger" onClick={() => deleteProduct(product)} aria-label="Удалить">
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

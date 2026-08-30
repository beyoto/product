import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './AddProduct.css';

function AddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'ring',
  });

  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const newSelected = Array.from(e.target.files);
    const combined = [...files, ...newSelected].slice(0, 5); // не больше 5 суммарно
    setFiles(combined);

    const newPreviews = combined.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.price) {
      setError('Название и цена обязательны');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Создаём товар
      const productRes = await api.post('/products', {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
      });

      const newProductId = productRes.data.id;

      // 2. Загружаем изображения
      if (files.length > 0) {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append('images', file);
        });

        await api.post(
          `/products/${newProductId}/images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError(
        'Не удалось создать товар. Проверь данные и попробуй снова.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-product">
      <div className="add-product__header">
        <div>

          <h1 className="add-product__title">
            Добавить товар
          </h1>

          <p className="add-product__subtitle">
            Создай новую позицию в каталоге магазина
          </p>
        </div>

        <button
          type="button"
          className="add-product__back"
          onClick={() => navigate('/admin')}
        >
          ← Назад
        </button>
      </div>

      <form
        className="add-product__form"
        onSubmit={handleSubmit}
      >
        {/* Основная информация */}
        <section className="add-product__section">
          <div className="add-product__section-header">
            <div>
              <h2>Основная информация</h2>
              <p>Название, описание, цена и категория товара</p>
            </div>
          </div>

          <div className="add-product__fields">
            <label className="add-product__field add-product__field--full">
              <span>
                Название <b>*</b>
              </span>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Например, Золотое кольцо"
                required
              />
            </label>

            <label className="add-product__field add-product__field--full">
              <span>Описание</span>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Расскажи о товаре..."
                rows="5"
              />
            </label>

            <label className="add-product__field">
              <span>
                Цена <b>*</b>
              </span>

              <div className="add-product__input-with-suffix">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />

                <span>сом</span>
              </div>
            </label>

            <label className="add-product__field">
              <span>Категория</span>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="ring">Кольцо</option>
                <option value="bracelet">Браслет</option>
                <option value="chain">Цепочка</option>
                <option value="set">Набор</option>
              </select>
            </label>
          </div>
        </section>

        {/* Фотографии */}
        <section className="add-product__section">
          <div className="add-product__section-header">
            <div>
              <h2>Фотографии</h2>
              <p>
                Добавь до 5 изображений товара
              </p>
            </div>

            <span className="add-product__counter">
              {files.length} / 5
            </span>
          </div>

          <label className="add-product__upload">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
            />

            <div className="add-product__upload-icon">
              +
            </div>

            <strong>
              Добавить фотографии
            </strong>

            <span>
              JPEG, PNG или WEBP · до 5 МБ на файл
            </span>
          </label>

          {files.length > 0 && (
            <div className="add-product__files">
              {files.map((file, index) => (
                <div
                  className="add-product__file"
                  key={`${file.name}-${index}`}
                >
                  <div className="add-product__file-info">
                    <div className="add-product__file-icon">
                      {previews[index] && (
                        <img src={previews[index]} alt={file.name} />
                      )}
                    </div>
                    <div>
                      <strong>{file.name}</strong>

                      <span>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Удалить ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="add-product__error">
            {error}
          </div>
        )}

        {/* Кнопки */}
        <div className="add-product__actions">
          <button
            type="button"
            className="add-product__cancel"
            onClick={() => navigate('/admin')}
            disabled={submitting}
          >
            Отмена
          </button>

          <button
            type="submit"
            className="add-product__submit"
            disabled={submitting}
          >
            {submitting
              ? 'Сохраняем...'
              : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;